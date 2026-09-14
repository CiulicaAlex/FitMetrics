using Fit_Metrics.Models;
using Microsoft.EntityFrameworkCore;

namespace Fit_Metrics
{
  public class AppDbContext : DbContext
  {
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }
    public DbSet<User> Users => Set<User>();
    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<Workout> Workouts => Set<Workout>();
    public DbSet<WorkoutLog> WorkoutLogs => Set<WorkoutLog>();
    public DbSet<UserMuscleProgress> UserMuscleProgresses => Set<UserMuscleProgress>();
  }
}
