import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa';
import { IoRocketSharp } from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';

// Components
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import LiveClassBanner from '../components/LiveClassBanner';
import MathFloats from '../components/MathFloats';
import DaySchedule from '../components/DaySchedule';
import FeatureCards from '../components/FeatureCards';
import Testimonials from '../components/Testimonials';
import PricingCard from '../components/PricingCard';
import CTABanner from '../components/CTABanner';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import Button from '../components/Button';

const Landing = () => {
    const { isAuthenticated, isPaid } = useAuth();
    const { showToast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        // Handle scroll redirect from other pages
        if (location.state?.scrollTo) {
            const element = document.getElementById(location.state.scrollTo);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
        // Show login modal if redirected from ProtectedRoute
        if (location.state?.showLogin) {
            setIsLoginModalOpen(true);
        }
    }, [location]);

    const handleEnrollClick = () => {
        if (!isAuthenticated) {
            setIsLoginModalOpen(true);
            return;
        }
        if (isPaid) {
            navigate('/dashboard');
        } else {
            const pricing = document.getElementById('pricing');
            if (pricing) pricing.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${API_URL}/api/auth/google`;
    };

    const handleJoinLive = () => {
        if (!isAuthenticated) {
            setIsLoginModalOpen(true);
            return;
        }
        if (isPaid) {
            navigate('/live-class');
        } else {
            handleEnrollClick();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <Navbar />
            
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <HeroSection onEnroll={handleEnrollClick} />
                <LiveClassBanner isLive={true} onJoin={handleJoinLive} />
                <MathFloats />
                <DaySchedule />
                <FeatureCards />
                <Testimonials />
                <PricingCard />
                <CTABanner onEnroll={handleEnrollClick} />
                <Footer />
            </motion.div>

            {/* Login Modal */}
            <Modal 
                isOpen={isLoginModalOpen} 
                onClose={() => setIsLoginModalOpen(false)} 
                title="Join the Adventure!"
            >
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ 
                        fontSize: '4rem', 
                        marginBottom: '20px', 
                        color: 'var(--accent)',
                        animation: 'wiggle 2s infinite'
                    }}>
                        <IoRocketSharp />
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '15px' }}>Ready to Learn?</h2>
                    <p style={{ fontWeight: '700', color: 'var(--text-muted)', marginBottom: '30px' }}>
                        Login with Google to track your XP, join live classes, and earn your certificate!
                    </p>
                    <Button 
                        variant="primary" 
                        size="lg" 
                        onClick={handleGoogleLogin}
                        style={{ width: '100%' }}
                    >
                        <FaGoogle /> <span>Login with Google</span>
                    </Button>
                </div>
            </Modal>
        </motion.div>
    );
};

export default Landing;
