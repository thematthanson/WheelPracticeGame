# Netlify Deployment Guide

## 🚀 Deploy to Netlify

This guide will help you deploy the Wheel of Fortune multiplayer game to Netlify.

## ✅ Benefits of Netlify Deployment

1. **No Port Conflicts**: Eliminates "EADDRINUSE" errors
2. **Stable Environment**: Consistent server setup
3. **Better Firebase Integration**: Often works better with deployed apps
4. **Real-world Testing**: Production-like conditions

## 🔧 Setup Instructions

### 1. Install Netlify CLI (Optional)
```bash
npm install -g netlify-cli
```

### 2. Build the Project
```bash
npm run build
```

### 3. Deploy to Netlify

#### Option A: Using Netlify CLI
```bash
# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=.next
```

#### Option B: Using Netlify Dashboard
1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Connect your GitHub repository
4. Set build command: `npm run build`
5. Set publish directory: `.next`
6. Deploy!

## 🔧 Important Notes

### Firebase Configuration
- Make sure your Firebase project is set up for production
- Update Firebase security rules if needed
- The app will use Firebase for all real-time functionality

### WebSocket Server
- The local WebSocket server (`server.js`) is not needed on Netlify
- All real-time updates go through Firebase
- Multiplayer functionality will work entirely through Firebase

## 🎮 Testing the Deployment

1. **Access your deployed site** (e.g., `https://your-app.netlify.app`)
2. **Test multiplayer functionality**:
   - Open two browser windows
   - Navigate to multiplayer game
   - Use same game code
   - Verify real-time updates work

## 🔧 Environment Variables

If you need to set environment variables in Netlify:
1. Go to Site settings > Environment variables
2. Add any Firebase config variables if needed

## 🐛 Troubleshooting

### Common Issues:
1. **Build fails**: Check that all dependencies are in `package.json`
2. **Firebase not working**: Verify Firebase config is correct
3. **Real-time not working**: Check Firebase security rules

### Local Testing:
```bash
# Test the build locally
npm run build
npm run start
```

## 📝 Deployment Checklist

- [ ] Firebase project configured
- [ ] Build succeeds locally (`npm run build`)
- [ ] All dependencies in `package.json`
- [ ] Netlify configuration updated
- [ ] Environment variables set (if needed)
- [ ] Test multiplayer functionality

## 🎯 Expected Results

After deployment, you should have:
- ✅ Stable multiplayer game without port conflicts
- ✅ Real-time updates through Firebase
- ✅ No more "EADDRINUSE" errors
- ✅ Consistent environment for testing 