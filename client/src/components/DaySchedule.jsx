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
            day: '02 June', 
            title: 'Variables & Expressions', 
            icon: <TbVariable size={32} />, 
            color: '#3D1A8E',
            description: 'Basics: Why Algebra, Variables and Constant, Operations on Variables | Foundational: Algebraic Expressions, Operations (Multiplications), Factorization'
        },
        { 
            id: 2, 
            day: '03 June', 
            title: 'Equations & Like Terms', 
            icon: <MdBalance size={32} />, 
            color: '#F5A623',
            description: 'Basics: Equations and Inequations, Like and Unlike Terms, Addition and Subtraction of Expressions | Foundational: Division, Equations and Inequations, Factorization'
        },
        { 
            id: 3, 
            day: '04 June', 
            title: 'Polynomial Operations', 
            icon: <BiLineChart size={32} />, 
            color: '#E63329',
            description: 'Basics: Monomial to Polynomial, Degree, Operations | Foundational: Zeros of a Polynomial, Solving Quadratic Equation'
        },
        { 
            id: 4, 
            day: '05 June', 
            title: 'Applications & AI', 
            icon: <TbMathFunction size={32} />, 
            color: '#22C55E',
            description: 'Basics: Learning by Doing, Applications, Algebra in AI | Foundational: Solution of Equations in Two Variables, Applications'
        },
        { 
            id: 5, 
            day: '06 June', 
            title: 'Test & Interaction', 
            icon: <FaTrophy size={32} />, 
            color: '#D4880A',
            description: 'Basics & Foundational: Test and Discussion with Parents (Optional)'
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
