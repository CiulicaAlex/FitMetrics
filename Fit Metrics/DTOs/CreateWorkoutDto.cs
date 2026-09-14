namespace Fit_Metrics.DTOs
{
  public class CreateWorkoutDto
  {
    public string Name { get; set; } = string.Empty;
    public List<string> MuscleGroups { get; set; } = new();
    public List<string> Exercises { get; set; } = new();
  }
}
