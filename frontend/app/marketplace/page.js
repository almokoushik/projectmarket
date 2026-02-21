'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from "../../context/AuthContext";
import { projectsAPI, requestsAPI } from '../../lib/api';
import Navbar from '../../components/Navbar';
import { StatusBadge, Button, Modal, EmptyState, Spinner } from '../../components/ui';
import { format } from 'date-fns';

export default function MarketplacePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestModal, setRequestModal] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      setProjects(projRes.data.filter(p => p.status === 'open'));
      setMyRequests(reqRes.data);
    } catch {
      toast.error('Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  const hasRequested = (projectId) => myRequests.some(r => r.project?._id === projectId || r.project === projectId);

  const handleRequest = async () => {
    setSubmitting(true);
    try {
      await requestsAPI.create({ projectId: requestModal._id, message: requestMessage });
      toast.success('Request sent!');
      setRequestModal(null);
      setRequestMessage('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) return <div><Navbar /><div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={36} /></div></div>;

  return (
    <div>
      <Navbar />
      <main className="container main-content">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Marketplace</h1>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>{projects.length} open project{projects.length !== 1 ? 's' : ''} looking for problem solvers</p>
          </div>

          {projects.length === 0 ? (
            <EmptyState icon="🔍" title="No open projects" description="Check back soon — buyers will post new projects here." />
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              <AnimatePresence>
                {projects.map((p, i) => {
                  const requested = hasRequested(p._id);
                  return (
                    <motion.div
                      key={p._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{ background: 'var(--surface)', border: `1px solid ${requested ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: 22, transition: 'all 0.2s' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <h2 style={{ fontSize: 17, fontWeight: 700 }}>{p.title}</h2>
                            {requested && <span style={{ fontSize: 12, color: 'var(--green)', background: 'var(--green-glow)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>✓ Requested</span>}
                          </div>
                          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 12, lineHeight: 1.6 }}>{p.description}</p>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13, color: 'var(--text3)' }}>
                            <span>👤 {p.buyer?.name}</span>
                            {p.budget && <span>💰 ${p.budget.toLocaleString()}</span>}
                            {p.deadline && <span>📅 Due {format(new Date(p.deadline), 'MMM d, yyyy')}</span>}
                            <span>🗓 Posted {format(new Date(p.createdAt), 'MMM d')}</span>
                          </div>
                          {p.skills?.length > 0 && (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                              {p.skills.map(s => (
                                <span key={s} style={{ padding: '3px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12, color: 'var(--text2)' }}>{s}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                          <Button
                            onClick={() => !requested && setRequestModal(p)}
                            variant={requested ? 'success' : 'primary'}
                            disabled={requested}
                            size="sm"
                          >
                            {requested ? '✓ Applied' : 'Request to Work'}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/projects/${p._id}`)}>
                            View Details →
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>

      <Modal isOpen={!!requestModal} onClose={() => { setRequestModal(null); setRequestMessage(''); }} title={`Request: ${requestModal?.title}`} width={500}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 14, color: 'var(--text2)' }}>Tell the buyer why you're the right person for this project.</p>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 6, fontWeight: 500 }}>Your Message (optional)</label>
            <textarea
              value={requestMessage}
              onChange={e => setRequestMessage(e.target.value)}
              rows={4}
              placeholder="Briefly describe your relevant experience and approach..."
              style={{ width: '100%', padding: '12px 16px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '1rem', fontFamily: 'inherit', outline: 'none', resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button onClick={handleRequest} disabled={submitting} style={{ flex: 1, justifyContent: 'center' }}>
              {submitting ? 'Sending...' : '🚀 Send Request'}
            </Button>
            <Button variant="secondary" onClick={() => { setRequestModal(null); setRequestMessage(''); }}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
