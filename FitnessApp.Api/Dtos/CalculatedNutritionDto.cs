namespace FitnessApp.Api.Dtos
{
    // DTO pentru a reprezenta nevoile nutriționale calculate
    public class CalculatedNutritionDto
    {
        public double MaintenanceCalories { get; set; } // TDEE
        public double GoalCalories { get; set; }        // Calorii ajustate pentru scop
        public double ProteinGrams { get; set; }
        public double CarbGrams { get; set; }
        public double FatGrams { get; set; }
    }
}