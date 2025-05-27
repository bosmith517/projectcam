# 🚀 Backend Environment Variables Setup

## ✅ **Current Status:**
- **Backend URL**: `https://projectcam-hg0nlbgwn-bosmith517s-projects.vercel.app`
- **Frontend URL**: `https://projectcam-2e5z491xu-bosmith517s-projects.vercel.app`
- **Status**: Backend deployed, needs environment variables

## 🔧 **Required Environment Variables:**

### **Step 1: Go to Vercel Dashboard**
1. Visit: https://vercel.com/bosmith517s-projects/projectcam
2. Click on your backend deployment
3. Go to **Settings** → **Environment Variables**

### **Step 2: Add These Variables:**

#### **Essential Variables (Required for Registration):**
```
NODE_ENV = production
JWT_SECRET = your-super-secret-jwt-key-change-this-in-production-123
CLIENT_URL = https://projectcam-2e5z491xu-bosmith517s-projects.vercel.app
```

#### **Database (Choose One):**

**Option A: MongoDB Atlas (Recommended - Free)**
```
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/projectcam
```

**Option B: Local MongoDB (For Testing)**
```
MONGODB_URI = mongodb://localhost:27017/projectcam
```

### **Step 3: Set Up MongoDB Atlas (Free)**

1. **Go to**: https://www.mongodb.com/atlas
2. **Create free account**
3. **Create cluster** (free tier)
4. **Create database user**
5. **Get connection string**
6. **Add to MONGODB_URI** variable

### **Step 4: Redeploy Backend**
After adding environment variables:
```bash
cd server
npx vercel --prod
```

## 📱 **Test Registration:**

### **Step 1: Visit Frontend**
URL: `https://projectcam-2e5z491xu-bosmith517s-projects.vercel.app`

### **Step 2: Try Registration**
1. Click **Register**
2. Fill out the form
3. Submit

### **Step 3: Check for Errors**
- Open browser developer tools (F12)
- Check **Console** and **Network** tabs
- Look for API call errors

## 🆘 **Quick Fix (Minimal Setup):**

If you want to test immediately, add just these 3 variables:

```
NODE_ENV = production
JWT_SECRET = projectcam-secret-key-123
MONGODB_URI = mongodb://localhost:27017/projectcam
```

**Note**: This uses local MongoDB which won't work on Vercel, but will show if the environment variables are working.

## 🎯 **Expected Result:**

Once environment variables are set:
- ✅ Registration should work
- ✅ Login should work  
- ✅ Camera access already works (HTTPS)
- ✅ Photo upload will work

## 📞 **Quick Commands:**

```bash
# Check current deployments
npx vercel ls

# Redeploy backend after env vars
cd server && npx vercel --prod

# Redeploy frontend if needed
cd client && npx vercel --prod

# Check logs
npx vercel logs
```

## 🚀 **Next Steps:**
1. **Set environment variables** in Vercel dashboard
2. **Set up MongoDB Atlas** (free tier)
3. **Redeploy backend**
4. **Test registration**
5. **Test camera functionality**

Your CompanyCam clone will be fully functional once the environment variables are configured! 🎉
