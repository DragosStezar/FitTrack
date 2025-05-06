import React from 'react';
import styles from './ExerciseItem.module.css';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';

function ExerciseItem({ exercise, onEdit, onDelete }) {

    return (
        <div className={styles.itemContainer}>
            <div className={styles.exerciseInfo}>
                <h4 className={styles.exerciseName}>{exercise.name}</h4>
                <div className={styles.detailsGrid}>
                    { }
                    { }
                    {exercise.sets != null && <span>Sets: {exercise.sets}</span>}
                    {exercise.reps && <span>Reps: {exercise.reps}</span>}
                    {exercise.weight && <span>Weight: {exercise.weight}</span>}
                    {exercise.duration && <span>Duration: {exercise.duration}</span>}
                    { }
                    {exercise.notes && (
                        <span className={styles.notesFullWidth}>Notes: {exercise.notes}</span>
                    )}
                </div>
            </div>
            <div className={styles.actions}>
                { }
                <button onClick={() => onEdit(exercise)} className={`${styles.actionButton} ${styles.editButton}`} aria-label="Edit exercise">
                    <FaEdit />
                </button>
                { }
                <button onClick={() => onDelete(exercise.id)} className={`${styles.actionButton} ${styles.deleteButton}`} aria-label="Delete exercise">
                    <FaTrashAlt />
                </button>
            </div>
        </div>
    );
}

export default ExerciseItem; 