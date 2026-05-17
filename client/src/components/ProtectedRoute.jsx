import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

const ProtectedRoute = ({ children, requirePaid = false, requireAdmin = false }) => {
    const { user, loading, isAuthenticated, isAdmin, isPaid } = useAuth();
    const location = useLocation();

    if (loading) {
        return <Loader />;
    }

    if (!isAuthenticated) {
        // Redirect to login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireAdmin && !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    if (requirePaid && !isPaid && !isAdmin) {
        return <Navigate to="/" state={{ scrollToPricing: true }} replace />;
    }

    return children;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
    requirePaid: PropTypes.bool,
    requireAdmin: PropTypes.bool,
};

export default ProtectedRoute;
