const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');
const Doubt = require('../models/Doubt');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// 1. Get overall student engagement stats (Admin only)
router.get('/engagement', verifyToken, requireAdmin, async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student' });
        const activeStudents = await User.countDocuments({ role: 'student', xp: { $gt: 0 } });
        const paidStudents = await User.countDocuments({ role: 'student', paymentStatus: 'paid' });
        
        // Doubts analysis
        const totalDoubts = await Doubt.countDocuments();
        const resolvedDoubts = await Doubt.countDocuments({ status: 'resolved' });

        // Test attempts overall grading metrics
        const completedAttempts = await TestAttempt.find({ isSubmitted: true });
        let totalScoreSum = 0;
        let accuracySum = 0;
        completedAttempts.forEach(a => {
            totalScoreSum += a.score;
            accuracySum += a.analytics.accuracyPercent;
        });
        const averageAccuracy = completedAttempts.length > 0 ? Math.round(accuracySum / completedAttempts.length) : 0;
        const averageScore = completedAttempts.length > 0 ? Math.round((totalScoreSum / completedAttempts.length) * 10) / 10 : 0;

        // Class-by-Class Attendance Metrics
        const classes = await Class.find().sort({ day: 1 });
        const attendanceStats = [];
        for (const c of classes) {
            const count = await Attendance.countDocuments({ classId: c._id, attended: true });
            const attendancePct = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
            attendanceStats.push({
                day: c.day,
                title: c.title,
                count,
                percentage: attendancePct
            });
        }

        res.json({
            summary: {
                totalStudents,
                activeStudents,
                paidStudents,
                engagementRate: totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0,
                paymentRatio: totalStudents > 0 ? Math.round((paidStudents / totalStudents) * 100) : 0
            },
            doubts: {
                total: totalDoubts,
                resolved: resolvedDoubts,
                resolutionRate: totalDoubts > 0 ? Math.round((resolvedDoubts / totalDoubts) * 100) : 0
            },
            quizzes: {
                totalCompletedAttempts: completedAttempts.length,
                averageAccuracy,
                averageScore
            },
            attendanceStats
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error loading engagement metrics' });
    }
});

// 2. Export Student Registry details as CSV
router.get('/export/students', verifyToken, requireAdmin, async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).sort({ fullName: 1 });
        
        let csvContent = 'Full Name,Email,Class,Batch,XP,Level,Payment Status,Registration Date\n';
        
        students.forEach(s => {
            const name = `"${s.fullName.replace(/"/g, '""')}"`;
            const batch = s.batchId || 'Basics';
            const regDate = s.createdAt ? s.createdAt.toISOString().slice(0,10) : 'N/A';
            csvContent += `${name},${s.email},${s.studentClass},${batch},${s.xp},${s.level},${s.paymentStatus},${regDate}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=EduMEasy_Students_Report.csv');
        res.status(200).send(csvContent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error exporting students report' });
    }
});

// 3. Export Mock Quiz Attempts details as CSV
router.get('/export/quizzes', verifyToken, requireAdmin, async (req, res) => {
    try {
        const attempts = await TestAttempt.find({ isSubmitted: true })
            .populate('userId', 'fullName email studentClass')
            .populate('testId', 'title')
            .sort({ createdAt: -1 });

        let csvContent = 'Student Name,Student Email,Test Title,Score,Accuracy %,Time Spent (Mins),Attempt Date\n';

        attempts.forEach(a => {
            const studentName = a.userId ? `"${a.userId.fullName.replace(/"/g, '""')}"` : 'Deleted User';
            const studentEmail = a.userId ? a.userId.email : 'N/A';
            const testTitle = a.testId ? `"${a.testId.title.replace(/"/g, '""')}"` : 'Deleted Quiz';
            const dateStr = a.completedAt ? a.completedAt.toISOString().slice(0, 10) : 'N/A';

            csvContent += `${studentName},${studentEmail},${testTitle},${a.score},${a.analytics.accuracyPercent},${a.analytics.timeSpentMinutes},${dateStr}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=EduMEasy_Quiz_Results.csv');
        res.status(200).send(csvContent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error exporting quiz results report' });
    }
});

// 4. Export Day-by-Day Attendance Spreadsheet as CSV
router.get('/export/attendance', verifyToken, requireAdmin, async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).sort({ fullName: 1 });
        const classes = await Class.find().sort({ day: 1 });

        let headers = 'Student Name,Student Email,Class,Batch';
        classes.forEach(c => {
            headers += `,Day ${c.day} (${c.title.replace(/"/g, '""')})`;
        });
        headers += ',Total Attended\n';

        let csvContent = headers;

        for (const s of students) {
            const name = `"${s.fullName.replace(/"/g, '""')}"`;
            const batch = s.batchId || 'Basics';
            
            let row = `${name},${s.email},${s.studentClass},${batch}`;
            let attendedCount = 0;

            for (const c of classes) {
                const attended = await Attendance.findOne({ userId: s._id, classId: c._id, attended: true });
                if (attended) {
                    row += ',Attended';
                    attendedCount++;
                } else {
                    row += ',Absent';
                }
            }
            row += `,${attendedCount}\n`;
            csvContent += row;
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=EduMEasy_Attendance_Registry.csv');
        res.status(200).send(csvContent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error exporting attendance grid report' });
    }
});

module.exports = router;
