import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaUserCircle, FaEdit, FaTrash, FaCheck, FaFileUpload, FaCloudDownloadAlt,
    FaClipboardList, FaGraduationCap, FaPlus, FaCheckCircle, FaTimesCircle,
    FaSyncAlt, FaCalculator, FaUserGraduate
} from 'react-icons/fa';
import { MdClass, MdLeaderboard } from 'react-icons/md';
import { useAuth, useApi } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import styles from '../styles/AdminPanel.module.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Loader from '../components/Loader';

const AdminPanel = () => {
    const api = useApi();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('students');
    const [loading, setLoading] = useState(true);

    // Lists
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [tests, setTests] = useState([]);

    // Attendance Management
    const [selectedClassDay, setSelectedClassDay] = useState('');
    const [attendanceList, setAttendanceList] = useState([]); // List of students + attended state
    const [attendanceCsv, setAttendanceCsv] = useState('');

    // Mock Quiz Creation Modal States
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [testForm, setTestForm] = useState({
        title: '',
        description: '',
        duration: 30,
        startTime: '',
        endTime: '',
        studentClass: 6
    });

    // CSV Bulk Upload Modal States
    const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
    const [selectedTestId, setSelectedTestId] = useState('');
    const [questionCsv, setQuestionCsv] = useState('');

    // Certificate Logs States
    const [certLogs, setCertLogs] = useState([]);

    // Engagement Analytics States
    const [analyticsStats, setAnalyticsStats] = useState(null);

    // Class Link Modal States
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [classForm, setClassForm] = useState({ title: '', day: 1, date: '', meetLink: '', description: '' });

    // Fetch tab-specific data
    const fetchTabRecords = async () => {
        setLoading(true);
        try {
            if (activeTab === 'students') {
                const { data } = await api.get('/api/admin/users');
                setStudents(data);
            } else if (activeTab === 'classes') {
                const { data } = await api.get('/api/admin/classes');
                setClasses(data);
            } else if (activeTab === 'attendance') {
                // Fetch daily classes list
                const { data: classList } = await api.get('/api/admin/classes');
                setClasses(classList);
                if (classList.length > 0 && !selectedClassDay) {
                    setSelectedClassDay(classList[0]._id);
                }
            } else if (activeTab === 'tests') {
                const { data } = await api.get('/api/tests/admin/all');
                setTests(data);
            } else if (activeTab === 'certificates') {
                const { data } = await api.get('/api/certificates/admin/log');
                setCertLogs(data);
            } else if (activeTab === 'analytics') {
                const { data } = await api.get('/api/analytics/engagement');
                setAnalyticsStats(data);
            }
        } catch (err) {
            showToast({ type: 'error', message: 'Failed to synchronize command center data.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTabRecords();
    }, [activeTab]);

    // Load Attendance Grid for Selected Class
    useEffect(() => {
        if (activeTab === 'attendance' && selectedClassDay) {
            const fetchAttendanceGrid = async () => {
                try {
                    setLoading(true);
                    const { data } = await api.get(`/api/attendance/class/${selectedClassDay}`);
                    setAttendanceList(data.students);
                } catch (err) {
                    showToast({ type: 'error', message: 'Failed to fetch attendance records.' });
                } finally {
                    setLoading(false);
                }
            };
            fetchAttendanceGrid();
        }
    }, [selectedClassDay, activeTab]);

    // ----------------------------------------------------
    // STUDENT ACTIONS
    // ----------------------------------------------------
    const handleMarkPaid = async (studentId) => {
        try {
            setStudents(students.map(s => s._id === studentId ? { ...s, paymentStatus: 'paid' } : s));
            await api.patch(`/api/admin/users/${studentId}`, { paymentStatus: 'paid' });
            showToast({ type: 'success', message: 'Student marked as PAID!' });
        } catch (err) {
            showToast({ type: 'error', message: 'Failed to record payment override.' });
            fetchTabRecords();
        }
    };

    // ----------------------------------------------------
    // ATTENDANCE ACTIONS
    // ----------------------------------------------------
    const handleToggleAttendanceCheckbox = (studentId) => {
        setAttendanceList(prev => prev.map(s => s._id === studentId ? { ...s, attended: !s.attended } : s));
    };

    const handleSaveManualAttendance = async () => {
        try {
            setLoading(true);
            const attendanceListPayload = attendanceList.map(s => ({
                userId: s._id,
                attended: s.attended
            }));
            await api.post('/api/attendance/tag', {
                classId: selectedClassDay,
                attendanceList: attendanceListPayload
            });
            showToast({ type: 'success', message: 'Manual attendance records updated successfully!' });
        } catch (err) {
            showToast({ type: 'error', message: 'Failed to save attendance tagging.' });
        } finally {
            setLoading(false);
        }
    };

    const handleImportAttendanceCsv = async () => {
        if (!attendanceCsv.trim()) {
            return showToast({ type: 'warning', message: 'Please paste CSV logs to import.' });
        }
        try {
            setLoading(true);
            await api.post('/api/attendance/bulk-csv', { csvText: attendanceCsv });
            showToast({ type: 'success', message: 'Attendance CSV imported and XP synced!' });
            setAttendanceCsv('');
            fetchTabRecords();
        } catch (err) {
            showToast({ type: 'error', message: err.response?.data?.message || 'CSV parse or import error.' });
        } finally {
            setLoading(false);
        }
    };

    // ----------------------------------------------------
    // MOCK TESTS ACTIONS
    // ----------------------------------------------------
    const handleCreateTest = async () => {
        try {
            setLoading(true);
            await api.post('/api/tests', testForm);
            showToast({ type: 'success', message: 'New Algebra Mock Test scheduled!' });
            setIsTestModalOpen(false);
            setTestForm({ title: '', description: '', duration: 30, startTime: '', endTime: '', studentClass: 6 });
            fetchTabRecords();
        } catch (err) {
            showToast({ type: 'error', message: 'Failed to schedule test.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTest = async (testId) => {
        if (!window.confirm('Warning: Deleting this test will wipe out all student grades! Proceed?')) return;
        try {
            await api.delete(`/api/tests/${testId}`);
            showToast({ type: 'success', message: 'Mock Test deleted.' });
            setTests(tests.filter(t => t._id !== testId));
        } catch (err) {
            showToast({ type: 'error', message: 'Failed to delete test.' });
        }
    };

    const handleOpenCsvModal = (testId) => {
        setSelectedTestId(testId);
        setQuestionCsv('');
        setIsCsvModalOpen(true);
    };

    const handleImportQuestionCsv = async () => {
        if (!questionCsv.trim()) return showToast({ type: 'warning', message: 'Please paste question rows first.' });
        try {
            setLoading(true);
            const { data } = await api.post(`/api/tests/${selectedTestId}/bulk-questions`, {
                csvText: questionCsv
            });
            showToast({ type: 'success', message: 'CSV Question bank imported atomic and complete!' });
            setIsCsvModalOpen(false);
            setQuestionCsv('');
            fetchTabRecords();
        } catch (err) {
            showToast({ type: 'error', message: err.response?.data?.message || 'Validation errors in CSV parsing.' });
        } finally {
            setLoading(false);
        }
    };

    // ----------------------------------------------------
    // CERTIFICATES ACTIONS
    // ----------------------------------------------------
    const handleToggleCertOverride = async (userId, currentEligibility) => {
        try {
            const nextEligibility = !currentEligibility;
            setCertLogs(prev => prev.map(c => c.userId === userId ? { ...c, eligible: nextEligibility } : c));
            await api.post('/api/certificates/admin/override', {
                userId,
                eligible: nextEligibility
            });
            showToast({ type: 'success', message: `Certificate eligibility updated successfully!` });
        } catch (err) {
            showToast({ type: 'error', message: 'Override failed.' });
            fetchTabRecords(); // Rollback
        }
    };

    // ----------------------------------------------------
    // SCHEDULE / CLASS ACTIONS
    // ----------------------------------------------------
    const handleSaveClass = async () => {
        try {
            if (editingClass) {
                await api.put(`/api/admin/classes/${editingClass._id}`, classForm);
                showToast({ type: 'success', message: 'Class updated!' });
            } else {
                await api.post('/api/admin/classes', classForm);
                showToast({ type: 'success', message: 'New class added!' });
            }
            setIsClassModalOpen(false);
            setEditingClass(null);
            fetchTabRecords();
        } catch (err) {
            showToast({ type: 'error', message: 'Failed to save class.' });
        }
    };

    const handleDeleteClass = async (id) => {
        if (!window.confirm('Are you sure you want to delete this class?')) return;
        try {
            await api.delete(`/api/admin/classes/${id}`);
            showToast({ type: 'success', message: 'Class deleted.' });
            setClasses(classes.filter(c => c._id !== id));
        } catch (err) {
            showToast({ type: 'error', message: 'Delete failed.' });
        }
    };

    const openClassModal = (cls = null) => {
        if (cls) {
            setEditingClass(cls);
            setClassForm({ ...cls });
        } else {
            setEditingClass(null);
            setClassForm({ title: '', day: 1, date: '', meetLink: '', description: '' });
        }
        setIsClassModalOpen(true);
    };

    // CSV Download helpers
    const triggerCsvExport = (endpoint) => {
        const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : window.location.origin);
        window.location.href = `${API_URL}${endpoint}`;
    };

    if (loading && students.length === 0 && classes.length === 0 && tests.length === 0 && certLogs.length === 0 && !analyticsStats) {
        return <Loader />;
    }

    return (
        <div className={styles.wrapper}>
            <Navbar />
            <div className={`container ${styles.main}`}>
                <h1 className={styles.title}>EduMEasy Command Center</h1>

                {/* Navigation tabs */}
                <div className={styles.tabs}>
                    <button className={`${styles.tab} ${activeTab === 'students' ? styles.tabActive : ''}`} onClick={() => setActiveTab('students')}>Students Registry</button>
                    <button className={`${styles.tab} ${activeTab === 'classes' ? styles.tabActive : ''}`} onClick={() => setActiveTab('classes')}>Daily Schedule</button>
                    <button className={`${styles.tab} ${activeTab === 'attendance' ? styles.tabActive : ''}`} onClick={() => setActiveTab('attendance')}>Attendance Grid</button>
                    <button className={`${styles.tab} ${activeTab === 'tests' ? styles.tabActive : ''}`} onClick={() => setActiveTab('tests')}>Mock Quiz Engine</button>
                    <button className={`${styles.tab} ${activeTab === 'certificates' ? styles.tabActive : ''}`} onClick={() => setActiveTab('certificates')}>Certificates Registry</button>
                    <button className={`${styles.tab} ${activeTab === 'analytics' ? styles.tabActive : ''}`} onClick={() => setActiveTab('analytics')}>Analytics Logs</button>
                </div>

                <div className={styles.content}>
                    <AnimatePresence mode="wait">
                        
                        {/* ----------------------------------------------------
                            TAB 1: STUDENTS REGISTRY
                        ---------------------------------------------------- */}
                        {activeTab === 'students' && (
                            <motion.div key="students" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className={styles.secHeaderLine}>
                                    <h2>Student Enrollment & Auditing</h2>
                                    <p>Total Registered Students: {students.length}</p>
                                </div>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Student Profile</th>
                                            <th>XP Metrics</th>
                                            <th>Level</th>
                                            <th>Target Class</th>
                                            <th>Billing</th>
                                            <th>Verify Payment</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map(s => (
                                            <tr key={s._id}>
                                                <td>
                                                    <div className={styles.userInfo}>
                                                        <FaUserCircle size={32} className={styles.avatarPlaceholder} />
                                                        <div>
                                                            <div className={styles.userName}>{s.fullName}</div>
                                                            <div className={styles.userEmail}>{s.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td><strong>{s.xp} XP</strong></td>
                                                <td><span className={styles.userLevelBadge}>{s.level}</span></td>
                                                <td><strong>Class {s.studentClass}</strong> ({s.batchId || 'Basics'})</td>
                                                <td>
                                                    <span className={`${styles.badge} ${s.paymentStatus === 'paid' ? styles.paid : styles.unpaid}`}>
                                                        {s.paymentStatus.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td>
                                                    {s.paymentStatus !== 'paid' && (
                                                        <Button variant="primary" size="sm" onClick={() => handleMarkPaid(s._id)}>Verify Order</Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </motion.div>
                        )}

                        {/* ----------------------------------------------------
                            TAB 2: DAILY CLASSES SCHEDULE
                        ---------------------------------------------------- */}
                        {activeTab === 'classes' && (
                            <motion.div key="classes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className={styles.actionsBar}>
                                    <h2>Session Schedule Configuration</h2>
                                    <Button variant="accent" size="md" onClick={() => openClassModal()}><FaPlus /> Add New Class Link</Button>
                                </div>
                                <div className={styles.classGrid}>
                                    {classes.map(c => (
                                        <div key={c._id} className={styles.classCard}>
                                            <h3>Day {c.day}: {c.title}</h3>
                                            <p className={styles.cDesc}>{c.description}</p>
                                            <p className={styles.cLink}><strong>Link:</strong> <a href={c.meetLink} target="_blank" rel="noreferrer">{c.meetLink}</a></p>
                                            <div className={styles.cardActions}>
                                                <Button variant="outline" size="sm" onClick={() => openClassModal(c)}><FaEdit /></Button>
                                                <Button variant="danger" size="sm" onClick={() => handleDeleteClass(c._id)}><FaTrash /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ----------------------------------------------------
                            TAB 3: ATTENDANCE MANAGER (GRID + CSV)
                        ---------------------------------------------------- */}
                        {activeTab === 'attendance' && (
                            <motion.div key="attendance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.attendanceLayout}>
                                <div className={styles.actionsBarAttendance}>
                                    <div>
                                        <h2>Manual Attendance Tagging</h2>
                                        <div className={styles.classSelectBox}>
                                            <label>Select Session Day:</label>
                                            <select value={selectedClassDay} onChange={(e) => setSelectedClassDay(e.target.value)}>
                                                {classes.map(c => (
                                                    <option key={c._id} value={c._id}>Day {c.day}: {c.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* CSV Autofill input block */}
                                    <div className={styles.csvImportBlock}>
                                        <h3>CSV Bulk Autofill Check-ins</h3>
                                        <textarea 
                                            placeholder="Format: email,day,attended (e.g. kid1@mail.com,3,true)"
                                            value={attendanceCsv}
                                            onChange={e => setAttendanceCsv(e.target.value)}
                                            className={styles.csvTextarea}
                                        />
                                        <Button variant="accent" size="sm" onClick={handleImportAttendanceCsv}>
                                            <FaFileUpload /> Import CSV logs
                                        </Button>
                                    </div>
                                </div>

                                <div className={styles.gridSection}>
                                    <h3>Student Attendance Roster</h3>
                                    <div className={styles.attendanceTableWrapper}>
                                        <table className={styles.table}>
                                            <thead>
                                                <tr>
                                                    <th>Student</th>
                                                    <th>Class Level</th>
                                                    <th>Track Batch</th>
                                                    <th>Attended Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {attendanceList.map(s => (
                                                    <tr key={s._id}>
                                                        <td>
                                                            <div>
                                                                <div className={styles.userName}>{s.fullName}</div>
                                                                <div className={styles.userEmail}>{s.email}</div>
                                                            </div>
                                                        </td>
                                                        <td>Class {s.studentClass}</td>
                                                        <td>{s.batchId || 'Basics'}</td>
                                                        <td>
                                                            <input 
                                                                type="checkbox"
                                                                checked={s.attended}
                                                                onChange={() => handleToggleAttendanceCheckbox(s._id)}
                                                                className={styles.attCheckbox}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button variant="primary" size="lg" onClick={handleSaveManualAttendance}>
                                            <FaCheck /> Save Attendance Tagging
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ----------------------------------------------------
                            TAB 4: MOCK QUIZ ENGINE
                        ---------------------------------------------------- */}
                        {activeTab === 'tests' && (
                            <motion.div key="tests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className={styles.actionsBar}>
                                    <h2>Algebra Mock Quiz Registry</h2>
                                    <Button variant="accent" size="md" onClick={() => setIsTestModalOpen(true)}><FaPlus /> Schedule Mock Test</Button>
                                </div>

                                <div className={styles.testsTableWrapper}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Quiz Title</th>
                                                <th>Duration</th>
                                                <th>Class Target</th>
                                                <th>Availability Window</th>
                                                <th>Questions count</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tests.map(t => (
                                                <tr key={t._id}>
                                                    <td><strong>{t.title}</strong></td>
                                                    <td>{t.duration} Mins</td>
                                                    <td>Class {t.studentClass}</td>
                                                    <td>
                                                        <span className={styles.windowTimeText}>
                                                            Open: {new Date(t.startTime).toLocaleDateString()} · {new Date(t.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}<br/>
                                                            Lock: {new Date(t.endTime).toLocaleDateString()} · {new Date(t.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </td>
                                                    <td><strong>{t.questions?.length || 0} Questions</strong></td>
                                                    <td>
                                                        <div className={styles.testActionBtns}>
                                                            <Button variant="outline" size="sm" onClick={() => handleOpenCsvModal(t._id)}><FaFileUpload /> Bulk CSV</Button>
                                                            <Button variant="danger" size="sm" onClick={() => handleDeleteTest(t._id)}><FaTrash /></Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {/* ----------------------------------------------------
                            TAB 5: GRADUATION CERTIFICATES REGISTRY
                        ---------------------------------------------------- */}
                        {activeTab === 'certificates' && (
                            <motion.div key="certificates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className={styles.secHeaderLine}>
                                    <h2>Graduation Eligibility & Exception Overrides</h2>
                                    <p>Milestone: ≥3/5 classes attended + all class-level quizzes completed.</p>
                                </div>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Sessions</th>
                                            <th>Quizzes</th>
                                            <th>Current Status</th>
                                            <th>Eligibility Override Exception</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {certLogs.map(c => (
                                            <tr key={c.userId}>
                                                <td>
                                                    <div>
                                                        <div className={styles.userName}>{c.fullName}</div>
                                                        <div className={styles.userEmail}>{c.email}</div>
                                                    </div>
                                                </td>
                                                <td><strong>{c.attendanceCount}/5</strong></td>
                                                <td><strong>{c.attemptsCount}</strong></td>
                                                <td>
                                                    <span className={`${styles.statusLabel} ${c.eligible ? styles.labelEligible : styles.labelIneligible}`}>
                                                        {c.eligible ? 'Eligible' : 'Ineligible'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button 
                                                        onClick={() => handleToggleCertOverride(c.userId, c.eligible)}
                                                        className={`${styles.overrideBtn} ${c.eligible ? styles.btnRevoke : styles.btnGrant}`}
                                                    >
                                                        {c.eligible ? 'Revoke Exception' : 'Grant Exception'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </motion.div>
                        )}

                        {/* ----------------------------------------------------
                            TAB 6: ENGAGEMENT ANALYTICS
                        ---------------------------------------------------- */}
                        {activeTab === 'analytics' && analyticsStats && (
                            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.analyticsLayout}>
                                <div className={styles.secHeaderLine}>
                                    <h2>Camp Analytics & Engagement Logs</h2>
                                    <p>Comprehensive analytical metrics for batch and session progress.</p>
                                </div>

                                <div className={styles.statsDashboardGrid}>
                                    <div className={styles.statBoxCard}>
                                        <h3>Enrollment</h3>
                                        <div className={styles.statsValue}>{analyticsStats.summary?.totalStudents}</div>
                                        <p>Students onboarded</p>
                                    </div>
                                    <div className={styles.statBoxCard}>
                                        <h3>Engaged Ratio</h3>
                                        <div className={styles.statsValue}>{analyticsStats.summary?.engagementRate}%</div>
                                        <p>{analyticsStats.summary?.activeStudents} students with XP</p>
                                    </div>
                                    <div className={styles.statBoxCard}>
                                        <h3>Camp Revenue</h3>
                                        <div className={styles.statsValue}>{analyticsStats.summary?.paidStudents}</div>
                                        <p>Paid enrollments (₹200)</p>
                                    </div>
                                    <div className={styles.statBoxCard}>
                                        <h3>Quiz average</h3>
                                        <div className={styles.statsValue}>{analyticsStats.quizzes?.averageAccuracy}%</div>
                                        <p>Average accuracy score</p>
                                    </div>
                                </div>

                                <div className={styles.analyticsSubGrid}>
                                    {/* Day-by-Day attendance statistics chart */}
                                    <div className={styles.attChartCard}>
                                        <h3>Session Attendance Ratios</h3>
                                        <div className={styles.chartBarsGrid}>
                                            {analyticsStats.attendanceStats?.map(day => (
                                                <div key={day.day} className={styles.chartRow}>
                                                    <div className={styles.chartRowLabels}>
                                                        <span>Day {day.day}: {day.title}</span>
                                                        <strong>{day.count} students ({day.percentage}%)</strong>
                                                    </div>
                                                    <div className={styles.chartProgressBar}>
                                                        <div className={styles.chartProgressBarFill} style={{ width: `${day.percentage}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* CSV Downloads logs center */}
                                    <div className={styles.exportsCard}>
                                        <h3>Exports Log Center</h3>
                                        <p>Download fully-compiled database spreadsheets for external spreadsheet tracking.</p>
                                        <div className={styles.exportButtonsList}>
                                            <button className={styles.exportBtn} onClick={() => triggerCsvExport('/api/analytics/export/students')}>
                                                <FaCloudDownloadAlt /> Student Registry (CSV)
                                            </button>
                                            <button className={styles.exportBtn} onClick={() => triggerCsvExport('/api/analytics/export/quizzes')}>
                                                <FaCloudDownloadAlt /> Quiz Results Spreadsheet (CSV)
                                            </button>
                                            <button className={styles.exportBtn} onClick={() => triggerCsvExport('/api/analytics/export/attendance')}>
                                                <FaCloudDownloadAlt /> Attendance Matrix (CSV)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </div>

            {/* Modal: Daily session links schedule details */}
            <Modal isOpen={isClassModalOpen} onClose={() => setIsClassModalOpen(false)} title={editingClass ? 'Edit Class Link' : 'Add New Class Link'}>
                <div className={styles.form}>
                    <div className={styles.field}>
                        <label>Title</label>
                        <input type="text" value={classForm.title} onChange={e => setClassForm({ ...classForm, title: e.target.value })} />
                    </div>
                    <div className={styles.field}>
                        <label>Day (1-5)</label>
                        <input type="number" value={classForm.day} onChange={e => setClassForm({ ...classForm, day: parseInt(e.target.value) })} />
                    </div>
                    <div className={styles.field}>
                        <label>Google Meet / Stream Link</label>
                        <input type="text" value={classForm.meetLink} onChange={e => setClassForm({ ...classForm, meetLink: e.target.value })} />
                    </div>
                    <div className={styles.field}>
                        <label>Description</label>
                        <textarea value={classForm.description} onChange={e => setClassForm({ ...classForm, description: e.target.value })} />
                    </div>
                    <Button variant="primary" size="lg" onClick={handleSaveClass}>Save Class Link</Button>
                </div>
            </Modal>

            {/* Modal: Schedule Mock Quiz */}
            <Modal isOpen={isTestModalOpen} onClose={() => setIsTestModalOpen(false)} title="Schedule Mock Quiz">
                <div className={styles.form}>
                    <div className={styles.field}>
                        <label>Quiz Title</label>
                        <input type="text" placeholder="e.g. Linear Equations Test" value={testForm.title} onChange={e => setTestForm({ ...testForm, title: e.target.value })} />
                    </div>
                    <div className={styles.field}>
                        <label>Description</label>
                        <input type="text" placeholder="e.g. Test on variables and wobbly math operations" value={testForm.description} onChange={e => setTestForm({ ...testForm, description: e.target.value })} />
                    </div>
                    <div className={styles.field}>
                        <label>Duration (Minutes)</label>
                        <input type="number" value={testForm.duration} onChange={e => setTestForm({ ...testForm, duration: parseInt(e.target.value) })} />
                    </div>
                    <div className={styles.field}>
                        <label>Target Class (6-10)</label>
                        <input type="number" value={testForm.studentClass} onChange={e => setTestForm({ ...testForm, studentClass: parseInt(e.target.value) })} />
                    </div>
                    <div className={styles.field}>
                        <label>Unlock Availability Window Start</label>
                        <input type="datetime-local" value={testForm.startTime} onChange={e => setTestForm({ ...testForm, startTime: e.target.value })} />
                    </div>
                    <div className={styles.field}>
                        <label>Lock Availability Window Close</label>
                        <input type="datetime-local" value={testForm.endTime} onChange={e => setTestForm({ ...testForm, endTime: e.target.value })} />
                    </div>
                    <Button variant="primary" size="lg" onClick={handleCreateTest}>Schedule Test</Button>
                </div>
            </Modal>

            {/* Modal: Bulk CSV Questions */}
            <Modal isOpen={isCsvModalOpen} onClose={() => setIsCsvModalOpen(false)} title="Bulk Upload Questions (CSV)">
                <div className={styles.form}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <strong>Required Format:</strong><br/>
                        text,type,options,correctAnswers,points,negativePoints,difficulty,topic<br/>
                        * Split multiple options/answers by a semicolon (;)<br/>
                        * Types supported: mcq_single, mcq_multi, integer, boolean
                    </p>
                    <div className={styles.field}>
                        <label>Paste CSV Data:</label>
                        <textarea 
                            placeholder="text,type,options,correctAnswers,points,negativePoints,difficulty,topic" 
                            value={questionCsv} 
                            onChange={e => setQuestionCsv(e.target.value)} 
                            style={{ height: '250px' }}
                        />
                    </div>
                    <Button variant="primary" size="lg" onClick={handleImportQuestionCsv}>Import Question Bank</Button>
                </div>
            </Modal>

            <Footer />
        </div>
    );
};

export default AdminPanel;
