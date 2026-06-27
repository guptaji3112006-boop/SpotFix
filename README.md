# SpotFix 🏙️✨

SpotFix is a next-generation smart city civic issue reporting platform designed to bridge the gap between citizens and municipal authorities. By leveraging advanced Artificial Intelligence (AI) and real-time data, SpotFix revolutionizes how civic problems—like potholes, waterlogging, and broken streetlights—are reported, verified, and resolved.

Our core goal is to build a transparent, gamified, and highly efficient ecosystem where community members actively participate in maintaining their neighborhoods, while authorities receive verified, prioritized, and predictive insights to allocate resources effectively.

---

## 🛠️ Auto-Detected Tech Stack

SpotFix is built using a modern, scalable full-stack architecture:

### Frontend (Client-Side)
- **Framework:** React 19 with Vite for ultra-fast Hot Module Replacement (HMR) and optimized production builds.
- **Routing:** React Router v7 (`react-router-dom`) for seamless, client-side SPA navigation.
- **Styling & UI:** Tailwind CSS v4 for utility-first, responsive design. 
- **Animations:** Framer Motion (`motion`) for smooth, hardware-accelerated UI transitions and micro-interactions.
- **Maps:** Leaflet & React-Leaflet for interactive geographic mapping of civic issues.
- **Charts:** Recharts for rendering rich data visualizations and statistics.
- **Icons & Notifications:** Lucide React for consistent iconography and React Hot Toast for non-blocking, elegant push notifications.

### Backend (Server-Side)
- **Runtime & Framework:** Node.js environment powered by Express.js (`express` v4.21).
- **Real-Time Communication:** Socket.io for bi-directional, real-time updates (broadcasting new issues and status changes to connected clients instantly).
- **Authentication:** JWT (JSON Web Tokens) and bcrypt for secure user session management and password hashing.
- **Email Services:** Nodemailer for automated SMTP-based status updates and OTP verifications.

### Database & Storage
- **Database:** MongoDB, integrated via Mongoose ODM for structured, schema-based NoSQL document modeling (Users, Issues, etc.).
- **Media Storage:** Cloudinary SDK handles persistent, optimized image storage. The backend utilizes `multer` for multipart form data buffering before dispatching files to the Cloudinary cloud.

### AI & External APIs
- **Google Gemini AI:** SpotFix heavily utilizes the `@google/genai` SDK, specifically targeting the **`gemini-2.5-flash`** model. It powers two core features: automated image verification/categorization and predictive civic hotspot analysis.
- **Geocoding:** Nominatim OpenStreetMap API is utilized for reverse geocoding (converting GPS coordinates into readable addresses).

---

## 🗺️ Page-by-Page Walkthrough

The user flow is meticulously designed for friction-free engagement, organized via a robust `AppLayout` wrapper.

### 1. Landing & Authentication (`/`, `/register`, `/admin/login`)
- **Flow:** Users land on a modern, high-contrast login page (`LoginPage.tsx`). They can seamlessly navigate to sign up (`RegisterPage.tsx`) or recover passwords (`ForgotPassword.tsx`).
- **Public Impact Dashboard (`/public-impact`):** An accessible, unauthenticated view where citizens can visualize live civic metrics and resolved cases without needing an account.

### 2. Issue Dashboard & Discovery (`/dashboard`)
- **Flow:** The primary hub (`IssueDashboard.tsx`). Users can view a feed of reported issues, toggle between list and interactive Map views, and upvote existing problems to increase their priority.
- **Real-Time Sync:** Powered by Socket.io, new reports pop up instantly without requiring a page refresh.

### 3. Issue Reporting (`/report`)
- **Flow:** The core action center (`IssueReportingForm.tsx`). Users upload a photo and video, provide a title/description, and capture their GPS location. 
- **UX Detail:** During submission, the UI displays a processing state while the image is securely transmitted to the backend for AI analysis.

