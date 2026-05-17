import React from 'react';
import { AiOutlineArrowRight } from 'react-icons/ai';
import { IoRocketSharp } from 'react-icons/io5';
import styles from '../styles/CTABanner.module.css';
import Button from './Button';

const CTABanner = ({ onEnroll }) => {
    return (
        <section className={`container ${styles.section}`}>
            <div className={styles.banner}>
                <div className={styles.content}>
                    <h2 className={styles.title}>Ready to Remove the Fear of Math?</h2>
                    <p className={styles.subtitle}>Empowering young minds to enjoy, understand, and excel in Mathematics.</p>
                </div>
                <Button variant="accent" size="lg" onClick={onEnroll} className={styles.ctaBtn}>
                    <span>Grab Your Seat Now</span>
                    <AiOutlineArrowRight />
                </Button>
                <div className={styles.floatIcon}>
                    <IoRocketSharp size={80} />
                </div>
            </div>
        </section>
    );
};

export default CTABanner;
