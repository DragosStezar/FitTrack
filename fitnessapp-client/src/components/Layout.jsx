import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom'; // Outlet renders nested routes, Added useLocation
import { useAuth } from '../context/AuthContext'; // Import useAuth
import styles from './Layout.module.css'; // Import CSS Module
import logoImage from '../assets/dumbbell-logo.png'; // Import the logo image

function Layout() {
    const { isLoggedIn, userInfo, logout } = useAuth(); // Get auth state and functions
    const location = useLocation(); // Get location object
    // console.log('[Layout] Rendering with auth state:', { isLoggedIn, userInfo }); // Log for debugging
    // console.log('[Layout] Current location:', location.pathname);

    return (
        <div>
            {/* <p>DEBUG: User is logged in? {isLoggedIn ? 'YES' : 'NO'}</p> */}
            <header className={styles.navbar}> { /* Aplicăm clasa navbar */}
                <Link to="/" className={styles.logo}>
                    <span className={styles.logoContainer}> {/* Added span container */}
                        <img src={logoImage} alt="FitTrack Logo" className={styles.logoImage} /> {/* Added logo image */}
                        FitTrack
                    </span>
                </Link>
                <div className={styles.navLinks}>
                    {isLoggedIn ? (
                        <>
                            {/* <li><Link to="/dashboard">Dashboard</Link></li> */}
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
                                    `${location.pathname === '/' ? ' ' + styles.homeHover : ''}` // Add homeHover class on home page
                                }
                            >
                                Login
                            </Link>
                            <Link to="/register">
                                <button
                                    className={
                                        `${styles.navButton}` +
                                        `${location.pathname === '/register' ? ' ' + styles.active : ''}` +
                                        `${location.pathname === '/' ? ' ' + styles.homeHover : ''}` // Add homeHover class on home page
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
                <Outlet /> { /* Child routes will render here */}
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