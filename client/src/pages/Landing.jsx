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

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        // Handle scroll redirect from other pages
        if (location.state?.scrollTo) {
            const element = document.getElementById(location.state.scrollTo);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [location]);

    const handleEnrollClick = () => {
        if (!isAuthenticated) {
            navigate('/register');
            return;
        }
        if (isPaid) {
            navigate('/dashboard');
        } else {
            const pricing = document.getElementById('pricing');
            if (pricing) pricing.scrollIntoView({ behavior: 'smooth' });
        }
    };



    const handleJoinLive = () => {
        if (!isAuthenticated) {
            navigate('/login');
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
                <MathFloats />
                <DaySchedule />
                <FeatureCards />
                <Testimonials />
                <PricingCard />
                <CTABanner onEnroll={handleEnrollClick} />
                <Footer />
            </motion.div>

        </motion.div>
    );
};

export default Landing;
