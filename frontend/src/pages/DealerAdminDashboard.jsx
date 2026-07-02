import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { 
  Users, 
  Package, 
  Layers, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle,
  Plus, 
  ArrowUpRight,
  RotateCw,
  Clock,
  Briefcase
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import { t } from '../utils/translations';
import { useAuth } from '../context/AuthContext';

export const DealerAdminDashboard = () => {
  const { language } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setError('');
      const res = await api.get('/api/v1/dashboard/dealer-admin');
      setStats(res.data);
    } catch (err) {
      setError('Failed to load dealer shop dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading shop metrics...</div>;
  }

  return (
    <div>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{t('dashboard', language)}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{t('overviewBusiness', language)}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchStats} className="btn btn-secondary">
            <RotateCw size={16} />
            <span>{t('refresh', language)}</span>
          </button>
          <Link to="/dealer-admin/farmers" className="btn btn-primary">
            <Plus size={16} />
            <span>{t('addFarmer', language)}</span>
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {/* Subscription Alarm Banner */}
      {stats?.remainingDays <= 7 && (
        <div className="glass-panel" style={{
          padding: '1.25rem 2rem',
          borderLeft: '4px solid var(--warning)',
          background: 'rgba(245, 158, 11, 0.1)',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={24} style={{ color: 'var(--warning)' }} />
            <div>
              <div style={{ fontWeight: 'bold' }}>{t('subExpiringSoon', language)}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {t('subExpiringMsg', language)} ({stats?.subscriptionPlan} plan - {stats?.remainingDays} {t('remainingDays', language)})
              </div>
            </div>
          </div>
          <Link to="/dealer-admin/subscription" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
            {t('renewNow', language)}
          </Link>
        </div>
      )}

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        <Link 
          to="/dealer-admin/billing" 
          className="glass-panel" 
          style={{ padding: '1.5rem', textDecoration: 'none', color: 'inherit', display: 'block', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.4)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('todaySales', language)}</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.2rem' }}>
            ₹{stats?.todaySales?.toLocaleString('en-IN')}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('viewBillingHistory', language)}</span>
        </Link>

        <Link 
          to="/dealer-admin/farmers" 
          className="glass-panel" 
          style={{ padding: '1.5rem', textDecoration: 'none', color: 'inherit', display: 'block', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.4)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('outstandingCredit', language)}</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f87171', marginTop: '0.2rem' }}>
            ₹{stats?.outstandingCredit?.toLocaleString('en-IN')}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('manageOutstandingBalances', language)}</span>
        </Link>

        <Link 
          to="/dealer-admin/farmers" 
          className="glass-panel" 
          style={{ padding: '1.5rem', textDecoration: 'none', color: 'inherit', display: 'block', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.4)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('totalFarmers', language)}</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.2rem' }}>
            {stats?.totalFarmers || 0}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('viewRegisteredKisan', language)}</span>
        </Link>

        <Link 
          to="/dealer-admin/products" 
          className="glass-panel" 
          style={{ padding: '1.5rem', textDecoration: 'none', color: 'inherit', display: 'block', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.4)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('lowStockCount', language)}</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: stats?.lowStockCount > 0 ? 'var(--error)' : 'var(--text-primary)', marginTop: '0.2rem' }}>
            {stats?.lowStockCount || 0}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('viewLowStockCatalog', language)}</span>
        </Link>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Low Stock Alerts list */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <AlertTriangle size={20} style={{ color: 'var(--error)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t('lowStockMonitor', language)}</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
              stats.lowStockProducts.map((p) => (
                <div key={p.id} style={{
                  padding: '1rem',
                  background: 'rgba(239, 68, 68, 0.03)',
                  border: '1px solid rgba(239, 68, 68, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('brand', language)}: {p.brand} | {t('categoryLabel', language)}: {p.category}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--error)' }}>{p.stock} {p.unit} {t('left', language)}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('minStock', language)}: {p.minimumStock}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--success)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                <CheckIcon />
                <span>{t('allStockHealthy', language)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckIcon = () => (
  <div style={{
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.1)',
    color: 'var(--success)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
  </div>
);
