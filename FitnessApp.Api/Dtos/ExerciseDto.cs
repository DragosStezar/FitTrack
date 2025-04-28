using System;
using System.Collections.Generic;

namespace FitnessApp.Api.Dtos
{
    public class ExerciseDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public List<ExerciseSetDto> Sets { get; set; } = new List<ExerciseSetDto>();
    }
}