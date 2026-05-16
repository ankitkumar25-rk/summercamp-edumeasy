import React from 'react';
import { motion } from 'framer-motion';
import { TbMathFunction } from 'react-icons/tb';
import styles from '../styles/Loader.module.css';

const Loader = () => {
    return (
        <motion.div 
            className={styles.loaderOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className={styles.content}>
                <motion.div 
                    className={styles.iconWrapper}
                    animate={{ 
                        rotate: 360,
                        scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                        rotate: { repeat: Infinity, duration: 2, ease: "linear" },
                        scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
                    }}
                >
                    <TbMathFunction size={64} color="var(--accent)" />
                </motion.div>
                <h2 className={styles.text}>Loading Adventure...</h2>
            </div>
        </motion.div>
    );
};

export default Loader;
