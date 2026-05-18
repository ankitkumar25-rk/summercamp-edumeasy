import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    FaTrophy, FaMedal, FaLock, FaExclamationTriangle, FaStar, 
    FaClock, FaClipboardList, FaGraduationCap, FaQrcode, 
    FaCalendarCheck, FaChartBar, FaAward, FaFire, FaCheckCircle, 
    FaTimesCircle, FaChevronRight, FaArrowLeft, FaCheck
} from 'react-icons/fa';
import { HiLightningBolt } from 'react-icons/hi';
import { BsCheckCircleFill, BsLightningChargeFill } from 'react-icons/bs';
import { RiLiveLine } from 'react-icons/ri';
import { GiTrophy, GiDiploma } from 'react-icons/gi';
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
    const [loading, setLoading] = useState(true);

    // Leaderboard State
    const [leaderboard, setLeaderboard] = useState([]);
    const [lbFilterClass, setLbFilterClass] = useState('');
    const [lbFilterBatch, setLbFilterBatch] = useState('');
    const [myRanks, setMyRanks] = useState(null);

    // Attendance State
    const [attendanceData, setAttendanceData] = useState(null);

    // Mock Test State
    const [testsList, setTestsList] = useState([]);
    const [activeQuiz, setActiveQuiz] = useState(null); // The test configuration
    const [activeAttempt, setActiveAttempt] = useState(null); // Attempt details
    const [selectedAnswers, setSelectedAnswers] = useState({}); // questionId -> array of selected options
    const [questionTimes, setQuestionTimes] = useState({}); // questionId -> seconds
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0); // in seconds
    const [gradedResult, setGradedResult] = useState(null);
    const [solvingState, setSolvingState] = useState(false); // true when taking quiz
    const [reviewState, setReviewState] = useState(false); // true when reviewing a graded result

    // Certificate State
    const [certificateEligibility, setCertificateEligibility] = useState(null);

    // Gamification level lists
    const levels = [
        { name: 'Rookie', minXp: 0 },
        { name: 'Algebra Challenger', minXp: 300 },
        { name: 'Elite Solver', minXp: 600 },
        { name: 'Math Wizard', minXp: 1000 }
    ];

    const currentLevel = levels.filter(l => (user?.xp || 0) >= l.minXp).pop() || levels[0];
    const nextLevel = levels.find(l => l.minXp > (user?.xp || 0));
    const progress = nextLevel 
        ? (((user?.xp || 0) - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp)) * 100 
        : 100;

    // Fetch dashboard core data
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            // 1. Get Leaderboard data
            let lbUrl = '/api/leaderboard';
            const lbParams = [];
            if (lbFilterClass) lbParams.push(`studentClass=${lbFilterClass}`);
            if (lbFilterBatch) lbParams.push(`batchId=${lbFilterBatch}`);
            if (lbParams.length > 0) lbUrl += `?${lbParams.join('&')}`;

            const { data: lbData } = await api.get(lbUrl);
            setLeaderboard(lbData);

            // 2. Get Personal Leaderboard ranks
            const { data: rankData } = await api.get('/api/leaderboard/my-rank');
            setMyRanks(rankData);

            // 3. Get Attendance stats
            const { data: attData } = await api.get('/api/attendance/my-status');
            setAttendanceData(attData);

            // 4. Get active tests targeting student
            const { data: activeTests } = await api.get('/api/tests/active');
            setTestsList(activeTests);

            // 5. Get certificate eligibility status
            const { data: certData } = await api.get('/api/certificates/eligibility');
            setCertificateEligibility(certData);

        } catch (err) {
            console.error('Error fetching dashboard records:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [lbFilterClass, lbFilterBatch]);

    // Timer trigger when active quiz is running
    useEffect(() => {
        if (!solvingState || timeLeft <= 0) {
            if (solvingState && timeLeft <= 0) {
                // Auto-submit on expiration
                handleQuizSubmit(true);
            }
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft(prev => prev - 1);
            // Track time spent per current question
            const currentQ = activeQuiz.questions[currentQuestionIndex];
            if (currentQ) {
                setQuestionTimes(prev => ({
                    ...prev,
                    [currentQ._id]: (prev[currentQ._id] || 0) + 1
                }));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [solvingState, timeLeft]);

    // Action: Start Mock Quiz
    const handleStartQuiz = async (testId) => {
        try {
            setLoading(true);
            const { data } = await api.post(`/api/tests/${testId}/start`);
            setActiveQuiz(data.test);
            setActiveAttempt(data.attempt);
            setTimeLeft(data.test.duration * 60);
            setCurrentQuestionIndex(0);
            setSelectedAnswers({});
            setQuestionTimes({});
            setSolvingState(true);
            setReviewState(false);
            setGradedResult(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to start quiz attempt.');
        } finally {
            setLoading(false);
        }
    };

    // Answer selecting toggles
    const handleAnswerSelect = (questionId, option, isMulti) => {
        setSelectedAnswers(prev => {
            const current = prev[questionId] || [];
            if (isMulti) {
                if (current.includes(option)) {
                    return { ...prev, [questionId]: current.filter(x => x !== option) };
                } else {
                    return { ...prev, [questionId]: [...current, option] };
                }
            } else {
                return { ...prev, [questionId]: [option] };
            }
        });
    };

    // Action: Submit Mock Quiz
    const handleQuizSubmit = async (isAuto = false) => {
        try {
            setLoading(true);
            
            // Format responses
            const formattedResponses = activeQuiz.questions.map(q => ({
                questionId: q._id,
                selectedAnswers: selectedAnswers[q._id] || [],
                timeSpentSeconds: questionTimes[q._id] || 0
            }));

            const { data } = await api.post(`/api/tests/${activeQuiz._id}/submit`, {
                responses: formattedResponses
            });

            setGradedResult(data.attempt);
            setActiveQuiz(data.gradedWithAnswers);
            setSolvingState(false);
            setReviewState(true);
            
            // Refresh underlying dashboard stats
            await fetchDashboardData();
        } catch (err) {
            alert('Failed to submit test responses.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch review attempt of a past completed test
    const handleReviewPastTest = async (testId) => {
        try {
            setLoading(true);
            const { data } = await api.get(`/api/tests/${testId}/attempt`);
            setGradedResult(data.attempt);
            setActiveQuiz(data.test);
            setReviewState(true);
            setSolvingState(false);
        } catch (err) {
            alert('Could not retrieve attempt review details.');
        } finally {
            setLoading(false);
        }
    };

    const formatTimer = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading && !solvingState) return <Loader />;

    // ----------------------------------------------------
    // ACTIVE QUIZ INTERACTIVE VIEW LAYOUT
    // ----------------------------------------------------
    if (solvingState && activeQuiz) {
        const currentQuestion = activeQuiz.questions[currentQuestionIndex];
        const totalQuestions = activeQuiz.questions.length;
        const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;

        return (
            <div className={styles.quizWrapper}>
                <div className={styles.quizHeader}>
                    <div>
                        <h2 className={styles.quizTitle}>{activeQuiz.title}</h2>
                        <span className={styles.quizBadge}>Class {activeQuiz.studentClass} · Topic: {currentQuestion?.topic}</span>
                    </div>
                    <div className={styles.quizTimerBox}>
                        <FaClock size={20} style={{ color: timeLeft < 60 ? 'var(--danger)' : 'var(--primary)' }} />
                        <span className={`${styles.quizTimer} ${timeLeft < 60 ? styles.timerAlert : ''}`}>
                            {formatTimer(timeLeft)}
                        </span>
                    </div>
                </div>

                <div className={styles.quizProgressBarContainer}>
                    <div className={styles.quizProgressText}>Question {currentQuestionIndex + 1} of {totalQuestions}</div>
                    <div className={styles.quizProgressBar}>
                        <div className={styles.quizProgressBarFill} style={{ width: `${progressPercentage}%` }} />
                    </div>
                </div>

                <div className={styles.quizCard}>
                    <div className={styles.questionTopic}>Difficulty: <span className={styles[`diff_${currentQuestion?.difficulty}`]}>{currentQuestion?.difficulty?.toUpperCase()}</span></div>
                    <h3 className={styles.questionText}>{currentQuestion?.text}</h3>

                    <div className={styles.optionsGrid}>
                        {currentQuestion?.type === 'boolean' && (
                            ['True', 'False'].map(opt => {
                                const isSel = (selectedAnswers[currentQuestion._id] || []).includes(opt);
                                return (
                                    <button 
                                        key={opt}
                                        onClick={() => handleAnswerSelect(currentQuestion._id, opt, false)}
                                        className={`${styles.optionBtn} ${isSel ? styles.optionSelected : ''}`}
                                    >
                                        {opt}
                                    </button>
                                );
                            })
                        )}

                        {currentQuestion?.type === 'integer' && (
                            <div className={styles.numericInputBox}>
                                <input 
                                    type="number"
                                    placeholder="Enter your integer answer..."
                                    value={selectedAnswers[currentQuestion._id]?.[0] || ''}
                                    onChange={(e) => setSelectedAnswers(prev => ({
                                        ...prev,
                                        [currentQuestion._id]: [e.target.value]
                                    }))}
                                    className={styles.integerInput}
                                />
                            </div>
                        )}

                        {(currentQuestion?.type === 'mcq_single' || currentQuestion?.type === 'mcq_multi') && (
                            currentQuestion.options.map((opt) => {
                                const isSel = (selectedAnswers[currentQuestion._id] || []).includes(opt);
                                const isMulti = currentQuestion.type === 'mcq_multi';
                                return (
                                    <button 
                                        key={opt}
                                        onClick={() => handleAnswerSelect(currentQuestion._id, opt, isMulti)}
                                        className={`${styles.optionBtn} ${isSel ? styles.optionSelected : ''}`}
                                    >
                                        <span className={styles.optionBox}>{isMulti ? '▢' : '◯'}</span>
                                        <span>{opt}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className={styles.quizNav}>
                    <Button 
                        variant="secondary" 
                        disabled={currentQuestionIndex === 0}
                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    >
                        Previous Question
                    </Button>
                    
                    {currentQuestionIndex < totalQuestions - 1 ? (
                        <Button 
                            variant="primary" 
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        >
                            Next Question
                        </Button>
                    ) : (
                        <Button 
                            variant="accent" 
                            onClick={() => {
                                if (window.confirm('Are you sure you want to submit your quiz?')) {
                                    handleQuizSubmit();
                                }
                            }}
                        >
                            Submit Answers
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    // ----------------------------------------------------
    // COMPLETED TEST DETAILED REVIEW LAYOUT
    // ----------------------------------------------------
    if (reviewState && gradedResult && activeQuiz) {
        return (
            <div className={styles.reviewWrapper}>
                <Navbar />
                <div className={`container ${styles.main}`}>
                    <button onClick={() => setReviewState(false)} className={styles.backBtn}>
                        <FaArrowLeft /> Back to Dashboard
                    </button>

                    <div className={styles.resultSummaryCard}>
                        <div className={styles.resultTitleBox}>
                            <FaAward size={48} className={styles.goldAwardIcon} />
                            <div>
                                <h2>Quiz Graded & Evaluated!</h2>
                                <p>{activeQuiz.title} · Complete Review</p>
                            </div>
                        </div>

                        <div className={styles.resultsGrid}>
                            <div className={styles.statPill}>
                                <span className={styles.statLabel}>Score Secured</span>
                                <span className={styles.statVal}>{gradedResult.score} XP</span>
                            </div>
                            <div className={styles.statPill}>
                                <span className={styles.statLabel}>Accuracy</span>
                                <span className={styles.statVal}>{gradedResult.analytics?.accuracyPercent}%</span>
                            </div>
                            <div className={styles.statPill}>
                                <span className={styles.statLabel}>Correct Answers</span>
                                <span className={styles.statVal} style={{ color: 'var(--success)' }}>
                                    {gradedResult.analytics?.totalCorrect} / {activeQuiz.questions.length}
                                </span>
                            </div>
                            <div className={styles.statPill}>
                                <span className={styles.statLabel}>Time Spent</span>
                                <span className={styles.statVal}>{gradedResult.analytics?.timeSpentMinutes} min</span>
                            </div>
                        </div>

                        {/* Topic Breakdown */}
                        {gradedResult.analytics?.topicWiseAnalysis && (
                            <div className={styles.topicsBreakdown}>
                                <h3>Topic Performance Strength Analysis</h3>
                                <div className={styles.topicsGrid}>
                                    {Object.entries(gradedResult.analytics.topicWiseAnalysis).map(([topic, stats]) => {
                                        const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                                        return (
                                            <div key={topic} className={styles.topicRow}>
                                                <div className={styles.topicInfo}>
                                                    <span className={styles.topicName}>{topic}</span>
                                                    <span className={styles.topicPercent}>{stats.correct}/{stats.total} ({pct}%)</span>
                                                </div>
                                                <div className={styles.topicProgressBar}>
                                                    <div className={styles.topicProgressBarFill} style={{ width: `${pct}%`, backgroundColor: pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--accent)' : 'var(--danger)' }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Question Answers Details */}
                    <div className={styles.questionsReviewList}>
                        <h2 className={styles.reviewListTitle}>Answer Review Details</h2>
                        {activeQuiz.questions.map((q, idx) => {
                            const response = (gradedResult.responses || []).find(r => r.questionId.toString() === q._id.toString());
                            const selected = response ? response.selectedAnswers || [] : [];
                            const isCorrect = response ? response.isCorrect : false;

                            return (
                                <div key={q._id} className={`${styles.reviewQuestionCard} ${isCorrect ? styles.correctCard : styles.wrongCard}`}>
                                    <div className={styles.reviewCardHeader}>
                                        <span className={styles.qNum}>Question {idx + 1}</span>
                                        <span className={isCorrect ? styles.badgeCorrect : styles.badgeWrong}>
                                            {isCorrect ? <FaCheck /> : '🗙'} {isCorrect ? 'Correct' : 'Incorrect'}
                                        </span>
                                    </div>
                                    <p className={styles.reviewQText}>{q.text}</p>
                                    
                                    <div className={styles.optionsBlock}>
                                        <p><strong>Your Selected Answer:</strong> {selected.length > 0 ? selected.join('; ') : <span className={styles.unanswered}>No response provided</span>}</p>
                                        <p style={{ color: 'var(--success)' }}><strong>Correct Answer:</strong> {q.correctAnswers?.join('; ')}</p>
                                    </div>

                                    <div className={styles.qFooterStats}>
                                        <span>Points Gained: {isCorrect ? q.points : `-${q.negativePoints}`}</span>
                                        <span>Topic: {q.topic}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // ----------------------------------------------------
    // BASE PORTAL DASHBOARD (Overview/Quizzes/Leaderboard/Certificates)
    // ----------------------------------------------------
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
                    >
                        Verify Now
                    </button>
                </div>
            )}

            <div className={`container ${styles.main}`}>
                <div className={styles.header}>
                    <h1 className={styles.welcome}>Welcome back, {user?.fullName?.split(' ')[0] || 'Student'}!</h1>
                    
                    {/* User level progression badge card */}
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

                {/* Extended Tab Navs */}
                <div className={styles.tabs}>
                    <button 
                        className={`${styles.tab} ${activeTab === 'overview' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <FaCalendarCheck style={{ marginRight: 6 }} /> Overview & Attendance
                    </button>
                    <button 
                        className={`${styles.tab} ${activeTab === 'quizzes' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('quizzes')}
                    >
                        <FaClipboardList style={{ marginRight: 6 }} /> Algebra Quizzes
                    </button>
                    <button 
                        className={`${styles.tab} ${activeTab === 'leaderboard' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('leaderboard')}
                    >
                        <FaTrophy style={{ marginRight: 6 }} /> Leaderboard
                    </button>
                    <button 
                        className={`${styles.tab} ${activeTab === 'certificate' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('certificate')}
                    >
                        <FaGraduationCap style={{ marginRight: 6 }} /> Certificate
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {/* ----------------------------------------------------
                        TAB 1: OVERVIEW & ATTENDANCE 
                    ---------------------------------------------------- */}
                    {activeTab === 'overview' && (
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
                                        <h3>Today's Camp Session is LIVE!</h3>
                                        <p>Conquer the next Algebra topic & earn +100 XP Attendance rewards.</p>
                                    </div>
                                </div>
                                <Button variant="accent" size="lg" onClick={() => navigate('/live-class')}>
                                    Enter Classroom
                                </Button>
                            </div>

                            {/* Streaks stats & Attendance metrics card */}
                            {attendanceData && (
                                <div className={styles.attendanceSummaryCard}>
                                    <div className={styles.attHeader}>
                                        <div className={styles.streakBadge}>
                                            <FaFire size={28} className={styles.fireIcon} />
                                            <div>
                                                <span className={styles.streakNum}>{attendanceData.streak} Days</span>
                                                <span className={styles.streakLbl}>Consecutive Streak</span>
                                            </div>
                                        </div>

                                        <div className={styles.pctBadge}>
                                            <span className={styles.pctNum}>{attendanceData.attendancePercentage}%</span>
                                            <span className={styles.pctLbl}>Overall Attendance</span>
                                        </div>
                                    </div>

                                    <h3 className={styles.subTitleText}>Class Attendance Breakdown</h3>
                                    <div className={styles.scheduleGrid}>
                                        {attendanceData.classStatuses.map((c) => (
                                            <div key={c._id} className={`${styles.dayCard} ${c.attended ? styles.attChecked : styles.attMissed}`}>
                                                <div className={styles.dayNum}>Day {c.day}</div>
                                                <h4 className={styles.dayTitle}>{c.title}</h4>
                                                <div className={styles.dayFooter}>
                                                    {c.attended ? (
                                                        <span className={styles.completed}>
                                                            <BsCheckCircleFill /> Checked In (+100 XP)
                                                        </span>
                                                    ) : (
                                                        <span className={styles.locked}>
                                                            <FaTimesCircle /> Absent / Not Tagged
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ----------------------------------------------------
                        TAB 2: MOCK TESTS & QUIZZES 
                    ---------------------------------------------------- */}
                    {activeTab === 'quizzes' && (
                        <motion.div 
                            key="quizzes"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={styles.quizzesSection}
                        >
                            <div className={styles.sectionHeader}>
                                <FaClipboardList className={styles.secIcon} />
                                <div>
                                    <h2>Algebra Mock Tests & Quizzes</h2>
                                    <p>Solve daily quizzes in the given active test windows to reinforce concepts and earn tons of XP.</p>
                                </div>
                            </div>

                            {testsList.length === 0 ? (
                                <div className={styles.emptyStateBox}>
                                    <FaLock size={48} className={styles.lockIcon} />
                                    <h3>No Active Quizzes Scheduled</h3>
                                    <p>There are no active mock tests open for your class ({user?.studentClass}) right now. Check back during live sessions!</p>
                                </div>
                            ) : (
                                <div className={styles.quizzesGrid}>
                                    {testsList.map(({ test, hasAttempted, isSubmitted, attemptId }) => (
                                        <div key={test._id} className={styles.quizOptionCard}>
                                            <div className={styles.quizOptHeader}>
                                                <div className={styles.quizOptMeta}>
                                                    <span className={styles.quizOptDuration}><FaClock /> {test.duration} Minutes</span>
                                                    <span className={styles.quizOptQuestions}>{test.questions?.length || 0} Questions</span>
                                                </div>
                                                <span className={styles.quizClassPill}>Class {test.studentClass}</span>
                                            </div>
                                            
                                            <h3 className={styles.quizOptTitle}>{test.title}</h3>
                                            <p className={styles.quizOptDesc}>{test.description || 'Test your basic algebraic equations and fractional expansions.'}</p>
                                            
                                            <div className={styles.quizOptFooter}>
                                                {isSubmitted ? (
                                                    <div className={styles.submittedPillBox}>
                                                        <span className={styles.completedBadge}><FaCheckCircle /> Completed</span>
                                                        <Button variant="secondary" size="sm" onClick={() => handleReviewPastTest(test._id)}>
                                                            Review Answers
                                                        </Button>
                                                    </div>
                                                ) : hasAttempted ? (
                                                    <div className={styles.submittedPillBox}>
                                                        <span className={styles.warningBadge}>Started</span>
                                                        <Button variant="accent" size="sm" onClick={() => handleStartQuiz(test._id)}>
                                                            Resume Test
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button variant="primary" size="lg" className={styles.w100} onClick={() => handleStartQuiz(test._id)}>
                                                        Start Test
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ----------------------------------------------------
                        TAB 3: DYNAMIC FILTERABLE LEADERBOARD 
                    ---------------------------------------------------- */}
                    {activeTab === 'leaderboard' && (
                        <motion.div 
                            key="leaderboard"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={styles.leaderboard}
                        >
                            <div className={styles.lbLayoutGrid}>
                                {/* Table Section */}
                                <div className={styles.lbTableSection}>
                                    <div className={styles.lbHeader}>
                                        <GiTrophy className={styles.lbIcon} />
                                        <div>
                                            <h2>Top Legends</h2>
                                            <p>Real-time rankings based on cumulative class participation and quiz performance.</p>
                                        </div>
                                    </div>

                                    {/* Interactive Dropdown filters */}
                                    <div className={styles.filtersRow}>
                                        <div className={styles.filterGroup}>
                                            <label>Target Class:</label>
                                            <select value={lbFilterClass} onChange={(e) => setLbFilterClass(e.target.value)}>
                                                <option value="">All Classes</option>
                                                <option value="6">Class 6</option>
                                                <option value="7">Class 7</option>
                                                <option value="8">Class 8</option>
                                                <option value="9">Class 9</option>
                                                <option value="10">Class 10</option>
                                            </select>
                                        </div>
                                        
                                        <div className={styles.filterGroup}>
                                            <label>Batch Track:</label>
                                            <select value={lbFilterBatch} onChange={(e) => setLbFilterBatch(e.target.value)}>
                                                <option value="">All Batches</option>
                                                <option value="Basics">Basics Track</option>
                                                <option value="Foundational">Foundational Track</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className={styles.lbTable}>
                                        {leaderboard.length === 0 ? (
                                            <p className={styles.emptyLeaderboard}>No students match these criteria.</p>
                                        ) : (
                                            leaderboard.map((student, index) => (
                                                <motion.div 
                                                    key={student._id} 
                                                    className={`${styles.lbRow} ${student._id === user?._id ? styles.lbRowMe : ''}`}
                                                    initial={{ opacity: 0, y: 15 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: Math.min(index * 0.03, 0.5) }}
                                                >
                                                    <div className={styles.lbRank}>
                                                        {index === 0 && <FaTrophy color="#FFD700" />}
                                                        {index === 1 && <FaMedal color="#C0C0C0" />}
                                                        {index === 2 && <FaMedal color="#CD7F32" />}
                                                        {index > 2 && index + 1}
                                                    </div>
                                                    <div className={styles.lbName}>
                                                        {student.name}
                                                        <span className={styles.lbPills}>Class {student.studentClass} · {student.batchId || 'Basics'}</span>
                                                    </div>
                                                    <div className={styles.lbXp}>{student.xp} XP</div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Personal comparison card */}
                                {myRanks && (
                                    <div className={styles.personalRankSection}>
                                        <h3 className={styles.secTitle}>Your Rank Analytics</h3>
                                        
                                        <div className={styles.rankMetricCard}>
                                            <span className={styles.metricScope}>Overall Performance</span>
                                            <span className={styles.metricVal}>Rank {myRanks.overall?.rank} <span className={styles.metricTot}>/ {myRanks.overall?.total}</span></span>
                                            <span className={styles.metricPct}>Top {100 - myRanks.overall?.percentile}% percentile of camp</span>
                                        </div>

                                        <div className={styles.rankMetricCard}>
                                            <span className={styles.metricScope}>Class {user?.studentClass} Specific</span>
                                            <span className={styles.metricVal}>Rank {myRanks.classSpecific?.rank} <span className={styles.metricTot}>/ {myRanks.classSpecific?.total}</span></span>
                                            <span className={styles.metricPct}>Beating {myRanks.classSpecific?.percentile}% of same-class peers</span>
                                        </div>

                                        <div className={styles.rankMetricCard}>
                                            <span className={styles.metricScope}>{user?.batchId || 'Basics'} Batch</span>
                                            <span className={styles.metricVal}>Rank {myRanks.batchSpecific?.rank} <span className={styles.metricTot}>/ {myRanks.batchSpecific?.total}</span></span>
                                            <span className={styles.metricPct}>Beating {myRanks.batchSpecific?.percentile}% of batch peers</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ----------------------------------------------------
                        TAB 4: DIPLOMA & GRADUATION CERTIFICATE 
                    ---------------------------------------------------- */}
                    {activeTab === 'certificate' && certificateEligibility && (
                        <motion.div 
                            key="certificate"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={styles.certificateSection}
                        >
                            <div className={styles.sectionHeader}>
                                <FaGraduationCap className={styles.secIcon} />
                                <div>
                                    <h2>Camp Graduation Certificate</h2>
                                    <p>Claim your official Algebra Graduation Certificate once you complete course completion milestones.</p>
                                </div>
                            </div>

                            <div className={styles.certLayoutGrid}>
                                {/* Criteria list */}
                                <div className={styles.criteriaCard}>
                                    <h3>Camp Graduation Checklist</h3>
                                    
                                    <div className={styles.checklistRow}>
                                        <div className={styles.checkIconBox}>
                                            {certificateEligibility.attendanceCount >= 3 ? (
                                                <FaCheckCircle color="var(--success)" size={24} />
                                            ) : (
                                                <FaTimesCircle color="var(--danger)" size={24} />
                                            )}
                                        </div>
                                        <div className={styles.checkInfo}>
                                            <h4>Attend Daily Lectures (Min 3 / 5 days)</h4>
                                            <p>Your Attendance: {certificateEligibility.attendanceCount} sessions attended.</p>
                                        </div>
                                    </div>

                                    <div className={styles.checklistRow}>
                                        <div className={styles.checkIconBox}>
                                            {certificateEligibility.attemptsCount >= certificateEligibility.testsCount ? (
                                                <FaCheckCircle color="var(--success)" size={24} />
                                            ) : (
                                                <FaTimesCircle color="var(--danger)" size={24} />
                                            )}
                                        </div>
                                        <div className={styles.checkInfo}>
                                            <h4>Attempt Mock Quizzes (All Scheduled Tests)</h4>
                                            <p>Your Quizzes: {certificateEligibility.attemptsCount} / {certificateEligibility.testsCount} completed.</p>
                                        </div>
                                    </div>

                                    <div className={styles.eligibilityBanner} style={{ backgroundColor: certificateEligibility.eligible ? '#E6F4EA' : '#FCE8E6', borderColor: certificateEligibility.eligible ? 'var(--success)' : 'var(--danger)' }}>
                                        {certificateEligibility.eligible ? (
                                            <p style={{ color: 'green', fontWeight: 'bold' }}>🎉 Congratulations! You are eligible for graduation!</p>
                                        ) : (
                                            <p style={{ color: 'red', fontWeight: 'bold' }}>🔒 Locked: Please resolve the unchecked checklist items above to download your graduation diploma.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Preview Card */}
                                <div className={`${styles.certPreviewCard} ${certificateEligibility.eligible ? styles.unlockedCert : styles.lockedCert}`}>
                                    <GiDiploma size={80} className={styles.certBadgeIcon} />
                                    <h3>Algebra Summer Graduate</h3>
                                    <p>EduMEasy 5-Day Algebra Summer Camp Diploma</p>
                                    
                                    {certificateEligibility.eligible ? (
                                        <a 
                                            href={`${import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : window.location.origin)}/api/certificates/download`}
                                            style={{ textDecoration: 'none' }}
                                        >
                                            <Button variant="accent" size="lg" className={styles.bouncingBtn}>
                                                Download PDF Diploma
                                            </Button>
                                        </a>
                                    ) : (
                                        <Button variant="secondary" size="lg" disabled>
                                            Certificate Locked
                                        </Button>
                                    )}
                                </div>
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
