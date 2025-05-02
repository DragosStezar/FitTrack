using FitnessApp.Api.Dtos;
using FitnessApp.Api.Models;
using System;

namespace FitnessApp.Api.Services
{
    public class NutritionService
    {
        private const double KCAL_PER_PROTEIN_GRAM = 4.0;
        private const double KCAL_PER_CARB_GRAM = 4.0;
        private const double KCAL_PER_FAT_GRAM = 9.0;

        private const double PROTEIN_GRAMS_PER_KG_WEIGHT_LOSS = 1.8;
        private const double PROTEIN_GRAMS_PER_KG_MAINTENANCE = 1.6;
        private const double PROTEIN_GRAMS_PER_KG_WEIGHT_GAIN = 2.0;

        private const double FAT_CALORIE_PERCENTAGE = 0.25;

        // Ajustare calorică pentru scop (deficit/surplus)
        private const double WEIGHT_LOSS_CALORIE_ADJUSTMENT = -500;
        private const double WEIGHT_GAIN_CALORIE_ADJUSTMENT = 300;

        public CalculatedNutritionDto CalculateNutritionalNeeds(UserProfile profile)
        {
            if (profile == null)
            {
                throw new ArgumentNullException(nameof(profile));
            }

            double bmr = CalculateBmr(profile.Gender, profile.WeightKg, profile.HeightCm, profile.Age);
            double tdee = CalculateTdee(bmr, profile.ActivityLevel);

            Goal derivedGoal = Goal.Maintenance;
            double calorieAdjustment = 0;
            if (profile.TargetWeightKg.HasValue)
            {
                if (profile.TargetWeightKg < profile.WeightKg)
                {
                    derivedGoal = Goal.WeightLoss;
                    calorieAdjustment = WEIGHT_LOSS_CALORIE_ADJUSTMENT;
                }
                else if (profile.TargetWeightKg > profile.WeightKg)
                {
                    derivedGoal = Goal.WeightGain;
                    calorieAdjustment = WEIGHT_GAIN_CALORIE_ADJUSTMENT;
                }
            }

            double goalCalories = tdee + calorieAdjustment;

            double proteinGrams = CalculateProteinGrams(profile.WeightKg, derivedGoal);
            double proteinCalories = proteinGrams * KCAL_PER_PROTEIN_GRAM;

            double fatCalories = goalCalories * FAT_CALORIE_PERCENTAGE;
            double fatGrams = fatCalories / KCAL_PER_FAT_GRAM;

            double remainingCalories = goalCalories - proteinCalories - fatCalories;
            double carbGrams = remainingCalories / KCAL_PER_CARB_GRAM;

            if (carbGrams < 0) carbGrams = 0;

            return new CalculatedNutritionDto
            {
                MaintenanceCalories = Math.Round(tdee),
                GoalCalories = Math.Round(goalCalories),
                ProteinGrams = Math.Round(proteinGrams),
                CarbGrams = Math.Round(carbGrams),
                FatGrams = Math.Round(fatGrams)
            };
        }

        private double CalculateBmr(Gender gender, double weightKg, double heightCm, int age)
        {
            if (gender == Gender.Male)
            {
                return (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
            }
            else
            {
                return (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
            }
        }

        private double CalculateTdee(double bmr, ActivityLevel activityLevel)
        {
            double activityFactor = GetActivityFactor(activityLevel);
            return bmr * activityFactor;
        }

        private double CalculateProteinGrams(double weightKg, Goal derivedGoal)
        {
            switch (derivedGoal)
            {
                case Goal.WeightLoss:
                    return weightKg * PROTEIN_GRAMS_PER_KG_WEIGHT_LOSS;
                case Goal.Maintenance:
                    return weightKg * PROTEIN_GRAMS_PER_KG_MAINTENANCE;
                case Goal.WeightGain:
                    return weightKg * PROTEIN_GRAMS_PER_KG_WEIGHT_GAIN;
                default:
                    return weightKg * PROTEIN_GRAMS_PER_KG_MAINTENANCE;
            }
        }

        private double GetActivityFactor(ActivityLevel level)
        {
            switch (level)
            {
                case ActivityLevel.Sedentary:
                    return 1.2;
                case ActivityLevel.LightlyActive:
                    return 1.375;
                case ActivityLevel.ModeratelyActive:
                    return 1.55;
                case ActivityLevel.VeryActive:
                    return 1.725;
                case ActivityLevel.ExtraActive:
                    return 1.9;
                default:
                    return 1.2; // Default to Sedentary
            }
        }
    }
}