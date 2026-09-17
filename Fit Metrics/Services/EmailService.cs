using System.Net;
using System.Net.Mail;

namespace Fit_Metrics.Services
{
  public class EmailService : IEmailService
  {
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
      _config = config;
      _logger = logger;
    }

    public async Task<bool> SendActionConfirmationEmailAsync(string recipientEmail, string recipientName, string actionType, string confirmationUrl)
    {
      var host = _config["EmailSettings:SmtpHost"] ?? "smtp.gmail.com";
      var port = int.TryParse(_config["EmailSettings:SmtpPort"], out int p) ? p : 587;
      var enableSsl = bool.TryParse(_config["EmailSettings:EnableSsl"], out bool ssl) ? ssl : true;
      var senderEmail = _config["EmailSettings:SenderEmail"]?.Trim() ?? "";
      var senderPassword = _config["EmailSettings:SenderPassword"]?.Trim() ?? "";
      var senderDisplayName = _config["EmailSettings:SenderDisplayName"] ?? "FitMetrics Security";

      var isDelete = actionType.Equals("DELETE_ACCOUNT", StringComparison.OrdinalIgnoreCase);
      var actionTitle = isDelete ? "Delete FitMetrics Account" : "Reset Muscle Progress to 0";
      var actionWarning = isDelete
        ? "Warning: Confirming this action will permanently erase your FitMetrics account, all workout history, custom routines, and muscle progression. This action is IRREVERSIBLE."
        : "Warning: Confirming this action will permanently reset all your muscle group XP and workout history logs to 0. This action cannot be undone.";

      var buttonText = isDelete ? "Confirm Permanent Account Deletion" : "Confirm Progress Reset";
      var buttonColor = isDelete ? "#ff3b30" : "#ff9500";

      // If SMTP credentials are not yet set up, run in Development Simulation Mode
      if (string.IsNullOrWhiteSpace(senderEmail) || string.IsNullOrWhiteSpace(senderPassword))
      {
        var simMessage = $"========================================================================\n" +
                         $"[FITMETRICS DEV EMAIL SIMULATION]\n" +
                         $"To: {recipientEmail} ({recipientName})\n" +
                         $"Subject: FitMetrics Security: {actionTitle}\n" +
                         $"Action: {actionType}\n" +
                         $"Confirmation URL: {confirmationUrl}\n" +
                         $"Valid For: 30 minutes\n" +
                         $"========================================================================";
        Console.WriteLine(simMessage);
        _logger.LogInformation(simMessage);
        return true;
      }

      try
      {
        var htmlBody = $@"
<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""UTF-8"" />
  <title>{actionTitle}</title>
</head>
<body style=""margin: 0; padding: 30px 15px; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;"">
  <div style=""max-width: 520px; margin: 0 auto; background-color: #161618; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 24px; padding: 36px 28px; box-shadow: 0 20px 50px rgba(0,0,0,0.8);"">
    <div style=""text-align: center; margin-bottom: 24px;"">
      <div style=""font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #8e8e93; margin-bottom: 6px;"">
        FITMETRICS SECURITY VERIFICATION
      </div>
      <h1 style=""font-size: 24px; font-weight: 900; margin: 0; color: #ffffff; letter-spacing: -0.5px;"">
        {actionTitle}
      </h1>
    </div>

    <p style=""font-size: 14px; line-height: 1.6; color: #aeaeb2; margin: 0 0 16px;"">
      Hello <strong style=""color: #ffffff;"">{WebUtility.HtmlEncode(recipientName)}</strong>,
    </p>

    <p style=""font-size: 14px; line-height: 1.6; color: #aeaeb2; margin: 0 0 20px;"">
      We received a request to perform a critical action on your FitMetrics account associated with <strong style=""color: #ffffff;"">{WebUtility.HtmlEncode(recipientEmail)}</strong>.
    </p>

    <div style=""background-color: rgba(255, 59, 48, 0.1); border-left: 3px solid {buttonColor}; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;"">
      <p style=""font-size: 13px; line-height: 1.5; color: #ff6961; margin: 0; font-weight: 600;"">
        {actionWarning}
      </p>
    </div>

    <div style=""text-align: center; margin: 30px 0 26px;"">
      <a href=""{confirmationUrl}"" style=""display: inline-block; background-color: {buttonColor}; color: #ffffff; font-weight: 800; font-size: 15px; text-decoration: none; padding: 15px 32px; border-radius: 9999px; box-shadow: 0 6px 20px rgba(0,0,0,0.4);"">
        {buttonText}
      </a>
    </div>

    <p style=""font-size: 12px; line-height: 1.5; color: #8e8e93; text-align: center; margin: 0 0 16px;"">
      This link is valid for <strong>30 minutes</strong>. If you did not make this request, you can safely disregard this email. Your data remains completely secure.
    </p>

    <div style=""border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 18px; margin-top: 24px; text-align: center;"">
      <p style=""font-size: 11px; color: #636366; margin: 0;"">
        FitMetrics Security • Automated Protection System
      </p>
    </div>
  </div>
</body>
</html>";

        using var client = new SmtpClient(host, port)
        {
          Credentials = new NetworkCredential(senderEmail, senderPassword),
          EnableSsl = enableSsl
        };

        using var mail = new MailMessage
        {
          From = new MailAddress(senderEmail, senderDisplayName),
          Subject = $"FitMetrics Security: {actionTitle}",
          Body = htmlBody,
          IsBodyHtml = true
        };

        mail.To.Add(recipientEmail);

        await client.SendMailAsync(mail);
        _logger.LogInformation("Confirmation email successfully dispatched to {Email} for {Action}", recipientEmail, actionType);
        return true;
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to send confirmation email to {Email}", recipientEmail);
        return false;
      }
    }

