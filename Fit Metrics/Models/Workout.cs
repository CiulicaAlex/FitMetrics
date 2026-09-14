namespace Fit_Metrics.Models
{
  public class Workout
  {
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int UserId { get; set; }
    public List<string> MuscleGroups { get; set; } = new();
    public List<string> Exercises { get; set; } = new();
  }
}
