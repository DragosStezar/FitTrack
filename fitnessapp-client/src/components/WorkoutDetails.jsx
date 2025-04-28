import React, { useState, useEffect, useCallback } from 'react';
import styles from './WorkoutDetails.module.css';
import ExerciseItem from './ExerciseItem';
import AddEditExerciseModal from './AddEditExerciseModal';
import { FaPlus } from 'react-icons/fa';
import axiosInstance from '../api/axiosInstance';

// Funcție helper pentru a compara datele ignorând ora
const isSameDay = (date1, date2) =>
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();

// Funcție helper pentru a formata data în YYYY-MM-DD
const formatDateForApi = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Funcție helper pentru a transforma datele primite de la API (cu array de sets)
// în structura folosită de starea frontend (cu proprietăți directe)
const transformWorkoutDataFromApi = (apiData) => {
    console.log("[transformWorkoutDataFromApi] Received API data:", apiData);
    if (!apiData) {
        console.log("[transformWorkoutDataFromApi] API data is null/undefined, returning null.");
        return null;
    }

    const transformedExercises = apiData.exercises.map(ex => {
        // Extragem datele din primul set pentru reps/weight/duration
        // Convertim în string pentru consistență cu starea modalului/inputurilor
        const firstSet = ex.sets && ex.sets.length > 0 ? ex.sets[0] : null;
        const reps = firstSet ? firstSet.repetitions : '';
        // Atenție: Backend trimite weight ca double. Îl convertim în string.
        // Afișăm '' dacă e 0 sau null? Sau lăsăm 0? Să păstrăm valoarea ca string.
        const weight = firstSet && firstSet.weight != null ? firstSet.weight.toString() : '';
        // TODO: Adaugă duration dacă backend-ul îl trimite în ExerciseSetDto
        // const duration = firstSet ? firstSet.duration?.toString() ?? '' : '';
        const duration = ''; // Placeholder

        return {
            // Folosim ID-ul real de la backend pentru exercițiu
            id: ex.id,
            name: ex.name,
            notes: ex.notes,
            // Folosim numărul de seturi returnate de backend
            sets: ex.sets ? ex.sets.length : 0,
            // Folosim valorile extrase/convertite
            reps: reps,
            weight: weight,
            duration: duration,
        };
    });

    // Returnăm obiectul workout transformat
    const result = {
        id: apiData.id,
        // Convertim data în obiect Date
        date: apiData.date ? new Date(apiData.date) : new Date(),
        notes: apiData.notes,
        exercises: transformedExercises,
    };

    console.log("[transformWorkoutDataFromApi] Returning transformed data:", result);
    return result;
};

