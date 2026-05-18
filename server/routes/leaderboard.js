const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// Simple In-Memory Leaderboard Cache to handle 2000+ concurrent students without DB bottlenecks
let cache = {
    students: null,
    lastFetched: 0
};

const CACHE_TTL_MS = 10000; // 10 seconds TTL

// Helper: Fetch all student rankings and cache them
const getRankedStudents = async () => {
    const now = Date.now();
    if (cache.students && (now - cache.lastFetched < CACHE_TTL_MS)) {
        return cache.students;
    }

    const students = await User.find({ role: 'student' })
        .select('fullName xp level studentClass batchId email')
        .sort({ xp: -1 });

    // Map fields for backward compatibility
    const mapped = students.map((s, index) => ({
        _id: s._id,
        name: s.fullName,
        email: s.email,
        xp: s.xp,
        level: s.level,
        studentClass: s.studentClass,
        batchId: s.batchId || 'bas', // Default to basic if blank
        overallRank: index + 1
    }));

    cache.students = mapped;
    cache.lastFetched = now;
    return mapped;
};

// 1. Get filtered leaderboard lists & Top 10 cards
router.get('/', async (req, res) => {
    try {
        const studentClass = req.query.studentClass ? parseInt(req.query.studentClass) : null;
        const batchId = req.query.batchId || null;

        const allRanked = await getRankedStudents();
        let filtered = [...allRanked];

        if (studentClass) {
            filtered = filtered.filter(s => s.studentClass === studentClass);
        }
        if (batchId) {
            filtered = filtered.filter(s => s.batchId.toLowerCase() === batchId.toLowerCase());
        }

        // Re-calculate local ranks for the filtered subset
        const results = filtered.map((s, index) => ({
            ...s,
            rank: index + 1
        }));

        // Return top 50 (or limit to 10 for dashboard widget)
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        res.json(results.slice(0, limit));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error loading leaderboard' });
    }
});

// 2. Get logged-in user's personalized ranks, total comparison, and percentile
router.get('/my-rank', verifyToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const allRanked = await getRankedStudents();

        const userRecord = allRanked.find(s => s._id.toString() === currentUserId.toString());
        if (!userRecord) {
            return res.status(404).json({ message: 'Active student record not found in leaderboard.' });
        }

        // Overall calculations
        const overallRank = userRecord.overallRank;
        const overallTotal = allRanked.length;
        const overallPercentile = overallTotal > 1 
            ? Math.max(0, Math.round(((overallTotal - overallRank) / (overallTotal - 1)) * 100))
            : 100;

        // Class-specific calculations
        const classRanked = allRanked.filter(s => s.studentClass === userRecord.studentClass);
        const classRank = classRanked.findIndex(s => s._id.toString() === currentUserId.toString()) + 1;
        const classTotal = classRanked.length;
        const classPercentile = classTotal > 1 
            ? Math.max(0, Math.round(((classTotal - classRank) / (classTotal - 1)) * 100))
            : 100;

        // Batch-specific calculations
        const batchRanked = allRanked.filter(s => s.batchId.toLowerCase() === userRecord.batchId.toLowerCase());
        const batchRank = batchRanked.findIndex(s => s._id.toString() === currentUserId.toString()) + 1;
        const batchTotal = batchRanked.length;
        const batchPercentile = batchTotal > 1 
            ? Math.max(0, Math.round(((batchTotal - batchRank) / (batchTotal - 1)) * 100))
            : 100;

        res.json({
            user: {
                name: userRecord.name,
                xp: userRecord.xp,
                level: userRecord.level,
                studentClass: userRecord.studentClass,
                batchId: userRecord.batchId
            },
            overall: { rank: overallRank, total: overallTotal, percentile: overallPercentile },
            classSpecific: { rank: classRank, total: classTotal, percentile: classPercentile },
            batchSpecific: { rank: batchRank, total: batchTotal, percentile: batchPercentile }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching user ranks comparison' });
    }
});

module.exports = router;
