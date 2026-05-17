import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { useApi, useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Footer from '../components/Footer';

const VerifyEmail = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [isShake, setIsShake] = useState(false);
    
    const inputRefs = useRef([]);
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const api = useApi();
    const { checkAuth } = useAuth();
    
    const email = location.state?.email;

    useEffect(() => {
        if (!email) {
            navigate('/register');
        }
        
        const timer = setInterval(() => {
            setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [email, navigate]);

    const handleChange = (e, index) => {
        const value = e.target.value;
        if (/^[0-9]$/.test(value)) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);
            if (index < 5) inputRefs.current[index + 1].focus();
        } else if (value === '') {
            const newOtp = [...otp];
            newOtp[index] = '';
            setOtp(newOtp);
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
        if (pastedData.every(char => /^[0-9]$/.test(char))) {
            const newOtp = [...otp];
            pastedData.forEach((char, i) => {
                if (i < 6) newOtp[i] = char;
            });
            setOtp(newOtp);
            inputRefs.current[Math.min(pastedData.length, 5)].focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            triggerShake();
            showToast('error', 'Please enter a 6-digit OTP.');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/api/auth/verify-email', { email, otp: otpString });
            await checkAuth(); // Update user context so isEmailVerified becomes true
            showToast('success', 'Email verified successfully!');
            navigate('/dashboard');
        } catch (error) {
            triggerShake();
            showToast('error', error.response?.data?.message || 'Invalid OTP. Try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;
        try {
            await api.post('/api/auth/resend-otp', { email });
            showToast('success', 'New OTP sent to your email.');
            setCountdown(60);
        } catch (error) {
            showToast('error', error.response?.data?.message || 'Failed to resend OTP.');
        }
    };

    const triggerShake = () => {
        setIsShake(true);
        setTimeout(() => setIsShake(false), 500);
    };

    const inputStyle = {
        width: 'clamp(32px, 8vw, 50px)', 
        height: 'clamp(42px, 10vw, 60px)', 
        fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
        textAlign: 'center', border: '2px solid var(--primary)',
        borderRadius: '12px', fontWeight: 'bold', fontFamily: 'var(--font-display)',
        outline: 'none', background: 'var(--bg)', color: 'var(--text-dark)'
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Navbar />
            
            <div className="container" style={{ padding: '80px 20px', display: 'flex', justifyContent: 'center', minHeight: '80vh', alignItems: 'center' }}>
                <div className="authCard" style={{ textAlign: 'center' }}>
                    <h2 style={{ marginBottom: '10px', color: 'var(--primary)' }}>Verify Your Email</h2>
                    <p style={{ marginBottom: '30px', color: 'var(--text-muted)' }}>
                        Enter the 6-digit OTP sent to <strong style={{color: 'var(--text-dark)'}}>{email}</strong>
                    </p>

                    <form onSubmit={handleSubmit}>
                        <motion.div 
                            style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px' }}
                            animate={isShake ? { x: [-10, 10, -10, 10, 0] } : {}}
                            transition={{ duration: 0.4 }}
                        >
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handleChange(e, index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    onPaste={handlePaste}
                                    style={inputStyle}
                                />
                            ))}
                        </motion.div>

                        <Button type="submit" variant="primary" size="lg" style={{ width: '100%', marginBottom: '20px' }} disabled={isSubmitting}>
                            {isSubmitting ? 'Verifying...' : 'Verify'}
                        </Button>

                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            Didn't receive the code?{' '}
                            {countdown > 0 ? (
                                <span>Resend in {countdown}s</span>
                            ) : (
                                <span onClick={handleResend} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>
                                    Resend OTP
                                </span>
                            )}
                        </div>
                    </form>
                </div>
            </div>
            
            <Footer />
        </motion.div>
    );
};

export default VerifyEmail;