    public async Task<bool> SendPasswordResetEmailAsync(string recipientEmail, string recipientName, string resetUrl)
    {
      var host = _config["EmailSettings:SmtpHost"] ?? "smtp.gmail.com";
      var port = int.TryParse(_config["EmailSettings:SmtpPort"], out int p) ? p : 587;
      var enableSsl = bool.TryParse(_config["EmailSettings:EnableSsl"], out bool ssl) ? ssl : true;
      var senderEmail = _config["EmailSettings:SenderEmail"]?.Trim() ?? "";
      var senderPassword = _config["EmailSettings:SenderPassword"]?.Trim() ?? "";
      var senderDisplayName = _config["EmailSettings:SenderDisplayName"] ?? "FitMetrics Security";

      // If SMTP credentials are not yet set up, run in Development Simulation Mode
      if (string.IsNullOrWhiteSpace(senderEmail) || string.IsNullOrWhiteSpace(senderPassword))
      {
        var simMessage = $"========================================================================\n" +
                         $"[FITMETRICS DEV EMAIL SIMULATION - PASSWORD RESET]\n" +
                         $"To: {recipientEmail} ({recipientName})\n" +
                         $"Subject: FitMetrics Security: Reset Account Password\n" +
                         $"Reset URL: {resetUrl}\n" +
                         $"Valid For: 30 minutes\n" +
                         $"========================================================================";
        Console.WriteLine(simMessage);
        _logger.LogInformation(simMessage);
        return true;
      }

      try
      {
        var htmlBody = $@"
<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""UTF-8"" />
  <title>Reset FitMetrics Password</title>
</head>
<body style=""margin: 0; padding: 30px 15px; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;"">
  <div style=""max-width: 520px; margin: 0 auto; background-color: #161618; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 24px; padding: 36px 28px; box-shadow: 0 20px 50px rgba(0,0,0,0.8);"">
    <div style=""text-align: center; margin-bottom: 24px;"">
      <div style=""font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #8e8e93; margin-bottom: 6px;"">
        FITMETRICS SECURITY
      </div>
      <h1 style=""font-size: 24px; font-weight: 900; margin: 0; color: #ffffff; letter-spacing: -0.5px;"">
        Reset Account Password
      </h1>
    </div>

    <p style=""font-size: 14px; line-height: 1.6; color: #aeaeb2; margin: 0 0 16px;"">
      Hello <strong style=""color: #ffffff;"">{WebUtility.HtmlEncode(recipientName)}</strong>,
    </p>

    <p style=""font-size: 14px; line-height: 1.6; color: #aeaeb2; margin: 0 0 20px;"">
      We received a request to reset the password for your FitMetrics account associated with <strong style=""color: #ffffff;"">{WebUtility.HtmlEncode(recipientEmail)}</strong>.
    </p>

    <div style=""text-align: center; margin: 30px 0 26px;"">
      <a href=""{resetUrl}"" style=""display: inline-block; background-color: #007aff; color: #ffffff; font-weight: 800; font-size: 15px; text-decoration: none; padding: 15px 36px; border-radius: 9999px; box-shadow: 0 6px 20px rgba(0, 122, 255, 0.4);"">
        Change Password Now
      </a>
    </div>

    <p style=""font-size: 12px; line-height: 1.5; color: #8e8e93; text-align: center; margin: 0 0 16px;"">
      This link is valid for <strong>30 minutes</strong>. If you did not make this request, you can safely disregard this email. Your current password remains secure.
    </p>

    <div style=""border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 18px; margin-top: 24px; text-align: center;"">
      <p style=""font-size: 11px; color: #636366; margin: 0;"">
        FitMetrics Security • Automated Protection System
      </p>
    </div>
  </div>
</body>
</html>";

        using var client = new SmtpClient(host, port)
        {
          Credentials = new NetworkCredential(senderEmail, senderPassword),
          EnableSsl = enableSsl
        };

        using var mail = new MailMessage
        {
          From = new MailAddress(senderEmail, senderDisplayName),
          Subject = "FitMetrics Security: Reset Account Password",
          Body = htmlBody,
          IsBodyHtml = true
        };

        mail.To.Add(recipientEmail);

        await client.SendMailAsync(mail);
        _logger.LogInformation("Password reset email successfully dispatched to {Email}", recipientEmail);
        return true;
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to send password reset email to {Email}", recipientEmail);
        return false;
      }
    }
  }
}
