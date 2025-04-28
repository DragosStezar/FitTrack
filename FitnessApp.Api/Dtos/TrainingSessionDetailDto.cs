using System;
using System.Collections.Generic;

namespace FitnessApp.Api.Dtos
{
    public class TrainingSessionDetailDto
    {
        public Guid Id { get; set; }
        public DateTime Date { get; set; }
        public string? Notes { get; set; }
        public List<ExerciseDto> Exercises { get; set; } = new List<ExerciseDto>();
    }
}