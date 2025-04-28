import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './LoginPage.module.css';
import logoImage from '../assets/dumbbell-logo.png';
import { FaGoogle } from 'react-icons/fa';
import { MdOutlineMailOutline, MdLockOutline } from 'react-icons/md';

function LoginPage() {
    const [loginInput, setLoginInput] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const success = await login({ login: loginInput, password: password });
            if (success) {
                console.log('Login successful');
                navigate('/workouts', { replace: true });
            } else {
                setError('Login failed unexpectedly.');
            }
        } catch (err) {
            console.error('Login failed:', err);
            setError(err.response?.data?.message || err.response?.data || err.message || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        // Folosim calea relativă pentru a folosi proxy-ul Vite corect
        const googleLoginPath = '/api/auth/google-login';
        console.log('Redirecting to Google login via proxy:', googleLoginPath);
        window.location.href = googleLoginPath;
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.loginBox}>
                <img src={logoImage} alt="FitTrack Logo" className={styles.logo} />
                <h1 className={styles.title}>FitTrack</h1>
                <p className={styles.subtitle}>Track your fitness journey</p>

                <form onSubmit={handleSubmit} className={styles.loginForm}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="login" className={styles.label}>Email</label>
                        <div className={styles.inputWrapper}>
                            <MdOutlineMailOutline className={styles.inputIcon} />
                            <input
                                type="text"
                                id="login"
                                value={loginInput}
                                onChange={(e) => setLoginInput(e.target.value)}
                                placeholder="your@email.com"
                                required
                                className={styles.input}
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password" className={styles.label}>Password</label>
                        <div className={styles.inputWrapper}>
                            <MdLockOutline className={styles.inputIcon} />
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="********"
                                required
                                className={styles.input}
                            />
                        </div>
                    </div>

                    <div className={styles.optionsRow}>
                        <div className={styles.rememberMe}>
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className={styles.checkbox}
                            />
                            <label htmlFor="rememberMe">Remember me</label>
                        </div>
                    </div>

                    {error && <p className={styles.errorText}>{error}</p>}

                    <button type="submit" disabled={loading} className={styles.signInButton}>
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <p className={styles.signUpText}>
                    Don't have an account? <Link to="/register" className={styles.signUpLink}>Sign up</Link>
                </p>

                <div className={styles.divider}></div>

                <button
                    type="button"
                    className={`${styles.socialButton} ${styles.googleButton}`}
                    onClick={handleGoogleLogin}
                >
                    <FaGoogle className={styles.socialIcon} /> Continue with Google
                </button>
            </div>
        </div>
    );
}

export default LoginPage; 