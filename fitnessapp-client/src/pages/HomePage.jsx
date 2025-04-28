import React from 'react';
import styles from './HomePage.module.css'; // Import CSS Module
import { Link } from 'react-router-dom'; // Pentru butonul "Începe acum"
import { useAuth } from '../context/AuthContext'; // Import useAuth
// Import Material Design icons
import { MdPerson, MdFitnessCenter, MdShowChart } from "react-icons/md";

function HomePage() {
    const { isLoggedIn } = useAuth(); // Get login status

    return (
        <div className={styles.pageContainer}>
            {/* Hero Section */}
            <section className={styles.heroSection}>
                <h1 className={styles.heroTitle}>
                    Organizează-ți progresul.<br />Antrenează-ți viitorul.
                </h1>
                <p className={styles.heroSubtitle}>
                    Planifică-ți antrenamentele și nutriția într-un singur loc.
                </p>
                {/* Conditional button based on login status */}
                {isLoggedIn ? (
                    <Link to="/workouts">
                        <button className={styles.heroButton}>View Workouts</button>
                    </Link>
                ) : (
                    <Link to="/register">
                        <button className={styles.heroButton}>Începe acum</button>
                    </Link>
                )}
            </section>

            {/* Features Section */}
            <section className={styles.featuresSection}>
                <h2 className={styles.featuresTitle}>Cum funcționează</h2>
                <div className={styles.featuresGrid}>
                    {/* Feature 1: Creează cont */}
                    <div className={styles.featureItem}>
                        <div className={styles.featureIconPlaceholder}>
                            <MdPerson />
                        </div>
                        <h3 className={styles.featureTitle}>Creează cont</h3>
                        <p className={styles.featureDescription}>
                            Înregistrează-te gratuit și configurează-ți profilul
                        </p>
                    </div>

                    {/* Feature 2: Loghează antrenamente */}
                    <div className={styles.featureItem}>
                        <div className={styles.featureIconPlaceholder}>
                            <MdFitnessCenter />
                        </div>
                        <h3 className={styles.featureTitle}>Loghează antrenamente</h3>
                        <p className={styles.featureDescription}>
                            Adaugă exerciții și urmărește performanța
                        </p>
                    </div>

                    {/* Feature 3: Urmărește progresul */}
                    <div className={styles.featureItem}>
                        <div className={styles.featureIconPlaceholder}>
                            <MdShowChart />
                        </div>
                        <h3 className={styles.featureTitle}>Urmărește progresul</h3>
                        <p className={styles.featureDescription}>
                            Vizualizează evoluția ta în timp real
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default HomePage; 