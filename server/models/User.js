const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName:          { type: String, required: true, trim: true },
    fatherName:        { type: String, required: true, trim: true },
    dateOfBirth:       { type: Date, required: true },
    schoolName:        { type: String, required: true, trim: true },
    studentClass:      { type: Number, required: true, enum: [6,7,8,9,10] },
    whatsapp:          { type: String, required: true, match: /^[0-9]{10}$/ },
    email:             { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash:      { type: String, required: true },
    state:             { type: String, required: true },
    district:          { type: String, required: true },
    batchId:           { type: String },
    role:              { type: String, enum: ['student', 'admin'], default: 'student' },
    isEmailVerified:   { type: Boolean, default: false },
    otpHash:           { type: String },
    otpExpiry:         { type: Date },
    xp:                { type: Number, default: 0 },
    level:             { type: String, default: 'Rookie' },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil:         { type: Date },
    refreshTokenHash:  { type: String },
    resetPasswordTokenHash: { type: String },
    resetPasswordExpires: { type: Date },
    completedClasses:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }], // Keeping this for compatibility
    paymentStatus:     { type: String, enum: ['pending', 'paid'], default: 'pending' }, // Keeping this for compatibility
    createdAt:         { type: Date, default: Date.now }
});
userSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.otpHash;
        delete ret.refreshTokenHash;
        return ret;
    }
});

module.exports = mongoose.model('User', userSchema);
