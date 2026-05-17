// CHANGED: Added custom sticker badges (COOL!, WOW!, FEARLESS!) with icons (FaStar, FaRocket, FaBolt) on the top-right corner of each card. Added responsive column layout behavior.

import React from 'react';
import { motion } from 'framer-motion';
import { HiLightningBolt } from 'react-icons/hi';
import { RiLiveLine } from 'react-icons/ri';
import { MdDevices } from 'react-icons/md';
import { FaStar, FaRocket, FaBolt } from 'react-icons/fa';
import styles from '../styles/FeatureCards.module.css';

const FeatureCards = () => {
    const features = [
        {
            title: 'Remove Math Fear',
            desc: 'Make Math simple, interesting and stress-free while building confidence.',
            icon: <HiLightningBolt />,
            color: 'var(--accent)',
            animation: 'wiggle',
            badgeText: 'FEARLESS!',
            badgeIcon: <FaStar size={10} />,
            badgeBg: 'var(--accent)'
        },
        {
            title: 'Coding Readiness',
            desc: 'Learn the mathematical foundation for coding and programming.',
            icon: <MdDevices />,
            color: 'var(--primary)',
            animation: 'float',
            badgeText: 'COOL!',
            badgeIcon: <FaRocket size={10} />,
            badgeBg: 'var(--primary)'
        },
        {
            title: 'Future Innovations',
            desc: 'Explore how Algebra powers AI, machine learning, and new tech.',
            icon: <RiLiveLine />,
            color: 'var(--danger)',
            animation: 'wiggle',
            badgeText: 'WOW!',
            badgeIcon: <FaBolt size={10} />,
            badgeBg: 'var(--danger)'
        }
    ];

    return (
        <section className={styles.section} id="about">
            <div className={`container ${styles.grid}`}>
                {features.map((feature, index) => (
                    <motion.div 
                        key={index}
                        className={styles.card}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -10 }}
                    >
                        {/* Task 2C Corner Sticker Badge */}
                        <div 
                            className={styles.badgeSticker} 
                            style={{ backgroundColor: feature.badgeBg }}
                            aria-hidden="true"
                        >
                            {feature.badgeIcon}
                            <span style={{ marginLeft: '4px' }}>{feature.badgeText}</span>
                        </div>

                        <div 
                            className={`${styles.iconWrapper} ${feature.animation === 'wiggle' ? 'animate-wiggle' : 'animate-float'}`}
                            style={{ backgroundColor: feature.color }}
                        >
                            {feature.icon}
                        </div>
                        <h3 className={styles.title}>{feature.title}</h3>
                        <p className={styles.desc}>{feature.desc}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default FeatureCards;
