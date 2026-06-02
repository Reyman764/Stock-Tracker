# Samsung Stock Tracker

A mobile-friendly inventory tracker for Samsung products. Tracks stock quantities and keeps a 7-day history log. All data is saved locally in the browser (no server needed). Works offline after the first visit.

---

## Table of Contents

1. [What you need before starting](#1-what-you-need-before-starting)
2. [Download and set up the project](#2-download-and-set-up-the-project)
3. [Run locally on your computer](#3-run-locally-on-your-computer)
4. [Make changes to the code](#4-make-changes-to-the-code)
5. [Push changes to GitHub](#5-push-changes-to-github)
6. [Deploy to Vercel (auto from GitHub)](#6-deploy-to-vercel-auto-from-github)
7. [Manual deploy to Vercel without Git](#7-manual-deploy-to-vercel-without-git)
8. [Project file structure](#8-project-file-structure)
9. [Common problems and fixes](#9-common-problems-and-fixes)

---

## 1. What you need before starting

Install these on your computer once. You only do this once.

### Node.js (required to run and build the app)

1. Go to **https://nodejs.org**
2. Click the button that says **LTS** (recommended version)
3. Download and install it
4. To confirm it worked, open Terminal (Mac/Linux) or Command Prompt (Windows) and type:
   ```
   node --version
   ```
   You should see something like `v18.17.0` or higher.

### Git (required to push to GitHub)

1. Go to **https://git-scm.com/downloads**
2. Download for your operating system and install
3. To confirm it worked, type:
   ```
   git --version
   ```
   You should see something like `git version 2.40.0`.

### GitHub account (required for Vercel auto-deploy)

- Sign up at **https://github.com** if you don't already have one

---

## 2. Download and set up the project

### If you are starting fresh from the ZIP file

1. Unzip `stock-tracker-updated.zip` to a folder on your computer, for example `Desktop/stock-tracker`

2. Open Terminal (Mac/Linux) or Command Prompt (Windows)

3. Navigate into the project folder:
   ```
   cd Desktop/stock-tracker/stock-tracker-final
   ```
   *(Adjust the path to wherever you unzipped it)*

4. Install the project dependencies (this downloads all required packages):
   ```
   npm install
   ```
   This will take 1–2 minutes. You will see a lot of text — that is normal. Wait until you get your cursor back.

### If you already have the project from a previous time

Just navigate to the folder and run `npm install` again if you pulled new changes.

---

## 3. Run locally on your computer

Use this when you want to test the app on your own computer before deploying.

1. Make sure you are inside the project folder:
   ```
   cd Desktop/stock-tracker/stock-tracker-final
   ```

2. Start the local development server:
   ```
   npm start
   ```

3. Your browser will automatically open at **http://localhost:3000**

4. The app is now running locally. Any changes you save to the code will instantly refresh in the browser.

5. To **stop** the server, press `Ctrl + C` in Terminal.

> **Note:** The local version does NOT need internet to run after `npm install` is done.

---

## 4. Make changes to the code

All the app logic is in one file:

```
src/StockTracker.jsx
```

Open it in any code editor (VS Code is recommended — download at https://code.visualstudio.com).

After editing, just save the file. If `npm start` is running, the browser will auto-refresh.

---

## 5. Push changes to GitHub

Do this every time you make changes and want to save them to GitHub (and auto-deploy to Vercel).

### First time only — connect the folder to GitHub

1. Create a new repository on GitHub:
   - Go to **https://github.com/new**
   - Give it a name like `samsung-stock-tracker`
   - Leave it **Public** or **Private** (your choice)
   - Do **NOT** check "Initialize with README" (the project already has one)
   - Click **Create repository**

2. Copy the repository URL shown on the next page. It looks like:
   ```
   https://github.com/YOUR-USERNAME/samsung-stock-tracker.git
   ```

3. In Terminal, inside the project folder, run these commands one by one:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/samsung-stock-tracker.git
   git push -u origin main
   ```
   Replace the URL with your actual repository URL.

4. GitHub will ask for your username and password (or a token). If it asks for a token, generate one at **https://github.com/settings/tokens** → *Generate new token (classic)* → tick **repo** → copy the token and paste it as the password.

### Every time after that — save and push changes

Whenever you change any file:

```
git add .
git commit -m "Describe what you changed here"
git push
```

Example commit messages:
- `git commit -m "Update stock quantities for June"`
- `git commit -m "Add new AC model"`
- `git commit -m "Fix history display issue"`

---

## 6. Deploy to Vercel (auto from GitHub)

Once your GitHub repository is connected to Vercel, every `git push` will automatically deploy to your live Vercel URL. You only set this up once.

### First time — connect Vercel to your GitHub repo

1. Go to **https://vercel.com** and log in (or sign up using your GitHub account)

2. Click **Add New Project**

3. Click **Continue with GitHub** and authorize Vercel to access your repositories

4. Find `samsung-stock-tracker` in the list and click **Import**

5. On the configuration page:
   - **Framework Preset:** Select **Create React App**
   - **Root Directory:** Leave as `.` (the default)
   - **Build Command:** `npm run build` *(should be pre-filled)*
   - **Output Directory:** `build` *(should be pre-filled)*

6. Click **Deploy**

7. Wait about 1–2 minutes. Vercel will build and deploy the app.

8. When it finishes, you will get a live URL like:
   ```
   https://samsung-stock-tracker.vercel.app
   ```

### After the first setup — automatic deploy on every push

From now on, every time you run `git push`, Vercel will automatically:
1. Detect the new code
2. Build the app (`npm run build`)
3. Deploy the new version to the same live URL

You do not need to do anything manually on Vercel after the first setup.

> **Tip:** You can watch the deployment progress live at https://vercel.com/dashboard

---

## 7. Manual deploy to Vercel without Git

If you want to deploy the built files directly without using Git:

1. First build the app:
   ```
   npm run build
   ```
   This creates a `build/` folder with the production files.

2. Install the Vercel CLI (one time):
   ```
   npm install -g vercel
   ```

3. Log in:
   ```
   vercel login
   ```

4. Deploy:
   ```
   vercel --prod
   ```
   Follow the prompts. When asked for the output directory, type `build`.

---

## 8. Project file structure

```
stock-tracker-final/
├── public/
│   ├── index.html          ← Main HTML shell
│   └── service-worker.js   ← Offline caching (do not delete)
├── src/
│   ├── App.js              ← Entry point (just re-exports StockTracker)
│   ├── index.js            ← React root + service worker registration
│   └── StockTracker.jsx    ← ALL the app logic and UI (main file)
├── build/                  ← Generated by `npm run build` (Vercel uses this)
├── package.json            ← Project info and scripts
└── README.md               ← This file
```

> **The only file you normally need to edit is `src/StockTracker.jsx`.**
> To add/remove models, find the `INITIAL_DATA` array near the top of that file.

---

## 9. Common problems and fixes

### `npm install` fails with errors

Try:
```
npm install --legacy-peer-deps
```

### Browser shows old version after deploy

Hard refresh the browser:
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

Or open in a private/incognito window.

### Git says "repository already exists"

If you see `fatal: remote origin already exists`, run:
```
git remote set-url origin https://github.com/YOUR-USERNAME/samsung-stock-tracker.git
```

### Vercel build fails

Make sure the **Output Directory** in Vercel project settings is set to `build` (not `dist` or anything else).

Go to: Vercel Dashboard → Your Project → Settings → General → Output Directory → set to `build` → Save.

### App works locally but not on Vercel

Check that the Vercel project's **Framework Preset** is set to **Create React App**.

Go to: Vercel Dashboard → Your Project → Settings → General → Framework Preset.

### History is empty after opening the app

History is stored in the browser's local storage. It is tied to the device and browser. If you open the app in a different browser or device, history will start fresh. This is expected behavior.

---

## Quick reference — commands cheat sheet

| What you want to do | Command |
|---|---|
| Install dependencies | `npm install` |
| Run locally | `npm start` |
| Build for production | `npm run build` |
| Save + push to GitHub | `git add . && git commit -m "message" && git push` |
| Deploy manually to Vercel | `vercel --prod` |
