using FitnessApp.Api.Dtos;
using FitnessApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace FitnessApp.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MealPlanController : ControllerBase
    {
        private readonly GeminiMealPlanService _geminiMealPlanService;
        private readonly ILogger<MealPlanController> _logger;

        public MealPlanController(GeminiMealPlanService geminiMealPlanService, ILogger<MealPlanController> logger)
        {
            _geminiMealPlanService = geminiMealPlanService;
            _logger = logger;
        }

        [HttpPost("generate")]
        public async Task<ActionResult<MealPlanResponseDto>> GenerateMealPlan([FromBody] MealPlanRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("GenerateMealPlan: Model state is invalid.");
                return BadRequest(ModelState);
            }

            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "UnknownUser";
            _logger.LogInformation("GenerateMealPlan: Request received for user {UserId} with goal {DietaryGoal}", userId, request.DietaryGoal);

            var response = await _geminiMealPlanService.GenerateMealPlanAsync(request);

            if (!response.Success)
            {
                _logger.LogError("GenerateMealPlan: Service returned an error for user {UserId} - {ErrorMessage}", userId, response.ErrorMessage);
                return StatusCode(500, new MealPlanResponseDto { Success = false, ErrorMessage = response.ErrorMessage ?? "A apărut o eroare la generarea planului alimentar." });
            }

            _logger.LogInformation("GenerateMealPlan: Successfully generated meal plan for user {UserId}", userId);
            return Ok(response);
        }
    }
}