using Fit_Metrics;
using Fit_Metrics.Models;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.Sqlite;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

var dataProtectionPath = Path.Combine(builder.Environment.ContentRootPath, "data", "keys");
Directory.CreateDirectory(dataProtectionPath);
builder.Services.AddDataProtection()
  .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionPath))
  .SetApplicationName("FitMetrics");

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<Fit_Metrics.Services.ICurrentUserService, Fit_Metrics.Services.CurrentUserService>();
builder.Services.AddScoped<Fit_Metrics.Services.IEmailService, Fit_Metrics.Services.EmailService>();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
  ?? "Data Source=data/fitmetrics.db";
var useSqlite = builder.Configuration.GetValue("Database:Provider", "Sqlite")
  .Equals("Sqlite", StringComparison.OrdinalIgnoreCase);

if (useSqlite)
{
  var sqlitePath = connectionString
    .Replace("Data Source=", string.Empty, StringComparison.OrdinalIgnoreCase)
    .Trim();
  if (!Path.IsPathRooted(sqlitePath))
  {
    sqlitePath = Path.Combine(builder.Environment.ContentRootPath, sqlitePath);
  }

  var sqliteDirectory = Path.GetDirectoryName(sqlitePath);
  if (!string.IsNullOrWhiteSpace(sqliteDirectory))
  {
    Directory.CreateDirectory(sqliteDirectory);
  }

  builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite(connectionString));
}
else
{
  builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connectionString));
}

var configuredOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
  options.AddPolicy("AllowAll", policy =>
  {
    var origins = configuredOrigins
      .Append("http://localhost:5173")
      .Append("http://localhost:8081")
      .Append("http://localhost:19006")
      .Distinct(StringComparer.OrdinalIgnoreCase)
      .ToArray();

    policy.WithOrigins(origins).AllowAnyMethod().AllowAnyHeader().AllowCredentials();
  });
});
builder.Services.AddRateLimiter(options =>
{
  options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
  options.AddPolicy("AuthLimiter", httpContext =>
    RateLimitPartition.GetFixedWindowLimiter(
      partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
      factory: _ => new FixedWindowRateLimiterOptions
      {
        PermitLimit = 5,
        Window = TimeSpan.FromMinutes(1),
        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
        QueueLimit = 0
      }));
});

builder.Services.AddAuthentication("CookieAuth")
    .AddCookie("CookieAuth", options =>
    {
      options.Cookie.Name = "FitMetricsAuthCookie";
      options.Cookie.HttpOnly = true;
      options.Cookie.SameSite = SameSiteMode.Lax;
      options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
      options.Events.OnRedirectToLogin = context =>
      {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
      };
      options.Events.OnRedirectToAccessDenied = context =>
      {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
      };
    });
