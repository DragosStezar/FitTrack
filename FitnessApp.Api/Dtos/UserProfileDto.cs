using FitnessApp.Api.Models; // Necesar pentru Enum-uri

namespace FitnessApp.Api.Dtos
{
    // DTO pentru a trimite datele complete ale profilului și nutriției către frontend
    public class UserProfileDto
    {
        // Datele de profil (pot fi mapate din UserProfile)
        public Guid UserId { get; set; }
        public Gender Gender { get; set; }
        public int Age { get; set; }
        public double HeightCm { get; set; }
        public double WeightKg { get; set; }
        public ActivityLevel ActivityLevel { get; set; }
        public double? TargetWeightKg { get; set; }

        // Datele nutriționale calculate
        public CalculatedNutritionDto? CalculatedNutrition { get; set; }
    }
}