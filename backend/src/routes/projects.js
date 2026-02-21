const router = require('express').Router();
const Project = require('../models/Project');
const { auth, requireRole } = require('../middleware/auth');

// Get projects (role-aware)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'buyer') query.buyer = req.user._id;
    else if (req.user.role === 'problem_solver') {
      // Show open projects + projects assigned to them
      query = { $or: [{ status: 'open' }, { assignedTo: req.user._id }] };
    }
    // admin sees all

    const projects = await Project.find(query)
      .populate('buyer', 'name email')
      .populate('assignedTo', 'name email profile')
      .sort('-createdAt');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single project
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('buyer', 'name email')
      .populate('assignedTo', 'name email profile');
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create project (buyers only)
router.post('/', auth, requireRole('buyer'), async (req, res) => {
  try {
    const { title, description, budget, deadline, skills } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'Title and description required' });
    const project = await Project.create({
      title, description, budget, deadline, skills,
      buyer: req.user._id
    });
    const populated = await project.populate('buyer', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update project (buyer owner only)
router.patch('/:id', auth, requireRole('buyer'), async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, buyer: req.user._id });
    if (!project) return res.status(404).json({ error: 'Project not found or unauthorized' });
    if (project.status !== 'open') return res.status(400).json({ error: 'Can only edit open projects' });

    const { title, description, budget, deadline, skills } = req.body;
    Object.assign(project, { title, description, budget, deadline, skills });
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign problem solver (buyer only)
router.patch('/:id/assign', auth, requireRole('buyer'), async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, buyer: req.user._id });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.status !== 'open') return res.status(400).json({ error: 'Project is not open for assignment' });

    const { problemSolverId } = req.body;
    const Request = require('../models/Request');
    const request = await Request.findOne({
      project: project._id,
      problemSolver: problemSolverId,
      status: 'pending'
    });
    if (!request) return res.status(400).json({ error: 'No pending request from this solver' });

    // Accept this request, reject others
    await Request.updateMany({ project: project._id, status: 'pending' }, { status: 'rejected' });
    await Request.findByIdAndUpdate(request._id, { status: 'accepted' });

    project.assignedTo = problemSolverId;
    project.status = 'assigned';
    await project.save();

    const populated = await project.populate(['buyer', 'assignedTo']);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
