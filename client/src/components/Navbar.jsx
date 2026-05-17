// CHANGED: Restructured Navbar component with enhanced LIVE badge using MdOutlineLiveTv, left-sliding drawer menu, backdrop overlay, and animated 3-span hamburger toggle button.

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import { MdDashboard, MdLeaderboard, MdOutlineLiveTv } from 'react-icons/md';
import { IoClose } from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Navbar.module.css';
import Button from './Button';
import logo from '../assets/logo.webp';

const Navbar = () => {
    const { user, isAuthenticated, logout, isAdmin, isPaid } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMenuOpen]);

    const handleScroll = (id) => {
        if (location.pathname !== '/') {
            navigate('/', { state: { scrollTo: id } });
            return;
        }
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        setIsMenuOpen(false);
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

    return (
        <nav className={styles.navbar}>
            <div className={`container ${styles.navContent}`}>
                <Link to="/" className={styles.logo}>
                    <img src={logo} alt="EduMEasy Logo" className={styles.logoImg} />
                </Link>

                {/* Desktop Links */}
                <div className={styles.desktopNav}>
                    <button onClick={() => handleScroll('hero')} className={styles.navLink}>Home</button>
                    <button onClick={() => handleScroll('schedule')} className={styles.navLink}>Schedule</button>
                    <button onClick={() => handleScroll('about')} className={styles.navLink}>About</button>
                    <button onClick={() => handleScroll('contact')} className={styles.navLink}>Contact</button>
                </div>

                <div className={styles.authSection}>
                    {isAuthenticated ? (
                        <div className={styles.userMenu}>
                            {isPaid && (
                                <Link to="/live-class" className={styles.liveBadge}>
                                    <MdOutlineLiveTv size={14} /> LIVE
                                </Link>
                            )}
                            <div className={styles.avatarWrapper} onClick={toggleDropdown}>
                                {user.picture ? (
                                    <img src={user.picture} alt={user.fullName} className={styles.avatar} />
                                ) : (
                                    <div className={styles.avatarPlaceholder} style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        backgroundColor: 'var(--primary)', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 'bold', fontSize: '1.2rem'
                                    }}>
                                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : <FaUserCircle size={24} />}
                                    </div>
                                )}
                                {isDropdownOpen && (
                                    <div className={styles.dropdown}>
                                        <Link to="/dashboard" className={styles.dropdownItem}>
                                            <MdDashboard /> Dashboard
                                        </Link>
                                        {isAdmin && (
                                            <Link to="/admin" className={styles.dropdownItem}>
                                                <MdLeaderboard /> Admin Panel
                                            </Link>
                                        )}
                                        <button onClick={logout} className={styles.dropdownItem}>
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.desktopOnlyButtons}>
                            <Button
                                variant="outline"
                                size="md"
                                onClick={() => navigate('/login')}
                            >
                                <span>Log In</span>
                            </Button>
                            <Button
                                variant="accent"
                                size="md"
                                onClick={() => navigate('/register')}
                            >
                                <span>Register Now</span>
                            </Button>
                        </div>
                    )}

                    {/* Mobile Toggle Button */}
                    <button 
                        className={`${styles.mobileToggle} ${isMenuOpen ? styles.mobileToggleActive : ''}`} 
                        onClick={toggleMenu} 
                        aria-label="Toggle Menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu Backdrop Overlay */}
            {isMenuOpen && (
                <div className={styles.backdrop} onClick={toggleMenu} aria-hidden="true" />
            )}

            {/* Mobile Left Drawer Menu */}
            <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ''}`}>
                <div className={styles.drawerHeader}>
                    <img src={logo} alt="EduMEasy Logo" className={styles.logoImg} style={{ maxHeight: '36px' }} />
                    <button onClick={toggleMenu} className={styles.closeBtn} aria-label="Close Menu">
                        <IoClose size={28} />
                    </button>
                </div>
                <div className={styles.mobileLinks}>
                    <button onClick={() => handleScroll('hero')} className={styles.mobileNavLink}>Home</button>
                    <button onClick={() => handleScroll('schedule')} className={styles.mobileNavLink}>Schedule</button>
                    <button onClick={() => handleScroll('about')} className={styles.mobileNavLink}>About</button>
                    <button onClick={() => handleScroll('contact')} className={styles.mobileNavLink}>Contact</button>
                    {isAuthenticated ? (
                        <>
                            <Link to="/dashboard" className={styles.mobileNavLink} onClick={toggleMenu}>Dashboard</Link>
                            {isAdmin && (
                                <Link to="/admin" className={styles.mobileNavLink} onClick={toggleMenu}>Admin Panel</Link>
                            )}
                            <button onClick={() => { logout(); toggleMenu(); }} className={styles.mobileNavLink} style={{ textAlign: 'left', color: 'var(--danger)' }}>Logout</button>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                            <Button variant="outline" size="md" onClick={() => { navigate('/login'); toggleMenu(); }}>Log In</Button>
                            <Button variant="accent" size="md" onClick={() => { navigate('/register'); toggleMenu(); }}>Register Now</Button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
