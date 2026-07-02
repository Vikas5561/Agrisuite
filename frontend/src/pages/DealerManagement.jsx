import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
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
  Plus,
  Edit,
  X,
  FileText
} from 'lucide-react';

export const DealerManagement = () => {
  const [dealers, setDealers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDealerId, setEditingDealerId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    mobile: '',
    planId: '',
    status: 'ACTIVE',
    gstNumber: '',
    panNumber: '',
    shopLicenseNumber: '',
    address: '',
    village: '',
    taluka: '',
    district: '',
    state: 'Maharashtra',
    pinCode: ''
  });

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

  const fetchPlans = async () => {
    try {
      const res = await api.get('/api/v1/subscriptions/plans');
      setPlans(res.data);
    } catch (err) {
      console.error('Failed to fetch subscription plans');
    }
  };

  useEffect(() => {
    fetchDealers();
    fetchPlans();
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

  const handleOpenAdd = () => {
    setEditingDealerId(null);
    setFormData({
      businessName: '',
      ownerName: '',
      email: '',
      mobile: '',
      planId: plans[0]?.id || '',
      status: 'ACTIVE',
      gstNumber: '',
      panNumber: '',
      shopLicenseNumber: '',
      address: '',
      village: '',
      taluka: '',
      district: '',
      state: 'Maharashtra',
      pinCode: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dealer) => {
    setEditingDealerId(dealer.id);
    setFormData({
      businessName: dealer.businessName || '',
      ownerName: dealer.ownerName || '',
      email: dealer.email || '',
      mobile: dealer.mobile || '',
      planId: '',
      status: dealer.status || 'ACTIVE',
      gstNumber: dealer.gstNumber || '',
      panNumber: dealer.panNumber || '',
      shopLicenseNumber: dealer.shopLicenseNumber || '',
      address: dealer.address || '',
      village: dealer.village || '',
      taluka: dealer.taluka || '',
      district: dealer.district || '',
      state: dealer.state || '',
      pinCode: dealer.pinCode || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingDealerId) {
        await api.put(`/api/v1/dealers/${editingDealerId}`, formData);
        alert('Dealer details updated successfully.');
      } else {
        const res = await api.post(`/api/v1/dealers?planId=${formData.planId}`, formData);
        const generatedUser = res.data.dealerCode.toLowerCase();
        alert(`Dealer registered successfully!\n\nUsername: ${generatedUser}\nPassword: Welcome@123\n\nPlease copy these credentials for the dealer's first login.`);
      }
      setIsModalOpen(false);
      fetchDealers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving dealer details.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDealers = dealers.filter(d => 
    (d.businessName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.ownerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.dealerCode || '').toLowerCase().includes(searchQuery.toLowerCase())
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
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={16} />
            <span>Add Dealer</span>
          </button>
          <button onClick={fetchDealers} className="btn btn-secondary">
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
              style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr', gap: '1.5rem', alignItems: 'center' }}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}><MapPin size={14} /> {d.village || 'N/A'}, {d.district || 'N/A'}</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.state || 'Maharashtra'} - {d.pinCode || 'N/A'}</span>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => handleOpenEdit(d)}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                >
                  <Edit size={14} />
                  <span>Edit</span>
                </button>
                <button 
                  onClick={() => handleToggleStatus(d.id, d.status)}
                  className={`btn ${d.status === 'ACTIVE' ? 'btn-danger' : 'btn-primary'}`}
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                >
                  {d.status === 'ACTIVE' ? <Ban size={14} /> : <Check size={14} />}
                  <span>{d.status === 'ACTIVE' ? 'Suspend' : 'Activate'}</span>
                </button>
                <button 
                  onClick={() => handleExtend(d.id)}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
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

      {/* Modal for Add / Edit Dealer */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-backdrop" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)'
          }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel"
              style={{
                width: '90%',
                maxWidth: '650px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2rem',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                  {editingDealerId ? 'Edit Dealer Details' : 'Register New Dealer'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Business Name *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Owner Full Name *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Mobile Number *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Email Address *</label>
                  <input
                    type="email"
                    required
                    className="input-field"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                {!editingDealerId ? (
                  <div>
                    <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Initial Subscription Plan *</label>
                    <select
                      required
                      className="input-field"
                      value={formData.planId}
                      onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                      style={{ color: 'var(--text-primary)', background: '#1e293b' }}
                    >
                      <option value="">Select Plan</option>
                      {plans.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.durationMonths}m - ₹{p.price})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Dealer Status</label>
                    <select
                      className="input-field"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      style={{ color: 'var(--text-primary)', background: '#1e293b' }}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>GST Number</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>PAN Number</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.panNumber}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Shop License Number</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.shopLicenseNumber}
                    onChange={(e) => setFormData({ ...formData, shopLicenseNumber: e.target.value })}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Shop Address</label>
                  <textarea
                    className="input-field"
                    rows="2"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    style={{ resize: 'none' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Village / Town</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Taluka</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.taluka}
                    onChange={(e) => setFormData({ ...formData, taluka: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>District</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>State</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Pin Code</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.pinCode}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                  />
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save Dealer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
