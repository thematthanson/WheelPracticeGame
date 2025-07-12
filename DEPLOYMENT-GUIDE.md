# 🚀 Vercel Deployment Guide

Follow these steps to deploy your Wheel of Fortune training game to Vercel:

## Prerequisites
- Node.js 18+ installed
- A Vercel account (free at [vercel.com](https://vercel.com))
- Git repository (optional but recommended)

## Step-by-Step Deployment

### Option 1: Direct Deployment (Easiest)
1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Test Locally** (optional but recommended):
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` to test the game

4. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   - Follow the prompts
   - Choose your deployment settings
   - Your game will be live in minutes!

### Option 2: GitHub Integration (Recommended for updates)
1. **Create a Git repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: JensWheelPractice - Wheel of Fortune training game"
   ```

2. **Push to GitHub**:
   - Create a new repository on GitHub
   - Push your code:
   ```bash
   git remote add origin https://github.com/yourusername/jenswheelpractice.git
   git push -u origin main
   ```

3. **Deploy via Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect Next.js and deploy

## 🎯 What You Get

After deployment, you'll have:
- ✅ A live, public URL for your game
- ✅ Automatic HTTPS
- ✅ Global CDN for fast loading
- ✅ Automatic deployments on code changes (if using Git)
- ✅ Mobile-optimized performance

## 🔧 Custom Domain (Optional)

To use a custom domain:
1. Go to your Vercel dashboard
2. Select your project
3. Click "Settings" → "Domains"
4. Add your custom domain

## 📱 Share with Your Friend

Once deployed, share the URL with your friend so they can:
- Practice on their phone/tablet
- Play multiple rounds with different puzzles
- Get familiar with the game mechanics
- Build confidence before the real show!

## 🆘 Troubleshooting

**Build fails?**
- Make sure Node.js 18+ is installed
- Run `npm install` to ensure all dependencies are present
- Check that all files are in the correct directories

**Game doesn't work?**
- Check browser console for errors
- Ensure JavaScript is enabled
- Try a different browser

**Need help?**
- Check the Vercel documentation
- Join the Vercel Discord community
- Review the error logs in your Vercel dashboard

---

**Your game is now ready for the world! 🎉**

Good luck to your friend on Wheel of Fortune! 🍀 