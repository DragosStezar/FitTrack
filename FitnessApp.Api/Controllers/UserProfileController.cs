using FitnessApp.Api.Data;
using FitnessApp.Api.Dtos;
using FitnessApp.Api.Models;
using FitnessApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace FitnessApp.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Necesită autentificare pentru toate metodele din controller
    public class UserProfileController : ControllerBase
    {
        private readonly FitnessAppDbContext _context;
        private readonly NutritionService _nutritionService;

        public UserProfileController(FitnessAppDbContext context, NutritionService nutritionService)
        {
            _context = context;
            _nutritionService = nutritionService;
        }

        // Helper pentru a obține ID-ul utilizatorului curent
        private Guid GetCurrentUserId()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(userIdString, out var userId))
            {
                return userId;
            }
            // Aruncă o excepție sau returnează un Guid gol dacă ID-ul nu poate fi parsat
            // (Teoretic, nu ar trebui să se întâmple dacă token-ul e valid)
            throw new InvalidOperationException("User ID could not be parsed from token.");
        }

        // GET: api/userprofile/me
        [HttpGet("me")]
        public async Task<ActionResult<UserProfileDto>> GetMyProfile()
        {
            var userId = GetCurrentUserId();

            // Găsim user-ul pentru a verifica statusul premium
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            // --- Verificare Premium --- 
            if (user.Type != UserType.Premium)
            {
                return Forbid(); // Sau BadRequest("Premium access required.");
            }
            // --------------------------

            // Găsim profilul utilizatorului (include UserProfile)
            var userProfile = await _context.UserProfiles.FindAsync(userId);

            if (userProfile == null)
            {
                // Poate utilizatorul nu și-a creat încă profilul?
                // Returnăm NotFound sau un DTO gol, în funcție de logica dorită.
                return NotFound("User profile not found. Please create one.");
            }

            // Calculăm nevoile nutriționale
            var calculatedNutrition = _nutritionService.CalculateNutritionalNeeds(userProfile);

            // Mapăm la DTO
            var userProfileDto = new UserProfileDto
            {
                UserId = userProfile.UserId,
                Gender = userProfile.Gender,
                Age = userProfile.Age,
                HeightCm = userProfile.HeightCm,
                WeightKg = userProfile.WeightKg,
                ActivityLevel = userProfile.ActivityLevel,
                TargetWeightKg = userProfile.TargetWeightKg,
                CalculatedNutrition = calculatedNutrition
            };

            return Ok(userProfileDto);
        }

        // PUT: api/userprofile/me
        [HttpPut("me")]
        public async Task<ActionResult<UserProfileDto>> UpdateMyProfile([FromBody] UpdateUserProfileDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = GetCurrentUserId();

            // Găsim user-ul pentru a verifica statusul premium
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            // --- Verificare Premium --- 
            if (user.Type != UserType.Premium)
            {
                return Forbid(); // Utilizatorii non-premium nu pot actualiza profilul (sau crea?)
            }
            // --------------------------

            var userProfile = await _context.UserProfiles.FindAsync(userId);

            bool isNewProfile = false;
            if (userProfile == null)
            {
                // Creează un profil nou dacă nu există
                userProfile = new UserProfile { UserId = userId };
                _context.UserProfiles.Add(userProfile);
                isNewProfile = true;
            }

            // Actualizează proprietățile profilului din DTO
            userProfile.Gender = updateDto.Gender;
            userProfile.Age = updateDto.Age;
            userProfile.HeightCm = updateDto.HeightCm;
            userProfile.WeightKg = updateDto.WeightKg;
            userProfile.ActivityLevel = updateDto.ActivityLevel;
            userProfile.TargetWeightKg = updateDto.TargetWeightKg;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                // Gestionare erori de concurență dacă e necesar
                throw;
            }
            catch (Exception ex)
            {
                // Log error
                Console.WriteLine($"Error saving user profile: {ex.Message}");
                return StatusCode(500, "An error occurred while saving the profile.");
            }

            // Recalculăm nevoile și returnăm DTO-ul actualizat
            var calculatedNutrition = _nutritionService.CalculateNutritionalNeeds(userProfile);
            var userProfileDto = new UserProfileDto
            {
                UserId = userProfile.UserId,
                Gender = userProfile.Gender,
                Age = userProfile.Age,
                HeightCm = userProfile.HeightCm,
                WeightKg = userProfile.WeightKg,
                ActivityLevel = userProfile.ActivityLevel,
                TargetWeightKg = userProfile.TargetWeightKg,
                CalculatedNutrition = calculatedNutrition
            };

            if (isNewProfile)
            {
                // Returnăm 201 Created dacă a fost creat un profil nou
                // Trimit URL-ul unde poate fi accesat (convenție REST)
                return CreatedAtAction(nameof(GetMyProfile), new { id = userProfile.UserId }, userProfileDto);
            }
            else
            {
                // Returnăm 200 OK cu datele actualizate
                return Ok(userProfileDto);
            }
        }
    }
}