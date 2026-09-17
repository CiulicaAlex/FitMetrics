namespace Fit_Metrics.Models
{
  public class ActionConfirmationToken : IUserOwnedEntity
  {
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty; // "RESET_PROGRESS" or "DELETE_ACCOUNT"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddMinutes(30);
    public bool IsUsed { get; set; } = false;

    // Navigation property
    public User? User { get; set; }
  }
}
