using System;

namespace FitnessApp.Api.Dtos
{
    public class ExerciseSetDto
    {
        public Guid Id { get; set; }
        public int SetNumber { get; set; }
        public string Repetitions { get; set; } = string.Empty;
        public double Weight { get; set; }
    }
}