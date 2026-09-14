using System.Reflection.Metadata.Ecma335;

namespace Fit_Metrics.Models
{
  public class UserMuscleProgress
  {
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string MuscleGroup { get; set; } = string.Empty;
    public int Xp { get; set; } = 0;
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
  }
}
