import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import styles from './NutritionPage.module.css';

const GENDERS = { Male: 0, Female: 1 };
const ACTIVITY_LEVELS = { Sedentary: 0, LightlyActive: 1, ModeratelyActive: 2, VeryActive: 3, ExtraActive: 4 };
const GOALS = { WeightLoss: 0, Maintenance: 1, WeightGain: 2 };

const getActivityLevelText = (value) => Object.keys(ACTIVITY_LEVELS).find(key => ACTIVITY_LEVELS[key] === value);

const getDerivedGoalText = (currentWeight, targetWeight) => {
    if (targetWeight == null || targetWeight === '' || Number(targetWeight) === Number(currentWeight)) {
        return 'Maintenance';
    }
    return Number(targetWeight) < Number(currentWeight) ? 'Weight Loss' : 'Weight Gain';
};

function NutritionPage() {
    const { userInfo } = useAuth();

    const [profileData, setProfileData] = useState(null);
    const [formData, setFormData] = useState({
        gender: GENDERS.Male,
        age: '',
        heightCm: '',
        weightKg: '',
        activityLevel: ACTIVITY_LEVELS.Sedentary,
        targetWeightKg: '',
    });
    const [nutritionData, setNutritionData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [isNewProfile, setIsNewProfile] = useState(false);

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await axiosInstance.get('/userprofile/me');
            setProfileData(response.data);
            setNutritionData(response.data.calculatedNutrition);
            setFormData({
                gender: response.data.gender,
                age: response.data.age,
                heightCm: response.data.heightCm,
                weightKg: response.data.weightKg,
                activityLevel: response.data.activityLevel,
                targetWeightKg: response.data.targetWeightKg ?? '',
            });
            setIsNewProfile(false);
            setIsEditing(false);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setError('Profile not found. Please complete your profile.');
                setIsNewProfile(true);
                setIsEditing(true);
            } else if (err.response && err.response.status === 403) {
                setError('Access denied. This is a premium feature.');
            } else {
                setError('Failed to load profile data. Please try again.');
                console.error("Fetch profile error:", err);
            }
            setProfileData(null);
            setNutritionData(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'gender') {
            setFormData(prev => ({ ...prev, gender: parseInt(value) }));
        } else {
            let processedValue;
            const stringWhenEmptyNumericFields = ['age', 'heightCm', 'weightKg', 'targetWeightKg'];
            const allNumericFields = ['age', 'heightCm', 'weightKg', 'targetWeightKg', 'activityLevel'];

            if (stringWhenEmptyNumericFields.includes(name) && value === '') {
                processedValue = '';
            } else if (allNumericFields.includes(name)) {
                processedValue = Number(value);
            } else {
                processedValue = value;
            }

            setFormData(prev => ({
                ...prev,
                [name]: processedValue
            }));
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const payload = {
            gender: Number(formData.gender),
            age: Number(formData.age),
            heightCm: Number(formData.heightCm),
            weightKg: Number(formData.weightKg),
            activityLevel: Number(formData.activityLevel),
            targetWeightKg: formData.targetWeightKg === '' ? null : Number(formData.targetWeightKg),
        };

        if (!payload.age || !payload.heightCm || !payload.weightKg) {
            setError('Please fill in all required fields.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await axiosInstance.put('/userprofile/me', payload);
            setProfileData(response.data);
            setNutritionData(response.data.calculatedNutrition);
            setIsEditing(false);
            setIsNewProfile(false);
            setError('');
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

    if (isLoading && !profileData && !isNewProfile) {
        return <div className={styles.loading}>Loading Nutrition Plan...</div>;
    }

    if (error.includes('Access denied')) {
        return <div className={styles.error}>{error}</div>;
    }


    return (
        <div className={styles.nutritionPage}>
            <h1 className={styles.title}>Nutrition Plan</h1>
            {error && !error.includes('Profile not found') && !error.includes('Access denied') && <div className={styles.error}>{error}</div>}


            <div className={styles.contentWrapper}>
                <div className={styles.profileSection}>
                    <h2>Personal Profile</h2>
                    {(isEditing || isNewProfile) ? (
                        <form onSubmit={handleSubmit} className={styles.profileForm}>
                            {error && error.includes('Profile not found') && <p className={styles.info}>{error}</p>}
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
                                            <option key={value} value={value}>{key.replace(/([A-Z])/g, ' $1').trim()}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="targetWeightKg">Target Weight (Optional):</label>
                                <input
                                    type="number"
                                    id="targetWeightKg"
                                    name="targetWeightKg"
                                    step="0.1"
                                    value={formData.targetWeightKg}
                                    onChange={handleInputChange}
                                    placeholder="Enter target weight in kg"
                                    min="20"
                                />
                            </div>

                            <div className={styles.formActions}>
                                <button type="submit" className={styles.saveButton} disabled={isLoading}>
                                    {isLoading ? 'Saving...' : 'Save Profile'}
                                </button>
                                {!isNewProfile && (
                                    <button type="button" className={styles.cancelButton} onClick={() => { setIsEditing(false); setError(''); fetchProfile(); }}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    ) : (
                        profileData && (
                            <div className={styles.profileDisplay}>
                                <button onClick={() => setIsEditing(true)} className={styles.editButton}>
                                    Edit Profile
                                </button>
                            </div>
                        )
                    )}
                </div>

                {!isNewProfile && profileData && nutritionData && (
                    <div className={styles.resultsSection}>
                        <div className={styles.dailyGoals}>
                            <h2>Daily Nutrition Goals</h2>
                            <div className={styles.goalCard} id={styles.maintenanceCard}>
                                <span className={styles.cardLabel}>Maintenance Calories (TDEE)</span>
                                <span className={styles.cardValue}>{nutritionData.maintenanceCalories} kcal</span>
                            </div>
                            <div className={styles.goalCard} id={styles.goalCardMain}>
                                <span className={styles.cardLabel}>Goal Calories ({getDerivedGoalText(profileData.weightKg, profileData.targetWeightKg)})</span>
                                <span className={styles.cardValue}>{nutritionData.goalCalories} kcal</span>
                            </div>
                        </div>

                        <div className={styles.macroSplit}>
                            <h2>Macronutrient Split</h2>
                            <div className={styles.macroGrid}>
                                <div className={styles.macroCard}>
                                    <span className={styles.macroValue}>{nutritionData.proteinGrams}g</span>
                                    <span className={styles.macroLabel}>Protein</span>
                                </div>
                                <div className={styles.macroCard}>
                                    <span className={styles.macroValue}>{nutritionData.carbGrams}g</span>
                                    <span className={styles.macroLabel}>Carbs</span>
                                </div>
                                <div className={styles.macroCard}>
                                    <span className={styles.macroValue}>{nutritionData.fatGrams}g</span>
                                    <span className={styles.macroLabel}>Fat</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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