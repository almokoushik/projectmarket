'use client';
import { motion } from 'framer-motion';

const STAGES = [
  { key: 'open', label: 'Open', icon: '📋', desc: 'Accepting requests' },
  { key: 'assigned', label: 'Assigned', icon: '🤝', desc: 'Solver selected' },
  { key: 'in_progress', label: 'In Progress', icon: '⚙️', desc: 'Work underway' },
  { key: 'completed', label: 'Completed', icon: '✅', desc: 'All tasks done' },
];

const ORDER = { open: 0, assigned: 1, in_progress: 2, completed: 3, cancelled: -1 };

export default function LifecycleBar({ status }) {
  const currentIdx = ORDER[status] ?? 0;

  if (status === 'cancelled') {
    return (
      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--red)' }}>
        <span>🚫</span>
        <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Project Cancelled</span>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {STAGES.map((stage, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const upcoming = i > currentIdx;
          return (
            <div key={stage.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: '0 0 auto' }}>
                <motion.div
                  animate={{
                    background: done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--surface3)',
                    scale: active ? [1, 1.05, 1] : 1,
                    boxShadow: active ? '0 0 20px var(--accent-glow)' : 'none',
                  }}
                  transition={{ duration: 0.4 }}
                  style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', border: `2px solid ${done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--border)'}` }}
                >
                  {done ? (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>✓</motion.span>
                  ) : (
                    stage.icon
                  )}
                </motion.div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: done || active ? 'var(--text)' : 'var(--text3)', whiteSpace: 'nowrap' }}>{stage.label}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text3)', whiteSpace: 'nowrap' }}>{stage.desc}</div>
                </div>
              </div>
              {i < STAGES.length - 1 && (
                <div style={{ flex: 1, height: 2, margin: '0 4px', marginBottom: 28, background: 'var(--border)', borderRadius: 1, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: i < currentIdx ? '100%' : '0%' }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    style={{ height: '100%', background: 'var(--green)', borderRadius: 1 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
