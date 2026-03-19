import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicRoute = ({ children }) => {
    const { user } = useAuth();

    if (user) {
        if (user.role === 'Admin') return <Navigate to="/admin/dashboard" replace />;
        if (user.role === 'Faculty') return <Navigate to="/faculty/dashboard" replace />;
        if (user.role === 'Student') return <Navigate to="/student/dashboard" replace />;
        
        // Fallback
        return <Navigate to="/" replace />;
    }

    return children;
};

export default PublicRoute;
