const router = require('express').Router();
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');

// Admin: Get all users
router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find().sort('-createdAt');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Assign role
router.patch('/:id/role', auth, requireRole('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'buyer', 'problem_solver', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update own profile (problem solvers)
router.patch('/profile', auth, requireRole('problem_solver'), async (req, res) => {
  try {
    const { bio, skills, experience, portfolio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profile: { bio, skills, experience, portfolio } },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get problem solver profile
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
