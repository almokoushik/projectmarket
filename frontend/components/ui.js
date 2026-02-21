'use client';
import { motion } from 'framer-motion';

// Role Badge
export function RoleBadge({ role }) {
  const config = {
    admin: { bg: 'rgba(108,99,255,0.15)', color: '#8b84ff', border: 'rgba(108,99,255,0.3)', label: 'Admin' },
    buyer: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)', label: 'Buyer' },
    problem_solver: { bg: 'rgba(6,182,212,0.12)', color: '#06b6d4', border: 'rgba(6,182,212,0.3)', label: 'Problem Solver' },
    user: { bg: 'rgba(255,255,255,0.06)', color: '#9898b0', border: 'rgba(255,255,255,0.1)', label: 'User' },
  };
  const c = config[role] || config.user;
  return (
    <span style={{ padding: '4px 10px', background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: 20, fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  );
}

// Status Badge
export function StatusBadge({ status }) {
  const config = {
    open: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
    assigned: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
    in_progress: { bg: 'rgba(108,99,255,0.12)', color: '#8b84ff', border: 'rgba(108,99,255,0.3)' },
    completed: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
    cancelled: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
    todo: { bg: 'rgba(255,255,255,0.06)', color: '#9898b0', border: 'rgba(255,255,255,0.1)' },
    submitted: { bg: 'rgba(6,182,212,0.12)', color: '#06b6d4', border: 'rgba(6,182,212,0.3)' },
    rejected: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
    pending: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
    accepted: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
  };
  const c = config[status] || config.todo;
  const label = status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  return (
    <span style={{ padding: '4px 10px', background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

// Card component
export function Card({ children, style, onClick, hoverable }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hoverable ? { y: -2, borderColor: 'var(--border2)' } : undefined}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 24,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.2s',
        ...style
      }}
    >
      {children}
    </motion.div>
  );
}

// Button
export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button', style }) {
  const variants = {
    primary: { bg: 'var(--accent)', color: 'white', border: 'transparent' },
    secondary: { bg: 'var(--surface2)', color: 'var(--text)', border: 'var(--border)' },
    danger: { bg: 'rgba(239,68,68,0.15)', color: 'var(--red)', border: 'rgba(239,68,68,0.3)' },
    success: { bg: 'rgba(34,197,94,0.15)', color: 'var(--green)', border: 'rgba(34,197,94,0.3)' },
    ghost: { bg: 'transparent', color: 'var(--text2)', border: 'transparent' },
  };
  const sizes = {
    sm: { padding: '8px 16px', fontSize: '0.875rem' },
    md: { padding: '10px 20px', fontSize: '0.9375rem' },
    lg: { padding: '12px 28px', fontSize: '1rem' },
  };
  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      style={{
        ...s,
        background: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        borderRadius: 'var(--radius-sm)',
        fontWeight: 700,
        fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        ...style
      }}
    >
      {children}
    </motion.button>
  );
}

// Input
export function Input({ label, value, onChange, type = 'text', placeholder, required, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: '0.9375rem', color: 'var(--text2)', fontWeight: 500 }}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{
          padding: '12px 16px',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text)',
          fontSize: '1rem',
          fontFamily: 'inherit',
          outline: 'none',
          transition: 'border-color 0.2s',
          ...style
        }}
      />
    </div>
  );
}

// Textarea
export function Textarea({ label, value, onChange, placeholder, rows = 3, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: '0.9375rem', color: 'var(--text2)', fontWeight: 500 }}>{label}</label>}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        style={{
          padding: '12px 16px',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text)',
          fontSize: '1rem',
          fontFamily: 'inherit',
          outline: 'none',
          resize: 'vertical',
          minHeight: 80,
        }}
      />
    </div>
  );
}

// Empty state
export function EmptyState({ icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text3)' }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>{title}</div>
      {description && <div style={{ fontSize: '1rem', marginBottom: 20, maxWidth: 360, margin: '0 auto 20px' }}>{description}</div>}
      {action}
    </motion.div>
  );
}

// Spinner
export function Spinner({ size = 24 }) {
  return (
    <div style={{ width: size, height: size, border: `2px solid var(--border)`, borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  );
}

// Modal
export function Modal({ isOpen, onClose, title, children, width = 480 }) {
  if (!isOpen) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28, width: '100%', maxWidth: width, maxHeight: '90vh', overflowY: 'auto' }}
      >
        {title && <div style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {title}
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1, padding: 4 }}>×</button>
        </div>}
        {children}
      </motion.div>
    </motion.div>
  );
}

// Progress bar
export function ProgressBar({ value, max = 100, color = 'var(--accent)' }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ background: 'var(--surface2)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5 }}
        style={{ height: '100%', background: color, borderRadius: 4 }}
      />
    </div>
  );
}
