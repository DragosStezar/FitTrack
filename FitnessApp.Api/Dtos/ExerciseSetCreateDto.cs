using System.ComponentModel.DataAnnotations;

namespace FitnessApp.Api.Dtos
{
    public class ExerciseSetCreateDto
    {
        [Required]
        [Range(1, int.MaxValue)]
        public int SetNumber { get; set; }

        [Required]
        [StringLength(50)]
        public string Repetitions { get; set; } = string.Empty;

        [Required]
        [Range(0, double.MaxValue)]
        public double Weight { get; set; }
    }
}