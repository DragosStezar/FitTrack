using FitnessApp.Api.Models; // Necesar pentru Enum-uri
using System.ComponentModel.DataAnnotations;

namespace FitnessApp.Api.Dtos
{
    // DTO pentru primirea datelor de la utilizator la actualizarea profilului
    public class UpdateUserProfileDto
    {
        [Required]
        public Gender Gender { get; set; }

        [Required]
        [Range(1, 130)]
        public int Age { get; set; }

        [Required]
        [Range(50, 250)]
        public double HeightCm { get; set; }

        [Required]
        [Range(20, 300)]
        public double WeightKg { get; set; }

        [Required]
        // Asigură-te că valorile primite sunt valide pentru enum
        [EnumDataType(typeof(ActivityLevel))]
        public ActivityLevel ActivityLevel { get; set; }

        // Adăugăm greutatea țintă (poate fi null)
        [Range(20, 300)]
        public double? TargetWeightKg { get; set; }
    }
}