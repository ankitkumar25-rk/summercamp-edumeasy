const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Class = require('../models/Class');
const Order = require('../models/Order');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Apply admin protection to all routes in this file
router.use(verifyToken, requireAdmin);

// --- USERS ---
router.get('/users', async (req, res) => {
    const users = await User.find().select('-googleId');
    res.json(users);
});

// --- CLASSES ---
router.get('/classes', async (req, res) => {
    const classes = await Class.find().sort({ day: 1 });
    res.json(classes);
});

router.post('/classes', async (req, res) => {
    try {
        const newClass = await Class.create(req.body);
        res.status(201).json(newClass);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.put('/classes/:id', async (req, res) => {
    const updatedClass = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedClass);
});

router.delete('/classes/:id', async (req, res) => {
    await Class.findByIdAndDelete(req.params.id);
    res.json({ message: 'Class deleted' });
});

// --- ORDERS ---
router.get('/orders', async (req, res) => {
    const orders = await Order.find().populate('userId', 'name email');
    res.json(orders);
});

module.exports = router;
