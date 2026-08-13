# 🚀 Web App Hosting & Cloud Deployment Guide

This guide will walk you through hosting your **College Attendance Management System** online for free using **Render.com**, **Vercel**, or **Railway.app** with **MongoDB Atlas Cloud**.

---

## 🌟 Method 1: Host on Render.com (Recommended — 100% Free & Easy)

[Render.com](https://render.com) is the simplest platform for hosting Node.js + Express apps with automatic HTTPS SSL certificates.

### Step 1: Push Code to GitHub
1. Create a GitHub repository (e.g., `attendance-management-system`).
2. Open terminal in project folder and run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for production hosting"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/attendance-management-system.git
   git push -u origin main
   ```

### Step 2: Deploy on Render
1. Go to [https://dashboard.render.com](https://dashboard.render.com) and log in with GitHub.
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository `attendance-management-system`.
4. Configure the Web Service settings:
   - **Name**: `college-attendance-system`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### Step 3: Add Environment Variables on Render
Under the **Environment** tab on Render, add these Environment Variables:

| Key | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://tcet_admin:tcet_secure_password2026@cluster0.eaa6hyq.mongodb.net/attendance_system?retryWrites=true&w=majority` |
| `JWT_SECRET` | `super_secret_jwt_key_tcet_attendance_2026_production_secure_token` |
| `MASTER_RESET_PASSWORD` | `RESET@2026` |

5. Click **Deploy Web Service**!
6. Render will automatically build your app and give you a live URL like:
   `https://college-attendance-system.onrender.com`

---

## ⚡ Method 2: Host on Vercel

1. Install Vercel CLI or connect GitHub on [vercel.com](https://vercel.com).
2. Run `vercel` in your project terminal:
   ```bash
   npx vercel
   ```
3. Add Environment Variables on Vercel Dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `MASTER_RESET_PASSWORD`
4. Deploy! Your app will be live at `https://your-app-name.vercel.app`.

---

## 🚂 Method 3: Host on Railway.app

1. Go to [https://railway.app](https://railway.app) and sign in.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your repository.
4. Add Environment Variables (`MONGODB_URI`, `JWT_SECRET`).
5. Click **Generate Domain** — your live URL will be active immediately.

---

## 🔒 Production Credentials & Access Summary

- **Live URL**: `https://<your-render-subdomain>.onrender.com`
- **Superadmin Login**: `superadmin@attendance.com` / `superadmin123`
- **Master Reset Password**: `RESET@2026`
