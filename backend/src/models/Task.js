const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String },
  deadline: { type: Date },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'submitted', 'completed', 'rejected'],
    default: 'todo'
  },
  metadata: {
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    tags: [String],
    notes: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
