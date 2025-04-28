using Stripe;
using Stripe.Checkout;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.Collections.Generic; // Added for List
using System;

namespace FitnessApp.Api.Services
{
    public class StripeService
    {
        private readonly string _secretKey;
        private readonly string _publishableKey;
        private readonly string _domain; // Add a field for your frontend domain

        public StripeService(IConfiguration configuration)
        {
            // Read configuration values and throw if missing
            _secretKey = configuration["Stripe:SecretKey"]
                ?? throw new InvalidOperationException("Stripe:SecretKey is not configured.");
            _publishableKey = configuration["Stripe:PublishableKey"]
                 ?? throw new InvalidOperationException("Stripe:PublishableKey is not configured.");
            _domain = configuration["FrontendDomain"]
                ?? throw new InvalidOperationException("FrontendDomain is not configured.");

            StripeConfiguration.ApiKey = _secretKey;
        }

        public async Task<Session> CreateCheckoutSessionAsync(string priceId, string successUrl, string cancelUrl, string userEmail)
        {
            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string>
                {
                    "card",
                },
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions
                    {
                        Price = priceId, // Price ID from your Stripe Dashboard
                        Quantity = 1,
                    },
                },
                Mode = "payment", // Use "subscription" for recurring payments
                SuccessUrl = successUrl, // URL to redirect after successful payment
                CancelUrl = cancelUrl,   // URL to redirect after cancelled payment
                CustomerEmail = userEmail, // Pre-fill customer email
                // You might want to add metadata here, like UserId, to identify the user after payment
                // Metadata = new Dictionary<string, string> { { "UserId", userId } }
            };

            var service = new SessionService();
            Session session = await service.CreateAsync(options);
            return session;
        }

        public string GetPublishableKey()
        {
            return _publishableKey;
        }
    }
}