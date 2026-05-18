const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    certificateId: { type: String, required: true, unique: true }, // Format: CERT-EDUMEASY-YYYY-XXXX
    issuedAt: { type: Date, default: Date.now },
    fileUrl: { type: String }, // Local file path or cloud asset path
    attendanceCount: { type: Number, default: 0 },
    testsAttempted: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    eligible: { type: Boolean, default: false }
});

module.exports = mongoose.model('Certificate', certificateSchema);
