const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { signToken } = require('../utils/paseto');
const { sendOTPEmail, sendPasswordResetEmail } = require('../utils/email');
const { verifyToken } = require('../middleware/auth');

// CSRF Protection Middleware
const requireAjax = (req, res, next) => {
    // Basic CSRF check
    const origin = req.headers.origin || req.headers.referer;
    
    const allowedClientUrl = process.env.CLIENT_URL;
    const sameOriginUrl = req.protocol + '://' + req.get('host');
    
    const isAllowed = origin && (
        (allowedClientUrl && origin.startsWith(allowedClientUrl)) ||
        origin.startsWith(sameOriginUrl) ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1') ||
        (process.env.NODE_ENV === 'production' && origin.includes('onrender.com'))
    );

    if (origin && !isAllowed) {
        return res.status(403).json({ message: 'Forbidden origin' });
    }
    const requestedWith = req.headers['x-requested-with'];
    if (!requestedWith || requestedWith !== 'XMLHttpRequest') {
        // Axios sets this header if configured, but let's assume it's enforced.
        // The user spec says: "Add a custom x-requested-with: XMLHttpRequest header check as secondary layer"
        return res.status(403).json({ message: 'CSRF validation failed' });
    }
    next();
};

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Too many login attempts, please try again later." }
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { message: "Too many accounts created from this IP, please try again after an hour." },
    standardHeaders: true,
    legacyHeaders: false
});

const verifyLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { message: "Too many verification attempts, please try again later." },
    standardHeaders: true,
    legacyHeaders: false
});

const resendOtpLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 1,
    message: { message: "Please wait before requesting another OTP" },
    standardHeaders: true,
    legacyHeaders: false
});

const forgotPasswordLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 3,
    message: { message: "Too many reset attempts, please try again later." },
    standardHeaders: true,
    legacyHeaders: false
});

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const passwordValidation = body('password')
    .isLength({ min: 8 }).withMessage('Must be at least 8 chars')
    .matches(/[A-Z]/).withMessage('Must contain 1 uppercase')
    .matches(/[0-9]/).withMessage('Must contain 1 number')
    .matches(/[\W_]/).withMessage('Must contain 1 special character');

// Generate 6-digit OTP
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

