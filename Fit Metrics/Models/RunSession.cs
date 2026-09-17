using System;

namespace Fit_Metrics.Models
{
  public class RunSession : IUserOwnedEntity
  {
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string Mode { get; set; } = "Running";
    public double DistanceKm { get; set; }
    public int DurationSeconds { get; set; }
    public double CaloriesBurned { get; set; }
    public double AvgSpeedKmh { get; set; }
    public string AvgPace { get; set; } = "0:00";
    public string? RouteCoordinatesJson { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
  }
}
