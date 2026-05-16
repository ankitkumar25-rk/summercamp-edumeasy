import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiLiveLine, RiTimeLine } from 'react-icons/ri';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import { Link } from 'react-router-dom';
import { TbMathFunction } from 'react-icons/tb';
import { useAuth, useApi } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import styles from '../styles/LiveClass.module.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import Modal from '../components/Modal';

const LiveClass = () => {
    const { user, checkAuth } = useAuth();
    const api = useApi();
    const { showToast } = useToast();
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes for demo
    const [isDoubtModalOpen, setIsDoubtModalOpen] = useState(false);
    const [doubt, setDoubt] = useState('');
    const [isDone, setIsDone] = useState(false);
    const [confetti, setConfetti] = useState([]);

    const timerRef = useRef();

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, []);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleDone = async () => {
        try {
            await api.post('/api/user/mark-attended', { day: 3 });
            setIsDone(true);
            showToast({ type: 'success', message: '+50 XP Earned!' });
            triggerConfetti();
            await checkAuth(); // Update global XP
        } catch (err) {
            showToast({ type: 'error', message: 'Could not mark attendance.' });
        }
    };

    const triggerConfetti = () => {
        const newConfetti = Array.from({ length: 40 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            color: ['#3D1A8E', '#F5A623', '#E63329', '#22C55E'][Math.floor(Math.random() * 4)]
        }));
        setConfetti(newConfetti);
        setTimeout(() => setConfetti([]), 3000);
    };

    const handleSubmitDoubt = async () => {
        if (!doubt.trim()) return;
        try {
            await api.post('/api/doubts', { text: doubt });
            showToast({ type: 'success', message: 'Doubt sent! +10 XP' });
            setIsDoubtModalOpen(false);
            setDoubt('');
            await checkAuth();
        } catch (err) {
            showToast({ type: 'error', message: 'Failed to send doubt.' });
        }
    };

    return (
        <div className={styles.wrapper}>
            <Navbar />
            <div className={`container ${styles.main}`}>
                <Link to="/dashboard" className={styles.backLink}>
                    <AiOutlineArrowLeft /> Back to Dashboard
                </Link>

                <div className={styles.classCard}>
                    <div className={styles.header}>
                        <div className={styles.liveBadge}>
                            <RiLiveLine className={styles.pulse} /> LIVE NOW
                        </div>
                        <h1 className={styles.title}>Day 3: Linear Legends</h1>
                    </div>

                    {timeLeft > 0 ? (
                        <div className={styles.timerSection}>
                            <p>Class starts in:</p>
                            <div className={styles.countdown}>{formatTime(timeLeft)}</div>
                        </div>
                    ) : (
                        <div className={styles.activeSection}>
                            <div className={styles.readyMsg}>The class is in progress!</div>
                            <Button 
                                variant="primary" 
                                size="lg" 
                                className={styles.joinBtn}
                                onClick={() => window.open('https://meet.google.com/abc-defg-hij', '_blank')}
                            >
                                <RiLiveLine /> Join Google Meet
                            </Button>
                        </div>
                    )}

                    <div className={styles.actions}>
                        <Button variant="outline" size="md" onClick={() => setIsDoubtModalOpen(true)}>
                            Raise Hand / Ask Doubt
                        </Button>
                        {!isDone && (
                            <Button variant="success" size="md" onClick={handleDone}>
                                I'm Done for Today!
                            </Button>
                        )}
                    </div>

                    <div className={styles.topicBox}>
                        <h3><TbMathFunction /> Today's Focus</h3>
                        <p>Solving real-world puzzles using simple variables. Keep your notebook ready for the XP challenges!</p>
                    </div>
                </div>

                {/* Confetti Overlay */}
                <div className={styles.confettiContainer}>
                    {confetti.map((c) => (
                        <motion.div
                            key={c.id}
                            className={styles.confettiPiece}
                            initial={{ x: '50vw', y: '50vh', scale: 0 }}
                            animate={{ 
                                x: `${c.x}vw`, 
                                y: `${c.y}vh`, 
                                scale: 1,
                                rotate: 360
                            }}
                            style={{ backgroundColor: c.color }}
                        />
                    ))}
                </div>
            </div>

            <Modal 
                isOpen={isDoubtModalOpen} 
                onClose={() => setIsDoubtModalOpen(false)} 
                title="Ask a Doubt"
            >
                <div className={styles.doubtForm}>
                    <textarea 
                        className={styles.textarea}
                        placeholder="What's bothering you, Legend? Type your math question here..."
                        value={doubt}
                        onChange={(e) => setDoubt(e.target.value)}
                    />
                    <Button variant="primary" size="lg" onClick={handleSubmitDoubt} disabled={!doubt.trim()}>
                        Send Doubt
                    </Button>
                </div>
            </Modal>
            <Footer />
        </div>
    );
};

export default LiveClass;
