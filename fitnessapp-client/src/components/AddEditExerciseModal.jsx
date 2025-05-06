import React, { useState, useEffect } from 'react';
import styles from './AddEditExerciseModal.module.css';


function AddEditExerciseModal({ isOpen, onClose, onSubmit, exerciseToEdit }) {
    const [name, setName] = useState('');
    const [sets, setSets] = useState('');
    const [reps, setReps] = useState('');
    const [weight, setWeight] = useState('');
    const [duration, setDuration] = useState('');
    const [notes, setNotes] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        if (exerciseToEdit) {
            setIsEditMode(true);
            setName(exerciseToEdit.name || '');
            setSets((exerciseToEdit.sets || 1).toString());
            setReps(exerciseToEdit.reps || '');
            setWeight(exerciseToEdit.weight || '');
            setDuration(exerciseToEdit.duration || '');
            setNotes(exerciseToEdit.notes || '');
        } else {
            setIsEditMode(false);
            setName('');
            setSets('1');
            setReps('');
            setWeight('');
            setDuration('');
            setNotes('');
        }
    }, [exerciseToEdit]);

    const handleSubmit = (event) => {
        event.preventDefault();

        const exerciseData = {
            id: isEditMode ? exerciseToEdit.id : `temp-${Date.now()}`,
            name: name,
            sets: parseInt(sets, 10) || 1,
            reps: reps,
            weight: weight || null,
            duration: duration || null,
            notes: notes || null
        };

        onSubmit(exerciseData);
    };

    if (!isOpen) {
        return null;
    }

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={handleOverlayClick}>
            { }
            <div className={styles.modalContent}>
                <h2>{isEditMode ? 'Edit Exercise' : 'Add New Exercise'}</h2>
                <form onSubmit={handleSubmit} className={styles.exerciseForm}>
                    <div className={styles.formGroup}>
                        <label htmlFor="exName">Exercise Name</label>
                        <input
                            type="text"
                            id="exName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="e.g., Bench Press"
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label htmlFor="exSets">Sets</label>
                            <input
                                type="number"
                                id="exSets"
                                value={sets}
                                onChange={(e) => setSets(e.target.value)}
                                required
                                placeholder="3"
                                min="1"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="exReps">Reps</label>
                            <input
                                type="text"
                                id="exReps"
                                value={reps}
                                onChange={(e) => setReps(e.target.value)}
                                required
                                placeholder="e.g., 10-12 or AMRAP"
                            />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label htmlFor="exWeight">Weight (Optional)</label>
                            <input
                                type="text"
                                id="exWeight"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                placeholder="e.g., 80kg"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="exDuration">Duration (Optional)</label>
                            <input
                                type="text"
                                id="exDuration"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                placeholder="e.g., 60s or 5min"
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="exNotes">Notes (Optional)</label>
                        <textarea
                            id="exNotes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g., Focus on form"
                            rows="3"
                            className={styles.notesTextarea}
                        />
                    </div>

                    <div className={styles.formActions}>
                        <button type="button" onClick={onClose} className={`${styles.button} ${styles.cancelButton}`}>
                            Cancel
                        </button>
                        <button type="submit" className={`${styles.button} ${styles.saveButton}`}>
                            {isEditMode ? 'Save Changes' : 'Add Exercise'}
                        </button>
                    </div>
                </form>
                <button onClick={onClose} className={styles.closeButton} aria-label="Close modal">
                    &times;
                </button>
            </div>
        </div>
    );
}

export default AddEditExerciseModal; 