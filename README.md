# Devverse Intern Tracker 🟢

A full-stack internship session monitoring app built with React + Firebase.
Free to host. Real-time. No Zoom needed.

---

## Features
- ✅ Google login for interns (any Gmail / college email)
- ✅ Live session timer with 2/3/4 hour target
- ✅ Progress bar + alerts (15 min warning, goal reached)
- ✅ Admin dashboard with real-time live monitoring
- ✅ Session history per intern
- ✅ Overall intern stats (total hours, goal rate)
- ✅ CSV export by date
- ✅ Fully free on Firebase + Vercel

---

## Setup Guide (30 minutes)

### Step 1 — Create a Firebase Project

1. Go to https://console.firebase.google.com
2. Click **Add project** → name it `devverse-intern-tracker`
3. Disable Google Analytics (not needed) → Create project

### Step 2 — Enable Google Authentication

1. In Firebase Console → **Authentication** → Get started
2. Click **Google** → Enable → Set support email → Save

### Step 3 — Create Firestore Database

1. Firebase Console → **Firestore Database** → Create database
2. Choose **Start in test mode** (we'll add rules next)
3. Select region: `asia-south1` (Mumbai) → Enable

### Step 4 — Add Firestore Security Rules

1. Firestore → **Rules** tab
2. Copy the contents of `firestore.rules` and paste → Publish

### Step 5 — Register Your Web App

1. Firebase Console → Project Settings (gear icon) → Your apps
2. Click **</>** (Web) → Register app → name: `intern-tracker`
3. Copy the `firebaseConfig` object

### Step 6 — Update the Config File

Open `src/firebase/config.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey: "AIza...",           // ← paste your values here
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};

export const ADMIN_EMAIL = "vjysupermacy@gmail.com"; // ← your email
```

### Step 7 — Run Locally

```bash
npm install
npm start
```
Visit http://localhost:3000

### Step 8 — Deploy to Vercel (Free)

```bash
npm install -g vercel
npm run build
vercel --prod
```

Or connect your GitHub repo to https://vercel.com for automatic deploys.

---

## How It Works

### For Interns
1. Go to your deployed URL
2. Sign in with Google
3. Enter today's task + select target hours
4. Click "Start session" — timer begins
5. Click "Check out" when done
6. Session is saved automatically

### For You (Admin)
1. Sign in with **vjysupermacy@gmail.com**
2. You're redirected to Admin Dashboard automatically
3. See live active sessions with real-time timers
4. Filter by date, export CSV for any day
5. See overall stats for all interns

---

## Sharing With Interns

Send them your Vercel URL (e.g. `https://devverse-intern.vercel.app`).
They sign in with Google — done. No passwords, no setup.

---

## Tech Stack
- React 18
- Firebase Authentication (Google)
- Firestore (real-time database)
- React Router v6
- date-fns
- Hosted on Vercel (free)

---

Built for Devverse · UDYAM-TN-24-0155140
