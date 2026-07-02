import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { t } from '../utils/translations';
import { 
  TrendingUp, 
  RotateCw, 
  ShoppingBag, 
  Package, 
  CreditCard, 
  Users, 
  FileSpreadsheet, 
  DollarSign, 
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';

export const Reports = () => {
  const { language } = useAuth();
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('sales'); // 'sales', 'purchases', 'inventory', 'credit', 'staff'
  const [timeframe, setTimeframe] = useState('ALL'); // 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'ALL'

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/v1/reports/summary');
      setReportsData(res.data);
    } catch (err) {
      setError('Failed to calculate analytics summaries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getFilteredData = () => {
    if (!reportsData) return null;

    const now = new Date();
    const filterByDate = (dateStr) => {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (timeframe) {
        case 'DAILY':
          return date.toDateString() === now.toDateString();
        case 'WEEKLY':
          return diffDays <= 7;
        case 'MONTHLY':
          return diffDays <= 30;
        case 'QUARTERLY':
          return diffDays <= 90;
        case 'YEARLY':
          return diffDays <= 365;
        case 'ALL':
        default:
          return true;
      }
    };

    const recentInvoices = (reportsData.sales?.recentInvoices || []).filter(inv => filterByDate(inv.createdAt));
    const recentPurchases = (reportsData.purchases?.recentPurchases || []).filter(p => filterByDate(p.createdAt));
    const collectionsHistory = (reportsData.credit?.collectionsHistory || []).filter(c => filterByDate(c.collectedAt));

    const totalSalesRevenue = recentInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalSalesGst = recentInvoices.reduce((sum, inv) => sum + (inv.gst || 0), 0);
    const totalPurchaseCost = recentPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const totalCollections = collectionsHistory.reduce((sum, c) => sum + (c.amount || 0), 0);

    const estimatedProfit = totalSalesRevenue - totalPurchaseCost;

    return {
      ...reportsData,
      sales: {
        ...reportsData.sales,
        totalRevenue: totalSalesRevenue,
        totalTaxCollected: totalSalesGst,
        invoiceCount: recentInvoices.length,
        recentInvoices
      },
      purchases: {
        ...reportsData.purchases,
        totalCost: totalPurchaseCost,
        purchaseCount: recentPurchases.length,
        recentPurchases
      },
      credit: {
        ...reportsData.credit,
        totalCollections,
        collectionsHistory
      },
      estimatedProfit
    };
  };

  const filteredData = getFilteredData() || reportsData;

  const handleExportCSV = (tab) => {
    const dataToExport = getFilteredData();
    if (!dataToExport) return;

    let headers = [];
    let rows = [];
    let filename = `${tab}_report_${new Date().toISOString().slice(0, 10)}.csv`;

    if (tab === 'sales') {
      headers = ['Invoice Number', 'Farmer Name', 'Farmer Mobile', 'Subtotal (INR)', 'GST (INR)', 'Total Amount (INR)', 'Payment Mode', 'Date'];
      const recent = dataToExport.sales.recentInvoices || [];
      rows = recent.map(inv => [
        inv.invoiceNumber,
        `"${inv.farmerName}"`,
        inv.farmerMobile,
        inv.subtotal,
        inv.gst,
        inv.totalAmount,
        inv.paymentMethod,
        inv.createdAt
      ]);
    } else if (tab === 'purchases') {
      headers = ['Bill Number', 'Supplier Name', 'Product Name', 'Quantity', 'Purchase Price (INR)', 'GST %', 'Total Cost (INR)', 'Date'];
      const recent = dataToExport.purchases.recentPurchases || [];
      rows = recent.map(p => [
        p.billNumber,
        `"${p.supplierName}"`,
        `"${p.productName}"`,
        p.quantity,
        p.purchasePrice,
        p.gstPercentage,
        p.totalAmount,
        p.createdAt
      ]);
    } else if (tab === 'inventory') {
      headers = ['Product Code', 'Product Name', 'Brand', 'Category', 'Available Stock', 'Unit', 'Purchase Price (INR)', 'Selling Price (INR)', 'MRP (INR)', 'GST %'];
      const catalog = dataToExport.inventory.productsCatalog || [];
      rows = catalog.map(p => [
        p.productCode,
        `"${p.name}"`,
        `"${p.brand}"`,
        p.category,
        p.stock,
        p.unit,
        p.purchasePrice,
        p.sellingPrice,
        p.mrp,
        p.gstPercentage
      ]);
    } else if (tab === 'credit') {
      headers = ['Receipt Date', 'Farmer Name', 'Amount Paid (INR)', 'Payment Mode', 'Reference Number', 'Collected By'];
      const history = dataToExport.credit.collectionsHistory || [];
      rows = history.map(c => [
        c.collectedAt,
        `"${c.farmerName}"`,
        c.amount,
        c.paymentMode,
        c.referenceNumber || 'N/A',
        c.collectedBy
      ]);
    } else if (tab === 'staff') {
      headers = ['Employee Code', 'Staff Name', 'Status', 'Visits Completed'];
      const staffList = dataToExport.staff || [];
      rows = staffList.map(s => [
        s.employeeCode,
        `"${s.staffName}"`,
        s.status,
        s.visitsCount
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(",")].concat(rows.map(e => e.join(","))).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Calculating analytics data...</div>;
  }

  if (error || !reportsData) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error || 'Data load error'}</div>
        <button onClick={fetchReports} className="btn btn-secondary">Retry</button>
      </div>
    );
  }

  // Monthly Sales trend computation for chart
  const monthlySales = filteredData?.sales.monthlySales || {};
  const monthlySalesEntries = Object.entries(monthlySales).slice(-6); // Last 6 months

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{t('reportsTitle', language)}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{t('reportsSub', language)}</p>
        </div>
        
        {/* Timeframe Selector */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.02)', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            {[
              { id: 'ALL', label: t('allTime', language) },
              { id: 'DAILY', label: t('daily', language) },
              { id: 'WEEKLY', label: t('weekly', language) },
              { id: 'MONTHLY', label: t('monthly', language) },
              { id: 'QUARTERLY', label: t('quarterly', language) },
              { id: 'YEARLY', label: t('yearly', language) }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setTimeframe(opt.id)}
                style={{
                  background: timeframe === opt.id ? 'var(--accent-primary)' : 'transparent',
                  color: timeframe === opt.id ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          
          <button onClick={fetchReports} className="btn btn-secondary" style={{ height: '36px' }}>
            <RotateCw size={16} />
            <span>{t('recalculateBi', language)}</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Dashboard */}
      <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'var(--accent-glow)', color: 'var(--accent-primary)' }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('grossBusinessVolume', language)}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>₹{filteredData.sales.totalRevenue?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From {filteredData.sales.invoiceCount} invoices logged</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-secondary)' }}>
            <Package size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('inventoryValuation', language)}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>
              ₹{filteredData.inventory.totalStockValue?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{filteredData.inventory.totalProductTypes} active SKU catalogs</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: filteredData.estimatedProfit >= 0 ? 'var(--accent-glow)' : 'rgba(239, 68, 68, 0.15)', color: filteredData.estimatedProfit >= 0 ? 'var(--accent-primary)' : 'var(--error)' }}>
            <DollarSign size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('estimatedGrossMargin', language)}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              ₹{filteredData.estimatedProfit?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sales revenue minus purchase cost</span>
          </div>
        </div>
      </div>

      {/* SVG Trend Chart */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>{t('monthlyRevenueTitle', language)}</h2>
        {monthlySalesEntries.length > 0 ? (
          <div style={{ position: 'relative', height: '220px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '1.5rem', paddingTop: '20px', borderBottom: '2px solid var(--border-glass)' }}>
            {monthlySalesEntries.map(([month, val]) => {
              const maxVal = Math.max(...monthlySalesEntries.map(e => e[1])) || 1;
              const pct = (val / maxVal) * 100;
              return (
                <div key={month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold', marginBottom: '0.5rem' }}>₹{val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  <div style={{
                    width: '100%',
                    maxWidth: '45px',
                    height: `${pct * 1.5}px`,
                    background: 'linear-gradient(to top, var(--accent-glow), var(--accent-primary))',
                    borderRadius: '6px 6px 0 0',
                    boxShadow: '0 4px 12px var(--accent-glow)',
                    transition: 'var(--transition-smooth)'
                  }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', whiteSpace: 'nowrap' }}>{month}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Record billing invoices to plot transaction graphs.
          </div>
        )}
      </div>

      {/* Report Categories Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {[
          { id: 'sales', label: t('salesInvoicingTab', language), icon: TrendingUp },
          { id: 'purchases', label: t('procurementsTab', language), icon: ShoppingBag },
          { id: 'inventory', label: t('inventorySkuTab', language), icon: Package },
          { id: 'credit', label: t('udharPaymentsTab', language), icon: CreditCard },
          { id: 'staff', label: t('staffPerformanceTab', language), icon: Users }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`btn ${activeSubTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeSubTab === 'sales' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Recent Sales Receipts (Tax Summaries)</h3>
            <button onClick={() => handleExportCSV('sales')} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              <FileSpreadsheet size={14} />
              <span>Export CSV</span>
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Invoice No.</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Farmer Name</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Payment Mode</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', textAlign: 'right' }}>GST Tax</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {(filteredData.sales.recentInvoices || []).length > 0 ? (
                  (filteredData.sales.recentInvoices || []).map(inv => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{inv.invoiceNumber}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{inv.farmerName}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', fontWeight: 'bold' }}>
                          {inv.paymentMethod}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>₹{inv.gst?.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700 }}>₹{inv.totalAmount?.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No invoices registered yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'purchases' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Vendor Procurements (Stock Receipts)</h3>
            <button onClick={() => handleExportCSV('purchases')} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              <FileSpreadsheet size={14} />
              <span>Export CSV</span>
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Bill No.</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Supplier</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Product</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Qty Recd</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Total Bill</th>
                </tr>
              </thead>
              <tbody>
                {(filteredData.purchases.recentPurchases || []).length > 0 ? (
                  (filteredData.purchases.recentPurchases || []).map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{p.billNumber}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{p.supplierName}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{p.productName}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>+{p.quantity}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700 }}>₹{p.totalAmount?.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No procurements recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'inventory' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Product Stock Assets (Valuation Directory)</h3>
            <button onClick={() => handleExportCSV('inventory')} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              <FileSpreadsheet size={14} />
              <span>Export CSV</span>
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Product Code</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Name</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Stock</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Est Asset Value</th>
                </tr>
              </thead>
              <tbody>
                {(filteredData.inventory.productsCatalog || []).length > 0 ? (
                  (filteredData.inventory.productsCatalog || []).map(p => {
                    const value = (p.stock || 0) * (p.purchasePrice || 0);
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{p.productCode}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{p.name}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{p.category}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{p.stock} {p.unit}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700 }}>₹{value.toFixed(2)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No products in catalog.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'credit' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Udhar Collections History</h3>
            <button onClick={() => handleExportCSV('credit')} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              <FileSpreadsheet size={14} />
              <span>Export CSV</span>
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Receipt Date</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Farmer Name</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Payment Mode</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Reference ID</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Collected Amount</th>
                </tr>
              </thead>
              <tbody>
                {(filteredData.credit.collectionsHistory || []).length > 0 ? (
                  (filteredData.credit.collectionsHistory || []).map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>{new Date(c.collectedAt).toLocaleDateString('en-IN')}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{c.farmerName}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{c.paymentMode}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{c.referenceNumber || 'N/A'}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--accent-primary)' }}>₹{c.amount?.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No credit payments collected.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'staff' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Staff Activity Performance</h3>
            <button onClick={() => handleExportCSV('staff')} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              <FileSpreadsheet size={14} />
              <span>Export CSV</span>
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Code</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Name</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Field Visits Completed</th>
                </tr>
              </thead>
              <tbody>
                {(filteredData.staff || []).length > 0 ? (
                  (filteredData.staff || []).map(s => (
                    <tr key={s.employeeCode} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{s.employeeCode}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{s.staffName}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className={`status-badge ${s.status === 'ACTIVE' ? 'badge-active' : 'badge-suspended'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--accent-primary)' }}>{s.visitsCount} Visits</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No active staff profiles registered.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
