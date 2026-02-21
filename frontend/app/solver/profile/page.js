'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { usersAPI } from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import { Button } from '../../../components/ui';

export default function SolverProfilePage() {
  const { user, refreshUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ bio: '', skills: '', experience: '', portfolio: '' });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) return router.push('/login');
      if (user.role !== 'problem_solver') return router.push('/dashboard');
      if (user.profile) {
        setForm({
          bio: user.profile.bio || '',
          skills: user.profile.skills?.join(', ') || '',
          experience: user.profile.experience || '',
          portfolio: user.profile.portfolio || '',
        });
      }
    }
  }, [user, authLoading]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await usersAPI.updateProfile({
        bio: form.bio,
        skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        experience: form.experience,
        portfolio: form.portfolio,
      });
      await refreshUser();
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) return null;

  const hasProfile = user.profile?.bio || user.profile?.skills?.length;

  return (
    <div>
      <Navbar />
      <main className="container main-content">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>My Profile</h1>
            {!editing && <Button onClick={() => setEditing(true)} variant="secondary" size="sm">Edit Profile</Button>}
          </div>

          {/* Profile Display */}
          {!editing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{ width: 56, height: 56, background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'white' }}>
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{user.name}</div>
                    <div style={{ color: 'var(--text2)', fontSize: 14 }}>{user.email}</div>
                  </div>
                </div>

                {!hasProfile ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>No profile set up yet</div>
                    <div style={{ fontSize: 14, marginBottom: 16 }}>Add your bio, skills and experience to stand out to buyers.</div>
                    <Button onClick={() => setEditing(true)} size="sm">Set Up Profile</Button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {user.profile?.bio && (
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Bio</div>
                        <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7 }}>{user.profile.bio}</div>
                      </div>
                    )}
                    {user.profile?.skills?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Skills</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {user.profile.skills.map(s => (
                            <span key={s} style={{ padding: '4px 12px', background: 'var(--accent-glow)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 12, fontSize: 13, color: 'var(--accent2)', fontWeight: 600 }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {user.profile?.experience && (
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Experience</div>
                        <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7 }}>{user.profile.experience}</div>
                      </div>
                    )}
                    {user.profile?.portfolio && (
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Portfolio</div>
                        <a href={user.profile.portfolio} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent2)', fontSize: 14 }}>{user.profile.portfolio}</a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Edit Form */}
          {editing && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28 }}>
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {[
                    { label: 'Bio', key: 'bio', type: 'textarea', placeholder: 'Describe yourself, your expertise, and what you love to build...' },
                    { label: 'Skills', key: 'skills', type: 'text', placeholder: 'React, Node.js, Python, MongoDB (comma-separated)' },
                    { label: 'Experience', key: 'experience', type: 'textarea', placeholder: 'Describe your professional background...' },
                    { label: 'Portfolio URL', key: 'portfolio', type: 'url', placeholder: 'https://yourportfolio.com' },
                  ].map(({ label, key, type, placeholder }) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 6, fontWeight: 500 }}>{label}</label>
                      {type === 'textarea' ? (
                        <textarea
                          value={form[key]}
                          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                          rows={3}
                          placeholder={placeholder}
                          style={{ width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }}
                        />
                      ) : (
                        <input
                          type={type}
                          value={form[key]}
                          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                          placeholder={placeholder}
                          style={{ width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
                        />
                      )}
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                    <Button type="submit" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
                      {saving ? 'Saving...' : '💾 Save Profile'}
                    </Button>
                    <Button variant="secondary" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
