const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Submission = require('../models/Submission');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { auth, requireRole } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed'
      || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files allowed'));
    }
  }
});

// Get submissions for a task
router.get('/task/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId).populate('project');
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const userId = req.user._id.toString();
    const isBuyer = req.user.role === 'buyer' && task.project.buyer.toString() === userId;
    const isSolver = task.createdBy.toString() === userId;

    if (!isBuyer && !isSolver && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const submissions = await Submission.find({ task: req.params.taskId })
      .populate('submittedBy', 'name email')
      .sort('-createdAt');
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit work (problem solver)
router.post('/', auth, requireRole('problem_solver'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'ZIP file required' });

    const { taskId, notes } = req.body;
    const task = await Task.findById(taskId).populate('project');
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not your task' });
    }
    if (!['todo', 'in_progress', 'rejected'].includes(task.status)) {
      return res.status(400).json({ error: 'Task cannot be submitted in current state' });
    }

    const submission = await Submission.create({
      task: taskId,
      project: task.project._id,
      submittedBy: req.user._id,
      fileName: req.file.originalname,
      filePath: `/uploads/${req.file.filename}`,
      fileSize: req.file.size,
      notes
    });

    task.status = 'submitted';
    await task.save();

    res.status(201).json(submission);
  } catch (err) {
    if (err.message === 'Only ZIP files allowed') return res.status(400).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Review submission (buyer)
router.patch('/:id/review', auth, requireRole('buyer'), async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate('task');
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    const project = await Project.findById(submission.project);
    if (project.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not your project' });
    }

    const { decision, reviewNote } = req.body;
    if (!['accepted', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be accepted or rejected' });
    }

    submission.status = decision;
    submission.reviewNote = reviewNote;
    await submission.save();

    // Update task status
    const task = submission.task;
    task.status = decision === 'accepted' ? 'completed' : 'rejected';
    await task.save();

    // If task accepted, check if all tasks are done → complete project
    if (decision === 'accepted') {
      const allTasks = await Task.find({ project: submission.project });
      const allDone = allTasks.every(t => t.status === 'completed');
      if (allDone) {
        await Project.findByIdAndUpdate(submission.project, { status: 'completed' });
      }
    }

    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
