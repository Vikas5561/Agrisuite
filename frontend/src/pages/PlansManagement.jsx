import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { RotateCw, Edit, Plus, Check, Play, AlertCircle, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const PlansManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Edit Modal State
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleDeletePlan = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subscription plan? This action cannot be undone.")) return;
    try {
      await api.delete(`/api/v1/subscriptions/plans/${id}`);
      alert("Subscription plan deleted successfully.");
      fetchPlans();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete subscription plan.");
    }
  };

  // Form Fields
  const [name, setName] = useState('');
  const [durationMonths, setDurationMonths] = useState(1);
  const [price, setPrice] = useState(0.0);
  const [maxStaff, setMaxStaff] = useState(2);
  const [maxStorage, setMaxStorage] = useState(1000);
  const [maxDocuments, setMaxDocuments] = useState(100);
  const [status, setStatus] = useState('ACTIVE');
  const [offerDiscount, setOfferDiscount] = useState(0.0);
  const [offerCode, setOfferCode] = useState('');
  const [offerDescription, setOfferDescription] = useState('');

  const fetchPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/v1/subscriptions/plans');
      setPlans(res.data);
    } catch (err) {
      setError('Failed to fetch platform subscription plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreateClick = () => {
    setSelectedPlan(null);
    setName('');
    setDurationMonths(1);
    setPrice(0.0);
    setMaxStaff(2);
    setMaxStorage(1000);
    setMaxDocuments(100);
    setStatus('ACTIVE');
    setOfferDiscount(0.0);
    setOfferCode('');
    setOfferDescription('');
    setShowEditModal(true);
  };

  const handleEditClick = (p) => {
    setSelectedPlan(p);
    setName(p.name);
    setDurationMonths(p.durationMonths);
    setPrice(p.price);
    setMaxStaff(p.maxStaff || 2);
    setMaxStorage(p.maxStorage || 1000);
    setMaxDocuments(p.maxDocuments || 100);
    setStatus(p.status || 'ACTIVE');
    setOfferDiscount(p.offerDiscount || 0.0);
    setOfferCode(p.offerCode || '');
    setOfferDescription(p.offerDescription || '');
    setShowEditModal(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        durationMonths: parseInt(durationMonths),
        price: parseFloat(price),
        maxStaff: parseInt(maxStaff),
        maxStorage: parseInt(maxStorage),
        maxDocuments: parseInt(maxDocuments),
        status,
        offerDiscount: parseFloat(offerDiscount),
        offerCode: offerCode || null,
        offerDescription: offerDescription || null
      };

      if (selectedPlan) {
        await api.put(`/api/v1/subscriptions/plans/${selectedPlan.id}`, payload);
        alert('Subscription plan updated and saved successfully! Offers applied will be visible to all dealers.');
      } else {
        await api.post('/api/v1/subscriptions/plans', payload);
        alert('Subscription plan created successfully!');
      }
      setShowEditModal(false);
      fetchPlans();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save plan configuration.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Manage Platform Subscription Plans</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Configure existing packages, set resource limits, apply special offer discounts, and toggle plan status</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleCreateClick} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Plus size={16} />
            <span>Create New Plan</span>
          </button>
          <button onClick={fetchPlans} className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <RotateCw size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-secondary)', padding: '2rem' }}>Loading subscription plans configurations...</div>
      ) : (
        <div className="grid-cols-2" style={{ gap: '2rem' }}>
          {plans.map((p) => {
            const hasOffer = p.offerCode && p.offerDiscount > 0;
            const finalPrice = Math.max(0, p.price - (p.offerDiscount || 0));
            return (
              <motion.div 
                whileHover={{ y: -4 }}
                key={p.id} 
                className="glass-panel" 
                style={{ 
                  padding: '2rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  borderTop: p.status === 'ACTIVE' ? '4px solid var(--accent-primary)' : '4px solid var(--text-muted)' 
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{p.name} Package</h2>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      background: p.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', 
                      color: p.status === 'ACTIVE' ? 'var(--accent-primary)' : 'var(--text-muted)', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontWeight: 'bold',
                      textTransform: 'uppercase' 
                    }}>
                      {p.status}
                    </span>
                  </div>

                  {/* Pricing Display */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '1.25rem' }}>
                    {hasOffer ? (
                      <>
                        <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--success)' }}>₹{finalPrice.toLocaleString('en-IN')}</span>
                        <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '1.1rem' }}>₹{p.price.toLocaleString('en-IN')}</span>
                      </>
                    ) : (
                      <span style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff' }}>₹{p.price.toLocaleString('en-IN')}</span>
                    )}
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>/ {p.durationMonths} {p.durationMonths === 1 ? 'Month' : 'Months'}</span>
                  </div>

                  {/* Offer Banner If Any */}
                  {hasOffer && (
                    <div style={{ 
                      background: 'rgba(245,158,11,0.08)', 
                      border: '1px solid rgba(245,158,11,0.2)', 
                      borderRadius: '8px', 
                      padding: '0.75rem', 
                      marginBottom: '1.25rem', 
                      fontSize: '0.85rem' 
                    }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--accent-secondary)', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                        <span>Offer Code: {p.offerCode}</span>
                        <span style={{ fontSize: '0.75rem', background: 'var(--accent-secondary)', color: '#000000', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 'bold' }}>Save ₹{p.offerDiscount}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', margin: '0.15rem 0 0 0', fontSize: '0.8rem' }}>{p.offerDescription}</p>
                    </div>
                  )}

                  {/* Features / Limits */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} style={{ color: 'var(--accent-primary)' }} /> Max Staff Limit: <strong>{p.maxStaff} Users</strong></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} style={{ color: 'var(--accent-primary)' }} /> Storage Allocation: <strong>{p.maxStorage >= 1000 ? `${p.maxStorage / 1000} GB` : `${p.maxStorage} MB`}</strong></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} style={{ color: 'var(--accent-primary)' }} /> Documents Vault: <strong>{p.maxDocuments} Uploads</strong></div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                  <button onClick={() => handleEditClick(p)} className="btn btn-secondary" style={{ flex: 1, display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <Edit size={16} />
                    <span>Edit Plan & Offers</span>
                  </button>
                  <button onClick={() => handleDeletePlan(p.id)} className="btn btn-danger" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete Plan">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit Plan Modal */}
      {showEditModal && (
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
            style={{ width: '100%', maxWidth: '600px', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
              {selectedPlan ? `Edit Subscription Package: ${selectedPlan.name}` : 'Create New Subscription Package'}
            </h2>
            <form onSubmit={handleSavePlan}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Package Name *</label>
                  <input required type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)} style={{ background: '#121b16' }}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Plan Price (₹) *</label>
                  <input required type="number" step="0.01" className="input-field" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (Months) *</label>
                  <input required type="number" className="input-field" value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)} />
                </div>
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '1.5rem 0 0.75rem 0', color: 'var(--accent-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.25rem' }}>Resource Limits Configuration</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Max Staff *</label>
                  <input required type="number" className="input-field" value={maxStaff} onChange={(e) => setMaxStaff(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Storage (MB) *</label>
                  <input required type="number" className="input-field" value={maxStorage} onChange={(e) => setMaxStorage(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Documents *</label>
                  <input required type="number" className="input-field" value={maxDocuments} onChange={(e) => setMaxDocuments(e.target.value)} />
                </div>
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '1.5rem 0 0.75rem 0', color: 'var(--accent-secondary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.25rem' }}>Campaign & Promotional Offers</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Offer Discount Amount (₹)</label>
                  <input type="number" step="0.01" className="input-field" value={offerDiscount} onChange={(e) => setOfferDiscount(e.target.value)} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Coupon / Offer Code</label>
                  <input type="text" className="input-field" value={offerCode} onChange={(e) => setOfferCode(e.target.value)} placeholder="e.g. MONSOON30" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Offer Description Banner (Shown to Dealer)</label>
                <input type="text" className="input-field" value={offerDescription} onChange={(e) => setOfferDescription(e.target.value)} placeholder="e.g. Save ₹2,000 on Standard upgrade valid until Friday!" />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {selectedPlan ? 'Update Plan Details' : 'Create New Plan'}
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};
