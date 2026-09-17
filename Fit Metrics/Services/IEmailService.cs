namespace Fit_Metrics.Services
{
  public interface IEmailService
  {
    Task<bool> SendActionConfirmationEmailAsync(string recipientEmail, string recipientName, string actionType, string confirmationUrl);
    Task<bool> SendPasswordResetEmailAsync(string recipientEmail, string recipientName, string resetUrl);
  }
}
