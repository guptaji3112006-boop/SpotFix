import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/server/models/User.js';
import Issue from './src/server/models/Issue.js';

// Load environment variables from .env
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is not defined in the .env file.");
  process.exit(1);
}

const resetDatabase = async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB successfully.");

    // Delete all users (this also clears embedded leaderboard points if any)
    console.log("🗑️  Wiping User data (test accounts, logins, emails, passwords)...");
    const userDeleteResult = await User.deleteMany({});
    console.log(`✅ Deleted ${userDeleteResult.deletedCount} Users.`);

    // Delete all issues/complaints
    console.log("🗑️  Wiping Issue data (test complaints)...");
    const issueDeleteResult = await Issue.deleteMany({});
    console.log(`✅ Deleted ${issueDeleteResult.deletedCount} Issues.`);

    console.log("🎉 Database successfully reset for Demo! Fresh start ready.");
  } catch (error) {
    console.error("❌ An error occurred while resetting the database:", error);
  } finally {
    // Forcefully close connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed.");
    process.exit(0);
  }
};

resetDatabase();
