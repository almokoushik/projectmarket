'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { projectsAPI } from '../../lib/api';
import Navbar from '../../components/Navbar';
import { StatusBadge, Button, EmptyState, Spinner } from '../../components/ui';

/* ─── Role config (quick-action cards) ───────────────────── */
const roleConfig = {
  admin: {
    greeting: 'Admin Dashboard',
    desc: 'Manage users, assign roles, and oversee all projects in the marketplace.',
    color: 'var(--accent)',
    actions: [
      { label: 'Manage Users', href: '/admin/users', icon: '👥', desc: 'Assign buyer & solver roles' },
      { label: 'All Projects', href: '/admin/projects', icon: '📁', desc: 'Advanced project management' },
    ],
  },
  buyer: {
    greeting: 'Buyer Dashboard',
    desc: 'Create projects, review requests from problem solvers, and track delivery.',
    color: '#f59e0b',
    actions: [
      { label: 'My Projects', href: '/buyer/projects', icon: '📋', desc: 'View and manage your projects' },
    ],
  },
  problem_solver: {
    greeting: 'Problem Solver Dashboard',
    desc: 'Browse open projects, request to work, and deliver high-quality solutions.',
    color: '#06b6d4',
    actions: [
      { label: 'Marketplace', href: '/marketplace', icon: '🔍', desc: 'Find projects to work on' },
      { label: 'My Work', href: '/solver/projects', icon: '⚙️', desc: 'Projects you\'re working on' },
      { label: 'My Profile', href: '/solver/profile', icon: '👤', desc: 'Showcase your skills' },
    ],
  },
  user: {
    greeting: 'Welcome to ProjectMarket',
    desc: 'Your account has been created. An admin needs to assign you a role to get started.',
    color: 'var(--text2)',
    actions: [],
  },
};

/* ─── Status filter options ──────────────────────────────── */
const STATUS_OPTIONS = ['all', 'open', 'assigned', 'in_progress', 'completed', 'cancelled'];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  /* Auth guard */
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  /* Fetch projects */
  useEffect(() => {
    if (authLoading || !user) return;
    projectsAPI
      .getAll()
      .then((r) => setProjects(r.data))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setProjectsLoading(false));
  }, [user, authLoading]);

  if (authLoading || !user) return null;

  const config = roleConfig[user.role] || roleConfig.user;

  /* Derived filtered list */
  const filtered = projects.filter((p) => {
    const matchSearch =
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <Navbar />
      <main className="container main-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* ── Header ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <div style={{ width: 12, height: 12, background: config.color, borderRadius: '50%', boxShadow: `0 0 12px ${config.color}`, flexShrink: 0 }} />
                <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.875rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {config.greeting}
                </h1>
              </div>
              <p style={{ color: 'var(--text2)', fontSize: '0.9375rem', maxWidth: 560, lineHeight: 1.65 }}>
                {config.desc}
              </p>
              <p style={{ color: 'var(--text3)', fontSize: '0.8125rem', marginTop: 8 }}>
                Signed in as <strong style={{ color: 'var(--text2)' }}>{user.name}</strong> — {user.email}
              </p>
            </div>

            {/* Create button — buyers only */}
            {user.role === 'buyer' && (
              <Button
                onClick={() => router.push('/buyer/projects/new')}
                size="md"
                style={{ flexShrink: 0, alignSelf: 'flex-start' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New Project
              </Button>
            )}
          </div>

          {/* ── Quick-action cards ─────────────────────────────── */}
          {config.actions.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
              {config.actions.map((action, i) => (
                <motion.div
                  key={action.href}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => router.push(action.href)}
                  whileHover={{ y: -3, borderColor: config.color }}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '1.25rem 1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>{action.icon}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 3 }}>{action.label}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text2)' }}>{action.desc}</div>
                </motion.div>
              ))}
            </div>
          )}

          {/* ── Waiting-for-role state ─────────────────────────── */}
          {user.role === 'user' && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '2rem', maxWidth: 480, marginBottom: '2.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
              <div style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: 8 }}>Waiting for Role Assignment</div>
              <div style={{ fontSize: '0.9375rem', color: 'var(--text2)', lineHeight: 1.7 }}>
                An admin needs to assign you either the <strong>Buyer</strong> or <strong>Problem Solver</strong> role before you can use the marketplace. Please contact your admin.
              </div>
            </div>
          )}

          {/* ── Projects Section ───────────────────────────────── */}
          <div>
            {/* Section header + controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>All Projects</h2>
                {!projectsLoading && (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text3)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 10px' }}>
                    {filtered.length}
                  </span>
                )}
              </div>

              {/* Search + filter */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"
                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  >
                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search projects…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '0.875rem',
                      fontFamily: 'inherit', outline: 'none', width: 200,
                    }}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '0.875rem',
                    fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
                  }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s === 'all' ? 'All statuses' : s.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Project list */}
            {projectsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <Spinner size={36} />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={search || statusFilter !== 'all' ? '🔍' : '📋'}
                title={search || statusFilter !== 'all' ? 'No matching projects' : 'No projects yet'}
                description={
                  search || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter.'
                    : user.role === 'buyer'
                    ? 'Create your first project to start finding problem solvers.'
                    : 'Projects posted by buyers will appear here.'
                }
                action={
                  !search && statusFilter === 'all' && user.role === 'buyer' ? (
                    <Button onClick={() => router.push('/buyer/projects/new')}>Create Project</Button>
                  ) : null
                }
              />
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                <AnimatePresence initial={false}>
                  {filtered.map((p, i) => (
                    <motion.div
                      key={p._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ delay: i * 0.04 }}
                      whileHover={{ borderColor: 'var(--border2)', y: -2 }}
                      onClick={() => router.push(`/projects/${p._id}`)}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: '1.125rem 1.25rem',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s, transform 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: 4 }}>{p.title}</div>
                          <div style={{
                            fontSize: '0.875rem', color: 'var(--text2)', marginBottom: 10,
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>
                            {p.description}
                          </div>
                          <div style={{ display: 'flex', gap: 14, fontSize: '0.8125rem', color: 'var(--text3)', flexWrap: 'wrap', alignItems: 'center' }}>
                            {p.budget && <span>💰 ${p.budget.toLocaleString()}</span>}
                            {p.deadline && (
                              <span>📅 {format(new Date(p.deadline), 'MMM d, yyyy')}</span>
                            )}
                            {p.assignedTo && <span>👤 {p.assignedTo.name}</span>}
                            {p.buyer && user.role !== 'buyer' && (
                              <span style={{ color: 'var(--text3)' }}>by {p.buyer.name}</span>
                            )}
                            {p.skills?.length > 0 && (
                              <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {p.skills.slice(0, 3).map((sk) => (
                                  <span
                                    key={sk}
                                    style={{
                                      padding: '2px 7px', background: 'var(--surface2)',
                                      border: '1px solid var(--border)', borderRadius: 10,
                                      fontSize: '0.75rem', color: 'var(--text2)',
                                    }}
                                  >
                                    {sk}
                                  </span>
                                ))}
                                {p.skills.length > 3 && (
                                  <span style={{ padding: '2px 7px', color: 'var(--text3)', fontSize: '0.75rem' }}>
                                    +{p.skills.length - 3}
                                  </span>
                                )}
                              </span>
                            )}
                            <span style={{ marginLeft: 'auto' }}>
                              {format(new Date(p.createdAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

        </motion.div>
      </main>
    </div>
  );
}
