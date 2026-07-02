import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  Search, 
  RotateCw, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  AlertCircle, 
  Clock, 
  Ban, 
  Check, 
  Plus
} from 'lucide-react';

export const DealerManagement = () => {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDealers = async () => {
    try {
      setError('');
      const res = await api.get('/api/v1/dealers');
      setDealers(res.data);
    } catch (err) {
      setError('Failed to fetch dealers directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const endpoint = currentStatus === 'ACTIVE' ? `/api/v1/dealers/${id}/suspend` : `/api/v1/dealers/${id}/activate`;
      await api.put(endpoint);
      fetchDealers();
    } catch (err) {
      alert('Error updating dealer status.');
    }
  };

  const handleExtend = async (id) => {
    const monthsStr = prompt('Enter number of months to extend subscription:');
    if (!monthsStr) return;
    const months = parseInt(monthsStr);
    if (isNaN(months) || months <= 0) {
      alert('Invalid duration.');
      return;
    }

    try {
      await api.post(`/api/v1/subscriptions/extend?dealerId=${id}&months=${months}`);
      alert('Subscription extended successfully');
      fetchDealers();
    } catch (err) {
      alert('Error extending subscription.');
    }
  };

  const filteredDealers = dealers.filter(d => 
    d.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.dealerCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading dealers list...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Registered Dealers</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>View and manage multi-tenant fertilizer shops</p>
        </div>
        <button onClick={fetchDealers} className="btn btn-secondary">
          <RotateCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {/* Search Filter */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <Search size={20} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="input-field"
          style={{ border: 'none', background: 'transparent', padding: '0' }}
          placeholder="Filter dealers by code, business name, or owner..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Dealers Directory Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filteredDealers.length > 0 ? (
          filteredDealers.map((d) => (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={d.id}
              className="glass-panel"
              style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '1.5rem', alignItems: 'center' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 'bold' }}>{d.dealerCode}</span>
                  <span className={`status-badge badge-${d.status?.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{d.status}</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.2rem' }}>{d.businessName}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Owner: {d.ownerName}</span>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}><Phone size={14} /> {d.mobile}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Mail size={14} /> {d.email}</div>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}><MapPin size={14} /> {d.village}, {d.district}</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.state} - {d.pinCode}</span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => handleToggleStatus(d.id, d.status)}
                  className={`btn ${d.status === 'ACTIVE' ? 'btn-danger' : 'btn-primary'}`}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                >
                  {d.status === 'ACTIVE' ? <Ban size={14} /> : <Check size={14} />}
                  <span>{d.status === 'ACTIVE' ? 'Suspend' : 'Activate'}</span>
                </button>
                <button 
                  onClick={() => handleExtend(d.id)}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                >
                  <Clock size={14} />
                  <span>Extend</span>
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No registered fertilizer dealers match your search query.
          </div>
        )}
      </div>
    </div>
  );
};
