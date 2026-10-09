# ⚡ IronTrack — Calorie & Protein Tracker for Gym Progress

A simple, lightweight, mobile-first Progressive Web App (PWA) designed specifically for **iPhone 7 Plus** running **Safari on iOS 15**. 

Built for lifters bulking, building muscle, or maintaining, with a dedicated focus on tracking daily calories, protein, carbs, and fats without bloat, subscriptions, or app store barriers.

---

## 🌟 Key Features

* **Targeted for iPhone 7 Plus (5.5" screen, 414px viewport):**
  * Tuned ergonomics for single-handed mobile navigation.
  * Inputs strictly set to 16px to prevent iOS Safari auto-zooming.
  * iOS Safe Area support (`env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`).
  * Fast touch response (`touch-action: manipulation`, no 300ms tap lag).
* **Progressive Web App (PWA):**
  * Installable directly to your iPhone Home Screen via Safari.
  * Runs fullscreen in standalone mode without Safari URL bars or browser chrome.
  * Offline-ready using Service Worker caching and local persistent storage.
* **Dashboard:**
  * Real-time metrics: Daily Calories Target vs Consumed vs Remaining.
  * Big Protein Hero Counter with remaining grams needed to hit your gym target.
  * Carbs and Fat progress bars.
  * Date navigator with previous/next day arrows and "Today" button.
  * Meal cards: Breakfast, Lunch, Dinner, and Snacks.
* **Curated Food Database (High Protein & Filipino Staples):**
  * Over 40+ verified gym staples: Chicken breast (raw & cooked), large eggs, egg whites, canned tuna in water/oil, grilled bangus (milkfish), tilapia, lean beef, tokwa (tofu), whey protein isolate, milk, etc.
  * Filipino carinderia meals: Taho, chicken adobo, pork sinigang, tinola, bistek tagalog, ginisang monggo, pandesal, saba bananas, and more.
  * Serving adjustment in grams, pieces, cups, or ml with auto-recalculated nutrition.
  * Custom food creator with manual macronutrient entry.
  * Save frequently eaten meals to **Favorites**.
  * **Duplicate Meal** feature to copy any meal across days.
* **AI Food Scanner:**
  * Uses native iOS camera capture (`capture="environment"`) or photo library.
  * Client-side canvas image resizing (max 1280px) to prevent Safari memory crashes and optimize upload speeds.
  * Secure backend AI Vision proxy (Google Gemini 2.5 Flash / 1.5 Flash or OpenAI Vision).
  * Detects multi-food plates (e.g. rice + chicken + egg) and allows selecting individual items.
  * Inline name and gram portion editing with dynamic macro recalculation before confirming.
  * Prominent medical/accuracy disclaimer banner: visual estimates cannot detect hidden oils or exact weights.
  * Full fallback to instant manual entry if offline or when no API key is configured.
* **Gym Progress & Body Weight:**
  * Daily body weight logging in kg.
  * High-DPI HTML5 Canvas weight trend chart (7D, 14D, 30D views) that never glitches on iOS 15.
  * Weekly average body weight calculation to filter out water fluctuation noise.
  * 7-day Nutrition Consistency scorecard (% of days protein and calorie targets were hit).
  * Workout notes journal with quick exercise tags (`Push Day`, `Pull Day`, `Leg Day`, `Bench`, etc.).
* **Data Reliability & Backup:**
  * Persistent IndexedDB storage with fallback to `localStorage`.
  * One-click **JSON Data Export** and **JSON Data Import** for full data backups and migrations.

---

## 📁 Project Structure

```text
Gym Tracker Project/
├── package.json               # Project manifest and dependencies (Express, Multer, Cors, Dotenv)
├── server.js                  # Express backend proxy for AI Vision & static PWA server
├── .env                       # Local environment variables (API keys)
├── .env.example               # Template for environment configuration
├── test_suite.js              # Automated test suite (math, endpoints, Safari 15 compatibility)
├── public/
│   ├── index.html             # Mobile PWA markup with iOS 15 meta tags
│   ├── manifest.json          # Web App Manifest for iOS/Android standalone install
│   ├── sw.js                  # Service Worker with offline asset caching
│   ├── css/
│   │   └── style.css          # Dark charcoal & gym emerald theme tuned for iPhone 7 Plus
│   ├── js/
│   │   ├── app.js             # Main dashboard controller and navigation
│   │   ├── db.js              # IndexedDB storage wrapper with export/import
│   │   ├── foodData.js        # 40+ Filipino and gym staple food database & math
│   │   ├── scanner.js         # Camera capture, canvas resize, and AI scan handler
│   │   ├── progress.js        # Canvas weight chart, weekly averages, and workout notes
│   │   └── pwa.js             # PWA installer, iOS guide, and offline status
│   └── icons/
│       ├── icon-192.png       # 192x192 PWA icon
│       ├── icon-512.png       # 512x512 PWA icon
│       ├── apple-touch-icon.png # 180x180 iOS Home Screen icon
│       └── favicon.png
└── README.md                  # Comprehensive setup & iOS 15 documentation
```

---

## 🚀 Running the App Locally

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (version 18 or higher recommended).

### 2. Installation
Open a terminal in the project folder and run:
```bash
npm install
```

### 3. Start the Server
```bash
npm start
```
The server will start on port `3000`:
* Local URL: `http://localhost:3000`
* Local Network URL: `http://<YOUR_COMPUTER_LOCAL_IP>:3000` (e.g., `http://192.168.1.15:3000`)

To access it on your iPhone 7 Plus while connected to the same Wi-Fi network:
1. Find your computer's local IP address (in Windows: run `ipconfig`).
2. Open Safari on your iPhone 7 Plus and navigate to: `http://<YOUR_COMPUTER_LOCAL_IP>:3000`.

---

## 🔑 Configuring the AI Food Scanner

To keep your private API keys secure, the client never talks directly to third-party AI APIs. All image recognition passes through your Express backend server.

### Option A: Google Gemini Vision (Recommended)
Google Gemini 2.5 Flash / 1.5 Flash offers fast multimodal food detection and a generous free tier.
1. Obtain an API key from Google AI Studio: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Open the `.env` file in the project root:
   ```env
   PORT=3000
   GEMINI_API_KEY=AIzaSyYourActualKeyHere
   ```
3. Restart the server (`npm start`).
4. The scanner tab will immediately show **"AI Vision Active (GEMINI)"**.

### Option B: OpenAI Vision (Optional)
If you prefer OpenAI GPT-4o-mini vision:
1. Obtain an API key from [platform.openai.com](https://platform.openai.com/api-keys)
2. In `.env`:
   ```env
   OPENAI_API_KEY=sk-proj-YourActualKeyHere
   OPENAI_VISION_MODEL=gpt-4o-mini
   ```

*Note: If no API key is provided, the app will continue to run with 100% functionality for manual food logging, database searches, progress tracking, and weight charts!*

---

## 🌐 Deploying to a Public HTTPS URL

iOS Safari requires a secure **HTTPS** connection for full PWA features and persistent Service Worker operation. You can deploy this app for free using Render, Railway, or Fly.io:

### Deploying to Render.com (Free)
1. Push this project folder to your GitHub repository.
2. Sign in to [Render.com](https://render.com/) and click **"New Web Service"**.
3. Select your GitHub repository.
4. Set the following settings:
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
5. In the **Environment Variables** section, add:
   * `GEMINI_API_KEY`: *(Your Gemini API Key)*
6. Click **Deploy**. Render will provide a free HTTPS URL (e.g. `https://my-gym-tracker.onrender.com`).

---

## 📲 Adding to iPhone 7 Plus Home Screen (iOS 15 Safari)

1. Open your HTTPS URL (or local network IP) in **Safari** on your iPhone 7 Plus.
2. Tap the **Share** button at the bottom of the Safari screen (the square icon with the arrow pointing up: `􀈂`).
3. Scroll down in the share sheet and tap **"Add to Home Screen"** (`➕`).
4. (Optional) Name the app icon (default is `IronTrack`).
5. Tap **"Add"** in the top-right corner.
6. Return to your iPhone Home Screen and tap the **IronTrack** icon. The app will launch in standalone fullscreen mode without Safari address bars!

---

## ✅ iOS 15 Safari Compatibility Checklist

| Feature | Safari on iOS 15 Status | Implementation Detail |
| :--- | :---: | :--- |
| **Viewport & Ergonomics** | Verified | 414px width, 16px input font size to prevent auto-zoom, `viewport-fit=cover`. |
| **Safe Areas** | Verified | Uses `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` for bottom navigation. |
| **Camera Capture** | Verified | HTML5 `<input type="file" capture="environment">` natively opens the iPhone 7 Plus camera. |
| **Canvas Image Resizing** | Verified | Pre-resizes photos to 1280px via HTML5 Canvas before uploading, preventing Safari RAM crashes. |
| **JavaScript Syntax** | Verified | Clean ES2020 syntax (async/await, optional chaining). No regex lookbehinds or unsupported APIs. |
| **Unique ID Generation** | Verified | Uses `crypto.randomUUID()` with fallback to timestamp strings for iOS 15.0-15.3. |
| **Local Storage** | Verified | IndexedDB v2 with fallback to `localStorage` for Safari Private Browsing mode. |
| **Weight Charting** | Verified | Pure HTML5 Canvas 2D rendering with Retina DPI scaling (`window.devicePixelRatio`). Zero external dependencies. |
| **Offline Mode** | Verified | Service Worker caches HTML, CSS, JavaScript, icons, and manifest. |
| **Data Backup** | Verified | One-click JSON export and import for seamless phone migrations. |

---

## 🧪 Running Automated Tests

To run the automated verification test suite:
```bash
node test_suite.js
```
This tests static files, curated food math, serving unit conversions, live server API endpoints, and iOS 15 Safari compatibility rules.
