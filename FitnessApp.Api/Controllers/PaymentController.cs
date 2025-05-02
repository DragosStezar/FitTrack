using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using FitnessApp.Api.Services;
using FitnessApp.Api.Data;
using FitnessApp.Api.Models;
using Stripe;
using Stripe.Checkout;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.IO;
using Microsoft.EntityFrameworkCore;

namespace FitnessApp.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly StripeService _stripeService;
        private readonly string _frontendDomain;
        private readonly string _webhookSecret;
        private readonly FitnessAppDbContext _context;

        public PaymentController(StripeService stripeService, IConfiguration configuration, FitnessAppDbContext context)
        {
            _stripeService = stripeService;
            _context = context;
            _frontendDomain = configuration["FrontendDomain"]
                ?? throw new InvalidOperationException("FrontendDomain is not configured in appsettings.");
            _webhookSecret = configuration["Stripe:WebhookSecret"]
                ?? throw new InvalidOperationException("Stripe:WebhookSecret is not configured in appsettings.");
        }

        public class CreateCheckoutSessionRequest
        {
            public string? PriceId { get; set; }
        }

        [HttpPost("create-checkout-session")]
        [Authorize]
        public async Task<IActionResult> CreateCheckoutSession([FromBody] CreateCheckoutSessionRequest request)
        {
            if (string.IsNullOrEmpty(request?.PriceId))
            {
                return BadRequest("PriceId is required.");
            }

            var userEmail = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(userEmail))
            {
                return Unauthorized("User email not found in token.");
            }

            var successUrl = $"{_frontendDomain}/nutrition";
            var cancelUrl = $"{_frontendDomain}/payment-cancel";

            try
            {
                Session session = await _stripeService.CreateCheckoutSessionAsync(request.PriceId, successUrl, cancelUrl, userEmail);
                return Ok(new { sessionId = session.Id });
            }
            catch (StripeException ex)
            {
                Console.WriteLine($"Stripe error creating session: {ex.StripeError.Message}");
                return StatusCode(500, $"Stripe error: {ex.StripeError.Message}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating Stripe session: {ex.Message}");
                return StatusCode(500, "Internal server error creating checkout session.");
            }
        }

        [HttpGet("config")]
        public IActionResult GetStripeConfig()
        {
            try
            {
                var publishableKey = _stripeService.GetPublishableKey();
                return Ok(new { publishableKey });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting Stripe config: {ex.Message}");
                return StatusCode(500, "Internal server error getting Stripe config.");
            }
        }

        [HttpPost("webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> StripeWebhook()
        {
            var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();

            try
            {
                var stripeSignature = Request.Headers["Stripe-Signature"];

                var stripeEvent = EventUtility.ConstructEvent(
                    json,
                    stripeSignature,
                    _webhookSecret
                );

                Console.WriteLine($"---> Stripe Event Received: {stripeEvent.Type}");

                if (stripeEvent.Type == "checkout.session.completed")
                {
                    var session = stripeEvent.Data.Object as Session;

                    if (session?.PaymentStatus == "paid")
                    {
                        var customerEmail = session.CustomerEmail;

                        if (!string.IsNullOrEmpty(customerEmail))
                        {
                            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == customerEmail);

                            if (user != null)
                            {
                                user.Type = UserType.Premium;

                                _context.Users.Update(user);
                                await _context.SaveChangesAsync();

                                Console.WriteLine($"---> User {customerEmail} upgraded to Premium.");
                            }
                            else
                            {
                                Console.WriteLine($"---> ERROR: User with email {customerEmail} not found for successful payment.");
                            }
                        }
                        else
                        {
                            Console.WriteLine($"---> ERROR: Customer email not found in successful payment session {session.Id}.");
                        }
                    }
                    else
                    {
                        Console.WriteLine($"---> Session {session?.Id} completed but payment status is {session?.PaymentStatus}.");
                    }
                }
                else
                {
                    Console.WriteLine($"---> Unhandled event type: {stripeEvent.Type}");
                }

                return Ok();
            }
            catch (StripeException e)
            {
                Console.WriteLine($"Stripe Webhook Error: {e.Message}");
                return BadRequest();
            }
            catch (Exception e)
            {
                Console.WriteLine($"Webhook Processing Error: {e.Message}");
                return StatusCode(500);
            }
        }
    }
}