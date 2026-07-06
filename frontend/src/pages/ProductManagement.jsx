import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { t } from '../utils/translations';
import { 
  Search, 
  RotateCw, 
  Package, 
  AlertTriangle, 
  Plus, 
  SlidersHorizontal,
  ChevronRight,
  TrendingDown,
  Edit,
  Trash,
  Upload,
  Download
} from 'lucide-react';

export const ProductManagement = () => {
  const { language } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkPreview, setBulkPreview] = useState([]);
  const [importing, setImporting] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Fertilizers');
  const [productType, setProductType] = useState('Fertilizer');
  const [unit, setUnit] = useState('Bag');
  const [stock, setStock] = useState('100.0');
  const [minimumStock, setMinimumStock] = useState('10.0');
  const [purchasePrice, setPurchasePrice] = useState('1500.0');
  const [sellingPrice, setSellingPrice] = useState('1800.0');
  const [mrp, setMrp] = useState('1900.0');
  const [gstPercentage, setGstPercentage] = useState('18.0');

  const fetchProducts = async () => {
    try {
      setError('');
      let endpoint = '/api/v1/products';
      if (filterLowStock) {
        endpoint = '/api/v1/products/low-stock';
      }
      const res = await api.get(endpoint);
      setProducts(res.data);
    } catch (err) {
      setError('Failed to fetch agricultural catalog.');
    } finally {
      setLoading(false);
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
      + "name,brand,category,productType,unit,stock,minimumStock,purchasePrice,sellingPrice,mrp,gstPercentage\n"
      + "Urea 46%,IFFCO,Fertilizers,Fertilizer,Bag,100,10,1500,1800,1900,18\n"
      + "Coragen,FMC,Pesticides,Pesticide,Bottle,50,5,1850,2100,2200,18";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "products_sample_format.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmImport = async () => {
    setImporting(true);
    try {
      await api.post('/api/v1/products/bulk', bulkPreview);
      alert('Products bulk imported successfully!');
      setBulkPreview([]);
      setShowBulkUpload(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Error bulk importing products.');
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filterLowStock]);

  const handleEditClick = (p) => {
    setEditingProductId(p.id);
    setName(p.name);
    setBrand(p.brand);
    setCategory(p.category);
    setProductType(p.productType);
    setUnit(p.unit);
    setStock(p.stock.toString());
    setMinimumStock(p.minimumStock.toString());
    setPurchasePrice(p.purchasePrice.toString());
    setSellingPrice(p.sellingPrice.toString());
    setMrp(p.mrp.toString());
    setGstPercentage(p.gstPercentage.toString());
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingProductId(null);
    setName('');
    setBrand('');
    setCategory('Fertilizers');
    setProductType('Fertilizer');
    setUnit('Bag');
    setStock('100.0');
    setMinimumStock('10.0');
    setPurchasePrice('1500.0');
    setSellingPrice('1800.0');
    setMrp('1900.0');
    setGstPercentage('18.0');
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        name, brand, category, productType, unit,
        stock: parseFloat(stock), minimumStock: parseFloat(minimumStock),
        purchasePrice: parseFloat(purchasePrice), sellingPrice: parseFloat(sellingPrice),
        mrp: parseFloat(mrp), gstPercentage: parseFloat(gstPercentage),
        status: editingProductId ? (products.find(p => p.id === editingProductId)?.status || 'ACTIVE') : 'ACTIVE'
      };
      
      if (editingProductId) {
        await api.put(`/api/v1/products/${editingProductId}`, productData);
        alert('Product updated successfully!');
      } else {
        await api.post('/api/v1/products', productData);
        alert('Product added successfully!');
      }
      
      handleCloseModal();
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving product.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete/remove this product from the catalog? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/api/v1/products/${id}`);
      alert('Product deleted successfully!');
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting product.');
    }
  };

  const handleAdjustStock = async (id) => {
    const qtyStr = prompt('Enter quantity to add (e.g. 50) or remove (e.g. -20):');
    if (!qtyStr) return;
    const quantity = parseFloat(qtyStr);
    if (isNaN(quantity)) {
      alert('Invalid quantity.');
      return;
    }

    try {
      await api.post(`/api/v1/products/${id}/adjust-stock?quantity=${quantity}`);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adjusting stock levels.');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading catalog...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{t('productInventory', language)}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{t('productsCatalogTitle', language)}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setFilterLowStock(!filterLowStock)} className={`btn ${filterLowStock ? 'btn-danger' : 'btn-secondary'}`}>
            <AlertTriangle size={16} />
            <span>{filterLowStock ? 'Show All Products' : t('lowStockItemsOnly', language)}</span>
          </button>
          <button onClick={fetchProducts} className="btn btn-secondary">
            <RotateCw size={16} />
            <span>{t('refresh', language)}</span>
          </button>
          <button onClick={() => setShowBulkUpload(!showBulkUpload)} className="btn btn-secondary" style={{ border: showBulkUpload ? '1px solid var(--accent-primary)' : 'none' }}>
            <Upload size={16} />
            <span>Bulk Upload</span>
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>{t('registerNewProduct', language)}</span>
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
              <span>Bulk Import CSV (Inventory Products)</span>
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
                <li>Ensure numbers (prices, stock, GST) do not contain currency symbols or units.</li>
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
          placeholder="Filter catalog by product code, name, or manufacturer brand..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Products Directory Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredProducts.length > 0 ? (
          filteredProducts.map((p) => {
            const isLowStock = p.stock <= p.minimumStock;
            return (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={p.id}
                className="glass-panel"
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
                  gap: '1rem',
                  alignItems: 'center',
                  borderLeft: isLowStock ? '4px solid var(--error)' : '1px solid var(--border-glass)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>{p.productCode}</span>
                    {isLowStock && <span style={{ fontSize: '0.65rem', background: 'rgba(239,68,68,0.15)', color: '#f87171', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>LOW STOCK</span>}
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '0.15rem' }}>{p.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Brand: {p.brand} | Cat: {p.category}</span>
                </div>

                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pricing:</span>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>₹{p.sellingPrice} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>MRP ₹{p.mrp}</span></div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Purchase: ₹{p.purchasePrice} | GST: {p.gstPercentage}%</span>
                </div>

                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Available Stock:</span>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: isLowStock ? 'var(--error)' : 'var(--text-primary)' }}>
                    {p.stock} {p.unit}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reorder Alert Limit: {p.minimumStock}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button 
                    onClick={() => handleAdjustStock(p.id)}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                    title="Adjust Stock"
                  >
                    <span>Qty</span>
                  </button>
                  <button 
                    onClick={() => handleEditClick(p)}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}
                    title="Edit Details"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(p.id)}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}
                    title="Delete Product"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No products found matching filters.
          </div>
        )}
      </div>

      {/* Add Product Modal */}
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
              {editingProductId ? t('editProductDetails', language) : t('registerNewProduct', language)}
            </h2>
            <form onSubmit={handleCreateProduct}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('productName', language)} *</label>
                  <input required type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Urea 46% Granular" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('brandName', language)} *</label>
                  <input required type="text" className="input-field" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. IFFCO, Bayer" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('categoryLabel', language)} *</label>
                  <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)} style={{ background: '#121b16' }}>
                    <option value="Fertilizers">Fertilizers</option>
                    <option value="Seeds">Seeds</option>
                    <option value="Pesticides">Pesticides</option>
                    <option value="Insecticides">Insecticides</option>
                    <option value="Herbicides">Herbicides</option>
                    <option value="Micronutrients">Micronutrients</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('productTypeLabel', language)} *</label>
                  <input required type="text" className="input-field" value={productType} onChange={(e) => setProductType(e.target.value)} placeholder="e.g. Chemical" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('unitMeasurement', language)} *</label>
                  <select className="input-field" value={unit} onChange={(e) => setUnit(e.target.value)} style={{ background: '#121b16' }}>
                    <option value="Bag">Bag</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Packet">Packet</option>
                    <option value="Kg">Kg</option>
                    <option value="Litre">Litre</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('initialStock', language)} *</label>
                  <input required type="number" step="0.1" className="input-field" value={stock} onChange={(e) => setStock(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('minStockAlert', language)} *</label>
                  <input required type="number" step="0.1" className="input-field" value={minimumStock} onChange={(e) => setMinimumStock(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('purchaseRate', language)} *</label>
                  <input required type="number" step="0.1" className="input-field" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('sellingRate', language)} *</label>
                  <input required type="number" step="0.1" className="input-field" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('mrpRate', language)} *</label>
                  <input required type="number" step="0.1" className="input-field" value={mrp} onChange={(e) => setMrp(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('gstRate', language)} *</label>
                <input required type="number" step="0.1" className="input-field" value={gstPercentage} onChange={(e) => setGstPercentage(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary">{t('cancel', language)}</button>
                <button type="submit" className="btn btn-primary">
                  {editingProductId ? 'Update Product' : t('saveProduct', language)}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
