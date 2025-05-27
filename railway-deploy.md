# Quick Railway Deployment for ProjectCam

Railway is perfect for full-stack deployment with instant HTTPS. Here's how to deploy in 5 minutes:

## 🚀 Deploy Backend to Railway

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login and Deploy Backend
```bash
cd projectcam/server
railway login
railway init
railway up
```

### Step 3: Set Environment Variables
```bash
# Set these in Railway dashboard or via CLI
railway variables set JWT_SECRET=your-secret-key-here
railway variables set NODE_ENV=production
railway variables set MONGODB_URI=your-mongodb-connection-string
```

### Step 4: Get Your Backend URL
Railway will give you a URL like: `https://your-app-name.railway.app`

## 🌐 Deploy Frontend to Netlify

### Step 1: Update API URL
Edit `client/.env.production`:
```env
REACT_APP_API_URL=https://your-app-name.railway.app
```

### Step 2: Build and Deploy
```bash
cd client
npm run build

# Drag and drop the 'build' folder to netlify.com
# Or use Netlify CLI:
npx netlify deploy --prod --dir=build
```

## 📱 Test Camera Access

1. Visit your Netlify URL (will have HTTPS)
2. Navigate to `/gps-photo`
3. Grant camera permissions
4. Test unlimited photo capture!

## 💰 Cost
- Railway: Free tier available, $5/month for production
- Netlify: Free for personal projects
- Total: $0-5/month

This gives you instant HTTPS for camera testing!
