using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FitnessApp.Api.Dtos
{
    public class TrainingSessionCreateDto
    {
        [Required]
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public string? Notes { get; set; }

        [Required]
        public List<ExerciseInputDto> Exercises { get; set; } = new List<ExerciseInputDto>();
    }
}