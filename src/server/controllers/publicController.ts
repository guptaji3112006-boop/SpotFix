import { Request, Response } from 'express';
import Issue from '../models/Issue';
import User from '../models/User';
import mongoose from 'mongoose';
import { GoogleGenAI, Type } from "@google/genai";
import { getGenAI } from '../services/geminiService';

export const getImpactMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
       res.status(503).json({ error: 'Database connection is temporarily unavailable. Please try again later.' });
       return;
    }

    const filter = req.query.filter as string || 'month';
    const now = new Date();
    let startDate = new Date();

    if (filter === 'day') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (filter === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      // default to month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // 1. Total Reported & Total Resolved (for the selected period)
    const monthlyStats = await Issue.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalReported: { $sum: 1 },
          totalResolved: {
            $sum: { $cond: [{ $in: ['$status', ['Resolved', 'resolved']] }, 1, 0] }
          },
          totalInProgress: {
            $sum: { $cond: [{ $in: ['$status', ['In Progress', 'in_progress']] }, 1, 0] }
          }
        }
      }
    ]);

    const totalReported = monthlyStats[0]?.totalReported || 0;
    const totalResolved = monthlyStats[0]?.totalResolved || 0;
    const totalInProgress = monthlyStats[0]?.totalInProgress || 0;

    // 2. Category Stats (for the selected period)
    const categoryStats = await Issue.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$mainCategory',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          value: '$count',
          _id: 0
        }
      }
    ]);

    // 3. Trend (grouped by day or month based on filter)
    let groupFormat = "%Y-%m-%d";
    if (filter === 'year') {
      groupFormat = "%Y-%m";
    }

    const trend = await Issue.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
          reported: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $in: ['$status', ['Resolved', 'resolved']] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          reported: 1,
          resolved: 1,
          _id: 0
        }
      }
    ]);

    // 4. SubCategory Stats
    const subCategoryStats = await Issue.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { mainCategory: '$mainCategory', subCategory: '$subCategory' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          mainCategory: '$_id.mainCategory',
          subCategory: '$_id.subCategory',
          value: '$count',
          _id: 0
        }
      }
    ]);

    res.json({
      totalReported,
      totalResolved,
      totalInProgress,
      categoryStats,
      subCategoryStats,
      trend
    });
  } catch (error) {
    console.error('Error fetching public impact metrics:', error);
    res.status(500).json({ error: 'Failed to fetch impact metrics' });
  }
};

export const getDeepDiveStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
       res.status(503).json({ error: 'Database connection is temporarily unavailable. Please try again later.' });
       return;
    }
    const stats = await Issue.aggregate([
      {
        $group: {
          _id: {
            mainCategory: '$mainCategory',
            subCategory: '$subCategory'
          },
          totalReported: { $sum: 1 },
          totalResolved: {
            $sum: { $cond: [{ $in: ['$status', ['Resolved', 'resolved']] }, 1, 0] }
          }
        }
      },
      {
        $group: {
          _id: '$_id.mainCategory',
          totalReported: { $sum: '$totalReported' },
          totalResolved: { $sum: '$totalResolved' },
          subCategories: {
            $push: {
              name: '$_id.subCategory',
              totalReported: '$totalReported',
              totalResolved: '$totalResolved'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          mainCategory: '$_id',
          totalReported: 1,
          totalResolved: 1,
          subCategories: 1
        }
      }
    ]);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching deep dive stats:', error);
    res.status(500).json({ error: 'Failed to fetch deep dive stats' });
  }
};

export const getImpactStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
       res.status(503).json({ error: 'Database connection is temporarily unavailable. Please try again later.' });
       return;
    }
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Monthly Stats (Reported vs Resolved this month)
    const monthlyStats = await Issue.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          reported: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          }
        }
      }
    ]);

    // 2. Category Breakdown
    const categoryBreakdown = await Issue.aggregate([
      {
        $group: {
          _id: '$mainCategory',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          value: '$count',
          _id: 0
        }
      }
    ]);

    // 3. Top Heroes
    const topHeroes = await User.find({ role: { $ne: 'admin' } })
      .sort({ points: -1 })
      .limit(5)
      .select('name badge points');

    res.json({
      monthlyStats: monthlyStats[0] || { reported: 0, resolved: 0 },
      categoryBreakdown,
      topHeroes
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    res.status(500).json({ error: 'Failed to fetch impact stats' });
  }
};

export const getPredictiveInsightsPublic = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
       res.status(503).json({ error: 'Database not connected' });
       return;
    }

    let isApiKeyConfigured = !!process.env.GEMINI_API_KEY;

    const aggregatedData = await Issue.aggregate([
      {
        $project: {
          mainCategory: 1,
          status: 1,
          lon: { $round: [{ $arrayElemAt: ["$location.coordinates", 0] }, 3] },
          lat: { $round: [{ $arrayElemAt: ["$location.coordinates", 1] }, 3] },
          createdAt: 1
        }
      },
      {
        $group: {
          _id: {
            category: "$mainCategory",
            lon: "$lon",
            lat: "$lat"
          },
          issueCount: { $sum: 1 },
          recentIssues: { $push: "$createdAt" }
        }
      },
      {
        $limit: 100
      }
    ]);

    try {
      if (!isApiKeyConfigured) {
        throw new Error('GEMINI_API_KEY is not configured');
      }

      const prompt = `You are an expert City Planner AI analyzing community issues data to predict future problems and high risk zones. Based on the following clustered issue data from MongoDB, act as a city planner and return a structured JSON array of 3-4 actionable predictions. Ensure actionable insights are specific (e.g., "High probability of waterlogging in Area X due to recurring pipe leaks").
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
                areaName: {
                  type: Type.STRING,
                  description: "Name of the area or neighborhood"
                },
                riskCategory: {
                  type: Type.STRING,
                  description: "Category of risk, e.g., 'Waterlogging', 'Potholes', 'Garbage'"
                },
                proactiveAction: {
                  type: Type.STRING,
                  description: "Actionable prediction (e.g. 'High probability of waterlogging in Area X due to recurring pipe leaks')"
                },
                riskLevel: {
                  type: Type.STRING,
                  description: "'Critical', 'High', or 'Moderate'"
                }
              },
              required: ['areaName', 'riskCategory', 'proactiveAction', 'riskLevel']
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
        { "areaName": "Sector 5", "riskCategory": "Sanitation", "riskLevel": "High", "proactiveAction": "Garbage accumulation is trending up in Sector 5, preemptive cleaning required." },
        { "areaName": "Downtown Market", "riskCategory": "Infrastructure", "riskLevel": "Critical", "proactiveAction": "High probability of waterlogging in Area X due to recurring pipe leaks." },
        { "areaName": "Highway Junction", "riskCategory": "Traffic", "riskLevel": "Moderate", "proactiveAction": "Recurring pothole reports indicate structural degradation. Early patching needed." }
      ];
      res.status(200).json({
        insights: mockPredictiveData,
        apiLimitExceeded: isLimitExceeded
      });
      return;
    }
  } catch (error: any) {
    console.error('Error in getPredictiveInsightsPublic:', error);
    res.status(500).json({ error: error.message || 'Failed to generate predictive insights' });
  }
};

