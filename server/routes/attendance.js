const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// ----------------------------------------------------
// STUDENT ENDPOINTS
// ----------------------------------------------------

// 1. Get my attendance status, percentage, and continuous streak
router.get('/my-status', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const totalClasses = await Class.find().sort({ day: 1 });
        const attendanceRecords = await Attendance.find({ userId, attended: true });

        const attendedClassIds = attendanceRecords.map(r => r.classId.toString());
        
        let streak = 0;
        let currentStreak = 0;
        let maxStreak = 0;

        // Calculate max streak based on day numbers
        const totalDaysCount = totalClasses.length;
        for (let i = 1; i <= totalDaysCount; i++) {
            const cls = totalClasses.find(c => c.day === i);
            if (cls && attendedClassIds.includes(cls._id.toString())) {
                currentStreak++;
                if (currentStreak > maxStreak) {
                    maxStreak = currentStreak;
                }
            } else {
                currentStreak = 0;
            }
        }
        streak = maxStreak;

        const attendedCount = attendanceRecords.length;
        const totalCount = totalClasses.length;
        const attendancePercentage = totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0;

        // Map classes with attendance status
        const classStatuses = totalClasses.map(cls => ({
            _id: cls._id,
            title: cls.title,
            day: cls.day,
            date: cls.date,
            attended: attendedClassIds.includes(cls._id.toString())
        }));

        res.json({
            streak,
            attendedCount,
            totalCount,
            attendancePercentage,
            classStatuses
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error loading attendance status' });
    }
});

// ----------------------------------------------------
// ADMIN ENDPOINTS
// ----------------------------------------------------

// 1. Fetch attendance log for a class
router.get('/class/:classId', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { classId } = req.params;
        const targetClass = await Class.findById(classId);
        if (!targetClass) return res.status(404).json({ message: 'Class not found' });

        // Fetch all active students
        const students = await User.find({ role: 'student' }).select('fullName email studentClass batchId').sort({ fullName: 1 });
        const attendanceRecords = await Attendance.find({ classId });

        const attendedUserIds = attendanceRecords.filter(r => r.attended).map(r => r.userId.toString());

        const studentsWithAttendance = students.map(s => ({
            _id: s._id,
            fullName: s.fullName,
            email: s.email,
            studentClass: s.studentClass,
            batchId: s.batchId,
            attended: attendedUserIds.includes(s._id.toString())
        }));

        res.json({
            targetClass,
            students: studentsWithAttendance
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching class attendance' });
    }
});

// 2. Manual attendance tagging by admin (batch list submission)
router.post('/tag', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { classId, attendanceList } = req.body; // List of { userId, attended: Boolean }
        if (!classId || !Array.isArray(attendanceList)) {
            return res.status(400).json({ message: 'Missing classId or attendanceList array.' });
        }

        const targetClass = await Class.findById(classId);
        if (!targetClass) return res.status(404).json({ message: 'Class not found' });

        for (const item of attendanceList) {
            const { userId, attended } = item;
            
            // Find or Create Attendance
            const record = await Attendance.findOne({ userId, classId });
            const wasAttended = record ? record.attended : false;

            if (record) {
                record.attended = attended;
                record.markedBy = req.user.userId;
                record.markedAt = new Date();
                await record.save();
            } else {
                await Attendance.create({
                    userId,
                    classId,
                    attended,
                    markedBy: req.user.userId
                });
            }

            // Sync with User completedClasses array for backward-compatibility & award XP
            const user = await User.findById(userId);
            if (user) {
                const classIndex = user.completedClasses.indexOf(classId);
                
                if (attended && !wasAttended) {
                    // Newly attended
                    if (classIndex === -1) {
                        user.completedClasses.push(classId);
                        user.xp += 100; // Award 100 XP
                    }
                } else if (!attended && wasAttended) {
                    // Attendance revoked
                    if (classIndex !== -1) {
                        user.completedClasses.splice(classIndex, 1);
                        user.xp = Math.max(0, user.xp - 100); // Revoke 100 XP
                    }
                }
                
                // Recalculate levels
                if (user.xp >= 1000) user.level = 'Math Wizard';
                else if (user.xp >= 600) user.level = 'Elite Solver';
                else if (user.xp >= 300) user.level = 'Algebra Challenger';
                else user.level = 'Rookie';
                
                await user.save();
            }
        }

        res.json({ message: 'Attendance records updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating attendance tagging' });
    }
});

// 3. Webhook/CSV bulk autofill upload (Admin)
// Receives CSV as: email,day,attended
router.post('/bulk-csv', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { csvText } = req.body;
        if (!csvText) return res.status(400).json({ message: 'No CSV data provided' });

        const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length <= 1) {
            return res.status(400).json({ message: 'CSV contains no rows' });
        }

        // Header parsing: email, day, attended
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const emailIdx = headers.indexOf('email');
        const dayIdx = headers.indexOf('day');
        const attendedIdx = headers.indexOf('attended');

        if (emailIdx === -1 || dayIdx === -1 || attendedIdx === -1) {
            return res.status(400).json({ message: 'CSV requires "email", "day", and "attended" columns.' });
        }

        const errors = [];
        let importedCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const cols = line.split(',').map(c => c.trim());
            if (cols.length < 3) {
                errors.push(`Row ${i + 1}: Insufficient columns.`);
                continue;
            }

            const email = cols[emailIdx].toLowerCase();
            const dayNum = parseInt(cols[dayIdx]);
            const attendedVal = cols[attendedIdx].toLowerCase() === 'true' || cols[attendedIdx] === '1';

            if (isNaN(dayNum) || dayNum < 1 || dayNum > 5) {
                errors.push(`Row ${i + 1}: Day must be between 1 and 5.`);
                continue;
            }

            // Find User
            const user = await User.findOne({ email });
            if (!user) {
                errors.push(`Row ${i + 1}: User with email "${email}" not found.`);
                continue;
            }

            // Find Class
            const targetClass = await Class.findOne({ day: dayNum });
            if (!targetClass) {
                errors.push(`Row ${i + 1}: Class for day ${dayNum} not found.`);
                continue;
            }

            const classId = targetClass._id;
            
            // Check current attendance state
            const record = await Attendance.findOne({ userId: user._id, classId });
            const wasAttended = record ? record.attended : false;

            if (record) {
                record.attended = attendedVal;
                record.markedBy = req.user.userId;
                record.markedAt = new Date();
                await record.save();
            } else {
                await Attendance.create({
                    userId: user._id,
                    classId,
                    attended: attendedVal,
                    markedBy: req.user.userId
                });
            }

            // XP and completedClasses synchronization
            const classIndex = user.completedClasses.indexOf(classId);
            if (attendedVal && !wasAttended) {
                if (classIndex === -1) {
                    user.completedClasses.push(classId);
                    user.xp += 100;
                }
            } else if (!attendedVal && wasAttended) {
                if (classIndex !== -1) {
                    user.completedClasses.splice(classIndex, 1);
                    user.xp = Math.max(0, user.xp - 100);
                }
            }

            // Reset Level
            if (user.xp >= 1000) user.level = 'Math Wizard';
            else if (user.xp >= 600) user.level = 'Elite Solver';
            else if (user.xp >= 300) user.level = 'Algebra Challenger';
            else user.level = 'Rookie';

            await user.save();
            importedCount++;
        }

        if (errors.length > 0) {
            return res.status(400).json({ message: 'Errors found during CSV parsing.', errors, importedCount });
        }

        res.json({ message: `Successfully updated attendance for ${importedCount} records.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error processing CSV bulk attendance' });
    }
});

module.exports = router;
