import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BsCheckCircleFill, BsLightningChargeFill } from 'react-icons/bs';
import { IoClose } from 'react-icons/io5';
import { useToast } from '../hooks/useToast';
import styles from '../styles/Toast.module.css';

const Toast = () => {
    const { toasts } = useToast();

    return (
        <div className={styles.toastContainer}>
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        layout
                        initial={{ opacity: 0, x: 100, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8, x: 20 }}
                        className={`${styles.toast} ${styles[toast.type]}`}
                    >
                        <div className={styles.icon}>
                            {toast.type === 'success' && <BsCheckCircleFill size={20} />}
                            {toast.type === 'error' && <IoClose size={20} />}
                            {toast.type === 'warning' && <BsLightningChargeFill size={20} />}
                        </div>
                        <div className={styles.message}>{toast.message}</div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default Toast;
