import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserCircle, FaEdit, FaTrash, FaCheck } from 'react-icons/fa';
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
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [classForm, setClassForm] = useState({ title: '', day: 1, date: '', meetLink: '', description: '' });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'students') {
                const { data } = await api.get('/api/admin/users');
                setStudents(data);
            } else if (activeTab === 'classes') {
                const { data } = await api.get('/api/admin/classes');
                setClasses(data);
            } else if (activeTab === 'orders') {
                const { data } = await api.get('/api/admin/orders');
                setOrders(data);
            }
        } catch (err) {
            showToast({ type: 'error', message: 'Failed to fetch data.' });
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPaid = async (studentId) => {
        try {
            // Optimistic UI
            setStudents(students.map(s => s._id === studentId ? { ...s, paymentStatus: 'paid' } : s));
            await api.patch(`/api/admin/users/${studentId}`, { paymentStatus: 'paid' });
            showToast({ type: 'success', message: 'Student marked as PAID!' });
        } catch (err) {
            showToast({ type: 'error', message: 'Update failed.' });
            fetchData(); // Rollback
        }
    };

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
            fetchData();
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

    if (loading && students.length === 0 && classes.length === 0) return <Loader />;

    return (
        <div className={styles.wrapper}>
            <Navbar />
            <div className={`container ${styles.main}`}>
                <h1 className={styles.title}>Admin Command Center</h1>

                <div className={styles.tabs}>
                    <button className={`${styles.tab} ${activeTab === 'students' ? styles.tabActive : ''}`} onClick={() => setActiveTab('students')}>Students</button>
                    <button className={`${styles.tab} ${activeTab === 'classes' ? styles.tabActive : ''}`} onClick={() => setActiveTab('classes')}>Classes</button>
                    <button className={`${styles.tab} ${activeTab === 'orders' ? styles.tabActive : ''}`} onClick={() => setActiveTab('orders')}>Orders</button>
                </div>

                <div className={styles.content}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'students' && (
                            <motion.div key="students" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>XP</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map(s => (
                                            <tr key={s._id}>
                                                <td>
                                                    <div className={styles.userInfo}>
                                                        <img src={s.picture} alt="" className={styles.avatar} />
                                                        <div>
                                                            <div className={styles.userName}>{s.name}</div>
                                                            <div className={styles.userEmail}>{s.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td><strong>{s.xp}</strong></td>
                                                <td>
                                                    <span className={`${styles.badge} ${s.paymentStatus === 'paid' ? styles.paid : styles.unpaid}`}>
                                                        {s.paymentStatus.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td>
                                                    {s.paymentStatus !== 'paid' && (
                                                        <Button variant="primary" size="sm" onClick={() => handleMarkPaid(s._id)}>Mark Paid</Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </motion.div>
                        )}

                        {activeTab === 'classes' && (
                            <motion.div key="classes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className={styles.actionsBar}>
                                    <Button variant="accent" size="md" onClick={() => openClassModal()}>Add New Class</Button>
                                </div>
                                <div className={styles.classGrid}>
                                    {classes.map(c => (
                                        <div key={c._id} className={styles.classCard}>
                                            <h3>Day {c.day}: {c.title}</h3>
                                            <p>{c.description}</p>
                                            <div className={styles.cardActions}>
                                                <Button variant="outline" size="sm" onClick={() => openClassModal(c)}><FaEdit /></Button>
                                                <Button variant="danger" size="sm" onClick={() => handleDeleteClass(c._id)}><FaTrash /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <Modal isOpen={isClassModalOpen} onClose={() => setIsClassModalOpen(false)} title={editingClass ? 'Edit Class' : 'Add New Class'}>
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
                        <label>Google Meet Link</label>
                        <input type="text" value={classForm.meetLink} onChange={e => setClassForm({ ...classForm, meetLink: e.target.value })} />
                    </div>
                    <div className={styles.field}>
                        <label>Description</label>
                        <textarea value={classForm.description} onChange={e => setClassForm({ ...classForm, description: e.target.value })} />
                    </div>
                    <Button variant="primary" size="lg" onClick={handleSaveClass}>Save Class</Button>
                </div>
            </Modal>
            <Footer />
        </div>
    );
};

export default AdminPanel;
