using FitnessApp.Api.Data;
using FitnessApp.Api.Dtos;
using FitnessApp.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using BCryptNet = BCrypt.Net.BCrypt;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;

namespace FitnessApp.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly FitnessAppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(FitnessAppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(UserRegisterDto request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email || u.Username == request.Username))
            {
                return BadRequest("Username or Email already exists.");
            }

            string passwordHash = BCryptNet.HashPassword(request.Password);

            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = passwordHash,
                Type = UserType.Basic
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);

            var response = new AuthResponseDto
            {
                Token = token,
                Username = user.Username,
                Email = user.Email,
                UserType = user.Type.ToString()
            };

            return Ok(response);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(UserLoginDto request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Login || u.Email == request.Login);

            if (user == null || !BCryptNet.Verify(request.Password, user.PasswordHash))
            {
                return Unauthorized("Invalid Credentials.");
            }

            var token = GenerateJwtToken(user);

            var response = new AuthResponseDto
            {
                Token = token,
                Username = user.Username,
                Email = user.Email,
                UserType = user.Type.ToString()
            };

            return Ok(response);
        }

        private string GenerateJwtToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                // Folosim rolul real al utilizatorului
                new Claim(ClaimTypes.Role, user.Type.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(1),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"],
                SigningCredentials = credentials
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }

        [HttpGet("google-login")]
        public IActionResult GoogleLogin()
        {
            var frontendUrl = _configuration["FrontendDomain"] ?? "http://localhost:5173";

            if (frontendUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                frontendUrl = "http://" + frontendUrl.Substring(8);
            }

            var properties = new AuthenticationProperties
            {
                RedirectUri = $"{frontendUrl}/auth-callback"
            };
            properties.Items.Add("prompt", "select_account");

            Console.WriteLine($"---> Google Login initiated with RedirectUri: {properties.RedirectUri}");

            return Challenge(properties, GoogleDefaults.AuthenticationScheme);
        }

        [HttpGet("google-callback")]
        public IActionResult GoogleCallback()
        {
            Console.WriteLine("---> Google Callback Custom Endpoint Hit (NU AR TREBUI SĂ APARĂ ACUM).");
            return NotFound("Callback endpoint not configured for direct use in this scenario.");
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UserDetailsDto>> GetMe()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);


            if (!Guid.TryParse(userIdString, out var userId))
            {
                return Unauthorized("Invalid user identifier in token.");
            }

            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            var userDetails = new UserDetailsDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                UserType = user.Type.ToString()
            };

            return Ok(userDetails);
        }
    }
}