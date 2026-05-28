# 📦 Samsung Stock Tracker

A mobile-first daily inventory tracker for Samsung products. Built with React and optimized for iPhone/Android use. Data saves automatically to your browser so counts persist every day.

---

## ✨ Features

- 6 product categories: Fridge, TV, Washing Machine, Microwave, Vacuum, A/C
- Tap category headers to expand/collapse
- Large +/− buttons optimized for thumb use on mobile
- Quantities never go below 0
- Auto-saves to localStorage on every change
- Copy full inventory summary to clipboard in `MODEL = QUANTITY` format

---

## 🖥️ Requirements

Make sure you have these installed before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18 or higher | https://nodejs.org |
| npm | comes with Node.js | — |
| Git | any recent version | https://git-scm.com |

To check if already installed, run in terminal:
```bash
node -v
npm -v
git --version
```

---

## 🚀 Step 1 — Install & Run Locally

### 1. Extract the ZIP file
Unzip `stock-tracker.zip` to a folder on your computer.

### 2. Open terminal in that folder
- **Windows**: Right-click the folder → "Open in Terminal"
- **Mac**: Right-click the folder → "New Terminal at Folder"

### 3. Install dependencies
```bash
npm install
```
This takes 2–3 minutes. It downloads React and all required packages.

### 4. Start the app
```bash
npm start
```
Your browser opens automatically at `http://localhost:3000`

> ✅ If you see the Samsung Stock Tracker app, the local setup is complete!

---

## 📤 Step 2 — Push to GitHub

You need a GitHub account to deploy to Vercel.

### 1. Create a GitHub account
Go to https://github.com and sign up (free).

### 2. Create a new repository
- Click the **+** icon → **New repository**
- Name it: `stock-tracker`
- Keep it **Public**
- Do NOT tick "Add README" (we already have one)
- Click **Create repository**

### 3. Push your code
In your terminal (still in the `stock-tracker` folder), run these one by one:

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/stock-tracker.git
git push -u origin main
```

> ⚠️ Replace `YOUR_USERNAME` with your actual GitHub username.

If GitHub asks for login, enter your GitHub username and password (or a Personal Access Token if you have 2FA enabled).

### 4. Verify
Visit `https://github.com/YOUR_USERNAME/stock-tracker` — you should see your files listed.

---

## ☁️ Step 3 — Deploy to Vercel (Free Hosting)

### 1. Create a Vercel account
Go to https://vercel.com and click **Sign Up → Continue with GitHub**.
Authorize Vercel to access your GitHub account.

### 2. Import your project
- On the Vercel dashboard, click **Add New → Project**
- Find `stock-tracker` in the list and click **Import**

### 3. Configure (no changes needed)
Vercel auto-detects it as a React app. Leave all settings as default.

### 4. Deploy
Click the **Deploy** button. Wait about 30 seconds.

### 5. Get your live URL
After deployment, Vercel shows a URL like:
```
https://stock-tracker-abc123.vercel.app
```

> ✅ Your app is now live on the internet!

---

## 📱 Step 4 — Add to iPhone Home Screen

1. Open **Safari** on your iPhone (must be Safari, not Chrome)
2. Go to your Vercel URL
3. Tap the **Share button** (square with arrow pointing up, at the bottom)
4. Scroll down and tap **"Add to Home Screen"**
5. Name it **Stock Tracker** → tap **Add**

The app now appears on your iPhone home screen like a native app. Tap it anytime to open — no browser bar, full screen!

---

## 🔄 Step 5 — Updating the App Later

If you change the code and want to redeploy:

```bash
git add .
git commit -m "update stock data"
git push
```

Vercel automatically detects the push and redeploys within 30 seconds. Your live URL stays the same.

---

## 📁 Project Structure

```
stock-tracker/
├── public/
│   └── index.html          # HTML shell with mobile meta tags
├── src/
│   ├── App.js              # Main app — all logic and UI lives here
│   └── index.js            # React entry point
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

---

## 🛠️ Troubleshooting

| Problem | Fix |
|--------|-----|
| `npm: command not found` | Install Node.js from https://nodejs.org |
| `git: command not found` | Install Git from https://git-scm.com |
| `npm install` fails | Delete `node_modules` folder and run `npm install` again |
| App opens but looks blank | Check browser console (F12) for errors |
| GitHub push rejected | Make sure you're using the correct username in the remote URL |
| Vercel shows build error | Check that `npm start` works locally first |
| iPhone: clipboard not working | iOS requires HTTPS — works fine on Vercel, not on `localhost` |

---

## 💾 Data Storage

All stock data is saved in your **browser's localStorage** under the key `samsung_stock_v1`. This means:

- ✅ Data persists when you refresh the page
- ✅ Data persists when you close and reopen the browser
- ✅ Works offline after first load
- ⚠️ Data is stored per device/browser — counts on your phone won't sync to your laptop
- ⚠️ Clearing browser data/cache will reset counts to default

---

## 📋 Copy Summary Format

Tapping **Copy Summary** copies inventory in this format:

```
SAMSUNG FRIDGE
RR20C20C2GS = 4
RR20C20C2RH = 6
...

SAMSUNG TV
UA32N4010 = 2
...
```

You can paste this directly into WhatsApp, Notes, Excel, or any messaging app.

---

*Built with React 18 + Lucide Icons. Hosted free on Vercel.*
