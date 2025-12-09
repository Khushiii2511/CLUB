// src/components/PrivateRoute.jsx

import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading } = useContext(AuthContext);

    if (loading) {
        // Show a loading state while Firebase checks the user status
        return <div>Checking authentication...</div>;
    }

    // If authenticated, render the children (the protected page)
    if (isAuthenticated) {
        return children;
    }

    // If not authenticated, redirect them to the login page
    return <Navigate to="/login" />;
};

export default PrivateRoute;