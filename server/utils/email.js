const nodemailer = require('nodemailer');

const sendOTPEmail = async (email, fullName, otp) => {
    try {
        const safeName = fullName || 'there';
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_PORT === '465',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const mailOptions = {
            from: `"${process.env.SMTP_FROM_NAME || 'EduMEasy'}" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Your EduMEasy OTP - Verify Your Email',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <p>Hi ${safeName},</p>
                    <p>Welcome to EduMEasy Algebra Summer Camp! 🎉</p>
                    <p>Your One-Time Password (OTP) to verify your email is:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <h2 style="font-size: 28px; font-weight: bold; letter-spacing: 5px; padding: 15px; background: #f4f4f4; border-radius: 8px; display: inline-block; margin: 0;">
                            [ ${otp} ]
                        </h2>
                    </div>
                    <p>This OTP is valid for 10 minutes only.<br>Do not share this OTP with anyone.</p>
                    <p style="font-size: 12px; color: #666; margin-top: 30px;">If you did not register on EduMEasy, please ignore this email.</p>
                    <p>— EduMEasy Team</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending OTP email:', error);
    }
};

const sendPasswordResetEmail = async (email, fullName, resetLink) => {
    try {
        const safeName = fullName || 'there';
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_PORT === '465',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const mailOptions = {
            from: `"${process.env.SMTP_FROM_NAME || 'EduMEasy'}" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'EduMEasy Password Reset Link',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <p>Hi ${safeName},</p>
                    <p>We received a request to reset your EduMEasy password.</p>
                    <p>Click the button below to set a new password. This link is valid for 60 minutes.</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${resetLink}" style="display: inline-block; padding: 12px 20px; background: #3D1A8E; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
                    </div>
                    <p>If you did not request this, you can safely ignore this email.</p>
                    <p>— EduMEasy Team</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending password reset email:', error);
    }
};
module.exports = { sendOTPEmail, sendPasswordResetEmail };
