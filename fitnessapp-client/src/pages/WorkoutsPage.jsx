import React, { useState, useEffect } from 'react';
import styles from './WorkoutsPage.module.css';
import WorkoutCalendar from '../components/WorkoutCalendar';
import WorkoutDetails from '../components/WorkoutDetails';
import { useAuth } from '../context/AuthContext';
import PremiumCheckoutButton from '../components/PremiumCheckoutButton';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const PREMIUM_USER_TYPE = 'Premium';
const NUTRITION_PAGE_PATH = '/nutrition';

function WorkoutsPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [daysWithWorkouts, setDaysWithWorkouts] = useState([]);
    const [loadingCalendar, setLoadingCalendar] = useState(false);
    const [calendarError, setCalendarError] = useState('');

    const { userInfo, isLoggedIn } = useAuth();

    const currentFetchMonth = selectedDate.getMonth() + 1;
    const currentFetchYear = selectedDate.getFullYear();

    useEffect(() => {
        const fetchWorkoutDays = async () => {
            if (!isLoggedIn) {
                setDaysWithWorkouts([]);
                setLoadingCalendar(false);
                return;
            }
            setLoadingCalendar(true);
            setCalendarError('');

            try {
                const response = await axiosInstance.get('trainingsessions/month', {
                    params: {
                        year: currentFetchYear,
                        month: currentFetchMonth
                    }
                });
                const workoutDates = response.data.map(dateStr => new Date(dateStr));
                setDaysWithWorkouts(workoutDates);
            } catch (error) {
                console.error("Error fetching workout days:", error);
                setCalendarError('Failed to load workout data. Please try again.');
                setDaysWithWorkouts([]);
            } finally {
                setLoadingCalendar(false);
            }
        };

        fetchWorkoutDays();

    }, [currentFetchMonth, currentFetchYear, isLoggedIn]);

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
                    {calendarError && <p className={styles.error}>{calendarError}</p>}
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