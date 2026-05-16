import React from 'react';
import { BsStarFill } from 'react-icons/bs';
import styles from '../styles/Testimonials.module.css';

const Testimonials = () => {
    const reviews = [
        {
            name: "Rahul S.",
            grade: "Class 8",
            text: "Algebra used to be my nightmare, but this camp made it feel like a puzzle game! Loved the XP rewards.",
            rating: 5
        },
        {
            name: "Ananya M.",
            grade: "Class 7",
            text: "The live classes are so much fun. I never thought I would say this, but I love solving equations now!",
            rating: 5
        },
        {
            name: "Ishan K.",
            grade: "Class 9",
            text: "Perfect for students who hate boring lectures. It's fast, interactive, and actually useful.",
            rating: 5
        }
    ];

    return (
        <section className={styles.section}>
            <div className="container">
                <h2 className={styles.title}>What Fellow Legends Say</h2>
                <div className={styles.grid}>
                    {reviews.map((rev, index) => (
                        <div key={index} className={styles.card}>
                            <div className={styles.stars}>
                                {[...Array(rev.rating)].map((_, i) => (
                                    <BsStarFill key={i} />
                                ))}
                            </div>
                            <p className={styles.text}>"{rev.text}"</p>
                            <div className={styles.author}>
                                <div className={styles.avatar}>
                                    {rev.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className={styles.name}>{rev.name}</h4>
                                    <span className={styles.grade}>{rev.grade}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
