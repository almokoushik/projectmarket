'use client';
import { Toaster } from 'react-hot-toast';

export default function ThemeToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--surface2)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '0.9375rem',
        },
        success: { iconTheme: { primary: 'var(--green)', secondary: 'var(--surface2)' } },
        error: { iconTheme: { primary: 'var(--red)', secondary: 'var(--surface2)' } },
      }}
    />
  );
}
