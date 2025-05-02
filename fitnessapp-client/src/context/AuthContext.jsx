import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
// import axios from 'axios'; // <-- Nu mai folosim axios global direct
import axiosInstance from '../api/axiosInstance'; // <-- Importăm instanța configurată
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// const API_URL = 'http://localhost:5276/api'; // <-- Eliminăm URL-ul hardcodat

// Create the context
const AuthContext = createContext(null);

// Custom hook to use the auth context easily
export const useAuth = () => {
    return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
    const [userInfo, setUserInfo] = useState(() => {
        const storedUserInfo = localStorage.getItem('userInfo');
        try {
            return storedUserInfo ? JSON.parse(storedUserInfo) : null;
        } catch (error) {
            console.error("Failed to parse user info from localStorage", error);
            localStorage.removeItem('userInfo'); // Clear corrupted data
            return null;
        }
    });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Effect to update axios headers when token changes - ACUM FOLOSEȘTE axiosInstance!
    useEffect(() => {
        if (authToken) {
            // Setăm header-ul pe instanța folosită pentru request-uri
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        } else {
            delete axiosInstance.defaults.headers.common['Authorization'];
        }
    }, [authToken]);

    // Logout function - încadrat în useCallback
    const logout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        setAuthToken(null);
        setUserInfo(null);
        // Stergem header-ul la logout
        delete axiosInstance.defaults.headers.common['Authorization'];
        navigate('/login');
        // Dependințe: navigate
    }, [navigate]);

    // Funcție nouă pentru a reîncărca datele utilizatorului
    const refreshUserInfo = useCallback(async () => {
        const currentToken = localStorage.getItem('authToken');
        if (!currentToken) {
            console.log("[refreshUserInfo] No auth token found in localStorage.");
            delete axiosInstance.defaults.headers.common['Authorization'];
            return; // Nu setăm isLoading dacă nu facem request
        }

        setIsLoading(true); // <-- Setăm isLoading true la început

        // Setăm explicit header-ul pe instanță ÎNAINTE de request
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;

        try {
            const response = await axiosInstance.get('/auth/me');
            if (response.data) {
                const newUserInfo = {
                    username: response.data.username,
                    email: response.data.email,
                    userType: response.data.userType,
                    userId: response.data.userId
                };
                localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
                setUserInfo(newUserInfo);
            } else {
                console.error('Refresh user info successful, but no data received.');
            }
        } catch (error) {
            console.error('[refreshUserInfo] Error caught during refresh:', error);
        } finally {
            setIsLoading(false); // <-- Setăm isLoading false indiferent de rezultat
        }
    }, [logout]); // `logout` este dependență pentru cazul 401 din interceptor

    // Login function - ACUM FOLOSEȘTE axiosInstance!
    const login = useCallback(async (loginCredentials) => {
        try {
            // Folosim axiosInstance care are baseURL='/api' și interceptori
            const response = await axiosInstance.post(`/auth/login`, loginCredentials);
            if (response.data.token) {
                const token = response.data.token;
                const userData = {
                    username: response.data.username,
                    email: response.data.email,
                    userType: response.data.userType
                };
                localStorage.setItem('authToken', token);
                localStorage.setItem('userInfo', JSON.stringify(userData));
                setAuthToken(token);
                setUserInfo(userData);
                return true;
            } else {
                console.error('Login successful, but no token received.');
                return false;
            }
        } catch (error) {
            console.error('Login request failed:', error);
            throw error;
        }
    }, []);

    // External Login function - încadrat în useCallback
    const handleExternalLogin = useCallback((token) => {
        if (!token) {
            console.error("[AuthContext] No token provided to handleExternalLogin");
            return false;
        }

        try {
            console.log("[AuthContext] Processing external token");

            // Decodăm token-ul
            let decoded;
            try {
                decoded = jwtDecode(token);
                console.log("[AuthContext] Token decoded successfully:", decoded);
            } catch (decodeErr) {
                console.error("[AuthContext] Failed to decode token:", decodeErr);
                return false;
            }

            // Verificăm validitatea token-ului
            const currentTime = Date.now() / 1000;
            if (decoded.exp && decoded.exp < currentTime) {
                console.error("[AuthContext] Token has expired");
                return false;
            }

            // Extragem informațiile utilizatorului din token
            const userData = {
                username: decoded.unique_name || decoded.name || decoded.email?.split('@')[0] || 'User',
                email: decoded.email || 'N/A',
                userType: decoded.role || decoded.typ || 'Basic',
                userId: decoded.sub || null
            };

            console.log("[AuthContext] Extracted user data:", userData);

            // Salvăm datele în localStorage și state
            localStorage.setItem('authToken', token);
            localStorage.setItem('userInfo', JSON.stringify(userData));

            // Setăm datele în context
            setAuthToken(token);
            setUserInfo(userData);

            // Actualizăm și header-ul Authorization pentru request-uri
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            console.log("[AuthContext] External authentication successful");
            return true;
        } catch (error) {
            console.error("[AuthContext] Failed to process external token:", error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userInfo');
            setAuthToken(null);
            setUserInfo(null);
            return false;
        }
    }, []);

    // Value provided by the context
    const value = {
        authToken,
        userInfo,
        isLoading,
        isLoggedIn: !!authToken,
        login,
        logout,
        handleExternalLogin,
        refreshUserInfo
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 