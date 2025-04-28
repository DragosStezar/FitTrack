import React, { useState, useEffect } from 'react';
import styles from './WorkoutsPage.module.css';
// Importă componentele reale
import WorkoutCalendar from '../components/WorkoutCalendar';
import WorkoutDetails from '../components/WorkoutDetails';
import { useAuth } from '../context/AuthContext'; // Importă hook-ul useAuth
import PremiumCheckoutButton from '../components/PremiumCheckoutButton'; // Importă butonul de checkout
import { Link } from 'react-router-dom'; // <-- Importă Link
// Importă axiosInstance dacă nu este deja importat global
// import axiosInstance from '../api/axiosInstance';

// Presupunem că tipul de user premium este 'Premium'
// --- AJUSTEAZĂ AICI dacă numele tipului premium este diferit --- 
const PREMIUM_USER_TYPE = 'Premium';
const NUTRITION_PAGE_PATH = '/nutrition'; // <-- Definește calea paginii de nutriție

function WorkoutsPage() {
    // State pentru a ține evidența zilei selectate în calendar
    // Inițializăm cu data curentă
    const [selectedDate, setSelectedDate] = useState(new Date());
    // State pentru a stoca zilele cu antrenamente pentru luna curentă
    const [daysWithWorkouts, setDaysWithWorkouts] = useState([]);
    // State pentru a gestiona încărcarea datelor
    const [loadingCalendar, setLoadingCalendar] = useState(false);

    // Obține datele de autentificare din context
    const { userInfo, isLoggedIn } = useAuth();

    // TODO: Adaugă useEffect pentru a prelua zilele cu antrenamente
    //       când se schimbă luna/anul vizibil în calendar
    //       și actualizează state-ul `daysWithWorkouts`

    // Exemplu simplu de date hardcodate pentru zile cu antrenamente (înlocuiește cu API call)
    useEffect(() => {
        // Simulează preluarea datelor
        setLoadingCalendar(true);
        console.log("Fetching workout days for", selectedDate.getMonth() + 1, selectedDate.getFullYear());
        // API Call ar fi ceva de genul:
        // axiosInstance.get(`/trainingsessions/month?month=${selectedDate.getMonth() + 1}&year=${selectedDate.getFullYear()}`)
        //     .then(response => {
        //         // Presupunând că API-ul returnează un array de string-uri cu date (ex: "2024-05-15T00:00:00")
        //         const workoutDates = response.data.map(dateStr => new Date(dateStr));
        //         setDaysWithWorkouts(workoutDates);
        //     })
        //     .catch(error => console.error("Error fetching workout days:", error))
        //     .finally(() => setLoadingCalendar(false));

        // Simulare date:
        setTimeout(() => {
            const simulatedDates = [
                new Date(2025, 3, 2), // April 2, 2025 (luna e 0-indexată)
                new Date(2025, 3, 10),
                new Date(2025, 3, 15)
            ];
            setDaysWithWorkouts(simulatedDates);
            setLoadingCalendar(false);
            console.log("Simulated workout days set:", simulatedDates);
        }, 500); // Simulează un delay mic

    }, []); // Rulează o singură dată la început (ar trebui să ruleze la schimbare lună/an)

    console.log("Selected date:", selectedDate);
    console.log("User Info from Context:", userInfo);

    return (
        <div className={styles.pageContainer}>
            {/* --- Antet Modificat --- */}
            <header className={styles.pageHeader}> {/* Folosim o clasă CSS dacă există */}
                <h1>Your Workouts</h1>
                {/* Afișează butonul de upgrade dacă userul e logat și NU e premium */}
                {isLoggedIn && userInfo && userInfo.userType !== PREMIUM_USER_TYPE && (
                    <PremiumCheckoutButton />
                )}
                {/* Afișează link către nutriție dacă userul e premium */}
                {isLoggedIn && userInfo && userInfo.userType === PREMIUM_USER_TYPE && (
                    <Link to={NUTRITION_PAGE_PATH} className={styles.nutritionLinkButton}> {/* Poți stiliza Link ca pe un buton */}
                        Go to Nutrition Plan
                    </Link>
                )}
            </header>

            <div className={styles.contentWrapper}>
                {/* Coloana pentru Calendar */}
                <div className={styles.calendarColumn}>
                    <h2>Calendar</h2>
                    <WorkoutCalendar
                        selectedDate={selectedDate}
                        onDateChange={setSelectedDate}
                        workoutDays={daysWithWorkouts}
                    />
                    {loadingCalendar && <p>Loading calendar data...</p>}
                    <p>Selected: {selectedDate.toDateString()}</p>
                </div>

                {/* Coloana pentru Detalii Antrenament */}
                <div className={styles.detailsColumn}>
                    <h2>Details for {selectedDate.toDateString()}</h2>
                    <WorkoutDetails
                        date={selectedDate}
                    />
                </div>
            </div>
        </div>
    );
}

export default WorkoutsPage; 