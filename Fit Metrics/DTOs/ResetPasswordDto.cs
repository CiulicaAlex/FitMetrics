namespace Fit_Metrics.DTOs
{
  public class ResetPasswordDto
  {
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
  }
}
