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
            // Check if user already exists (by email or username)
            if (await _context.Users.AnyAsync(u => u.Email == request.Email || u.Username == request.Username))
            {
                return BadRequest("Username or Email already exists.");
            }

            // Hash the password
            string passwordHash = BCryptNet.HashPassword(request.Password);

            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = passwordHash,
                Type = UserType.Basic // Default to Basic user
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Generate JWT Token immediately after registration
            var token = GenerateJwtToken(user);

            // Return token and user info, similar to login
            var response = new AuthResponseDto
            {
                Token = token,
                Username = user.Username,
                Email = user.Email,
                UserType = user.Type.ToString()
            };

            return Ok(response); // Return the AuthResponseDto
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(UserLoginDto request)
        {
            // Find user by username or email
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Login || u.Email == request.Login);

            if (user == null || !BCryptNet.Verify(request.Password, user.PasswordHash))
            {
                return Unauthorized("Invalid Credentials.");
            }

            // Generate JWT Token
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
                // Revenim la durata originală (sau o lași 24h dacă dorești)
                Expires = DateTime.UtcNow.AddHours(1),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"],
                SigningCredentials = credentials
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }

        // Endpoint pentru a iniția autentificarea Google
        [HttpGet("google-login")]
        public IActionResult GoogleLogin()
        {
            // Asigurăm-ne că folosim HTTP pentru redirecționare, nu HTTPS
            var frontendUrl = _configuration["FrontendDomain"] ?? "http://localhost:5173";

            // Înlocuim https cu http dacă este necesar
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

        // Metoda GoogleCallback NU va mai fi apelată în acest scenariu simplificat,
        // dar o lăsăm deocamdată.
        [HttpGet("google-callback")] // Această rută nu va mai fi folosită acum
        public IActionResult GoogleCallback() // Eliminat async pentru că nu folosim await
        {
            // ... codul existent rămâne aici, dar nu va fi executat ...
            Console.WriteLine("---> Google Callback Custom Endpoint Hit (NU AR TREBUI SĂ APARĂ ACUM).");
            // ... 

            // Adăugăm un return default pentru a satisface compilatorul,
            // deși acest cod nu ar trebui să fie atins în configurația curentă.
            return NotFound("Callback endpoint not configured for direct use in this scenario.");
        }

        // Nou endpoint pentru a prelua datele utilizatorului autentificat
        [HttpGet("me")]
        [Authorize] // <-- Necesită autentificare
        public async Task<ActionResult<UserDetailsDto>> GetMe()
        {
            // Extragem ID-ul utilizatorului din claim-ul corect: NameIdentifier
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // === DEBUG: Logăm valoarea claim-ului sub ===
            // Console.WriteLine($"---> [GetMe] Received token. User claims:");
            // foreach (var claim in User.Claims)
            // {
            //     Console.WriteLine($"---> [GetMe] Claim: {claim.Type} = {claim.Value}");
            // }
            // Console.WriteLine($"---> [GetMe] Extracted 'sub' claim value: '{userIdString}'");
            // ============================================

            if (!Guid.TryParse(userIdString, out var userId))
            {
                // Acest caz nu ar trebui să se întâmple dacă token-ul este valid și emis corect
                // Console.WriteLine("---> [GetMe] Failed to parse 'sub' claim as Guid."); // DEBUG Log - Eliminat
                return Unauthorized("Invalid user identifier in token.");
            }

            // === DEBUG: Logăm ID-ul parsat ===
            // Console.WriteLine($"---> [GetMe] Successfully parsed Guid: {userId}");
            // ==================================

            // Căutăm utilizatorul în baza de date după ID
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                // Utilizatorul din token nu (mai) există în BD
                return NotFound("User not found.");
            }

            // Mapăm datele utilizatorului la DTO
            var userDetails = new UserDetailsDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                UserType = user.Type.ToString() // Returnăm tipul ca string (Basic/Premium)
            };

            return Ok(userDetails);
        }
    }
}