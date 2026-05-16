import React from 'react';
import PropTypes from 'prop-types';
import { HiLightningBolt } from 'react-icons/hi';
import { GiMedal } from 'react-icons/gi';
import { FaBook, FaMedal } from 'react-icons/fa';
import { BsCheckCircleFill } from 'react-icons/bs';
import { RiLiveLine } from 'react-icons/ri';
import styles from '../styles/StudentDashboard.module.css';

const StudentDashboard = ({ user, stats }) => {
    const xp = stats?.xp || 1250;
    const progress = stats?.progress || 40;

    return (
        <div className={styles.dashboardCard}>
            <div className={styles.header}>
                <div>
                    <h2>Hello, {user.name}!</h2>
                    <p>Ready for today's Algebra adventure?</p>
                </div>
                <div className={styles.xpBadge}>
                    <HiLightningBolt size={20} />
                    <span>{xp} XP Earned</span>
                </div>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                    <FaBook size={24} color="var(--accent)" />
                    <div>
                        <strong>{stats?.daysDone || 2}/5</strong>
                        <span>Days Done</span>
                    </div>
                </div>
                <div className={styles.statItem}>
                    <BsCheckCircleFill size={22} color="#4ade80" />
                    <div>
                        <strong>{stats?.solved || 45}</strong>
                        <span>Solved</span>
                    </div>
                </div>
                <div className={styles.statItem}>
                    <FaMedal size={24} color="var(--danger)" />
                    <div>
                        <strong>#{stats?.rank || 12}</strong>
                        <span>Rank</span>
                    </div>
                </div>
            </div>

            <div className={styles.todaySection}>
                <div className={styles.todayClass}>
                    <div className={styles.classIcon}>
                        <RiLiveLine size={32} />
                    </div>
                    <div className={styles.classInfo}>
                        <h4>Day 3: Linear Equations</h4>
                        <p>10:00 AM - 11:30 AM</p>
                    </div>
                    <button className={styles.joinBtn}>
                        <RiLiveLine size={20} />
                        <span>Join Live</span>
                    </button>
                </div>
            </div>

            <div className={styles.progressSection}>
                <div className={styles.progressLabel}>
                    <span>Course Progress</span>
                    <span>{progress}%</span>
                </div>
                <div className={styles.progressBar}>
                    <div 
                        className={styles.progressFill} 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

StudentDashboard.propTypes = {
    user: PropTypes.object.isRequired,
    stats: PropTypes.shape({
        xp: PropTypes.number,
        daysDone: PropTypes.number,
        solved: PropTypes.number,
        rank: PropTypes.number,
        progress: PropTypes.number
    })
};

export default StudentDashboard;
