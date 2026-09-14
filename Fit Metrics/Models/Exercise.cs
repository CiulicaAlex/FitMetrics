using System.Reflection.Metadata.Ecma335;

namespace Fit_Metrics.Models
{
  public class Exercise
  {
    public int Id { get; set; }
    public string Name { get; set; } = String.Empty;
    public string MuscleGroup { get; set; } = String.Empty;
    public string VideoUrl { get; set; } = String.Empty;
  }
}
