namespace Fit_Metrics.DTOs
{
  public class LogWorkoutDto
  {
    public int UserId { get; set; }
    public int ExerciseId { get; set; }
    public int Sets { get; set; }
    public int Reps { get; set; }
    public double WeightUsed { get; set; }
  }
}
