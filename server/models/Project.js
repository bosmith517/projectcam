import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  address: {
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    zipCode: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'manager', 'viewer', 'contributor'],
      default: 'viewer'
    },
    permissions: {
      canUpload: {
        type: Boolean,
        default: false
      },
      canComment: {
        type: Boolean,
        default: true
      },
      canEdit: {
        type: Boolean,
        default: false
      },
      canDelete: {
        type: Boolean,
        default: false
      }
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled'],
    default: 'planning'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  estimatedCompletion: {
    type: Date
  },
  budget: {
    type: Number,
    min: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  customFields: [{
    name: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'number', 'date', 'boolean'],
      default: 'text'
    }
  }],
  photos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Photo'
  }],
  checklists: [{
    name: {
      type: String,
      required: true
    },
    items: [{
      text: {
        type: String,
        required: true
      },
      completed: {
        type: Boolean,
        default: false
      },
      completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      completedAt: {
        type: Date
      },
      dueDate: {
        type: Date
      }
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  timeline: [{
    event: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    date: {
      type: Date,
      default: Date.now
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['milestone', 'photo', 'comment', 'status-change', 'user-added', 'checklist'],
      default: 'milestone'
    }
  }],
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowGuestUploads: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    autoBackup: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Index for better search performance
projectSchema.index({ name: 'text', description: 'text', tags: 'text' });
projectSchema.index({ 'address.city': 1, 'address.state': 1 });
projectSchema.index({ owner: 1, status: 1 });

// Virtual for full address
projectSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}`;
});

// Virtual for completion percentage
projectSchema.virtual('completionPercentage').get(function() {
  if (!this.checklists || this.checklists.length === 0) return 0;
  
  let totalItems = 0;
  let completedItems = 0;
  
  this.checklists.forEach(checklist => {
    totalItems += checklist.items.length;
    completedItems += checklist.items.filter(item => item.completed).length;
  });
  
  return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
});

// Method to add user to project
projectSchema.methods.addCollaborator = function(userId, role = 'viewer', permissions = {}) {
  const existingCollaborator = this.collaborators.find(
    collab => collab.user.toString() === userId.toString()
  );
  
  if (existingCollaborator) {
    throw new Error('User is already a collaborator on this project');
  }
  
  const defaultPermissions = {
    canUpload: role === 'contributor' || role === 'manager',
    canComment: true,
    canEdit: role === 'manager',
    canDelete: role === 'manager'
  };
  
  this.collaborators.push({
    user: userId,
    role,
    permissions: { ...defaultPermissions, ...permissions }
  });
  
  return this.save();
};

// Method to remove collaborator
projectSchema.methods.removeCollaborator = function(userId) {
  this.collaborators = this.collaborators.filter(
    collab => collab.user.toString() !== userId.toString()
  );
  return this.save();
};

export default mongoose.model('Project', projectSchema);
