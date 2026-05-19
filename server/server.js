const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(cookieParser());

const extraClientUrls = (process.env.CLIENT_URLS || '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

const allowedOrigins = [
    process.env.CLIENT_URL,
    ...extraClientUrls,
    'http://localhost:5173',
    'http://localhost:5000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5000'
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const isAllowed = allowedOrigins.includes(origin) || 
                          origin.includes('onrender.com') ||
                          origin.startsWith('http://localhost') || 
                          origin.startsWith('http://127.0.0.1');
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.options(/.*/, cors());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/user', require('./routes/user'));
app.use('/api/doubts', require('./routes/doubts'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/analytics', require('./routes/analytics'));

const PORT = process.env.PORT || 5000;

// Serve static assets in production
if (process.env.NODE_ENV === 'production' && process.env.SERVE_CLIENT === 'true') {
    const path = require('path');
    const fs = require('fs');
    const distPath = path.join(__dirname, '..', 'client', 'dist');
    const indexPath = path.join(distPath, 'index.html');

    if (fs.existsSync(indexPath)) {
        app.use(express.static(distPath));
        app.get('/{*path}', (req, res) => {
            res.sendFile(indexPath);
        });
    } else {
        console.warn('SERVE_CLIENT=true but client dist not found, skipping static serve');
    }
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
