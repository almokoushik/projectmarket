const router = require('express').Router();
const Request = require('../models/Request');
const Project = require('../models/Project');
const { auth, requireRole } = require('../middleware/auth');

// Get requests for a project (buyer sees them)
router.get('/project/:projectId', auth, requireRole('buyer', 'admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (req.user.role === 'buyer' && project.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not your project' });
    }
    const requests = await Request.find({ project: req.params.projectId })
      .populate('problemSolver', 'name email profile')
      .sort('-createdAt');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get my requests (problem solver)
router.get('/mine', auth, requireRole('problem_solver'), async (req, res) => {
  try {
    const requests = await Request.find({ problemSolver: req.user._id })
      .populate('project', 'title status buyer')
      .sort('-createdAt');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create request (problem solver)
router.post('/', auth, requireRole('problem_solver'), async (req, res) => {
  try {
    const { projectId, message } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.status !== 'open') return res.status(400).json({ error: 'Project is not open' });

    const existing = await Request.findOne({ project: projectId, problemSolver: req.user._id });
    if (existing) return res.status(400).json({ error: 'Already requested' });

    const request = await Request.create({ project: projectId, problemSolver: req.user._id, message });
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
