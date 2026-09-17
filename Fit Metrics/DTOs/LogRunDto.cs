namespace Fit_Metrics.DTOs
{
  public class LogRunDto
  {
    public int UserId { get; set; }
    public string Mode { get; set; } = "Running";
    public double DistanceKm { get; set; }
    public int DurationSeconds { get; set; }
    public double CaloriesBurned { get; set; }
    public double AvgSpeedKmh { get; set; }
    public string AvgPace { get; set; } = "0:00";
    public string? RouteCoordinatesJson { get; set; }
  }
}
