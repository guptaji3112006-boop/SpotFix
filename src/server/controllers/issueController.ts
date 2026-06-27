import { Request, Response } from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import Issue from '../models/Issue';
import { analyzeIssueMedia } from '../services/geminiService';
import { awardPoints } from './userController';
import { uploadToCloudinary } from '../services/cloudinaryService';

export const analyzeImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image provided for analysis' });
      return;
    }

    const aiAnalysisResult = await analyzeIssueMedia(req.file.buffer, req.file.mimetype);

    res.json(aiAnalysisResult);
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
};

export const submitIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(500).json({ error: 'Database connection is temporarily unavailable. Please try again later.' });
      return;
    }

    const { title, description, latitude, longitude, locationAddress, reporterId, reporterName, reporterEmail, mainCategory: userMainCategory, subCategory: userSubCategory, urgency } = req.body;
    let finalMediaUrl = req.body.imageUrl || '';

    if (!title || !description) {
      res.status(400).json({ error: 'Title and description are required' });
      return;
    }

    if (!latitude || !longitude) {
      res.status(400).json({ error: 'Latitude and longitude are required' });
      return;
    }

    let finalMainCategory = userMainCategory;
    let finalSubCategory = userSubCategory;
    let finalSeverity = urgency;
    let apiLimitExceeded = req.body.apiLimitExceeded === 'true';
    let aiAnalysisResult: any = null;

    // --- Step 1: Handle File Upload & Optional AI Categorization ---
    if (req.file) {
      // ONLY run AI if the user didn't provide categories explicitly
      if (!userMainCategory || !userSubCategory) {
        aiAnalysisResult = await analyzeIssueMedia(req.file.buffer, req.file.mimetype);
        
        if (aiAnalysisResult.isValid === false && !aiAnalysisResult.apiLimitExceeded) {
          res.status(400).json({ error: 'Image rejected: ' + (aiAnalysisResult.rejectionReason || 'Does not appear to be a valid civic issue.') });
          return;
        }

        finalMainCategory = aiAnalysisResult.mainCategory;
        finalSubCategory = aiAnalysisResult.subCategory;
        if (!finalSeverity) finalSeverity = aiAnalysisResult.severity;
        apiLimitExceeded = aiAnalysisResult.apiLimitExceeded || false;
      }
      
      // Upload to Cloudinary for permanent storage
      const cloudinaryUrl = await uploadToCloudinary(req.file.buffer);
      if (cloudinaryUrl) {
        finalMediaUrl = cloudinaryUrl;
      } else {
        res.status(500).json({ error: 'Failed to upload image to Cloudinary.' });
        return;
      }
      
    } else if (finalMediaUrl) {
      console.warn('No file uploaded, skipping AI analysis');
    } else {
      res.status(400).json({ error: 'Media file is required' });
      return;
    }

    // Default fallbacks if both User and AI fail
    finalMainCategory = finalMainCategory || 'Other';
    finalSubCategory = finalSubCategory || 'Other';
    finalSeverity = finalSeverity || 'Medium';

    // --- Step 1.5: Reverse Geocoding ---
    let areaName = 'Unknown Location';
    try {
      const geoUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
      const geoRes = await fetch(geoUrl, {
        headers: { 'User-Agent': 'SpotFix-React-App' }
      });
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        areaName = geoData.display_name || 'Unknown Location';
      }
    } catch (geoError) {
      console.error('Reverse geocoding failed:', geoError);
    }

    // --- Step 2: Advanced Duplicate Detection & Re-occurrence Logic ---
    const RADIUS_IN_METERS = 50;
    
    // We query nearby issues matching the exact same category and subCategory
    const nearbyIssues = await Issue.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: RADIUS_IN_METERS,
        },
      },
      mainCategory: finalMainCategory,
      subCategory: finalSubCategory,
    });

    let isReoccurrence = false;
    let duplicateWarning = '';

    if (nearbyIssues.length > 0) {
      // Find if there is an active (unresolved) duplicate
      const activeDuplicate = nearbyIssues.find(issue => issue.status !== 'Resolved');

      if (activeDuplicate) {
        // Scenario B: Active Duplicate (Unresolved)
        activeDuplicate.reportCount += 1;
        if (!activeDuplicate.evidenceImages.includes(finalMediaUrl)) {
          activeDuplicate.evidenceImages.push(finalMediaUrl);
        }
        if (reporterId && !activeDuplicate.reporterIds?.includes(reporterId)) {
          if (!activeDuplicate.reporterIds) activeDuplicate.reporterIds = [];
          activeDuplicate.reporterIds.push(reporterId);
        }
        
        await activeDuplicate.save();
        if (reporterId) await awardPoints(reporterId, 5);

        res.status(200).json({
          message: 'Duplicate Detected - Added to existing report',
          issue: activeDuplicate,
          aiAnalysis: aiAnalysisResult ? { ...aiAnalysisResult, apiLimitExceeded } : { mainCategory: finalMainCategory, subCategory: finalSubCategory, severity: finalSeverity, apiLimitExceeded },
        });
        return;
      }
      
      // Scenario C: Re-occurrence (Previously Resolved)
      // All nearby issues with exact same category are resolved.
      isReoccurrence = true;
      duplicateWarning = 'Previously Resolved here';
    }

    // --- Step 3: Save New Issue (Scenario A & C) ---
    const newIssue = new Issue({
      title,
      description,
      mainCategory: finalMainCategory,
      subCategory: finalSubCategory,
      severity: finalSeverity,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      locationAddress,
      areaName,
      evidenceImages: [finalMediaUrl],
      reportCount: 1,
      status: 'Reported',
      reporterId,
      reporterName,
      reporterEmail,
      reporterIds: reporterId ? [reporterId] : [],
      isReoccurrence,
      duplicateWarning,
    });

    await newIssue.save();
    if (reporterId) await awardPoints(reporterId, 5);

    const io = req.app.get('io');
    if (io) {
      io.emit('new_issue', newIssue);
    }

    // Determine the response message
    let responseMessage = 'New issue successfully reported.';
    if (isReoccurrence) {
      responseMessage = 'Duplicate Detected - Previously Resolved (Pending Admin Verification)';
    } else if (aiAnalysisResult && !apiLimitExceeded) {
      responseMessage = 'New issue successfully reported and categorized by AI.';
    }

    res.status(201).json({
      message: responseMessage,
      issue: newIssue,
      aiAnalysis: aiAnalysisResult ? { ...aiAnalysisResult, apiLimitExceeded } : { mainCategory: finalMainCategory, subCategory: finalSubCategory, severity: finalSeverity, apiLimitExceeded },
    });
  } catch (error) {
    console.error('Error submitting issue:', error);
    res.status(500).json({ error: 'An internal server error occurred while processing the issue.' });
  }
};

export const getIssues = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json([]); // Return empty array if db is unreachable, handled by frontend fallback
      return;
    }

    const issues = await Issue.find().sort({ createdAt: -1 }).limit(50);
    // map the structure back so it matches the expected frontend type slightly
    const formattedIssues = issues.map((i: any) => ({
      id: i._id,
      title: i.title,
      description: i.description,
      category: i.mainCategory, // Provide backwards compatible field for frontend mapping temporarily if needed
      mainCategory: i.mainCategory,
      subCategory: i.subCategory,
      severity: i.severity,
      urgency: i.severity, // match frontend
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
    
    res.json(formattedIssues);
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
};

export const upvoteIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(500).json({ error: 'Database unavailable' });
      return;
    }
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }

    if (issue.upvotedBy.includes(userId)) {
      res.status(400).json({ error: 'You have already upvoted this issue' });
      return;
    }

    issue.upvotedBy.push(userId);
    issue.upvotes += 1;
    await issue.save();

    await awardPoints(userId, 2);

    res.json({ message: 'Upvoted successfully', upvotes: issue.upvotes, upvotedBy: issue.upvotedBy });
  } catch (error) {
    console.error('Error upvoting issue:', error);
    res.status(500).json({ error: 'Failed to upvote' });
  }
};

