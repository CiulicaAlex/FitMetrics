using Fit_Metrics.DTOs;
using Fit_Metrics.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Fit_Metrics.Controllers
{
  [Authorize(AuthenticationSchemes = "CookieAuth")]
  [Route("api/[controller]")]
  [ApiController]
  public class RunsController : ControllerBase
  {
    private readonly AppDbContext _context;

    public RunsController(AppDbContext context)
    {
      _context = context;
    }

    private int? GetCurrentUserId()
    {
      var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
      return int.TryParse(userIdClaim, out int userId) ? userId : null;
    }

    [HttpPost]
    public async Task<IActionResult> LogRun([FromBody] LogRunDto dto)
    {
      var currentUserId = GetCurrentUserId();
      if (currentUserId == null)
      {
        return Unauthorized();
      }

      if (dto == null)
      {
        return BadRequest("Invalid run data.");
      }

      var userExists = await _context.Users.AnyAsync(u => u.Id == currentUserId.Value);
      if (!userExists)
      {
        return NotFound("User not found.");
      }

      var session = new RunSession
      {
        // Enforce user ID from authenticated claims, preventing IDOR
        UserId = currentUserId.Value,
        Mode = string.IsNullOrWhiteSpace(dto.Mode) ? "Running" : dto.Mode.Trim(),
        DistanceKm = Math.Round(dto.DistanceKm, 2),
        DurationSeconds = dto.DurationSeconds,
        CaloriesBurned = Math.Round(dto.CaloriesBurned, 1),
        AvgSpeedKmh = Math.Round(dto.AvgSpeedKmh, 1),
        AvgPace = string.IsNullOrWhiteSpace(dto.AvgPace) ? "0:00" : dto.AvgPace.Trim(),
        RouteCoordinatesJson = dto.RouteCoordinatesJson,
        CompletedAt = DateTime.UtcNow
      };

      _context.RunSessions.Add(session);
      await _context.SaveChangesAsync();

      return Ok(new
      {
        id = session.Id,
        userId = session.UserId,
        mode = session.Mode,
        distanceKm = session.DistanceKm,
        durationSeconds = session.DurationSeconds,
        caloriesBurned = session.CaloriesBurned,
        avgSpeedKmh = session.AvgSpeedKmh,
        avgPace = session.AvgPace,
        routeCoordinatesJson = session.RouteCoordinatesJson,
        completedAt = session.CompletedAt
      });
    }

    [HttpGet]
    public async Task<IActionResult> GetMyRuns()
    {
      var currentUserId = GetCurrentUserId();
      if (currentUserId == null) return Unauthorized();

      var runs = await _context.RunSessions
        .Where(r => r.UserId == currentUserId.Value)
        .OrderByDescending(r => r.CompletedAt)
        .Select(r => new
        {
          id = r.Id,
          userId = r.UserId,
          mode = r.Mode,
          distanceKm = r.DistanceKm,
          durationSeconds = r.DurationSeconds,
          caloriesBurned = r.CaloriesBurned,
          avgSpeedKmh = r.AvgSpeedKmh,
          avgPace = r.AvgPace,
          completedAt = r.CompletedAt
        })
        .ToListAsync();

      return Ok(runs);
    }

    [HttpGet("recent")]
    public async Task<IActionResult> GetMyRecentRuns([FromQuery] int limit = 3)
    {
      var currentUserId = GetCurrentUserId();
      if (currentUserId == null) return Unauthorized();

      if (limit <= 0) limit = 3;
      var runs = await _context.RunSessions
        .Where(r => r.UserId == currentUserId.Value)
        .OrderByDescending(r => r.CompletedAt)
        .Take(limit)
        .Select(r => new
        {
          id = r.Id,
          userId = r.UserId,
          mode = r.Mode,
          distanceKm = r.DistanceKm,
          durationSeconds = r.DurationSeconds,
          caloriesBurned = r.CaloriesBurned,
          avgSpeedKmh = r.AvgSpeedKmh,
          avgPace = r.AvgPace,
          completedAt = r.CompletedAt
        })
        .ToListAsync();

      return Ok(runs);
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserRuns(int userId)
    {
      var currentUserId = GetCurrentUserId();
      if (currentUserId == null) return Unauthorized();

      // IDOR check: Users can only query their own runs
      if (currentUserId.Value != userId)
      {
        return StatusCode(StatusCodes.Status403Forbidden, new { message = "Forbidden: Access denied to other users' data." });
      }

      var runs = await _context.RunSessions
        .Where(r => r.UserId == userId)
        .OrderByDescending(r => r.CompletedAt)
        .Select(r => new
        {
          id = r.Id,
          userId = r.UserId,
          mode = r.Mode,
          distanceKm = r.DistanceKm,
          durationSeconds = r.DurationSeconds,
          caloriesBurned = r.CaloriesBurned,
          avgSpeedKmh = r.AvgSpeedKmh,
          avgPace = r.AvgPace,
          completedAt = r.CompletedAt
        })
        .ToListAsync();

      return Ok(runs);
    }

    [HttpGet("user/{userId}/recent")]
    public async Task<IActionResult> GetRecentRuns(int userId, [FromQuery] int limit = 3)
    {
      var currentUserId = GetCurrentUserId();
      if (currentUserId == null) return Unauthorized();

      // IDOR check: Users can only query their own runs
      if (currentUserId.Value != userId)
      {
        return StatusCode(StatusCodes.Status403Forbidden, new { message = "Forbidden: Access denied to other users' data." });
      }

      if (limit <= 0) limit = 3;
      var runs = await _context.RunSessions
        .Where(r => r.UserId == userId)
        .OrderByDescending(r => r.CompletedAt)
        .Take(limit)
        .Select(r => new
        {
          id = r.Id,
          userId = r.UserId,
          mode = r.Mode,
          distanceKm = r.DistanceKm,
          durationSeconds = r.DurationSeconds,
          caloriesBurned = r.CaloriesBurned,
          avgSpeedKmh = r.AvgSpeedKmh,
          avgPace = r.AvgPace,
          completedAt = r.CompletedAt
        })
        .ToListAsync();

      return Ok(runs);
    }
  }
}
