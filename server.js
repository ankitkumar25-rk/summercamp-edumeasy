const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

const User = require('./models/User');

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
app.use(passport.initialize());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));

// Passport Configuration
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
        proxy: true
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ googleId: profile.id });
            if (!user) {
                // Check if user exists by email (if they were added by admin first)
                user = await User.findOne({ email: profile.emails[0].value });
                if (user) {
                    user.googleId = profile.id;
                    user.picture = profile.photos[0].value;
                    await user.save();
                } else {
                    user = await User.create({
                        googleId: profile.id,
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        picture: profile.photos[0].value,
                        role: 'user' // Default role
                    });
                }
            }
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }));
} else {
    console.error('❌ CRITICAL: Google OAuth credentials missing in .env. Authentication will fail.');
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/user', require('./routes/user'));
app.use('/api/doubts', require('./routes/doubts'));

const PORT = process.env.PORT || 5000;

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    // Set static folder
    app.use(express.static(path.join(__dirname, 'client/dist')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'dist', 'index.html'));
    });
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
