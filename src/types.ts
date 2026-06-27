export type IssueStatus = 'Reported' | 'Verified' | 'In Progress' | 'Resolved';

export type IssueCategory = 'Pothole' | 'Garbage / Waste' | 'Water Leak' | 'Streetlight' | 'Road Hazard' | 'Other';

export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Critical' | '';

export interface IssueReport {
  id: string;
  title: string;
  description: string;
  category: string; // IssueCategory;
  mainCategory?: string;
  subCategory?: string;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  status: IssueStatus;
  urgency: UrgencyLevel;
  createdAt: string;
  reporterName: string;
  reporterEmail?: string;
  locationAddress?: string;
  isSimulatedAI?: boolean;
  reportCount?: number;
  evidenceImages?: string[];
  upvotes?: number;
  upvotedBy?: string[];
  reporterId?: string;
  reporterIds?: string[];
  resolvedAt?: string;
  isReoccurrence?: boolean;
  duplicateWarning?: string;
  apiLimitExceeded?: boolean;
}

export interface ActivityLog {
  id: string;
  issueId: string;
  action: string;
  timestamp: string;
  by: string;
}

export interface UserProfile {
  userId: string;
  name: string;
  points: number;
  badge: string;
}

