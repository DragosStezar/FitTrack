import React, { useState, useEffect } from 'react';
import styles from './WorkoutsPage.module.css';
import WorkoutCalendar from '../components/WorkoutCalendar';
import WorkoutDetails from '../components/WorkoutDetails';
import { useAuth } from '../context/AuthContext';
import PremiumCheckoutButton from '../components/PremiumCheckoutButton';
import { Link } from 'react-router-dom';

const PREMIUM_USER_TYPE = 'Premium';
const NUTRITION_PAGE_PATH = '/nutrition';

function WorkoutsPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [daysWithWorkouts, setDaysWithWorkouts] = useState([]);
    const [loadingCalendar, setLoadingCalendar] = useState(false);

    const { userInfo, isLoggedIn } = useAuth();

    useEffect(() => {
        setLoadingCalendar(true);
        console.log("Fetching workout days for", selectedDate.getMonth() + 1, selectedDate.getFullYear());

        setTimeout(() => {
            const simulatedDates = [
                new Date(2025, 3, 2),
                new Date(2025, 3, 10),
                new Date(2025, 3, 15)
            ];
            setDaysWithWorkouts(simulatedDates);
            setLoadingCalendar(false);
            console.log("Simulated workout days set:", simulatedDates);
        }, 500);

    }, []);

    console.log("Selected date:", selectedDate);
    console.log("User Info from Context:", userInfo);

    return (
        <div className={styles.pageContainer}>
            <header className={styles.pageHeader}>
                <h1>Your Workouts</h1>

                {isLoggedIn && userInfo && userInfo.userType !== PREMIUM_USER_TYPE && (
                    <PremiumCheckoutButton />
                )}
                {isLoggedIn && userInfo && userInfo.userType === PREMIUM_USER_TYPE && (
                    <Link to={NUTRITION_PAGE_PATH} className={styles.nutritionLinkButton}>
                        Go to Nutrition Plan
                    </Link>
                )}
            </header>

            <div className={styles.contentWrapper}>
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