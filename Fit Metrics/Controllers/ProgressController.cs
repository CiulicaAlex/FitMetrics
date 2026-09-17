using Fit_Metrics.DTOs;
using Fit_Metrics.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Fit_Metrics.Controllers
{
  [Authorize(AuthenticationSchemes = "CookieAuth")]
  [Route("api/[controller]")]
  [ApiController]
  public class ProgressController : ControllerBase
  {
    private readonly AppDbContext _context;
    public ProgressController(AppDbContext context)
    {
      _context = context;
    }

    private int? GetCurrentUserId()
    {
      var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
      return int.TryParse(userIdClaim, out int userId) ? userId : null;
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserProgress(int userId)
    {
      var currentUserId = GetCurrentUserId();
      if (currentUserId == null) return Unauthorized();

      // IDOR check: Users can only query their own progress
      if (currentUserId.Value != userId)
      {
        return StatusCode(StatusCodes.Status403Forbidden, new { message = "Forbidden: Access denied to other users' data." });
      }

      var twelveHoursAgo = DateTime.UtcNow.AddHours(-12);
      var recentLogs = await _context.WorkoutLogs
        .Where(l => l.UserId == currentUserId.Value && l.CompletedAt >= twelveHoursAgo)
        .Include(l => l.Exercise)
        .ToListAsync();

      var recentXpByMuscle = recentLogs
        .Where(l => l.Exercise != null)
        .GroupBy(l => l.Exercise.MuscleGroup, StringComparer.OrdinalIgnoreCase)
        .ToDictionary(g => g.Key, g => g.Sum(l => l.XpEarned), StringComparer.OrdinalIgnoreCase);

      var progress = await _context.UserMuscleProgresses
        .Where(p => p.UserId == currentUserId.Value)
        .ToListAsync();

      var result = progress.Select(p =>
      {
        int rollingCap = p.MuscleGroup switch
        {
          "Chest" or "Upper Back" or "Lower Back" or "Quadriceps" or "Glutes" => 15000,
          _ => 8500
        };
        recentXpByMuscle.TryGetValue(p.MuscleGroup, out int recentXp);
        bool isDailyCapped = recentXp >= rollingCap;

        return new
        {
          muscleGroup = p.MuscleGroup.ToLower(),
          name = p.MuscleGroup,
          xp = p.Xp,
          isDailyCapped = isDailyCapped,
          rollingWindowCap = rollingCap,
          recentXp = recentXp
        };
      });
      return Ok(result);
    }

    [HttpGet("history/user/{userId}")]
    public async Task<IActionResult> GetUserHistory(int userId)
    {
      var currentUserId = GetCurrentUserId();
      if (currentUserId == null) return Unauthorized();

      // IDOR check: Users can only query their own workout history
      if (currentUserId.Value != userId)
      {
        return StatusCode(StatusCodes.Status403Forbidden, new { message = "Forbidden: Access denied to other users' data." });
      }

      var logs = await _context.WorkoutLogs
        .Where(l => l.UserId == currentUserId.Value)
        .Include(l => l.Exercise)
        .OrderByDescending(l => l.CompletedAt)
        .Select(l => new
        {
          id = l.Id,
          exerciseId = l.ExerciseId,
          exerciseName = l.Exercise != null ? l.Exercise.Name : "Exercise",
          muscleGroup = l.Exercise != null ? l.Exercise.MuscleGroup : "",
          sets = l.Sets,
          reps = l.Reps,
          weightUsed = l.WeightUsed,
          xpEarned = l.XpEarned,
          completedAt = l.CompletedAt
        })
        .ToListAsync();
      return Ok(logs);
    }

    [HttpPost("log-workout")]
    public async Task<IActionResult> LogWorkout([FromBody] LogWorkoutDto dto)
    {
      var currentUserId = GetCurrentUserId();
      if (currentUserId == null) return Unauthorized();

      if (dto == null) return BadRequest("Missing body.");

      // Strict sanity bounds to prevent numerical overflow or absurd values
      dto.WeightUsed = Math.Clamp(dto.WeightUsed, 0, 1000);
      dto.Reps = Math.Clamp(dto.Reps, 1, 100);
      dto.Sets = Math.Clamp(dto.Sets, 1, 50);

      var exercise = await _context.Exercises.FindAsync(dto.ExerciseId);
      if (exercise == null)
      {
        return NotFound(new { message = "Exercise not found." });
      }

      double weightFactor = dto.WeightUsed > 0 ? dto.WeightUsed : 1;
      double calculatedRawXp = dto.Sets * dto.Reps * weightFactor;

      // Single-entry realistic threshold (prevents extreme spikes)
      int maxPerEntry = 4000;
      int sanitizedEntryXp = calculatedRawXp > maxPerEntry ? maxPerEntry : (int)calculatedRawXp;
      int rawXp = sanitizedEntryXp;

      // 12-hour rolling recovery window check per muscle group
      var twelveHoursAgo = DateTime.UtcNow.AddHours(-12);
      var recentXpEarned = await _context.WorkoutLogs
        .Where(l => l.UserId == currentUserId.Value && l.Exercise.MuscleGroup == exercise.MuscleGroup && l.CompletedAt >= twelveHoursAgo)
        .SumAsync(l => l.XpEarned);

      int rollingWindowCap = exercise.MuscleGroup switch
      {
        "Chest" or "Upper Back" or "Lower Back" or "Quadriceps" or "Glutes" => 15000,
        _ => 8500
      };

      int remainingHeadroom = Math.Max(0, rollingWindowCap - recentXpEarned);
      int xpEarned = Math.Min(sanitizedEntryXp, remainingHeadroom);
      bool isDailyCapped = (recentXpEarned + xpEarned) >= rollingWindowCap;

      var workoutLog = new WorkoutLog
      {
        // Enforce authenticated user ID to prevent IDOR logging
        UserId = currentUserId.Value,
        ExerciseId = dto.ExerciseId,
        Sets = dto.Sets,
        Reps = dto.Reps,
        WeightUsed = dto.WeightUsed,
        XpEarned = xpEarned,
        CompletedAt = DateTime.UtcNow
      };

      _context.WorkoutLogs.Add(workoutLog);

      var progress = await _context.UserMuscleProgresses
        .FirstOrDefaultAsync(p => p.UserId == currentUserId.Value && p.MuscleGroup == exercise.MuscleGroup);

      if (progress == null)
      {
        progress = new UserMuscleProgress
        {
          UserId = currentUserId.Value,
          MuscleGroup = exercise.MuscleGroup,
          Xp = xpEarned,
          LastUpdated = DateTime.UtcNow
        };
        _context.UserMuscleProgresses.Add(progress);
      }
      else
      {
        progress.Xp += xpEarned;
        progress.LastUpdated = DateTime.UtcNow;
        _context.UserMuscleProgresses.Update(progress);
      }

      await _context.SaveChangesAsync();
      return Ok(new
      {
        message = isDailyCapped ? "Daily XP cap reached for this muscle group." : "Workout logged successfully",
        xpEarned,
        rawXp,
        muscleGroup = exercise.MuscleGroup,
        isDailyCapped,
        rollingWindowCap,
        remainingHeadroom = Math.Max(0, rollingWindowCap - (recentXpEarned + xpEarned))
      });
    }

    [HttpPost("reset/user/{userId}")]
    public async Task<IActionResult> ResetUserProgressDirect(int userId)
    {
      var currentUserId = GetCurrentUserId();
      if (currentUserId == null || currentUserId.Value != userId)
      {
        return Unauthorized();
      }

      var progresses = await _context.UserMuscleProgresses.Where(p => p.UserId == userId).ToListAsync();
      if (progresses.Any())
      {
        _context.UserMuscleProgresses.RemoveRange(progresses);
      }

      var logs = await _context.WorkoutLogs.Where(l => l.UserId == userId).ToListAsync();
      if (logs.Any())
      {
        _context.WorkoutLogs.RemoveRange(logs);
      }

      var runs = await _context.RunSessions.Where(r => r.UserId == userId).ToListAsync();
      if (runs.Any())
      {
        _context.RunSessions.RemoveRange(runs);
      }

      await _context.SaveChangesAsync();

      return Ok(new
      {
        message = "Your muscle progress, gym workout logs, and running sessions have been reset to 0."
      });
    }

    [HttpPost("reset-all")]
    public IActionResult ResetAllProgress()
    {
      return BadRequest(new { message = "Bulk reset endpoint has been permanently disabled for security reasons." });
    }
  }
}
