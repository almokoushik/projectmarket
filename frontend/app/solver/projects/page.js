'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { projectsAPI, requestsAPI } from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import { StatusBadge, EmptyState, Spinner, Button } from '../../../components/ui';
import { format } from 'date-fns';

export default function SolverProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [assigned, setAssigned] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) return router.push('/login');
      if (user.role !== 'problem_solver') return router.push('/dashboard');
      loadData();
    }
  }, [user, authLoading]);

  const loadData = async () => {
    try {
      const [projRes, reqRes] = await Promise.all([
        projectsAPI.getAll(),
        requestsAPI.getMine()
      ]);
      setAssigned(projRes.data.filter(p => p.assignedTo?._id === user._id || p.assignedTo === user._id));
      setRequests(reqRes.data);
    } catch {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) return <div><Navbar /><div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={36} /></div></div>;

  return (
    <div>
      <Navbar />
      <main className="container main-content">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 32 }}>My Work</h1>

          {/* Active Projects */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, color: 'var(--text2)' }}>
              Active Projects ({assigned.length})
            </h2>
            {assigned.length === 0 ? (
              <EmptyState icon="⚙️" title="No active projects" description="You haven't been assigned to any projects yet." action={<Button onClick={() => router.push('/marketplace')} size="sm">Browse Marketplace</Button>} />
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {assigned.map((p, i) => (
                  <motion.div
                    key={p._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => router.push(`/projects/${p._id}`)}
                    whileHover={{ borderColor: 'var(--border2)', y: -1 }}
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 18, cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{p.title}</div>
                        <div style={{ fontSize: 13, color: 'var(--text2)' }}>Buyer: {p.buyer?.name} · {format(new Date(p.createdAt), 'MMM d, yyyy')}</div>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Request History */}
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, color: 'var(--text2)' }}>
              Request History ({requests.length})
            </h2>
            {requests.length === 0 ? (
              <div style={{ color: 'var(--text3)', fontSize: 14 }}>No requests yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {requests.map((req, i) => (
                  <motion.div
                    key={req._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{req.project?.title || 'Project'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{format(new Date(req.createdAt), 'MMM d, yyyy')}</div>
                    </div>
                    <StatusBadge status={req.status} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
