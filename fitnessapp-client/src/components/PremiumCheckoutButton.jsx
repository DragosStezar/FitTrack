import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import styles from '../pages/WorkoutsPage.module.css'; // Importăm stilurile unde am adăugat clasa

// Variabilă globală pentru Stripe (pentru a nu reîncărca la fiecare render)
let stripePromise;

const PremiumCheckoutButton = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [publishableKey, setPublishableKey] = useState(null);

    // --- Price ID configurat ---
    const priceId = 'price_1RISmc4Nmi1ay7sY1FQfFhaR'; // <-- Price ID-ul tău

    // 1. Obține Publishable Key de la backend
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                // IMPORTANT: Asigură-te că URL-ul este corect pentru mediul tău
                // Poate fi necesar să configurezi un proxy în vite.config.js sau să folosești URL-ul complet al backend-ului
                // Ex: const apiUrl = 'http://localhost:7240';
                // const response = await fetch(`${apiUrl}/api/payment/config`);
                const response = await fetch('/api/payment/config'); // Ajustează URL dacă e necesar

                if (!response.ok) {
                    throw new Error(`Failed to fetch Stripe config (${response.status})`);
                }
                const { publishableKey } = await response.json();

                if (!publishableKey) {
                    throw new Error('Publishable key not received from backend.');
                }

                setPublishableKey(publishableKey);
                // Inițializează Stripe doar după ce ai cheia
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
    }, []); // Rulează o singură dată la montarea componentei

    // 2. Funcția pentru a gestiona click-ul pe buton
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

            // --- AJUSTEAZĂ AICI: Obține token-ul JWT ---
            // Modifică linia de mai jos pentru a lua token-ul din sursa corectă
            // (localStorage, sessionStorage, context API, Redux state, Zustand, etc.)
            const token = localStorage.getItem('authToken'); // Corectat: Folosește cheia 'authToken' setată de AuthContext
            if (!token) {
                setError("Authentication required. Please log in.");
                // Poți adăuga logica de redirecționare către login aici
                // ex: window.location.href = '/login';
                setLoading(false);
                return; // Oprește procesul dacă nu există token
            }

            // 3. Apelează backend-ul pentru a crea sesiunea
            // IMPORTANT: Ajustează URL-ul dacă este necesar (vezi comentariul din useEffect)
            // const apiUrl = 'http://localhost:7240';
            // const response = await fetch(`${apiUrl}/api/payment/create-checkout-session`, { ... });
            const response = await fetch('/api/payment/create-checkout-session', { // Ajustează URL dacă e necesar
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Trimite token-ul
                },
                body: JSON.stringify({ priceId: priceId })
            });

            if (!response.ok) {
                // Încercăm să citim mesajul de eroare din JSON, dacă există
                let errorMsg = `Failed to create checkout session (${response.status})`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorData.title || errorMsg; // Încercăm diverse câmpuri comune pentru erori API
                } catch (jsonError) {
                    // Răspunsul nu a fost JSON sau a apărut o eroare la parsare
                    errorMsg = `${errorMsg}. Could not parse error response.`;
                }
                throw new Error(errorMsg);
            }

            const { sessionId } = await response.json();
            if (!sessionId) {
                throw new Error("Session ID not received from backend.");
            }
            console.log("Received Session ID:", sessionId);

            // 4. Redirecționează către Stripe Checkout
            const { error: stripeRedirectError } = await stripe.redirectToCheckout({
                sessionId: sessionId
            });

            // redirectToCheckout ar trebui să redirecționeze utilizatorul.
            // Codul de mai jos va rula DOAR dacă apare o eroare *înainte* de redirecționare (ex: sessionId invalid)
            if (stripeRedirectError) {
                console.error("Stripe redirectToCheckout error:", stripeRedirectError);
                throw new Error(stripeRedirectError.message || "An error occurred during redirection to Stripe.");
            }

        } catch (err) {
            console.error("Checkout process error:", err);
            setError(err.message || "An unexpected error occurred during checkout.");
        } finally {
            // Chiar dacă redirectToCheckout reușește, este posibil ca setLoading să rămână true
            // dacă utilizatorul închide tab-ul Stripe înainte de finalizare.
            // Consideră gestionarea stării loading/error în paginile de succes/cancel.
            setLoading(false);
        }
    };

    // Afișează un mesaj dacă cheia publicabilă încă nu s-a încărcat
    if (!publishableKey && !error) {
        return <div className={styles.premiumButton} style={{ opacity: 0.5, cursor: 'default' }}>Loading...</div>; // Mesaj de încărcare stilizat
    }

    return (
        <button
            onClick={handleCheckout}
            // Aplicăm clasa din WorkoutsPage.module.css
            className={styles.premiumButton}
            disabled={loading || !publishableKey || !!error}
            title={error ? error : 'Upgrade to Premium'} // Adaugăm title pentru erori
        >
            {loading ? 'Processing...' : 'Upgrade to Premium'}
        </button>
    );
};

export default PremiumCheckoutButton; 