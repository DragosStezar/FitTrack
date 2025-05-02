import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext'; // Asigură-te că expune userInfo, isLoggedIn
import axiosInstance from '../api/axiosInstance';
import styles from './NutritionPage.module.css'; // Vom crea acest fișier CSS

// Definim valorile default sau așteptate pentru enum-uri (pentru consistență cu backendul)
const GENDERS = { Male: 0, Female: 1 };
const ACTIVITY_LEVELS = { Sedentary: 0, LightlyActive: 1, ModeratelyActive: 2, VeryActive: 3, ExtraActive: 4 };
const GOALS = { WeightLoss: 0, Maintenance: 1, WeightGain: 2 };

// Helper pentru a obține cheile textuale ale enum-urilor (pentru dropdowns)
const getActivityLevelText = (value) => Object.keys(ACTIVITY_LEVELS).find(key => ACTIVITY_LEVELS[key] === value);

// Funcție helper pentru a determina scopul pe baza greutăților
const getDerivedGoalText = (currentWeight, targetWeight) => {
    if (targetWeight == null || targetWeight === '' || Number(targetWeight) === Number(currentWeight)) {
        return 'Maintenance';
    }
    return Number(targetWeight) < Number(currentWeight) ? 'Weight Loss' : 'Weight Gain';
};

