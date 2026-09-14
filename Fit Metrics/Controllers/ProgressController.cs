using Fit_Metrics.DTOs;
using Fit_Metrics.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Metadata;

namespace Fit_Metrics.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  public class ProgressController : ControllerBase
  {
    private readonly AppDbContext _context;
    public ProgressController(AppDbContext context)
    {
      _context = context;
    }
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserProgress(int userId)
    {
      var progress = await _context.UserMuscleProgresses.Where(p => p.UserId == userId).Select(p => new
      {
        muscleGroup = p.MuscleGroup.ToLower(),
        xp = p.Xp
      }).ToListAsync();
      return Ok(progress);
    }

    [HttpGet("history/user/{userId}")]
    public async Task<IActionResult> GetUserHistory(int userId)
    {
      var logs = await _context.WorkoutLogs
        .Where(l => l.UserId == userId)
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
      if (dto == null) return BadRequest("Missing body.");

      var exercise = await _context.Exercises.FindAsync(dto.ExerciseId);
      if (exercise == null)
      {
        return NotFound(new { message = "Exercise not found." });
      }

      double weightFactor = dto.WeightUsed > 0 ? dto.WeightUsed : 1;
      int xpEarned = (int)(dto.Sets * dto.Reps * weightFactor);

      var workoutLog = new WorkoutLog
      {
        UserId = dto.UserId,
        ExerciseId = dto.ExerciseId,
        Sets = dto.Sets,
        Reps = dto.Reps,
        WeightUsed = dto.WeightUsed,
        XpEarned = xpEarned,
        CompletedAt = DateTime.UtcNow
      };

      _context.WorkoutLogs.Add(workoutLog);

      var progress = await _context.UserMuscleProgresses
        .FirstOrDefaultAsync(p => p.UserId == dto.UserId && p.MuscleGroup == exercise.MuscleGroup);

      if (progress == null)
      {
        progress = new UserMuscleProgress
        {
          UserId = dto.UserId,
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
      return Ok(new { message = "Workout logged successfully", xpEarned });
    }
  }
}
