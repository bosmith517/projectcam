import express from 'express';
import path from 'path';
import Photo from '../models/Photo.js';
import Project from '../models/Project.js';
import { authenticateToken, checkProjectPermission } from '../middleware/auth.js';
import { io } from '../index.js';

const router = express.Router();

// Get photos for a project
router.get('/project/:projectId', authenticateToken, checkProjectPermission(), async (req, res) => {
  try {
    const { page = 1, limit = 20, phase, tags, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build query
    const query = { project: req.params.projectId };

    if (phase) {
      query.phase = phase;
    }

    if (tags) {
      const tagArray = tags.split(',');
      query.tags = { $in: tagArray };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const photos = await Photo.find(query)
      .populate('uploadedBy', 'firstName lastName company')
      .populate('comments.user', 'firstName lastName')
      .populate('likes.user', 'firstName lastName')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Photo.countDocuments(query);

    res.json({
      photos,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ message: 'Error fetching photos', error: error.message });
  }
});

// Get single photo
router.get('/:photoId', authenticateToken, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.photoId)
      .populate('uploadedBy', 'firstName lastName company')
      .populate('comments.user', 'firstName lastName')
      .populate('comments.replies.user', 'firstName lastName')
      .populate('likes.user', 'firstName lastName')
      .populate('annotations.createdBy', 'firstName lastName');

    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(photo.project);
    const userId = req.user.userId;
    
    const hasAccess = project.owner.toString() === userId || 
                     project.collaborators.some(collab => collab.user.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this photo' });
    }

    // Increment view count
    await photo.incrementViewCount();

    res.json({ photo });
  } catch (error) {
    console.error('Get photo error:', error);
    res.status(500).json({ message: 'Error fetching photo', error: error.message });
  }
});

// Upload photos
router.post('/upload/:projectId', authenticateToken, checkProjectPermission('canUpload'), async (req, res) => {
  try {
    const upload = req.app.locals.upload;
    
    upload.array('photos', 10)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: 'File upload error', error: err.message });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const { title, description, tags, phase, room, isBeforePhoto, isAfterPhoto } = req.body;
      const projectId = req.params.projectId;
      const uploadedPhotos = [];

      for (const file of req.files) {
        const photo = new Photo({
          filename: file.filename,
          originalName: file.originalname,
          url: `/uploads/${file.filename}`,
          fileSize: file.size,
          mimeType: file.mimetype,
          project: projectId,
          uploadedBy: req.user.userId,
          title: title || file.originalname,
          description,
          tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
          phase: phase || 'other',
          room,
          isBeforePhoto: isBeforePhoto === 'true',
          isAfterPhoto: isAfterPhoto === 'true'
        });

        await photo.save();

        // Add photo to project
        await Project.findByIdAndUpdate(
          projectId,
          { $push: { photos: photo._id } }
        );

        // Add timeline entry
        const project = await Project.findById(projectId);
        project.timeline.push({
          event: 'Photo Uploaded',
          description: `Photo "${photo.title}" was uploaded`,
          user: req.user.userId,
          type: 'photo'
        });
        await project.save();

        uploadedPhotos.push(photo);
      }

      // Emit real-time update
      io.to(projectId).emit('photo-added', {
        projectId,
        photos: uploadedPhotos,
        uploadedBy: req.user.userId
      });

      const populatedPhotos = await Photo.find({ 
        _id: { $in: uploadedPhotos.map(p => p._id) } 
      }).populate('uploadedBy', 'firstName lastName company');

      res.status(201).json({
        message: 'Photos uploaded successfully',
        photos: populatedPhotos
      });
    });
  } catch (error) {
    console.error('Upload photos error:', error);
    res.status(500).json({ message: 'Error uploading photos', error: error.message });
  }
});

