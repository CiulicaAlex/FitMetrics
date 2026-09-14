using Fit_Metrics.DTOs;
using Fit_Metrics.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Fit_Metrics.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  public class WorkoutsController : ControllerBase
  {
    private readonly AppDbContext _context;
    public WorkoutsController(AppDbContext context)
    {
      _context = context;
    }
    [HttpGet]
    public async Task<IActionResult> GetUserWorkouts()
    {
      var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!int.TryParse(userIdStr, out int userId))
      {
        return Unauthorized();
      }

      var workouts = await _context.Workouts
          .Where(w => w.UserId == userId)
          .ToListAsync();

      return Ok(workouts);
    }
    [HttpPost]
    public async Task<IActionResult> CreateWorkout([FromBody] CreateWorkoutDto dto)
    {
      if (!ModelState.IsValid)
      {
        return BadRequest(ModelState);
      }

      var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!int.TryParse(userIdStr, out int userId))
      {
        return Unauthorized();
      }

      var workout = new Workout
      {
        Name = dto.Name,
        UserId = userId,
        MuscleGroups = dto.MuscleGroups,
        Exercises = dto.Exercises
      };
      _context.Workouts.Add(workout);
      await _context.SaveChangesAsync();

      return Ok(workout);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateWorkout(int id, [FromBody] CreateWorkoutDto dto)
    {
      if (!ModelState.IsValid)
      {
        return BadRequest(ModelState);
      }

      var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!int.TryParse(userIdStr, out int userId))
      {
        return Unauthorized();
      }

      var workout = await _context.Workouts
          .FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);

      if (workout == null)
      {
        return NotFound(new { message = "Workout not found or unauthorized." });
      }

      workout.Name = dto.Name;
      workout.MuscleGroups = dto.MuscleGroups;
      workout.Exercises = dto.Exercises;

      await _context.SaveChangesAsync();

      return Ok(workout);
    }
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWorkout(int id)
    {
      var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!int.TryParse(userIdStr, out int userId))
      {
        return Unauthorized();
      }

      var workout = await _context.Workouts
          .FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);

      if (workout == null)
      {
        return NotFound(new { message = "Workout not found or unauthorized." });
      }

      _context.Workouts.Remove(workout);
      await _context.SaveChangesAsync();

      return Ok(new { message = "Workout deleted successfully" });
    }
  }
}
