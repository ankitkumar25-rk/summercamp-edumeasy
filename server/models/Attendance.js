const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    attended: { type: Boolean, default: true },
    markedAt: { type: Date, default: Date.now },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Unique index to prevent duplicate attendance entry for a user in a specific class
attendanceSchema.index({ userId: 1, classId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