// Update photo
router.put('/:photoId', authenticateToken, async (req, res) => {
  try {
    const { title, description, tags, phase, room, isBeforePhoto, isAfterPhoto } = req.body;
    
    const photo = await Photo.findById(req.params.photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Check if user has permission to edit
    const project = await Project.findById(photo.project);
    const userId = req.user.userId;
    
    const isOwner = project.owner.toString() === userId;
    const isUploader = photo.uploadedBy.toString() === userId;
    const collaborator = project.collaborators.find(collab => collab.user.toString() === userId);
    const canEdit = isOwner || isUploader || (collaborator && collaborator.permissions.canEdit);

    if (!canEdit) {
      return res.status(403).json({ message: 'Permission denied to edit this photo' });
    }

    // Update fields
    if (title !== undefined) photo.title = title;
    if (description !== undefined) photo.description = description;
    if (tags !== undefined) photo.tags = tags.split(',').map(tag => tag.trim());
    if (phase !== undefined) photo.phase = phase;
    if (room !== undefined) photo.room = room;
    if (isBeforePhoto !== undefined) photo.isBeforePhoto = isBeforePhoto;
    if (isAfterPhoto !== undefined) photo.isAfterPhoto = isAfterPhoto;

    await photo.save();

    const updatedPhoto = await Photo.findById(photo._id)
      .populate('uploadedBy', 'firstName lastName company');

    res.json({
      message: 'Photo updated successfully',
      photo: updatedPhoto
    });
  } catch (error) {
    console.error('Update photo error:', error);
    res.status(500).json({ message: 'Error updating photo', error: error.message });
  }
});

// Delete photo
router.delete('/:photoId', authenticateToken, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Check if user has permission to delete
    const project = await Project.findById(photo.project);
    const userId = req.user.userId;
    
    const isOwner = project.owner.toString() === userId;
    const isUploader = photo.uploadedBy.toString() === userId;
    const collaborator = project.collaborators.find(collab => collab.user.toString() === userId);
    const canDelete = isOwner || isUploader || (collaborator && collaborator.permissions.canDelete);

    if (!canDelete) {
      return res.status(403).json({ message: 'Permission denied to delete this photo' });
    }

    // Remove photo from project
    await Project.findByIdAndUpdate(
      photo.project,
      { $pull: { photos: photo._id } }
    );

    await Photo.findByIdAndDelete(req.params.photoId);

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ message: 'Error deleting photo', error: error.message });
  }
});

// Add comment to photo
router.post('/:photoId/comments', authenticateToken, async (req, res) => {
  try {
    const { text, mentions = [] } = req.body;
    
    const photo = await Photo.findById(req.params.photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(photo.project);
    const userId = req.user.userId;
    
    const hasAccess = project.owner.toString() === userId || 
                     project.collaborators.some(collab => collab.user.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this photo' });
    }

    await photo.addComment(userId, text, mentions);

    // Emit real-time update
    io.to(photo.project.toString()).emit('comment-added', {
      photoId: photo._id,
      projectId: photo.project,
      comment: {
        user: userId,
        text,
        mentions,
        createdAt: new Date()
      }
    });

    const updatedPhoto = await Photo.findById(photo._id)
      .populate('comments.user', 'firstName lastName')
      .populate('comments.mentions', 'firstName lastName');

    res.json({
      message: 'Comment added successfully',
      comments: updatedPhoto.comments
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
});

// Toggle like on photo
router.post('/:photoId/like', authenticateToken, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(photo.project);
    const userId = req.user.userId;
    
    const hasAccess = project.owner.toString() === userId || 
                     project.collaborators.some(collab => collab.user.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this photo' });
    }

    await photo.toggleLike(userId);

    const updatedPhoto = await Photo.findById(photo._id)
      .populate('likes.user', 'firstName lastName');

    res.json({
      message: 'Like toggled successfully',
      likes: updatedPhoto.likes
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ message: 'Error toggling like', error: error.message });
  }
});

// Add annotation to photo
router.post('/:photoId/annotations', authenticateToken, async (req, res) => {
  try {
    const { type, coordinates, text, color, strokeWidth } = req.body;
    
    const photo = await Photo.findById(req.params.photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(photo.project);
    const userId = req.user.userId;
    
    const hasAccess = project.owner.toString() === userId || 
                     project.collaborators.some(collab => collab.user.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this photo' });
    }

    const annotationData = {
      type,
      coordinates,
      text,
      color,
      strokeWidth
    };

    await photo.addAnnotation(userId, annotationData);

    const updatedPhoto = await Photo.findById(photo._id)
      .populate('annotations.createdBy', 'firstName lastName');

    res.json({
      message: 'Annotation added successfully',
      annotations: updatedPhoto.annotations
    });
  } catch (error) {
    console.error('Add annotation error:', error);
    res.status(500).json({ message: 'Error adding annotation', error: error.message });
  }
});

// Download photo
router.get('/:photoId/download', authenticateToken, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(photo.project);
    const userId = req.user.userId;
    
    const hasAccess = project.owner.toString() === userId || 
                     project.collaborators.some(collab => collab.user.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this photo' });
    }

    // Increment download count
    await photo.incrementDownloadCount();

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${photo.originalName}"`);
    res.setHeader('Content-Type', photo.mimeType);

    // Send file
    res.download(path.join(__dirname, '..', 'uploads', photo.filename), photo.originalName);
  } catch (error) {
    console.error('Download photo error:', error);
    res.status(500).json({ message: 'Error downloading photo', error: error.message });
  }
});

export default router;
