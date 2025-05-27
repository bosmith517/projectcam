# 🔧 Vercel Environment Variables - Step by Step

## 📍 **Current Location:**
You're in the Vercel dashboard viewing deployment details.

## 🎯 **How to Add Environment Variables:**

### **Method 1: Direct URL**
Go directly to: `https://vercel.com/bosmith517s-projects/projectcam/settings/environment-variables`

### **Method 2: Navigate in Dashboard**
1. **Click on "projectcam"** in the breadcrumb at the top
2. **Look for "Settings" tab** in the main navigation
3. **Click "Environment Variables"** in the left sidebar

### **Method 3: From Project Overview**
1. **Go to**: https://vercel.com/bosmith517s-projects/projectcam
2. **Click "Settings"** tab
3. **Click "Environment Variables"** in sidebar

## ⚡ **Quick Environment Variables to Add:**

### **Essential Variables (Add These 3):**

**Variable 1:**
- **Name**: `NODE_ENV`
- **Value**: `production`
- **Environment**: Production

**Variable 2:**
- **Name**: `JWT_SECRET`
- **Value**: `projectcam-secret-key-123`
- **Environment**: Production

**Variable 3:**
- **Name**: `CLIENT_URL`
- **Value**: `https://projectcam-2e5z491xu-bosmith517s-projects.vercel.app`
- **Environment**: Production

## 🗄️ **Database Setup (Choose One):**

### **Option A: Quick Test (No Database)**
Add this variable to test without database:
- **Name**: `MONGODB_URI`
- **Value**: `mongodb://localhost:27017/projectcam`
- **Environment**: Production

### **Option B: MongoDB Atlas (Recommended)**
1. **Go to**: https://www.mongodb.com/atlas
2. **Create free account**
3. **Create cluster** (free tier)
4. **Get connection string**
5. **Add variable**:
   - **Name**: `MONGODB_URI`
   - **Value**: `mongodb+srv://username:password@cluster.mongodb.net/projectcam`
   - **Environment**: Production

## 🚀 **After Adding Variables:**

### **Redeploy Backend:**
```bash
cd server
npx vercel --prod
```

### **Test Registration:**
1. **Visit**: `https://projectcam-2e5z491xu-bosmith517s-projects.vercel.app`
2. **Click Register**
3. **Fill out form**
4. **Submit**

## 🎯 **Expected Result:**
- ✅ Registration should work
- ✅ Login should work
- ✅ Camera access already works (HTTPS)

## 📞 **If You Still Can't Find Settings:**

### **Alternative: Use CLI**
```bash
cd server
npx vercel env add NODE_ENV
# When prompted, enter: production

npx vercel env add JWT_SECRET
# When prompted, enter: projectcam-secret-key-123

npx vercel env add CLIENT_URL
# When prompted, enter: https://projectcam-2e5z491xu-bosmith517s-projects.vercel.app
```

## 🆘 **Troubleshooting:**

### **Can't Find Settings Tab?**
- Try refreshing the page
- Make sure you're logged in as bosmith517
- Try the direct URL method above

### **Variables Not Working?**
- Make sure to redeploy after adding variables
- Check variable names are exact (case-sensitive)
- Verify you're adding to the correct project

Your registration will work once these environment variables are added! 🎉