var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
  var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
  if (useSqlite)
  {
    database.Database.EnsureCreated();

    // EnsureCreated does not alter an existing SQLite database when the model
    // gains a new field, so add Gender safely for databases created earlier.
    try
    {
      database.Database.ExecuteSqlRaw("ALTER TABLE \"Users\" ADD COLUMN \"Gender\" TEXT NOT NULL DEFAULT ''");
    }
    catch (SqliteException exception) when (
      exception.SqliteErrorCode == 1 &&
      exception.Message.Contains("duplicate column", StringComparison.OrdinalIgnoreCase))
    {
      // The column already exists in a newer database.
    }

    try
    {
      database.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS ""ActionConfirmationTokens"" (
          ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_ActionConfirmationTokens"" PRIMARY KEY AUTOINCREMENT,
          ""UserId"" INTEGER NOT NULL,
          ""Token"" TEXT NOT NULL,
          ""ActionType"" TEXT NOT NULL,
          ""CreatedAt"" TEXT NOT NULL,
          ""ExpiresAt"" TEXT NOT NULL,
          ""IsUsed"" INTEGER NOT NULL DEFAULT 0,
          CONSTRAINT ""FK_ActionConfirmationTokens_Users_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS ""IX_ActionConfirmationTokens_Token"" ON ""ActionConfirmationTokens"" (""Token"");
      ");
    }
    catch (Exception)
    {
      // Already exists or handled
    }

    try
    {
      database.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS ""RunSessions"" (
          ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_RunSessions"" PRIMARY KEY AUTOINCREMENT,
          ""UserId"" INTEGER NOT NULL,
          ""Mode"" TEXT NOT NULL DEFAULT 'Running',
          ""DistanceKm"" REAL NOT NULL DEFAULT 0,
          ""DurationSeconds"" INTEGER NOT NULL DEFAULT 0,
          ""CaloriesBurned"" REAL NOT NULL DEFAULT 0,
          ""AvgSpeedKmh"" REAL NOT NULL DEFAULT 0,
          ""AvgPace"" TEXT NOT NULL DEFAULT '0:00',
          ""RouteCoordinatesJson"" TEXT NULL,
          ""CompletedAt"" TEXT NOT NULL,
          CONSTRAINT ""FK_RunSessions_Users_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS ""IX_RunSessions_UserId"" ON ""RunSessions"" (""UserId"");
      ");
    }
    catch (Exception)
    {
      // Already exists or handled
    }

    try
    {
      // Sanitize any corrupt / overflowed user muscle progress records
      database.Database.ExecuteSqlRaw("UPDATE \"UserMuscleProgresses\" SET \"Xp\" = 15000 WHERE \"Xp\" > 100000;");
      database.Database.ExecuteSqlRaw("UPDATE \"WorkoutLogs\" SET \"XpEarned\" = 4000 WHERE \"XpEarned\" > 15000;");
      database.Database.ExecuteSqlRaw("UPDATE \"WorkoutLogs\" SET \"WeightUsed\" = 100 WHERE \"WeightUsed\" > 1000;");
      database.Database.ExecuteSqlRaw("UPDATE \"WorkoutLogs\" SET \"Reps\" = 10 WHERE \"Reps\" > 100;");

      // Wipe orphaned running sessions for users whose progress was reset to 0
      database.Database.ExecuteSqlRaw(@"
        DELETE FROM ""RunSessions"" 
        WHERE ""UserId"" NOT IN (
          SELECT DISTINCT ""UserId"" FROM ""WorkoutLogs""
        ) AND ""UserId"" NOT IN (
          SELECT DISTINCT ""UserId"" FROM ""UserMuscleProgresses"" WHERE ""Xp"" > 0
        );
      ");
    }
    catch (Exception)
    {
      // Already exists or handled
    }

    // The local database currently contains one existing account from before
    // Gender was added. Give that account the requested default value once.
    var existingUsers = database.Users.ToList();
    if (existingUsers.Count == 1 && string.IsNullOrWhiteSpace(existingUsers[0].Gender))
    {
      existingUsers[0].Gender = "MALE";
      database.SaveChanges();
    }

    var defaultExercises = new[]
    {
      // Chest (Barbell, Dumbbell, Cables, Machines)
      new Exercise { Name = "Bench Press", MuscleGroup = "Chest", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-bench-press.gif" },
      new Exercise { Name = "Incline Bench Press", MuscleGroup = "Chest", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-incline-bench-press.gif" },
      new Exercise { Name = "Machine Chest Fly (Pec Deck)", MuscleGroup = "Chest", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-seated-fly.gif" },
      new Exercise { Name = "Lever Chest Press", MuscleGroup = "Chest", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-chest-press.gif" },
      new Exercise { Name = "Lever Incline Chest Press", MuscleGroup = "Chest", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-incline-chest-press.gif" },
      new Exercise { Name = "Cable Upper Chest Crossovers", MuscleGroup = "Chest", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/cable-upper-chest-crossovers.gif" },
      new Exercise { Name = "Cable Standing Fly", MuscleGroup = "Chest", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/cable-standing-fly.gif" },
      new Exercise { Name = "Dumbbell Bench Press", MuscleGroup = "Chest", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-bench-press.gif" },
      new Exercise { Name = "Dumbbell Incline Bench Press", MuscleGroup = "Chest", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-incline-bench-press.gif" },
      new Exercise { Name = "Dumbbell Flyes", MuscleGroup = "Chest", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-fly.gif" },
      new Exercise { Name = "Pushups", MuscleGroup = "Chest", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/push-up.gif" },

      // Back and Traps (Barbell, Dumbbell, Cables, Machines)
      new Exercise { Name = "Cable Lat Pulldown", MuscleGroup = "Upper Back", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/cable-pulldown.gif" },
      new Exercise { Name = "Cable Straight Arm Pulldown", MuscleGroup = "Upper Back", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/cable-straight-arm-pulldown.gif" },
      new Exercise { Name = "Lever Front Pulldown", MuscleGroup = "Upper Back", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/lever-front-pulldown.gif" },
      new Exercise { Name = "Cable Seated Row", MuscleGroup = "Upper Back", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/cable-seated-row.gif" },
      new Exercise { Name = "Seated Cable Rows", MuscleGroup = "Upper Back", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/cable-seated-row.gif" },
      new Exercise { Name = "Lever Seated Row", MuscleGroup = "Upper Back", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/lever-seated-row.gif" },
      new Exercise { Name = "Lever T-Bar Row", MuscleGroup = "Upper Back", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/lever-t-bar-row.gif" },
      new Exercise { Name = "Dumbbell One Arm Bent Over Row", MuscleGroup = "Upper Back", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/dumbbell-one-arm-bent-over-row.gif" },
      new Exercise { Name = "Bent Over Barbell Row", MuscleGroup = "Upper Back", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/barbell-bent-over-row.gif" },
      new Exercise { Name = "Alternating Kettlebell Row", MuscleGroup = "Upper Back", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/kettlebell-alternating-row.gif" },
      new Exercise { Name = "Pullups", MuscleGroup = "Upper Back", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/pull-up.gif" },
      new Exercise { Name = "Deadlift", MuscleGroup = "Lower Back", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif" },
      new Exercise { Name = "Hyperextensions (Back Extensions)", MuscleGroup = "Lower Back", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/spine/hyperextension.gif" },
      new Exercise { Name = "Superman", MuscleGroup = "Lower Back", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/spine/exercise-ball-back-extension-with-arms-extended.gif" },
      new Exercise { Name = "Good Morning", MuscleGroup = "Lower Back", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/hamstrings/barbell-good-morning.gif" },
      new Exercise { Name = "Barbell Shrug", MuscleGroup = "Traps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/traps/barbell-shrug.gif" },
      new Exercise { Name = "Dumbbell Shrug", MuscleGroup = "Traps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/traps/dumbbell-shrug.gif" },
      new Exercise { Name = "Cable Shrugs", MuscleGroup = "Traps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/traps/cable-shrug.gif" },

      // Shoulders (Machines, Cables, Dumbbells)
      new Exercise { Name = "Lever Shoulder Press", MuscleGroup = "Shoulders", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/lever-shoulder-press.gif" },
      new Exercise { Name = "Dumbbell Seated Shoulder Press", MuscleGroup = "Shoulders", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-seated-shoulder-press.gif" },
      new Exercise { Name = "Arnold Dumbbell Press", MuscleGroup = "Shoulders", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-arnold-press.gif" },
      new Exercise { Name = "Dumbbell Lateral Raise", MuscleGroup = "Shoulders", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif" },
      new Exercise { Name = "Side Lateral Raise", MuscleGroup = "Shoulders", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif" },
      new Exercise { Name = "Cable One Arm Lateral Raise", MuscleGroup = "Shoulders", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/cable-one-arm-lateral-raise.gif" },
      new Exercise { Name = "Lever Seated Reverse Fly", MuscleGroup = "Shoulders", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/lever-seated-reverse-fly.gif" },
      new Exercise { Name = "Cable Rear Delt Row With Rope (Face Pull)", MuscleGroup = "Shoulders", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/cable-rear-delt-row-with-rope.gif" },
      new Exercise { Name = "Front Dumbbell Raise", MuscleGroup = "Shoulders", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-front-raise.gif" },
      new Exercise { Name = "Alternating Cable Shoulder Press", MuscleGroup = "Shoulders", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/cable-alternate-shoulder-press.gif" },

      // Biceps (Machines, Cables, Dumbbells, Barbells)
      new Exercise { Name = "Cable Bicep Curl", MuscleGroup = "Biceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/cable-curl.gif" },
      new Exercise { Name = "Cable Hammer Curl With Rope", MuscleGroup = "Biceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/cable-hammer-curl-with-rope.gif" },
      new Exercise { Name = "Lever Preacher Curl", MuscleGroup = "Biceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/lever-preacher-curl.gif" },
      new Exercise { Name = "Dumbbell Incline Biceps Curl", MuscleGroup = "Biceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-incline-biceps-curl.gif" },
      new Exercise { Name = "Incline Dumbbell Curl", MuscleGroup = "Biceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-incline-biceps-curl.gif" },
      new Exercise { Name = "Dumbbell Bicep Curl", MuscleGroup = "Biceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-biceps-curl.gif" },
      new Exercise { Name = "Bicep Curl", MuscleGroup = "Biceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-curl.gif" },
      new Exercise { Name = "Dumbbell Hammer Curl", MuscleGroup = "Biceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-hammer-curl.gif" },
      new Exercise { Name = "Alternate Hammer Curl", MuscleGroup = "Biceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-hammer-curl.gif" },
      new Exercise { Name = "Concentration Curls", MuscleGroup = "Biceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-concentration-curl.gif" },
      new Exercise { Name = "Cable Preacher Curl", MuscleGroup = "Biceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/cable-preacher-curl.gif" },

      // Triceps (Machines, Cables, Dumbbells, Barbells)
      new Exercise { Name = "Cable Triceps Pushdown", MuscleGroup = "Triceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-pushdown.gif" },
      new Exercise { Name = "Triceps Pushdown", MuscleGroup = "Triceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-pushdown.gif" },
      new Exercise { Name = "Cable Overhead Triceps Extension", MuscleGroup = "Triceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-overhead-triceps-extension-rope-attachment.gif" },
      new Exercise { Name = "Lever Triceps Extension", MuscleGroup = "Triceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/lever-triceps-extension.gif" },
      new Exercise { Name = "Close-Grip Barbell Bench Press", MuscleGroup = "Triceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/barbell-close-grip-bench-press.gif" },
      new Exercise { Name = "Lying Triceps Press", MuscleGroup = "Triceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/barbell-lying-triceps-extension.gif" },
      new Exercise { Name = "Bench Dips", MuscleGroup = "Triceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/bench-dip-knees-bent.gif" },
      new Exercise { Name = "Cable Incline Triceps Extension", MuscleGroup = "Triceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-incline-triceps-extension.gif" },
      new Exercise { Name = "Band Skull Crusher", MuscleGroup = "Triceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/barbell-lying-triceps-extension-skull-crusher.gif" },

      // Forearms
      new Exercise { Name = "Cable Wrist Curl", MuscleGroup = "Forearms", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/forearms/cable-wrist-curl.gif" },
      new Exercise { Name = "Farmer's Walk", MuscleGroup = "Forearms", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/farmers-walk.gif" },
      new Exercise { Name = "Finger Curls", MuscleGroup = "Forearms", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/forearms/finger-curls.gif" },
      new Exercise { Name = "Palms-Down Wrist Curl Over A Bench", MuscleGroup = "Forearms", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/forearms/barbell-palms-down-wrist-curl-over-a-bench.gif" },

      // Core & Abs (Machines, Cables, Bodyweight)
      new Exercise { Name = "Lever Seated Crunch", MuscleGroup = "Abs", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/lever-seated-crunch.gif" },
      new Exercise { Name = "Cable Kneeling Crunch", MuscleGroup = "Abs", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/cable-kneeling-crunch.gif" },
      new Exercise { Name = "Crunch", MuscleGroup = "Abs", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/crunch-floor.gif" },
      new Exercise { Name = "Hanging Leg Raise", MuscleGroup = "Abs", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/hanging-leg-raise.gif" },
      new Exercise { Name = "Plank", MuscleGroup = "Abs", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/weighted-front-plank.gif" },
      new Exercise { Name = "Decline Crunch", MuscleGroup = "Abs", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/decline-crunch.gif" },
      new Exercise { Name = "Russian Twist", MuscleGroup = "Obliques", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/russian-twist.gif" },
      new Exercise { Name = "Side Bridge", MuscleGroup = "Obliques", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/side-bridge-v-2.gif" },
      new Exercise { Name = "Barbell Side Bend", MuscleGroup = "Obliques", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/dumbbell-side-bend.gif" },
      new Exercise { Name = "Cross-Body Crunch", MuscleGroup = "Obliques", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/cross-body-crunch.gif" },

      // Lower Body (Machines, Cables, Dumbbells, Barbells)
      new Exercise { Name = "Lever Leg Press", MuscleGroup = "Quadriceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/lever-alternate-leg-press.gif" },
      new Exercise { Name = "Lever Leg Extension", MuscleGroup = "Quadriceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/lever-leg-extension.gif" },
      new Exercise { Name = "Leg Extensions", MuscleGroup = "Quadriceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/lever-leg-extension.gif" },
      new Exercise { Name = "Dumbbell Goblet Squat", MuscleGroup = "Quadriceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/dumbbell-goblet-squat.gif" },
      new Exercise { Name = "Barbell Squat", MuscleGroup = "Quadriceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-high-bar-squat.gif" },
      new Exercise { Name = "Barbell Full Squat", MuscleGroup = "Quadriceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-full-squat.gif" },
      new Exercise { Name = "Barbell Lunge", MuscleGroup = "Quadriceps", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-lunge.gif" },
      new Exercise { Name = "Lever Seated Leg Curl", MuscleGroup = "Hamstrings", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/hamstrings/lever-seated-leg-curl.gif" },
      new Exercise { Name = "Lever Lying Leg Curl", MuscleGroup = "Hamstrings", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/hamstrings/lever-lying-leg-curl.gif" },
      new Exercise { Name = "Dumbbell Romanian Deadlift", MuscleGroup = "Glutes", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/dumbbell-romanian-deadlift.gif" },
      new Exercise { Name = "Barbell Hip Thrust", MuscleGroup = "Glutes", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-glute-bridge-two-legs-on-bench-male.gif" },
      new Exercise { Name = "Cable Pull Through With Rope", MuscleGroup = "Glutes", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/cable-pull-through-with-rope.gif" },
      new Exercise { Name = "Glute Kickback", MuscleGroup = "Glutes", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/cable-standing-hip-extension.gif" },
      new Exercise { Name = "Butt Lift (Bridge)", MuscleGroup = "Glutes", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-glute-bridge.gif" },
      new Exercise { Name = "90/90 Hamstring", MuscleGroup = "Hamstrings", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/hamstrings/hamstring-stretch.gif" },
      new Exercise { Name = "Ball Leg Curl", MuscleGroup = "Hamstrings", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/exercise-ball-one-legged-diagonal-kick-hamstring-curl.gif" },
      new Exercise { Name = "Floor Glute-Ham Raise", MuscleGroup = "Hamstrings", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/hamstrings/glute-ham-raise.gif" },
      new Exercise { Name = "Barbell Seated Calf Raise", MuscleGroup = "Calves", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/barbell-seated-calf-raise.gif" },
      new Exercise { Name = "Calf Press", MuscleGroup = "Calves", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/lever-calf-press.gif" },
      new Exercise { Name = "Calf Raise On A Dumbbell", MuscleGroup = "Calves", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/single-leg-calf-raise-on-a-dumbbell.gif" },
      new Exercise { Name = "Standing Calf Raises", MuscleGroup = "Calves", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/barbell-standing-calf-raise.gif" },

      // Neck
      new Exercise { Name = "Chin To Chest Stretch", MuscleGroup = "Neck", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/levator-scapulae/side-push-neck-stretch.gif" },
      new Exercise { Name = "Isometric Neck Exercise - Front And Back", MuscleGroup = "Neck", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/levator-scapulae/side-push-neck-stretch.gif" },
      new Exercise { Name = "Side Neck Stretch", MuscleGroup = "Neck", VideoUrl = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/levator-scapulae/neck-side-stretch.gif" },
    };

    var existingByName = database.Exercises
      .ToList()
      .GroupBy(exercise => exercise.Name, StringComparer.OrdinalIgnoreCase)
      .ToDictionary(group => group.Key, group => group.First(), StringComparer.OrdinalIgnoreCase);
    var changed = false;

    foreach (var seed in defaultExercises)
    {
      if (!existingByName.TryGetValue(seed.Name, out var existing))
      {
        database.Exercises.Add(seed);
        changed = true;
        continue;
      }

      if (!string.Equals(existing.MuscleGroup, seed.MuscleGroup, StringComparison.Ordinal))
      {
        existing.MuscleGroup = seed.MuscleGroup;
        changed = true;
      }

      if (!string.Equals(existing.VideoUrl, seed.VideoUrl, StringComparison.Ordinal))
      {
        existing.VideoUrl = seed.VideoUrl;
        changed = true;
      }
    }

    if (changed)
    {
      database.SaveChanges();
    }
  }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
  app.MapOpenApi();
}

app.Use(async (context, next) =>
{
  context.Response.Headers.Append("X-Frame-Options", "DENY");
  context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
  context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
  context.Response.Headers.Append("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  await next();
});

app.UseStaticFiles();
app.UseCors("AllowAll");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/healthz", () => Results.Ok(new { status = "ok" }));
app.MapFallbackToFile("index.html");

app.Run();
