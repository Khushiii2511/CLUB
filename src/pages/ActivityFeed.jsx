// src/pages/ActivityFeed.jsx - FINAL MODIFIED CODE (Error Fix)

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import userService from '../services/userService';
import habitService from '../services/habitService';
import { Link } from 'react-router-dom';
import './ActivityFeed.css'; // <-- 🔑 IMPORTING THE COMPONENT-SPECIFIC STYLES

// --- User Search Component (Sub-Component) ---
const UserSearch = ({ currentUserId, onFollowChange }) => {
    const { profile } = useContext(AuthContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        setSearchLoading(true);
        setSearchError('');
        setSearchResults([]);

        if (searchTerm.trim().length < 2) {
            setSearchError('Search term must be at least 2 characters.');
            setSearchLoading(false);
            return;
        }

        try {
            // Note: Ensure userService.searchUsers excludes the currentUserId in the service layer
            const results = await userService.searchUsers(searchTerm.trim(), currentUserId);
            setSearchResults(results);
        } catch (err) {
            setSearchError(err.message || 'Error during search.');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleFollowToggle = async (targetUser) => {
        // 🔑 FIX 1: Check if following using Map lookup: profile?.following?.[targetUser.id]
        const isCurrentlyFollowing = profile?.following?.[targetUser.id] === true;
        
        try {
            if (isCurrentlyFollowing) {
                await userService.unfollowUser(currentUserId, targetUser.id);
            } else {
                await userService.followUser(currentUserId, targetUser.id);
            }
            
            // Trigger a refresh of the profile in the AuthContext to update feed and buttons
            onFollowChange(); 

        } catch (err) {
            // Use the corrected check for the alert message as well
            alert(`Failed to ${isCurrentlyFollowing ? 'unfollow' : 'follow'} user. Check console for details.`);
            console.error(err);
        }
    };

    return (
        <div className="user-search-container card side-panel">
            <h2 className="panel-title">👥 Find Friends</h2>
            <form onSubmit={handleSearch} className="search-form">
                <input
                    type="text"
                    placeholder="Search username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input search-input"
                    disabled={searchLoading}
                />
                <button type="submit" className="secondary-button" disabled={searchLoading}>
                    {searchLoading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {searchError && <p className="error-alert">{searchError}</p>}
            
            <div className="search-results-list">
                {searchResults.length > 0 ? (
                    searchResults.map(user => {
                        // 🔑 FIX 2: Check if following using Map lookup: profile?.following?.[user.id]
                        const isFollowing = profile?.following?.[user.id] === true; 
                        
                        return (
                            <div key={user.id} className="user-result-item">
                                <span className="result-username">@{user.username}</span>
                                <button
                                    className={`follow-button ${isFollowing ? 'secondary-button unfollow-btn' : 'gradient-button follow-btn'}`}
                                    onClick={() => handleFollowToggle(user)}
                                >
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                            </div>
                        );
                    })
                ) : searchTerm.length >= 2 && !searchLoading && (
                    <p className="no-results">No users found matching "{searchTerm}".</p>
                )}
            </div>
        </div>
    );
};
// -----------------------------------------------------------------


// --- Activity Feed Page Component ---
const ActivityFeed = () => {
    const { user, profile, fetchUserProfile } = useContext(AuthContext); 
    const [feed, setFeed] = useState([]);
    const [feedLoading, setFeedLoading] = useState(true);
    const [feedError, setFeedError] = useState(null);
    const userId = user?.uid;

    const loadFeed = useCallback(async (followingData) => {
        if (!userId) return; // Wait for user ID

        // Convert the following Map to an array of UIDs for the service function
        const followingUids = followingData ? Object.keys(followingData).filter(key => followingData[key] === true) : [];

        if (followingUids.length === 0) {
            setFeed([]);
            setFeedLoading(false);
            return;
        }

        setFeedLoading(true);
        try {
            const activities = await habitService.getFriendsActivityFeed(followingUids);
            setFeed(activities);
        } catch (err) {
            setFeedError(err.message || 'Failed to load activity feed.');
        } finally {
            setFeedLoading(false);
        }
    }, [userId]); 

    // Effect to run when profile's 'following' list changes
    useEffect(() => {
        if (profile?.following !== undefined) {
            // Pass the entire 'following' map/object to loadFeed
            loadFeed(profile.following); 
        }
    }, [profile?.following, loadFeed]);
    
    // Handler passed to UserSearch to refresh profile data after follow/unfollow
    const handleFollowChange = () => {
        if (userId && fetchUserProfile) {
            fetchUserProfile(userId); 
        }
    };

    // Helper to get the number of UIDs being followed from the Map
    const followingCount = profile?.following ? Object.keys(profile.following).length : 0;


    return (
        <div className="activity-feed-wrapper">
            <header className="feed-main-header">
                <h1 className="feed-title">🌎 Community Progress</h1>
                <Link to="/dashboard" className="secondary-button back-to-dash">
                    ← Back to Dashboard
                </Link>
            </header>
            
            <div className="feed-content-grid">
                
                {/* Left Column: User Search */}
                {userId && (
                    <UserSearch 
                        currentUserId={userId} 
                        onFollowChange={handleFollowChange}
                    />
                )}

                {/* Right Column: Activity Stream */}
                <div className="activity-stream card">
                    <h2 className="panel-title">✅ Recent Check-Ins from Friends</h2>
                    
                    {feedError && <p className="error-alert">{feedError}</p>}
                    
                    {feedLoading ? (
                        <p className="loading-message">Loading activities...</p>
                    ) : followingCount === 0 ? (
                        <div className="empty-feed-state">
                            <h3>Start Social Tracking!</h3>
                            <p>Use the **Find Friends** panel to follow other users and see their latest habit check-ins here.</p>
                        </div>
                    ) : feed.length === 0 ? (
                        <p className="no-results">
                            No recent check-ins found for the users you follow.
                        </p>
                    ) : (
                        <ul className="feed-list">
                            {feed.map((activity) => (
                                <li key={activity.id} className="feed-item">
                                    <span className="feed-username">@{activity.username}</span> 
                                    <span className="feed-action"> checked in on the habit </span>
                                    <span className="feed-habit-name">"{activity.habitName}"</span>
                                    <span className="feed-time">{activity.timestamp}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityFeed;