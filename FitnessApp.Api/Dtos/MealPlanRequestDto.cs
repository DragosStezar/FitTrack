namespace FitnessApp.Api.Dtos
{
    public class MealPlanRequestDto
    {
        public double GoalCalories { get; set; }
        public double ProteinGrams { get; set; }
        public double CarbGrams { get; set; }
        public double FatGrams { get; set; }
        public string? DietaryGoal { get; set; }
        public string? Preferences { get; set; }
    }
}