const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    googleId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    picture: String,
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    xp: { type: Number, default: 0 },
    completedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
