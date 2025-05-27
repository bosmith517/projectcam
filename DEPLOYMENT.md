# ProjectCam Deployment Guide

This guide will help you deploy ProjectCam to various hosting platforms with HTTPS support for camera functionality.

## 🚨 Important: Camera Access Requirements

Camera access requires **HTTPS** for security reasons. Local development (http://localhost) won't work for camera features on mobile devices. You need to deploy to a server with SSL/TLS certificates.

## 🚀 Quick Deployment Options

### Option 1: Vercel (Recommended - Easiest)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy from project root:**
   ```bash
   cd projectcam
   vercel
   ```

3. **Follow the prompts:**
   - Link to existing project? No
   - Project name: projectcam
   - Directory: ./
   - Override settings? No

4. **Set environment variables in Vercel dashboard:**
   - `MONGODB_URI` (if using external MongoDB)
   - `JWT_SECRET=your-secret-key`
   - `NODE_ENV=production`

### Option 2: Netlify + Heroku

#### Deploy Backend to Heroku:

1. **Create Heroku app:**
   ```bash
   cd server
   heroku create projectcam-api
   ```

2. **Set environment variables:**
   ```bash
   heroku config:set JWT_SECRET=your-secret-key
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your-mongodb-connection-string
   ```

3. **Deploy:**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

#### Deploy Frontend to Netlify:

1. **Build the client:**
   ```bash
   cd ../client
   npm run build
   ```

2. **Deploy to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `build` folder
   - Or connect your GitHub repository

3. **Update API URL:**
   - Update `client/.env.production` with your Heroku backend URL

### Option 3: Railway (Modern Alternative)

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and deploy:**
   ```bash
   cd projectcam
   railway login
   railway init
   railway up
   ```

### Option 4: DigitalOcean App Platform

1. **Create account at DigitalOcean**
2. **Go to App Platform**
3. **Connect your GitHub repository**
4. **Configure build settings:**
   - Backend: Node.js, `server` directory
   - Frontend: Static Site, `client` directory, build command: `npm run build`

## 🔧 Environment Variables

### Backend (.env):
```
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/projectcam
PORT=5000
```

### Frontend (.env.production):
```
REACT_APP_API_URL=https://your-backend-url.com
GENERATE_SOURCEMAP=false
```

## 📱 Testing Camera on Mobile

Once deployed with HTTPS:

1. **Visit your deployed URL on iPhone/Android**
2. **Navigate to `/gps-photo`**
3. **Grant camera permissions when prompted**
4. **Test unlimited photo capture**

## 🛠️ Build Commands

### Production Build:
```bash
# Backend
cd server
npm install --production

# Frontend
cd client
npm run build
```

### Local HTTPS Testing:
```bash
# Install mkcert for local HTTPS
npm install -g mkcert
mkcert -install
mkcert localhost

# Run with HTTPS
HTTPS=true npm start
```

## 🔒 Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files
   - Use strong JWT secrets
   - Secure MongoDB connection strings

2. **CORS Configuration:**
   - Update CORS origins in `server/index.js`
   - Add your production domain

3. **File Upload Security:**
   - Configure file size limits
   - Validate file types
   - Use cloud storage (AWS S3, Cloudinary)

## 📊 Monitoring & Analytics

### Add to your deployed app:

1. **Error Tracking:**
   ```bash
   npm install @sentry/react @sentry/node
   ```

2. **Analytics:**
   ```bash
   npm install react-ga4
   ```

3. **Performance Monitoring:**
   ```bash
   npm install web-vitals
   ```

## 🚀 Quick Start Commands

### Deploy to Vercel (Fastest):
```bash
cd projectcam
npx vercel --prod
```

### Deploy to Netlify:
```bash
cd client
npm run build
npx netlify deploy --prod --dir=build
```

### Deploy Backend to Railway:
```bash
cd server
npx @railway/cli deploy
```

## 📱 Mobile PWA Setup

To make your app installable on mobile:

1. **Update `client/public/manifest.json`**
2. **Add service worker for offline functionality**
3. **Configure app icons and splash screens**

## 🎯 Post-Deployment Checklist

- [ ] HTTPS working correctly
- [ ] Camera access granted on mobile
- [ ] GPS location services working
- [ ] Photo upload functionality
- [ ] User authentication
- [ ] Database connections
- [ ] Environment variables set
- [ ] CORS configured for production domain
- [ ] Error monitoring setup
- [ ] Performance optimization

## 🆘 Troubleshooting

### Camera Not Working:
- Ensure HTTPS is enabled
- Check browser permissions
- Test on different devices
- Verify getUserMedia API support

### API Connection Issues:
- Check CORS configuration
- Verify API URL in frontend
- Test API endpoints directly
- Check network requests in browser dev tools

### Build Failures:
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify all dependencies are installed
- Review build logs for specific errors

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Review deployment logs
3. Test API endpoints with Postman
4. Verify environment variables
5. Check HTTPS certificate validity

---

**Ready to deploy? Choose your preferred option above and get your camera-enabled ProjectCam app live in minutes!** 🚀📱
