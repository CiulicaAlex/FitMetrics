using Fit_Metrics.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.EntityFrameworkCore;

namespace Fit_Metrics.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  public class ExercisesController : ControllerBase
  {
    private readonly AppDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public ExercisesController(
      AppDbContext context,
      IHttpClientFactory httpClientFactory,
      IConfiguration configuration)
    {
      _context = context;
      _httpClientFactory = httpClientFactory;
      _configuration = configuration;
    }
    [HttpGet]
    public async Task<IActionResult> GetExercises()
    {
      var exercises = await _context.Exercises.ToListAsync();
      return Ok(exercises);
    }
    [HttpGet("grouped")]
    public async Task<IActionResult> GetGroupedExercises()
    {
      var groupedExercises = await _context.Exercises.GroupBy(e => e.MuscleGroup).ToDictionaryAsync(g => g.Key, g => g.ToList());
      return Ok(groupedExercises);
    }

    [HttpGet("{id:int}/media")]
    public async Task<IActionResult> GetExerciseMedia(int id)
    {
      var exercise = await _context.Exercises.FindAsync(id);
      if (exercise == null || string.IsNullOrWhiteSpace(exercise.VideoUrl))
      {
        return NotFound("No media URL is configured for this exercise.");
      }

      if (!Uri.TryCreate(exercise.VideoUrl, UriKind.Absolute, out var sourceUri) ||
          sourceUri.Host != "exercisedb.p.rapidapi.com")
      {
        return BadRequest("The exercise media URL is not an allowed ExerciseDB URL.");
      }

      var rapidApiKey = _configuration["RapidApi:Key"];
      if (string.IsNullOrWhiteSpace(rapidApiKey))
      {
        return StatusCode(StatusCodes.Status503ServiceUnavailable, "RapidAPI key is not configured.");
      }

      using var request = new HttpRequestMessage(HttpMethod.Get, sourceUri);
      request.Headers.Add("X-RapidAPI-Key", rapidApiKey);
      request.Headers.Add(
        "X-RapidAPI-Host",
        _configuration["RapidApi:Host"] ?? "exercisedb.p.rapidapi.com");

      var client = _httpClientFactory.CreateClient();
      using var response = await client.SendAsync(request);
      if (!response.IsSuccessStatusCode)
      {
        return StatusCode((int)response.StatusCode, "ExerciseDB media request failed.");
      }

      var bytes = await response.Content.ReadAsByteArrayAsync();
      var contentType = response.Content.Headers.ContentType?.ToString() ?? "image/gif";
      return File(bytes, contentType);
    }
    [HttpPost]
    public async Task<IActionResult> CreateExercise(Exercise exercise)
    {
      _context.Exercises.Add(exercise);
      await _context.SaveChangesAsync();
      return Ok(exercise);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateExercise(int id, Exercise input)
    {
      var exercise = await _context.Exercises.FindAsync(id);
      if (exercise == null)
      {
        return NotFound();
      }

      exercise.Name = input.Name;
      exercise.MuscleGroup = input.MuscleGroup;
      exercise.VideoUrl = input.VideoUrl;

      await _context.SaveChangesAsync();
      return Ok(exercise);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteExercise(int id)
    {
      var exercise = await _context.Exercises.FindAsync(id);
      if (exercise == null)
      {
        return NotFound();
      }

      _context.Exercises.Remove(exercise);
      await _context.SaveChangesAsync();

      return Ok(new { message = "Exercise deleted successfully" });
    }
  }
}
