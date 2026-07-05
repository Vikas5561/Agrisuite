import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  Layers, 
  Check, 
  RotateCw, 
  AlertTriangle, 
  Sparkles, 
  CreditCard,
  DollarSign
} from 'lucide-react';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const MySubscription = () => {
  const { user } = useAuth();
  const [sub, setSub] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payingPlanId, setPayingPlanId] = useState(null);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState(null);

  const fetchData = async () => {
    try {
      setError('');
      const subRes = await api.get('/api/v1/subscriptions/current');
      setSub(subRes.data);
      const plansRes = await api.get('/api/v1/subscriptions/plans');
      setPlans(plansRes.data);
    } catch (err) {
      setError('Failed to fetch subscription status details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRenewUpgrade = async (planId) => {
    setPayingPlanId(planId);
    try {
      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Failed to load Razorpay SDK. Please check your internet connection.');
        setPayingPlanId(null);
        return;
      }

      // 2. Create order on backend
      const orderRes = await api.post(`/api/v1/payments/order?planId=${planId}`);
      const orderData = orderRes.data;
      const orderId = orderData.id;
      const amount = orderData.amount;
      const rzpKey = orderData.key;

      // Check if it's a mock order
      if (!orderId || orderId.startsWith('order_mock') || rzpKey === 'mock_key_id') {
        // Fallback to simulated checkout flow for mock testing
        const mockPaymentId = 'pay_mock_' + Math.random().toString(36).substring(2, 16);
        const mockSignature = 'sig_mock_' + Math.random().toString(36).substring(2, 20);

        await api.post('/api/v1/payments/verify', {
          orderId: orderId || 'order_mock_' + Date.now(),
          paymentId: mockPaymentId,
          signature: mockSignature,
          planId: planId.toString()
        });

        alert('Subscription purchased successfully! (Simulated checkout verify succeeded)');
        setSelectedPlanForCheckout(null);
        fetchData();
        setPayingPlanId(null);
        return;
      }

      // 3. Open Real Razorpay Checkout options
      const options = {
        key: rzpKey,
        amount: amount,
        currency: "INR",
        name: "SoftEdgeX AgriSuite",
        description: "Dealer Platform Subscription Plan",
        order_id: orderId,
        handler: async function (response) {
          try {
            await api.post('/api/v1/payments/verify', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              planId: planId.toString()
            });
            alert('Subscription purchased successfully! Payment verified.');
            setSelectedPlanForCheckout(null);
            fetchData();
          } catch (err) {
            alert('Payment verification failed: ' + (err.response?.data?.message || err.message));
          } finally {
            setPayingPlanId(null);
          }
        },
        prefill: {
          name: user?.displayName || "",
          email: user?.email || ""
        },
        theme: {
          color: "#10b981"
        },
        modal: {
          ondismiss: function () {
            setPayingPlanId(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing payment order.');
      setPayingPlanId(null);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading subscription dashboard...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>My Subscription</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>View details, purchase plans, renewals, and upgrades</p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary">
          <RotateCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {/* Current Subscription Card */}
      {sub && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', borderLeft: '4px solid var(--accent-primary)' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CURRENT PLAN TYPE</span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
              <span>{sub.plan?.name}</span>
              <Sparkles size={22} style={{ color: 'var(--accent-secondary)' }} />
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span className={`status-badge badge-${sub.status?.toLowerCase()}`}>{sub.status}</span>
              {sub.autoRenew && <span className="status-badge badge-active">Auto Renew Enabled</span>}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '240px', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Activation Date:</span>
              <span style={{ fontWeight: 'bold' }}>{new Date(sub.startDate).toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Expiry Date:</span>
              <span style={{ fontWeight: 'bold' }}>{new Date(sub.endDate).toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Grace Period Limit:</span>
              <span style={{ fontWeight: 'bold', color: 'var(--error)' }}>{new Date(sub.graceEndDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Screen */}
      {selectedPlanForCheckout ? (
        <div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
            <button 
              onClick={() => setSelectedPlanForCheckout(null)} 
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              ← Back to Plans
            </button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Confirm Order & Billing Summary</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', alignItems: 'start' }}>
            
            {/* Left Box: Invoice Breakdown */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
                Subscription Summary
              </h3>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{selectedPlanForCheckout.name} Plan</div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Access to AgriSuite platform modules for {selectedPlanForCheckout.durationMonths} {selectedPlanForCheckout.durationMonths === 1 ? 'month' : 'months'}
                  </span>
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                  ₹{selectedPlanForCheckout.price.toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.01)', padding: '1rem', borderRadius: '8px' }}>
                <div>• Max Staff Limit: {selectedPlanForCheckout.maxStaff} members</div>
                <div>• Max Document Vault: {selectedPlanForCheckout.maxDocuments} documents</div>
                <div>• Complete cloud database isolation active</div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Base Price:</span>
                  <span>₹{(selectedPlanForCheckout.price - (selectedPlanForCheckout.offerDiscount || 0)).toLocaleString('en-IN')}</span>
                </div>
                {selectedPlanForCheckout.offerDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                    <span>Offer Discount ({selectedPlanForCheckout.offerCode}):</span>
                    <span>-₹{selectedPlanForCheckout.offerDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>GST (18%):</span>
                  <span>₹{((selectedPlanForCheckout.price - (selectedPlanForCheckout.offerDiscount || 0)) * 0.18).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-primary)', borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                  <span>Total Price (Inc. GST):</span>
                  <span>₹{((selectedPlanForCheckout.price - (selectedPlanForCheckout.offerDiscount || 0)) * 1.18).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Right Box: Payment Options */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
                Payment Method
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                
                {/* Razorpay Option */}
                <div style={{
                  padding: '1.25rem',
                  border: '2px solid var(--accent-primary)',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.04)',
                  display: 'flex',
                  gap: '1rem',
                  cursor: 'pointer'
                }}>
                  <input type="radio" checked readOnly style={{ accentColor: 'var(--accent-primary)', marginTop: '0.15rem' }} />
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Razorpay Secure Checkout</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Pay using UPI (PhonePe, GPay), Credit/Debit Cards, Netbanking, or mobile wallets in India.
                    </span>
                  </div>
                </div>

                {/* Simulated Option / Future Payment Link */}
                <div style={{
                  padding: '1.25rem',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  background: 'transparent',
                  display: 'flex',
                  gap: '1rem',
                  opacity: 0.6,
                  cursor: 'not-allowed'
                }}>
                  <input type="radio" disabled style={{ marginTop: '0.15rem' }} />
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--text-muted)' }}>Bank Transfer / WhatsApp Pay</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Pay offline via direct IMPS bank transfer and upload invoice receipt. (Offline configuration)
                    </span>
                  </div>
                </div>

              </div>

              <button
                onClick={() => handleRenewUpgrade(selectedPlanForCheckout.id)}
                disabled={payingPlanId !== null}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}
              >
                <CreditCard size={18} />
                <span>{payingPlanId ? 'Processing Securely...' : `Pay ₹${((selectedPlanForCheckout.price - (selectedPlanForCheckout.offerDiscount || 0)) * 1.18).toLocaleString('en-IN')}`}</span>
              </button>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1rem' }}>
                <span style={{ color: 'var(--accent-primary)' }}>🔒 Secured by SSL 256-bit encryption</span>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div>
          {/* Available Plans Comparison Cards */}
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Compare & Renew Plans</h2>
          <div className="grid-cols-3">
            {plans.map((p) => {
              const isCurrent = sub?.plan?.id === p.id && sub?.status?.toUpperCase() === 'ACTIVE';
              return (
                <motion.div 
                  whileHover={{ y: -4 }}
                  key={p.id}
                  className="glass-panel"
                  style={{
                    padding: '2.25rem 2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '420px',
                    borderColor: isCurrent ? 'var(--accent-primary)' : 'var(--border-glass)',
                    borderWidth: isCurrent ? '2px' : '1px',
                    background: isCurrent ? 'rgba(16, 185, 129, 0.02)' : 'var(--bg-glass)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{p.name}</h3>
                      {isCurrent && <span style={{ fontSize: '0.65rem', background: 'var(--accent-primary)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>CURRENT ACTIVE</span>}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                      {p.offerCode && p.offerDiscount > 0 ? (
                        <>
                          <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>₹{Math.max(0, p.price - p.offerDiscount).toLocaleString('en-IN')}</span>
                          <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '1.1rem' }}>₹{p.price.toLocaleString('en-IN')}</span>
                        </>
                      ) : (
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹{p.price.toLocaleString('en-IN')}</span>
                      )}
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>/ {p.durationMonths} {p.durationMonths === 1 ? 'month' : 'months'}</span>
                    </div>

                    {p.offerCode && p.offerDiscount > 0 && (
                      <div style={{ 
                        background: 'rgba(245,158,11,0.08)', 
                        border: '1px solid rgba(245,158,11,0.15)', 
                        borderRadius: '6px', 
                        padding: '0.5rem 0.75rem', 
                        marginBottom: '1rem', 
                        fontSize: '0.8rem' 
                      }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--accent-secondary)' }}>Offer Code: {p.offerCode}</div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{p.offerDescription}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} style={{ color: 'var(--accent-primary)' }} /> Max Staff Limit: {p.maxStaff}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} style={{ color: 'var(--accent-primary)' }} /> Max Document Vault: {p.maxDocuments}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} style={{ color: 'var(--accent-primary)' }} /> Shared Database Isolation</div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedPlanForCheckout(p)}
                    disabled={payingPlanId !== null}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.8rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
                  >
                    <CreditCard size={16} />
                    <span>Buy Subscription</span>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
