'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { projectsAPI } from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import { StatusBadge, EmptyState, Spinner } from '../../../components/ui';
import { format } from 'date-fns';

export default function AdminProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) return router.push('/login');
      if (user.role !== 'admin') return router.push('/dashboard');
      projectsAPI.getAll().then(r => setProjects(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
    }
  }, [user, authLoading]);

  if (authLoading || loading) return <div><Navbar /><div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={36} /></div></div>;

  return (
    <div>
      <Navbar />
      <main className="container main-content">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>All Projects</h1>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>{projects.length} projects in the marketplace</p>
          </div>

          {projects.length === 0 ? (
            <EmptyState icon="📁" title="No projects yet" description="Projects will appear here once buyers create them." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {projects.map((p, i) => (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => router.push(`/projects/${p._id}`)}
                  whileHover={{ borderColor: 'var(--border2)', y: -1 }}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{p.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>Buyer: {p.buyer?.name || 'Unknown'}</div>
                  </div>
                  <StatusBadge status={p.status} />
                  <div style={{ fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                    {format(new Date(p.createdAt), 'MMM d, yyyy')}
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
