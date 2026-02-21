'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RoleBadge } from './ui';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  if (!user) return null;

  const navLinks = {
    admin: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/admin/users', label: 'Manage Users' },
      { href: '/admin/projects', label: 'All Projects' },
    ],
    buyer: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/buyer/projects', label: 'My Projects' },
    ],
    problem_solver: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/marketplace', label: 'Marketplace' },
      { href: '/solver/projects', label: 'My Work' },
      { href: '/solver/profile', label: 'Profile' },
    ],
    user: [{ href: '/dashboard', label: 'Dashboard' }],
  };

  const links = navLinks[user.role] || navLinks.user;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="navbar" ref={menuRef}>
      <div className="container navbar-inner">

        {/* Left: Hamburger (mobile only) + Logo */}
        <div className="navbar-left">
          {/* Hamburger — hidden on desktop via CSS */}
          <button
            type="button"
            className="hamburger"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.svg
                  key="close"
                  initial={{ rotate: -45, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 45, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  width="20" height="20" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="open"
                  initial={{ rotate: 45, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -45, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  width="20" height="20" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                >
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </motion.svg>
              )}
            </AnimatePresence>
          </button>

          {/* Logo */}
          <Link href="/dashboard" className="navbar-logo">
            <div className="navbar-logo-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            {/* Logo text — hidden on mobile via CSS */}
            <span className="navbar-logo-text">ProjectMarket</span>
          </Link>
        </div>

        {/* Center: Desktop nav links — hidden on mobile via CSS */}
        <div className="navbar-links">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} className="navbar-link-wrapper">
                <div className={`navbar-link${active ? ' navbar-link--active' : ''}`}>
                  {label}
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="navbar-link-indicator"
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Right: Theme toggle + Role badge + User name (desktop) + Logout */}
        <div className="navbar-right">
          <button
            type="button"
            className="icon-btn"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          <RoleBadge role={user.role} />

          {/* Username — hidden on mobile via CSS */}
          <span className="navbar-username">{user.name}</span>

          <button
            onClick={handleLogout}
            className="logout-btn"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="mobile-menu"
          >
            <div className="mobile-menu-inner">
              {links.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`mobile-link${active ? ' mobile-link--active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
