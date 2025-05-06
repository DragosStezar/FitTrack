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
    [Authorize]
    public class UserProfileController : ControllerBase
    {
        private readonly FitnessAppDbContext _context;
        private readonly NutritionService _nutritionService;

        public UserProfileController(FitnessAppDbContext context, NutritionService nutritionService)
        {
            _context = context;
            _nutritionService = nutritionService;
        }

        private Guid GetCurrentUserId()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(userIdString, out var userId))
            {
                return userId;
            }
            throw new InvalidOperationException("User ID could not be parsed from token.");
        }

        // GET: api/userprofile/me
        [HttpGet("me")]
        public async Task<ActionResult<UserProfileDto>> GetMyProfile()
        {
            var userId = GetCurrentUserId();

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            if (user.Type != UserType.Premium)
            {
                return Forbid();
            }

            var userProfile = await _context.UserProfiles.FindAsync(userId);

            if (userProfile == null)
            {
                return NotFound("User profile not found. Please create one.");
            }

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

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            if (user.Type != UserType.Premium)
            {
                return Forbid();
            }

            var userProfile = await _context.UserProfiles.FindAsync(userId);

            bool isNewProfile = false;
            if (userProfile == null)
            {
                userProfile = new UserProfile { UserId = userId };
                _context.UserProfiles.Add(userProfile);
                isNewProfile = true;
            }

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
                throw;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving user profile: {ex.Message}");
                return StatusCode(500, "An error occurred while saving the profile.");
            }

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
                return CreatedAtAction(nameof(GetMyProfile), new { id = userProfile.UserId }, userProfileDto);
            }
            else
            {
                return Ok(userProfileDto);
            }
        }
    }
}