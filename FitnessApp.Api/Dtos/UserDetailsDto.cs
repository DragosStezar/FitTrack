namespace FitnessApp.Api.Dtos
{
    // DTO pentru a returna detaliile utilizatorului autentificat
    public class UserDetailsDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string UserType { get; set; } = string.Empty; // Basic sau Premium
        // Adaugă alte câmpuri dacă sunt necesare în frontend
    }
}