using System.ComponentModel.DataAnnotations;

namespace FitnessApp.Api.Dtos
{
    public class ExerciseCreateDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        public string? Notes { get; set; }
    }
}