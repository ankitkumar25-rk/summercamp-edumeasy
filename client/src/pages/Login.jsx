import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaExclamationTriangle } from 'react-icons/fa';
import { useToast } from '../hooks/useToast';
import { useApi, useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Footer from '../components/Footer';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [showResend, setShowResend] = useState(false);
    
    const { showToast } = useToast();
    const navigate = useNavigate();
    const api = useApi();
    const { checkAuth } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg('');
        setShowResend(false);

        try {
            await api.post('/api/auth/login', { email, password });
            await checkAuth(); // refresh user context
            showToast('success', 'Logged in successfully!');
            navigate('/dashboard');
        } catch (error) {
            if (error.response) {
                const msg = error.response.data.message;
                setErrorMsg(msg);
                if (error.response.status === 403 && msg.includes('verify')) {
                    setShowResend(true);
                }
            } else {
                setErrorMsg('Network error. Please try again later.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendOTP = async () => {
        try {
            await api.post('/api/auth/resend-otp', { email });
            showToast('success', 'New OTP sent to your email.');
            navigate('/verify-email', { state: { email } });
        } catch (error) {
            showToast('error', error.response?.data?.message || 'Failed to resend OTP.');
        }
    };

    const inputStyle = {
        width: '100%', padding: '12px', fontSize: '1rem',
        border: '2px solid var(--border)',
        borderRadius: 'var(--radius)', outline: 'none',
        fontFamily: 'var(--font-body)', background: 'var(--bg)',
        transition: 'all 0.3s ease'
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Navbar />
            
            <div className="container" style={{ padding: '60px 20px', display: 'flex', justifyContent: 'center', minHeight: '80vh', alignItems: 'center' }}>
                <div className="authCard">
                    <h2 style={{ textAlign: 'center', marginBottom: '10px', color: 'var(--primary)' }}>Welcome Back!</h2>
                    <p style={{ textAlign: 'center', marginBottom: '30px', color: 'var(--text-muted)' }}>
                        Log in to continue your adventure.
                    </p>
                    
                    {errorMsg && (
                        <div style={{ 
                            background: 'rgba(230, 51, 41, 0.1)', color: 'var(--danger)', 
                            padding: '12px', borderRadius: '8px', marginBottom: '20px', 
                            display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold'
                        }}>
                            <FaExclamationTriangle /> {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Email *</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} placeholder="youremail@example.com" />
                        </div>

                        <div style={{ position: 'relative' }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Password *</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} placeholder="Enter your password" />
                                <span onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '15px', top: '15px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                        </div>

                        {showResend && (
                            <div style={{ textAlign: 'center' }}>
                                <Button type="button" variant="outline" size="sm" onClick={handleResendOTP}>
                                    Resend Verification Email
                                </Button>
                            </div>
                        )}

                        <Button type="submit" variant="primary" size="lg" style={{ width: '100%', display: 'flex', justifyContent: 'center' }} disabled={isSubmitting}>
                            {isSubmitting ? 'Logging In...' : 'Log In'}
                        </Button>
                        
                        <div className="loginFooterLinks">
                            <Link to="/forgot-password" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>Forgot Password?</Link>
                            <div>
                                Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>Register</Link>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            
            <Footer />
        </motion.div>
    );
};

export default Login;
