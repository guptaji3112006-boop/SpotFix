import mongoose, { Document, Schema } from 'mongoose';

export interface IIssue extends Document {
  title: string;
  description: string;
  mainCategory: string;
  subCategory: string;
  severity: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  locationAddress: string;
  areaName: string;
  status: string;
  reportCount: number;
  evidenceImages: string[];
  upvotes: number;
  upvotedBy: string[];
  reporterId?: string;
  reporterName?: string;
  reporterEmail?: string;
  reporterIds?: string[];
  resolvedAt?: Date;
  isReoccurrence?: boolean;
  duplicateWarning?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IssueSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    mainCategory: { type: String, required: true },
    subCategory: { type: String, required: true },
    severity: { 
      type: String, 
      required: true,
      enum: ['Low', 'Medium', 'High', 'Critical']
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    locationAddress: { type: String, default: '' },
    areaName: { type: String, default: '' },
    status: { type: String, default: 'Reported' },
    reportCount: { type: Number, default: 1 },
    evidenceImages: [{ type: String }],
    upvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: String }],
    reporterId: { type: String },
    reporterName: { type: String },
    reporterEmail: { type: String },
    reporterIds: [{ type: String }],
    resolvedAt: { type: Date },
    isReoccurrence: { type: Boolean, default: false },
    duplicateWarning: { type: String, default: '' },
    // Removed createdAt/updatedAt explicit fields as they are handled by timestamps: true
  },
  { timestamps: true }
);

// Crucial: Create the 2dsphere index for geospatial queries
IssueSchema.index({ location: '2dsphere' });
// Add a TTL index to automatically delete records 30 days after creation
IssueSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model<IIssue>('Issue', IssueSchema);
