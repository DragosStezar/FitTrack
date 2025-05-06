import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Layout.module.css';
import logoImage from '../assets/dumbbell-logo.png';

function Layout() {
    const { isLoggedIn, userInfo, logout } = useAuth();
    const location = useLocation();

    return (
        <div>
            { }
            <header className={styles.navbar}> { }
                <Link to="/" className={styles.logo}>
                    <span className={styles.logoContainer}> { }
                        <img src={logoImage} alt="FitTrack Logo" className={styles.logoImage} /> { }
                        FitTrack
                    </span>
                </Link>
                <div className={styles.navLinks}>
                    {isLoggedIn ? (
                        <>
                            { }
                            <span>Welcome, {userInfo?.username || 'User'}!</span>
                            <button onClick={logout} className={`${styles.navButton} ${styles.logoutButton}`}>Logout</button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className={
                                    `${styles.navLink}` +
                                    `${location.pathname === '/login' ? ' ' + styles.active : ''}` +
                                    `${location.pathname === '/' ? ' ' + styles.homeHover : ''}`
                                }
                            >
                                Login
                            </Link>
                            <Link to="/register">
                                <button
                                    className={
                                        `${styles.navButton}` +
                                        `${location.pathname === '/register' ? ' ' + styles.active : ''}` +
                                        `${location.pathname === '/' ? ' ' + styles.homeHover : ''}`
                                    }
                                >
                                    Register
                                </button>
                            </Link>
                        </>
                    )}
                </div>
            </header>

            <main>
                <Outlet /> { }
            </main>

            <footer className={styles.footer}>
                <div className={styles.footerLogo}>FitTrack</div>
                <div className={styles.footerLinks}>
                    <Link to="/about">About</Link>
                    <Link to="/contact">Contact</Link>
                    <Link to="/terms">Terms</Link>
                </div>
            </footer>
        </div>
    );
}

export default Layout; 