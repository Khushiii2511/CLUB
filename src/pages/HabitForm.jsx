// src/components/HabitForm.jsx - FINAL MODIFIED CODE (Styled)

import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import habitService from '../services/habitService';
import './HabitForm.css'; // <-- 🔑 IMPORTING THE COMPONENT-SPECIFIC STYLES

const HabitForm = ({ initialHabit = null, onSave, onCancel }) => {
    const { user } = useContext(AuthContext);
    const userId = user?.uid; // CRITICAL: Getting the current user's UID

    const [formData, setFormData] = useState({
        name: initialHabit?.name || '',
        frequency: initialHabit?.frequency || 'daily',
        category: initialHabit?.category || 'Health',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Update form data if initialHabit prop changes (for editing)
    useEffect(() => {
        if (initialHabit) {
            setFormData({
                name: initialHabit.name,
                frequency: initialHabit.frequency,
                category: initialHabit.category,
            });
        } else {
            // Reset form for creation if the modal is opened without an initialHabit
            setFormData({
                name: '',
                frequency: 'daily',
                category: 'Health',
            });
        }
        setError('');
    }, [initialHabit]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Edge Case 1: Validate required fields
        if (!formData.name.trim() || !formData.frequency || !formData.category) {
            setError('Please fill out all required fields.');
            setLoading(false);
            return;
        }
        
        // CRITICAL: Ensure User ID is available for the Firestore call 
        if (!userId) {
            setError('Authentication error: User data is missing. Please refresh or re-login.');
            setLoading(false);
            return;
        }

        try {
            if (initialHabit) {
                // --- Edit Mode ---
                await habitService.updateHabit(initialHabit.id, formData);
            } else {
                // --- Create Mode ---
                await habitService.createHabit(userId, formData);
            }
            
            // Call the parent function to close the form and refresh the dashboard
            onSave(); 

        } catch (err) {
            setError(err.message || 'Failed to save habit.');
        } finally {
            setLoading(false);
        }
    };

    const categories = ['Health', 'Fitness', 'Learning', 'Finance', 'Mindfulness', 'Social', 'Other'];

    return (
        <div className="habit-form-modal">
            <h3 className="form-title">
                {initialHabit ? '✏️ Edit Habit' : '✨ Create New Habit'}
            </h3>
            
            <form onSubmit={handleSubmit}>
                {error && <p className="error-alert">{error}</p>}

                <div className="form-group">
                    <label htmlFor="name">Habit Name:</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Read for 30 minutes"
                        className="form-input"
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="frequency">Frequency:</label>
                    <select
                        id="frequency"
                        name="frequency"
                        value={formData.frequency}
                        onChange={handleChange}
                        required
                        className="form-input"
                        disabled={loading}
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                    </select>
                </div>
                
                <div className="form-group">
                    <label htmlFor="category">Category:</label>
                    <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="form-input"
                        disabled={loading}
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="form-actions">
                    <button type="submit" className="gradient-button" disabled={loading}>
                        {loading ? 'Saving...' : initialHabit ? 'Update Habit' : 'Create Habit'}
                    </button>
                    <button type="button" className="secondary-button cancel-button" onClick={onCancel} disabled={loading}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default HabitForm;