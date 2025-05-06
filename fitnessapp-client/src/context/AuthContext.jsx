import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';


const AuthContext = createContext(null);

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
            localStorage.removeItem('userInfo');
            return null;
        }
    });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (authToken) {
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        } else {
            delete axiosInstance.defaults.headers.common['Authorization'];
        }
    }, [authToken]);

    const logout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        setAuthToken(null);
        setUserInfo(null);
        delete axiosInstance.defaults.headers.common['Authorization'];
        navigate('/login');
    }, [navigate]);

    const refreshUserInfo = useCallback(async () => {
        const currentToken = localStorage.getItem('authToken');
        if (!currentToken) {
            console.log("[refreshUserInfo] No auth token found in localStorage.");
            delete axiosInstance.defaults.headers.common['Authorization'];
            return;
        }

        setIsLoading(true);

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
            setIsLoading(false);
        }
    }, [logout]);

    const login = useCallback(async (loginCredentials) => {
        try {
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

    const handleExternalLogin = useCallback((token) => {
        if (!token) {
            console.error("[AuthContext] No token provided to handleExternalLogin");
            return false;
        }

        try {
            console.log("[AuthContext] Processing external token");

            let decoded;
            try {
                decoded = jwtDecode(token);
                console.log("[AuthContext] Token decoded successfully:", decoded);
            } catch (decodeErr) {
                console.error("[AuthContext] Failed to decode token:", decodeErr);
                return false;
            }

            const currentTime = Date.now() / 1000;
            if (decoded.exp && decoded.exp < currentTime) {
                console.error("[AuthContext] Token has expired");
                return false;
            }

            const userData = {
                username: decoded.unique_name || decoded.name || decoded.email?.split('@')[0] || 'User',
                email: decoded.email || 'N/A',
                userType: decoded.role || decoded.typ || 'Basic',
                userId: decoded.sub || null
            };

            console.log("[AuthContext] Extracted user data:", userData);

            localStorage.setItem('authToken', token);
            localStorage.setItem('userInfo', JSON.stringify(userData));

            setAuthToken(token);
            setUserInfo(userData);

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