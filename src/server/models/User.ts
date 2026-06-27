import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  userId?: string; // Kept for backwards compatibility
  name: string;
  email?: string;
  password?: string;
  points: number;
  badge: string;
  role: 'user' | 'admin';
  resetPasswordOTP?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    userId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    password: { type: String },
    points: { type: Number, default: 0 },
    badge: { type: String, default: 'Scout' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    resetPasswordOTP: { type: String },
    resetPasswordExpires: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
