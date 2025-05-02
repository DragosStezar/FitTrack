using System;

namespace FitnessApp.Api.Models
{
    public class ExerciseSet
    {
        public Guid Id { get; set; }
        public Guid ExerciseId { get; set; }
        public int SetNumber { get; set; }
        public string Repetitions { get; set; } = string.Empty;
        public double Weight { get; set; }

        public virtual Exercise Exercise { get; set; } = null!;
    }
}