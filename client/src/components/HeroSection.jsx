import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { IoRocketSharp } from 'react-icons/io5';
import { BsFillPlayCircleFill, BsCalendarCheck } from 'react-icons/bs';
import { TbMathFunction } from 'react-icons/tb';
import styles from '../styles/HeroSection.module.css';
import Button from './Button';
import Modal from './Modal';
import heroClassroom from '../assets/hero-classroom.png';

const HeroSection = ({ onEnroll }) => {
    const [isVideoOpen, setIsVideoOpen] = useState(false);

    return (
        <section className={styles.hero} id="hero">
            <div className={`container ${styles.grid}`}>
                <motion.div 
                    className={styles.content}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className={styles.badge}>
                        <BsCalendarCheck /> <span>June 02 – June 06, 2026 · Online Live Classes</span>
                    </div>
                    <h1 className={styles.title}>
                        5 DAYS ONLINE SUMMER CAMP ON <span className={styles.highlight}>ALGEBRA</span>
                    </h1>
                    <p className={styles.subtitle}>
                        <strong>Learning Math By Doing Math</strong><br/>
                        Learn Algebra | Build Logic | Prepare for the Future
                    </p>
                    <div className={styles.actions}>
                        <Button variant="accent" size="lg" onClick={onEnroll}>
                            <IoRocketSharp /> <span>Enroll Now</span>
                        </Button>
                        <Button variant="outline" size="lg" onClick={() => setIsVideoOpen(true)}>
                            <BsFillPlayCircleFill /> <span>Watch Preview</span>
                        </Button>
                    </div>
                </motion.div>

                <motion.div 
                    className={styles.visual}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className={styles.imageWrapper}>
                        <motion.div 
                            className={styles.floatIcon}
                            animate={{ y: [0, -20, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        >
                            <TbMathFunction size={80} />
                        </motion.div>
                        <div className={styles.mainCircle}>
                            <div className={styles.innerCircle}>
                                <img src={heroClassroom} alt="Classroom Math Session" className={styles.heroImg} />
                            </div>
                        </div>
                        <div className={styles.xpCard}>
                            <div className={styles.xpCircle}>+50</div>
                            <span>XP Earned!</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Video Modal */}
            <Modal 
                isOpen={isVideoOpen} 
                onClose={() => setIsVideoOpen(false)} 
                title="Class Preview"
            >
                <div className={styles.videoContainer}>
                    <iframe 
                        width="100%" 
                        height="315" 
                        src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                        title="YouTube video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                    ></iframe>
                </div>
            </Modal>
        </section>
    );
};

export default HeroSection;
