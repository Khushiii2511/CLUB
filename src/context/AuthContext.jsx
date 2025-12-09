// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect } from 'react';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    onAuthStateChanged // Crucial for managing state
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore'; // For saving user profile
import { auth, db } from '../firebase/firebase'; 
import { useNavigate } from 'react-router-dom';

// Create the context object
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Firebase user object
    const [profile, setProfile] = useState(null); // Firestore profile data (username, etc.)
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // --- Authentication State Listener ---
    useEffect(() => {
        // Subscribes to Firebase Auth changes (login, logout, token refresh)
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // 1. Set Auth User
                setUser(currentUser);
                
                // 2. Fetch User Profile from Firestore
                await fetchUserProfile(currentUser.uid);
            } else {
                setUser(null);
                setProfile(null);
            }
            setLoading(false);
        });

        // Cleanup the subscription on unmount
        return unsubscribe;
    }, []); 

    // --- Helper Function to fetch Profile Data ---
    const fetchUserProfile = async (uid) => {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            setProfile(docSnap.data());
        } else {
            // This happens right after registration, before profile is saved
            setProfile(null); 
        }
    };


    // --- Authentication Actions ---

    // 1. Register User (creates auth account and profile document)
    const register = async (email, password, username) => {
        try {
            // Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;
            
            // Create user profile document in Firestore 'users' collection
            await setDoc(doc(db, "users", firebaseUser.uid), {
                uid: firebaseUser.uid,
                email: email,
                username: username, // Save username for display and following
                followers: [],
                following: [],
                createdAt: new Date(),
            });
            
            // State will be updated by onAuthStateChanged listener
            
        } catch (error) {
            // Firebase errors have a specific format
            const errorMessage = error.message.replace("Firebase: ", "");
            throw new Error(errorMessage);
        }
    };

    // 2. Login User
    const login = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // State will be updated by onAuthStateChanged listener
        } catch (error) {
            const errorMessage = error.message.replace("Firebase: ", "");
            throw new Error(errorMessage);
        }
    };

    // 3. Logout User
    const logout = async () => {
        await signOut(auth);
        navigate('/login'); // Redirect after logout
    };

    // Value provided to consuming components
    const authContextValue = {
        user, // The raw Firebase Auth user
        profile, // The custom data from Firestore (contains username!)
        loading,
        login,
        logout,
        register,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {loading ? <div>Loading Authentication...</div> : children}
        </AuthContext.Provider>
    );
};