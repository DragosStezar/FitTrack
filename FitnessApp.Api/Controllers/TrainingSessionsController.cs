using FitnessApp.Api.Data;
using FitnessApp.Api.Dtos;
using FitnessApp.Api.Models;
using Microsoft.AspNetCore.Authorization; // Added for [Authorize]
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims; // Added for User Claims
using System.Threading.Tasks;

namespace FitnessApp.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Require authentication for all actions in this controller
    public class TrainingSessionsController : ControllerBase
    {
        private readonly FitnessAppDbContext _context;
        // Inject ILogger for better error logging (optional but recommended)
        // private readonly ILogger<TrainingSessionsController> _logger;

        public TrainingSessionsController(FitnessAppDbContext context /*, ILogger<TrainingSessionsController> logger*/)
        {
            _context = context;
            // _logger = logger;
        }

        // Helper method to get current user ID from JWT claims
        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                // This should not happen if [Authorize] is working correctly
                throw new InvalidOperationException("User ID not found in token.");
            }
            return userId;
        }

        // POST: api/trainingsessions
        [HttpPost]
        public async Task<ActionResult<TrainingSessionDetailDto>> CreateTrainingSession(TrainingSessionCreateDto createDto)
        {
            var userId = GetCurrentUserId();
            var newSession = new TrainingSession
            {
                UserId = userId,
                Date = createDto.Date.Date,
                Notes = createDto.Notes,
                Exercises = createDto.Exercises.Select(exDto => new Exercise
                {
                    Name = exDto.Name,
                    Notes = exDto.Notes,
                    // Creează seturile pe baza datelor din DTO
                    Sets = Enumerable.Range(1, exDto.Sets > 0 ? exDto.Sets : 1) // Generează numere de la 1 la exDto.Sets (minim 1)
                                     .Select(setNum =>
                                     {
                                         // --- Remove DEBUG LOGGING and parsing ---
                                         Console.WriteLine($"[DEBUG] Creating Set {setNum} for Exercise '{exDto.Name}'"); // Keep for now
                                         // bool repsParsed = int.TryParse(exDto.Reps?.Trim(), out int reps); // Remove parsing
                                         bool weightParsed = double.TryParse(exDto.Weight?.Trim(), out double weight); // Keep weight parsing
                                         // Console.WriteLine($"[DEBUG]   Reps Parsed: {repsParsed}, Value: {(repsParsed ? reps : 0)}");
                                         Console.WriteLine($"[DEBUG]   Weight Parsed: {weightParsed}, Value: {(weightParsed ? weight : 0.0)}");

                                         return new ExerciseSet
                                         {
                                             SetNumber = setNum, // Folosește numărul generat
                                             // Assign string directly, ensuring it's not null
                                             Repetitions = exDto.Reps?.Trim() ?? string.Empty,
                                             Weight = weightParsed ? weight : 0.0
                                         };
                                     }).ToList()
                }).ToList()
            };
            _context.TrainingSessions.Add(newSession);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException /* ex */)
            {
                return StatusCode(500, "An error occurred while saving the training session.");
            }

            // Returnăm DTO-ul detaliat, inclusiv exercițiile create (cu ID-uri)
            // Trebuie să re-citim din context pentru a include ID-urile generate
            var createdSession = await _context.TrainingSessions
                .Include(ts => ts.Exercises)
                    .ThenInclude(e => e.Sets)
                .Where(ts => ts.Id == newSession.Id)
                .Select(MapToDetailDto()) // Folosim o funcție de mapare
                .FirstOrDefaultAsync();

            if (createdSession == null)
            {
                // Ceva a mers foarte prost dacă nu o găsim imediat după creare
                return StatusCode(500, "Failed to retrieve created session.");
            }

            return CreatedAtAction(nameof(GetTrainingSessionById), new { id = createdSession.Id }, createdSession);
        }

        // GET: api/trainingsessions/by-date?date={YYYY-MM-DD}
        [HttpGet("by-date")]
        public async Task<ActionResult<TrainingSessionDetailDto>> GetTrainingSessionByDate([FromQuery] DateTime date)
        {
            var userId = GetCurrentUserId();
            var targetDate = date.Date;

            try
            {
                var session = await _context.TrainingSessions
                   .Include(ts => ts.Exercises)
                       .ThenInclude(e => e.Sets)
                   .Where(ts => ts.UserId == userId && ts.Date == targetDate)
                   .Select(MapToDetailDto())
                   .FirstOrDefaultAsync();

                return Ok(session);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching session by date {targetDate}: {ex.Message}");
                return StatusCode(500, "An error occurred while fetching the training session.");
            }
        }

        // GET: api/trainingsessions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TrainingSessionDto>>> GetTrainingSessions()
        {
            var userId = GetCurrentUserId();

            var sessions = await _context.TrainingSessions
                .Where(ts => ts.UserId == userId)
                .OrderByDescending(ts => ts.Date) // Order by date, newest first
                .Select(ts => new TrainingSessionDto // Project to DTO
                {
                    Id = ts.Id,
                    Date = ts.Date,
                    Notes = ts.Notes
                })
                .ToListAsync();

            return Ok(sessions);
        }

        // GET: api/trainingsessions/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<TrainingSessionDetailDto>> GetTrainingSessionById(Guid id)
        {
            var userId = GetCurrentUserId();

            var session = await _context.TrainingSessions
                .Include(ts => ts.Exercises) // Include Exercises
                    .ThenInclude(e => e.Sets) // Then include Sets within Exercises
                .Where(ts => ts.Id == id && ts.UserId == userId) // Ensure user owns the session
                .Select(ts => new TrainingSessionDetailDto // Project to Detail DTO
                {
                    Id = ts.Id,
                    Date = ts.Date,
                    Notes = ts.Notes,
                    Exercises = ts.Exercises.Select(e => new ExerciseDto
                    {
                        Id = e.Id,
                        Name = e.Name,
                        Notes = e.Notes,
                        Sets = e.Sets.OrderBy(s => s.SetNumber).Select(s => new ExerciseSetDto // Order sets by number
                        {
                            Id = s.Id,
                            SetNumber = s.SetNumber,
                            Repetitions = s.Repetitions,
                            Weight = s.Weight
                        }).ToList()
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            if (session == null)
            {
                return NotFound();
            }

            return Ok(session);
        }

        // --- Exercises Endpoints ---

        // POST: api/trainingsessions/{sessionId}/exercises
        [HttpPost("{sessionId}/exercises")]
        public async Task<ActionResult<ExerciseDto>> AddExerciseToSession(Guid sessionId, ExerciseCreateDto createDto)
        {
            var userId = GetCurrentUserId();

            // Verify the session exists and belongs to the user
            var session = await _context.TrainingSessions
                                    .FirstOrDefaultAsync(ts => ts.Id == sessionId && ts.UserId == userId);

            if (session == null)
            {
                return NotFound("Training session not found or access denied.");
            }

            var newExercise = new Exercise
            {
                TrainingSessionId = sessionId,
                Name = createDto.Name,
                Notes = createDto.Notes
            };

            _context.Exercises.Add(newExercise);
            await _context.SaveChangesAsync();

            // Map to DTO (without sets initially, as it's new)
            var exerciseDto = new ExerciseDto
            {
                Id = newExercise.Id,
                Name = newExercise.Name,
                Notes = newExercise.Notes
            };

            // Return 201 Created with the location (optional, could create a GetExerciseById method)
            return CreatedAtAction(nameof(GetExerciseById), new { sessionId = sessionId, exerciseId = newExercise.Id }, exerciseDto);
        }

        // GET: api/trainingsessions/{sessionId}/exercises
        [HttpGet("{sessionId}/exercises")]
        public async Task<ActionResult<IEnumerable<ExerciseDto>>> GetExercisesForSession(Guid sessionId)
        {
            var userId = GetCurrentUserId();

            // Verify the session exists and belongs to the user first
            if (!await _context.TrainingSessions.AnyAsync(ts => ts.Id == sessionId && ts.UserId == userId))
            {
                return NotFound("Training session not found or access denied.");
            }

            var exercises = await _context.Exercises
                .Include(e => e.Sets) // Include Sets
                .Where(e => e.TrainingSessionId == sessionId)
                .Select(e => new ExerciseDto // Project to DTO
                {
                    Id = e.Id,
                    Name = e.Name,
                    Notes = e.Notes,
                    Sets = e.Sets.OrderBy(s => s.SetNumber).Select(s => new ExerciseSetDto
                    {
                        Id = s.Id,
                        SetNumber = s.SetNumber,
                        Repetitions = s.Repetitions,
                        Weight = s.Weight
                    }).ToList()
                })
                .ToListAsync();

            return Ok(exercises);
        }

        // GET: api/trainingsessions/{sessionId}/exercises/{exerciseId}
        // (Helper endpoint for CreatedAtAction location)
        [HttpGet("{sessionId}/exercises/{exerciseId}")]
        public async Task<ActionResult<ExerciseDto>> GetExerciseById(Guid sessionId, Guid exerciseId)
        {
            var userId = GetCurrentUserId();

            var exercise = await _context.Exercises
                .Include(e => e.Sets)
                .Where(e => e.Id == exerciseId && e.TrainingSession.UserId == userId && e.TrainingSessionId == sessionId)
                .Select(e => new ExerciseDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    Notes = e.Notes,
                    Sets = e.Sets.OrderBy(s => s.SetNumber).Select(s => new ExerciseSetDto
                    {
                        Id = s.Id,
                        SetNumber = s.SetNumber,
                        Repetitions = s.Repetitions,
                        Weight = s.Weight
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            if (exercise == null)
            {
                return NotFound();
            }

            return Ok(exercise);
        }


        // --- Exercise Sets Endpoints ---

        // POST: api/trainingsessions/{sessionId}/exercises/{exerciseId}/sets
        [HttpPost("{sessionId}/exercises/{exerciseId}/sets")]
        public async Task<ActionResult<ExerciseSetDto>> AddSetToExercise(Guid sessionId, Guid exerciseId, ExerciseSetCreateDto createDto)
        {
            var userId = GetCurrentUserId();

            // Verify the exercise exists, belongs to the session, and the session belongs to the user
            var exercise = await _context.Exercises
                                   .FirstOrDefaultAsync(e => e.Id == exerciseId && e.TrainingSessionId == sessionId && e.TrainingSession.UserId == userId);

            if (exercise == null)
            {
                return NotFound("Exercise not found in the specified session or access denied.");
            }

            var newSet = new ExerciseSet
            {
                ExerciseId = exerciseId,
                SetNumber = createDto.SetNumber,
                Repetitions = createDto.Repetitions?.Trim() ?? string.Empty, // Assign string directly
                Weight = createDto.Weight // Assume Weight in createDto is already double
            };

            _context.ExerciseSets.Add(newSet);
            await _context.SaveChangesAsync();

            var setDto = new ExerciseSetDto
            {
                Id = newSet.Id,
                SetNumber = newSet.SetNumber,
                Repetitions = newSet.Repetitions,
                Weight = newSet.Weight
            };

            // Return 201 Created (Location header might be less critical here)
            // We could create a GetSetById if needed for the location.
            return StatusCode(201, setDto);
        }

        // We could add GET endpoints for sets too if needed, similar to exercises

        // --- DELETE Endpoints ---

        // DELETE: api/trainingsessions/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTrainingSession(Guid id)
        {
            var userId = GetCurrentUserId();

            // Găsim sesiunea (nu e nevoie să includem copii, îi șterge în cascadă EF)
            var sessionToDelete = await _context.TrainingSessions
                                        .FirstOrDefaultAsync(ts => ts.Id == id && ts.UserId == userId);

            if (sessionToDelete == null)
            { return NotFound(); }

            _context.TrainingSessions.Remove(sessionToDelete);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException /* ex */)
            {
                return StatusCode(500, "An error occurred while deleting the training session.");
            }

            return NoContent(); // Standard pentru DELETE reușit
        }

        // DELETE: api/trainingsessions/{sessionId}/exercises/{exerciseId}
        [HttpDelete("{sessionId}/exercises/{exerciseId}")]
        public async Task<IActionResult> DeleteExerciseFromSession(Guid sessionId, Guid exerciseId)
        {
            var userId = GetCurrentUserId();

            // Find the exercise, ensuring it's in the correct session owned by the user
            var exercise = await _context.Exercises
                                   .FirstOrDefaultAsync(e => e.Id == exerciseId && e.TrainingSessionId == sessionId && e.TrainingSession.UserId == userId);

            if (exercise == null)
            {
                return NotFound();
            }

            _context.Exercises.Remove(exercise);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/trainingsessions/{sessionId}/exercises/{exerciseId}/sets/{setId}
        [HttpDelete("{sessionId}/exercises/{exerciseId}/sets/{setId}")]
        public async Task<IActionResult> DeleteSetFromExercise(Guid sessionId, Guid exerciseId, Guid setId)
        {
            var userId = GetCurrentUserId();

            // Find the set, ensuring it's in the correct exercise within the correct session owned by the user
            var set = await _context.ExerciseSets
                                .FirstOrDefaultAsync(s => s.Id == setId && s.ExerciseId == exerciseId && s.Exercise.TrainingSessionId == sessionId && s.Exercise.TrainingSession.UserId == userId);

            if (set == null)
            {
                return NotFound();
            }

            _context.ExerciseSets.Remove(set);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // --- PUT Endpoints ---

        // PUT: api/trainingsessions/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTrainingSession(Guid id, TrainingSessionUpdateDto updateDto)
        {
            var userId = GetCurrentUserId();
            var existingSession = await _context.TrainingSessions
                .Include(ts => ts.Exercises).ThenInclude(e => e.Sets)
                .FirstOrDefaultAsync(ts => ts.Id == id && ts.UserId == userId);

            if (existingSession == null)
            {
                return NotFound();
            }

            // Ștergem exercițiile și seturile vechi (strategie simplă)
            // Atenție: Aceasta poate fi ineficientă. O strategie de update ar fi mai bună.
            foreach (var exercise in existingSession.Exercises.ToList()) // Iterăm pe copie
            {
                _context.ExerciseSets.RemoveRange(exercise.Sets);
                _context.Exercises.Remove(exercise);
            }
            // Am putea face SaveChanges aici sau la final

            // Actualizăm datele sesiunii
            existingSession.Date = updateDto.Date.Date;
            existingSession.Notes = updateDto.Notes;

            // Adăugăm noile exerciții și seturi (mapaj similar cu cel de la POST)
            existingSession.Exercises = updateDto.Exercises.Select(exDto => new Exercise
            {
                Name = exDto.Name,
                Notes = exDto.Notes,
                Sets = Enumerable.Range(1, exDto.Sets > 0 ? exDto.Sets : 1) // Generează numere de la 1 la exDto.Sets (minim 1)
                                 .Select(setNum =>
                                 {
                                     // --- Remove DEBUG LOGGING and parsing ---
                                     Console.WriteLine($"[DEBUG] Updating/Creating Set {setNum} for Exercise '{exDto.Name}'"); // Keep for now
                                     // bool repsParsed = int.TryParse(exDto.Reps?.Trim(), out int reps); // Remove parsing
                                     bool weightParsed = double.TryParse(exDto.Weight?.Trim(), out double weight); // Keep weight parsing
                                     // Console.WriteLine($"[DEBUG]   Reps Parsed: {repsParsed}, Value: {(repsParsed ? reps : 0)}");
                                     Console.WriteLine($"[DEBUG]   Weight Parsed: {weightParsed}, Value: {(weightParsed ? weight : 0.0)}");

                                     return new ExerciseSet
                                     {
                                         SetNumber = setNum, // Folosește numărul generat
                                         // Assign string directly, ensuring it's not null
                                         Repetitions = exDto.Reps?.Trim() ?? string.Empty,
                                         Weight = weightParsed ? weight : 0.0
                                     };
                                 }).ToList()
            }).ToList();

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException) { throw; }
            catch (DbUpdateException /* ex */)
            {
                return StatusCode(500, "An error occurred while updating the training session.");
            }

            return NoContent(); // Standardul pentru PUT reușit fără conținut returnat
        }

        // PUT: api/trainingsessions/{sessionId}/exercises/{exerciseId}
        [HttpPut("{sessionId}/exercises/{exerciseId}")]
        public async Task<IActionResult> UpdateExerciseInSession(Guid sessionId, Guid exerciseId, ExerciseUpdateDto updateDto)
        {
            var userId = GetCurrentUserId();

            var exercise = await _context.Exercises
                                   .FirstOrDefaultAsync(e => e.Id == exerciseId && e.TrainingSessionId == sessionId && e.TrainingSession.UserId == userId);

            if (exercise == null)
            {
                return NotFound();
            }

            // Update properties
            exercise.Name = updateDto.Name;
            exercise.Notes = updateDto.Notes;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.Exercises.AnyAsync(e => e.Id == exerciseId))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // PUT: api/trainingsessions/{sessionId}/exercises/{exerciseId}/sets/{setId}
        [HttpPut("{sessionId}/exercises/{exerciseId}/sets/{setId}")]
        public async Task<IActionResult> UpdateSetInExercise(Guid sessionId, Guid exerciseId, Guid setId, ExerciseSetUpdateDto updateDto)
        {
            var userId = GetCurrentUserId();

            var set = await _context.ExerciseSets
                               .FirstOrDefaultAsync(s => s.Id == setId && s.ExerciseId == exerciseId && s.Exercise.TrainingSessionId == sessionId && s.Exercise.TrainingSession.UserId == userId);

            if (set == null)
            {
                return NotFound();
            }

            // Update properties
            set.SetNumber = updateDto.SetNumber;
            set.Repetitions = updateDto.Repetitions?.Trim() ?? string.Empty; // Assign string directly
            set.Weight = updateDto.Weight;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.ExerciseSets.AnyAsync(s => s.Id == setId))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // --- Alte Endpoints (GET Id, Month etc.) ---

        // GET: api/trainingsessions/month?month=X&year=Y
        [HttpGet("month")]
        public async Task<ActionResult<IEnumerable<DateTime>>> GetWorkoutDaysForMonth([FromQuery] int year, [FromQuery] int month)
        {
            var userId = GetCurrentUserId();
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1);

            var dates = await _context.TrainingSessions
                .Where(ts => ts.UserId == userId && ts.Date >= startDate && ts.Date < endDate)
                .Select(ts => ts.Date.Date) // Selectăm doar data
                .Distinct() // Luăm doar datele unice
                .ToListAsync();

            return Ok(dates);
        }

        // Funcție privată de mapare pentru a evita repetiția
        private static System.Linq.Expressions.Expression<Func<TrainingSession, TrainingSessionDetailDto>> MapToDetailDto()
        {
            return ts => new TrainingSessionDetailDto
            {
                Id = ts.Id,
                Date = ts.Date,
                Notes = ts.Notes,
                Exercises = ts.Exercises.Select(e => new ExerciseDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    Notes = e.Notes,
                    Sets = e.Sets.OrderBy(s => s.SetNumber).Select(s => new ExerciseSetDto
                    {
                        Id = s.Id,
                        SetNumber = s.SetNumber,
                        Repetitions = s.Repetitions,
                        Weight = s.Weight
                    }).ToList()
                }).ToList()
            };
        }
    }
}