### 4. Gamification & History (`/leaderboard`, `/history`, `/profile`)
- **Flow:** Users can track their past submissions (`HistorySection.tsx`), update their details (`UserProfile.tsx`), and see how they rank against other community heroes (`Leaderboard.tsx`), driving continuous engagement.

### 5. Admin Dashboard (`/admin`)
- **Flow:** A protected, high-level interface (`AdminDashboard.tsx`) for municipal authorities. Admins can update ticket statuses (e.g., "In Progress", "Resolved"), view granular category statistics, and access AI-generated predictive insights to proactively deploy repair crews.

---

## 🧠 Core Features Deep-Dive

### 1. AI-Powered Image Verification (`issueController.ts` & `geminiService.ts`)
Instead of relying purely on user input, SpotFix verifies issues cryptographically using Gemini AI.
1. **Upload & Buffer:** When an issue is submitted via `multer`, the image buffer is intercepted.
2. **Base64 Translation:** The buffer is converted to a base64 string and sent to the `gemini-2.5-flash` model.
3. **Strict Categorization:** A highly specific system prompt forces the AI to return a structured JSON response. It validates the image (rejecting selfies or irrelevant photos) and strictly maps the issue to predefined categories (e.g., "Roads & Transport" -> "Potholes").
4. **Cloud Storage:** Only after passing AI verification (or explicit user override), the image buffer is streamed to Cloudinary, and the permanent secure URL is saved to MongoDB.

### 2. Predictive Hotspot Analysis (`adminController.ts`)
SpotFix doesn't just react; it predicts.
1. **MongoDB Aggregation:** The `getPredictiveInsights` controller runs a complex aggregation pipeline. It groups complaints by `locationAddress` and matches clusters where the `totalIssues` exceeds a specific threshold (e.g., >= 3).
2. **AI Synergy:** This aggregated JSON dataset of hotspots is fed directly into the `gemini-2.5-flash` model.
3. **Actionable Intelligence:** Acting as a "Smart City Data Analyst," Gemini generates highly realistic predictive risks (e.g., "Road cave-in likely within 48 hrs") and actionable recommendations, which are displayed dynamically on the Admin Dashboard.

### 3. Gamified Points Engine (`userController.ts`)
Civic duty is rewarded to foster retention.
- **Logic:** The `awardPoints` function atomically increments a user's point total in MongoDB (`+5` points for reporting a valid issue, `+2` points for verifying/upvoting another user's issue).
- **Dynamic Badging:** As points accumulate, users automatically tier up from "Scout" to "Active Citizen" to "Community Hero."

### 4. Advanced Duplicate Detection
Before saving a new report, the backend performs a `$near` geospatial query within a 50-meter radius to find existing issues matching the exact subcategory. 
- If an *active* duplicate exists, the new report is merged, incrementing the report count.
- If a *resolved* duplicate exists, it flags it as a "Re-occurrence" for administrative review.

---

## 🚀 Setup & Installation Guide

To run SpotFix locally, ensure you have Node.js (v18+) installed.

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone <your-repo-url>
cd spotfix

# Install all full-stack dependencies
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory. You **must** populate the following variables based on the exact configuration extracted from the codebase:

```env
# Gemini AI Configuration (Required for Image Verification & Predictive Insights)
GEMINI_API_KEY="your_gemini_api_key_here"

# MongoDB Connection String (Mongoose Database)
MONGO_URI="mongodb+srv://<username>:<password>@cluster0...mongodb.net/?appName=Cluster0"

# Cloudinary Storage Configuration (For permanent image hosting)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Nodemailer SMTP Configuration (For status update emails)
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"

# App URL (Optional: used for internal routing/callbacks)
APP_URL="http://localhost:3000"
```

### 3. Start the Development Server
SpotFix uses a unified startup script that boots both the Vite frontend and the Express backend concurrently.

```bash
# Start the full-stack application on port 3000
npm run dev
```

Your application will now be running at `http://localhost:3000`.

---
*Built for the future of smart cities. Powered by AI.*
