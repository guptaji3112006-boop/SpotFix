import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-fallback';

const generateToken = (id: string) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d',
  });
};

// ... existing registerUser and loginUser

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ error: 'Database connection is temporarily unavailable. Please try again later.' });
      return;
    }

    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Please enter all fields' });
      return;
    }

    if (password.length > 5) {
      res.status(400).json({ error: 'Password length must not exceed 5 characters' });
      return;
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ error: 'This email is already registered. Please log in.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      userId: uuidv4(),
      name,
      email,
      password: hashedPassword,
      role: role && role === 'admin' ? 'admin' : 'user',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id.toString()),
      });
    } else {
      res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ error: 'Database connection is temporarily unavailable. Please try again later.' });
      return;
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id.toString()),
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('SMTP credentials missing. Please set SMTP_USER and SMTP_PASS environment variables.');
      res.status(500).json({ error: 'Email service is not configured. Please check server logs.' });
      return;
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('SMTP connection failed:', verifyError);
      res.status(500).json({ error: 'SMTP connection failed. Please check server logs.' });
      return;
    }

    try {
      await transporter.sendMail({
        from: '"SpotFix Team" <noreply@spotfix.com>',
        to: email,
        subject: 'Your Password Reset OTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h2 style="color: #4f46e5; text-align: center;">SpotFix Password Reset</h2>
            <p style="color: #334155; font-size: 16px;">Hello,</p>
            <p style="color: #334155; font-size: 16px;">You requested to reset your password. Use the following 6-digit OTP to proceed. This OTP is valid for 10 minutes.</p>
            <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #0f172a;">${otp}</span>
            </div>
            <p style="color: #64748b; font-size: 14px; text-align: center;">If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
      console.log('OTP email sent successfully to', email);
      
      res.json({ message: 'OTP sent to email successfully' });
    } catch (sendError: any) {
      console.error('Failed to send OTP email:', sendError.message);
      res.status(500).json({ error: 'Error sending email. Please check server logs.' });
    }

  } catch (error: any) {
    console.error('Server error during forgotPassword:', error.message);
    res.status(500).json({ error: 'Server error sending OTP' });
  }
};

export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ 
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired OTP' });
      return;
    }

    res.json({ message: 'OTP verified', token: generateToken(user._id.toString()) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error verifying OTP' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, password } = req.body;
    const user = await User.findOne({ 
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired OTP' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error resetting password' });
  }
};
