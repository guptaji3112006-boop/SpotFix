# SpotFix - Project Description

## 1. Problem Statement Selected

**Community Hero - Hyperlocal Problem Solver**
Our cities are growing fast, but the systems to fix everyday problems—like huge potholes, broken streetlights, or flooded roads—are slow and broken. Citizens feel unheard, and city officials don't have the right data to act quickly. SpotFix solves this by bridging the gap between people and the city using smart technology.

## 2. Solution Overview (ELI5 Approach)

Imagine you are walking down the street and see a massive pothole. In the past, you'd have to figure out which government department to call, wait on hold, or fill out a confusing, boring form online. You probably wouldn't even bother!

With **SpotFix**, you just pull out your phone, snap a quick photo, and hit submit. That's it!

Our app does all the "magic" for you. It looks at the picture, understands what the problem is, grabs your exact location, and instantly sends a clean, organized report to the city officials. Plus, you earn points and badges for being a good neighbor! If someone else already reported that same pothole, we group the reports together to tell the city, "Hey, a lot of people are complaining about this, fix it fast!"

_[INSERT IMAGE HERE: High-quality screenshot of the Landing Page / Hero Section showing the app's clean, modern design]_

## 3. Key Features

Here is everything our app can do, explained simply:

- **Snap & Send (Image Upload):** Just take a picture of the problem. We safely save it in the cloud so the city can see exactly what needs fixing.
- **Smart Robot Checker (AI Verification):** Before your report goes to the city, our AI acts like a smart guard. It looks at your photo to make sure it's an actual city problem (and not just a selfie!). It automatically figures out if it's a "road issue" or "garbage issue" so it goes to the right department.
  _[INSERT IMAGE HERE: Screenshot of the Core Feature / AI Image Analysis in action showing the image being verified]_
- **City Map (User Dashboard):** You can look at a map of your neighborhood to see all the problems reported by others. You can even "upvote" an issue if it bothers you too!
- **The "Good Neighbor" Game (Leaderboard & Points):** Helping your city should be fun! You earn points every time you report a real issue or agree with someone else's report. You level up from "Scout" to "Community Hero."
  _[INSERT IMAGE HERE: Screenshot of the User Dashboard / Leaderboard showing badges and points]_
- **Live Updates (Real-Time Sync):** The moment someone reports a problem or the city fixes it, it pops up on everyone's screen instantly. No need to refresh the page.
- **Super Admin View (Admin Dashboard):** City workers get a special dashboard. It shows them the most urgent problems and even predicts where they should send repair crews next based on hidden patterns.
- **Email Alerts (Notifications):** When the city finally fixes the pothole you reported, we send you a happy email to let you know your effort made a difference.

## 4. Technologies Used

We built SpotFix using a powerful, modern, and highly scalable tech stack:

- **Frontend (What the user sees):** React 19, Vite (for fast loading), Tailwind CSS v4 (for beautiful styling), React Router v7 (for moving between pages), Leaflet (for the interactive map), Recharts (for graphs), and Framer Motion (for smooth animations).
- **Backend (The brain and server):** Node.js and Express.js to handle all the data securely.
- **Database (Where data lives):** MongoDB (using Mongoose) to save users, issues, and points.
- **Cloud Storage:** Cloudinary to safely and permanently store all the photos and videos uploaded by users.
- **Real-Time Engine:** Socket.io to make the app update instantly without refreshing.
- **Emails:** Nodemailer to send status updates.
- **Security:** JWT (JSON Web Tokens) and bcrypt to keep user accounts safe.

## 5. Google Technologies Utilized

SpotFix is heavily powered by Google's cutting-edge AI. We integrated the **Google Gemini (gemini-2.5-flash)** model directly into the core logic of our application.

Here is exactly how Gemini acts as the true brain of SpotFix:

1. **Automated Image Analysis:** When a user uploads a photo, our backend sends it to the Gemini 2.5-flash model. We wrote a strict prompt that forces Gemini to act as a city inspector. It verifies the image is legitimate, identifies the exact problem, and returns a structured JSON response categorizing the issue (e.g., "Pothole" -> "Roads").
2. **Predictive City Intelligence:** For the Admin Dashboard, we take all the clustered complaints from our database and feed them into Gemini. The AI analyzes these "hotspots" and generates predictive insights, telling city officials things like, "Three reports of minor flooding here could lead to a major road collapse if it rains tomorrow."

_[INSERT IMAGE HERE: Architecture diagram or screenshot of Gemini's JSON response in the UI showing the AI's smart categorization]_
