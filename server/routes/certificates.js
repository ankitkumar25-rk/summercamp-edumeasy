const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');
const Certificate = require('../models/Certificate');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// CSRF check
const requireAjax = (req, res, next) => {
    const requestedWith = req.headers['x-requested-with'];
    if (!requestedWith || requestedWith !== 'XMLHttpRequest') {
        return res.status(403).json({ message: 'CSRF validation failed' });
    }
    next();
};

// Helper: Check eligibility status of a student
const checkUserEligibility = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return { eligible: false, reason: 'User not found' };

    // 1. Get total classes and attendance count
    const totalClasses = await Class.find();
    const attendanceRecords = await Attendance.find({ userId, attended: true });
    const attendanceCount = attendanceRecords.length;

    // 2. Get total tests and student attempts
    const totalTests = await Test.find({ studentClass: user.studentClass });
    const testAttempts = await TestAttempt.find({ userId, isSubmitted: true });
    
    // Total tests count
    const testsCount = totalTests.length;
    const attemptsCount = testAttempts.length;

    // 3. Score calculation
    let totalScore = 0;
    testAttempts.forEach(a => { totalScore += a.score; });
    const averageScore = attemptsCount > 0 ? (totalScore / attemptsCount) : 0;

    // Rules: Attended >= 3/5 sessions AND attempted all active tests
    // If no tests are configured yet, require 0 attempts.
    const attendanceRule = attendanceCount >= 3;
    const testsRule = testsCount > 0 ? (attemptsCount >= testsCount) : true;
    
    // Check if an exception certificate document exists (Admin override)
    const existingCert = await Certificate.findOne({ userId });
    const eligibleOverride = existingCert ? existingCert.eligible : false;

    const baseEligible = attendanceRule && testsRule;
    const finalEligibility = baseEligible || eligibleOverride;

    let reason = 'Requirements met successfully!';
    if (!finalEligibility) {
        if (!attendanceRule) reason = `Attended only ${attendanceCount}/5 classes (Min 3 required).`;
        else if (!testsRule) reason = `Attempted only ${attemptsCount}/${testsCount} tests (All required).`;
    }

    return {
        eligible: finalEligibility,
        reason,
        attendanceCount,
        testsCount,
        attemptsCount,
        averageScore,
        user
    };
};

// ----------------------------------------------------
// STUDENT ENDPOINTS
// ----------------------------------------------------

