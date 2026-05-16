import React from 'react';
import { Link } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import { MdClass, MdDevices } from 'react-icons/md';
import styles from '../styles/Footer.module.css';
import logo from '../assets/logo.webp';

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={`container ${styles.grid}`}>
                <div className={styles.brand}>
                    <div className={styles.logo}>
                        <img src={logo} alt="EduMEasy Logo" className={styles.logoImg} />
                    </div>
                    <p className={styles.tagline}>Making Algebra as fun as your favorite video game.</p>
                </div>

                <div className={styles.column}>
                    <h4 className={styles.colTitle}>Adventure</h4>
                    <Link to="/" className={styles.link}>Home</Link>
                    <Link to="/#schedule" className={styles.link}>Schedule</Link>
                    <Link to="/#pricing" className={styles.link}>Pricing</Link>
                </div>

                <div className={styles.column}>
                    <h4 className={styles.colTitle}>Support</h4>
                    <Link to="/terms" className={styles.link}>Terms of Use</Link>
                    <Link to="/privacy" className={styles.link}>Privacy Policy</Link>
                    <Link to="/refund" className={styles.link}>Refund Policy</Link>
                </div>

                <div className={styles.column}>
                    <h4 className={styles.colTitle}>Address</h4>
                    <address className={styles.address}>
                        IStart Incubation Center,<br />
                        Vikramaditya Nagar, Surya Colony,<br />
                        Jodhpur, Rajasthan 342001<br />
                        <a href="mailto:contactus@edumeasy.com">contactus@edumeasy.com</a><br />
                        <a href="tel:+918824661216">+91-8824661216</a>
                    </address>
                </div>
            </div>
            <div className={styles.bottomBar}>
                <div className="container">
                    <p>© 2026 EduMEasy. All Rights Reserved. Built with ❤️ for Math Legends.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
