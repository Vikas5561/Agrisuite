import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { RotateCw, Clock, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/v1/dashboard/super-admin');
      setLogs(res.data.recentActivities || []);
    } catch (err) {
      setError('Failed to fetch platform audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.action?.toLowerCase().includes(search.toLowerCase()) ||
    log.ipAddress?.includes(search) ||
    log.browser?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Platform Audit Event Logs</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Audit trail of dealer registrations, staff logins, credentials updates, and platform adjustments</p>
        </div>
        <button onClick={fetchLogs} className="btn btn-secondary">
          <RotateCw size={16} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <Search size={20} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="input-field"
          style={{ border: 'none', background: 'transparent', padding: '0', fontSize: '0.95rem' }}
          placeholder="Filter audit entries by action, IP address, or browser name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' }}>Loading logs registry...</div>
          ) : filteredLogs.length > 0 ? (
            filteredLogs.map((act) => (
              <div key={act.id} style={{
                padding: '1.25rem',
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--accent-primary)', marginBottom: '0.25rem' }}>{act.action}</div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    User ID: <span style={{ color: '#ffffff', fontWeight: 600 }}>{act.userId || 'System'}</span> | IP Address: <span style={{ color: '#ffffff', fontWeight: 600 }}>{act.ipAddress}</span> | Browser: <span style={{ color: '#ffffff', fontWeight: 600 }}>{act.browser}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <Clock size={14} />
                  <span>{new Date(act.timestamp).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
              No audit logs match your search filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
