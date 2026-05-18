import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useToast } from '../hooks/useToast';
import { useApi } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Footer from '../components/Footer';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const api = useApi();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const token = query.get('token') || '';
    const email = query.get('email') || '';

    const getPasswordStrength = (pass) => {
        if (!pass) return { label: '', color: 'transparent', width: '0%' };
        let strength = 0;
        const hasUpper = /[A-Z]/.test(pass);
        const hasLower = /[a-z]/.test(pass);
        const hasNum = /[0-9]/.test(pass);
        const hasSpec = /[\W_]/.test(pass);

        if (hasUpper) strength++;
        if (hasLower) strength++;
        if (hasNum) strength++;
        if (hasSpec) strength++;

        if (strength < 3) return { label: 'Weak', color: 'var(--danger)', width: '25%' };
        if (strength === 3) return { label: 'Fair', color: 'var(--accent)', width: '50%' };
        if (strength === 4 && pass.length < 12) return { label: 'Good', color: '#FFD700', width: '75%' };
        if (strength === 4 && pass.length >= 12) return { label: 'Strong', color: 'var(--success)', width: '100%' };
        return { label: 'Weak', color: 'var(--danger)', width: '25%' };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg('');

        if (!token || !email) {
            setErrorMsg('Reset link is invalid or missing.');
            setIsSubmitting(false);
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match.');
            setIsSubmitting(false);
            return;
        }

        try {
            await api.post('/api/auth/reset-password', {
                email,
                token,
                password
            });
            showToast('success', 'Password updated! Please log in.');
            navigate('/login');
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Failed to reset password.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputStyle = (err) => ({
        width: '100%', padding: '12px', fontSize: '1rem',
        border: err ? '2px solid var(--danger)' : '2px solid var(--border)',
        borderRadius: 'var(--radius)', outline: 'none',
        fontFamily: 'var(--font-body)', background: 'var(--bg)',
        transition: 'all 0.3s ease'
    });

    const passStrength = getPasswordStrength(password);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Navbar />

            <div className="container" style={{ padding: '60px 20px', display: 'flex', justifyContent: 'center', minHeight: '80vh', alignItems: 'center' }}>
                <div className="authCard">
                    <h2 style={{ textAlign: 'center', marginBottom: '10px', color: 'var(--primary)' }}>Set New Password</h2>
                    <p style={{ textAlign: 'center', marginBottom: '30px', color: 'var(--text-muted)' }}>
                        Create a new password for your account.
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
                        <div style={{ position: 'relative' }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>New Password *</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={inputStyle(false)}
                                    placeholder="Create a strong password"
                                />
                                <span onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '15px', top: '15px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                            <div style={{ height: '4px', width: '100%', background: '#eee', marginTop: '8px', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: passStrength.width, background: passStrength.color, transition: 'all 0.3s' }}></div>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: passStrength.color, marginTop: '4px', fontWeight: 'bold', textAlign: 'right' }}>
                                {passStrength.label}
                            </div>
                        </div>

                        <div style={{ position: 'relative' }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Confirm Password *</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    style={inputStyle(password && confirmPassword && password !== confirmPassword)}
                                    placeholder="Retype your password"
                                />
                                <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '40px', top: '15px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                                {confirmPassword.length > 0 && (
                                    <span style={{ position: 'absolute', right: '15px', top: '15px' }}>
                                        {password === confirmPassword ?
                                            <FaCheckCircle color="var(--success)" /> :
                                            <FaTimesCircle color="var(--danger)" />
                                        }
                                    </span>
                                )}
                            </div>
                        </div>

                        <Button type="submit" variant="primary" size="lg" style={{ width: '100%', display: 'flex', justifyContent: 'center' }} disabled={isSubmitting}>
                            {isSubmitting ? 'Updating...' : 'Update Password'}
                        </Button>

                        <div style={{ textAlign: 'center' }}>
                            Back to <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>Log In</Link>
                        </div>
                    </form>
                </div>
            </div>

            <Footer />
        </motion.div>
    );
};

export default ResetPassword;
