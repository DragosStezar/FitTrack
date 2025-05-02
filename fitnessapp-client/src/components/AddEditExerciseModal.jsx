import React, { useState, useEffect } from 'react';
import styles from './AddEditExerciseModal.module.css';


function AddEditExerciseModal({ isOpen, onClose, onSubmit, exerciseToEdit }) {
    // State local pentru câmpurile formularului
    const [name, setName] = useState('');
    const [sets, setSets] = useState(''); // Stocat ca string pentru input type="number"
    const [reps, setReps] = useState(''); // Stocat ca string (backend vrea string)
    const [weight, setWeight] = useState(''); // Stocat ca string (backend vrea string?)
    const [duration, setDuration] = useState(''); // Stocat ca string (backend vrea string?)
    const [notes, setNotes] = useState(''); // Adăugăm state pentru Notes
    const [isEditMode, setIsEditMode] = useState(false);

    // Efect pentru a pre-popula formularul când se editează un exercițiu
    useEffect(() => {
        // Presupunem că exerciseToEdit are acum structura ExerciseInputDto
        if (exerciseToEdit) {
            setIsEditMode(true);
            setName(exerciseToEdit.name || '');
            // Backend așteaptă int pt Sets, string pt Reps, string? pt Weight/Duration/Notes
            setSets((exerciseToEdit.sets || 1).toString()); // Convertim nr. seturi în string pt input
            setReps(exerciseToEdit.reps || '');
            setWeight(exerciseToEdit.weight || '');
            setDuration(exerciseToEdit.duration || '');
            setNotes(exerciseToEdit.notes || ''); // Setăm notes
        } else {
            // Reset form for adding new exercise
            setIsEditMode(false);
            setName('');
            setSets('1'); // Default la 1 set (ca string)
            setReps('');
            setWeight('');
            setDuration('');
            setNotes(''); // Resetăm notes
        }
        // Depindem doar de exerciseToEdit pentru a repopula
    }, [exerciseToEdit]);

    const handleSubmit = (event) => {
        event.preventDefault();

        // Construim obiectul exerciseData conform structurii ExerciseInputDto
        const exerciseData = {
            id: isEditMode ? exerciseToEdit.id : `temp-${Date.now()}`, // Păstrăm id temporar/existent pt frontend
            name: name,
            sets: parseInt(sets, 10) || 1, // Convertim înapoi în int
            reps: reps, // Trimitem string
            // Trimitem string gol dacă inputul e gol, sau valoarea. Backend acceptă string?
            weight: weight || null, // Trimitem null dacă e gol, altfel stringul
            duration: duration || null, // Trimitem null dacă e gol, altfel stringul
            notes: notes || null // Trimitem null dacă e gol, altfel stringul
        };

        // Verificări simple opționale (de ex. pt sets > 0) pot fi adăugate aici

        onSubmit(exerciseData); // Trimitem datele structurate corect
    };

    // Nu randa nimic dacă modalul nu e deschis
    if (!isOpen) {
        return null;
    }

    // Închide la click pe overlay
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        // Overlay-ul modalului
        <div className={styles.modalOverlay} onClick={handleOverlayClick}>
            {/* Conținutul modalului */}
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
                            className={styles.notesTextarea} // Adaugă o clasă specifică dacă e necesar
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