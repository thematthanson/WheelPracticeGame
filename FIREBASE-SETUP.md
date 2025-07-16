# Firebase Setup Guide for Netlify Deployment

This guide walks you through setting up Firebase Realtime Database for true cross-device multiplayer that works with Netlify.

## 🎯 **Why Firebase for Netlify?**

- ✅ **Works with Netlify** - No separate backend needed
- ✅ **Real-time updates** - Automatic synchronization
- ✅ **Free tier** - Generous limits for small games
- ✅ **Easy setup** - Google-managed infrastructure
- ✅ **Scalable** - Grows with your needs

## 📋 **Step-by-Step Setup**

### **Step 1: Create Firebase Project**

1. **Go to Firebase Console**
   - Visit [console.firebase.google.com](https://console.firebase.google.com)
   - Sign in with your Google account

2. **Create New Project**
   - Click "Create a project"
   - Enter project name: `wheel-of-fortune-multiplayer`
   - Enable Google Analytics (optional)
   - Click "Create project"

3. **Add Web App**
   - Click the web icon (</>) 
   - Register app: `wheel-of-fortune`
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"

### **Step 2: Enable Realtime Database**

1. **Navigate to Database**
   - In Firebase console, click "Realtime Database"
   - Click "Create database"

2. **Choose Location**
   - Select a region close to your users
   - Click "Next"

3. **Set Security Rules**
   - Choose "Start in test mode"
   - Click "Enable"

### **Step 3: Get Configuration**

1. **Copy Config**
   - In your Firebase project, click the gear icon ⚙️
   - Select "Project settings"
   - Scroll to "Your apps" section
   - Click the web app you created
   - Copy the config object

2. **Example Config:**
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyC...",
     authDomain: "your-project.firebaseapp.com",
     databaseURL: "https://your-project-default-rtdb.firebaseio.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```

### **Step 4: Set Environment Variables**

#### **For Local Development:**

Create `.env.local` in your project root:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

#### **For Netlify Deployment:**

1. **In Netlify Dashboard:**
   - Go to Site Settings → Environment Variables
   - Add each variable from above

2. **Or via `netlify.toml`:**
   ```toml
   [build.environment]
     NEXT_PUBLIC_FIREBASE_API_KEY = "AIzaSyC..."
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "your-project.firebaseapp.com"
     NEXT_PUBLIC_FIREBASE_DATABASE_URL = "https://your-project-default-rtdb.firebaseio.com"
     NEXT_PUBLIC_FIREBASE_PROJECT_ID = "your-project"
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "your-project.appspot.com"
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "123456789"
     NEXT_PUBLIC_FIREBASE_APP_ID = "1:123456789:web:abc123"
   ```

### **Step 5: Configure Database Rules**

In Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "games": {
      "$gameCode": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['code', 'status', 'players'])",
        "players": {
          "$playerId": {
            ".validate": "newData.hasChildren(['name', 'isHost', 'isHuman'])"
          }
        }
      }
    }
  }
}
```

### **Step 6: Test Locally**

1. **Start Development Server:**
   ```bash
   npm run dev
   ```

2. **Test Multiplayer:**
   - Open `http://localhost:3000`
   - Go to Multiplayer → Create Game
   - Enter game code and name
   - Open another browser/device
   - Join with the same game code

3. **Check Firebase Console:**
   - Go to Realtime Database
   - You should see your game data

## 🚀 **Deploy to Netlify**

### **Option 1: Git Integration (Recommended)**

1. **Connect Repository:**
   - In Netlify, click "New site from Git"
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `.next`

2. **Set Environment Variables:**
   - In Site Settings → Environment Variables
   - Add all Firebase config variables

3. **Deploy:**
   - Netlify will automatically deploy on git push

### **Option 2: Manual Upload**

1. **Build Locally:**
   ```bash
   npm run build
   ```

2. **Upload to Netlify:**
   - Drag `.next` folder to Netlify
   - Set environment variables in dashboard

## 🔧 **Database Structure**

Your Firebase database will look like this:

```
games/
  ABC123/
    code: "ABC123"
    status: "waiting"
    players/
      player1/
        name: "Player 1"
        isHost: true
        roundMoney: 0
        lastSeen: 1640995200000
      player2/
        name: "Player 2"
        isHost: false
        roundMoney: 500
        lastSeen: 1640995200000
    currentPlayer: "player1"
    usedLetters: ["A", "E", "I"]
    wheelValue: { value: 500, type: "money" }
    lastUpdated: 1640995200000
```

## 📊 **Firebase Limits (Free Tier)**

- **Database size**: 1GB
- **Simultaneous connections**: 100
- **Downloads per day**: 10GB
- **Uploads per day**: 10GB

**For a Wheel of Fortune game, this is more than enough!**

## 🛠 **Troubleshooting**

### **Common Issues:**

1. **"Permission denied"**
   - Check database rules in Firebase console
   - Ensure rules allow read/write

2. **"Firebase not initialized"**
   - Check environment variables are set
   - Verify Firebase config is correct

3. **"Database URL not found"**
   - Ensure `NEXT_PUBLIC_FIREBASE_DATABASE_URL` is set
   - Check the URL in Firebase console

4. **"Real-time updates not working"**
   - Check browser console for errors
   - Verify database rules allow read access

### **Debug Mode:**

Add to your component:
```javascript
console.log('Firebase config:', {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
});
```

## 💰 **Cost Analysis**

### **Free Tier (Spark Plan):**
- ✅ 1GB storage
- ✅ 10GB/month transfer
- ✅ 100 simultaneous connections
- ✅ Perfect for small multiplayer games

### **Paid Plans (Blaze):**
- Pay only for what you use
- Scales automatically
- Starts at ~$25/month for heavy usage

## 🎮 **Testing Multiplayer**

1. **Local Testing:**
   - Open two browser windows
   - Create game in one, join in other
   - Test real-time updates

2. **Cross-Device Testing:**
   - Deploy to Netlify
   - Test on different devices
   - Verify real-time synchronization

3. **Performance Testing:**
   - Monitor Firebase console
   - Check connection count
   - Monitor data usage

## 🔒 **Security Considerations**

1. **Database Rules:**
   - Only allow necessary read/write
   - Validate data structure
   - Consider user authentication

2. **Environment Variables:**
   - Never commit `.env` files
   - Use Netlify environment variables
   - Rotate API keys regularly

3. **Rate Limiting:**
   - Monitor Firebase usage
   - Implement client-side throttling
   - Consider server-side validation

## 📞 **Support**

If you encounter issues:
1. Check Firebase console for errors
2. Verify environment variables
3. Test database rules
4. Check browser console
5. Review Firebase documentation

The Firebase implementation provides a robust, scalable solution that works perfectly with Netlify! 🎉 