import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { FaExclamationTriangle, FaEnvelope } from 'react-icons/fa';
import { useToast } from '../hooks/useToast';
import { useApi } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Footer from '../components/Footer';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const api = useApi();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg('');

        try {
            await api.post('/api/auth/forgot-password', { email });
            showToast('success', 'If the email exists, a reset link was sent.');
            navigate('/login');
        } catch (error) {
            if (error.response?.data?.message) {
                setErrorMsg(error.response.data.message);
            } else {
                setErrorMsg('Network error. Please try again later.');
            }
        } finally {
            setIsSubmitting(false);
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
                    <h2 style={{ textAlign: 'center', marginBottom: '10px', color: 'var(--primary)' }}>Forgot Password</h2>
                    <p style={{ textAlign: 'center', marginBottom: '30px', color: 'var(--text-muted)' }}>
                        Enter your email and we will send a reset link.
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
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    style={inputStyle}
                                    placeholder="youremail@example.com"
                                />
                                <FaEnvelope style={{ position: 'absolute', right: '14px', top: '14px', color: 'var(--text-muted)' }} />
                            </div>
                        </div>

                        <Button type="submit" variant="primary" size="lg" style={{ width: '100%', display: 'flex', justifyContent: 'center' }} disabled={isSubmitting}>
                            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                        </Button>

                        <div style={{ textAlign: 'center' }}>
                            Remembered your password? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>Log In</Link>
                        </div>
                    </form>
                </div>
            </div>

            <Footer />
        </motion.div>
    );
};

export default ForgotPassword;