// 1. Register
router.post('/register', requireAjax, registerLimiter, [
    body('fullName').trim().notEmpty().isLength({ min: 2, max: 60 }).matches(/^[a-zA-Z\s]+$/).withMessage('Invalid full name'),
    body('fatherName').trim().notEmpty().isLength({ min: 2, max: 60 }).matches(/^[a-zA-Z\s]+$/).withMessage('Invalid father name'),
    body('dateOfBirth').notEmpty().isISO8601().custom(value => {
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        if (age < 5 || age > 20) throw new Error('Age must be between 5 and 20 years');
        return true;
    }),
    body('schoolName').trim().notEmpty().isLength({ min: 3, max: 100 }),
    body('studentClass').notEmpty().isInt({ min: 6, max: 10 }),
    body('whatsapp').notEmpty().matches(/^[6-9][0-9]{9}$/),
    body('email').notEmpty().isEmail().normalizeEmail(),
    passwordValidation,
    body('state').trim().notEmpty().isLength({ min: 2 }),
    body('district').trim().notEmpty().isLength({ min: 2 }),
    body('batchId').notEmpty()
], validate, async (req, res) => {
    try {
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        const passwordHash = await bcrypt.hash(req.body.password, 12);
        
        const otp = generateOTP();
        const otpHash = await bcrypt.hash(otp, 12);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        const newUser = new User({
            fullName: req.body.fullName,
            fatherName: req.body.fatherName,
            dateOfBirth: req.body.dateOfBirth,
            schoolName: req.body.schoolName,
            studentClass: parseInt(req.body.studentClass),
            whatsapp: req.body.whatsapp,
            email: req.body.email,
            passwordHash,
            state: req.body.state,
            district: req.body.district,
            batchId: req.body.batchId || null,
            otpHash,
            otpExpiry
        });

        await newUser.save();
        await sendOTPEmail(req.body.email, req.body.fullName, otp);

        // Tokens
        const accessToken = await signToken({ userId: newUser._id, role: newUser.role });
        
        const refreshTokenPlain = crypto.randomBytes(40).toString('hex');
        const refreshTokenHash = await bcrypt.hash(refreshTokenPlain, 10);
        
        await RefreshToken.create({
            userId: newUser._id,
            tokenHash: refreshTokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 mins
        });

        res.cookie('refreshToken', refreshTokenPlain, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({ 
            message: "Account created! Check your email for the OTP to verify your account.",
            user: { 
                fullName: newUser.fullName, 
                email: newUser.email, 
                role: newUser.role, 
                xp: newUser.xp, 
                level: newUser.level, 
                studentClass: newUser.studentClass,
                isEmailVerified: newUser.isEmailVerified
            } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 2. Verify Email
router.post('/verify-email', requireAjax, verifyLimiter, [
    body('email').isEmail(),
    body('otp').isLength({ min: 6, max: 6 })
], validate, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(400).json({ message: 'Invalid request' });

        if (!user.otpHash || !user.otpExpiry || user.otpExpiry < new Date()) {
            return res.status(400).json({ message: 'OTP expired or invalid' });
        }

        const isMatch = await bcrypt.compare(req.body.otp, user.otpHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        user.isEmailVerified = true;
        user.otpHash = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.status(200).json({ message: "Email verified. You can now log in." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 3. Resend OTP
router.post('/resend-otp', requireAjax, resendOtpLimiter, [
    body('email').isEmail()
], validate, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(400).json({ message: 'Invalid request' });

        if (user.isEmailVerified) {
            return res.status(400).json({ message: 'Email already verified' });
        }

        // Rate limit 60 seconds
        if (user.otpExpiry && user.otpExpiry.getTime() > Date.now() + 9 * 60 * 1000) {
            return res.status(429).json({ message: 'Please wait before requesting another OTP' });
        }

        const otp = generateOTP();
        const otpHash = await bcrypt.hash(otp, 12);
        user.otpHash = otpHash;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await sendOTPEmail(req.body.email, user.fullName, otp);

        res.status(200).json({ message: "New OTP sent." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 4. Login
router.post('/login', requireAjax, loginLimiter, [
    body('email').isEmail(),
    body('password').notEmpty()
], validate, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.lockUntil && user.lockUntil > new Date()) {
            return res.status(423).json({ message: 'Account locked. Try again after 30 minutes.' });
        }

        // allow unverified users to log in, the frontend will show a banner to prompt verification

        const isMatch = await bcrypt.compare(req.body.password, user.passwordHash);
        if (!isMatch) {
            user.failedLoginAttempts += 1;
            if (user.failedLoginAttempts >= 5) {
                user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
            }
            await user.save();
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

        // Tokens
        const accessToken = await signToken({ userId: user._id, role: user.role });
        
        const refreshTokenPlain = crypto.randomBytes(40).toString('hex');
        const refreshTokenHash = await bcrypt.hash(refreshTokenPlain, 10);
        
        await RefreshToken.create({
            userId: user._id,
            tokenHash: refreshTokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 mins
        });

        res.cookie('refreshToken', refreshTokenPlain, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({ 
            user: { 
                fullName: user.fullName, 
                email: user.email, 
                role: user.role, 
                xp: user.xp, 
                level: user.level, 
                studentClass: user.studentClass,
                isEmailVerified: user.isEmailVerified
            } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 5. Refresh Token
router.post('/refresh', requireAjax, async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });

        const tokens = await RefreshToken.find(); // Could be optimized by storing token ID in cookie
        let matchedTokenDoc = null;
        for (const t of tokens) {
            if (await bcrypt.compare(refreshToken, t.tokenHash)) {
                matchedTokenDoc = t;
                break;
            }
        }

        if (!matchedTokenDoc || matchedTokenDoc.expiresAt < new Date()) {
            if (matchedTokenDoc) await RefreshToken.findByIdAndDelete(matchedTokenDoc._id);
            return res.status(401).json({ message: 'Invalid or expired refresh token' });
        }

        const user = await User.findById(matchedTokenDoc.userId);
        if (!user) return res.status(401).json({ message: 'User not found' });

        // Rotate
        await RefreshToken.findByIdAndDelete(matchedTokenDoc._id);

        const newAccessToken = await signToken({ userId: user._id, role: user.role });
        const newRefreshTokenPlain = crypto.randomBytes(40).toString('hex');
        const newRefreshTokenHash = await bcrypt.hash(newRefreshTokenPlain, 10);

        await RefreshToken.create({
            userId: user._id,
            tokenHash: newRefreshTokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        res.cookie('token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000
        });

        res.cookie('refreshToken', newRefreshTokenPlain, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({ message: "Token refreshed" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 6. Logout
router.post('/logout', requireAjax, async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (refreshToken) {
            const tokens = await RefreshToken.find();
            for (const t of tokens) {
                if (await bcrypt.compare(refreshToken, t.tokenHash)) {
                    await RefreshToken.findByIdAndDelete(t._id);
                    break;
                }
            }
        }
    } catch (err) {
        console.error(err);
    }

    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    
    res.status(200).json({ message: "Logged out" });
});

// 7. Get Me
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-passwordHash -otpHash -refreshTokenHash');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 8. Forgot Password
router.post('/forgot-password', requireAjax, forgotPasswordLimiter, [
    body('email').isEmail()
], validate, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email.toLowerCase() });

        // Always respond success to avoid email enumeration
        if (!user) {
            return res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.resetPasswordTokenHash = resetTokenHash;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 60 mins
        await user.save();

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const resetLink = `${clientUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;
        await sendPasswordResetEmail(user.email, user.fullName, resetLink);

        return res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 9. Reset Password
router.post('/reset-password', requireAjax, [
    body('email').isEmail(),
    body('token').notEmpty(),
    passwordValidation
], validate, async (req, res) => {
    try {
        const { email, token, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !user.resetPasswordTokenHash || !user.resetPasswordExpires) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        if (user.resetPasswordExpires < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        const incomingHash = crypto.createHash('sha256').update(token).digest('hex');
        if (incomingHash !== user.resetPasswordTokenHash) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        user.passwordHash = await bcrypt.hash(password, 12);
        user.resetPasswordTokenHash = undefined;
        user.resetPasswordExpires = undefined;
        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
