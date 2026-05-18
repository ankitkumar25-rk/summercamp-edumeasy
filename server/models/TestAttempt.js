const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedAnswers: [{ type: String }],
    isCorrect: { type: Boolean, default: false },
    timeSpentSeconds: { type: Number, default: 0 }
});

const testAttemptSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    startedAt: { type: Date, required: true, default: Date.now },
    completedAt: { type: Date },
    isSubmitted: { type: Boolean, default: false },
    responses: [responseSchema],
    score: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
    analytics: {
        accuracyPercent: { type: Number, default: 0 },
        totalCorrect: { type: Number, default: 0 },
        totalWrong: { type: Number, default: 0 },
        timeSpentMinutes: { type: Number, default: 0 },
        topicWiseAnalysis: { type: Map, of: Object } // topic -> { correct: Number, total: Number }
    },
    createdAt: { type: Date, default: Date.now }
});

// Ensure compound index to prevent duplicate attempts per user per test
testAttemptSchema.index({ userId: 1, testId: 1 }, { unique: true });

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
