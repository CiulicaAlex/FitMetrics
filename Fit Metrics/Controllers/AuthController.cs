using BCrypt.Net;
using Fit_Metrics.DTOs;
using Fit_Metrics.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Fit_Metrics.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  public class AuthController : ControllerBase
  {
    private readonly AppDbContext _context;

    public AuthController(AppDbContext context)
    {
      _context = context;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
      if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
      {
        return BadRequest("Email already exists");
      }

      string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            var user = new User
            {
                FullName = dto.FullName.Trim(),
                Email = dto.Email.Trim(),
                PasswordHash = passwordHash
            };

      _context.Users.Add(user);
      await _context.SaveChangesAsync();

      return Ok(new { message = "User registered successfully" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
      var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
      if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
      {
        return Unauthorized("Invalid email or password");
      }

      var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email)
            };

      var claimsIdentity = new ClaimsIdentity(claims, "CookieAuth");

      await HttpContext.SignInAsync("CookieAuth", new ClaimsPrincipal(claimsIdentity), new AuthenticationProperties
      {
        IsPersistent = true,
        ExpiresUtc = DateTime.UtcNow.AddDays(7)
      });

      return Ok(new { message = "User logged in successfully" });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
      await HttpContext.SignOutAsync("CookieAuth");
      return Ok(new { message = "User logged out successfully" });
    }

    [Authorize(AuthenticationSchemes = "CookieAuth")]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
      var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!int.TryParse(userIdClaim, out int userId))
      {
        return Unauthorized();
      }

      var user = await _context.Users.FindAsync(userId);
      if (user == null) return NotFound();

            return Ok(new
            {
                FullName = user.FullName,
              Id = user.Id,
                Email = user.Email,
                Weight = user.Weight,
                Height = user.Height
            });
    }

    [Authorize(AuthenticationSchemes = "CookieAuth")]
    [HttpPost("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
      var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!int.TryParse(userIdClaim, out int userId))
      {
        return Unauthorized();
      }

      var user = await _context.Users.FindAsync(userId);
      if (user == null) return NotFound();

      user.Weight = dto.Weight;
      user.Height = dto.Height;

      await _context.SaveChangesAsync();

      return Ok(new { message = "Profile updated successfully!", weight = user.Weight, height = user.Height });
    }
  }
}
