import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Save, Laptop, ShieldAlert, Key, Globe } from 'lucide-react';
import { t } from '../utils/translations';

export const SuperAdminSettings = () => {
  const { user, language, changeLanguage } = useAuth();
  
  // Platform parameters state
  const [platformName, setPlatformName] = useState(localStorage.getItem('platformName') || 'SoftEdgeX AgriSuite Inc.');
  const [platformGst, setPlatformGst] = useState(localStorage.getItem('platformGst') || '27SFTEX8876P1Z9');
  const [platformEmail, setPlatformEmail] = useState(localStorage.getItem('platformEmail') || 'billing@softedgex.com');
  const [platformAddress, setPlatformAddress] = useState(localStorage.getItem('platformAddress') || 'PO Box 3172, Redondo Beach, California 90277');
  const [platformLogo, setPlatformLogo] = useState(localStorage.getItem('platformLogo') || '');

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPlatformLogo(reader.result); // Base64
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('platformName', platformName);
    localStorage.setItem('platformGst', platformGst);
    localStorage.setItem('platformEmail', platformEmail);
    localStorage.setItem('platformAddress', platformAddress);
    localStorage.setItem('platformLogo', platformLogo);
    alert('Super Admin Platform settings saved successfully! Logo and billing details are synchronized with subscription invoices.');
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{t('systemSettings', language)}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Configure platform parameters, corporate identity, billing logo, and administrative access details</p>
      </div>

      <div className="grid-cols-1" style={{ gap: '2rem' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel" style={{ padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>Corporate Platform Identity</h2>
          
          <form onSubmit={handleSaveSettings}>
            
            {/* Logo Upload Widget */}
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Platform Corporate Logo *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
                {platformLogo ? (
                  <img 
                    src={platformLogo} 
                    alt="Corporate Logo Preview" 
                    style={{ height: '64px', width: 'auto', borderRadius: '8px', objectFit: 'contain', border: '1px solid var(--border-glass)', padding: '0.25rem', background: '#ffffff' }} 
                  />
                ) : (
                  <div style={{ height: '64px', width: '120px', borderRadius: '8px', border: '2px dashed var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    No Logo Selected
                  </div>
                )}
                <div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    id="superadmin-logo-file" 
                    style={{ display: 'none' }} 
                    onChange={handleLogoUpload} 
                  />
                  <label 
                    htmlFor="superadmin-logo-file" 
                    className="btn btn-secondary" 
                    style={{ cursor: 'pointer', display: 'inline-block', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                  >
                    Upload Corporate Logo
                  </label>
                  {platformLogo && (
                    <button 
                      type="button" 
                      onClick={() => setPlatformLogo('')} 
                      className="btn btn-secondary" 
                      style={{ marginLeft: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.8rem', color: 'var(--error)', borderColor: 'rgba(239,68,68,0.2)' }}
                    >
                      Remove Logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Corporate Name *</label>
                <input required type="text" className="input-field" value={platformName} onChange={(e) => setPlatformName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">GSTIN (GST Number) *</label>
                <input required type="text" className="input-field" value={platformGst} onChange={(e) => setPlatformGst(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Contact / Billing Email *</label>
              <input required type="email" className="input-field" value={platformEmail} onChange={(e) => setPlatformEmail(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Corporate Headquarters Address *</label>
              <input required type="text" className="input-field" value={platformAddress} onChange={(e) => setPlatformAddress(e.target.value)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button type="submit" className="btn btn-primary">
                <Save size={16} />
                <span>Save Platform Configurations</span>
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </div>
  );
};
