import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { t } from '../utils/translations';
import { 
  Search, 
  RotateCw, 
  CreditCard, 
  Coins, 
  Plus, 
  TrendingDown, 
  UserCheck, 
  ArrowDownLeft, 
  DollarSign, 
  BookOpen, 
  Activity,
  History,
  FileCheck
} from 'lucide-react';

export const CreditBook = () => {
  const { language } = useAuth();
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' or 'receipts'
  const [farmers, setFarmers] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Collect Payment Modal
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [farmersRes, collectionsRes] = await Promise.all([
        api.get('/api/v1/farmers'),
        api.get('/api/v1/collections')
      ]);
      setFarmers(farmersRes.data);
      setCollections(collectionsRes.data);
    } catch (err) {
      setError('Failed to fetch credit details or receipt logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCollectClick = (farmer) => {
    setSelectedFarmer(farmer);
    setCollectAmount((farmer.outstandingCredit || 0).toString());
    setPaymentMode('CASH');
    setReferenceNumber('');
    setShowCollectModal(true);
  };

  const handleCloseCollectModal = () => {
    setShowCollectModal(false);
    setSelectedFarmer(null);
    setCollectAmount('');
    setPaymentMode('CASH');
    setReferenceNumber('');
  };

  const handleSaveCollection = async (e) => {
    e.preventDefault();
    if (!selectedFarmer) return;

    const amount = parseFloat(collectAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid payment collection amount.');
      return;
    }

    if (amount > (selectedFarmer.outstandingCredit || 0)) {
      alert(`Collection amount cannot exceed outstanding credit of ₹${selectedFarmer.outstandingCredit}`);
      return;
    }

    try {
      const payload = {
        farmerId: selectedFarmer.id,
        amount,
        paymentMode,
        referenceNumber
      };

      await api.post('/api/v1/collections', payload);
      alert('Credit collection recorded successfully! Farmer outstanding debt has been reduced.');
      
      handleCloseCollectModal();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing credit payment.');
    }
  };

  // Filter farmers with any outstanding credit
  const ledgerFarmers = farmers.filter(f => (f.outstandingCredit || 0) >= 0);

  const filteredFarmers = ledgerFarmers.filter(f => 
    `${f.firstName} ${f.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.farmerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.mobile.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCollections = collections.filter(c => 
    c.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.referenceNumber && c.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.collectedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalOutstanding = farmers.reduce((sum, f) => sum + (f.outstandingCredit || 0), 0);
  const farmersInDebt = farmers.filter(f => (f.outstandingCredit || 0) > 0).length;
  const totalCollections = collections.reduce((sum, c) => sum + (c.amount || 0), 0);

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading credit ledger...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{t('creditBookTitle', language)}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Track outstanding farmer bills, record payments collected, and verify transaction receipts</p>
        </div>
        <div>
          <button onClick={fetchData} className="btn btn-secondary">
            <RotateCw size={16} />
            <span>{t('refresh', language)}</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {/* Credit Summary Cards */}
      <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--error)' }}>
            <Coins size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('totalOutstandingCredit', language)}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--error)' }}>₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due across {farmersInDebt} active farmer accounts</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-primary)' }}>
            <ArrowDownLeft size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('collectionsLogged', language)}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-primary)' }}>₹{totalCollections.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total cash/UPI collections recorded</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'var(--accent-glow)', color: 'var(--accent-secondary)' }}>
            <BookOpen size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('activeLedgers', language)}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{farmers.length}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered farmer profile files</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
        <button 
          onClick={() => { setActiveTab('ledger'); setSearchQuery(''); }}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'ledger' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontSize: '1.05rem',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '0.5rem 1rem',
            borderBottom: activeTab === 'ledger' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            transition: 'var(--transition-smooth)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} />
            <span>{t('outstandingBalancesDirectory', language)}</span>
          </div>
        </button>
        <button 
          onClick={() => { setActiveTab('receipts'); setSearchQuery(''); }}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'receipts' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontSize: '1.05rem',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '0.5rem 1rem',
            borderBottom: activeTab === 'receipts' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            transition: 'var(--transition-smooth)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={18} />
            <span>{t('collectionReceiptsLog', language)}</span>
          </div>
        </button>
      </div>

      {/* Search Filter */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <Search size={20} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="input-field"
          style={{ border: 'none', background: 'transparent', padding: '0' }}
          placeholder={activeTab === 'ledger' ? t('filterLedgerPlaceholder', language) : t('filterCollectionsPlaceholder', language)}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Content based on Active Tab */}
      {activeTab === 'ledger' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredFarmers.length > 0 ? (
            filteredFarmers.map((f) => {
              const outstanding = f.outstandingCredit || 0;
              const hasDebt = outstanding > 0;
              return (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={f.id}
                  className="glass-panel"
                  style={{
                    padding: '1.25rem 1.5rem',
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 1fr 1fr 0.8fr',
                    gap: '1rem',
                    alignItems: 'center',
                    borderLeft: hasDebt ? '4px solid var(--error)' : '1px solid var(--border-glass)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>{f.farmerCode}</span>
                      <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>{f.village || 'No Village'}</span>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.15rem' }}>{f.firstName} {f.lastName}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mobile: {f.mobile} | District: {f.district || 'N/A'}</span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status:</span>
                    <div>
                      <span className={`status-badge ${f.status === 'ACTIVE' ? 'badge-active' : 'badge-suspended'}`}>
                        {f.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('outstandingCredit', language)}:</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: hasDebt ? 'var(--error)' : 'var(--success)' }}>
                      ₹{outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => handleCollectClick(f)}
                      disabled={!hasDebt}
                      className={`btn ${hasDebt ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: hasDebt ? 'pointer' : 'not-allowed', opacity: hasDebt ? 1 : 0.5 }}
                    >
                      <CreditCard size={14} />
                      <span>{t('collectCreditPayment', language)}</span>
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No farmers found.
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('collectionDate', language)}</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('selectFarmerLabel', language)}</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('paymentMethod', language)}</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('refTransId', language)}</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('collectedBy', language)}</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>{t('collectedAmount', language)}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCollections.length > 0 ? (
                filteredCollections.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem' }}>
                      {new Date(c.collectedAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{c.farmerName}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ fontSize: '0.75rem', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 'bold' }}>
                        {c.paymentMode}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      {c.referenceNumber || 'N/A'}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{c.collectedBy}</td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 800, color: 'var(--accent-primary)', textAlign: 'right' }}>
                      ₹{c.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No payment collection receipts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Collect Payment Modal */}
      {showCollectModal && selectedFarmer && (
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
            style={{ width: '100%', maxWidth: '480px', padding: '2rem' }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              {t('collectCreditPayment', language)}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              {t('selectFarmerLabel', language)}: <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{selectedFarmer.firstName} {selectedFarmer.lastName} ({selectedFarmer.farmerCode})</span>
            </p>

            <form onSubmit={handleSaveCollection}>
              
              <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.1)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('outstandingUdhar', language)}:</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--error)' }}>
                  ₹{(selectedFarmer.outstandingCredit || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">{t('collectedAmount', language)} *</label>
                <input 
                  required 
                  type="number" 
                  step="0.01" 
                  className="input-field" 
                  value={collectAmount} 
                  onChange={(e) => setCollectAmount(e.target.value)} 
                  placeholder="Enter amount to pay"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('paymentMethod', language)} *</label>
                <select 
                  required 
                  className="input-field" 
                  value={paymentMode} 
                  onChange={(e) => setPaymentMode(e.target.value)}
                  style={{ background: '#121b16' }}
                >
                  <option value="CASH">{t('cash', language)}</option>
                  <option value="UPI">{t('upi', language)}</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER / NEFT</option>
                  <option value="CHEQUE">CHEQUE</option>
                </select>
              </div>

              {paymentMode !== 'CASH' && (
                <div className="form-group">
                  <label className="form-label">{t('referenceNumber', language)} *</label>
                  <input 
                    required 
                    type="text" 
                    className="input-field" 
                    value={referenceNumber} 
                    onChange={(e) => setReferenceNumber(e.target.value)} 
                    placeholder="e.g. UTR / UPI Ref ID / Cheque No"
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" onClick={handleCloseCollectModal} className="btn btn-secondary">{t('cancel', language)}</button>
                <button type="submit" className="btn btn-primary">{t('logCollection', language)}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
