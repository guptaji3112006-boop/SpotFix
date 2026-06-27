import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Issue from '../models/Issue';
import User from '../models/User';
import { GoogleGenAI, Type } from "@google/genai";
import { getGenAI } from '../services/geminiService';
import nodemailer from 'nodemailer';

export const getAdminIssues = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
       res.status(503).json({ error: 'Database connection is temporarily unavailable. Please try again later.' });
       return;
    }

    // Sort by reportCount desc, then severity
    // We can also allow filtering by status from req.query.status
    const query: any = {};
    if (req.query.status) {
      query.status = req.query.status;
    }

    const issues = await Issue.find(query).sort({ reportCount: -1 });
    res.json(issues);
  } catch (error) {
    console.error('Error fetching admin issues', error);
    res.status(500).json({ error: 'Failed to fetch issues.' });
  }
};

const sendStatusEmail = async (userEmail: string, issueTitle: string, newStatus: string) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('SMTP credentials missing. Status email will not be sent.');
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

    let messageBody = '';
    if (newStatus === 'In Progress') {
      messageBody = `Good news! The SpotFix team has started working on your reported issue: <strong>${issueTitle}</strong>.`;
    } else if (newStatus === 'Resolved') {
      messageBody = `Thank you for being a Community Hero! Your reported issue: <strong>${issueTitle}</strong> has been successfully resolved.`;
    } else {
      messageBody = `The status of your reported issue: <strong>${issueTitle}</strong> has been updated to: <strong>${newStatus}</strong>.`;
    }

    const mailOptions = {
      from: '"SpotFix Team" <noreply@spotfix.com>',
      to: userEmail,
      subject: `SpotFix Issue Update: ${newStatus}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">SpotFix Status Update</h2>
          <p style="color: #334155; font-size: 16px;">Hello,</p>
          <p style="color: #334155; font-size: 16px;">${messageBody}</p>
          <p style="color: #64748b; font-size: 14px; margin-top: 20px;">Thank you for helping improve our community!</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Status update email sent to ${userEmail} for issue: ${issueTitle}`);
  } catch (error) {
    console.error('Error sending status email:', error);
  }
};

export const updateIssueStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
       res.status(400).json({ error: 'Status is required' });
       return;
    }

    if (mongoose.connection.readyState !== 1) {
       // Mock for preview if DB is not connected
       res.json({ id, status });
       return;
    }

    const updateData: any = { status };
    if (status === 'Resolved') {
      updateData.resolvedAt = new Date();
    }

    const issue = await Issue.findByIdAndUpdate(id, updateData, { new: true });
    if (!issue) {
       res.status(404).json({ error: 'Issue not found' });
       return;
    }

    // Try to find the user and send email if reporterId exists or reporterEmail is provided
    let emailToSend = issue.reporterEmail;
    
    if (!emailToSend && issue.reporterId) {
      const user = await User.findOne({ 
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(issue.reporterId) ? issue.reporterId : null },
          { userId: issue.reporterId }
        ]
      });
      if (user && user.email) {
        emailToSend = user.email;
      }
    }

    if (emailToSend) {
      // Non-blocking email sending
      sendStatusEmail(emailToSend, issue.title, status);
    }

    const io = req.app.get('io');
    if (io) {
      if (status === 'Resolved') {
        io.emit('issue_resolved', issue);
      } else {
        io.emit('issue_updated', issue);
      }
    }

    res.json(issue);
  } catch (error) {
    console.error('Error updating issue status', error);
    res.status(500).json({ error: 'Failed to update status.' });
  }
};

export const getCategoryStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
       res.status(503).json({ error: 'Database not connected' });
       return;
    }

    const stats = await Issue.aggregate([
      {
        $group: {
          _id: "$mainCategory",
          totalComplaints: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          totalComplaints: 1
        }
      },
      {
        $sort: { totalComplaints: -1 }
      }
    ]);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching category stats', error);
    res.status(500).json({ error: 'Failed to fetch category stats.' });
  }
};

