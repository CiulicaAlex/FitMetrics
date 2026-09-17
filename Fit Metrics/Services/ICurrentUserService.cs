namespace Fit_Metrics.Services
{
  public interface ICurrentUserService
  {
    int? UserId { get; }
    bool IsAuthenticated { get; }
  }
}