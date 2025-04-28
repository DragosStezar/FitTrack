using System.ComponentModel.DataAnnotations;

namespace FitnessApp.Api.Dtos
{
    // DTO pentru datele unui exercițiu trimise de la frontend
    public class ExerciseInputDto
    {
        [Required]
        [StringLength(100, MinimumLength = 1)]
        public string Name { get; set; } = string.Empty;

        [Range(1, 100)] // Limite rezonabile
        public int Sets { get; set; }

        [Required]
        [StringLength(50)] // Permite "10-12", "AMRAP" etc.
        public string Reps { get; set; } = string.Empty;

        [StringLength(50)]
        public string? Weight { get; set; }

        [StringLength(50)]
        public string? Duration { get; set; }

        // Adaugă alte câmpuri dacă le trimiți din frontend (ex: Notes)
        public string? Notes { get; set; }
    }
}