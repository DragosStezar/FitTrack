using System.ComponentModel.DataAnnotations;

namespace FitnessApp.Api.Dtos
{
    public class UserLoginDto
    {
        [Required]
        public string Login { get; set; } = string.Empty; // Can be Username or Email

        [Required]
        public string Password { get; set; } = string.Empty;
    }
}