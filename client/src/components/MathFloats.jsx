// CHANGED: Replaced text-only math floats with premium pill-shaped ICON + TEXT chips. Added responsive slicing (only 3 on mobile) and custom color-matched border/shadow styling.

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TbSquareRoot, TbSum, TbMathIntegral } from 'react-icons/tb';
import { PiPi, PiPercent } from 'react-icons/pi';
import styles from '../styles/MathFloats.module.css';

const chipsData = [
  { icon: TbSquareRoot, label: "Square Root", color: "#3D1A8E", bg: "#EDE8FB" },
  { icon: PiPi, label: "Pi = 3.14", color: "#D4880A", bg: "#FEF3DC" },
  { icon: TbSum, label: "Summation", color: "#E63329", bg: "#FDEEEE" },
  { icon: PiPercent, label: "Percentages", color: "#22C55E", bg: "#EDFAF3" },
  { icon: TbMathIntegral, label: "Calculus Intro", color: "#3D1A8E", bg: "#EDE8FB" },
];

const MathFloats = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const visibleChips = isMobile ? chipsData.slice(0, 3) : chipsData;

  return (
    <section className={styles.section} aria-label="Interactive Math Fields">
      <div className={`container ${styles.container}`}>
        {visibleChips.map((chip, index) => {
          const Icon = chip.icon;
          return (
            <motion.div
              key={index}
              className={styles.chip}
              style={{ 
                backgroundColor: chip.bg,
                borderColor: chip.color,
                color: chip.color,
                boxShadow: `0 5px 0 ${chip.color}`
              }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div 
                className={styles.inner}
                animate={{ y: [0, -10, 0] }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2.5 + index * 0.5, 
                  ease: "easeInOut" 
                }}
              >
                <span className={styles.icon}>
                  <Icon size={isMobile ? 18 : 24} />
                </span>
                <span className={styles.text} style={{ color: chip.color }}>
                  {chip.label}
                </span>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default MathFloats;
