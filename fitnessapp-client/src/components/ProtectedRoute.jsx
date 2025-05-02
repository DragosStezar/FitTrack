import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// const PREMIUM_USER_TYPE = 'Premium'; // <-- Nu mai verificăm tipul aici

// Componenta verifică DOAR dacă utilizatorul este logat
const ProtectedRoute = ({ children }) => {
    // Obținem doar isLoggedIn și isLoading (pentru a afișa ceva în timpul verificării inițiale)
    const { isLoggedIn, isLoading } = useAuth();
    const location = useLocation();

    // Afișăm ceva generic cât timp contextul se încarcă (dacă implementezi asta)
    // Sau poți verifica doar isLoggedIn direct
    if (isLoading) { // Verificarea isLoading rămâne utilă
        return <div>Checking authentication...</div>;
    }

    // === DEBUG: Log state values AFTER loading ===
    // ============================================

    // Verificăm DOAR dacă utilizatorul este logat
    if (!isLoggedIn) {
        // Redirectăm la login dacă nu e logat
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Dacă este logat, randăm componenta copil (pagina reală, care își va face propria verificare de tip)
    return children;
};

export default ProtectedRoute; 