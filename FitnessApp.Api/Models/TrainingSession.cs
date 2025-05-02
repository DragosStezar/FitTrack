using System;
using System.Collections.Generic;

namespace FitnessApp.Api.Models
{
    public class TrainingSession
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public DateTime Date { get; set; }
        public string? Notes { get; set; }
        public virtual User User { get; set; } = null!;
        public virtual ICollection<Exercise> Exercises { get; set; } = new List<Exercise>();
    }
}