'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { projectsAPI } from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import { StatusBadge, Button, EmptyState, Spinner } from '../../../components/ui';
import { format } from 'date-fns';

export default function BuyerProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) return router.push('/login');
      if (user.role !== 'buyer') return router.push('/dashboard');
      projectsAPI.getAll().then(r => setProjects(r.data)).catch(() => toast.error('Failed to load projects')).finally(() => setLoading(false));
    }
  }, [user, authLoading]);

  if (authLoading || loading) return <div><Navbar /><div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={36} /></div></div>;

  return (
    <div>
      <Navbar />
      <main className="container main-content">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>My Projects</h1>
              <p style={{ color: 'var(--text2)', fontSize: 14 }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
            </div>
            <Button onClick={() => router.push('/buyer/projects/new')}>
              ✚ New Project
            </Button>
          </div>

          {projects.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No projects yet"
              description="Create your first project to start finding problem solvers."
              action={<Button onClick={() => router.push('/buyer/projects/new')}>Create Project</Button>}
            />
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {projects.map((p, i) => (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ borderColor: 'var(--border2)', y: -2 }}
                  onClick={() => router.push(`/projects/${p._id}`)}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{p.title}</div>
                      <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.description}
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--text3)', flexWrap: 'wrap' }}>
                        {p.budget && <span>💰 ${p.budget.toLocaleString()}</span>}
                        {p.deadline && <span>📅 {format(new Date(p.deadline), 'MMM d, yyyy')}</span>}
                        {p.assignedTo && <span>👤 {p.assignedTo.name}</span>}
                        <span>{format(new Date(p.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
