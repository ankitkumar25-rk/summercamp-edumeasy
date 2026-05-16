import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TbVariable, TbMathFunction } from 'react-icons/tb';
import { MdBalance } from 'react-icons/md';
import { BiLineChart } from 'react-icons/bi';
import { FaTrophy } from 'react-icons/fa';
import styles from '../styles/DaySchedule.module.css';

const DaySchedule = () => {
    const [activeDay, setActiveDay] = useState(1);

    const days = [
        { 
            id: 1, 
            day: 'Day 1', 
            title: 'Variable Valley', 
            icon: <TbVariable size={32} />, 
            color: '#3D1A8E',
            description: 'Meet x and y! Learn how variables work through interactive puzzles and hidden messages.'
        },
        { 
            id: 2, 
            day: 'Day 2', 
            title: 'The Great Balance', 
            icon: <MdBalance size={32} />, 
            color: '#F5A623',
            description: 'The secret art of balancing equations. Keep both sides equal or the tower falls!'
        },
        { 
            id: 3, 
            day: 'Day 3', 
            title: 'Linear Legends', 
            icon: <BiLineChart size={32} />, 
            color: '#E63329',
            description: 'Master linear equations and use them to solve real-world mysteries in the Legend City.'
        },
        { 
            id: 4, 
            day: 'Day 4', 
            title: 'Polynomial Park', 
            icon: <TbMathFunction size={32} />, 
            color: '#22C55E',
            description: 'Explore the park of powers! Learn how to combine expressions like building blocks.'
        },
        { 
            id: 5, 
            day: 'Day 5', 
            title: 'Algebra Master', 
            icon: <FaTrophy size={32} />, 
            color: '#D4880A',
            description: 'The final boss! Show your skills in the Grand Algebra Quest and earn your certificate.'
        }
    ];

    const currentDayData = days.find(d => d.id === activeDay);

    return (
        <section className={styles.section} id="schedule">
            <div className="container">
                <h2 className={styles.sectionTitle}>5-Day Adventure Roadmap</h2>
                <div className={styles.grid}>
                    {days.map((day) => (
                        <motion.div
                            key={day.id}
                            className={`${styles.dayCard} ${activeDay === day.id ? styles.active : ''}`}
                            onClick={() => setActiveDay(day.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{ '--day-color': day.color }}
                        >
                            <div className={styles.iconWrapper}>{day.icon}</div>
                            <span className={styles.dayLabel}>{day.day}</span>
                            <h4 className={styles.dayTitle}>{day.title}</h4>
                        </motion.div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeDay}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4 }}
                        className={styles.detailPanel}
                    >
                        <div className={styles.detailContent} style={{ borderTop: `6px solid ${currentDayData.color}` }}>
                            <div className={styles.detailHeader}>
                                <div className={styles.detailIcon} style={{ backgroundColor: currentDayData.color }}>
                                    {currentDayData.icon}
                                </div>
                                <div>
                                    <h3 className={styles.detailTitle}>{currentDayData.title}</h3>
                                    <span className={styles.detailDay}>{currentDayData.day} Focus</span>
                                </div>
                            </div>
                            <p className={styles.detailDesc}>{currentDayData.description}</p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
};

export default DaySchedule;