function WorkoutDetails({ date }) {
    const [workout, setWorkout] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExercise, setEditingExercise] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Funcție pentru a prelua datele antrenamentului
    const fetchWorkoutDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        const formattedDate = formatDateForApi(date);
        console.log(`Fetching workout details for ${formattedDate} using /by-date endpoint`);
        try {
            // Folosim noua rută "by-date"
            const response = await axiosInstance.get(`/trainingsessions/by-date?date=${formattedDate}`);
            // PRIMIM datele de la API (structura cu array de sets)
            const fetchedWorkoutFromApi = response.data;
            // Logăm datele brute primite pentru diagnosticare
            console.log("Raw data received from /by-date:", JSON.stringify(fetchedWorkoutFromApi, null, 2));
            // TRANSFORMĂM datele în structura internă a frontendului
            const transformedWorkout = transformWorkoutDataFromApi(fetchedWorkoutFromApi);
            setWorkout(transformedWorkout); // Setăm starea cu datele transformate
            console.log("Fetched and transformed workout:", transformedWorkout);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setWorkout(null);
                console.log("No workout found for this date.");
                // Nu setăm nicio eroare pentru cazul 404 (normal pentru utilizatori noi)
            } else if (err.response && err.response.status === 401) {
                console.log("Unauthorized access. User might need to login again.");
                setError("Please login to view your workouts.");
                setWorkout(null);
            } else {
                console.error("Error fetching workout details:", err);
                setError("An error occurred while loading your workout data.");
                setWorkout(null);
            }
        } finally {
            setLoading(false);
        }
    }, [date]);

    // Efect pentru a încărca datele când se schimbă data
    useEffect(() => {
        fetchWorkoutDetails();
    }, [fetchWorkoutDetails]);

    // --- Handlers --- 
    const handleAddExerciseClick = () => {
        setEditingExercise(null);
        setIsModalOpen(true);
    };

    const handleEditExerciseClick = (exerciseToEdit) => {
        setEditingExercise(exerciseToEdit);
        setIsModalOpen(true);
    };

    const handleDeleteExercise = (exerciseIdToDelete) => {
        if (!workout) return;
        setWorkout(prev => ({
            ...prev,
            exercises: prev.exercises.filter(ex => ex.id !== exerciseIdToDelete)
        }));
    };

    const handleModalSubmit = (exerciseDataFromModal) => {
        console.log("Modal submitted (ExerciseInputDto structure):", exerciseDataFromModal);

        // Nu mai este nevoie de formatarea complexă a seturilor.
        // Structura primită este deja cea pe care vrem să o stocăm (cu excepția ID-ului real)

        const baseWorkout = workout || { id: `new-sess-${Date.now()}`, date: date, exercises: [] };
        const currentExercises = Array.isArray(baseWorkout.exercises) ? baseWorkout.exercises : [];

        if (editingExercise) {
            // Editare: Înlocuiește exercițiul existent cu cel din modal
            const updatedExercises = currentExercises.map(ex =>
                ex.id === exerciseDataFromModal.id ? exerciseDataFromModal : ex
            );
            setWorkout({ ...baseWorkout, exercises: updatedExercises });
        } else {
            // Adăugare: Adaugă noul exercițiu din modal
            setWorkout({ ...baseWorkout, exercises: [...currentExercises, exerciseDataFromModal] });
        }

        setIsModalOpen(false);
        setEditingExercise(null);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingExercise(null);
        setError(null);
    };

    const handleSaveWorkout = async () => {
        if (!workout || workout.exercises.length === 0) {
            console.log("No exercises to save.");
            return;
        }

        setIsSaving(true);
        setError(null);

        // Pregătim datele pentru trimitere - structura este acum mult mai simplă
        // Starea `workout.exercises` ar trebui să conțină deja obiecte compatibile cu ExerciseInputDto
        const exercisesToSend = workout.exercises.map(ex => {
            // Eliminăm doar ID-ul temporar/frontend specific
            const { id, ...restOfExercise } = ex;
            // Returnăm restul proprietăților care corespund ExerciseInputDto
            return restOfExercise; // { name, sets, reps, weight, duration, notes }
        });

        const workoutDataToSend = {
            // Trimitem data formatată corect
            date: formatDateForApi(workout.date),
            // Trimitem lista de exerciții curățată (fără ID-uri temporare)
            exercises: exercisesToSend,
            // TODO: Adaugă notes la nivel de sesiune dacă e cazul
            // notes: workout.notes // (dacă ai adăuga un câmp de notițe pt tot antrenamentul)
        };

        console.log("Data being sent to API (simplified):", workoutDataToSend);

        try {
            let response;
            // Folosim ID-ul sesiunii stocat în state (dacă există și nu e temporar)
            const sessionId = workout.id && !workout.id.startsWith('new-sess-') ? workout.id : null;

            if (sessionId) {
                console.log("Updating workout:", sessionId, workoutDataToSend);
                response = await axiosInstance.put(`/trainingsessions/${sessionId}`, workoutDataToSend);
                console.log("Workout updated successfully, status:", response.status);
                // NU mai procesăm response.data, vom re-fetch-ui
            } else {
                console.log("Creating new workout:", workoutDataToSend);
                response = await axiosInstance.post('/trainingsessions', workoutDataToSend);
                console.log("Workout created successfully, status:", response.status, "Response data:", response.data);
                // NU mai procesăm response.data, vom re-fetch-ui
            }
            alert("Workout saved!");

            // Re-fetch workout details to get the latest data including IDs from backend
            console.log("Re-fetching workout details after save...");
            await fetchWorkoutDetails(); // Asigură-te că fetchWorkoutDetails este async sau gestionează promisiunea

        } catch (err) {
            console.error("Error saving workout:", err);
            setError("Failed to save workout. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteWorkout = async () => {
        if (!workout || !workout.id || workout.id.startsWith('new-sess-')) {
            setWorkout(null);
            return;
        }

        if (!window.confirm("Are you sure you want to delete this workout?")) {
            return;
        }

        setIsDeleting(true);
        setError(null);
        try {
            console.log("Deleting workout:", workout.id);
            await axiosInstance.delete(`/trainingsessions/${workout.id}`);
            setWorkout(null);
            console.log("Workout deleted successfully.");
            alert("Workout deleted!");

        } catch (err) {
            console.error("Error deleting workout:", err);
            setError("Failed to delete workout. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return <div className={styles.loading}>Loading workout details...</div>;
    }
    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    return (
        <>
            <div className={styles.detailsContainer}>
                <div className={styles.header}>
                    <h3>Workout for {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                    {workout && (
                        <div className={styles.headerActions}>
                            <button onClick={handleSaveWorkout} className={`${styles.button} ${styles.saveButton}`} disabled={isSaving || isDeleting}>
                                {isSaving ? "Saving..." : "Save Workout"}
                            </button>
                            <button onClick={handleDeleteWorkout} className={`${styles.button} ${styles.deleteButton}`} disabled={isDeleting || isSaving}>
                                {isDeleting ? "Deleting..." : "Delete Workout"}
                            </button>
                        </div>
                    )}
                </div>

                {workout ? (
                    <div className={styles.workoutContent}>
                        {workout.exercises && Array.isArray(workout.exercises) && workout.exercises.length > 0 ? (
                            <div className={styles.exercisesList}>
                                {workout.exercises.map(exercise => (
                                    <ExerciseItem
                                        key={exercise.id}
                                        exercise={exercise}
                                        onEdit={handleEditExerciseClick}
                                        onDelete={handleDeleteExercise}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className={styles.noExercisesMessage}>No exercises added yet. Click the button below to add one.</p>
                        )}
                        <button
                            onClick={handleAddExerciseClick}
                            className={styles.addExerciseButton}
                        >
                            <FaPlus /> Add Exercise
                        </button>
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <p>You don't have a workout for this day yet!</p>
                        <p>Start your fitness journey by adding your first exercise.</p>
                        <button onClick={handleAddExerciseClick} className={`${styles.button} ${styles.createButton}`}>
                            <FaPlus /> Create Workout
                        </button>
                    </div>
                )}
            </div>

            <AddEditExerciseModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleModalSubmit}
                exerciseToEdit={editingExercise}
            />
        </>
    );
}

export default WorkoutDetails;