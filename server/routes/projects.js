import express from 'express';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { authenticateToken, checkProjectPermission } from '../middleware/auth.js';

const router = express.Router();

// Get all projects for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const userId = req.user.userId;

    // Build query
    const query = {
      $or: [
        { owner: userId },
        { 'collaborators.user': userId }
      ]
    };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const projects = await Project.find(query)
      .populate('owner', 'firstName lastName company')
      .populate('collaborators.user', 'firstName lastName company')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Project.countDocuments(query);

    res.json({
      projects,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
});

// Get single project
router.get('/:projectId', authenticateToken, checkProjectPermission(), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('owner', 'firstName lastName company trade')
      .populate('collaborators.user', 'firstName lastName company trade')
      .populate('photos', 'filename url thumbnailUrl uploadedBy createdAt tags phase')
      .populate('checklists.createdBy', 'firstName lastName');

    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Error fetching project', error: error.message });
  }
});

// Create new project
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      startDate,
      endDate,
      estimatedCompletion,
      budget,
      tags,
      customFields
    } = req.body;

    const project = new Project({
      name,
      description,
      address,
      owner: req.user.userId,
      startDate: startDate || new Date(),
      endDate,
      estimatedCompletion,
      budget,
      tags: tags || [],
      customFields: customFields || []
    });

    await project.save();

    // Add project to user's projects list
    await User.findByIdAndUpdate(
      req.user.userId,
      { $push: { projects: project._id } }
    );

    // Add timeline entry
    project.timeline.push({
      event: 'Project Created',
      description: `Project "${name}" was created`,
      user: req.user.userId,
      type: 'milestone'
    });

    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'firstName lastName company');

    res.status(201).json({
      message: 'Project created successfully',
      project: populatedProject
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
});

// Update project
router.put('/:projectId', authenticateToken, checkProjectPermission('canEdit'), async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      status,
      startDate,
      endDate,
      estimatedCompletion,
      budget,
      tags,
      customFields,
      settings
    } = req.body;

    const project = await Project.findById(req.params.projectId);
    const oldStatus = project.status;

    // Update fields
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (address) project.address = { ...project.address, ...address };
    if (status) project.status = status;
    if (startDate) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;
    if (estimatedCompletion !== undefined) project.estimatedCompletion = estimatedCompletion;
    if (budget !== undefined) project.budget = budget;
    if (tags) project.tags = tags;
    if (customFields) project.customFields = customFields;
    if (settings) project.settings = { ...project.settings, ...settings };

    // Add timeline entry for status change
    if (status && status !== oldStatus) {
      project.timeline.push({
        event: 'Status Changed',
        description: `Project status changed from "${oldStatus}" to "${status}"`,
        user: req.user.userId,
        type: 'status-change'
      });
    }

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'firstName lastName company')
      .populate('collaborators.user', 'firstName lastName company');

    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Error updating project', error: error.message });
  }
});

// Delete project
router.delete('/:projectId', authenticateToken, checkProjectPermission('canDelete'), async (req, res) => {
  try {
    // Only project owner can delete
    if (req.projectRole !== 'owner') {
      return res.status(403).json({ message: 'Only project owner can delete the project' });
    }

    await Project.findByIdAndDelete(req.params.projectId);

    // Remove project from all users' projects lists
    await User.updateMany(
      { projects: req.params.projectId },
      { $pull: { projects: req.params.projectId } }
    );

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Error deleting project', error: error.message });
  }
});

// Add collaborator to project
router.post('/:projectId/collaborators', authenticateToken, checkProjectPermission('canEdit'), async (req, res) => {
  try {
    const { email, role = 'viewer', permissions = {} } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    const project = await Project.findById(req.params.projectId);
    
    try {
      await project.addCollaborator(user._id, role, permissions);
      
      // Add project to user's projects list
      await User.findByIdAndUpdate(
        user._id,
        { $addToSet: { projects: project._id } }
      );

      // Add timeline entry
      project.timeline.push({
        event: 'Collaborator Added',
        description: `${user.firstName} ${user.lastName} was added as ${role}`,
        user: req.user.userId,
        type: 'user-added'
      });

      await project.save();

      const updatedProject = await Project.findById(project._id)
        .populate('collaborators.user', 'firstName lastName company trade');

      res.json({
        message: 'Collaborator added successfully',
        collaborators: updatedProject.collaborators
      });
    } catch (addError) {
      if (addError.message.includes('already a collaborator')) {
        return res.status(400).json({ message: addError.message });
      }
      throw addError;
    }
  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({ message: 'Error adding collaborator', error: error.message });
  }
});

// Remove collaborator from project
router.delete('/:projectId/collaborators/:userId', authenticateToken, checkProjectPermission('canEdit'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    
    await project.removeCollaborator(req.params.userId);

    // Remove project from user's projects list
    await User.findByIdAndUpdate(
      req.params.userId,
      { $pull: { projects: project._id } }
    );

    const removedUser = await User.findById(req.params.userId);
    
    // Add timeline entry
    project.timeline.push({
      event: 'Collaborator Removed',
      description: `${removedUser.firstName} ${removedUser.lastName} was removed from the project`,
      user: req.user.userId,
      type: 'user-added'
    });

    await project.save();

    res.json({ message: 'Collaborator removed successfully' });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({ message: 'Error removing collaborator', error: error.message });
  }
});

// Add/Update checklist
router.post('/:projectId/checklists', authenticateToken, checkProjectPermission('canEdit'), async (req, res) => {
  try {
    const { name, items } = req.body;

    const project = await Project.findById(req.params.projectId);
    
    project.checklists.push({
      name,
      items: items.map(item => ({
        text: item.text,
        dueDate: item.dueDate
      })),
      createdBy: req.user.userId
    });

    // Add timeline entry
    project.timeline.push({
      event: 'Checklist Added',
      description: `Checklist "${name}" was created`,
      user: req.user.userId,
      type: 'checklist'
    });

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('checklists.createdBy', 'firstName lastName');

    res.json({
      message: 'Checklist added successfully',
      checklists: updatedProject.checklists
    });
  } catch (error) {
    console.error('Add checklist error:', error);
    res.status(500).json({ message: 'Error adding checklist', error: error.message });
  }
});

// Update checklist item
router.put('/:projectId/checklists/:checklistId/items/:itemId', authenticateToken, checkProjectPermission('canEdit'), async (req, res) => {
  try {
    const { completed } = req.body;
    const { projectId, checklistId, itemId } = req.params;

    const project = await Project.findById(projectId);
    const checklist = project.checklists.id(checklistId);
    const item = checklist.items.id(itemId);

    if (completed !== undefined) {
      item.completed = completed;
      if (completed) {
        item.completedBy = req.user.userId;
        item.completedAt = new Date();
      } else {
        item.completedBy = undefined;
        item.completedAt = undefined;
      }
    }

    await project.save();

    res.json({
      message: 'Checklist item updated successfully',
      item
    });
  } catch (error) {
    console.error('Update checklist item error:', error);
    res.status(500).json({ message: 'Error updating checklist item', error: error.message });
  }
});

export default router;