// 1. Check my eligibility status
router.get('/eligibility', verifyToken, async (req, res) => {
    try {
        const stats = await checkUserEligibility(req.user.userId);
        res.json({
            eligible: stats.eligible,
            reason: stats.reason,
            attendanceCount: stats.attendanceCount,
            testsCount: stats.testsCount,
            attemptsCount: stats.attemptsCount,
            averageScore: Math.round(stats.averageScore * 10) / 10
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error checking certificate eligibility' });
    }
});

// 2. Download Certificate as branded PDF
router.get('/download', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const stats = await checkUserEligibility(userId);

        if (!stats.eligible) {
            return res.status(403).json({ message: `You are not eligible yet: ${stats.reason}` });
        }

        const user = stats.user;

        // Ensure a Certificate record exists in our Database
        let cert = await Certificate.findOne({ userId });
        const uniqueId = cert ? cert.certificateId : `CERT-EDUMEASY-2026-${userId.toString().slice(-6).toUpperCase()}`;

        if (!cert) {
            cert = await Certificate.create({
                userId,
                certificateId: uniqueId,
                attendanceCount: stats.attendanceCount,
                testsAttempted: stats.attemptsCount,
                averageScore: stats.averageScore,
                eligible: true
            });
        }

        // Initialize PDF Document: Landscape A4
        const doc = new PDFDocument({
            size: 'A4',
            layout: 'landscape',
            margins: { top: 0, bottom: 0, left: 0, right: 0 }
        });

        // Pipe directly to response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=EduMEasy_Algebra_Camp_Certificate_${user.fullName.replace(/\s+/g, '_')}.pdf`);
        doc.pipe(res);

        // --- DRAW NEUBRUTALIST BRANDED VECTOR GRAPHICS ---
        
        // Background color
        doc.rect(0, 0, 842, 595).fill('#FDF8F5'); // Soft warm white background

        // Thick Neubrutalist double-border
        doc.rect(25, 25, 792, 545).lineWidth(6).stroke('#3D1A8E'); // Deep purple primary border
        doc.rect(32, 32, 778, 531).lineWidth(2).stroke('#D4880A'); // Gold secondary inner border

        // Header Title Logo
        doc.fillColor('#3D1A8E')
           .font('Helvetica-Bold')
           .fontSize(36)
           .text('EduMEasy', 0, 70, { align: 'center' });

        doc.fillColor('#E63329')
           .font('Helvetica-Bold')
           .fontSize(16)
           .text('🏆 ALGEBRA SUMMER CLASS ADVENTURE 🏆', 0, 115, { align: 'center' });

        // Body message
        doc.fillColor('#333333')
           .font('Helvetica')
           .fontSize(18)
           .text('This is proudly awarded to', 0, 180, { align: 'center' });

        // Branded Student Name display (Chunky Font size)
        doc.fillColor('#3D1A8E')
           .font('Helvetica-Bold')
           .fontSize(42)
           .text(user.fullName, 0, 220, { align: 'center' });

        // Decorative underline
        doc.moveTo(250, 270).lineTo(592, 270).lineWidth(4).stroke('#E63329');

        // Course details text
        const courseText = `for successfully conquering the 5-Day Algebra Summer Camp.\nBy completing interactive live modules, submitting academic doubts, and solving critical game-quizzes, they have officially risen from Rookie to the level of ${user.level}!`;
        doc.fillColor('#555555')
           .font('Helvetica')
           .fontSize(14)
           .text(courseText, 100, 300, { align: 'center', width: 642, lineGap: 6 });

        // Metrics details box (Neubrutalist Badge)
        doc.rect(171, 395, 500, 50).fill('#EDE8FB'); // Pill-shaped stats block
        doc.rect(171, 395, 500, 50).lineWidth(2).stroke('#3D1A8E');

        const statsText = `Attendance: ${stats.attendanceCount}/5 Days   |   Tests Completed: ${stats.attemptsCount}   |   Final Grade: Math Champion`;
        doc.fillColor('#3D1A8E')
           .font('Helvetica-Bold')
           .fontSize(12)
           .text(statsText, 171, 414, { align: 'center', width: 500 });

        // Signatures & footer
        doc.fillColor('#333333')
           .font('Helvetica-Bold')
           .fontSize(12)
           .text('Dr. Algebra Wizard', 150, 490)
           .font('Helvetica')
           .fontSize(10)
           .text('Head of Mathematics, EduMEasy', 150, 505);

        doc.fillColor('#333333')
           .font('Helvetica-Bold')
           .fontSize(12)
           .text('IIT-JEE Mentor Team', 550, 490)
           .font('Helvetica')
           .fontSize(10)
           .text('Algebra Camp Coordinators', 550, 505);

        // Branded Unique ID
        doc.fillColor('#D4880A')
           .font('Helvetica-Bold')
           .fontSize(9)
           .text(`Verification ID: ${uniqueId}`, 32, 545, { width: 778, align: 'center' });

        doc.end();
    } catch (err) {
        console.error('Certificate PDF generation error:', err);
        res.status(500).json({ message: 'Error generating vector certificate' });
    }
});

// ----------------------------------------------------
// ADMIN ENDPOINTS
// ----------------------------------------------------

// 1. Get all students with their certificate eligibility status
router.get('/admin/log', verifyToken, requireAdmin, async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('fullName email studentClass level batchId').sort({ fullName: 1 });
        
        const logs = [];
        for (const s of students) {
            const stats = await checkUserEligibility(s._id);
            logs.push({
                userId: s._id,
                fullName: s.fullName,
                email: s.email,
                studentClass: s.studentClass,
                level: s.level,
                batchId: s.batchId,
                eligible: stats.eligible,
                attendanceCount: stats.attendanceCount,
                attemptsCount: stats.attemptsCount,
                reason: stats.reason
            });
        }
        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error loading certificate logs' });
    }
});

// 2. Set Admin Override exception (grant manual eligibility status)
router.post('/admin/override', verifyToken, requireAdmin, requireAjax, async (req, res) => {
    try {
        const { userId, eligible } = req.body;
        if (!userId) return res.status(400).json({ message: 'Missing userId' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        let cert = await Certificate.findOne({ userId });
        const uniqueId = cert ? cert.certificateId : `CERT-EDUMEASY-2026-${userId.toString().slice(-6).toUpperCase()}`;

        if (cert) {
            cert.eligible = eligible;
            await cert.save();
        } else {
            await Certificate.create({
                userId,
                certificateId: uniqueId,
                eligible
            });
        }

        res.json({ message: `Eligibility manually ${eligible ? 'GRANTED' : 'REVOKED'} for ${user.fullName}.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error setting certificate override' });
    }
});

module.exports = router;
