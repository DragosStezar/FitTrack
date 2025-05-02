using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FitnessApp.Api.Models
{
    public class UserProfile
    {
        [Key]
        [ForeignKey("User")]
        public Guid UserId { get; set; }

        [Required]
        public Gender Gender { get; set; }

        [Required]
        [Range(1, 130)]
        public int Age { get; set; }

        [Required]
        [Range(50, 250)]
        public double HeightCm { get; set; }

        [Required]
        [Range(20, 300)]
        public double WeightKg { get; set; }

        [Required]
        public ActivityLevel ActivityLevel { get; set; }

        [Range(20, 300)]
        public double? TargetWeightKg { get; set; }

        public virtual User User { get; set; } = null!;
    }
}