using System;

namespace FitnessApp.Api.Dtos
{
    public class TrainingSessionDto
    {
        public Guid Id { get; set; }
        public DateTime Date { get; set; }
        public string? Notes { get; set; }
        // Removed Exercises list from the basic DTO
    }
}