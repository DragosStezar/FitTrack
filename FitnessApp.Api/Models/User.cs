using System;
using System.Collections.Generic;

namespace FitnessApp.Api.Models
{
    public enum UserType
    {
        Basic,
        Premium
    }

    public class User
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PasswordHash { get; set; }
        public string? GoogleId { get; set; }
        public UserType Type { get; set; } = UserType.Basic;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public virtual ICollection<TrainingSession> TrainingSessions { get; set; } = new List<TrainingSession>();
        public virtual NutritionalGoal? NutritionalGoal { get; set; }
        public virtual UserProfile? UserProfile { get; set; }
    }
}