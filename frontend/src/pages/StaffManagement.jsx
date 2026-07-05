import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { t } from '../utils/translations';
import { 
  Search, 
  RotateCw, 
  User, 
  Phone, 
  Mail, 
  Briefcase, 
  Plus, 
  Key, 
  Ban, 
  Check,
  Trash2
} from 'lucide-react';

export const StaffManagement = () => {
  const { language } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffVisits, setStaffVisits] = useState([]);
  const [staffActiveTab, setStaffActiveTab] = useState('profile');

  const handleSelectStaff = async (s) => {
    setSelectedStaff(s);
    setStaffActiveTab('profile');
    try {
      const res = await api.get(`/api/v1/visits/staff/${s.id}`);
      setStaffVisits(res.data);
    } catch (err) {
      console.warn("Could not fetch staff performance visits", err);
    }
  };

  const handleReactivateStaff = async (id) => {
    try {
      await api.put(`/api/v1/staff/${id}/activate`);
      fetchStaff();
    } catch (err) {
      alert('Error reactivating staff account.');
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff member? This will permanently delete their record and login account.")) return;
    try {
      await api.delete(`/api/v1/staff/${id}`);
      fetchStaff();
    } catch (err) {
      alert('Error deleting staff member.');
    }
  };

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [department, setDepartment] = useState('Sales');
  const [designation, setDesignation] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchStaff = async () => {
    try {
      setError('');
      const res = await api.get('/api/v1/staff');
      setStaff(res.data);
    } catch (err) {
      setError('Failed to fetch staff directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      const staffData = {
        firstName, lastName, email, mobile, department, designation, joiningDate
      };
      const res = await api.post('/api/v1/staff', staffData);
      const createdStaff = res.data;

      setShowAddModal(false);
      // Reset
      setFirstName(''); setLastName(''); setEmail(''); setMobile(''); setDesignation('');
      
      // Capture generated credentials
      setCreatedCredentials({
        username: createdStaff.employeeCode.toLowerCase(),
        password: 'Staff@123'
      });
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating staff. Check subscription limits.');
    }
  };

  const handleSuspendStaff = async (id) => {
    try {
      await api.put(`/api/v1/staff/${id}/suspend`);
      fetchStaff();
    } catch (err) {
      alert('Error suspending staff account.');
    }
  };

  const handleResetPassword = async (id) => {
    const password = prompt('Enter new password for staff account (min 8 characters):');
    if (!password) return;
    if (password.length < 8) {
      alert('Password is too short.');
      return;
    }

    try {
      await api.put(`/api/v1/staff/${id}/reset-password`, { password });
      alert('Password reset successfully.');
    } catch (err) {
      alert('Error resetting password.');
    }
  };

  const filteredStaff = staff.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading staff directory...</div>;
  }

  const tabHeaderStyle = (active) => ({
    padding: '0.5rem 1rem',
    border: 'none',
    background: 'transparent',
    color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
    borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.85rem',
    whiteSpace: 'nowrap',
    transition: 'var(--transition-smooth)'
  });

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: selectedStaff ? '1.2fr 1fr' : '1fr', gap: '2rem' }}>
        <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{t('staffDirectoryTitle', language)}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Manage employees, shifts, designations, and permissions</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchStaff} className="btn btn-secondary">
            <RotateCw size={16} />
            <span>Refresh</span>
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>{t('addStaff', language)}</span>
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
          placeholder="Filter staff by employee code, name, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Staff directory grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filteredStaff.length > 0 ? (
          filteredStaff.map((s) => (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={s.id}
              onClick={() => handleSelectStaff(s)}
              className={`glass-panel ${selectedStaff?.id === s.id ? 'active-border' : ''}`}
              style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '1.5rem', alignItems: 'center', cursor: 'pointer' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>{s.employeeCode}</span>
                  <span className={`status-badge badge-${s.status?.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{s.status}</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.2rem' }}>{s.firstName} {s.lastName}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Role: Dealer Staff</span>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}><Phone size={14} /> {s.mobile}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Mail size={14} /> {s.email}</div>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}><Briefcase size={14} /> {s.designation}</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dept: {s.department}</span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => handleResetPassword(s.id)}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                >
                  <Key size={14} />
                  <span>Reset Pwd</span>
                </button>
                {s.status === 'ACTIVE' ? (
                  <button 
                    onClick={() => handleSuspendStaff(s.id)}
                    className="btn btn-danger"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                  >
                    <Ban size={14} />
                    <span>Suspend</span>
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => handleReactivateStaff(s.id)}
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#059669', borderColor: '#059669' }}
                    >
                      <Check size={14} />
                      <span>Reactivate</span>
                    </button>
                    <button 
                      onClick={() => handleDeleteStaff(s.id)}
                      className="btn btn-danger"
                      style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Delete Staff"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No employees registered under this shop yet.
          </div>
        )}
      </div>
      </div>

      {/* Right side: Detailed View */}
      {selectedStaff && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel"
          style={{ padding: '2rem', height: 'fit-content' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>{selectedStaff.employeeCode}</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{selectedStaff.firstName} {selectedStaff.lastName}</h2>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem' }}>
                <span className={`status-badge badge-${selectedStaff.status?.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{selectedStaff.status}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Dept: {selectedStaff.department}</span>
              </div>
            </div>
            <button onClick={() => setSelectedStaff(null)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Close</button>
          </div>

          {/* Details tab switcher */}
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-glass)', marginBottom: '1.5rem' }}>
            <button onClick={() => setStaffActiveTab('profile')} style={tabHeaderStyle(staffActiveTab === 'profile')}>Profile Details</button>
            <button onClick={() => setStaffActiveTab('performance')} style={tabHeaderStyle(staffActiveTab === 'performance')}>Performance & Visits</button>
          </div>

          {/* Tab content */}
          {staffActiveTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)' }}>Designation / Title:</div>
                  <div style={{ fontWeight: 'bold' }}>{selectedStaff.designation || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)' }}>Department:</div>
                  <div style={{ fontWeight: 'bold' }}>{selectedStaff.department || 'N/A'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)' }}>Email Address:</div>
                  <div style={{ fontWeight: 'bold' }}>{selectedStaff.email}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)' }}>Mobile Number:</div>
                  <div style={{ fontWeight: 'bold' }}>{selectedStaff.mobile}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)' }}>Date Joined:</div>
                  <div style={{ fontWeight: 'bold' }}>{selectedStaff.joiningDate ? new Date(selectedStaff.joiningDate).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)' }}>Shift ID:</div>
                  <div style={{ fontWeight: 'bold' }}>{selectedStaff.shiftId || 'Default General'}</div>
                </div>
              </div>
            </div>
          )}

          {staffActiveTab === 'performance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Performance Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Field Visits Completed</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{staffVisits.length}</div>
                </div>
                <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Performance Rating</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>4.8 / 5</div>
                </div>
              </div>

              {/* Visits list */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Field Visits Logged</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '240px', overflowY: 'auto' }}>
                  {staffVisits.length > 0 ? (
                    staffVisits.map((v) => (
                      <div key={v.id} style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--accent-secondary)' }}>{v.farmerName}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{new Date(v.visitDate).toLocaleDateString()}</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 0.25rem 0' }}>{v.observations}</p>
                        <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', padding: '0.1rem 0.35rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>{v.status}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>No field visits recorded by this employee.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>

    {/* Add Staff Modal */}
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
            style={{ width: '100%', maxWidth: '580px', padding: '2.5rem' }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>{t('createEmployeeAccount', language)}</h2>
            <form onSubmit={handleCreateStaff}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('firstName', language)} *</label>
                  <input required type="text" className="input-field" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('lastName', language)} *</label>
                  <input required type="text" className="input-field" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('emailAddress', language)} *</label>
                  <input required type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="employee@shop.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('mobileNumber', language)} *</label>
                  <input required type="text" pattern="\d{10}" className="input-field" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit mobile" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('department', language)} *</label>
                  <select className="input-field" value={department} onChange={(e) => setDepartment(e.target.value)} style={{ background: '#121b16' }}>
                    <option value="Sales">{t('salesCashier', language)}</option>
                    <option value="Inventory">{t('inventoryManagement', language)}</option>
                    <option value="Accounts">{t('accounting', language)}</option>
                    <option value="Administration">{t('shopAdmin', language)}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('designationRoleTitle', language)} *</label>
                  <input required type="text" className="input-field" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Sales Executive" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('joiningDate', language)} *</label>
                <input required type="date" className="input-field" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">{t('cancel', language)}</button>
                <button type="submit" className="btn btn-primary">{t('createAccount', language)}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Staff Credentials Alert Popup */}
      {createdCredentials && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel"
            style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', borderLeft: '4px solid var(--accent-primary)', textAlign: 'center' }}
          >
            <Check size={48} style={{ color: 'var(--accent-primary)', margin: '0 auto 1.5rem auto', background: 'var(--accent-glow)', padding: '0.5rem', borderRadius: '50%' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Employee Created</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              The staff member has been registered. Share these temporary login details with the employee:
            </p>
            <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'left', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Username:</span>
                <code style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{createdCredentials.username}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Temporary Password:</span>
                <code style={{ fontWeight: 'bold', color: 'var(--accent-secondary)' }}>{createdCredentials.password}</code>
              </div>
            </div>
            <button onClick={() => setCreatedCredentials(null)} className="btn btn-primary" style={{ width: '100%' }}>
              Got It, Continue
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
};
