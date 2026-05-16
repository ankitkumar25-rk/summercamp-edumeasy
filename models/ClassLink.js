const mongoose = require('mongoose');

const classLinkSchema = new mongoose.Schema({
    day: { type: Number, required: true }, // 1 to 5
    track: { type: String, enum: ['01', '02', '03'] },
    link: String, // Zoom or YT link
    title: String,
    date: Date,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('ClassLink', classLinkSchema);
