import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { t } from '../utils/translations';
import { 
  Settings, 
  RotateCw, 
  User, 
  Briefcase, 
  Globe, 
  ShieldAlert, 
  Clock, 
  Terminal, 
  XOctagon, 
  Save,
  Laptop
} from 'lucide-react';

export const SettingsPage = () => {
  const { user, language: globalLanguage, changeLanguage, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'preferences', 'sessions', 'audit'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Business Profile State
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [shopLicenseNumber, setShopLicenseNumber] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [village, setVillage] = useState('');
  const [taluka, setTaluka] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 2. Preferences State
  const [language, setLanguage] = useState('English');
  const [currency, setCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [financialYear, setFinancialYear] = useState('April-March');
  const [dateFormat, setDateFormat] = useState('dd-MM-yyyy');
  const [businessHours, setBusinessHours] = useState('10 AM - 6 PM');

  // 3. Sessions & Audit States
  const [sessions, setSessions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch dealer business profile & settings
      const [dealerRes, settingsRes] = await Promise.all([
        api.get(`/api/v1/dealers/${user.dealerId}`),
        api.get(`/api/v1/dealers/${user.dealerId}/settings`)
      ]);

      const d = dealerRes.data;
      setBusinessName(d.businessName || '');
      setOwnerName(d.ownerName || '');
      setGstNumber(d.gstNumber || '');
      setPanNumber(d.panNumber || '');
      setShopLicenseNumber(d.shopLicenseNumber || '');
      setMobile(d.mobile || '');
      setAddress(d.address || '');
      setVillage(d.village || '');
      setTaluka(d.taluka || '');
      setDistrict(d.district || '');
      setState(d.state || '');
      setPinCode(d.pinCode || '');
      setLogoUrl(d.logoUrl || '');

      const s = settingsRes.data;
      setLanguage(s.language || 'English');
      setCurrency(s.currency || 'INR');
      setTimezone(s.timezone || 'Asia/Kolkata');
      setFinancialYear(s.financialYear || 'April-March');
      setDateFormat(s.dateFormat || 'dd-MM-yyyy');
      setBusinessHours(s.businessHours || '10 AM - 6 PM');

      // Fetch admin sessions & audit logs
      const [sessionsRes, logsRes] = await Promise.all([
        api.get('/api/v1/admin/sessions'),
        api.get('/api/v1/admin/audit-logs')
      ]);
      setSessions(sessionsRes.data);
      setAuditLogs(logsRes.data);
    } catch (err) {
      setError('Failed to load dealer profile configuration settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        businessName, ownerName, gstNumber, panNumber, shopLicenseNumber, mobile,
        address, village, taluka, district, state, pinCode, logoUrl
      };
      await api.put(`/api/v1/dealers/${user.dealerId}`, payload);
      updateUser({ businessName, logoUrl, displayName: ownerName });
      alert('Business profile updated successfully!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating business profile.');
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        language, currency, timezone, financialYear, dateFormat, businessHours
      };
      await api.put(`/api/v1/dealers/${user.dealerId}/settings`, payload);
      changeLanguage(language);
      alert('System preferences saved successfully!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving settings preferences.');
    }
  };

  const handleTerminateSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to terminate this staff session? This will force logout their active browser session.')) {
      return;
    }
    try {
      await api.post(`/api/v1/admin/sessions/${sessionId}/terminate`);
      alert('Session terminated.');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error terminating session.');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading configuration console...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{t('systemSettings', globalLanguage)}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Configure shop parameters, edit system language/currency, manage active staff sessions, and inspect security audit logs</p>
        </div>
        <div>
          <button onClick={fetchData} className="btn btn-secondary">
            <RotateCw size={16} />
            <span>Sync Settings</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
        {[
          { id: 'profile', label: t('businessProfile', globalLanguage), icon: Briefcase },
          { id: 'preferences', label: t('systemPreferences', globalLanguage), icon: Globe },
          { id: 'sessions', label: t('activeUserSessions', globalLanguage), icon: Laptop },
          { id: 'audit', label: t('securityAuditTrail', globalLanguage), icon: ShieldAlert }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontSize: '1.05rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                transition: 'var(--transition-smooth)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon size={18} />
                <span>{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'profile' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>{t('editBusinessProfileDetails', globalLanguage)}</h2>
          <form onSubmit={handleSaveProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('shopBusinessName', globalLanguage)} *</label>
                <input required type="text" className="input-field" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('ownerName', globalLanguage)} *</label>
                <input required type="text" className="input-field" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('gstinLabel', globalLanguage)}</label>
                <input type="text" className="input-field" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="27AAAAA1111A1Z1" />
              </div>
              <div className="form-group">
                <label className="form-label">{t('panLabel', globalLanguage)}</label>
                <input type="text" className="input-field" value={panNumber} onChange={(e) => setPanNumber(e.target.value)} placeholder="ABCDE1234F" />
              </div>
              <div className="form-group">
                <label className="form-label">{t('shopLicenseNumberLabel', globalLanguage)}</label>
                <input type="text" className="input-field" value={shopLicenseNumber} onChange={(e) => setShopLicenseNumber(e.target.value)} placeholder="LIC/2026/09" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('contactMobile', globalLanguage)} *</label>
                <input required type="text" className="input-field" value={mobile} onChange={(e) => setMobile(e.target.value)} />
              </div>
              
              <div className="form-group">
                <label className="form-label">{t('companyStoreLogo', globalLanguage)}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.25rem' }}>
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt="Company Logo Preview" 
                      style={{ height: '48px', width: 'auto', borderRadius: '6px', objectFit: 'contain', border: '1px solid var(--border-glass)', padding: '0.2rem', background: '#ffffff' }} 
                    />
                  ) : (
                    <div style={{ height: '48px', width: '80px', borderRadius: '6px', border: '1px dashed var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {t('noLogo', globalLanguage)}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      id="dealer-logo-file-settings" 
                      style={{ display: 'none' }} 
                      onChange={handleLogoUpload} 
                    />
                    <label 
                      htmlFor="dealer-logo-file-settings" 
                      className="btn btn-secondary" 
                      style={{ cursor: 'pointer', display: 'inline-block', padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                    >
                      {t('chooseFile', globalLanguage)}
                    </label>
                    {logoUrl && (
                      <button 
                        type="button" 
                        onClick={() => setLogoUrl('')} 
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: 'var(--error)', borderColor: 'rgba(239,68,68,0.2)' }}
                      >
                        {t('clear', globalLanguage)}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('shopAddress', globalLanguage)} *</label>
              <input required type="text" className="input-field" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('village', globalLanguage)}</label>
                <input type="text" className="input-field" value={village} onChange={(e) => setVillage(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('taluka', globalLanguage)}</label>
                <input type="text" className="input-field" value={taluka} onChange={(e) => setTaluka(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('district', globalLanguage)}</label>
                <input type="text" className="input-field" value={district} onChange={(e) => setDistrict(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('state', globalLanguage)}</label>
                <input type="text" className="input-field" value={state} onChange={(e) => setState(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('pincode', globalLanguage)}</label>
                <input type="text" className="input-field" value={pinCode} onChange={(e) => setPinCode(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button type="submit" className="btn btn-primary">
                <Save size={16} />
                <span>{t('saveBusinessProfile', globalLanguage)}</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {activeTab === 'preferences' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>{t('systemPreferences', globalLanguage)}</h2>
          <form onSubmit={handleSavePreferences}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('languagePreference', globalLanguage)} *</label>
                <select className="input-field" value={language} onChange={(e) => setLanguage(e.target.value)} style={{ background: '#121b16' }}>
                  <option value="English">English</option>
                  <option value="Marathi">Marathi (मराठी)</option>
                  <option value="Hindi">Hindi (हिन्दी)</option>
                  <option value="Bengali">Bengali (বাংলা)</option>
                  <option value="Telugu">Telugu (తెలుగు)</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Gujarati">Gujarati (ગુજરાती)</option>
                  <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                  <option value="Odia">Odia (ଓଡ଼ିଆ)</option>
                  <option value="Malayalam">Malayalam (മലയാളം)</option>
                  <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                  <option value="Assamese">Assamese (असमीया)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('currencySymbol', globalLanguage)} *</label>
                <select className="input-field" value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ background: '#121b16' }}>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('timezoneConfiguration', globalLanguage)} *</label>
                <select className="input-field" value={timezone} onChange={(e) => setTimezone(e.target.value)} style={{ background: '#121b16' }}>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">Coordinated Universal Time (UTC)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('activeFinancialYear', globalLanguage)} *</label>
                <input required type="text" className="input-field" value={financialYear} onChange={(e) => setFinancialYear(e.target.value)} placeholder="e.g. April-March" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('systemDateFormat', globalLanguage)} *</label>
                <select className="input-field" value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} style={{ background: '#121b16' }}>
                  <option value="dd-MM-yyyy">DD-MM-YYYY (e.g. 29-06-2026)</option>
                  <option value="yyyy-MM-dd">YYYY-MM-DD (e.g. 2026-06-29)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('defaultShopHours', globalLanguage)}</label>
                <input type="text" className="input-field" value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} placeholder="10 AM - 6 PM" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button type="submit" className="btn btn-primary">
                <Save size={16} />
                <span>Save Preferences</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {activeTab === 'sessions' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Currently Online Sessions</h2>
            <span style={{ fontSize: '0.8rem', background: 'var(--accent-glow)', color: 'var(--accent-primary)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 'bold' }}>
              {sessions.length} Session(s) Active
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>User Account</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>IP Address</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>Browser / Device</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>Login Time</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length > 0 ? (
                sessions.map(sess => (
                  <tr key={sess.sessionId} style={{ borderBottom: '1px solid var(--border-glass)' }} className="table-row-hover">
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 'bold' }}>{sess.username}</td>
                    <td style={{ padding: '1rem 1.5rem', fontFamily: 'monospace' }}>{sess.ipAddress}</td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {sess.browser || 'N/A'} ({sess.device || 'N/A'})
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>
                      {new Date(sess.loginTime).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleTerminateSession(sess.sessionId)} 
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                      >
                        <XOctagon size={12} />
                        <span>Force Logout</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No other active sessions.</td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>
      )}

      {activeTab === 'audit' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-glass)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Immutable Security Audit Logs</h2>
          </div>

          <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>Timestamp</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>Action Event</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>Operator IP</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>Browser / Device</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length > 0 ? (
                  auditLogs.map(log => {
                    const dateStr = new Date(log.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-glass)' }} className="table-row-hover">
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>{dateStr}</td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            gap: '0.25rem',
                            alignItems: 'center',
                            fontWeight: 'bold',
                            fontSize: '0.85rem',
                            color: log.action.toLowerCase().includes('failed') || log.action.toLowerCase().includes('lock') ? 'var(--error)' : 'var(--accent-primary)'
                          }}>
                            <Terminal size={12} />
                            <span>{log.action}</span>
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>{log.ipAddress}</td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {log.browser || 'N/A'} ({log.device || 'N/A'})
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No audit events logged.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};
