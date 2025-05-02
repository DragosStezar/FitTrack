using Stripe;
using Stripe.Checkout;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace FitnessApp.Api.Services
{
    public class StripeService
    {
        private readonly string _secretKey;
        private readonly string _publishableKey;
        private readonly string _domain;

        public StripeService(IConfiguration configuration)
        {
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
                        Price = priceId,
                        Quantity = 1,
                    },
                },
                Mode = "payment",
                SuccessUrl = successUrl,
                CancelUrl = cancelUrl,
                CustomerEmail = userEmail,
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