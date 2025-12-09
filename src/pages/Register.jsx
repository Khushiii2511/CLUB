//
import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; 
import './Register.css'; // <-- 🔑 IMPORTING THE COMPONENT-SPECIFIC STYLES

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false); // New state for loading indicator
    const { register, isAuthenticated } = useContext(AuthContext); 
    const navigate = useNavigate();

    // Use useEffect for navigation to prevent React warnings during the render phase
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

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
        setIsLoading(true);

        const { username, email, password, confirmPassword } = formData;
        
        if (!username || !email || !password || !confirmPassword) {
            setError('All fields are required.');
            setIsLoading(false);
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setIsLoading(false);
            return;
        }

        try {
            await register(email, password, username);
            // Navigation handled by useEffect upon successful registration
            // Removed alert and direct navigate('/dashboard') since useEffect handles it
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isAuthenticated) {
        return null;
    }

    return (
        <div className="auth-page-wrapper">
            <div className="auth-card-container">
                <h1 className="auth-title">Create Your Account</h1>
                
                <form onSubmit={handleSubmit} className="auth-form">
                    
                    {error && <p className="auth-error-message">{error}</p>}
                    
                    {/* Username Field */}
                    <div className="form-group">
                        <input
                            type="text"
                            id="username"
                            name="username"
                            placeholder="Username (Public Name)"
                            value={formData.username}
                            onChange={handleChange}
                            className="form-input"
                            required
                        />
                    </div>
                    
                    {/* Email Field */}
                    <div className="form-group">
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={handleChange}
                            className="form-input"
                            required
                        />
                    </div>
                    
                    {/* Password Field */}
                    <div className="form-group">
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            className="form-input"
                            required
                        />
                    </div>

                    {/* Confirm Password Field */}
                    <div className="form-group">
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="form-input"
                            required
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="gradient-button auth-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <p className="auth-footer-text">
                    Already have an account? <Link to="/login" className="auth-register-link">Log in here</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;