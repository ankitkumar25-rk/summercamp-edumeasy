import React from 'react';
import { motion } from 'framer-motion';
import { TbMathFunction, TbVariable } from 'react-icons/tb';
import styles from '../styles/MathFloats.module.css';

const MathFloats = () => {
    const symbols = [
        { text: 'x + y = 10', icon: <TbVariable />, color: '#FFD700', delay: 0 },
        { text: 'a² + b² = c²', icon: <TbMathFunction />, color: '#FF4D6D', delay: 0.5 },
        { text: 'y = mx + c', icon: <TbMathFunction />, color: '#00B4D8', delay: 1 },
        { text: '√144 = 12', icon: <TbMathFunction />, color: '#00D289', delay: 1.5 },
        { text: '3x - 5 = 16', icon: <TbVariable />, color: '#FF7B00', delay: 2 },
    ];

    return (
        <section className={styles.section}>
            <div className={`container ${styles.container}`}>
                {symbols.map((symbol, index) => (
                    <motion.div
                        key={index}
                        className={styles.chip}
                        style={{ backgroundColor: symbol.color }}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: symbol.delay }}
                    >
                        <motion.div 
                            className={styles.inner}
                            animate={{ y: [0, -15, 0] }}
                            transition={{ repeat: Infinity, duration: 3 + index, ease: "easeInOut" }}
                        >
                            <span className={styles.icon}>{symbol.icon}</span>
                            <span className={styles.text}>{symbol.text}</span>
                        </motion.div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default MathFloats;
