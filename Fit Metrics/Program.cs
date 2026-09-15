using Fit_Metrics;
using Fit_Metrics.Models;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.Sqlite;

var builder = WebApplication.CreateBuilder(args);

var dataProtectionPath = Path.Combine(builder.Environment.ContentRootPath, "data", "keys");
Directory.CreateDirectory(dataProtectionPath);
builder.Services.AddDataProtection()
  .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionPath))
  .SetApplicationName("FitMetrics");

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddHttpClient();
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
builder.Services.AddAuthentication("CookieAuth")
    .AddCookie("CookieAuth", options =>
    {
      options.Cookie.Name = "FitMetricsAuthCookie";
      options.Cookie.SameSite = builder.Environment.IsDevelopment()
        ? SameSiteMode.Lax
        : SameSiteMode.None;
      options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.None
        : CookieSecurePolicy.Always;
      options.Events.OnRedirectToLogin = context =>
      {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
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
      // Chest
      new Exercise { Name = "Bench Press", MuscleGroup = "Chest", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg" },
      new Exercise { Name = "Dumbbell Flyes", MuscleGroup = "Chest", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Flyes/0.jpg" },
      new Exercise { Name = "Incline Bench Press", MuscleGroup = "Chest", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg" },

      // Back and traps
      new Exercise { Name = "Bent Over Barbell Row", MuscleGroup = "Upper Back", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bent_Over_Barbell_Row/0.jpg" },
      new Exercise { Name = "Seated Cable Rows", MuscleGroup = "Upper Back", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Cable_Rows/0.jpg" },
      new Exercise { Name = "Alternating Kettlebell Row", MuscleGroup = "Upper Back", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Alternating_Kettlebell_Row/0.jpg" },
      new Exercise { Name = "Deadlift", MuscleGroup = "Lower Back", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Deadlift/0.jpg" },
      new Exercise { Name = "Hyperextensions (Back Extensions)", MuscleGroup = "Lower Back", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hyperextensions_Back_Extensions/0.jpg" },
      new Exercise { Name = "Superman", MuscleGroup = "Lower Back", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Superman/0.jpg" },
      new Exercise { Name = "Barbell Shrug", MuscleGroup = "Traps", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Shrug/0.jpg" },
      new Exercise { Name = "Dumbbell Shrug", MuscleGroup = "Traps", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Shrug/0.jpg" },
      new Exercise { Name = "Cable Shrugs", MuscleGroup = "Traps", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Shrugs/0.jpg" },

      // Shoulders and arms
      new Exercise { Name = "Arnold Dumbbell Press", MuscleGroup = "Shoulders", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Arnold_Dumbbell_Press/0.jpg" },
      new Exercise { Name = "Alternating Cable Shoulder Press", MuscleGroup = "Shoulders", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Alternating_Cable_Shoulder_Press/0.jpg" },
      new Exercise { Name = "Side Lateral Raise", MuscleGroup = "Shoulders", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Lateral_Raise/0.jpg" },
      new Exercise { Name = "Bicep Curl", MuscleGroup = "Biceps", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Curl/0.jpg" },
      new Exercise { Name = "Alternate Hammer Curl", MuscleGroup = "Biceps", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Alternate_Hammer_Curl/0.jpg" },
      new Exercise { Name = "Cable Preacher Curl", MuscleGroup = "Biceps", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Preacher_Curl/0.jpg" },
      new Exercise { Name = "Bench Dips", MuscleGroup = "Triceps", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bench_Dips/0.jpg" },
      new Exercise { Name = "Cable Incline Triceps Extension", MuscleGroup = "Triceps", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Incline_Triceps_Extension/0.jpg" },
      new Exercise { Name = "Band Skull Crusher", MuscleGroup = "Triceps", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Band_Skull_Crusher/0.jpg" },
      new Exercise { Name = "Cable Wrist Curl", MuscleGroup = "Forearms", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Wrist_Curl/0.jpg" },
      new Exercise { Name = "Farmer's Walk", MuscleGroup = "Forearms", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Farmers_Walk/0.jpg" },
      new Exercise { Name = "Finger Curls", MuscleGroup = "Forearms", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Finger_Curls/0.jpg" },

      // Core
      new Exercise { Name = "Crunch", MuscleGroup = "Abs", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Crunch/0.jpg" },
      new Exercise { Name = "Hanging Leg Raise", MuscleGroup = "Abs", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hanging_Leg_Raise/0.jpg" },
      new Exercise { Name = "Plank", MuscleGroup = "Abs", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Plank/0.jpg" },
      new Exercise { Name = "Russian Twist", MuscleGroup = "Obliques", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Russian_Twist/0.jpg" },
      new Exercise { Name = "Side Bridge", MuscleGroup = "Obliques", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Bridge/0.jpg" },
      new Exercise { Name = "Barbell Side Bend", MuscleGroup = "Obliques", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Side_Bend/0.jpg" },

      // Lower body
      new Exercise { Name = "Barbell Hip Thrust", MuscleGroup = "Glutes", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Hip_Thrust/0.jpg" },
      new Exercise { Name = "Glute Kickback", MuscleGroup = "Glutes", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Glute_Kickback/0.jpg" },
      new Exercise { Name = "Butt Lift (Bridge)", MuscleGroup = "Glutes", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Butt_Lift_Bridge/0.jpg" },
      new Exercise { Name = "Barbell Squat", MuscleGroup = "Quadriceps", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/0.jpg" },
      new Exercise { Name = "Barbell Full Squat", MuscleGroup = "Quadriceps", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Full_Squat/0.jpg" },
      new Exercise { Name = "Barbell Lunge", MuscleGroup = "Quadriceps", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Lunge/0.jpg" },
      new Exercise { Name = "90/90 Hamstring", MuscleGroup = "Hamstrings", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/90_90_Hamstring/0.jpg" },
      new Exercise { Name = "Ball Leg Curl", MuscleGroup = "Hamstrings", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Ball_Leg_Curl/0.jpg" },
      new Exercise { Name = "Floor Glute-Ham Raise", MuscleGroup = "Hamstrings", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Floor_Glute-Ham_Raise/0.jpg" },
      new Exercise { Name = "Barbell Seated Calf Raise", MuscleGroup = "Calves", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Seated_Calf_Raise/0.jpg" },
      new Exercise { Name = "Calf Press", MuscleGroup = "Calves", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Calf_Press/0.jpg" },
      new Exercise { Name = "Calf Raise On A Dumbbell", MuscleGroup = "Calves", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Calf_Raise_On_A_Dumbbell/0.jpg" },

      // Neck
      new Exercise { Name = "Chin To Chest Stretch", MuscleGroup = "Neck", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Chin_To_Chest_Stretch/0.jpg" },
      new Exercise { Name = "Isometric Neck Exercise - Front And Back", MuscleGroup = "Neck", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Isometric_Neck_Exercise_-_Front_And_Back/0.jpg" },
      new Exercise { Name = "Side Neck Stretch", MuscleGroup = "Neck", VideoUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Neck_Stretch/0.jpg" },
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

      if (string.IsNullOrWhiteSpace(existing.VideoUrl))
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

app.UseStaticFiles();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/healthz", () => Results.Ok(new { status = "ok" }));
app.MapFallbackToFile("index.html");

app.Run();
