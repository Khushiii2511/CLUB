// src/App.jsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard'; // Create this component
import ActivityFeed from './pages/ActivityFeed'; // Create this component
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <div className="App">
      {/* You can add a Header/Navigation component here */}
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/feed" 
          element={
            <PrivateRoute>
              <ActivityFeed />
            </PrivateRoute>
          } 
        />
        
        {/* Default route redirects to Dashboard or Login */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  );
}

export default App;