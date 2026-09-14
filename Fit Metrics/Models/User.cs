namespace Fit_Metrics.Models
{
  public class User
  {
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public double? Weight { get; set; }
    public double? Height { get; set; }
   public string FullName { get; set; } = string.Empty;
   public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<Exercise> Exercises { get; set; } = new List<Exercise>();
    public List<WorkoutLog> WorkoutLogs { get; set; } = new List<WorkoutLog>();
    public List<UserMuscleProgress> UserMuscleProgresses { get; set; } = new List<UserMuscleProgress>();
  }
}
