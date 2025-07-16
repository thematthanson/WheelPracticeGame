# Netlify Deployment Guide

This guide explains how to deploy the Wheel of Fortune multiplayer game to Netlify while maintaining WebSocket functionality.

## 🚫 **Important: WebSocket Limitation**

**Netlify does not support WebSocket servers.** You'll need to deploy the backend separately.

## 📋 **Deployment Options**

### **Option 1: Railway Backend + Netlify Frontend (Recommended)**

#### **Step 1: Deploy Backend to Railway**

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy Backend**
   ```bash
   # Clone your repo
   git clone https://github.com/yourusername/wheel-of-fortune.git
   cd wheel-of-fortune
   
   # Connect to Railway
   railway login
   railway init
   railway up
   ```

3. **Get Backend URL**
   - Railway will provide a URL like: `https://your-app.railway.app`
   - Note this URL for the frontend

#### **Step 2: Deploy Frontend to Netlify**

1. **Set Environment Variable**
   - In Netlify dashboard, go to Site Settings → Environment Variables
   - Add: `NEXT_PUBLIC_WS_URL` = `https://your-app.railway.app`

2. **Deploy to Netlify**
   ```bash
   # Build the project
   npm run build
   
   # Deploy to Netlify (via Git or drag-and-drop)
   ```

### **Option 2: Render Backend + Netlify Frontend**

#### **Step 1: Deploy Backend to Render**

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**
   - Connect your GitHub repo
   - Set build command: `npm install`
   - Set start command: `node server.js`
   - Set environment: `Node`

3. **Get Backend URL**
   - Render will provide: `https://your-app.onrender.com`

#### **Step 2: Deploy Frontend to Netlify**

Same as Railway option, but use Render URL.

### **Option 3: Heroku Backend + Netlify Frontend**

#### **Step 1: Deploy Backend to Heroku**

1. **Create Heroku Account**
   - Go to [heroku.com](https://heroku.com)
   - Sign up

2. **Deploy Backend**
   ```bash
   # Install Heroku CLI
   npm install -g heroku
   
   # Login and deploy
   heroku login
   heroku create your-app-name
   git push heroku main
   ```

3. **Get Backend URL**
   - Heroku will provide: `https://your-app-name.herokuapp.com`

#### **Step 2: Deploy Frontend to Netlify**

Same as other options.

## 🔧 **Configuration Files**

### **For Railway/Render/Heroku Backend**

Create `Procfile` in root:
```
web: node server.js
```

### **For Netlify Frontend**

Create `netlify.toml` in root:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 🌍 **Environment Variables**

### **Backend (Railway/Render/Heroku)**
```env
PORT=3001
NODE_ENV=production
```

### **Frontend (Netlify)**
```env
NEXT_PUBLIC_WS_URL=https://your-backend-url.com
```

## 📱 **Testing Deployment**

1. **Test Backend**
   ```bash
   curl https://your-backend-url.com/api/games
   # Should return: []
   ```

2. **Test Frontend**
   - Open your Netlify URL
   - Try creating/joining a multiplayer game
   - Check browser console for WebSocket connection

## 🚨 **Common Issues**

### **CORS Errors**
Add to `server.js`:
```javascript
app.use(cors({
  origin: ['https://your-netlify-app.netlify.app', 'http://localhost:3000'],
  credentials: true
}));
```

### **WebSocket Connection Failed**
- Check that `NEXT_PUBLIC_WS_URL` is set correctly
- Ensure backend is running and accessible
- Check browser console for connection errors

### **Build Errors**
- Ensure all dependencies are in `package.json`
- Check that `next.config.js` is configured correctly

## 💰 **Cost Considerations**

### **Free Tiers Available:**
- **Railway**: $5/month after free tier
- **Render**: Free tier available
- **Heroku**: $7/month (no free tier)
- **Netlify**: Free tier available

### **Recommended for Production:**
- **Railway** or **Render** for backend
- **Netlify** for frontend
- Total cost: ~$5-10/month

## 🔄 **Alternative: No WebSocket**

If you want to deploy to Netlify without external backend:

1. **Use Firebase Realtime Database**
2. **Use Supabase Realtime**
3. **Use Pusher** (WebSocket service)
4. **Use Ably** (WebSocket service)

These services can be used directly from Netlify without external backend deployment.

## 📞 **Support**

If you encounter issues:
1. Check browser console for errors
2. Verify environment variables are set
3. Test backend URL directly
4. Check Netlify function logs 