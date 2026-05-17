import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaTrophy, FaMedal, FaLock, FaExclamationTriangle, FaStar } from 'react-icons/fa';
import { HiLightningBolt } from 'react-icons/hi';
import { BsCheckCircleFill, BsLightningChargeFill } from 'react-icons/bs';
import { RiLiveLine } from 'react-icons/ri';
import { GiTrophy } from 'react-icons/gi';
import { useAuth, useApi } from '../context/AuthContext';
import styles from '../styles/Dashboard.module.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import Loader from '../components/Loader';

const Dashboard = () => {
    const { user } = useAuth();
    const api = useApi();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    const levels = [
        { name: 'Rookie', minXp: 0 },
        { name: 'Explorer', minXp: 100 },
        { name: 'Champion', minXp: 250 },
        { name: 'Legend', minXp: 500 },
        { name: 'Math Wizard', minXp: 1000 }
    ];

    const currentLevel = levels.filter(l => (user?.xp || 0) >= l.minXp).pop() || levels[0];
    const nextLevel = levels.find(l => l.minXp > (user?.xp || 0));
    const progress = nextLevel 
        ? (((user?.xp || 0) - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp)) * 100 
        : 100;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await api.get('/api/leaderboard');
                setLeaderboard(data);
            } catch (err) {
                console.error('Error fetching leaderboard:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [api]);

    const schedule = [
        { day: 1, title: 'Variable Valley', status: 'past' },
        { day: 2, title: 'The Great Balance', status: 'past' },
        { day: 3, title: 'Linear Legends', status: 'today' },
        { day: 4, title: 'Polynomial Park', status: 'future' },
        { day: 5, title: 'Algebra Master', status: 'future' }
    ];

    if (loading) return <Loader />;

    return (
        <div className={styles.wrapper}>
            <Navbar />
            {!user?.isEmailVerified && (
                <div style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '12px', textAlign: 'center', fontWeight: 'bold', borderBottom: '3px solid var(--danger-dark)', zIndex: 10, position: 'relative' }}>
                    <FaExclamationTriangle style={{ marginRight: '8px', marginBottom: '-2px' }} />
                    Your email is not verified! Please verify your email to secure your account.
                    <button 
                        onClick={() => navigate('/verify-email', { state: { email: user?.email } })}
                        style={{ marginLeft: '15px', padding: '6px 16px', borderRadius: '20px', border: '2px solid white', background: 'transparent', color: 'white', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s' }}
                        onMouseOver={(e) => { e.target.style.background = 'white'; e.target.style.color = 'var(--danger)'; }}
                        onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'white'; }}
                    >
                        Verify Now
                    </button>
                </div>
            )}
            <div className={`container ${styles.main}`}>
                <div className={styles.header}>
                    <h1 className={styles.welcome}>Welcome back, {user?.fullName?.split(' ')[0] || 'Student'}!</h1>
                    <div className={styles.levelCard}>
                        <div className={styles.levelInfo}>
                            <span className={styles.levelName}>
                                {currentLevel.name}
                                <FaStar style={{ color: 'var(--accent)', animation: 'spin 3s linear infinite', marginLeft: 6 }} />
                            </span>
                            <span className={styles.xpText}>{user?.xp || 0} XP</span>
                        </div>
                        <div className={styles.progressBar}>
                            <motion.div 
                                className={styles.progressFill}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                        </div>
                        {nextLevel && (
                            <p className={styles.nextLevel}>Next Level: {nextLevel.name} at {nextLevel.minXp} XP</p>
                        )}
                    </div>
                </div>

                <div className={styles.tabs}>
                    <button 
                        className={`${styles.tab} ${activeTab === 'overview' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button 
                        className={`${styles.tab} ${activeTab === 'leaderboard' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('leaderboard')}
                    >
                        Leaderboard
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'overview' ? (
                        <motion.div 
                            key="overview"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={styles.content}
                        >
                            <div className={styles.liveNowCard}>
                                <div className={styles.liveLeft}>
                                    <RiLiveLine size={40} className={styles.pulseIcon} />
                                    <div>
                                        <h3>Today's Class is LIVE!</h3>
                                        <p>Day 3: Linear Legends · Starts at 10:00 AM</p>
                                    </div>
                                </div>
                                <Button variant="accent" size="lg" onClick={() => window.location.href = '/live-class'}>
                                    Join Class
                                </Button>
                            </div>

                            <div className={styles.scheduleGrid}>
                                {schedule.map((day) => (
                                    <div key={day.day} className={`${styles.dayCard} ${styles[day.status]}`}>
                                        <div className={styles.dayNum}>Day {day.day}</div>
                                        <h4 className={styles.dayTitle}>{day.title}</h4>
                                        <div className={styles.dayFooter}>
                                            {day.status === 'past' && <span className={styles.completed}><BsCheckCircleFill /> Completed</span>}
                                            {day.status === 'today' && <Button variant="primary" size="sm" onClick={() => window.location.href = '/live-class'}>Join Now</Button>}
                                            {day.status === 'future' && <span className={styles.locked}><FaLock /> Upcoming</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="leaderboard"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={styles.leaderboard}
                        >
                            <div className={styles.lbHeader}>
                                <GiTrophy className={styles.lbIcon} />
                                <h2>Top Legends</h2>
                            </div>
                            <div className={styles.lbTable}>
                                {leaderboard.map((student, index) => (
                                    <motion.div 
                                        key={student._id} 
                                        className={`${styles.lbRow} ${student._id === user?._id ? styles.lbRowMe : ''}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <div className={styles.lbRank}>
                                            {index === 0 && <FaTrophy color="#FFD700" />}
                                            {index === 1 && <FaMedal color="#C0C0C0" />}
                                            {index === 2 && <FaMedal color="#CD7F32" />}
                                            {index > 2 && index + 1}
                                        </div>
                                        <div className={styles.lbName}>{student.name}</div>
                                        <div className={styles.lbXp}>{student.xp} XP</div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <Footer />
        </div>
    );
};

export default Dashboard;
