import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { t } from '../utils/translations';
import { 
  Search, 
  RotateCw, 
  User, 
  Phone, 
  MapPin, 
  Layers, 
  Plus, 
  Trash, 
  Clock, 
  FileText, 
  Briefcase,
  TrendingUp,
  Edit,
  Upload,
  Download
} from 'lucide-react';

export const FarmerManagement = () => {
  const { language } = useAuth();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkPreview, setBulkPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  
  // Tabs for detailed view
  const [activeTab, setActiveTab] = useState('overview');
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [timeline, setTimeline] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [visitHistory, setVisitHistory] = useState([]);

  // Sales Modal states
  const [showSellModal, setShowSellModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [sellProductId, setSellProductId] = useState('');
  const [sellQuantity, setSellQuantity] = useState('1');
  const [sellPaymentMethod, setSellPaymentMethod] = useState('Cash');

  // Editing Farmer state
  const [editingFarmerId, setEditingFarmerId] = useState(null);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [village, setVillage] = useState('');
  const [taluka, setTaluka] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [farmSize, setFarmSize] = useState('5.0');
  const [farmUnit, setFarmUnit] = useState('Acre');
  const [soilType, setSoilType] = useState('Black Clay');
  const [irrigationType, setIrrigationType] = useState('Well Water');
  const [primaryCrop, setPrimaryCrop] = useState('Cotton');
  const [outstandingCredit, setOutstandingCredit] = useState('0');

  const fetchFarmers = async () => {
    try {
      setError('');
      const res = await api.get('/api/v1/farmers');
      setFarmers(res.data);
    } catch (err) {
      setError('Failed to fetch farmer profiles registry.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/v1/products');
      setProducts(res.data);
    } catch (err) {
      console.warn("Could not load products for sales dropdown", err);
    }
  };

  const parseCSV = (text) => {
    const lines = text.split('\n');
    if (lines.length <= 1) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const results = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = [];
      let currentVal = '';
      let insideQuotes = false;
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"' || char === "'") {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      results.push(row);
    }
    return results;
  };

  const handleFileParse = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target.result);
      setBulkPreview(parsed);
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "firstName,lastName,mobile,outstandingCredit,village,taluka,district,state,pinCode,farmSize,farmUnit,primaryCrop\n"
      + "Ramesh,Patil,9876543210,0,Sinnar,Sinnar,Nashik,Maharashtra,422103,4.5,Acre,Cotton\n"
      + "Suresh,Deshmukh,8876543210,5000,Ozar,Niphad,Nashik,Maharashtra,422206,3.0,Acre,Grapes";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "farmers_sample_format.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmImport = async () => {
    setImporting(true);
    try {
      await api.post('/api/v1/farmers/bulk', bulkPreview);
      alert('Farmers bulk imported successfully!');
      setBulkPreview([]);
      setShowBulkUpload(false);
      fetchFarmers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error bulk importing farmers.');
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
    fetchProducts();
  }, []);

  const handleEditFarmerClick = (f) => {
    setEditingFarmerId(f.id);
    setFirstName(f.firstName);
    setLastName(f.lastName);
    setMobile(f.mobile);
    setVillage(f.village);
    setTaluka(f.taluka);
    setDistrict(f.district);
    setState(f.state);
    setPinCode(f.pinCode);
    setFarmSize(f.farmSize.toString());
    setFarmUnit(f.farmUnit);
    setSoilType(f.soilType);
    setIrrigationType(f.irrigationType);
    setPrimaryCrop(f.primaryCrop);
    setOutstandingCredit(f.outstandingCredit ? f.outstandingCredit.toString() : '0');
    setShowAddModal(true);
  };

  const handleCloseFarmerModal = () => {
    setShowAddModal(false);
    setEditingFarmerId(null);
    setFirstName('');
    setLastName('');
    setMobile('');
    setVillage('');
    setTaluka('');
    setDistrict('');
    setState('');
    setPinCode('');
    setFarmSize('5.0');
    setFarmUnit('Acre');
    setSoilType('Black Clay');
    setIrrigationType('Well Water');
    setPrimaryCrop('Cotton');
    setOutstandingCredit('0');
  };

  const handleCreateFarmer = async (e) => {
    e.preventDefault();
    try {
      const farmerData = {
        firstName, lastName, mobile, village, taluka, district, state, pinCode,
        farmSize: parseFloat(farmSize), farmUnit, soilType, irrigationType, primaryCrop,
        outstandingCredit: parseFloat(outstandingCredit), creditLimit: 999999.0
      };
      
      if (editingFarmerId) {
        const res = await api.put(`/api/v1/farmers/${editingFarmerId}`, farmerData);
        alert('Farmer profile updated successfully!');
        setSelectedFarmer(res.data);
      } else {
        await api.post('/api/v1/farmers', farmerData);
        alert('Farmer registered successfully!');
      }
      
      handleCloseFarmerModal();
      fetchFarmers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving farmer profile.');
    }
  };

  const handleDeleteFarmer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this farmer profile? All historical notes and timeline entries will be lost. This cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/api/v1/farmers/${id}`);
      alert('Farmer profile deleted successfully!');
      setSelectedFarmer(null);
      fetchFarmers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting farmer.');
    }
  };

  const handleConfirmSale = async (e) => {
    e.preventDefault();
    if (!sellProductId || !sellQuantity) {
      alert('Please select a product and quantity.');
      return;
    }

    const qty = parseFloat(sellQuantity);
    if (isNaN(qty) || qty <= 0) {
      alert('Invalid quantity.');
      return;
    }

    const product = products.find(p => p.id === parseInt(sellProductId));
    if (!product) {
      alert('Selected product not found.');
      return;
    }

    if (product.stock < qty) {
      alert(`Insufficient stock. Available stock is only ${product.stock} ${product.unit}.`);
      return;
    }

    const pricePerUnit = product.sellingPrice;
    const baseAmount = pricePerUnit * qty;
    const gstAmount = baseAmount * (product.gstPercentage / 100);
    const totalAmount = baseAmount + gstAmount;

    try {
      const res = await api.post(`/api/v1/farmers/${selectedFarmer.id}/sell?productId=${sellProductId}&quantity=${qty}&paymentMethod=${sellPaymentMethod}`);
      
      setSelectedFarmer(res.data);
      alert(`Sale completed successfully! Sold ${qty} ${product.unit} of ${product.name} to ${selectedFarmer.firstName}.`);
      
      setShowSellModal(false);
      setSellProductId('');
      setSellQuantity('1');
      setSellPaymentMethod('Cash');
      fetchFarmers();
      fetchProducts();
      
      const notesRes = await api.get(`/api/v1/farmers/${selectedFarmer.id}/notes`);
      setNotes(notesRes.data);
      const timelineRes = await api.get(`/api/v1/farmers/${selectedFarmer.id}/timeline`);
      setTimeline(timelineRes.data);
      const purchaseRes = await api.get(`/api/v1/sales/farmer/${selectedFarmer.id}`);
      setPurchaseHistory(purchaseRes.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing sales order.');
    }
  };

  const handleSelectFarmer = async (farmer) => {
    setSelectedFarmer(farmer);
    setActiveTab('overview');
    try {
      const notesRes = await api.get(`/api/v1/farmers/${farmer.id}/notes`);
      setNotes(notesRes.data);
      const timelineRes = await api.get(`/api/v1/farmers/${farmer.id}/timeline`);
      setTimeline(timelineRes.data);
      
      const purchaseRes = await api.get(`/api/v1/sales/farmer/${farmer.id}`);
      setPurchaseHistory(purchaseRes.data);
      const visitRes = await api.get(`/api/v1/visits/farmer/${farmer.id}`);
      setVisitHistory(visitRes.data);
    } catch (err) {
      console.warn("Could not fetch farmer auxiliary details", err);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      const res = await api.post(`/api/v1/farmers/${selectedFarmer.id}/notes`, { note: newNote });
      setNotes([res.data, ...notes]);
      setNewNote('');
    } catch (err) {
      alert('Error saving note.');
    }
  };

  const filteredFarmers = farmers.filter(f => 
    `${f.firstName} ${f.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.farmerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.mobile.includes(searchQuery)
  );

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading farmer registry...</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selectedFarmer ? '1.2fr 1fr' : '1fr', gap: '2rem' }}>
      
      {/* Left side: Farmer list */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{t('farmersRegistry', language)}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{t('farmersRegistryTitle', language)}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={fetchFarmers} className="btn btn-secondary">
              <RotateCw size={16} />
              <span>{t('refresh', language)}</span>
            </button>
            <button onClick={() => setShowBulkUpload(!showBulkUpload)} className="btn btn-secondary" style={{ border: showBulkUpload ? '1px solid var(--accent-primary)' : 'none' }}>
              <Upload size={16} />
              <span>Bulk Upload</span>
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              <Plus size={16} />
              <span>{t('registerNewFarmer', language)}</span>
            </button>
          </div>
        </div>

        {/* BULK UPLOAD MODULE */}
        {showBulkUpload && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="glass-panel" 
            style={{ padding: '2rem', marginBottom: '2rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={18} />
                <span>Bulk Import CSV (Farmers)</span>
              </h2>
              <button onClick={() => setShowBulkUpload(false)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                Close
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'center' }}>
              <div 
                style={{ 
                  border: '2px dashed var(--border-glass)', 
                  borderRadius: '8px', 
                  padding: '2rem', 
                  textAlign: 'center', 
                  background: 'rgba(255,255,255,0.01)',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileParse(file);
                }}
                onClick={() => document.getElementById('csv-file-input').click()}
              >
                <Upload size={32} style={{ color: 'var(--accent-primary)', marginBottom: '0.75rem' }} />
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Drag and drop your CSV file here, or <span style={{ color: 'var(--accent-primary)' }}>browse</span>
                </p>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Only .csv files are supported</span>
                <input 
                  id="csv-file-input" 
                  type="file" 
                  accept=".csv" 
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) handleFileParse(file);
                  }} 
                />
              </div>

              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem' }}>Instructions:</h4>
                <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                  <li>Download the sample format below to structure your data.</li>
                  <li>Make sure all column headers match the template exactly.</li>
                  <li>Ensure numbers (outstandingCredit, creditLimit) do not contain currency symbols.</li>
                </ul>
                <button 
                  onClick={handleDownloadSample} 
                  className="btn btn-secondary" 
                  style={{ marginTop: '1.25rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Download size={14} />
                  <span>Download Sample Template</span>
                </button>
              </div>
            </div>

            {bulkPreview.length > 0 && (
              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Import Preview ({bulkPreview.length} records found)</h4>
                  <button onClick={handleConfirmImport} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} disabled={importing}>
                    {importing ? 'Importing...' : 'Confirm Bulk Import'}
                  </button>
                </div>
                <div style={{ overflowX: 'auto', maxHeight: '200px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)' }}>
                        {Object.keys(bulkPreview[0]).map(key => (
                          <th key={key} style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bulkPreview.slice(0, 5).map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                          {Object.values(row).map((val, i) => (
                            <td key={i} style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {bulkPreview.length > 5 && (
                    <p style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                      Showing top 5 preview records. Remaining {bulkPreview.length - 5} records will be imported.
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Search */}
        <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Search size={20} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            style={{ border: 'none', background: 'transparent', padding: '0' }}
            placeholder={t('searchFarmerPlaceholder', language)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Farmer profiles directory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredFarmers.length > 0 ? (
            filteredFarmers.map((f) => (
              <div 
                key={f.id}
                onClick={() => handleSelectFarmer(f)}
                className={`glass-panel ${selectedFarmer?.id === f.id ? 'active-border' : ''}`}
                style={{
                  padding: '1.25rem',
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1.2fr 1.2fr',
                  gap: '1rem',
                  alignItems: 'center',
                  cursor: 'pointer',
                  borderColor: selectedFarmer?.id === f.id ? 'var(--accent-primary)' : 'var(--border-glass)'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>{f.farmerCode}</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.1rem' }}>{f.firstName} {f.lastName}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={12} /> {f.village}, {f.district}
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div>{t('mobileNumber', language)}: {f.mobile}</div>
                  <div>{t('primaryCrops', language)}: <strong style={{ color: 'white' }}>{f.primaryCrop}</strong></div>
                </div>

                <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                  <div style={{ color: 'var(--text-secondary)' }}>{t('outstandingCredit', language)}:</div>
                  <div style={{ fontWeight: 'bold', color: f.outstandingCredit > 0 ? '#f87171' : 'var(--success)' }}>
                    ₹{f.outstandingCredit?.toLocaleString('en-IN') || 0}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No registered farmers found.
            </div>
          )}
        </div>
      </div>

      {/* Right side: Detailed View */}
      {selectedFarmer && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel"
          style={{ padding: '2rem', height: 'fit-content' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>{selectedFarmer.farmerCode}</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{selectedFarmer.firstName} {selectedFarmer.lastName}</h2>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Registered mobile: {selectedFarmer.mobile}</span>
                <button 
                  onClick={() => setShowSellModal(true)} 
                  className="btn btn-primary" 
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', height: 'auto', display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}
                >
                  <TrendingUp size={12} />
                  <span>{t('sellProducts', language)}</span>
                </button>
                <button 
                  onClick={() => handleEditFarmerClick(selectedFarmer)} 
                  className="btn btn-secondary" 
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: 'auto', display: 'inline-flex', gap: '0.25rem', alignItems: 'center', borderColor: 'rgba(59, 130, 246, 0.2)', background: 'rgba(59, 130, 246, 0.05)', color: '#60a5fa' }}
                  title="Edit Profile"
                >
                  <Edit size={12} />
                  <span>{t('editProfile', language)}</span>
                </button>
                <button 
                  onClick={() => handleDeleteFarmer(selectedFarmer.id)} 
                  className="btn btn-secondary" 
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: 'auto', display: 'inline-flex', gap: '0.25rem', alignItems: 'center', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)', color: '#f87171' }}
                  title="Delete Profile"
                >
                  <Trash size={12} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
            <button onClick={() => setSelectedFarmer(null)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>{t('cancel', language)}</button>
          </div>

          {/* Details tab switcher */}
          <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-glass)', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            <button onClick={() => setActiveTab('overview')} style={tabHeaderStyle(activeTab === 'overview')}>{t('overview', language)}</button>
            <button onClick={() => setActiveTab('purchaseHistory')} style={tabHeaderStyle(activeTab === 'purchaseHistory')}>Purchase History</button>
            <button onClick={() => setActiveTab('visitHistory')} style={tabHeaderStyle(activeTab === 'visitHistory')}>Visit History</button>
            <button onClick={() => setActiveTab('notes')} style={tabHeaderStyle(activeTab === 'notes')}>{t('notesMemo', language)}</button>
            <button onClick={() => setActiveTab('timeline')} style={tabHeaderStyle(activeTab === 'timeline')}>{t('timelineActivity', language)}</button>
          </div>

          {/* Tab content */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)' }}>{t('farmLandSize', language)}:</div>
                  <div style={{ fontWeight: 'bold' }}>{selectedFarmer.farmSize} {selectedFarmer.farmUnit}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)' }}>{t('soilIrrigation', language)}:</div>
                  <div style={{ fontWeight: 'bold' }}>{selectedFarmer.soilType} | {selectedFarmer.irrigationType}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)' }}>{t('primaryCrops', language)}:</div>
                  <div style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{selectedFarmer.primaryCrop}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)' }}>{t('outstandingCredit', language)}:</div>
                  <div style={{ fontWeight: 'bold', color: selectedFarmer.outstandingCredit > 0 ? '#f87171' : 'var(--success)' }}>
                    ₹{selectedFarmer.outstandingCredit?.toLocaleString('en-IN') || 0}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-secondary)' }}>{t('addressLocation', language)}:</div>
                <div style={{ fontWeight: 'bold' }}>
                  {selectedFarmer.village}, {t('taluka', language)} {selectedFarmer.taluka}, {t('district', language)} {selectedFarmer.district}, {selectedFarmer.state} - {selectedFarmer.pinCode}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'purchaseHistory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '360px', overflowY: 'auto' }}>
              {purchaseHistory.length > 0 ? (
                purchaseHistory.map((invoice) => {
                  let items = [];
                  try {
                    items = JSON.parse(invoice.itemsJson || '[]');
                  } catch (e) {
                    console.warn(e);
                  }
                  return (
                    <div key={invoice.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)', fontSize: '0.85rem' }}>{invoice.invoiceNumber}</span>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        {items.map((it, idx) => (
                          <div key={idx}>{it.productName} (x{it.quantity})</div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderTop: '1px dashed var(--border-glass)', paddingTop: '0.5rem' }}>
                        <span>Method: <strong>{invoice.paymentMethod}</strong></span>
                        <span style={{ color: '#ffffff', fontWeight: 'bold' }}>Total: ₹{invoice.totalAmount?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>No purchase history found.</div>
              )}
            </div>
          )}

          {activeTab === 'visitHistory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '360px', overflowY: 'auto' }}>
              {visitHistory.length > 0 ? (
                visitHistory.map((visit) => (
                  <div key={visit.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--accent-secondary)', fontSize: '0.85rem' }}>{visit.visitType}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(visit.visitDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>{visit.observations}</p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Agent: {visit.staffName}</span>
                      <span style={{ 
                        color: visit.status === 'COMPLETED' ? 'var(--success)' : 'var(--accent-secondary)',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>{visit.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>No visit history found.</div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              {/* Add Note Form */}
              <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="Type a private internal note for this farmer..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>Save</button>
              </form>

              {/* Notes List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                {notes.length > 0 ? (
                  notes.map((n) => (
                    <div key={n.id} style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)' }}>
                      <p style={{ fontSize: '0.9rem' }}>{n.note}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                        <span>By: {n.createdBy}</span>
                        <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem' }}>No private notes recorded.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '360px', overflowY: 'auto' }}>
              {timeline.length > 0 ? (
                timeline.map((t) => (
                  <div key={t.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ padding: '0.4rem', borderRadius: '50%', background: 'var(--accent-glow)', color: 'var(--accent-primary)', marginTop: '0.2rem' }}>
                      <Clock size={12} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{t.activityType}</div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.description}</p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem' }}>No activities in timeline.</div>
              )}
            </div>
          )}

        </motion.div>
      )}

      {/* Sell Product Modal */}
      {showSellModal && (
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
            style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>Sell Product to Farmer</h2>
            
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Farmer:</span>
                <span style={{ fontWeight: 'bold' }}>{selectedFarmer.firstName} {selectedFarmer.lastName} ({selectedFarmer.farmerCode})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Current Udhar / Outstanding Balance:</span>
                <span style={{ fontWeight: 'bold', color: selectedFarmer.outstandingCredit > 0 ? '#f87171' : 'var(--success)' }}>₹{selectedFarmer.outstandingCredit?.toLocaleString('en-IN') || 0}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmSale}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Select Product *</label>
                <select 
                  required 
                  className="input-field" 
                  value={sellProductId} 
                  onChange={(e) => setSellProductId(e.target.value)}
                  style={{ background: '#121b16' }}
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                      {p.name} ({p.brand}) - ₹{p.sellingPrice} [{p.stock} {p.unit} left]
                    </option>
                  ))}
                </select>
              </div>

              {sellProductId && (() => {
                const selectedProd = products.find(p => p.id === parseInt(sellProductId));
                if (!selectedProd) return null;
                const qty = parseFloat(sellQuantity) || 0;
                const totalBase = selectedProd.sellingPrice * qty;
                const totalGst = totalBase * (selectedProd.gstPercentage / 100);
                const totalAmount = totalBase + totalGst;
                
                return (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Quantity ({selectedProd.unit}) *</label>
                        <input 
                          required 
                          type="number" 
                          step="0.1" 
                          min="0.1" 
                          className="input-field" 
                          value={sellQuantity} 
                          onChange={(e) => setSellQuantity(e.target.value)} 
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Payment Method *</label>
                        <select 
                          required 
                          className="input-field" 
                          value={sellPaymentMethod} 
                          onChange={(e) => setSellPaymentMethod(e.target.value)}
                          style={{ background: '#121b16' }}
                        >
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="Credit">Credit (On Book)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.02)', border: '1px dashed var(--accent-primary)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Base Price:</span>
                        <span>₹{totalBase.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>GST ({selectedProd.gstPercentage}%):</span>
                        <span>₹{totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '0.5rem', fontWeight: 'bold' }}>
                        <span style={{ color: 'var(--text-primary)' }}>Total Payable:</span>
                        <span style={{ color: 'var(--accent-primary)' }}>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </>
                );
              })()}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowSellModal(false);
                    setSellProductId('');
                    setSellQuantity('1');
                    setSellPaymentMethod('Cash');
                  }} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!sellProductId}>
                  Confirm Sale
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Farmer Modal */}
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
            style={{ width: '100%', maxWidth: '640px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
              {editingFarmerId ? t('editFarmerProfile', language) : t('registerNewFarmer', language)}
            </h2>
            <form onSubmit={handleCreateFarmer}>
              
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
                  <label className="form-label">{t('mobileNumber', language)} *</label>
                  <input required type="text" pattern="\d{10}" className="input-field" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit mobile" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('openingUdharBalance', language)} *</label>
                  <input required type="number" className="input-field" value={outstandingCredit} onChange={(e) => setOutstandingCredit(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('village', language)} *</label>
                  <input required type="text" className="input-field" value={village} onChange={(e) => setVillage(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('taluka', language)} *</label>
                  <input required type="text" className="input-field" value={taluka} onChange={(e) => setTaluka(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('district', language)} *</label>
                  <input required type="text" className="input-field" value={district} onChange={(e) => setDistrict(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('state', language)} *</label>
                  <input required type="text" className="input-field" value={state} onChange={(e) => setState(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('pincode', language)} *</label>
                  <input required type="text" pattern="\d{6}" className="input-field" value={pinCode} onChange={(e) => setPinCode(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Farm Size *</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input required type="number" step="0.1" className="input-field" value={farmSize} onChange={(e) => setFarmSize(e.target.value)} />
                    <select className="input-field" value={farmUnit} onChange={(e) => setFarmUnit(e.target.value)} style={{ width: '120px', background: '#121b16' }}>
                      <option value="Acre">Acre</option>
                      <option value="Hectare">Hectare</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Primary Crop *</label>
                  <input required type="text" className="input-field" value={primaryCrop} onChange={(e) => setPrimaryCrop(e.target.value)} placeholder="e.g. Cotton, Wheat, Rice" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" onClick={handleCloseFarmerModal} className="btn btn-secondary">{t('cancel', language)}</button>
                <button type="submit" className="btn btn-primary">
                  {editingFarmerId ? 'Update Profile' : t('saveFarmer', language)}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const tabHeaderStyle = (active) => ({
  background: 'none',
  border: 'none',
  paddingBottom: '0.75rem',
  color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
  fontWeight: 'bold',
  borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
  cursor: 'pointer',
  transition: 'var(--transition-smooth)',
  fontSize: '0.9rem'
});
