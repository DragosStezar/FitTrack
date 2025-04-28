import React from 'react';
import Calendar from 'react-calendar';
// Importă stilurile default ale calendarului (necesar)
// Sau poți crea/importa stiluri customizate
import 'react-calendar/dist/Calendar.css';
import styles from './WorkoutCalendar.module.css'; // Stiluri customizate (opțional)

function WorkoutCalendar({ selectedDate, onDateChange, workoutDays = [] }) {
    // workoutDays va fi un array de date (obiecte Date) care au antrenamente

    // Funcție pentru a stiliza tile-urile (zilele) din calendar
    const tileClassName = ({ date, view }) => {
        // Aplică stil doar în vizualizarea lunară
        if (view === 'month') {
            // Verifică dacă data curentă (fără timp) este în array-ul workoutDays
            const isWorkoutDay = workoutDays.some(
                (workoutDate) =>
                    date.getFullYear() === workoutDate.getFullYear() &&
                    date.getMonth() === workoutDate.getMonth() &&
                    date.getDate() === workoutDate.getDate()
            );
            if (isWorkoutDay) {
                return styles.workoutDay; // Aplică clasa CSS dacă e zi cu antrenament
            }
        }
        return null;
    };

    return (
        <div className={styles.calendarContainer}>
            <Calendar
                onChange={onDateChange} // Funcția primită ca prop pentru a actualiza data selectată
                value={selectedDate}  // Data selectată curent
                tileClassName={tileClassName} // Funcția pentru a aplica clase CSS zilelor
            // Poți adăuga și alte props de configurare dacă e necesar
            // locale="en-US" 
            // showWeekNumbers
            />
        </div>
    );
}

export default WorkoutCalendar; 