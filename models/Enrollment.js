const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    track: { type: String, enum: ['01', '02', '03'] }, // Track 01, 02, 03
    orderId: String, // Razorpay Order ID
    paymentId: String, // Razorpay Payment ID
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    amount: Number,
    enrolledAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);
