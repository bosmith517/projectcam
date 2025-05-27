# ProjectCam Cloud Storage Setup Guide

This guide will help you set up cloud storage for your ProjectCam application using AWS S3 and Cloudinary.

## 🚨 Why Cloud Storage is Essential

### **📱 Mobile Photo Management:**
- **Unlimited Storage**: No server disk space limitations
- **Global CDN**: Fast photo loading worldwide
- **Automatic Backups**: Photos safely stored in the cloud
- **Scalability**: Handle thousands of photos per project
- **Image Processing**: Automatic thumbnails and optimization

## ☁️ Cloud Storage Options

### Option 1: AWS S3 (Recommended for Production)

#### **Step 1: Create AWS Account & S3 Bucket**

1. **Sign up for AWS**: [aws.amazon.com](https://aws.amazon.com)
2. **Create S3 Bucket**:
   ```bash
   # Using AWS CLI
   aws s3 mb s3://projectcam-photos-your-unique-name
   ```
   Or use the AWS Console:
   - Go to S3 service
   - Click "Create bucket"
   - Name: `projectcam-photos-your-unique-name`
   - Region: Choose closest to your users
   - Enable versioning (recommended)

#### **Step 2: Configure Bucket Permissions**

1. **Bucket Policy** (for public read access):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::projectcam-photos-your-unique-name/*"
       }
     ]
   }
   ```

2. **CORS Configuration**:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```

#### **Step 3: Create IAM User**

1. **Go to IAM service**
2. **Create new user**: `projectcam-s3-user`
3. **Attach policy**:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::projectcam-photos-your-unique-name",
           "arn:aws:s3:::projectcam-photos-your-unique-name/*"
         ]
       }
     ]
   }
   ```
4. **Save Access Keys** (you'll need these for environment variables)

### Option 2: Cloudinary (Easier Setup)

#### **Step 1: Create Cloudinary Account**

1. **Sign up**: [cloudinary.com](https://cloudinary.com)
2. **Get credentials** from dashboard:
   - Cloud Name
   - API Key
   - API Secret

#### **Step 2: Configure Upload Settings**

1. **Go to Settings > Upload**
2. **Enable unsigned uploads** (optional)
3. **Set upload presets** for automatic transformations

## 🔧 Environment Variables Setup

### **For AWS S3:**
```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=projectcam-photos-your-unique-name

# Optional: For private buckets
S3_SIGNED_URL_EXPIRY=3600
```

### **For Cloudinary:**
```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### **Complete .env file:**
```env
# Server Configuration
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secret-jwt-key

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/projectcam

# AWS S3 Storage
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=projectcam-photos-your-unique-name

# Cloudinary (Alternative)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Optional Features
ENABLE_IMAGE_PROCESSING=true
MAX_FILE_SIZE=50MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,video/mp4
```

## 📱 Photo Upload Flow

### **How it Works:**

1. **User takes photo** on mobile device
2. **Photo uploads directly** to cloud storage (S3/Cloudinary)
3. **Metadata saved** to MongoDB (URL, size, location, etc.)
4. **Thumbnails generated** automatically
5. **CDN delivers** photos globally

### **Upload Process:**

```javascript
// Frontend: Photo capture
const capturePhoto = async () => {
  const photo = await camera.takePhoto();
  
  // Upload to cloud storage
  const uploadResult = await uploadToCloud(photo);
  
  // Save metadata to database
  await savePhotoMetadata({
    url: uploadResult.url,
    thumbnailUrl: uploadResult.thumbnailUrl,
    location: currentLocation,
    projectId: selectedProject
  });
};
```

## 🚀 Deployment with Cloud Storage

### **AWS Lightsail Deployment:**

1. **Create Lightsail instance**:
   ```bash
   # Choose Ubuntu 20.04 LTS
   # Select $10/month plan (2GB RAM, 1 vCPU)
   # Enable static IP
   ```

2. **Run deployment script**:
   ```bash
   # Upload your code to the instance
   scp -r projectcam/ ubuntu@your-lightsail-ip:/home/ubuntu/

   # SSH into instance
   ssh ubuntu@your-lightsail-ip

   # Run deployment script
   chmod +x lightsail-deploy.sh
   ./lightsail-deploy.sh
   ```

3. **Set environment variables**:
   ```bash
   # Edit the ecosystem.config.js file
   nano ecosystem.config.js
   
   # Add your cloud storage credentials
   ```

4. **Configure domain and SSL**:
   ```bash
   # Point your domain to Lightsail static IP
   # Then run:
   sudo certbot --nginx -d yourdomain.com
   ```

### **CodeSandbox Deployment:**

1. **Import from GitHub**:
   - Go to [codesandbox.io](https://codesandbox.io)
   - Import your GitHub repository
   - CodeSandbox will auto-detect the configuration

2. **Set environment variables**:
   - Go to Server Control Panel
   - Add environment variables
   - Restart the sandbox

## 📊 Storage Costs

### **AWS S3 Pricing (Approximate):**
- **Storage**: $0.023/GB/month
- **Requests**: $0.0004/1000 PUT requests
- **Data Transfer**: $0.09/GB (first 1GB free)
- **Example**: 10GB photos = ~$2.50/month

### **Cloudinary Pricing:**
- **Free Tier**: 25GB storage, 25GB bandwidth
- **Paid Plans**: Start at $89/month for 100GB
- **Pay-as-you-go**: Available for smaller usage

## 🔒 Security Best Practices

### **S3 Security:**
1. **Use IAM roles** instead of access keys when possible
2. **Enable bucket versioning** for backup
3. **Set up lifecycle policies** to manage costs
4. **Use signed URLs** for private content
5. **Enable CloudTrail** for audit logging

### **Cloudinary Security:**
1. **Use signed uploads** for sensitive content
2. **Set upload restrictions** (file size, type)
3. **Enable auto-moderation** for inappropriate content
4. **Use transformation URLs** to prevent hotlinking

## 🛠️ Testing Cloud Storage

### **Test S3 Upload:**
```bash
# Test AWS CLI access
aws s3 ls s3://your-bucket-name

# Upload test file
aws s3 cp test-image.jpg s3://your-bucket-name/test/
```

### **Test Cloudinary Upload:**
```bash
# Using curl
curl -X POST \
  https://api.cloudinary.com/v1_1/your-cloud-name/image/upload \
  -F "file=@test-image.jpg" \
  -F "api_key=your-api-key" \
  -F "timestamp=1234567890" \
  -F "signature=your-signature"
```

## 📱 Mobile Optimization

### **Image Processing Pipeline:**

1. **Original Photo**: Stored at full resolution
2. **Thumbnail**: 300x300px for grid views
3. **Medium**: 800x600px for detail views
4. **Compressed**: WebP format for faster loading

### **Automatic Transformations:**

```javascript
// Cloudinary transformations
const transformations = [
  { width: 1920, height: 1080, crop: 'limit' },
  { quality: 'auto' },
  { format: 'auto' }
];

// S3 with Lambda for processing
const processImage = async (s3Event) => {
  // Resize and optimize uploaded images
  // Generate thumbnails
  // Update database with processed URLs
};
```

## 🆘 Troubleshooting

### **Common Issues:**

1. **CORS Errors**:
   - Check bucket CORS configuration
   - Verify allowed origins include your domain

2. **Access Denied**:
   - Verify IAM permissions
   - Check bucket policy
   - Ensure credentials are correct

3. **Upload Failures**:
   - Check file size limits
   - Verify file type restrictions
   - Test network connectivity

4. **Slow Loading**:
   - Enable CDN (CloudFront for S3)
   - Use appropriate image formats
   - Implement lazy loading

## 📞 Support Resources

- **AWS S3 Documentation**: [docs.aws.amazon.com/s3](https://docs.aws.amazon.com/s3)
- **Cloudinary Documentation**: [cloudinary.com/documentation](https://cloudinary.com/documentation)
- **AWS Lightsail Guide**: [lightsail.aws.amazon.com/ls/docs](https://lightsail.aws.amazon.com/ls/docs)

---

**Ready to set up cloud storage? Choose your preferred option above and follow the step-by-step instructions!** ☁️📱
