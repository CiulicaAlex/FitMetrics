namespace Fit_Metrics.Models
{
  public class WorkoutLog
  {
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int ExerciseId { get; set; }
    public Exercise Exercise { get; set; }
    public int Sets { get; set; }
    public int Reps { get; set; }
    public double WeightUsed { get; set; }
    public int XpEarned { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
  }
}
