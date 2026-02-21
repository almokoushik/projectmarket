'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { projectsAPI } from '../../../../lib/api';
import Navbar from '../../../../components/Navbar';
import { Button, Input, Textarea } from '../../../../components/ui';

export default function NewProjectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ title: '', description: '', budget: '', deadline: '', skills: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        budget: form.budget ? Number(form.budget) : undefined,
        deadline: form.deadline || undefined,
        skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      const { data } = await projectsAPI.create(payload);
      toast.success('Project created!');
      router.push(`/projects/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <main className="container main-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ marginBottom: 32 }}>
            <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 14, fontFamily: 'Syne, sans-serif', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              ← Back
            </button>
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>Create New Project</h1>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 6 }}>Describe your project to attract the best problem solvers.</p>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 32 }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 6, fontWeight: 500 }}>Project Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  required
                  placeholder="e.g. Build an e-commerce website"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 6, fontWeight: 500 }}>Description *</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  required
                  rows={5}
                  placeholder="Describe your project in detail — requirements, deliverables, technical stack, etc."
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 6, fontWeight: 500 }}>Budget (USD)</label>
                  <input
                    type="number"
                    value={form.budget}
                    onChange={e => setForm(p => ({ ...p, budget: e.target.value }))}
                    placeholder="e.g. 2000"
                    min="0"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 6, fontWeight: 500 }}>Deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 6, fontWeight: 500 }}>Required Skills</label>
                <input
                  value={form.skills}
                  onChange={e => setForm(p => ({ ...p, skills: e.target.value }))}
                  placeholder="React, Node.js, MongoDB (comma-separated)"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
                <Button type="submit" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                  {loading ? 'Creating...' : '🚀 Create Project'}
                </Button>
                <Button variant="secondary" onClick={() => router.back()} disabled={loading}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text)',
  fontSize: 14,
  fontFamily: 'Syne, sans-serif',
  outline: 'none',
};
