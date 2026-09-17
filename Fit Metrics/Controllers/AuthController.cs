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
using Fit_Metrics.Services;
using Microsoft.AspNetCore.RateLimiting;

namespace Fit_Metrics.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  public class AuthController : ControllerBase
  {
    private readonly AppDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _config;

    public AuthController(AppDbContext context, IEmailService emailService, IConfiguration config)
    {
      _context = context;
      _emailService = emailService;
      _config = config;
    }

    [EnableRateLimiting("AuthLimiter")]
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
      var gender = dto.Gender.Trim().ToUpperInvariant();
      if (gender is not ("MALE" or "FEMALE" or "OTHER"))
      {
        return BadRequest("Please select a valid gender.");
      }

      if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
      {
        return BadRequest("Email already exists");
      }

      string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            var user = new User
            {
                FullName = dto.FullName.Trim(),
                Email = dto.Email.Trim(),
                PasswordHash = passwordHash,
                Gender = gender
            };

      _context.Users.Add(user);
      await _context.SaveChangesAsync();

      return Ok(new { message = "User registered successfully" });
    }

    [EnableRateLimiting("AuthLimiter")]
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

      if (string.IsNullOrWhiteSpace(user.Gender))
      {
        user.Gender = "MALE";
        await _context.SaveChangesAsync();
      }

            return Ok(new
            {
                FullName = user.FullName,
              Id = user.Id,
                Email = user.Email,
                Gender = user.Gender,
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

    [Authorize(AuthenticationSchemes = "CookieAuth")]
    [EnableRateLimiting("AuthLimiter")]
    [HttpPost("request-action-confirmation")]
    public async Task<IActionResult> RequestActionConfirmation([FromBody] RequestActionDto dto)
    {
      if (dto == null || string.IsNullOrWhiteSpace(dto.ActionType))
      {
        return BadRequest(new { message = "Action type is required." });
      }

      var actionType = dto.ActionType.Trim().ToUpperInvariant();
      if (actionType is not ("RESET_PROGRESS" or "DELETE_ACCOUNT"))
      {
        return BadRequest(new { message = "Invalid action type. Must be RESET_PROGRESS or DELETE_ACCOUNT." });
      }

      var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!int.TryParse(userIdClaim, out int userId))
      {
        return Unauthorized();
      }

      var user = await _context.Users.FindAsync(userId);
      if (user == null) return NotFound(new { message = "User not found." });

      // Invalidate any existing unused tokens for this user and action
      var existingTokens = await _context.ActionConfirmationTokens
        .Where(t => t.UserId == userId && t.ActionType == actionType && !t.IsUsed)
        .ToListAsync();
      foreach (var t in existingTokens)
      {
        t.IsUsed = true;
      }

      // Generate cryptographically secure 64-char token
      var token = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
      var confirmationRecord = new ActionConfirmationToken
      {
        UserId = user.Id,
        Token = token,
        ActionType = actionType,
        CreatedAt = DateTime.UtcNow,
        ExpiresAt = DateTime.UtcNow.AddMinutes(30),
        IsUsed = false
      };

      _context.ActionConfirmationTokens.Add(confirmationRecord);
      await _context.SaveChangesAsync();

      var baseUrl = _config["EmailSettings:AppBaseUrl"]?.TrimEnd('/');
      if (string.IsNullOrWhiteSpace(baseUrl))
      {
        baseUrl = $"{Request.Scheme}://{Request.Host}";
      }

      var confirmationUrl = $"{baseUrl}/verify-action?token={token}";

      await _emailService.SendActionConfirmationEmailAsync(user.Email, user.FullName, actionType, confirmationUrl);

      var isDev = _config.GetValue<string>("ASPNETCORE_ENVIRONMENT") == "Development" ||
                  string.IsNullOrWhiteSpace(_config["EmailSettings:SenderPassword"]);

      return Ok(new
      {
        message = $"A secure confirmation link was sent to {user.Email}. Please check your email to complete this action.",
        actionType,
        expiresInMinutes = 30,
        devUrl = isDev ? confirmationUrl : null
      });
    }

    [HttpPost("verify-action")]
    public async Task<IActionResult> VerifyAction([FromBody] VerifyActionDto dto)
    {
      if (dto == null || string.IsNullOrWhiteSpace(dto.Token))
      {
        return BadRequest(new { message = "Confirmation token is required." });
      }

      using (_context.BypassRls())
      {
        var token = await _context.ActionConfirmationTokens
          .Include(t => t.User)
          .FirstOrDefaultAsync(t => t.Token == dto.Token.Trim());

        if (token == null)
        {
          return BadRequest(new { message = "Invalid or nonexistent confirmation link." });
        }

      if (token.IsUsed)
      {
        return BadRequest(new { message = "This confirmation link has already been used." });
      }

      if (token.ExpiresAt < DateTime.UtcNow)
      {
        return BadRequest(new { message = "This confirmation link has expired. Please request a new confirmation email." });
      }

      var userId = token.UserId;

      if (token.ActionType == "RESET_PROGRESS")
      {
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

        token.IsUsed = true;
        await _context.SaveChangesAsync();

        return Ok(new
        {
          message = "Your account progress (muscle XP, gym logs, and running sessions) has been completely reset to 0.",
          actionType = "RESET_PROGRESS"
        });
      }
      else if (token.ActionType == "DELETE_ACCOUNT")
      {
        var user = await _context.Users.FindAsync(userId);
        if (user != null)
        {
          var workouts = await _context.Workouts.Where(w => w.UserId == userId).ToListAsync();
          var workoutLogs = await _context.WorkoutLogs.Where(l => l.UserId == userId).ToListAsync();
          var progress = await _context.UserMuscleProgresses.Where(p => p.UserId == userId).ToListAsync();
          var tokens = await _context.ActionConfirmationTokens.Where(t => t.UserId == userId).ToListAsync();
          var runs = await _context.RunSessions.Where(r => r.UserId == userId).ToListAsync();

          _context.Workouts.RemoveRange(workouts);
          _context.WorkoutLogs.RemoveRange(workoutLogs);
          _context.UserMuscleProgresses.RemoveRange(progress);
          _context.ActionConfirmationTokens.RemoveRange(tokens);
          _context.RunSessions.RemoveRange(runs);
          _context.Users.Remove(user);
          await _context.SaveChangesAsync();
        }

        try
        {
          await HttpContext.SignOutAsync("CookieAuth");
        }
        catch
        {
          // Ignore if unauthenticated
        }

        return Ok(new
        {
          message = "Your FitMetrics account and all associated workout history have been permanently deleted.",
          actionType = "DELETE_ACCOUNT"
        });
      }

        return BadRequest(new { message = "Unknown action type." });
      }
    }

    [Authorize(AuthenticationSchemes = "CookieAuth")]
    [HttpDelete("account")]
    public IActionResult DeleteAccountDirect()
    {
      return BadRequest(new
      {
        message = "Direct account deletion without confirmation is disabled for your security. Please request email confirmation via /api/auth/request-action-confirmation."
      });
    }

    [EnableRateLimiting("AuthLimiter")]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
      if (dto == null || string.IsNullOrWhiteSpace(dto.Email))
      {
        return BadRequest(new { message = "Email address is required." });
      }

      var email = dto.Email.Trim().ToLowerInvariant();
      var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);

      if (user == null)
      {
        // Avoid email enumeration, return uniform message
        return Ok(new
        {
          message = "If this email is associated with a FitMetrics account, instructions to reset your password have been sent.",
          devUrl = (string?)null
        });
      }

      // Invalidate existing unused password reset tokens
      var existingTokens = await _context.ActionConfirmationTokens
        .Where(t => t.UserId == user.Id && t.ActionType == "RESET_PASSWORD" && !t.IsUsed)
        .ToListAsync();
      foreach (var t in existingTokens)
      {
        t.IsUsed = true;
      }

      // Generate secure 64-char token
      var token = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
      var confirmationRecord = new ActionConfirmationToken
      {
        UserId = user.Id,
        Token = token,
        ActionType = "RESET_PASSWORD",
        CreatedAt = DateTime.UtcNow,
        ExpiresAt = DateTime.UtcNow.AddMinutes(30),
        IsUsed = false
      };

      _context.ActionConfirmationTokens.Add(confirmationRecord);
      await _context.SaveChangesAsync();

      var baseUrl = _config["EmailSettings:AppBaseUrl"]?.TrimEnd('/');
      if (string.IsNullOrWhiteSpace(baseUrl))
      {
        baseUrl = $"{Request.Scheme}://{Request.Host}";
      }

      var resetUrl = $"{baseUrl}/reset-password?token={token}";

      await _emailService.SendPasswordResetEmailAsync(user.Email, user.FullName, resetUrl);

      var isDev = _config.GetValue<string>("ASPNETCORE_ENVIRONMENT") == "Development" ||
                  string.IsNullOrWhiteSpace(_config["EmailSettings:SenderPassword"]);

      return Ok(new
      {
        message = "If this email is associated with a FitMetrics account, instructions to reset your password have been sent.",
        devUrl = isDev ? resetUrl : null
      });
    }

    [EnableRateLimiting("AuthLimiter")]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
      if (dto == null || string.IsNullOrWhiteSpace(dto.Token))
      {
        return BadRequest(new { message = "Security token is invalid or missing." });
      }

      if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 6)
      {
        return BadRequest(new { message = "New password must be at least 6 characters long." });
      }

      using (_context.BypassRls())
      {
        var token = await _context.ActionConfirmationTokens
          .Include(t => t.User)
          .FirstOrDefaultAsync(t => t.Token == dto.Token.Trim() && t.ActionType == "RESET_PASSWORD");

        if (token == null)
        {
          return BadRequest(new { message = "Password reset link is invalid or does not exist." });
        }

        if (token.IsUsed)
        {
          return BadRequest(new { message = "This password reset link has already been used." });
        }

        if (token.ExpiresAt < DateTime.UtcNow)
        {
          return BadRequest(new { message = "This password reset link has expired. Please request a new one from the sign in page." });
        }

        var user = token.User ?? await _context.Users.FindAsync(token.UserId);
        if (user == null)
        {
          return NotFound(new { message = "Associated user was not found." });
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        token.IsUsed = true;

        await _context.SaveChangesAsync();

        return Ok(new
        {
          message = "Password has been successfully reset! You can now sign in with your new password."
        });
      }
    }
  }
}
