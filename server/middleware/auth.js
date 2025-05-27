import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to authenticate JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token or user not found' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    return res.status(500).json({ message: 'Token verification failed' });
  }
};

// Middleware to check if user has specific role
export const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      req.userRole = user.role;
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Role verification failed' });
    }
  };
};

// Middleware to check project permissions
export const checkProjectPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const userId = req.user.userId;

      const Project = (await import('../models/Project.js')).default;
      const project = await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Check if user is project owner
      if (project.owner.toString() === userId) {
        req.projectRole = 'owner';
        return next();
      }

      // Check if user is a collaborator
      const collaborator = project.collaborators.find(
        collab => collab.user.toString() === userId
      );

      if (!collaborator) {
        return res.status(403).json({ message: 'Access denied to this project' });
      }

      // Check specific permission
      if (permission && !collaborator.permissions[permission]) {
        return res.status(403).json({ message: `Permission denied: ${permission}` });
      }

      req.projectRole = collaborator.role;
      req.projectPermissions = collaborator.permissions;
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Permission check failed' });
    }
  };
};

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        req.user = decoded;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};
