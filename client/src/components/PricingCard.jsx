import React from 'react';
import { BsCheckCircleFill, BsLightningChargeFill } from 'react-icons/bs';
import { IoRocketSharp } from 'react-icons/io5';
import axios from 'axios';
import { useAuth, useApi } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import styles from '../styles/PricingCard.module.css';
import Button from './Button';

const PricingCard = () => {
    const { user, isAuthenticated, isPaid } = useAuth();
    const { showToast } = useToast();
    const api = useApi();

    const handleEnroll = async () => {
        if (!isAuthenticated) {
            showToast({ type: 'warning', message: 'Please login to enroll!' });
            // In a real app, this would open the login modal
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            window.location.href = `${API_URL}/api/auth/google`;
            return;
        }

        if (isPaid) {
            window.location.href = '/dashboard';
            return;
        }

        try {
            const { data: order } = await api.post('/api/orders/create');
            
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: "INR",
                name: "EduMEasy",
                description: "5-Day Algebra Summer Camp",
                order_id: order.id,
                handler: async (response) => {
                    try {
                        await api.post('/api/orders/verify', response);
                        showToast({ type: 'success', message: 'Welcome aboard! Enrollment successful.' });
                        setTimeout(() => window.location.href = '/dashboard', 2000);
                    } catch (err) {
                        showToast({ type: 'error', message: 'Payment verification failed!' });
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email
                },
                theme: {
                    color: "#3D1A8E"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error('Payment initialization error:', error);
            showToast({ type: 'error', message: 'Could not initialize payment.' });
        }
    };

    return (
        <section className={styles.section} id="pricing">
            <div className="container">
                <div className={styles.pricingBox}>
                    <div className={styles.header}>
                        <div className={styles.popularBadge}>MOST POPULAR</div>
                        <h2 className={styles.title}>All-Access Pass</h2>
                        <div className={styles.price}>
                            <span className={styles.currency}>₹</span>
                            <span className={styles.amount}>200</span>
                            <span className={styles.original}>₹999</span>
                        </div>
                    </div>

                    <div className={styles.features}>
                        <div className={styles.featureItem}>
                            <BsCheckCircleFill className={styles.checkIcon} />
                            <span>5 Days of LIVE Interactive Classes</span>
                        </div>
                        <div className={styles.featureItem}>
                            <BsCheckCircleFill className={styles.checkIcon} />
                            <span>Daily Practice Problems (DPP)</span>
                        </div>
                        <div className={styles.featureItem}>
                            <BsCheckCircleFill className={styles.checkIcon} />
                            <span>Parent & IITian Interaction Sessions</span>
                        </div>
                        <div className={styles.featureItem}>
                            <BsLightningChargeFill className={styles.bonusIcon} />
                            <span>Bonus: Top 10 get FREE SEATS in Advanced Workshop!</span>
                        </div>
                    </div>

                    <Button 
                        variant="accent" 
                        size="lg" 
                        className={styles.cta}
                        onClick={handleEnroll}
                    >
                        <IoRocketSharp />
                        <span>{isPaid ? 'Go to Dashboard' : 'Secure My Seat Now'}</span>
                    </Button>

                    <p className={styles.footerText}>Secure payment via Razorpay. No hidden fees.</p>
                </div>
            </div>
        </section>
    );
};

export default PricingCard;
