using System;
using System.Collections.Generic;

namespace FitnessApp.Api.Models
{
    public class Exercise
    {
        public Guid Id { get; set; }
        public Guid TrainingSessionId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public virtual TrainingSession TrainingSession { get; set; } = null!;
        public virtual ICollection<ExerciseSet> Sets { get; set; } = new List<ExerciseSet>();
    }
}