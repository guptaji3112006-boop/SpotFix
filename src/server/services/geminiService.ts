import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';

// Note: Ensure process.env.GEMINI_API_KEY is available in the environment setting
let aiClient: GoogleGenAI | null = null;

export function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({ apiKey: key, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  }
  return aiClient;
}

export async function analyzeIssueMedia(imageBuffer: Buffer, mimeType: string) {
  try {
    const ai = getGenAI();

    console.log(`[Gemini Analysis] Received image buffer. Length: ${imageBuffer.length} bytes`);
    
    if (imageBuffer.length === 0) {
       console.warn('[Gemini Analysis] Buffer is empty!');
    }

    const base64Data = imageBuffer.toString('base64');

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: "Analyze the image." },
            { 
              inlineData: { 
                data: base64Data, 
                mimeType: mimeType 
              } 
            }
          ]
        }
      ],
      config: {
        temperature: 0,
        systemInstruction: "Analyze the image. If it is a clean room, selfie, or random object, set isValid to false and provide a rejectionReason. If it is a valid civic issue, identify the exact problem and map it STRICTLY to one of the Categories and Subcategories provided. Do not invent new categories.\n\nCategories & Subcategories:\n- Category: \"Roads & Transport\" -> Subcategories: [\"Potholes\", \"Open Manholes\", \"Broken Footpaths & Pavements\", \"Waterlogging\", \"Other\"]\n- Category: \"Waste Management\" -> Subcategories: [\"Overflowing Community Bins\", \"Illegal Dumping Yards\", \"Dead Animal Carcasses\", \"Other\"]\n- Category: \"Water & Sanitation\" -> Subcategories: [\"Burst Pipelines\", \"Sewage Overflow\", \"Contaminated Water Supply\", \"Unmaintained Public Toilets\", \"Other\"]\n- Category: \"Public Safety & Lighting\" -> Subcategories: [\"Broken Streetlights\", \"Dangling Live Wires\", \"Malfunctioning Traffic Signals\", \"Other\"]\n- Category: \"Environment & Greenery\" -> Subcategories: [\"Fallen or Dangerous Trees\", \"Burning of Dry Leaves/Garbage\", \"Other\"]\n- Category: \"Others\" -> Subcategories: [\"Other\"]",
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            category: { type: Type.STRING },
            subcategory: { type: Type.STRING },
            suggestedTitle: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            rejectionReason: { type: Type.STRING }
          },
          required: ['isValid', 'category', 'subcategory', 'suggestedTitle', 'tags']
        }
      }
    });

    const responseText = result.text || '{}';
    const parsed = JSON.parse(responseText);
    console.log('[Gemini Analysis] AI Response:', parsed);
    
    try {
      // Defer file deletion to the controller so it can be uploaded to Cloudinary
    } catch (e) {
      console.error('Failed to delete local file:', e);
    }

    // Adapt to controller expectations while adding new fields
    return { 
      isValid: parsed.isValid,
      mainCategory: parsed.isValid ? parsed.category : 'Invalid', 
      subCategory: parsed.isValid ? parsed.subcategory : 'Auto-detected',
      severity: 'Medium', // Defaulting since it's removed from new schema
      description: parsed.suggestedTitle || (parsed.isValid ? '' : parsed.rejectionReason),
      tags: parsed.tags || [],
      rejectionReason: parsed.rejectionReason,
      apiLimitExceeded: false
    };

  } catch (error: any) {
    console.error('Error analyzing media with Gemini:', error);
    const isLimitExceeded = error?.message?.includes('429') || error?.status === 429 || error?.message?.toLowerCase().includes('quota') || error?.message?.toLowerCase().includes('resource has been exhausted');
    
    try {
      // Defer file deletion to the controller
    } catch (e) {
      console.error('Failed to delete local file:', e);
    }

    return { 
      isValid: false,
      mainCategory: 'Other', 
      subCategory: 'Other', 
      severity: 'Low', 
      description: '', 
      rejectionReason: 'Failed to analyze image due to API error.',
      apiLimitExceeded: isLimitExceeded 
    }; // Fallback
  }
}


