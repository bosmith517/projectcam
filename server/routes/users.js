import express from 'express';
import User from '../models/User.js';
import Project from '../models/Project.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Search users (for adding collaborators)
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } }
      ],
      isActive: true,
      _id: { $ne: req.user.userId } // Exclude current user
    })
    .select('firstName lastName email company trade avatar')
    .limit(parseInt(limit));

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Error searching users', error: error.message });
  }
});

// Get user profile by ID
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password')
      .populate('projects', 'name description status createdAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only return full profile if it's the current user or they share projects
    if (req.user.userId !== req.params.userId) {
      // Check if users share any projects
      const currentUser = await User.findById(req.user.userId);
      const sharedProjects = await Project.find({
        $or: [
          { 
            owner: req.user.userId,
            'collaborators.user': req.params.userId
          },
          {
            owner: req.params.userId,
            'collaborators.user': req.user.userId
          }
        ]
      });

      if (sharedProjects.length === 0) {
        // Return limited profile for non-connected users
        return res.json({
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            company: user.company,
            trade: user.trade,
            avatar: user.avatar
          }
        });
      }
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// Get all users (admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, trade, isActive } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    if (trade) {
      query.trade = trade;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Update user status (admin only)
router.put('/:userId/status', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Error updating user status', error: error.message });
  }
});

// Update user role (admin only)
router.put('/:userId/role', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { role } = req.body;

    if (!['admin', 'manager', 'worker'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({
      message: 'User role updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Error updating user role', error: error.message });
  }
});

// Get user statistics
router.get('/:userId/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check if user can view these stats
    if (req.user.userId !== userId) {
      const currentUser = await User.findById(req.user.userId);
      if (currentUser.role !== 'admin') {
        return res.status(403).json({ message: 'Permission denied' });
      }
    }

    // Get user's projects count
    const projectsCount = await Project.countDocuments({
      $or: [
        { owner: userId },
        { 'collaborators.user': userId }
      ]
    });

    // Get user's owned projects count
    const ownedProjectsCount = await Project.countDocuments({ owner: userId });

    // Get user's photos count
    const Photo = (await import('../models/Photo.js')).default;
    const photosCount = await Photo.countDocuments({ uploadedBy: userId });

    // Get user's comments count
    const commentsCount = await Photo.aggregate([
      { $unwind: '$comments' },
      { $match: { 'comments.user': userId } },
      { $count: 'total' }
    ]);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPhotos = await Photo.countDocuments({
      uploadedBy: userId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    const recentProjects = await Project.countDocuments({
      owner: userId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      stats: {
        totalProjects: projectsCount,
        ownedProjects: ownedProjectsCount,
        totalPhotos: photosCount,
        totalComments: commentsCount.length > 0 ? commentsCount[0].total : 0,
        recentActivity: {
          photosLast30Days: recentPhotos,
          projectsLast30Days: recentProjects
        }
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Error fetching user statistics', error: error.message });
  }
});

// Upload user avatar
router.post('/:userId/avatar', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check if user can update this avatar
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const upload = req.app.locals.upload;
    
    upload.single('avatar')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: 'Avatar upload error', error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No avatar file uploaded' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update user avatar
      user.avatar = `/uploads/${req.file.filename}`;
      await user.save();

      res.json({
        message: 'Avatar updated successfully',
        avatar: user.avatar
      });
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Error uploading avatar', error: error.message });
  }
});

// Get user's recent activity
router.get('/:userId/activity', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { limit = 20 } = req.query;

    // Check if user can view this activity
    if (req.user.userId !== userId) {
      const currentUser = await User.findById(req.user.userId);
      if (currentUser.role !== 'admin') {
        return res.status(403).json({ message: 'Permission denied' });
      }
    }

    const Photo = (await import('../models/Photo.js')).default;

    // Get recent photos
    const recentPhotos = await Photo.find({ uploadedBy: userId })
      .populate('project', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 2)
      .select('title url project createdAt');

    // Get recent projects
    const recentProjects = await Project.find({ owner: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 2)
      .select('name description status createdAt');

    // Combine and sort by date
    const activity = [
      ...recentPhotos.map(photo => ({
        type: 'photo',
        id: photo._id,
        title: photo.title,
        project: photo.project,
        createdAt: photo.createdAt,
        url: photo.url
      })),
      ...recentProjects.map(project => ({
        type: 'project',
        id: project._id,
        title: project.name,
        description: project.description,
        status: project.status,
        createdAt: project.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
     .slice(0, parseInt(limit));

    res.json({ activity });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ message: 'Error fetching user activity', error: error.message });
  }
});

export default router;
