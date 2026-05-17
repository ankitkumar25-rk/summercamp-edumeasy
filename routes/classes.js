const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const { verifyToken } = require('../middleware/auth');

// Get all classes
router.get('/', verifyToken, async (req, res) => {
    try {
        const classes = await Class.find().sort({ day: 1 });
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching classes' });
    }
});

// Get today's class (simplified)
router.get('/today', verifyToken, async (req, res) => {
    try {
        // In a real app, logic would check actual date. 
        // For now, return class based on a 'day' query or just the first one.
        const day = req.query.day || 1;
        const todayClass = await Class.findOne({ day });
        res.json(todayClass);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching today class' });
    }
});

module.exports = router;
