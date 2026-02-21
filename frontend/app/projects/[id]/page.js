'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { projectsAPI, requestsAPI, tasksAPI, submissionsAPI } from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import LifecycleBar from '../../../components/LifecycleBar';
import { StatusBadge, RoleBadge, Button, Modal, EmptyState, Spinner, ProgressBar } from '../../../components/ui';
import { format, formatDistanceToNow } from 'date-fns';

const PRIORITY_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };

export default function ProjectDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [project, setProject] = useState(null);
  const [requests, setRequests] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(true);

  // Modals
  const [taskModal, setTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', deadline: '', metadata: { priority: 'medium', tags: '', notes: '' } });
  const [submitModal, setSubmitModal] = useState(null);
  const [submitFile, setSubmitFile] = useState(null);
  const [submitNotes, setSubmitNotes] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isBuyer = user?.role === 'buyer' && project?.buyer?._id === user?._id;
  const isSolver = project?.assignedTo?._id === user?._id;
  const isAdmin = user?.role === 'admin';

  const loadProject = useCallback(async () => {
    try {
      const { data } = await projectsAPI.getById(id);
      setProject(data);
    } catch {
      toast.error('Failed to load project');
      router.push('/dashboard');
    }
  }, [id]);

  const loadRequests = useCallback(async () => {
    if (!isBuyer && !isAdmin) return;
    try {
      const { data } = await requestsAPI.getForProject(id);
      setRequests(data);
    } catch {}
  }, [id, isBuyer, isAdmin]);

  const loadTasks = useCallback(async () => {
    if (!project) return;
    try {
      const { data } = await tasksAPI.getForProject(id);
      setTasks(data);
      // Load submissions for submitted/completed tasks
      const submissionMap = {};
      await Promise.all(data.map(async task => {
        if (['submitted', 'completed', 'rejected'].includes(task.status)) {
          try {
            const { data: subs } = await submissionsAPI.getForTask(task._id);
            submissionMap[task._id] = subs;
          } catch {}
        }
      }));
      setSubmissions(submissionMap);
    } catch {}
  }, [id, project]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (user && id) {
      setLoading(true);
      loadProject().finally(() => setLoading(false));
    }
  }, [user, id]);

  useEffect(() => {
    if (project) {
      loadRequests();
      loadTasks();
    }
  }, [project?._id, project?.status]);

  const handleAssign = async (problemSolverId) => {
    try {
      const { data } = await projectsAPI.assign(id, problemSolverId);
      setProject(data);
      toast.success('Problem solver assigned! Project is now active.');
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        projectId: id,
        title: taskForm.title,
        description: taskForm.description,
        deadline: taskForm.deadline || undefined,
        metadata: {
          priority: taskForm.metadata.priority,
          tags: taskForm.metadata.tags ? taskForm.metadata.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          notes: taskForm.metadata.notes,
        }
      };
      await tasksAPI.create(payload);
      toast.success('Task created!');
      setTaskModal(false);
      setTaskForm({ title: '', description: '', deadline: '', metadata: { priority: 'medium', tags: '', notes: '' } });
      await loadProject();
      await loadTasks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      await tasksAPI.update(taskId, { status });
      toast.success(`Task marked as ${status}`);
      await loadTasks();
      await loadProject();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update task');
    }
  };

  const handleSubmitWork = async () => {
    if (!submitFile) return toast.error('Please select a ZIP file');
    setSubmitting(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', submitFile);
      formData.append('taskId', submitModal._id);
      formData.append('notes', submitNotes);
      formData._onProgress = setUploadProgress;

      await submissionsAPI.submit(formData);
      const submittedTaskId = submitModal._id;
      setTasks(prev => prev.map(t => t._id === submittedTaskId ? { ...t, status: 'submitted' } : t));
      toast.success('Work submitted!');
      setSubmitModal(null);
      setSubmitFile(null);
      setSubmitNotes('');
      setUploadProgress(0);
      await loadTasks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (decision) => {
    if (!reviewModal) return;
    setSubmitting(true);
    const reviewedTaskId = reviewModal._id;
    try {
      const latestSub = submissions[reviewModal._id]?.[0];
      if (!latestSub) return toast.error('No submission found');
      await submissionsAPI.review(latestSub._id, { decision, reviewNote });
      setTasks(prev => prev.map(t => t._id === reviewedTaskId ? { ...t, status: decision === 'accepted' ? 'completed' : 'rejected' } : t));
      if (decision === 'accepted') {
        const willBeAllDone = tasks.every(t => t._id === reviewedTaskId ? true : t.status === 'completed');
        if (willBeAllDone && project) setProject(prev => (prev ? { ...prev, status: 'completed' } : prev));
      }
      toast.success(decision === 'accepted' ? '✅ Task accepted!' : '❌ Task rejected');
      setReviewModal(null);
      setReviewNote('');
      await loadTasks();
      await loadProject();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Review failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading || !project) return (
    <div><Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spinner size={36} />
      </div>
    </div>
  );

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;

  return (
    <div>
      <Navbar />
      <main className="container main-content">
        {/* Back */}
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '1rem', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, marginBottom: '1.5rem' }}>
          ← Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <h1 style={{ fontSize: 24, fontWeight: 800 }}>{project.title}</h1>
                  <StatusBadge status={project.status} />
                </div>
                <p style={{ color: 'var(--text2)', fontSize: 15, lineHeight: 1.7, marginBottom: 12 }}>{project.description}</p>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text3)', flexWrap: 'wrap' }}>
                  <span>👤 Buyer: {project.buyer?.name}</span>
                  {project.budget && <span>💰 ${project.budget.toLocaleString()}</span>}
                  {project.deadline && <span>📅 Due {format(new Date(project.deadline), 'MMM d, yyyy')}</span>}
                  <span>🗓 {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}</span>
                </div>
                {project.skills?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                    {project.skills.map(s => (
                      <span key={s} style={{ padding: '3px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12, color: 'var(--text2)' }}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
              {project.assignedTo && (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 18px', minWidth: 180 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned To</div>
                  <div style={{ fontWeight: 700 }}>{project.assignedTo.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{project.assignedTo.email}</div>
                </div>
              )}
            </div>
          </div>

          {/* Lifecycle Bar */}
          <div style={{ marginBottom: 28 }}>
            <LifecycleBar status={project.status} />
          </div>

          {/* Task Progress */}
          {tasks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 24 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Task Progress</span>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>{completedTasks} / {totalTasks} completed</span>
              </div>
              <ProgressBar value={completedTasks} max={Math.max(totalTasks, 1)} color="var(--green)" />
            </motion.div>
          )}

          {/* BUYER: Requests Panel */}
          {isBuyer && project.status === 'open' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 24 }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
                Requests ({requests.filter(r => r.status === 'pending').length} pending)
              </h2>
              {requests.length === 0 ? (
                <div style={{ color: 'var(--text3)', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>No requests yet. Problem solvers will appear here when they apply.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <AnimatePresence>
                    {requests.filter(r => r.status === 'pending').map((req, i) => (
                      <motion.div
                        key={req._id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        transition={{ delay: i * 0.05 }}
                        style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 16 }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, marginBottom: 4 }}>{req.problemSolver?.name}</div>
                            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>{req.problemSolver?.email}</div>
                            {req.problemSolver?.profile?.bio && (
                              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6, fontStyle: 'italic' }}>"{req.problemSolver.profile.bio}"</div>
                            )}
                            {req.message && (
                              <div style={{ fontSize: 13, color: 'var(--text)', background: 'var(--surface3)', borderRadius: 6, padding: '8px 12px', marginTop: 8 }}>
                                {req.message}
                              </div>
                            )}
                            {req.problemSolver?.profile?.skills?.length > 0 && (
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                                {req.problemSolver.profile.skills.map(s => (
                                  <span key={s} style={{ padding: '2px 8px', background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 11, color: 'var(--text2)' }}>{s}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={() => handleAssign(req.problemSolver._id)}
                            variant="success"
                            size="sm"
                          >
                            ✓ Assign
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {/* Tasks Section */}
          {['assigned', 'in_progress', 'completed'].includes(project.status) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Tasks / Sub-modules</h2>
                {isSolver && ['assigned', 'in_progress'].includes(project.status) && (
                  <Button onClick={() => setTaskModal(true)} size="sm">
                    ✚ Add Task
                  </Button>
                )}
              </div>

              {tasks.length === 0 ? (
                <EmptyState
                  icon="📝"
                  title="No tasks yet"
                  description={isSolver ? "Break down the project into sub-modules and start working." : "Waiting for the problem solver to create tasks."}
                  action={isSolver && <Button onClick={() => setTaskModal(true)} size="sm">Create First Task</Button>}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <AnimatePresence>
                    {tasks.map((task, i) => (
                      <motion.div
                        key={task._id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        style={{
                          background: 'var(--surface)',
                          border: `1px solid ${task.status === 'completed' ? 'rgba(34,197,94,0.3)' : task.status === 'submitted' ? 'rgba(6,182,212,0.3)' : task.status === 'rejected' ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                          borderRadius: 'var(--radius)',
                          padding: 18,
                          transition: 'border-color 0.3s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <span style={{ fontWeight: 700, fontSize: 15 }}>{task.title}</span>
                              <StatusBadge status={task.status} />
                              {task.metadata?.priority && (
                                <span style={{ fontSize: 11, color: PRIORITY_COLORS[task.metadata.priority], fontWeight: 600 }}>
                                  {task.metadata.priority.toUpperCase()}
                                </span>
                              )}
                            </div>
                            {task.description && <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 8 }}>{task.description}</p>}
                            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text3)', flexWrap: 'wrap' }}>
                              {task.deadline && <span>📅 {format(new Date(task.deadline), 'MMM d, yyyy')}</span>}
                              <span>🗓 {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</span>
                            </div>
                            {task.metadata?.tags?.length > 0 && (
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                                {task.metadata.tags.map(tag => (
                                  <span key={tag} style={{ padding: '2px 8px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 11, color: 'var(--text2)' }}>{tag}</span>
                                ))}
                              </div>
                            )}

                            {/* Submission info */}
                            {submissions[task._id]?.[0] && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                style={{ marginTop: 10, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
                              >
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <span>📦</span>
                                  <span style={{ color: 'var(--text2)' }}>{submissions[task._id][0].fileName}</span>
                                  <a
                                    href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${submissions[task._id][0].filePath}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'var(--accent2)', fontSize: 12 }}
                                    onClick={e => e.stopPropagation()}
                                  >
                                    Download
                                  </a>
                                </div>
                                {submissions[task._id][0].notes && (
                                  <div style={{ color: 'var(--text3)', marginTop: 4 }}>{submissions[task._id][0].notes}</div>
                                )}
                                {submissions[task._id][0].reviewNote && (
                                  <div style={{ color: task.status === 'completed' ? 'var(--green)' : 'var(--red)', marginTop: 4 }}>
                                    Review: {submissions[task._id][0].reviewNote}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                            {/* Solver actions */}
                            {isSolver && task.status === 'todo' && (
                              <Button variant="secondary" size="sm" onClick={() => handleUpdateTaskStatus(task._id, 'in_progress')}>
                                Start Task
                              </Button>
                            )}
                            {isSolver && ['todo', 'in_progress', 'rejected'].includes(task.status) && (
                              <Button variant="primary" size="sm" onClick={() => setSubmitModal(task)}>
                                📦 Submit
                              </Button>
                            )}

                            {/* Buyer actions */}
                            {isBuyer && task.status === 'submitted' && (
                              <Button variant="success" size="sm" onClick={() => setReviewModal(task)}>
                                Review →
                              </Button>
                            )}

                            {task.status === 'completed' && (
                              <span style={{ fontSize: 18 }}>✅</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Create Task Modal */}
      <Modal isOpen={taskModal} onClose={() => setTaskModal(false)} title="Create New Task" width={520}>
        <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Task Title *</label>
            <input value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} required placeholder="e.g. Frontend authentication module" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="What needs to be done in this task?" style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Deadline</label>
              <input type="date" value={taskForm.deadline} onChange={e => setTaskForm(p => ({ ...p, deadline: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select value={taskForm.metadata.priority} onChange={e => setTaskForm(p => ({ ...p, metadata: { ...p.metadata, priority: e.target.value } }))} style={{ ...inputStyle, appearance: 'auto' }}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Tags</label>
            <input value={taskForm.metadata.tags} onChange={e => setTaskForm(p => ({ ...p, metadata: { ...p.metadata, tags: e.target.value } }))} placeholder="frontend, auth, api (comma-separated)" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button type="submit" disabled={submitting} style={{ flex: 1, justifyContent: 'center' }}>
              {submitting ? 'Creating...' : '✚ Create Task'}
            </Button>
            <Button variant="secondary" onClick={() => setTaskModal(false)} disabled={submitting}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Submit Work Modal */}
      <Modal isOpen={!!submitModal} onClose={() => { setSubmitModal(null); setSubmitFile(null); setSubmitNotes(''); setUploadProgress(0); }} title={`Submit: ${submitModal?.title}`} width={480}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>ZIP File *</label>
            <input
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              onChange={e => setSubmitFile(e.target.files?.[0] || null)}
              style={{ ...inputStyle, padding: '8px 14px' }}
            />
            {submitFile && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>📦 {submitFile.name} ({(submitFile.size / 1024).toFixed(1)} KB)</div>}
          </div>
          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea value={submitNotes} onChange={e => setSubmitNotes(e.target.value)} rows={3} placeholder="Describe what you've built, any setup instructions, etc." style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          {submitting && uploadProgress > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>
                <span>Uploading...</span><span>{uploadProgress}%</span>
              </div>
              <ProgressBar value={uploadProgress} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <Button onClick={handleSubmitWork} disabled={submitting || !submitFile} style={{ flex: 1, justifyContent: 'center' }}>
              {submitting ? 'Uploading...' : '📤 Submit Work'}
            </Button>
            <Button variant="secondary" onClick={() => { setSubmitModal(null); setSubmitFile(null); }} disabled={submitting}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={!!reviewModal} onClose={() => { setReviewModal(null); setReviewNote(''); }} title={`Review: ${reviewModal?.title}`} width={480}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {submissions[reviewModal?._id]?.[0] && (
            <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 6 }}>Submitted File</div>
              <div style={{ fontWeight: 600 }}>📦 {submissions[reviewModal._id][0].fileName}</div>
              {submissions[reviewModal._id][0].notes && (
                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{submissions[reviewModal._id][0].notes}</div>
              )}
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${submissions[reviewModal._id][0].filePath}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent2)', fontSize: 13, display: 'block', marginTop: 6 }}
              >
                Download & Review →
              </a>
            </div>
          )}
          <div>
            <label style={labelStyle}>Review Note (optional)</label>
            <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} rows={3} placeholder="Feedback for the problem solver..." style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="success" onClick={() => handleReview('accepted')} disabled={submitting} style={{ flex: 1, justifyContent: 'center' }}>
              ✅ Accept
            </Button>
            <Button variant="danger" onClick={() => handleReview('rejected')} disabled={submitting} style={{ flex: 1, justifyContent: 'center' }}>
              ❌ Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 6, fontWeight: 500 };
const inputStyle = { width: '100%', padding: '12px 16px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '1rem', fontFamily: 'inherit', outline: 'none' };
