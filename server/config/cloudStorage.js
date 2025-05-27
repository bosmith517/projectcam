const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// S3 Upload Configuration
const s3Upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET || 'projectcam-photos',
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, {
        fieldName: file.fieldname,
        uploadedBy: req.user?.id || 'anonymous',
        uploadDate: new Date().toISOString()
      });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileName = `photos/${req.user?.id || 'anonymous'}/${uniqueSuffix}${path.extname(file.originalname)}`;
      cb(null, fileName);
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
});

// Cloudinary Configuration (Alternative)
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary Upload Function
const uploadToCloudinary = async (file, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'projectcam',
      resource_type: 'auto',
      transformation: [
        { width: 1920, height: 1080, crop: 'limit', quality: 'auto' },
        { format: 'auto' }
      ],
      ...options
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

// Delete from S3
const deleteFromS3 = async (key) => {
  try {
    await s3.deleteObject({
      Bucket: process.env.AWS_S3_BUCKET || 'projectcam-photos',
      Key: key
    }).promise();
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    return false;
  }
};

// Delete from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
};

// Generate signed URL for private access
const generateSignedUrl = (key, expiresIn = 3600) => {
  return s3.getSignedUrl('getObject', {
    Bucket: process.env.AWS_S3_BUCKET || 'projectcam-photos',
    Key: key,
    Expires: expiresIn
  });
};

// Resize image for thumbnails
const createThumbnail = async (imageUrl, width = 300, height = 300) => {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'projectcam/thumbnails',
      transformation: [
        { width, height, crop: 'fill', gravity: 'center' },
        { quality: 'auto', format: 'auto' }
      ]
    });
    
    return result.secure_url;
  } catch (error) {
    console.error('Thumbnail creation error:', error);
    return null;
  }
};

module.exports = {
  s3Upload,
  uploadToCloudinary,
  deleteFromS3,
  deleteFromCloudinary,
  generateSignedUrl,
  createThumbnail,
  s3,
  cloudinary
};
