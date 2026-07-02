import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { RotateCw, Search, CreditCard, DollarSign, FileText, Printer } from 'lucide-react';
import { motion } from 'framer-motion';

export const PaymentsManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  
  // Printable Invoice Popup
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/v1/payments/history');
      setPayments(res.data);
    } catch (err) {
      setError('Failed to fetch platform transaction list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handlePrintInvoice = async (paymentId) => {
    setInvoiceLoading(true);
    try {
      const res = await api.get(`/api/v1/payments/invoice/${paymentId}`);
      setActiveInvoice(res.data);
    } catch (err) {
      alert('Failed to retrieve tax invoice for this payment.');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
        return { bg: 'rgba(16,185,129,0.15)', color: '#34d399', label: 'Success' };
      case 'FAILED':
        return { bg: 'rgba(239,68,68,0.15)', color: '#f87171', label: 'Failed' };
      case 'REFUNDED':
        return { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', label: 'Refunded' };
      case 'PENDING':
      default:
        return { bg: 'rgba(255,255,255,0.05)', color: '#a3a3a3', label: 'Pending' };
    }
  };

  const filteredPayments = payments.filter(p => 
    p.orderId?.toLowerCase().includes(search.toLowerCase()) ||
    p.paymentId?.toLowerCase().includes(search.toLowerCase()) ||
    p.gateway?.toLowerCase().includes(search.toLowerCase()) ||
    p.status?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Platform Subscription Payments</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Global transaction log of all license purchases, Razorpay orders, and invoice settlements</p>
        </div>
        <button onClick={fetchPayments} className="btn btn-secondary">
          <RotateCw size={16} />
          <span>Refresh List</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {/* Stats Summary Panel */}
      <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'var(--accent-glow)', color: 'var(--accent-primary)' }}>
            <DollarSign size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Platform Volume</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>₹{payments.filter(p => p.status === 'SUCCESS').reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', color: '#34d399' }}>
            <CheckCircleIcon size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Success Settlements</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{payments.filter(p => p.status === 'SUCCESS').length} Transactions</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
            <AlertCircleIcon size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Failed / Pending Checks</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{payments.filter(p => p.status !== 'SUCCESS').length} Transactions</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <Search size={20} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="input-field"
          style={{ border: 'none', background: 'transparent', padding: '0', fontSize: '0.95rem' }}
          placeholder="Search by Order ID, Payment ID, Gateway name, or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Payments Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Date</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Order ID</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Payment ID</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>Method / Gateway</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', textAlign: 'right' }}>GST (18%)</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Total (INR)</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading transactions ledger...</td>
                </tr>
              ) : filteredPayments.length > 0 ? (
                filteredPayments.map((p) => {
                  const badge = getStatusStyle(p.status);
                  const dateStr = p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : new Date(p.createdAt).toLocaleDateString('en-IN');
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>{dateStr}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{p.orderId}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.paymentId || 'N/A'}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{p.paymentMethod || 'UPI'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>({p.gateway})</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>₹{p.amount.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-muted)' }}>₹{p.gst.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700 }}>₹{p.totalAmount.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: badge.bg, color: badge.color, fontWeight: 'bold' }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        {p.status === 'SUCCESS' ? (
                          <button onClick={() => handlePrintInvoice(p.id)} className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem' }} title="Print Tax Invoice">
                            <Printer size={12} />
                          </button>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No platform transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP OVERLAY: PRINTABLE DEALER SUBSCRIPTION TAX INVOICE */}
      {activeInvoice && (() => {
        const pDate = activeInvoice.paymentDate || activeInvoice.createdAt;
        const nextBDate = activeInvoice.nextBillingDate || new Date(new Date(pDate).setMonth(new Date(pDate).getMonth() + 1));
        const platformLogoSrc = localStorage.getItem('platformLogo');
        const platformNameVal = localStorage.getItem('platformName') || 'ROLLER Networks USA Inc.';
        const platformAddressVal = localStorage.getItem('platformAddress') || 'PO Box 3172\nRedondo Beach, California 90277\nUnited States';
        const totalPayable = activeInvoice.amount + activeInvoice.gst;

        return (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            overflowY: 'auto'
          }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-panel"
              id="printable-invoice-area"
              style={{ 
                width: '100%', 
                maxWidth: '780px', 
                padding: '3rem', 
                background: '#ffffff', 
                color: '#111827', 
                borderRadius: '12px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
            >
              {/* Header section: Logo & Address on Left, Invoice Details on Right */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                <div>
                  {platformLogoSrc ? (
                    <img src={platformLogoSrc} style={{ height: '40px', width: 'auto', objectFit: 'contain' }} alt="Platform Logo" />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'system-ui, sans-serif' }}>
                      <span style={{ color: '#ef4444', fontWeight: 900, fontSize: '1.8rem' }}>▶</span>
                      <span style={{ color: '#000000', fontWeight: 900, fontSize: '1.8rem', letterSpacing: '-0.5px' }}>ROLLER</span>
                    </div>
                  )}
                  
                  <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '1rem', whiteSpace: 'pre-line', lineHeight: '1.4' }}>
                    {platformNameVal}<br />
                    {platformAddressVal}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#000000', margin: '0 0 1rem 0', fontFamily: 'system-ui, sans-serif' }}>INVOICE</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.4rem', fontSize: '0.85rem', color: '#1f2937', textAlign: 'left' }}>
                    <span style={{ color: '#4b5563' }}>Invoice #</span>
                    <span style={{ fontWeight: 700 }}>{activeInvoice.invoiceNumber}</span>
                    <span style={{ color: '#4b5563' }}>Invoice Date</span>
                    <span>{new Date(pDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <span style={{ color: '#4b5563' }}>Invoice Amount</span>
                    <span style={{ fontWeight: 700 }}>₹{totalPayable.toFixed(2)}</span>
                    <span style={{ color: '#4b5563' }}>Payment Terms</span>
                    <span>Due Upon Receipt</span>
                  </div>
                  <div style={{ marginTop: '0.75rem', color: '#22c55e', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.5px' }}>
                    PAID
                  </div>
                </div>
              </div>

              {/* Billed To vs Subscription metadata splits */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2.5rem' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#4b5563', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.25rem', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>BILLED TO</div>
                  <div style={{ fontSize: '0.85rem', color: '#1f2937', lineHeight: '1.4' }}>
                    <strong>Dealer ID: DLR-{activeInvoice.dealerId}</strong><br />
                    United States
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#4b5563', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.25rem', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>SUBSCRIPTION</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.3rem', fontSize: '0.85rem', color: '#1f2937' }}>
                    <span style={{ color: '#4b5563' }}>Billing Period</span>
                    <span>Monthly</span>
                    <span style={{ color: '#4b5563' }}>Next Billing Date</span>
                    <span>{new Date(nextBDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <span style={{ color: '#4b5563' }}>Venue Name</span>
                    <span>AgriSuite Portal</span>
                  </div>
                </div>
              </div>

              {/* Table section */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#4b5563' }}>
                    <th style={{ padding: '0.75rem 0', textAlign: 'left', fontWeight: 800 }}>DESCRIPTION</th>
                    <th style={{ padding: '0.75rem 0', textAlign: 'center', fontWeight: 800 }}>UNITS</th>
                    <th style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 800 }}>UNIT PRICE</th>
                    <th style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 800 }}>AMOUNT (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#1f2937' }}>
                    <td style={{ padding: '1rem 0', fontWeight: 700 }}>Platform Subscription - Plan Renewal</td>
                    <td style={{ padding: '1rem 0', textAlign: 'center' }}>1</td>
                    <td style={{ padding: '1rem 0', textAlign: 'right' }}>₹{activeInvoice.amount?.toFixed(2)}</td>
                    <td style={{ padding: '1rem 0', textAlign: 'right' }}>₹{activeInvoice.amount?.toFixed(2)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#1f2937' }}>
                    <td style={{ padding: '1rem 0', fontWeight: 700 }}>Tax / CGST & SGST (18% GST)</td>
                    <td style={{ padding: '1rem 0', textAlign: 'center' }}>1</td>
                    <td style={{ padding: '1rem 0', textAlign: 'right' }}>₹{activeInvoice.gst?.toFixed(2)}</td>
                    <td style={{ padding: '1rem 0', textAlign: 'right' }}>₹{activeInvoice.gst?.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Calculations Block */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2.5rem' }}>
                <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                    <span>Total</span>
                    <span style={{ fontWeight: 700 }}>₹{totalPayable.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                    <span>Payments</span>
                    <span>₹{totalPayable.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #e5e7eb', paddingTop: '0.5rem', fontWeight: 800, fontSize: '1rem', color: '#000000' }}>
                    <span>Amount Due (INR)</span>
                    <span>₹0.00</span>
                  </div>
                </div>
              </div>

              {/* Payments Footer */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.25rem', fontSize: '0.85rem', color: '#4b5563', marginBottom: '2.5rem' }}>
                <div style={{ fontWeight: 800, marginBottom: '0.4rem', color: '#1f2937', letterSpacing: '0.5px' }}>PAYMENTS</div>
                ₹{totalPayable.toFixed(2)} was paid on {new Date(pDate).toLocaleDateString('en-US')} by payment method UPI.
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid #f3f4f6', paddingTop: '1.25rem' }} className="no-print">
                <button 
                  onClick={() => window.print()}
                  className="btn btn-primary"
                  style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Printer size={16} />
                  <span>Print Invoice</span>
                </button>
                <button 
                  onClick={() => setActiveInvoice(null)}
                  className="btn btn-secondary"
                  style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem', color: '#374151', borderColor: '#d1d5db', background: '#f9fafb' }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        );
      })()}

    </div>
  );
};

// Simple icon fallbacks for stats cards
const CheckCircleIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertCircleIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
