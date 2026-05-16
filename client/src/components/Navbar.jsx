import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaGoogle, FaUserCircle } from 'react-icons/fa';
import { HiHome } from 'react-icons/hi';
import { MdDashboard, MdLeaderboard } from 'react-icons/md';
import { IoClose } from 'react-icons/io5';
import { RiLiveLine } from 'react-icons/ri';
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

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
                                    <RiLiveLine /> LIVE
                                </Link>
                            )}
                            <div className={styles.avatarWrapper} onClick={toggleDropdown}>
                                {user.picture ? (
                                    <img src={user.picture} alt={user.name} className={styles.avatar} />
                                ) : (
                                    <FaUserCircle size={40} color="var(--primary)" />
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
                        <Button 
                            variant="accent" 
                            size="md" 
                            onClick={() => window.location.href = `${API_URL}/api/auth/google`}
                        >
                            <FaGoogle /> <span>Login</span>
                        </Button>
                    )}
                    
                    {/* Mobile Toggle */}
                    <button className={styles.mobileToggle} onClick={toggleMenu}>
                        {isMenuOpen ? <IoClose size={32} /> : <div className={styles.hamburger}></div>}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className={styles.mobileMenu}>
                    <button onClick={() => handleScroll('hero')} className={styles.mobileNavLink}>Home</button>
                    <button onClick={() => handleScroll('schedule')} className={styles.mobileNavLink}>Schedule</button>
                    <button onClick={() => handleScroll('about')} className={styles.mobileNavLink}>About</button>
                    <button onClick={() => handleScroll('contact')} className={styles.mobileNavLink}>Contact</button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
