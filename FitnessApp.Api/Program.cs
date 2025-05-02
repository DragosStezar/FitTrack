using DotNetEnv;
using FitnessApp.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FitnessApp.Api.Services;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.OAuth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using System.IO;

// Determine the path to the root directory of the project and load .env file
string projectRootPath = Directory.GetParent(Directory.GetCurrentDirectory())!.FullName;
string envPath = Path.Combine(projectRootPath, ".env");
Env.Load(envPath);

var builder = WebApplication.CreateBuilder(args);

// CORS Policy Name
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                    policy =>
                    {
                        var frontendDomain = builder.Configuration["FrontendDomain"] ?? "https://localhost:5173";
                        policy.WithOrigins(frontendDomain)
                            .AllowAnyHeader()
                            .AllowAnyMethod()
                            .AllowCredentials();
                    });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<FitnessAppDbContext>(options =>
    options.UseSqlite(connectionString));

builder.Services.AddControllers();

builder.Services.AddScoped<StripeService>();
builder.Services.AddScoped<NutritionService>();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = GoogleDefaults.AuthenticationScheme;
    options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
    };
})
.AddCookie(options =>
{
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.None;
})
.AddGoogle(options =>
{
    options.ClientId = builder.Configuration["Authentication:Google:ClientId"]!;
    options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"]!;
    options.CallbackPath = "/signin-google";  // must match Google Cloud Authorized redirect URI

    options.CorrelationCookie.SameSite = SameSiteMode.Lax;
    options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.None;
    options.SaveTokens = true;

    options.Events = new OAuthEvents
    {
        OnTicketReceived = async context =>
        {
            var dbContext = context.HttpContext.RequestServices.GetRequiredService<FitnessAppDbContext>();
            var configuration = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
            var loggerFactory = context.HttpContext.RequestServices.GetRequiredService<ILoggerFactory>();
            var logger = loggerFactory.CreateLogger("GoogleAuthEvents");

            var email = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            var name = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;

            logger.LogInformation($"Google login received for {email}");

            if (string.IsNullOrEmpty(email))
            {
                logger.LogError("Email claim missing from Google login");
                return;
            }

            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
            {
                user = new FitnessApp.Api.Models.User
                {
                    Email = email,
                    Username = (name?.Replace(" ", "").ToLower() ?? email.Split('@')[0]) + new Random().Next(100, 999),
                    Type = FitnessApp.Api.Models.UserType.Basic
                };
                dbContext.Users.Add(user);
                await dbContext.SaveChangesAsync();
                logger.LogInformation($"Created new user with ID {user.Id}");
            }

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new System.Security.Claims.Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new System.Security.Claims.Claim(JwtRegisteredClaimNames.Email, user.Email),
                new System.Security.Claims.Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, user.Type.ToString())
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(1),
                Issuer = configuration["Jwt:Issuer"],
                Audience = configuration["Jwt:Audience"],
                SigningCredentials = credentials
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            var frontendDomain = configuration["FrontendDomain"];
            var redirectUrl = $"{frontendDomain}/auth-callback?token={tokenString}";

            logger.LogInformation($"Redirecting to: {redirectUrl.Split('?')[0]} with token={tokenString.Substring(0, 10)}...");

            context.Response.Redirect(redirectUrl);
            context.HandleResponse();
        }
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors(MyAllowSpecificOrigins);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