function NutritionPage() {
    const { userInfo } = useAuth(); // Presupunem că userInfo are datele userului logat

    // Stare pentru datele de profil primite de la API
    const [profileData, setProfileData] = useState(null);
    // Stare pentru datele din formular (inițializate din profileData sau default)
    const [formData, setFormData] = useState({
        gender: GENDERS.Male, // Default
        age: '',
        heightCm: '',
        weightKg: '',
        activityLevel: ACTIVITY_LEVELS.Sedentary, // Default
        targetWeightKg: '', // Adăugăm targetWeightKg, inițial string gol
    });
    // Stare pentru datele nutriționale calculate
    const [nutritionData, setNutritionData] = useState(null);
    // Stare pentru controlul încărcării API
    const [isLoading, setIsLoading] = useState(true);
    // Stare pentru controlul modului de editare
    const [isEditing, setIsEditing] = useState(false);
    // Stare pentru erori
    const [error, setError] = useState('');
    // Stare pentru a indica dacă profilul este nou (nu a fost găsit inițial)
    const [isNewProfile, setIsNewProfile] = useState(false);

    // Funcție pentru a prelua datele de profil
    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await axiosInstance.get('/userprofile/me');
            setProfileData(response.data);
            setNutritionData(response.data.calculatedNutrition);
            // Inițializează formularul cu datele primite
            setFormData({
                gender: response.data.gender,
                age: response.data.age,
                heightCm: response.data.heightCm,
                weightKg: response.data.weightKg,
                activityLevel: response.data.activityLevel,
                targetWeightKg: response.data.targetWeightKg ?? '', // Adăugăm targetWeightKg (folosim ?? '' pentru a evita null în formular)
            });
            setIsNewProfile(false); // Profil existent
            setIsEditing(false); // Nu suntem în modul editare inițial
        } catch (err) {
            if (err.response && err.response.status === 404) {
                // Nu există profil, intrăm direct în modul creare/editare
                setError('Profile not found. Please complete your profile.');
                setIsNewProfile(true);
                setIsEditing(true); // Intrăm direct în editare pentru profil nou
                // Păstrăm valorile default în formData
            } else if (err.response && err.response.status === 403) {
                setError('Access denied. This is a premium feature.');
                // Poți eventual redirecționa sau bloca UI-ul
            } else {
                setError('Failed to load profile data. Please try again.');
                console.error("Fetch profile error:", err);
            }
            setProfileData(null); // Resetăm datele dacă a apărut o eroare
            setNutritionData(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Preluăm datele la montarea componentei
    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // Handler pentru schimbările din formular
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Tratare specială pentru radio butoane
        if (name === 'gender') {
            setFormData(prev => ({ ...prev, gender: parseInt(value) }));
        } else {
            // Convertim la număr dacă e cazul (pentru age, height, weight, select)
            const processedValue = (name === 'age' || name === 'heightCm' || name === 'weightKg' || name === 'activityLevel' || name === 'targetWeightKg')
                ? Number(value) // Folosim Number() pentru a trata și string-uri goale/inputuri numerice
                : value;

            setFormData(prev => ({
                ...prev,
                [name]: processedValue
            }));
        }
    };


    // Handler pentru submit formular (salvare/actualizare)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Pregătim datele de trimis, asigurând tipuri corecte
        const payload = {
            gender: Number(formData.gender),
            age: Number(formData.age),
            heightCm: Number(formData.heightCm),
            weightKg: Number(formData.weightKg),
            activityLevel: Number(formData.activityLevel),
            targetWeightKg: formData.targetWeightKg === '' ? null : Number(formData.targetWeightKg),
        };

        // Validare simplă (poate fi extinsă)
        if (!payload.age || !payload.heightCm || !payload.weightKg) {
            setError('Please fill in all required fields.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await axiosInstance.put('/userprofile/me', payload);
            setProfileData(response.data);
            setNutritionData(response.data.calculatedNutrition);
            setIsEditing(false); // Ieșim din modul editare după salvare
            setIsNewProfile(false); // Indiferent dacă era nou, acum există
            setError(''); // Curățăm erorile
        } catch (err) {
            if (err.response && err.response.status === 403) {
                setError('Access denied. Could not save profile.');
            } else {
                setError('Failed to save profile data. Please try again.');
                console.error("Save profile error:", err);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Afișăm starea de încărcare inițială
    if (isLoading && !profileData && !isNewProfile) {
        return <div className={styles.loading}>Loading Nutrition Plan...</div>;
    }

    // Afișăm eroare de acces Premium
    if (error.includes('Access denied')) {
        return <div className={styles.error}>{error}</div>;
    }


    return (
        <div className={styles.nutritionPage}>
            <h1 className={styles.title}>Nutrition Plan</h1>
            {/* Mesaj de eroare general */}
            {error && !error.includes('Profile not found') && !error.includes('Access denied') && <div className={styles.error}>{error}</div>}


            <div className={styles.contentWrapper}>
                {/* Secțiunea Formular Profil */}
                <div className={styles.profileSection}>
                    <h2>Personal Profile</h2>
                    {/* Afișăm formularul doar dacă suntem în modul editare sau e profil nou */}
                    {(isEditing || isNewProfile) ? (
                        <form onSubmit={handleSubmit} className={styles.profileForm}>
                            {error && error.includes('Profile not found') && <p className={styles.info}>{error}</p>}
                            {/* Gender */}
                            <div className={styles.formGroup}>
                                <label>Gender:</label>
                                <div className={styles.radioGroup}>
                                    <label>
                                        <input
                                            type="radio"
                                            name="gender"
                                            value={GENDERS.Male}
                                            checked={formData.gender === GENDERS.Male}
                                            onChange={handleInputChange}
                                        /> Male
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="gender"
                                            value={GENDERS.Female}
                                            checked={formData.gender === GENDERS.Female}
                                            onChange={handleInputChange}
                                        /> Female
                                    </label>
                                </div>
                            </div>

                            {/* Age & Weight */}
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="age">Age:</label>
                                    <input
                                        type="number"
                                        id="age"
                                        name="age"
                                        value={formData.age}
                                        onChange={handleInputChange}
                                        placeholder="Years"
                                        required
                                        min="1"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="weightKg">Weight:</label>
                                    <input
                                        type="number"
                                        id="weightKg"
                                        name="weightKg"
                                        step="0.1"
                                        value={formData.weightKg}
                                        onChange={handleInputChange}
                                        placeholder="kg"
                                        required
                                        min="20"
                                    />
                                </div>
                            </div>

                            {/* Height & Activity Level */}
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="heightCm">Height:</label>
                                    <input
                                        type="number"
                                        id="heightCm"
                                        name="heightCm"
                                        value={formData.heightCm}
                                        onChange={handleInputChange}
                                        placeholder="cm"
                                        required
                                        min="50"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="activityLevel">Activity Level:</label>
                                    <select
                                        id="activityLevel"
                                        name="activityLevel"
                                        value={formData.activityLevel}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        {Object.entries(ACTIVITY_LEVELS).map(([key, value]) => (
                                            <option key={value} value={value}>{key.replace(/([A-Z])/g, ' $1').trim()}</option> // Adaugă spații
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Target Weight */}
                            <div className={styles.formGroup}>
                                <label htmlFor="targetWeightKg">Target Weight (Optional):</label>
                                <input
                                    type="number"
                                    id="targetWeightKg"
                                    name="targetWeightKg"
                                    step="0.1"
                                    value={formData.targetWeightKg}
                                    onChange={handleInputChange}
                                    placeholder="kg (leave blank for maintenance)"
                                    min="20" // Adaugă min value (conform validării backend)
                                />
                            </div>

                            {/* Butoane Acțiune */}
                            <div className={styles.formActions}>
                                <button type="submit" className={styles.saveButton} disabled={isLoading}>
                                    {isLoading ? 'Saving...' : 'Save Profile'}
                                </button>
                                {/* Afișăm Cancel doar dacă edităm un profil existent */}
                                {!isNewProfile && (
                                    <button type="button" className={styles.cancelButton} onClick={() => { setIsEditing(false); setError(''); fetchProfile(); /* Reset form? */ }}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    ) : (
                        // Afișăm datele salvate și butonul Edit
                        profileData && (
                            <div className={styles.profileDisplay}>
                                {/* Poți afișa aici un sumar al datelor salvate dacă dorești */}
                                {/* <p>Gender: {profileData.gender === GENDERS.Male ? 'Male' : 'Female'}</p> */}
                                {/* ... etc ... */}
                                <button onClick={() => setIsEditing(true)} className={styles.editButton}>
                                    Edit Profile
                                </button>
                            </div>
                        )
                    )}
                </div>

                {/* Secțiunea Rezultate Nutriționale */}
                {/* Afișăm doar dacă avem date și nu suntem în modul creare profil nou */}
                {!isNewProfile && profileData && nutritionData && (
                    <div className={styles.resultsSection}>
                        {/* Daily Goals */}
                        <div className={styles.dailyGoals}>
                            <h2>Daily Nutrition Goals</h2>
                            <div className={styles.goalCard} id={styles.maintenanceCard}>
                                <span className={styles.cardLabel}>Maintenance Calories (TDEE)</span>
                                <span className={styles.cardValue}>{nutritionData.maintenanceCalories} kcal</span>
                            </div>
                            <div className={styles.goalCard} id={styles.goalCardMain}>
                                {/* Afișăm scopul derivat */}
                                <span className={styles.cardLabel}>Goal Calories ({getDerivedGoalText(profileData.weightKg, profileData.targetWeightKg)})</span>
                                <span className={styles.cardValue}>{nutritionData.goalCalories} kcal</span>
                            </div>
                        </div>

                        {/* Macronutrient Split */}
                        <div className={styles.macroSplit}>
                            <h2>Macronutrient Split</h2>
                            <div className={styles.macroGrid}>
                                <div className={styles.macroCard}>
                                    {/* Aici poți adăuga iconițe */}
                                    <span className={styles.macroValue}>{nutritionData.proteinGrams}g</span>
                                    <span className={styles.macroLabel}>Protein</span>
                                </div>
                                <div className={styles.macroCard}>
                                    {/* Iconiță */}
                                    <span className={styles.macroValue}>{nutritionData.carbGrams}g</span>
                                    <span className={styles.macroLabel}>Carbs</span>
                                </div>
                                <div className={styles.macroCard}>
                                    {/* Iconiță */}
                                    <span className={styles.macroValue}>{nutritionData.fatGrams}g</span>
                                    <span className={styles.macroLabel}>Fat</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Afișăm un placeholder dacă utilizatorul trebuie să completeze profilul */}
                {isNewProfile && !isLoading && (
                    <div className={styles.resultsSectionPlaceholder}>
                        <p>Complete your profile to see your personalized nutrition goals.</p>
                    </div>
                )}

            </div>
        </div>
    );
}

export default NutritionPage; 