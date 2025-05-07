using FitnessApp.Api.Dtos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace FitnessApp.Api.Services
{
    public class GeminiRequestContent
    {
        [JsonPropertyName("parts")]
        public GeminiRequestPart[]? Parts { get; set; }
    }

    public class GeminiRequestPart
    {
        [JsonPropertyName("text")]
        public string? Text { get; set; }
    }

    public class GeminiGenerationConfig
    {
        [JsonPropertyName("temperature")]
        public float Temperature { get; set; } = 0.7f;
        [JsonPropertyName("maxOutputTokens")]
        public int MaxOutputTokens { get; set; } = 2048;
    }

    public class GeminiApiRequestBody
    {
        [JsonPropertyName("contents")]
        public GeminiRequestContent[]? Contents { get; set; }
    }

    public class GeminiApiResponsePart
    {
        [JsonPropertyName("text")]
        public string? Text { get; set; }
    }

    public class GeminiApiResponseContent
    {
        [JsonPropertyName("parts")]
        public GeminiApiResponsePart[]? Parts { get; set; }
        [JsonPropertyName("role")]
        public string? Role { get; set; }
    }

    public class GeminiApiCandidate
    {
        [JsonPropertyName("content")]
        public GeminiApiResponseContent? Content { get; set; }
    }

    public class GeminiApiResponseBody
    {
        [JsonPropertyName("candidates")]
        public GeminiApiCandidate[]? Candidates { get; set; }
    }


    public class GeminiMealPlanService
    {
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly string? _geminiApiKey;
        private readonly ILogger<GeminiMealPlanService> _logger;
        private const string GeminiModelName = "gemini-1.5-flash-latest";
        private readonly string _geminiApiEndpointUrl;

        public GeminiMealPlanService(IConfiguration configuration, IHttpClientFactory httpClientFactory, ILogger<GeminiMealPlanService> logger)
        {
            _configuration = configuration;
            _httpClient = httpClientFactory.CreateClient("GeminiApiClient");
            _logger = logger;

            _geminiApiKey = _configuration["GEMINI:API:KEY"];
            if (string.IsNullOrEmpty(_geminiApiKey))
            {
                _logger.LogError("Cheia API Gemini (GEMINI:API:KEY) nu este configurată.");
                throw new InvalidOperationException("Cheia API Gemini nu este configurată.");
            }
            _geminiApiEndpointUrl = $"https://generativelanguage.googleapis.com/v1beta/models/{GeminiModelName}:generateContent?key={_geminiApiKey}";
        }

        public async Task<MealPlanResponseDto> GenerateMealPlanAsync(MealPlanRequestDto request)
        {
            if (request == null)
            {
                _logger.LogWarning("GenerateMealPlanAsync a primit o cerere nulă.");
                return new MealPlanResponseDto { Success = false, ErrorMessage = "Datele cererii sunt nule." };
            }

            try
            {
                var prompt = BuildPrompt(request);
                _logger.LogInformation("Prompt generat pentru Gemini API: {Prompt}", prompt);

                var apiRequestBody = new GeminiApiRequestBody
                {
                    Contents = new[] { new GeminiRequestContent { Parts = new[] { new GeminiRequestPart { Text = prompt } } } }
                };

                _logger.LogInformation("Se trimite cererea către Gemini API la endpoint-ul: {EndpointUrl}", _geminiApiEndpointUrl.Split('?')[0]);

                HttpResponseMessage response = await _httpClient.PostAsJsonAsync(_geminiApiEndpointUrl, apiRequestBody);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Eroare de la Gemini API. Status: {StatusCode}, Motiv: {ReasonPhrase}, Răspuns: {ErrorContent}", response.StatusCode, response.ReasonPhrase, errorContent);
                    return new MealPlanResponseDto { Success = false, ErrorMessage = $"Eroare la apelarea API-ului Gemini: {response.ReasonPhrase}" };
                }

                var geminiResponse = await response.Content.ReadFromJsonAsync<GeminiApiResponseBody>();

                if (geminiResponse?.Candidates == null || geminiResponse.Candidates.Length == 0)
                {
                    _logger.LogWarning("Răspunsul de la Gemini API nu conține candidați.");
                    return new MealPlanResponseDto { Success = false, ErrorMessage = "Răspuns invalid (fără candidați) de la AI." };
                }

                var firstCandidate = geminiResponse.Candidates[0];
                if (firstCandidate?.Content?.Parts == null || firstCandidate.Content.Parts.Length == 0)
                {
                    _logger.LogWarning("Primul candidat din răspunsul Gemini API nu conține 'parts' sau 'Content' este null.");
                    return new MealPlanResponseDto { Success = false, ErrorMessage = "Răspuns invalid (fără 'parts' în conținut sau 'Content' este null) de la AI." };
                }

                var firstPart = firstCandidate.Content.Parts[0];
                string? mealPlanText = firstPart?.Text;

                if (string.IsNullOrWhiteSpace(mealPlanText))
                {
                    _logger.LogWarning("Textul planului alimentar generat de Gemini este gol sau doar spații albe.");
                    return new MealPlanResponseDto { Success = false, ErrorMessage = "Răspunsul de la AI nu a conținut un plan alimentar valid (text gol)." };
                }

                _logger.LogInformation("Plan alimentar generat cu succes de Gemini API.");
                return new MealPlanResponseDto { Success = true, MealPlanText = mealPlanText };
            }
            catch (JsonException jsonEx)
            {
                _logger.LogError(jsonEx, "Eroare la procesarea JSON în comunicarea cu Gemini API.");
                return new MealPlanResponseDto { Success = false, ErrorMessage = $"Eroare la procesarea datelor JSON: {jsonEx.Message}" };
            }
            catch (HttpRequestException httpEx)
            {
                _logger.LogError(httpEx, "Eroare de rețea la apelarea Gemini API.");
                return new MealPlanResponseDto { Success = false, ErrorMessage = $"Eroare de rețea la apelarea serviciului AI: {httpEx.Message}" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "O eroare neașteptată a apărut în GeminiMealPlanService.");
                return new MealPlanResponseDto { Success = false, ErrorMessage = $"O eroare neașteptată a apărut: {ex.Message}" };
            }
        }

        private string BuildPrompt(MealPlanRequestDto request)
        {
            var sb = new StringBuilder();
            sb.AppendLine("Generează un plan alimentar detaliat pentru o zi, pentru o persoană cu următoarele caracteristici și obiective:");
            sb.AppendLine($"- Calorii țintă: {request.GoalCalories:F0} kcal");
            sb.AppendLine($"- Proteine țintă: {request.ProteinGrams:F0}g");
            sb.AppendLine($"- Carbohidrați țintă: {request.CarbGrams:F0}g");
            sb.AppendLine($"- Grăsimi țintă: {request.FatGrams:F0}g");
            sb.AppendLine($"- Obiectiv principal: {request.DietaryGoal}");
            sb.AppendLine("- Număr de mese: 3 mese principale și 2 gustări");
            if (!string.IsNullOrWhiteSpace(request.Preferences))
            {
                sb.AppendLine($"- Preferințe/Restricții: {request.Preferences}");
            }
            sb.AppendLine();
            sb.AppendLine("Oferă sugestii specifice pentru fiecare masă și gustare, cu estimări aproximative ale cantităților.");
            sb.AppendLine("Asigură-te că totalul macronutrienților și caloriilor din planul propus se apropie cât mai mult de țintele specificate.");
            sb.AppendLine("Structurează răspunsul clar, cu secțiuni pentru fiecare masă (ex: **Mic Dejun:**, **Prânz:**, **Cină:**, **Gustare 1:**, **Gustare 2:**).");
            sb.AppendLine("Folosește markdown pentru formatare (bold pentru titlurile meselor, liste cu bullet points pentru alimente).");
            return sb.ToString();
        }
    }
}