import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import styles from '../pages/WorkoutsPage.module.css';

let stripePromise;

const PremiumCheckoutButton = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [publishableKey, setPublishableKey] = useState(null);

    const priceId = 'price_1RISmc4Nmi1ay7sY1FQfFhaR';

    // 1. Obține Publishable Key de la backend
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch('/api/payment/config');

                if (!response.ok) {
                    throw new Error(`Failed to fetch Stripe config (${response.status})`);
                }
                const { publishableKey } = await response.json();

                if (!publishableKey) {
                    throw new Error('Publishable key not received from backend.');
                }

                setPublishableKey(publishableKey);
                if (publishableKey && !stripePromise) {
                    stripePromise = loadStripe(publishableKey);
                    console.log("Stripe initialized.");
                }
            } catch (err) {
                console.error("Error fetching Stripe config:", err);
                setError(`Failed to load payment configuration: ${err.message}`);
            }
        };
        fetchConfig();
    }, []);

    const handleCheckout = async () => {
        if (!publishableKey || !stripePromise) {
            setError("Stripe is not initialized yet. Please wait or refresh.");
            console.error("Stripe not initialized. PK:", publishableKey, "Promise:", stripePromise);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const stripe = await stripePromise;
            if (!stripe) {
                throw new Error("Stripe.js failed to load.");
            }


            const token = localStorage.getItem('authToken');
            if (!token) {
                setError("Authentication required. Please log in.");
                setLoading(false);
                return;
            }

            const response = await fetch('/api/payment/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ priceId: priceId })
            });

            if (!response.ok) {
                let errorMsg = `Failed to create checkout session (${response.status})`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorData.title || errorMsg;
                } catch (jsonError) {
                    errorMsg = `${errorMsg}. Could not parse error response.`;
                }
                throw new Error(errorMsg);
            }

            const { sessionId } = await response.json();
            if (!sessionId) {
                throw new Error("Session ID not received from backend.");
            }
            console.log("Received Session ID:", sessionId);

            const { error: stripeRedirectError } = await stripe.redirectToCheckout({
                sessionId: sessionId
            });

            if (stripeRedirectError) {
                console.error("Stripe redirectToCheckout error:", stripeRedirectError);
                throw new Error(stripeRedirectError.message || "An error occurred during redirection to Stripe.");
            }

        } catch (err) {
            console.error("Checkout process error:", err);
            setError(err.message || "An unexpected error occurred during checkout.");
        } finally {
            setLoading(false);
        }
    };

    if (!publishableKey && !error) {
        return <div className={styles.premiumButton} style={{ opacity: 0.5, cursor: 'default' }}>Loading...</div>;
    }

    return (
        <button
            onClick={handleCheckout}
            className={styles.premiumButton}
            disabled={loading || !publishableKey || !!error}
            title={error ? error : 'Upgrade to Premium'}
        >
            {loading ? 'Processing...' : 'Upgrade to Premium'}
        </button>
    );
};

export default PremiumCheckoutButton; 