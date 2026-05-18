const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    type: { type: String, enum: ['mcq_single', 'mcq_multi', 'integer', 'boolean'], required: true },
    options: [{ type: String }], // Optional for integer/boolean questions
    correctAnswers: [{ type: String, required: true }], // Stores answer values (e.g. ["A"], ["True"], or ["14"])
    points: { type: Number, default: 4 },
    negativePoints: { type: Number, default: 0 },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    topic: { type: String, default: 'General Algebra' }
});

const testSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    duration: { type: Number, required: true, default: 30 }, // duration in minutes
    startTime: { type: Date, required: true }, // Start of availability window
    endTime: { type: Date, required: true }, // End of availability window
    studentClass: { type: Number, required: true, enum: [6, 7, 8, 9, 10] }, // Targets specific class level
    questions: [questionSchema],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Test', testSchema);
