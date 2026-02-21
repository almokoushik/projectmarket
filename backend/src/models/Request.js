const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  problemSolver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

// One request per user per project
requestSchema.index({ project: 1, problemSolver: 1 }, { unique: true });

module.exports = mongoose.model('Request', requestSchema);
