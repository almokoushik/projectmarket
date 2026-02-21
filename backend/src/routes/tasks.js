const router = require('express').Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const { auth, requireRole } = require('../middleware/auth');

// Get tasks for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Access check
    const userId = req.user._id.toString();
    const isBuyer = req.user.role === 'buyer' && project.buyer.toString() === userId;
    const isSolver = project.assignedTo?.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isSolver && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const tasks = await Task.find({ project: req.params.projectId })
      .populate('createdBy', 'name')
      .sort('createdAt');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create task (assigned problem solver only)
router.post('/', auth, requireRole('problem_solver'), async (req, res) => {
  try {
    const { projectId, title, description, deadline, metadata } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not assigned to this project' });
    }
    if (!['assigned', 'in_progress'].includes(project.status)) {
      return res.status(400).json({ error: 'Project must be assigned or in progress' });
    }

    const task = await Task.create({ project: projectId, createdBy: req.user._id, title, description, deadline, metadata });

    // Auto update project to in_progress
    if (project.status === 'assigned') {
      project.status = 'in_progress';
      await project.save();
    }

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update task status (problem solver or buyer for completion)
router.patch('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const { status, title, description, deadline, metadata } = req.body;
    const isSolver = task.createdBy.toString() === req.user._id.toString();
    const isBuyer = req.user.role === 'buyer' && task.project.buyer.toString() === req.user._id.toString();

    if (!isSolver && !isBuyer && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Buyers can only mark as completed/rejected from submitted
    if (isBuyer && status && !['completed', 'rejected'].includes(status)) {
      return res.status(403).json({ error: 'Buyers can only accept or reject submitted tasks' });
    }
    if (isBuyer && status === 'completed' && task.status !== 'submitted') {
      return res.status(400).json({ error: 'Task must be submitted first' });
    }

    if (status) task.status = status;
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (deadline !== undefined) task.deadline = deadline;
    if (metadata) task.metadata = { ...task.metadata, ...metadata };

    await task.save();

    // Check if all tasks done → complete project
    if (status === 'completed') {
      const allTasks = await Task.find({ project: task.project._id });
      const allDone = allTasks.every(t => t.status === 'completed');
      if (allDone) {
        await task.project.updateOne({ status: 'completed' });
      }
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete task
router.delete('/:id', auth, requireRole('problem_solver'), async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!task) return res.status(404).json({ error: 'Task not found or unauthorized' });
    if (task.status !== 'todo') return res.status(400).json({ error: 'Can only delete todo tasks' });
    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
