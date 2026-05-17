import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Context & Hooks
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './hooks/useToast';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Toast from './components/Toast';

// Pages
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import LiveClass from './pages/LiveClass';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Toast />
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/live-class" 
                element={
                  <ProtectedRoute requirePaid={true}>
                    <LiveClass />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminPanel />
                  </ProtectedRoute>
                } 
              />

              {/* Catch all */}
              <Route path="*" element={<Landing />} />
            </Routes>
          </AnimatePresence>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
