import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

const photoSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  dimensions: {
    width: Number,
    height: Number
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  location: {
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    address: {
      type: String,
      trim: true
    }
  },
  metadata: {
    camera: {
      make: String,
      model: String
    },
    settings: {
      iso: Number,
      aperture: String,
      shutterSpeed: String,
      focalLength: String
    },
    timestamp: {
      type: Date
    },
    weather: {
      temperature: Number,
      conditions: String,
      humidity: Number
    }
  },
  annotations: [{
    type: {
      type: String,
      enum: ['arrow', 'circle', 'rectangle', 'text', 'measurement'],
      required: true
    },
    coordinates: {
      x: {
        type: Number,
        required: true
      },
      y: {
        type: Number,
        required: true
      },
      width: Number,
      height: Number
    },
    text: String,
    color: {
      type: String,
      default: '#ff0000'
    },
    strokeWidth: {
      type: Number,
      default: 2
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [commentSchema],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'approved'
  },
  isBeforePhoto: {
    type: Boolean,
    default: false
  },
  isAfterPhoto: {
    type: Boolean,
    default: false
  },
  beforeAfterPair: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Photo'
  },
  phase: {
    type: String,
    enum: [
      'pre-construction',
      'foundation',
      'framing',
      'roofing',
      'electrical',
      'plumbing',
      'insulation',
      'drywall',
      'flooring',
      'painting',
      'final',
      'other'
    ],
    default: 'other'
  },
  room: {
    type: String,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better performance
photoSchema.index({ project: 1, createdAt: -1 });
photoSchema.index({ uploadedBy: 1, createdAt: -1 });
photoSchema.index({ tags: 1 });
photoSchema.index({ phase: 1, room: 1 });
photoSchema.index({ 'location.coordinates.latitude': 1, 'location.coordinates.longitude': 1 });

// Virtual for file type
photoSchema.virtual('fileType').get(function() {
  if (this.mimeType.startsWith('image/')) return 'image';
  if (this.mimeType.startsWith('video/')) return 'video';
  return 'document';
});

// Virtual for formatted file size
photoSchema.virtual('formattedFileSize').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Method to add comment
photoSchema.methods.addComment = function(userId, text, mentions = []) {
  this.comments.push({
    user: userId,
    text,
    mentions
  });
  return this.save();
};

// Method to add like
photoSchema.methods.toggleLike = function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  
  if (existingLike) {
    this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  } else {
    this.likes.push({ user: userId });
  }
  
  return this.save();
};

// Method to add annotation
photoSchema.methods.addAnnotation = function(userId, annotationData) {
  this.annotations.push({
    ...annotationData,
    createdBy: userId
  });
  return this.save();
};

// Method to increment view count
photoSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Method to increment download count
photoSchema.methods.incrementDownloadCount = function() {
  this.downloadCount += 1;
  return this.save();
};

export default mongoose.model('Photo', photoSchema);
