import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Importă hook-ul customizat

function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { handleExternalLogin } = useAuth(); // Folosește hook-ul pentru a accesa funcția
    const [error, setError] = useState('');
    const [status, setStatus] = useState('Processing authentication...');

    useEffect(() => {
        const processAuth = () => {
            console.log("AuthCallback URL:", window.location.href);
            console.log("All search params:", Object.fromEntries([...searchParams]));

            const token = searchParams.get('token');

            if (token) {
                console.log("Token found:", token.substring(0, 20) + "...");
                try {
                    const success = handleExternalLogin(token);
                    if (success) {
                        setStatus("Authentication successful, redirecting...");
                        setTimeout(() => navigate('/workouts', { replace: true }), 500);
                    } else {
                        setError("Failed to process authentication token");
                        setStatus("Authentication failed");
                        setTimeout(() => navigate('/login', { replace: true }), 2000);
                    }
                } catch (err) {
                    console.error("Error processing token:", err);
                    setError("Error: " + (err.message || "Unknown error processing token"));
                    setStatus("Authentication error");
                    setTimeout(() => navigate('/login', { replace: true }), 2000);
                }
            } else {
                console.error("No token found in URL");
                setError("No authentication token found");
                setStatus("Authentication failed");
                setTimeout(() => navigate('/login', { replace: true }), 2000);
            }
        };

        processAuth();
    }, [searchParams, navigate, handleExternalLogin]);

    // Afișăm un mesaj de încărcare sau eroare
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            padding: '20px',
            textAlign: 'center'
        }}>
            <h2>{status}</h2>
            {error && (
                <div style={{
                    marginTop: '20px',
                    color: 'red',
                    maxWidth: '80%',
                    padding: '15px',
                    backgroundColor: '#ffeeee',
                    borderRadius: '5px'
                }}>
                    {error}
                </div>
            )}
        </div>
    );
}

export default AuthCallback; 