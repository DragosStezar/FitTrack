import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import styles from './RegisterPage.module.css';
import logoImage from '../assets/dumbbell-logo.png';
import { FaGoogle } from 'react-icons/fa';
import { MdOutlineMailOutline, MdLockOutline, MdPersonOutline } from 'react-icons/md';

function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { handleExternalLogin } = useAuth();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            const response = await axiosInstance.post('/auth/register', {
                username: username,
                email: email,
                password: password
            });

            if (response.data && response.data.token) {
                console.log('Registration successful, token received.');
                const loginSuccess = handleExternalLogin(response.data.token);

                if (loginSuccess) {
                    setSuccessMessage('Registration successful! Redirecting...');
                    setUsername('');
                    setEmail('');
                    setPassword('');
                    setTimeout(() => navigate('/workouts', { replace: true }), 1500);
                } else {
                    setError('Registration successful, but failed to log you in. Please try logging in manually.');
                }
            } else {
                setError('Registration completed, but no authentication token received. Please try logging in manually.');
            }

        } catch (err) {
            console.error('Registration failed:', err);
            setError(err.response?.data?.message || err.response?.data || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        const googleLoginPath = '/api/auth/google-login';
        console.log('Redirecting to Google login via proxy:', googleLoginPath);
        window.location.href = googleLoginPath;
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.registerBox}>
                <img src={logoImage} alt="FitTrack Logo" className={styles.logo} />
                <h1 className={styles.title}>FitTrack</h1>
                <p className={styles.subtitle}>Create your account</p>

                <form onSubmit={handleSubmit} className={styles.registerForm}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="username" className={styles.label}>Username</label>
                        <div className={styles.inputWrapper}>
                            <MdPersonOutline className={styles.inputIcon} />
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                                required
                                minLength={3}
                                className={styles.input}
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="email" className={styles.label}>Email</label>
                        <div className={styles.inputWrapper}>
                            <MdOutlineMailOutline className={styles.inputIcon} />
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter email"
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
                                placeholder="Enter password"
                                required
                                minLength={6}
                                className={styles.input}
                            />
                        </div>
                    </div>

                    {error && <p className={styles.errorText}>{error}</p>}
                    {successMessage && <p className={styles.successText}>{successMessage}</p>}

                    <button type="submit" disabled={loading} className={styles.registerButton}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <p className={styles.signInText}>
                    Already have an account? <Link to="/login" className={styles.signInLink}>Sign in</Link>
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

export default RegisterPage; 