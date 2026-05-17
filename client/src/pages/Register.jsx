import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useToast } from '../hooks/useToast';
import { useApi, useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Footer from '../components/Footer';

const classToBatch = {
    6:  "Basics of Algebra (Class 6-7)",
    7:  "Basics of Algebra (Class 6-7)",
    8:  "Foundational Algebra (Class 8-9)",
    9:  "Foundational Algebra (Class 8-9)",
    10: "Advance Your Skills"
};

const Register = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        fatherName: '',
        dateOfBirth: '',
        schoolName: '',
        studentClass: 'Choose',
        whatsapp: '',
        email: '',
        password: '',
        confirmPassword: '',
        state: '',
        district: '',
        batchId: 'Choose'
    });
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [autoSelectedBatch, setAutoSelectedBatch] = useState(false);
    const [emailSuggestion, setEmailSuggestion] = useState('');
    
    const { showToast } = useToast();
    const navigate = useNavigate();
    const api = useApi();
    const { checkAuth } = useAuth();
    
    const inputRefs = useRef({});

    const checkEmailTypo = (email) => {
        const typos = {
            'gmial.com': 'gmail.com',
            'gmai.com': 'gmail.com',
            'gamil.com': 'gmail.com',
            'yahooo.com': 'yahoo.com',
            'yaho.com': 'yahoo.com',
            'hotmial.com': 'hotmail.com',
            'outloo.com': 'outlook.com'
        };
        const parts = email.split('@');
        if (parts.length === 2 && typos[parts[1]]) {
            return `${parts[0]}@${typos[parts[1]]}`;
        }
        return '';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        let newFormData = { ...formData, [name]: value };
        
        if (name === 'studentClass') {
            const selectedClass = Number(value);
            if (classToBatch[selectedClass]) {
                newFormData.batchId = classToBatch[selectedClass];
                setAutoSelectedBatch(true);
            }
        } else if (name === 'batchId') {
            setAutoSelectedBatch(false);
        } else if (name === 'email') {
            setEmailSuggestion(checkEmailTypo(value));
        }

        setFormData(newFormData);
        
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

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
        if (strength === 4 && pass.length < 12) return { label: 'Good', color: '#FFD700', width: '75%' }; // Yellow
        if (strength === 4 && pass.length >= 12) return { label: 'Strong', color: 'var(--success)', width: '100%' };
        return { label: 'Weak', color: 'var(--danger)', width: '25%' };
    };

    const validate = () => {
        const newErrors = {};
        
        if (!formData.fullName || formData.fullName.trim().length < 2 || formData.fullName.trim().length > 60 || !/^[a-zA-Z\s]{2,60}$/.test(formData.fullName)) {
            newErrors.fullName = 'Please enter a valid full name (letters only)';
        }
        if (!formData.fatherName || formData.fatherName.trim().length < 2 || formData.fatherName.trim().length > 60 || !/^[a-zA-Z\s]{2,60}$/.test(formData.fatherName)) {
            newErrors.fatherName = "Please enter a valid father's name";
        }
        
        if (!formData.dateOfBirth) {
            newErrors.dateOfBirth = 'Date of birth is required';
        } else {
            const birthDate = new Date(formData.dateOfBirth);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            if (age < 5) newErrors.dateOfBirth = 'Student must be at least 5 years old';
            else if (age >= 20) newErrors.dateOfBirth = 'Student must be under 20 years old';
        }

        if (!formData.schoolName || formData.schoolName.trim().length < 3 || formData.schoolName.trim().length > 100) {
            newErrors.schoolName = 'Please enter the school name';
        }
        
        if (!formData.studentClass || formData.studentClass === "Choose") {
            newErrors.studentClass = 'Please select your class';
        }
        
        const cleanWhatsapp = formData.whatsapp.replace(/[\s-]/g, '');
        if (!cleanWhatsapp || !/^[6-9][0-9]{9}$/.test(cleanWhatsapp)) {
            newErrors.whatsapp = 'Enter a valid 10-digit WhatsApp number';
        }
        
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Enter a valid email address';
        }
        
        const hasUpper = /[A-Z]/.test(formData.password);
        const hasLower = /[a-z]/.test(formData.password);
        const hasNum = /[0-9]/.test(formData.password);
        const hasSpec = /[\W_]/.test(formData.password);
        if (formData.password.length < 8 || !hasUpper || !hasLower || !hasNum || !hasSpec) {
            newErrors.password = 'Password must be at least 8 characters with uppercase, number, and special character';
        }
        
        if (!formData.confirmPassword || formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        
        if (!formData.state || formData.state.trim().length < 2) {
            newErrors.state = 'Please enter your state';
        }
        
        if (!formData.district || formData.district.trim().length < 2) {
            newErrors.district = 'Please enter your district';
        }
        
        if (!formData.batchId || formData.batchId === "Choose") {
            newErrors.batchId = 'Please select a batch';
        }

        setErrors(newErrors);
        
        if (Object.keys(newErrors).length > 0) {
            showToast('error', 'Please fix the errors in the form before submitting.');
            const firstErrorField = Object.keys(newErrors)[0];
            if (inputRefs.current[firstErrorField]) {
                inputRefs.current[firstErrorField].focus();
                inputRefs.current[firstErrorField].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        
        setIsSubmitting(true);
        try {
            const payload = { 
                fullName: formData.fullName.trim(),
                fatherName: formData.fatherName.trim(),
                dateOfBirth: formData.dateOfBirth,
                schoolName: formData.schoolName.trim(),
                studentClass: formData.studentClass,
                whatsapp: formData.whatsapp.replace(/[\s-]/g, ''),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                state: formData.state.trim(),
                district: formData.district.trim(),
                batchId: formData.batchId
            };
            
            const res = await api.post('/api/auth/register', payload);
            await checkAuth();
            showToast('success', 'Account created! Please verify your email.');
            navigate('/dashboard');
        } catch (error) {
            if (error.response?.status === 409) {
                setErrors({ email: 'This email is already registered. Log in instead?' });
                if (inputRefs.current['email']) inputRefs.current['email'].focus();
            } else if (error.response?.status === 429) {
                showToast('error', 'Too many attempts. Please wait a few minutes.');
            } else if (error.response?.data?.errors) {
                const srvErrors = {};
                error.response.data.errors.forEach(err => {
                    srvErrors[err.path] = err.msg;
                });
                setErrors(srvErrors);
            } else if (error.response?.data?.message) {
                showToast('error', error.response.data.message);
            } else {
                showToast('error', 'Something went wrong. Please try again.');
            }
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

    const errorMsgStyle = {
        color: 'var(--danger)', fontSize: '0.85rem', marginTop: '5px',
        display: 'flex', alignItems: 'flex-start', gap: '5px', fontWeight: 'bold'
    };

    const passStrength = getPasswordStrength(formData.password);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Navbar />
            
            <div className="container" style={{ padding: '60px 20px', display: 'flex', justifyContent: 'center' }}>
                <div className="authCard wide">
                    <h2 style={{ textAlign: 'center', marginBottom: '10px', color: 'var(--primary)' }}>Create Your Account</h2>
                    <p style={{ textAlign: 'center', marginBottom: '30px', color: 'var(--text-muted)' }}>
                        Join the Algebra Summer Camp Adventure!
                    </p>
                    
                    <form onSubmit={handleSubmit} className="responsiveFormGrid">
                        
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>FULL NAME *</label>
                            <input ref={el => inputRefs.current['fullName'] = el} type="text" name="fullName" value={formData.fullName} onChange={handleChange} style={inputStyle(errors.fullName)} placeholder="Enter your full name" />
                            {errors.fullName && <div style={errorMsgStyle}><FaExclamationTriangle style={{marginTop: '2px'}} /> <span>{errors.fullName}</span></div>}
                        </div>

                        <div>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>FATHER'S NAME *</label>
                            <input ref={el => inputRefs.current['fatherName'] = el} type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} style={inputStyle(errors.fatherName)} placeholder="Father's full name" />
                            {errors.fatherName && <div style={errorMsgStyle}><FaExclamationTriangle style={{marginTop: '2px'}} /> <span>{errors.fatherName}</span></div>}
                        </div>

                        <div>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>DATE OF BIRTH *</label>
                            <input ref={el => inputRefs.current['dateOfBirth'] = el} type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} style={inputStyle(errors.dateOfBirth)} />
                            {errors.dateOfBirth && <div style={errorMsgStyle}><FaExclamationTriangle style={{marginTop: '2px'}} /> <span>{errors.dateOfBirth}</span></div>}
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>NAME OF THE SCHOOL *</label>
                            <input ref={el => inputRefs.current['schoolName'] = el} type="text" name="schoolName" value={formData.schoolName} onChange={handleChange} style={inputStyle(errors.schoolName)} placeholder="Your school name" />
                            {errors.schoolName && <div style={errorMsgStyle}><FaExclamationTriangle style={{marginTop: '2px'}} /> <span>{errors.schoolName}</span></div>}
                        </div>

                        <div>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>CLASS *</label>
                            <select ref={el => inputRefs.current['studentClass'] = el} name="studentClass" value={formData.studentClass} onChange={handleChange} style={inputStyle(errors.studentClass)}>
                                <option value="Choose" disabled>Choose</option>
                                <option value="6">Class 6</option>
                                <option value="7">Class 7</option>
                                <option value="8">Class 8</option>
                                <option value="9">Class 9</option>
                                <option value="10">Class 10</option>
                            </select>
                            {errors.studentClass && <div style={errorMsgStyle}><FaExclamationTriangle style={{marginTop: '2px'}} /> <span>{errors.studentClass}</span></div>}
                        </div>

                        <div>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>CONTACT (WhatsApp) *</label>
                            <input ref={el => inputRefs.current['whatsapp'] = el} type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} style={inputStyle(errors.whatsapp)} placeholder="10-digit mobile number" />
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>We will send camp updates on this number</div>
                            {errors.whatsapp && <div style={errorMsgStyle}><FaExclamationTriangle style={{marginTop: '2px'}} /> <span>{errors.whatsapp}</span></div>}
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>E-MAIL ADDRESS *</label>
                            <input ref={el => inputRefs.current['email'] = el} type="text" name="email" value={formData.email} onChange={handleChange} style={inputStyle(errors.email)} placeholder="youremail@example.com" />
                            {emailSuggestion && !errors.email && (
                                <div 
                                    style={{ fontSize: '0.85rem', color: 'var(--accent-dark)', marginTop: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                    onClick={() => { setFormData(prev => ({...prev, email: emailSuggestion})); setEmailSuggestion(''); }}
                                >
                                    Did you mean {emailSuggestion}? Click to fix
                                </div>
                            )}
                            {errors.email && <div style={errorMsgStyle}><FaExclamationTriangle style={{marginTop: '2px'}} /> <span>{errors.email}</span></div>}
                        </div>

                        <div style={{ position: 'relative' }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>PASSWORD *</label>
                            <div style={{ position: 'relative' }}>
                                <input ref={el => inputRefs.current['password'] = el} type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} style={inputStyle(errors.password)} placeholder="Create a strong password" />
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
                            {errors.password && <div style={errorMsgStyle}><FaExclamationTriangle style={{marginTop: '2px'}} /> <span>{errors.password}</span></div>}
                        </div>

                        <div style={{ position: 'relative' }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>CONFIRM PASSWORD *</label>
                            <div style={{ position: 'relative' }}>
                                <input ref={el => inputRefs.current['confirmPassword'] = el} type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} style={inputStyle(errors.confirmPassword)} placeholder="Retype password" />
                                <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '40px', top: '15px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                                {formData.confirmPassword.length > 0 && (
                                    <span style={{ position: 'absolute', right: '15px', top: '15px' }}>
                                        {formData.password === formData.confirmPassword ? 
                                            <FaCheckCircle color="var(--success)" /> : 
                                            <FaTimesCircle color="var(--danger)" />
                                        }
                                    </span>
                                )}
                            </div>
                            {errors.confirmPassword && <div style={errorMsgStyle}><FaExclamationTriangle style={{marginTop: '2px'}} /> <span>{errors.confirmPassword}</span></div>}
                        </div>

                        <div>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>STATE *</label>
                            <input ref={el => inputRefs.current['state'] = el} type="text" name="state" value={formData.state} onChange={handleChange} style={inputStyle(errors.state)} placeholder="Your state" />
                            {errors.state && <div style={errorMsgStyle}><FaExclamationTriangle style={{marginTop: '2px'}} /> <span>{errors.state}</span></div>}
                        </div>

                        <div>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>DISTRICT *</label>
                            <input ref={el => inputRefs.current['district'] = el} type="text" name="district" value={formData.district} onChange={handleChange} style={inputStyle(errors.district)} placeholder="Your district" />
                            {errors.district && <div style={errorMsgStyle}><FaExclamationTriangle style={{marginTop: '2px'}} /> <span>{errors.district}</span></div>}
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>SELECT BATCH *</label>
                            <select ref={el => inputRefs.current['batchId'] = el} name="batchId" value={formData.batchId} onChange={handleChange} style={inputStyle(errors.batchId)}>
                                <option value="Choose" disabled>Choose</option>
                                <option value="Basics of Algebra (Class 6-7)">Basics of Algebra (Class 6-7)</option>
                                <option value="Foundational Algebra (Class 8-9)">Foundational Algebra (Class 8-9)</option>
                                <option value="Advance Your Skills">Advance Your Skills</option>
                            </select>
                            {autoSelectedBatch && !errors.batchId && (
                                <p style={{ fontSize: '12px', color: 'gray', marginTop: '4px' }}>
                                    ✓ Auto-selected based on your class. You can change this.
                                </p>
                            )}
                            {errors.batchId && <div style={errorMsgStyle}><FaExclamationTriangle style={{marginTop: '2px'}} /> <span>{errors.batchId}</span></div>}
                        </div>

                        <div style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
                            <Button type="submit" variant="primary" size="lg" style={{ width: '100%', display: 'flex', justifyContent: 'center' }} disabled={isSubmitting}>
                                {isSubmitting ? 'Creating Account...' : 'Create Account'}
                            </Button>
                        </div>
                        
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '10px' }}>
                            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>Log In</Link>
                        </div>
                    </form>
                </div>
            </div>
            
            <Footer />
        </motion.div>
    );
};

export default Register;
