import React from 'react';
import { motion } from 'framer-motion';
import { RiLiveLine } from 'react-icons/ri';
import { AiOutlineArrowRight } from 'react-icons/ai';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/LiveClassBanner.module.css';
import Button from './Button';

const LiveClassBanner = ({ isLive = true, onJoin }) => {
    const { isPaid } = useAuth();

    if (!isLive) return null;

    return (
        <motion.div 
            className={styles.bannerWrapper}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20 }}
        >
            <div className="container">
                <div className={styles.banner}>
                    <div className={styles.content}>
                        <div className={styles.liveIndicator}>
                            <RiLiveLine className={styles.liveIcon} />
                            <span>CLASS IS LIVE NOW!</span>
                        </div>
                        <h3 className={styles.title}>Day 3: Linear Legends is happening!</h3>
                    </div>
                    <Button 
                        variant="accent" 
                        size="lg" 
                        onClick={onJoin}
                        className={styles.joinBtn}
                    >
                        <span>{isPaid ? 'Join Now' : 'Grab Your Seat'}</span>
                        <AiOutlineArrowRight />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
};

export default LiveClassBanner;