export const getPredictiveInsights = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
       res.status(503).json({ error: 'Database not connected' });
       return;
    }

    let isApiKeyConfigured = !!process.env.GEMINI_API_KEY;

    const HOTSPOT_THRESHOLD = 3;

    const aggregatedData = await Issue.aggregate([
      {
        $group: {
          _id: "$locationAddress",
          totalIssues: { $sum: 1 },
          categories: { $push: "$mainCategory" },
          subCategories: { $push: "$subCategory" }
        }
      },
      {
        $match: {
          totalIssues: { $gte: HOTSPOT_THRESHOLD },
          _id: { $nin: [null, ""] }
        }
      },
      {
        $sort: { totalIssues: -1 }
      },
      {
        $project: {
          _id: 0,
          area: "$_id",
          totalIssues: 1,
          categories: 1,
          subCategories: 1
        }
      }
    ]);

    if (!aggregatedData || aggregatedData.length === 0) {
      res.status(200).json({ 
        insights: [], 
        message: "Not enough data to detect hotspots yet",
        apiLimitExceeded: false 
      });
      return;
    }

    try {
      if (!isApiKeyConfigured) {
        throw new Error('GEMINI_API_KEY is not configured');
      }

      const prompt = `You are a Smart City Data Analyst. I am providing you with 'Hotspot' data where multiple civic issues are concentrated in specific areas. Ignore isolated incidents. Based on these high-volume areas, generate 3-4 highly realistic predictive insights. For example: 'Because Sector 12 has 8 continuous waterlogging complaints, there is a high risk of road cave-ins and vector-borne diseases next month.' Return the response as a structured JSON array.

Data: ${JSON.stringify(aggregatedData)}
      `;

      const ai = getGenAI();

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                trendingIssue: {
                  type: Type.STRING,
                  description: "e.g., Waterlogging at Sector 12, Main Road"
                },
                complaintCount: {
                  type: Type.NUMBER
                },
                predictedRisk: {
                  type: Type.STRING,
                  description: "e.g., Road cave-in likely within 48 hrs"
                },
                recommendedAction: {
                  type: Type.STRING,
                  description: "e.g., Dispatch emergency pumping trucks to Sector 12, Main Road immediately"
                }
              },
              required: ['trendingIssue', 'complaintCount', 'predictedRisk', 'recommendedAction']
            }
          }
        }
      });

      const jsonStr = response.text?.trim() || "[]";
      let insights = [];
      const cleanJsonStr = jsonStr.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
      insights = JSON.parse(cleanJsonStr);
      
      res.json({ insights, apiLimitExceeded: false });
      return;
    } catch (apiError: any) {
      console.warn('Gemini API call failed, falling back to mock data:', apiError);
      const isLimitExceeded = apiError?.message?.includes('429') || apiError?.status === 429 || apiError?.message?.toLowerCase().includes('quota') || apiError?.message?.toLowerCase().includes('resource has been exhausted');

      const mockPredictiveData = [
        { "trendingIssue": "Waterlogging at Sector 12, Main Road", "complaintCount": 45, "predictedRisk": "Road cave-in likely within 48 hrs, leading to massive traffic disruption and accidents.", "recommendedAction": "Dispatch emergency pumping trucks to Sector 12 immediately and barricade weak road sections." },
        { "trendingIssue": "Potholes at Main Street, Block A", "complaintCount": 32, "predictedRisk": "High probability of two-wheeler accidents, especially during evening peak hours.", "recommendedAction": "Deploy rapid road repair crews to fill critical potholes temporarily before full resurfacing." },
        { "trendingIssue": "Overflowing Bins at Market Area", "complaintCount": 28, "predictedRisk": "Spread of disease vectors (mosquitoes/rats) and foul odor affecting local businesses.", "recommendedAction": "Schedule an immediate off-cycle garbage collection run and sanitize the area." }
      ];
      res.status(200).json({
        insights: mockPredictiveData,
        apiLimitExceeded: isLimitExceeded
      });
      return;
    }
  } catch (error: any) {
    console.error('Error in getPredictiveInsights:', error);
    res.status(500).json({ error: error.message || 'Failed to generate predictive insights' });
  }
};
