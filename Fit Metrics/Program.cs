using Fit_Metrics;
using Fit_Metrics.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

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

    if (!database.Exercises.Any())
    {
      database.Exercises.AddRange(
        new Exercise { Name = "Bench Press", MuscleGroup = "Chest" },
        new Exercise { Name = "Crunch", MuscleGroup = "Abs" },
        new Exercise { Name = "Bicep Curl", MuscleGroup = "Biceps" },
        new Exercise { Name = "Barbell Squat", MuscleGroup = "Legs" },
        new Exercise { Name = "Deadlift", MuscleGroup = "Back" });
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
