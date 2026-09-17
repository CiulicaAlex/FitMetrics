using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace Fit_Metrics.Services
{
  public class CurrentUserService : ICurrentUserService
  {
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
      _httpContextAccessor = httpContextAccessor;
    }

    public int? UserId
    {
      get
      {
        var user = _httpContextAccessor.HttpContext?.User;
        if (user == null) return null;
        var claim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out int id) ? id : null;
      }
    }

    public bool IsAuthenticated => UserId.HasValue;
  }
}