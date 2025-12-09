// src/services/userService.js - FINAL MODIFIED VERSION (Map-based Following)

import { db } from '../firebase/firebase';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    updateDoc,
    // We only need FieldValue for map updates (though not strictly necessary here, 
    // it's good practice for atomic operations, but we'll stick to basic objects for clarity)
} from 'firebase/firestore';

const USER_COLLECTION = 'users';

/**
 * Searches for users by username. (Unchanged)
 */
export const searchUsers = async (searchTerm, currentUserId) => {
    if (!searchTerm || searchTerm.length < 2) return [];

    const startAt = searchTerm.toLowerCase();
    const endAt = startAt + '\uf8ff';

    try {
        const q = query(
            collection(db, USER_COLLECTION),
            where('username', '>=', startAt),
            where('username', '<=', endAt)
        );
        
        const snapshot = await getDocs(q);
        
        const results = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
            }))
            .filter(user => user.id !== currentUserId && 
                             user.username.toLowerCase().startsWith(startAt)); 

        return results;

    } catch (error) {
        console.error("Error searching users:", error);
        throw new Error("Failed to perform user search.");
    }
};

/**
 * Adds a user to the current user's following MAP. 
 * The field being updated is 'following.targetUserId: true'.
 * @param {string} currentUserId - The UID of the user initiating the follow.
 * @param {string} targetUserId - The UID of the user being followed.
 */
export const followUser = async (currentUserId, targetUserId) => {
    if (currentUserId === targetUserId) {
        throw new Error("Cannot follow yourself.");
    }

    const currentUserRef = doc(db, USER_COLLECTION, currentUserId);
    
    // 🔑 FIX: Use dot notation to add a field to the 'following' map: { following: { [targetUserId]: true } }
    // Note: We use computed property names (ES6) to set the key dynamically.
    try {
        await updateDoc(currentUserRef, {
            [`following.${targetUserId}`]: true
        });
    } catch (error) {
        console.error("Error following user:", error);
        throw new Error("Failed to follow user.");
    }
};

/**
 * Removes a user from the current user's following MAP.
 * The field being updated is 'following.targetUserId'.
 * @param {string} currentUserId - The UID of the user initiating the unfollow.
 * @param {string} targetUserId - The UID of the user being unfollowed.
 */
export const unfollowUser = async (currentUserId, targetUserId) => {
    const currentUserRef = doc(db, USER_COLLECTION, currentUserId);
    
    // 🔑 FIX: Use dot notation and FieldValue.delete (which requires importing it)
    // Alternatively, we use a slightly simpler method that updates the whole map property:
    try {
        // Since we are only removing a field from a map, we need the FieldValue.delete constant.
        // Re-importing FieldValue.delete here to make the function work correctly.
        // NOTE: We MUST import FieldValue from 'firebase/firestore' for this to work.
        const { deleteField } = await import('firebase/firestore');

        await updateDoc(currentUserRef, {
            [`following.${targetUserId}`]: deleteField()
        });
    } catch (error) {
        console.error("Error unfollowing user:", error);
        throw new Error("Failed to unfollow user.");
    }
};

// Export all functions
export default {
    searchUsers,
    followUser,
    unfollowUser
};