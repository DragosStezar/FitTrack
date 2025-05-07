namespace FitnessApp.Api.Dtos
{
    public class MealPlanResponseDto
    {
        public string? MealPlanText { get; set; }
        public bool Success { get; set; } = true;
        public string? ErrorMessage { get; set; }
    }
}