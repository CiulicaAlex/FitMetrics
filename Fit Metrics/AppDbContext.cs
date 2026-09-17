using Fit_Metrics.Models;
using Fit_Metrics.Services;
using Microsoft.EntityFrameworkCore;

namespace Fit_Metrics
{
  public class AppDbContext : DbContext
  {
    private readonly ICurrentUserService? _currentUserService;

    public AppDbContext(
      DbContextOptions<AppDbContext> options,
      ICurrentUserService? currentUserService = null)
        : base(options)
    {
      _currentUserService = currentUserService;
    }

    public int? CurrentUserId => _currentUserService?.UserId;
    public bool SuppressRls { get; set; } = false;

    public IDisposable BypassRls()
    {
      SuppressRls = true;
      return new RlsBypassScope(this);
    }

    private sealed class RlsBypassScope : IDisposable
    {
      private readonly AppDbContext _context;
      public RlsBypassScope(AppDbContext context) => _context = context;
      public void Dispose() => _context.SuppressRls = false;
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<Workout> Workouts => Set<Workout>();
    public DbSet<WorkoutLog> WorkoutLogs => Set<WorkoutLog>();
    public DbSet<UserMuscleProgress> UserMuscleProgresses => Set<UserMuscleProgress>();
    public DbSet<ActionConfirmationToken> ActionConfirmationTokens => Set<ActionConfirmationToken>();
    public DbSet<RunSession> RunSessions => Set<RunSession>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
      base.OnModelCreating(modelBuilder);

      // Row-Level Security: Global Read Query Filters
      modelBuilder.Entity<Workout>()
        .HasQueryFilter(e => SuppressRls || CurrentUserId == null || e.UserId == CurrentUserId);

      modelBuilder.Entity<WorkoutLog>()
        .HasQueryFilter(e => SuppressRls || CurrentUserId == null || e.UserId == CurrentUserId);

      modelBuilder.Entity<UserMuscleProgress>()
        .HasQueryFilter(e => SuppressRls || CurrentUserId == null || e.UserId == CurrentUserId);

      modelBuilder.Entity<RunSession>()
        .HasQueryFilter(e => SuppressRls || CurrentUserId == null || e.UserId == CurrentUserId);

      modelBuilder.Entity<ActionConfirmationToken>()
        .HasQueryFilter(e => SuppressRls || CurrentUserId == null || e.UserId == CurrentUserId);
    }

    public override int SaveChanges()
    {
      EnforceRowLevelSecurityPolicies();
      return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
      EnforceRowLevelSecurityPolicies();
      return base.SaveChangesAsync(cancellationToken);
    }

    private void EnforceRowLevelSecurityPolicies()
    {
      if (SuppressRls) return;

      var currentUserId = CurrentUserId;
      if (currentUserId == null) return;

      var entries = ChangeTracker.Entries<IUserOwnedEntity>().ToList();
      foreach (var entry in entries)
      {
        if (entry.State == EntityState.Added)
        {
          if (entry.Entity.UserId == 0)
          {
            entry.Entity.UserId = currentUserId.Value;
          }
          else if (entry.Entity.UserId != currentUserId.Value)
          {
            throw new UnauthorizedAccessException("Row-Level Security violation: cannot create records for another user.");
          }
        }
        else if (entry.State == EntityState.Modified)
        {
          if (entry.Entity.UserId != currentUserId.Value)
          {
            throw new UnauthorizedAccessException("Row-Level Security violation: cannot modify records belonging to another user.");
          }
          entry.Property(e => e.UserId).IsModified = false;
        }
        else if (entry.State == EntityState.Deleted)
        {
          if (entry.Entity.UserId != currentUserId.Value)
          {
            throw new UnauthorizedAccessException("Row-Level Security violation: cannot delete records belonging to another user.");
          }
        }
      }
    }
  }
}
