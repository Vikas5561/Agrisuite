import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { 
  Users, 
  Layers, 
  CreditCard, 
  TrendingUp, 
  Plus, 
  Grid, 
  Settings, 
  DollarSign,
  AlertTriangle,
  RotateCw,
  Clock,
  Briefcase,
  Activity,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { t } from '../utils/translations';
import { useAuth } from '../context/AuthContext';

export const SuperAdminDashboard = () => {
  const { language } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Dealer Form fields
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [address, setAddress] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [planId, setPlanId] = useState('1'); // starter default

  const fetchStats = async () => {
    try {
      setError('');
      const res = await api.get('/api/v1/dashboard/super-admin');
      setStats(res.data);
    } catch (err) {
      setError('Failed to fetch platform dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCreateDealer = async (e) => {
    e.preventDefault();
    try {
      const dealerData = {
        businessName, ownerName, email, mobile, gstNumber, panNumber, address, village, district, state, pinCode
      };
      await api.post(`/api/v1/dealers?planId=${planId}`, dealerData);
      setShowAddModal(false);
      // reset form
      setBusinessName(''); setOwnerName(''); setEmail(''); setMobile(''); setGstNumber(''); setPanNumber('');
      setAddress(''); setVillage(''); setDistrict(''); setState(''); setPinCode('');
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Error registering new dealer.');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading dashboard statistics...</div>;
  }

  return (
    <div>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>SoftEdgeX AgriSuite</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{t('dashboard', language)} - Platform Administration Overview</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchStats} className="btn btn-secondary">
            <RotateCw size={16} />
            <span>Refresh</span>
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Register Dealer</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
        <motion.div whileHover={{ y: -3 }} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--accent-glow)', color: 'var(--accent-primary)' }}>
            <Users size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('dealers', language)}</span>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1, marginTop: '0.2rem' }}>{stats?.totalDealers || 0}</h3>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
            <Users size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('activeDealers', language)}</span>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1, marginTop: '0.2rem' }}>{stats?.activeDealers || 0}</h3>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-secondary)' }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('totalRevenue', language)}</span>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1, marginTop: '0.2rem', color: 'var(--accent-secondary)' }}>
              ₹{(stats?.totalRevenue || 0).toLocaleString('en-IN')}
            </h3>
          </div>
        </motion.div>
      </div>

      {/* Main dashboard splits */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        
        {/* Left Side: Platform Growth & Operational Analysis */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <TrendingUp size={20} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Platform Growth & Operational Analysis</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            
            {/* Conversion & Market Share */}
            <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--accent-secondary)' }}>Market Share & Conversion</h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <span>Dealer Conversion Rate:</span>
                  <span style={{ fontWeight: 'bold' }}>{stats?.totalDealers ? Math.round((stats.activeDealers / stats.totalDealers) * 100) : 0}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${stats?.totalDealers ? (stats.activeDealers / stats.totalDealers) * 100 : 0}%`, height: '100%', background: 'var(--success)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Starter Plan:</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{stats?.planDistribution?.Starter || 0} active</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Standard Plan:</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{stats?.planDistribution?.Standard || 0} active</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Professional Plan:</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{stats?.planDistribution?.Professional || 0} active</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Enterprise Plan:</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{stats?.planDistribution?.Enterprise || 0} active</span>
                </div>
              </div>
            </div>

            {/* Platform Infrastructure Health */}
            <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--accent-primary)' }}>System Operations Health</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>CPU Core Load:</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>4.2% (Safe)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>DB Connection Pool:</span>
                  <span style={{ fontWeight: 'bold' }}>8 / 20 Active</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Avg Response Time:</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>128ms</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Socket Channels:</span>
                  <span style={{ fontWeight: 'bold' }}>3 Connected</span>
                </div>
              </div>
            </div>

          </div>

          <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.05)', border: '1px dashed rgba(16,185,129,0.2)', borderRadius: '8px', fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem', color: 'var(--accent-primary)' }}>Super Admin Insights & Advice:</span>
            Most active subscription profiles (66%) are currently on standard single-month packages. We recommend applying special package upgrade offers via the updated Subscription Plans dashboard to incentivize Standard (3M) and Enterprise (12M) upgrading pathways.
          </div>
        </div>

        {/* Right Side: Plans Distribution & Quick Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Subscription Plans</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stats?.planDistribution && Object.keys(stats.planDistribution).length > 0 ? (
                Object.entries(stats.planDistribution).map(([planName, count]) => (
                  <div key={planName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{planName} Plan</span>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      background: 'var(--accent-glow)',
                      color: 'var(--accent-primary)',
                      fontWeight: 'bold',
                      borderRadius: '6px',
                      fontSize: '0.85rem'
                    }}>{count} active</span>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No subscriptions assigned yet.</div>
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Payment Statuses</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Success Payments:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>{stats?.successPayments || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Failed Payments:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--error)' }}>{stats?.failedPayments || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Pending Checks:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--warning)' }}>{stats?.pendingPayments || 0}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Register Dealer Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          overflowY: 'auto'
        }}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel"
            style={{ width: '100%', maxWidth: '640px', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Register New Fertilizer Dealer</h2>
            <form onSubmit={handleCreateDealer}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Business Name *</label>
                  <input required type="text" className="input-field" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Kisan Fertilizers" />
                </div>
                <div className="form-group">
                  <label className="form-label">Owner Full Name *</label>
                  <input required type="text" className="input-field" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner name" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input required type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dealer@email.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <input required type="text" pattern="\d{10}" className="input-field" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit mobile" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">GST Number (Optional)</label>
                  <input type="text" className="input-field" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="22AAAAA0000A1Z5" />
                </div>
                <div className="form-group">
                  <label className="form-label">PAN Number (Optional)</label>
                  <input type="text" className="input-field" value={panNumber} onChange={(e) => setPanNumber(e.target.value)} placeholder="ABCDE1234F" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Shop Details & Address *</label>
                <input required type="text" className="input-field" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Shop address" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Village *</label>
                  <input required type="text" className="input-field" value={village} onChange={(e) => setVillage(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">District *</label>
                  <input required type="text" className="input-field" value={district} onChange={(e) => setDistrict(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">State *</label>
                  <input required type="text" className="input-field" value={state} onChange={(e) => setState(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">PIN Code *</label>
                  <input required type="text" pattern="\d{6}" className="input-field" value={pinCode} onChange={(e) => setPinCode(e.target.value)} placeholder="6-digit PIN" />
                </div>
                <div className="form-group">
                  <label className="form-label">Assign Plan *</label>
                  <select className="input-field" value={planId} onChange={(e) => setPlanId(e.target.value)} style={{ background: '#121b16' }}>
                    <option value="1">Starter (1 Month - ₹2,000)</option>
                    <option value="2">Standard (3 Months - ₹5,500)</option>
                    <option value="3">Professional (6 Months - ₹11,000)</option>
                    <option value="4">Enterprise (12 Months - ₹20,000)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Dealer</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
