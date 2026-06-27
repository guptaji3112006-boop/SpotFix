import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Issue from '../models/Issue';

function getBadgeForPoints(points: number): string {
  if (points >= 151) return 'Community Hero';
  if (points >= 51) return 'Active Citizen';
  return 'Scout';
}

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ error: 'Database unavailable' });
      return;
    }
    
    // Assuming protect middleware sets req.user
    const userObj = (req as any).user;
    if (!userObj) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userObj._id).select('-password -resetPasswordOTP -resetPasswordExpires');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Match issues by either user._id or user.userId to be safe with older records
    const userIssues = await Issue.find({
      $or: [
        { reporterId: user.userId },
        { reporterId: user._id.toString() },
        { reporterIds: user.userId },
        { reporterIds: user._id.toString() },
        { reporterEmail: user.email }
      ]
    }).sort({ createdAt: -1 });

    const formattedIssues = userIssues.map((i: any) => ({
      id: i._id,
      title: i.title,
      description: i.description,
      category: i.mainCategory,
      mainCategory: i.mainCategory,
      subCategory: i.subCategory,
      severity: i.severity,
      urgency: i.severity,
      latitude: i.location?.coordinates[1] || null,
      longitude: i.location?.coordinates[0] || null,
      imageUrl: i.evidenceImages?.[0] || '',
      status: i.status || 'Reported',
      createdAt: i.createdAt,
      reporterName: i.reporterName || 'Anonymous Citizen',
      locationAddress: i.locationAddress,
      areaName: i.areaName,
      isSimulatedAI: false,
      reportCount: i.reportCount,
      evidenceImages: i.evidenceImages,
      upvotes: i.upvotes || 0,
      upvotedBy: i.upvotedBy || [],
      reporterId: i.reporterId,
      reporterIds: i.reporterIds || [],
      resolvedAt: i.resolvedAt
    }));

    res.json({
      profile: user,
      issues: formattedIssues
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

export const getOrCreateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(500).json({ error: 'Database unavailable' });
      return;
    }
    const { userId, name } = req.body;
    if (!userId || !name) {
      res.status(400).json({ error: 'userId and name are required' });
      return;
    }
    
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({ userId, name, points: 0, badge: 'Scout' });
      await user.save();
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    res.status(500).json({ error: 'Failed to fetch/create user' });
  }
};

export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json([]);
      return;
    }
    const users = await User.find().sort({ points: -1 }).limit(10);
    res.json(users);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};

export const awardPoints = async (userIdOrId: string, pointsToAdd: number) => {
  if (mongoose.connection.readyState !== 1 || !userIdOrId) return;
  try {
    const user = await User.findOne({ 
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(userIdOrId) ? userIdOrId : null },
        { userId: userIdOrId }
      ]
    });
    if (user) {
      user.points += pointsToAdd;
      user.badge = getBadgeForPoints(user.points);
      await user.save();
    }
  } catch (error) {
    console.error('Error awarding points:', error);
  }
};
