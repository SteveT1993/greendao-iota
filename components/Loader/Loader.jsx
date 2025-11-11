import React from 'react';

export default function Loader({ show = false, text = 'Loading...' }) {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <svg width="32" height="32" viewBox="0 0 50 50" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="25" cy="25" r="20" fill="none" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" strokeDasharray="31.4 31.4" transform="rotate(-90 25 25)"></circle>
        </svg>
        <div style={{ fontSize: 14, color: '#111' }}>{text}</div>
        <style>{`@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}</style>
      </div>
    </div>
  );
}
