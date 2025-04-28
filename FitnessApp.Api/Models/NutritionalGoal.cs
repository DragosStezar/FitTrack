using System;

namespace FitnessApp.Api.Models
{
    public enum GoalType
    {
        WeightLoss, // Slabire
        MassGain    // Crestere masa musculara
    }

    public class NutritionalGoal
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public GoalType Type { get; set; }

        // Nutritional targets
        public double TargetCalories { get; set; }
        public double TargetProteinGrams { get; set; }
        public double TargetCarbohydrateGrams { get; set; }
        public double TargetFatGrams { get; set; }

        public DateTime SetAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public virtual User User { get; set; } = null!;
    }
}