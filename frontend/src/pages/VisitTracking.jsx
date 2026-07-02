import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { t } from '../utils/translations';
import { 
  Search, 
  RotateCw, 
  Plus, 
  Calendar, 
  MapPin, 
  Clipboard, 
  User, 
  FileText,
  CheckCircle,
  Clock,
  Trash,
  ChevronRight,
  Eye,
  Edit
} from 'lucide-react';

export const VisitTracking = () => {
  const { user, language } = useAuth();
  const [visits, setVisits] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingVisit, setViewingVisit] = useState(null);
  const [editingVisitId, setEditingVisitId] = useState(null);

  // Form Fields
  const [farmerId, setFarmerId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [visitType, setVisitType] = useState('CROP_ADVISORY');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().substring(0, 16));
  const [observations, setObservations] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [status, setStatus] = useState('COMPLETED');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [visitsRes, farmersRes] = await Promise.all([
        api.get('/api/v1/visits'),
        api.get('/api/v1/farmers')
      ]);
      setVisits(visitsRes.data);
      setFarmers(farmersRes.data);

      if (user.role === 'DEALER_ADMIN') {
        const staffRes = await api.get('/api/v1/staff');
        setStaffList(staffRes.data);
      }
    } catch (err) {
      setError('Failed to load visit details or directory lists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingVisitId(null);
    setFarmerId('');
    setStaffId('');
    setVisitType('CROP_ADVISORY');
    setVisitDate(new Date().toISOString().substring(0, 16));
    setObservations('');
    setRecommendations('');
    setStatus('COMPLETED');
  };

  const handleEditVisitClick = (v) => {
    setEditingVisitId(v.id);
    setFarmerId(v.farmerId.toString());
    setStaffId(v.staffId ? v.staffId.toString() : '-1');
    setVisitType(v.visitType);
    setVisitDate(v.visitDate ? v.visitDate.substring(0, 16) : new Date().toISOString().substring(0, 16));
    setObservations(v.observations || '');
    setRecommendations(v.recommendations || '');
    setStatus(v.status);
    setShowAddModal(true);
  };

  const handleVerifyVisit = async (visitId) => {
    try {
      await api.post(`/api/v1/visits/${visitId}/verify`);
      alert('Field visit verified and marked as COMPLETED.');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error verifying visit.');
    }
  };

  const handleSaveVisit = async (e) => {
    e.preventDefault();
    if (!farmerId) {
      alert('Please select a farmer.');
      return;
    }
    
    // For DEALER_ADMIN, staff selection is required
    if (user.role === 'DEALER_ADMIN' && !staffId) {
      alert('Please select a staff member to conduct the visit.');
      return;
    }

    try {
      const payload = {
        farmerId: parseInt(farmerId),
        staffId: user.role === 'DEALER_ADMIN' ? parseInt(staffId) : null,
        visitType,
        visitDate,
        observations,
        recommendations,
        status
      };

      if (editingVisitId) {
        await api.put(`/api/v1/visits/${editingVisitId}`, payload);
        alert('Field visit updated successfully!');
      } else {
        await api.post('/api/v1/visits', payload);
        alert('Advisory field visit logged successfully! This has been registered on the farmer activity timeline.');
      }
      
      handleCloseModal();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error scheduling field visit.');
    }
  };

  const handleDeleteVisit = async (id) => {
    if (!window.confirm('Are you sure you want to delete this field visit log? This will remove it from the timeline.')) {
      return;
    }
    try {
      await api.delete(`/api/v1/visits/${id}`);
      alert('Visit record deleted successfully.');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting visit.');
    }
  };

  const filteredVisits = visits.filter(v => 
    v.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.visitType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.observations && v.observations.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusBadge = (statusVal) => {
    switch (statusVal) {
      case 'COMPLETED': return { bg: 'rgba(16,185,129,0.15)', color: '#34d399', label: 'Completed' };
      case 'PENDING_VERIFICATION': return { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', label: 'Pending Verification' };
      case 'SCHEDULED': return { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', label: 'Scheduled' };
      case 'CANCELLED': return { bg: 'rgba(239,68,68,0.15)', color: '#f87171', label: 'Cancelled' };
      default: return { bg: 'rgba(255,255,255,0.05)', color: '#f3f4f6', label: statusVal };
    }
  };

  const getVisitBadgeColor = (type) => {
    switch (type) {
      case 'CROP_ADVISORY': return { bg: 'rgba(16,185,129,0.15)', color: '#34d399', label: 'Crop Advisory' };
      case 'SOIL_TEST': return { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', label: 'Soil Testing' };
      case 'COLLECTION': return { bg: 'rgba(239,68,68,0.15)', color: '#f87171', label: 'Udhar Recovery' };
      case 'PROMOTIONAL': return { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', label: 'Promotional Meet' };
      default: return { bg: 'rgba(255,255,255,0.05)', color: '#f3f4f6', label: type };
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading field visit tracker...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{t('fieldVisitTrackerTitle', language)}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Schedule field inspections, log soil testing feedback, and track agronomy observations</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchData} className="btn btn-secondary">
            <RotateCw size={16} />
            <span>Refresh</span>
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>{t('scheduleLogVisit', language)}</span>
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
          placeholder="Search visits by farmer, assigned staff, type, or observations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Visits List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredVisits.length > 0 ? (
          filteredVisits.map((v) => {
            const details = getVisitBadgeColor(v.visitType);
            const statusBadge = getStatusBadge(v.status);
            const dateStr = new Date(v.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            return (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={v.id}
                className="glass-panel"
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr',
                  gap: '1.5rem',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', background: details.bg, color: details.color, padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>{details.label}</span>
                    <span style={{ fontSize: '0.7rem', background: statusBadge.bg, color: statusBadge.color, padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>{statusBadge.label}</span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{v.farmerName}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                    <Calendar size={12} />
                    <span>{dateStr}</span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assigned Staff:</span>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <User size={14} style={{ color: 'var(--accent-primary)' }} />
                    <span>{v.staffName}</span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Observations Preview:</span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }} title={v.observations}>
                    {v.observations || 'No observations logged.'}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  {v.status === 'PENDING_VERIFICATION' && user.role === 'DEALER_ADMIN' && (
                    <button 
                      onClick={() => handleVerifyVisit(v.id)}
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem', background: 'rgba(16,185,129,0.1)', color: '#34d399', borderColor: 'rgba(16,185,129,0.2)' }}
                    >
                      <CheckCircle size={14} />
                      <span>Verify</span>
                    </button>
                  )}
                  {v.status === 'SCHEDULED' && (
                    <button 
                      onClick={() => handleEditVisitClick(v)}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem' }}
                    >
                      <Edit size={14} />
                      <span>Edit</span>
                    </button>
                  )}
                  <button 
                    onClick={() => setViewingVisit(v)}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem' }}
                  >
                    <Eye size={14} />
                    <span>View</span>
                  </button>
                  {user.role === 'DEALER_ADMIN' && (
                    <button 
                      onClick={() => handleDeleteVisit(v.id)}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}
                      title="Delete Visit Record"
                    >
                      <Trash size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No visit tracking entries registered.
          </div>
        )}
      </div>

      {/* Add / Schedule Visit Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel"
            style={{ width: '100%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
              {editingVisitId ? 'Update Field Visit Details' : t('scheduleVisitModalTitle', language)}
            </h2>
            <form onSubmit={handleSaveVisit}>
              
              <div className="form-group">
                <label className="form-label">{t('selectFarmer', language)} *</label>
                <select 
                  required 
                  className="input-field" 
                  value={farmerId} 
                  onChange={(e) => setFarmerId(e.target.value)}
                  style={{ background: '#121b16' }}
                >
                  <option value="">-- {t('selectFarmer', language)} --</option>
                  {farmers.map(f => (
                    <option key={f.id} value={f.id}>{f.firstName} {f.lastName} ({f.farmerCode})</option>
                  ))}
                </select>
              </div>

              {/* Show staff selection only for Dealer Admins */}
              {user.role === 'DEALER_ADMIN' ? (
                <div className="form-group">
                  <label className="form-label">{t('assignRepresentative', language)} *</label>
                  <select 
                    required 
                    className="input-field" 
                    value={staffId} 
                    onChange={(e) => setStaffId(e.target.value)}
                    style={{ background: '#121b16' }}
                  >
                    <option value="">-- {t('assignRepresentative', language)} --</option>
                    <option value="-1">Owner (Dealer Admin)</option>
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.employeeCode})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="glass-card" style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Log reports as:</span>
                  <div style={{ fontWeight: 'bold' }}>{user.username} (Staff Profile)</div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('visitTypePurpose', language)} *</label>
                  <select 
                    required 
                    className="input-field" 
                    value={visitType} 
                    onChange={(e) => setVisitType(e.target.value)}
                    style={{ background: '#121b16' }}
                  >
                    <option value="CROP_ADVISORY">{t('cropAdvisoryFarmVisit', language)}</option>
                    <option value="SOIL_TEST">{t('soilTestingSample', language)}</option>
                    <option value="COLLECTION">Udhar / Credit Collection</option>
                    <option value="PROMOTIONAL">Promotional Meetup</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('scheduledDateTime', language)} *</label>
                  <input 
                    required 
                    type="datetime-local" 
                    className="input-field" 
                    value={visitDate} 
                    onChange={(e) => setVisitDate(e.target.value)} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('farmCropObservations', language)}</label>
                <textarea 
                  className="input-field" 
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  value={observations} 
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="e.g. Infestation of aphids found on cotton leaves. High moisture in soil."
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('recommendedAgronomyActions', language)}</label>
                <textarea 
                  className="input-field" 
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  value={recommendations} 
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="e.g. Apply Bayer Confidor pesticide (2ml/L). Reduce irrigation cycle by 2 days."
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('status', language)} *</label>
                <select 
                  required 
                  className="input-field" 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ background: '#121b16' }}
                >
                  <option value="COMPLETED">{t('completed', language)} (Logged Now)</option>
                  <option value="SCHEDULED">{t('scheduled', language)} (Upcoming)</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary">{t('cancel', language)}</button>
                <button type="submit" className="btn btn-primary">{t('scheduleLog', language)}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* View Visit Details Modal */}
      {viewingVisit && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel"
            style={{ width: '100%', maxWidth: '540px', padding: '2rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', background: getVisitBadgeColor(viewingVisit.visitType).bg, color: getVisitBadgeColor(viewingVisit.visitType).color, padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 'bold' }}>
                  {getVisitBadgeColor(viewingVisit.visitType).label}
                </span>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.5rem' }}>Field Visit Details</h2>
              </div>
              <span className={`status-badge ${viewingVisit.status === 'COMPLETED' ? 'badge-active' : 'badge-pending'}`}>
                {viewingVisit.status}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Farmer profile</span>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{viewingVisit.farmerName}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Representative Staff</span>
                <div style={{ fontWeight: 'bold' }}>{viewingVisit.staffName}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Visit Date & Time</span>
                <div style={{ fontWeight: 600 }}>{new Date(viewingVisit.visitDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Field Observations</span>
                <p style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.9rem', whiteSpace: 'pre-line' }}>
                  {viewingVisit.observations || 'No observations recorded.'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Agronomy Recommendations</span>
                <p style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '8px', color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'pre-line' }}>
                  {viewingVisit.recommendations || 'No recommendations recorded.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setViewingVisit(null)} className="btn btn-secondary">Close details</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
