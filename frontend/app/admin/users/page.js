'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { usersAPI } from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import { RoleBadge, Card, Button, Spinner, EmptyState } from '../../../components/ui';

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) return router.push('/login');
      if (user.role !== 'admin') return router.push('/dashboard');
      fetchUsers();
    }
  }, [user, authLoading]);

  const fetchUsers = async () => {
    try {
      const { data } = await usersAPI.getAll();
      setUsers(data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId);
    try {
      const { data: updated } = await usersAPI.assignRole(userId, newRole);
      setUsers(prev => prev.map(u => u._id === userId ? updated : u));
      toast.success(`Role updated to ${newRole}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    } finally {
      setUpdating(null);
    }
  };

  if (authLoading || loading) return (
    <div><Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spinner size={36} />
      </div>
    </div>
  );

  return (
    <div>
      <Navbar />
      <main className="container main-content">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>User Management</h1>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>{users.length} registered users</p>
          </div>

          {users.length === 0 ? (
            <EmptyState icon="👥" title="No users yet" description="Users will appear here once they register." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <AnimatePresence>
                {users.map((u, i) => (
                  <motion.div
                    key={u._id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      flexWrap: 'wrap',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{ width: 40, height: 40, background: 'var(--surface3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'var(--text2)', flexShrink: 0, border: '1px solid var(--border)' }}>
                      {u.name?.[0]?.toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{u.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text2)' }}>{u.email}</div>
                    </div>

                    <RoleBadge role={u.role} />

                    {/* Role selector - don't allow changing own role */}
                    {u._id !== user._id && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        {['user', 'buyer', 'problem_solver', 'admin'].map(role => (
                          <motion.button
                            key={role}
                            onClick={() => handleRoleChange(u._id, role)}
                            disabled={updating === u._id || u.role === role}
                            whileHover={u.role !== role ? { scale: 1.05 } : undefined}
                            whileTap={u.role !== role ? { scale: 0.95 } : undefined}
                            style={{
                              padding: '5px 12px',
                              background: u.role === role ? 'var(--accent)' : 'var(--surface2)',
                              border: `1px solid ${u.role === role ? 'var(--accent)' : 'var(--border)'}`,
                              borderRadius: 6,
                              color: u.role === role ? 'white' : 'var(--text2)',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: u.role === role ? 'default' : 'pointer',
                              fontFamily: 'Syne, sans-serif',
                              opacity: updating === u._id ? 0.5 : 1,
                              transition: 'all 0.2s',
                            }}
                          >
                            {updating === u._id ? '...' : role.replace('_', ' ')}
                          </motion.button>
                        ))}
                      </div>
                    )}
                    {u._id === user._id && (
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>You</span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
