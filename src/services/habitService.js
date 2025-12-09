// src/services/habitService.js - FINAL MODIFIED CODE (CORRECTED)
import { db } from '../firebase/firebase';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    orderBy,
    limit,
    documentId
} from 'firebase/firestore';
const HABIT_COLLECTION = 'habits';
const CHECKIN_COLLECTION = 'checkins';
const USER_COLLECTION = 'users';

// ---------------------------------------------
// --- UTILITY FUNCTION ---
// ---------------------------------------------
/**
 * Checks if a given timestamp or date string is today.
 * This is crucial for determining if a habit is checked in for the day.
 * @param {string | Date | firebase.firestore.Timestamp} dateToCheck - The date/timestamp to evaluate.
 * @returns {boolean} True if the date is today, false otherwise.
 */

export const isToday = (dateToCheck) => {
    if (!dateToCheck) return false;
    // Convert Firestore Timestamp object to a standard JavaScript Date object if necessary

    let date;
    if (dateToCheck && typeof dateToCheck.toDate === 'function') {
        date = dateToCheck.toDate();
    } else if (dateToCheck instanceof Date) {
        date = dateToCheck;
    } else if (typeof dateToCheck === 'string') {
        // Attempt to parse date string
        date = new Date(dateToCheck);
    } else {
        return false;
    }
    // Ensure the date object is valid
    if (isNaN(date.getTime())) {
        return false;
    }

    const today = new Date();
    return (

        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()

    );

};

// ---------------------------------------------
// --- HABIT MANAGEMENT (CRUD) ---
// ---------------------------------------------

/**
 * Creates a new habit document in Firestore.
 */

export const createHabit = async (userId, habitData) => {
    const newHabit = {
        userId,
        name: habitData.name,
        frequency: habitData.frequency, // 'daily' or 'weekly'
        category: habitData.category,
        currentStreak: 0,
        completionRate: 0,
        createdAt: serverTimestamp(),
        lastCheckIn: null, // Initialize lastCheckIn for streak tracking

    };

    // Edge Case: Prevent duplicate habits with the same name per user

    const q = query(
        collection(db, HABIT_COLLECTION),
        where('userId', '==', userId),
        where('name', '==', habitData.name)

    );

    const existingHabits = await getDocs(q);
    if (!existingHabits.empty) {
        throw new Error('A habit with this name already exists.');
    }

    const docRef = await addDoc(collection(db, HABIT_COLLECTION), newHabit);
    return { ...newHabit, id: docRef.id };

};


/**
 * Retrieves all habits for the logged-in user.
 */

export const getHabits = async (userId) => {
    const q = query(
        collection(db, HABIT_COLLECTION),
        where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const habits = snapshot.docs.map(doc => ({

        id: doc.id,

        ...doc.data(),

    }));

    return habits;

};


/**

 * Updates an existing habit.

 */

export const updateHabit = async (habitId, updates) => {
    const habitRef = doc(db, HABIT_COLLECTION, habitId);
    await updateDoc(habitRef, updates);
};

/**

 * Deletes a habit.

 */

export const deleteHabit = async (habitId) => {
    const habitRef = doc(db, HABIT_COLLECTION, habitId);
    await deleteDoc(habitRef);

};


// ---------------------------------------------

// --- PROGRESS TRACKING (CHECK-IN) ---

// ---------------------------------------------



/**

 * Marks a habit as complete for the current period (day/week) and updates streak/lastCheckIn.

 */

export const checkInHabit = async (habitId, userId, frequency) => {

   

    // 1. Record the new check-in

    await addDoc(collection(db, CHECKIN_COLLECTION), {
        habitId,
        userId,
        timestamp: serverTimestamp(),

    });



    // 2. Fetch the current habit state

    const habitRef = doc(db, HABIT_COLLECTION, habitId);
    const habitSnap = await getDocs(query(collection(db, HABIT_COLLECTION), where(documentId(), '==', habitId)));

    if (habitSnap.empty) {
        throw new Error('Habit not found for streak update.');
    }

    const habitData = habitSnap.docs[0].data();
    let newStreak = habitData.currentStreak || 0;
    const now = new Date();
    let isYesterday;

    // Determine if the last check-in was yesterday (for streak continuity)

    if (habitData.lastCheckIn) {
        const lastCheckInDate = habitData.lastCheckIn.toDate();
        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        isYesterday =

            lastCheckInDate.getFullYear() === yesterday.getFullYear() &&
            lastCheckInDate.getMonth() === yesterday.getMonth() &&
            lastCheckInDate.getDate() === yesterday.getDate();

    }

   

    // Only update streak if the previous check-in was yesterday

    if (habitData.lastCheckIn && isYesterday) {
        newStreak += 1;

    } else if (!habitData.lastCheckIn || !isYesterday) {

        // If it's the first check-in or the streak was broken
        newStreak = 1;

    }

    // 3. Update the habit document

    await updateDoc(habitRef, {
        currentStreak: newStreak,
        lastCheckIn: serverTimestamp(), // Update the last check-in time

        // completionRate logic would go here if implemented

    });
    return true;

};

// ---------------------------------------------

// --- SOCIAL ACCOUNTABILITY (ACTIVITY FEED) ---

// ---------------------------------------------

/**

 * Retrieves the latest check-ins from users the current user is following.

 */

export const getFriendsActivityFeed = async (followingUids) => {

    if (followingUids.length === 0) return [];



    // Apply the Firestore 'in' query limit

    if (followingUids.length > 10) {

        followingUids = followingUids.slice(0, 10);

    }

   

    // 1. Query recent check-ins from friends

    const checkinQuery = query(
        collection(db, CHECKIN_COLLECTION),
        where('userId', 'in', followingUids),
        orderBy('timestamp', 'desc'),
        limit(50)

    );

    const checkinSnapshot = await getDocs(checkinQuery);

    const activities = checkinSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),

    }));



    // 2. Batch fetch habit names and usernames for display

    const uniqueHabitIds = [...new Set(activities.map(a => a.habitId).filter(id => id))];
    const uniqueUserIds = [...new Set(activities.map(a => a.userId).filter(id => id))];
    const habitDetails = {};
    const userDetails = {};

   

    // Fetch habit names

    if (uniqueHabitIds.length > 0) {
        const habitSnapshots = await getDocs(query(collection(db, HABIT_COLLECTION), where(documentId(), 'in', uniqueHabitIds)));
        habitSnapshots.forEach(doc => {
            habitDetails[doc.id] = doc.data().name;

        });

    }



    // Fetch usernames

    if (uniqueUserIds.length > 0) {
        const userSnapshots = await getDocs(query(collection(db, USER_COLLECTION), where(documentId(), 'in', uniqueUserIds)));
        userSnapshots.forEach(doc => {
            userDetails[doc.id] = doc.data().username;

        });

    }

    // 3. Combine activity data with names and format time
    const populatedActivities = activities.map(activity => ({

        ...activity,
        username: userDetails[activity.userId] || 'Unknown User',
        habitName: habitDetails[activity.habitId] || 'Unknown Habit',
        // Convert Firestore Timestamp to Date, then format
        timestamp: activity.timestamp?.toDate()?.toLocaleTimeString() || 'N/A'

    }));

    return populatedActivities;

};

// --- Export all functions ---

export default {

    createHabit,
    getHabits,
    updateHabit,
    deleteHabit,
    checkInHabit,
    getFriendsActivityFeed,
    isToday // <-- 🔑 EXPORTING THE isToday FUNCTION

};