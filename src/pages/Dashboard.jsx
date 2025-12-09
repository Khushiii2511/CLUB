
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import habitService from '../services/habitService';
import { Link, useNavigate } from 'react-router-dom';
import HabitForm from "./HabitForm"; 
import './Dashboard.css'; // <-- 🔑 IMPORTING THE COMPONENT-SPECIFIC STYLES

// --- Habit Card Component (STYLED) ---
const HabitCard = ({ habit, onCheckIn, isCheckedInToday, onEdit, onDelete }) => {
    // Determine the class based on check-in status
    const cardClass = `habit-card ${isCheckedInToday ? 'checked-in' : ''}`;

    return (
        <div className={cardClass}>
            <div className="habit-header-card">
                <h3 className="habit-name-display">{habit.name}</h3>
                <div className="habit-actions">
                    <button className="icon-button edit-btn" onClick={() => onEdit(habit)} title="Edit Habit">
                        <span role="img" aria-label="edit">📝</span>
                    </button>
                    <button className="icon-button delete-btn" onClick={() => onDelete(habit.id)} title="Delete Habit">
                        <span role="img" aria-label="delete">🗑️</span>
                    </button>
                </div>
            </div>

            <div className="habit-meta">
                <span className="habit-frequency">🕑 {habit.frequency}</span>
                <span className="streak-info">
                    {habit.currentStreak > 0 ? `🔥 ${habit.currentStreak} days` : '⭐ New Habit'}
                </span>
            </div>
            
            <button 
                className="check-in-button gradient-button"
                onClick={() => onCheckIn(habit.id, habit.frequency)}
                disabled={isCheckedInToday}
            >
                {isCheckedInToday ? '✅ Checked In!' : `Check In`}
            </button>
        </div>
    );
};
// -----------------------------------------------------------------

const Dashboard = () => {
    const { user, profile, logout } = useContext(AuthContext); 
    
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [checkInStatus, setCheckInStatus] = useState({}); 

    // --- MODAL MANAGEMENT ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [habitToEdit, setHabitToEdit] = useState(null);

    const currentUserId = user?.uid; 
    const navigate = useNavigate();

    // --- Data Fetching Logic ---
    const fetchHabits = async (userIdToFetch) => {
        if (!userIdToFetch) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError(null);
        try {
            const habitsData = await habitService.getHabits(userIdToFetch);
            setHabits(habitsData);
        } catch (err) {
            setError(err.message || 'Failed to load habits. Check console for detail.');
        } finally {
            setLoading(false);
        }
    };

    // --- EFFECT: Trigger habit fetch when user state changes ---
    useEffect(() => {
        if (user) {
            fetchHabits(user.uid);
        } else if (!user && !loading) { 
            // If user logs out or isn't logged in, redirect
            navigate('/login'); 
        }
    }, [user, navigate, loading]); 

    // --- CRUD Handlers ---
    const handleCheckIn = async (habitId, frequency) => {
        if (!currentUserId) {
            setError('Authentication error: Cannot check in without user ID.');
            return;
        }
        
        try {
            setCheckInStatus(prev => ({ ...prev, [habitId]: 'loading' }));
            await habitService.checkInHabit(habitId, currentUserId, frequency); 
            
            // Wait for the new data to be fetched before updating the status permanently
            await fetchHabits(currentUserId); 
            
            setCheckInStatus(prev => ({ ...prev, [habitId]: 'done' }));
        } catch (err) {
            setError(err.message || 'Check-in failed.');
            setCheckInStatus(prev => ({ ...prev, [habitId]: 'error' }));
        }
    };

    const handleDeleteHabit = async (habitId) => {
        if (!currentUserId) {
            setError('Authentication required to delete habit.');
            return;
        }

        if (window.confirm('Are you sure you want to delete this habit permanently?')) {
            try {
                await habitService.deleteHabit(habitId);
                fetchHabits(currentUserId); 
            } catch (err) {
                setError(err.message || 'Failed to delete habit.');
            }
        }
    };

    // --- Modal Handlers ---
    const handleOpenModal = (habit = null) => {
        setHabitToEdit(habit); 
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setHabitToEdit(null);
        if (currentUserId) {
            fetchHabits(currentUserId); 
        }
    };

    // --- RENDER LOGIC ---
    if (loading && !user) { 
        return <div className="loading-screen">Loading Dashboard...</div>;
    }

    if (!user) {
        return null; // Redirect handled by useEffect
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header-bar">
                <h1 className="welcome-message">
                    👋 Welcome, {profile?.username || 'Habit Creator'}!
                </h1>
                <div className="action-buttons-group">
                    <button 
                        className="gradient-button add-habit-btn" 
                        onClick={() => handleOpenModal(null)} 
                    >
                        + New Habit
                    </button>
                    <Link to="/feed">
                        <button className="secondary-button feed-btn">Community Feed</button>
                    </Link>
                    <button className="secondary-button logout-btn" onClick={logout}>
                        Logout
                    </button>
                </div>
            </header>

            <main className="dashboard-main-content">
                {error && <p className="error-alert">Error: {error}</p>}
                
                {loading && habits.length === 0 ? (
                    <p className="loading-message">Fetching your habits...</p>
                ) : habits.length === 0 ? (
                    <div className="empty-state-card">
                        <h2>No Habits Found!</h2>
                        <p>It looks like you haven't created any habits yet. Start tracking your first one!</p>
                        <button className="gradient-button" onClick={() => handleOpenModal(null)}>
                            Start Tracking a Habit
                        </button>
                    </div>
                ) : (
                    <div className="habit-grid">
                        {habits.map(habit => (
                            <HabitCard
                                key={habit.id}
                                habit={habit}
                                onCheckIn={handleCheckIn}
                                onEdit={handleOpenModal}
                                onDelete={handleDeleteHabit} 
                                // Simplified check: Use the habit's last check-in to determine status
                                isCheckedInToday={habitService.isToday(habit.lastCheckIn)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* --- MODAL STRUCTURE --- */}
            {isModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <HabitForm
                            initialHabit={habitToEdit}
                            onSave={handleCloseModal}
                            onCancel={handleCloseModal}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;