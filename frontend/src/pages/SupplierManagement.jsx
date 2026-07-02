import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { t } from '../utils/translations';
import { 
  Search, 
  RotateCw, 
  Users, 
  Plus, 
  Layers, 
  Package, 
  TrendingUp, 
  Edit, 
  Trash,
  ShoppingBag,
  FileText,
  Calendar,
  DollarSign,
  Briefcase
} from 'lucide-react';

export const SupplierManagement = () => {
  const { language } = useAuth();
  const [activeTab, setActiveTab] = useState('suppliers'); // 'suppliers' or 'purchases'
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState(null);

  // Supplier Form
  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState('Fertilizers');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [pinCode, setPinCode] = useState('');
  const [creditDays, setCreditDays] = useState('30');
  const [creditLimit, setCreditLimit] = useState('100000');

  // Purchase Form
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('50');
  const [purchasePrice, setPurchasePrice] = useState('1000');
  const [gstPercentage, setGstPercentage] = useState('18');
  const [billNumber, setBillNumber] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [suppliersRes, purchasesRes, productsRes] = await Promise.all([
        api.get('/api/v1/suppliers'),
        api.get('/api/v1/purchases'),
        api.get('/api/v1/products')
      ]);
      setSuppliers(suppliersRes.data);
      setPurchases(purchasesRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      setError('Failed to fetch supplier or purchase data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditSupplierClick = (s) => {
    setEditingSupplierId(s.id);
    setCompanyName(s.companyName);
    setCategory(s.category);
    setGstNumber(s.gstNumber || '');
    setPanNumber(s.panNumber || '');
    setContactName(s.contactName || '');
    setMobile(s.mobile || '');
    setEmail(s.email || '');
    setAddress(s.address || '');
    setCity(s.city || '');
    setDistrict(s.district || '');
    setState(s.state || 'Maharashtra');
    setPinCode(s.pinCode || '');
    setCreditDays(s.creditDays?.toString() || '30');
    setCreditLimit(s.creditLimit?.toString() || '100000');
    setShowSupplierModal(true);
  };

  const handleCloseSupplierModal = () => {
    setShowSupplierModal(false);
    setEditingSupplierId(null);
    setCompanyName('');
    setCategory('Fertilizers');
    setGstNumber('');
    setPanNumber('');
    setContactName('');
    setMobile('');
    setEmail('');
    setAddress('');
    setCity('');
    setDistrict('');
    setState('Maharashtra');
    setPinCode('');
    setCreditDays('30');
    setCreditLimit('100000');
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    try {
      const data = {
        companyName, category, gstNumber, panNumber, contactName, mobile, email,
        address, city, district, state, pinCode,
        creditDays: parseInt(creditDays), creditLimit: parseFloat(creditLimit)
      };

      if (editingSupplierId) {
        await api.put(`/api/v1/suppliers/${editingSupplierId}`, data);
        alert('Supplier updated successfully!');
      } else {
        await api.post('/api/v1/suppliers', data);
        alert('Supplier registered successfully!');
      }

      handleCloseSupplierModal();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving supplier info.');
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier? This will remove them from the vendor directory.')) {
      return;
    }
    try {
      await api.delete(`/api/v1/suppliers/${id}`);
      alert('Supplier deleted successfully!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting supplier.');
    }
  };

  const handleSavePurchase = async (e) => {
    e.preventDefault();
    if (!selectedSupplierId || !selectedProductId) {
      alert('Please select both a supplier and a product.');
      return;
    }
    try {
      const data = {
        supplierId: parseInt(selectedSupplierId),
        productId: parseInt(selectedProductId),
        quantity: parseFloat(quantity),
        purchasePrice: parseFloat(purchasePrice),
        gstPercentage: parseFloat(gstPercentage),
        billNumber
      };

      await api.post('/api/v1/purchases', data);
      alert('Purchase entry recorded successfully! Product inventory stock has been increased.');
      
      setShowPurchaseModal(false);
      setSelectedSupplierId('');
      setSelectedProductId('');
      setQuantity('50');
      setPurchasePrice('1000');
      setGstPercentage('18');
      setBillNumber('');

      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording purchase entry.');
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.supplierCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.contactName && s.contactName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredPurchases = purchases.filter(p => 
    p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.billNumber && p.billNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading suppliers & purchases data...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{t('suppliersTitle', language)}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Manage merchant profiles and record purchase logs to auto-increment product stock</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchData} className="btn btn-secondary">
            <RotateCw size={16} />
            <span>Refresh</span>
          </button>
          {activeTab === 'suppliers' ? (
            <button onClick={() => setShowSupplierModal(true)} className="btn btn-primary">
              <Plus size={16} />
              <span>{t('addSupplier', language)}</span>
            </button>
          ) : (
            <button onClick={() => setShowPurchaseModal(true)} className="btn btn-primary">
              <ShoppingBag size={16} />
              <span>Record Purchase (Stock In)</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
        <button 
          onClick={() => { setActiveTab('suppliers'); setSearchQuery(''); }}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'suppliers' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontSize: '1.05rem',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '0.5rem 1rem',
            borderBottom: activeTab === 'suppliers' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            transition: 'var(--transition-smooth)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} />
            <span>Supplier Profiles ({suppliers.length})</span>
          </div>
        </button>
        <button 
          onClick={() => { setActiveTab('purchases'); setSearchQuery(''); }}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'purchases' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontSize: '1.05rem',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '0.5rem 1rem',
            borderBottom: activeTab === 'purchases' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            transition: 'var(--transition-smooth)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={18} />
            <span>Procurement History ({purchases.length})</span>
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
          placeholder={activeTab === 'suppliers' ? "Filter suppliers by company name, supplier code, or contact name..." : "Filter purchase logs by supplier, product name, or bill number..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Content based on Active Tab */}
      {activeTab === 'suppliers' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredSuppliers.length > 0 ? (
            filteredSuppliers.map((s) => (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={s.id}
                className="glass-panel"
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr 1fr 0.8fr',
                  gap: '1rem',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>{s.supplierCode}</span>
                    <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-primary)', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>{s.category}</span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.15rem' }}>{s.companyName}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Contact: {s.contactName} | Mobile: {s.mobile}</span>
                </div>

                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tax Details:</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>GST: {s.gstNumber || 'N/A'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PAN: {s.panNumber || 'N/A'}</div>
                </div>

                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Credit Policy:</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>₹{s.creditLimit?.toLocaleString('en-IN')} Limit</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.creditDays} Days Credit Period</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button 
                    onClick={() => handleEditSupplierClick(s)}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}
                    title="Edit Details"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteSupplier(s.id)}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}
                    title="Delete Supplier"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No registered suppliers found.
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Date & Bill No.</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Supplier</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Product Purchased</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Qty</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Unit Price</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>GST %</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length > 0 ? (
                filteredPurchases.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'var(--transition-smooth)' }} className="table-row-hover">
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: 600 }}>{p.billNumber || 'Direct Stock-In'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(p.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{p.supplierName}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: 600 }}>{p.productName}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--accent-primary)' }}>+{p.quantity}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>₹{p.purchasePrice}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>{p.gstPercentage}%</td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 800, textAlign: 'right' }}>₹{p.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No purchase history logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Supplier Register/Edit Modal */}
      {showSupplierModal && (
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
            style={{ width: '100%', maxWidth: '680px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
              {editingSupplierId ? 'Edit Supplier Profile' : t('registerNewSupplier', language)}
            </h2>
            <form onSubmit={handleSaveSupplier}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('companyFirmName', language)} *</label>
                  <input required type="text" className="input-field" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Bayer Crop Science India" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('category', language)} *</label>
                  <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)} style={{ background: '#121b16' }}>
                    <option value="Fertilizers">Fertilizers</option>
                    <option value="Seeds">Seeds</option>
                    <option value="Pesticides">Pesticides</option>
                    <option value="Insecticides">Insecticides</option>
                    <option value="Herbicides">Herbicides</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('gstin', language)}</label>
                  <input type="text" className="input-field" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="e.g. 27AAAAA1111A1Z1" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('panNumber', language)}</label>
                  <input type="text" className="input-field" value={panNumber} onChange={(e) => setPanNumber(e.target.value)} placeholder="e.g. ABCDE1234F" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('contactPersonName', language)} *</label>
                  <input required type="text" className="input-field" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="e.g. Ramesh Kumar" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('mobileNumber', language)} *</label>
                  <input required type="text" className="input-field" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit number" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('emailId', language)}</label>
                  <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@company.com" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('officeAddress', language)} *</label>
                <input required type="text" className="input-field" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Shop No, Sector, Street Name..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('city', language)} *</label>
                  <input required type="text" className="input-field" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('district', language)} *</label>
                  <input required type="text" className="input-field" value={district} onChange={(e) => setDistrict(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('state', language)} *</label>
                  <input required type="text" className="input-field" value={state} onChange={(e) => setState(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('pincode', language)} *</label>
                  <input required type="text" className="input-field" value={pinCode} onChange={(e) => setPinCode(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('creditDaysLimit', language)} *</label>
                  <input required type="number" className="input-field" value={creditDays} onChange={(e) => setCreditDays(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('creditLimitAmount', language)} *</label>
                  <input required type="number" className="input-field" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" onClick={handleCloseSupplierModal} className="btn btn-secondary">{t('cancel', language)}</button>
                <button type="submit" className="btn btn-primary">
                  {editingSupplierId ? 'Update Supplier' : t('registerSupplier', language)}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Record Purchase Modal */}
      {showPurchaseModal && (
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
            style={{ width: '100%', maxWidth: '580px', padding: '2rem' }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
              Record Supplier Purchase (Stock Intake)
            </h2>
            <form onSubmit={handleSavePurchase}>
              
              <div className="form-group">
                <label className="form-label">Select Supplier *</label>
                <select 
                  required 
                  className="input-field" 
                  value={selectedSupplierId} 
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  style={{ background: '#121b16' }}
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.companyName} ({s.supplierCode})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select Product to Receive *</label>
                <select 
                  required 
                  className="input-field" 
                  value={selectedProductId} 
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  style={{ background: '#121b16' }}
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Code: {p.productCode} | Stock: {p.stock} {p.unit})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Purchase Bill / Invoice No. *</label>
                  <input required type="text" className="input-field" value={billNumber} onChange={(e) => setBillNumber(e.target.value)} placeholder="e.g. INV-2026-987" />
                </div>
                <div className="form-group">
                  <label className="form-label">Intake Quantity *</label>
                  <input required type="number" step="0.01" className="input-field" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Unit Purchase Price (₹) *</label>
                  <input required type="number" step="0.01" className="input-field" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">GST Tax Rate (%) *</label>
                  <input required type="number" step="0.1" className="input-field" value={gstPercentage} onChange={(e) => setGstPercentage(e.target.value)} />
                </div>
              </div>

              {/* Real-time Calculation Preview */}
              {selectedProductId && quantity && purchasePrice && (
                <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>Subtotal:</span>
                    <span>₹{(parseFloat(quantity) * parseFloat(purchasePrice)).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>GST Tax ({gstPercentage}%):</span>
                    <span>₹{(parseFloat(quantity) * parseFloat(purchasePrice) * (parseFloat(gstPercentage) / 100)).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, marginTop: '0.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '0.5rem' }}>
                    <span>Total Bill Cost:</span>
                    <span style={{ color: 'var(--accent-secondary)' }}>
                      ₹{(parseFloat(quantity) * parseFloat(purchasePrice) * (1 + parseFloat(gstPercentage) / 100)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowPurchaseModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Record Stock Intake</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
