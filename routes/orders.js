const express = require('express');
const router = express.Router();
// const Razorpay = require('razorpay'); // Commented out for local testing
const crypto = require('crypto');
const Order = require('../models/Order');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
require('dotenv').config();

/* 
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});
*/

const CAMP_PRICE_INR = 499; // Total price inclusive of GST

// Create Order (Mocked)
router.post('/create', authMiddleware, async (req, res) => {
    const amount = CAMP_PRICE_INR * 100; // in paise

    try {
        // Mocking Razorpay Order creation
        const mockOrderId = `order_mock_${Date.now()}`;
        
        // Save to our DB
        await Order.create({
            userId: req.user.userId,
            amount: amount,
            razorpayOrderId: mockOrderId,
            status: 'created'
        });

        res.json({ id: mockOrderId, amount: amount, currency: 'INR' });
    } catch (err) {
        console.error('Create Order Error:', err);
        res.status(500).json({ message: 'Error creating order' });
    }
});

// Verify Payment (Mocked)
router.post('/verify', authMiddleware, async (req, res) => {
    const { razorpay_order_id } = req.body;

    // For testing, we skip signature verification
    try {
        // Update Order status
        await Order.findOneAndUpdate(
            { razorpayOrderId: razorpay_order_id },
            { status: 'paid' }
        );

        // Update User payment status
        await User.findByIdAndUpdate(req.user.userId, { paymentStatus: 'paid' });

        res.json({ message: 'Payment verified successfully (MOCK)' });
    } catch (error) {
        console.error('Verify Payment DB Error:', error);
        res.status(500).json({ message: 'Error updating payment status' });
    }
});

module.exports = router;
