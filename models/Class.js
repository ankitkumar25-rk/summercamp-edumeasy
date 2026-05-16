const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    title: { type: String, required: true },
    day: { type: Number, required: true, min: 1, max: 5 },
    date: { type: String, required: true }, // Format: "YYYY-MM-DD" or similar
    meetLink: { type: String, required: true },
    description: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Class', classSchema);
