import React from 'react';
import styles from './ExerciseItem.module.css';
import { FaEdit, FaTrashAlt } from 'react-icons/fa'; // Iconițe pentru acțiuni

// Acum, `exercise` primit ca prop are structura directă ExerciseInputDto:
// exercise = { id: '...', name: 'Bench Press', sets: 3, reps: '10-12', weight: '80kg', duration: null, notes: '...' }
function ExerciseItem({ exercise, onEdit, onDelete }) {

    // Nu mai extragem din array-ul `sets`, accesăm direct proprietățile

    return (
        <div className={styles.itemContainer}>
            <div className={styles.exerciseInfo}>
                <h4 className={styles.exerciseName}>{exercise.name}</h4>
                <div className={styles.detailsGrid}>
                    {/* Afișăm direct proprietățile */}
                    {/* Verificăm existența pentru a nu afișa elemente goale inutil */}
                    {exercise.sets != null && <span>Sets: {exercise.sets}</span>}
                    {exercise.reps && <span>Reps: {exercise.reps}</span>}
                    {exercise.weight && <span>Weight: {exercise.weight}</span>}
                    {exercise.duration && <span>Duration: {exercise.duration}</span>}
                    {/* Afișăm notele (dacă există) pe un rând nou sau într-o zonă distinctă pentru lizibilitate */}
                    {exercise.notes && (
                        <span className={styles.notesFullWidth}>Notes: {exercise.notes}</span>
                    )}
                </div>
            </div>
            <div className={styles.actions}>
                {/* La editare, trimitem întregul obiect exercise */}
                <button onClick={() => onEdit(exercise)} className={`${styles.actionButton} ${styles.editButton}`} aria-label="Edit exercise">
                    <FaEdit />
                </button>
                {/* La ștergere, trimitem ID-ul exercițiului */}
                <button onClick={() => onDelete(exercise.id)} className={`${styles.actionButton} ${styles.deleteButton}`} aria-label="Delete exercise">
                    <FaTrashAlt />
                </button>
            </div>
        </div>
    );
}

export default ExerciseItem; 