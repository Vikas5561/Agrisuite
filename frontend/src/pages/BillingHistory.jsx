import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { 
  RotateCw, 
  CreditCard, 
  Printer, 
  FileText, 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash,
  Search,
  ShoppingBag,
  UserPlus,
  Send,
  Phone,
  User,
  MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';

export const BillingHistory = () => {
  const { user } = useAuth();
  
  // Tabs & Views
  const [tab, setTab] = useState('sales'); // 'sales' or 'subscriptions'
  const [isCreatingBill, setIsCreatingBill] = useState(false);
  
  // Data lists
  const [payments, setPayments] = useState([]);
  const [sales, setSales] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [products, setProducts] = useState([]);
  const [dealerDetails, setDealerDetails] = useState(null);
  
  // Loading & Errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals & Details
  const [activeInvoice, setActiveInvoice] = useState(null); // Subscription invoice
  const [activeSalesInvoice, setActiveSalesInvoice] = useState(null); // Farmer invoice
  const [showRegisterFarmerModal, setShowRegisterFarmerModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppTarget, setWhatsAppTarget] = useState({ name: '', phone: '' });

  // POS Checkout Form State
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [farmerSearchQuery, setFarmerSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productQuantity, setProductQuantity] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountPaid, setAmountPaid] = useState('0');
  const [cart, setCart] = useState([]);

  // Inline Farmer Registration Form State
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regVillage, setRegVillage] = useState('');
  const [regTaluka, setRegTaluka] = useState('');
  const [regDistrict, setRegDistrict] = useState('');
  const [regState, setRegState] = useState('');
  const [regPinCode, setRegPinCode] = useState('');
  const [regFarmSize, setRegFarmSize] = useState('5.0');
  const [regFarmUnit, setRegFarmUnit] = useState('Acre');
  const [regSoilType, setRegSoilType] = useState('Black Clay');
  const [regIrrigationType, setRegIrrigationType] = useState('Well Water');
  const [regPrimaryCrop, setRegPrimaryCrop] = useState('Cotton');
  const [regOutstandingCredit, setRegOutstandingCredit] = useState('0');

  const fetchPayments = async () => {
    try {
      const res = await api.get('/api/v1/payments/history');
      setPayments(res.data);
    } catch (err) {
      console.error('Failed to fetch billing payment history.', err);
    }
  };

  const fetchSales = async () => {
    try {
      const res = await api.get('/api/v1/sales/history');
      setSales(res.data);
    } catch (err) {
      console.error('Failed to fetch sales history.', err);
    }
  };

  const fetchFarmers = async () => {
    try {
      const res = await api.get('/api/v1/farmers');
      setFarmers(res.data);
    } catch (err) {
      console.error('Failed to fetch farmers.', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/v1/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products.', err);
    }
  };

  const fetchDealerDetails = async () => {
    if (user?.dealerId) {
      try {
        const res = await api.get(`/api/v1/dealers/${user.dealerId}`);
        setDealerDetails(res.data);
      } catch (err) {
        console.warn("Could not load dealer address/GST details", err);
      }
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([
        fetchPayments(),
        fetchSales(),
        fetchFarmers(),
        fetchProducts(),
        fetchDealerDetails()
      ]);
    } catch (err) {
      setError('Error loading records registry data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user]);

  // POS CART ACTIONS
  const handleAddToCart = () => {
    if (!selectedProductId) {
      alert('Please select a product.');
      return;
    }
    const quantity = parseFloat(productQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      alert('Enter a valid quantity.');
      return;
    }

    const prod = products.find(p => p.id === parseInt(selectedProductId));
    if (!prod) {
      alert('Product not found.');
      return;
    }

    if (prod.stock < quantity) {
      alert(`Insufficient stock. Available: ${prod.stock} ${prod.unit}`);
      return;
    }

    // Check if product already in cart
    const existingIndex = cart.findIndex(item => item.productId === prod.id);
    const currentCartQty = existingIndex >= 0 ? cart[existingIndex].quantity : 0;
    
    if (prod.stock < (currentCartQty + quantity)) {
      alert(`Cannot add more. Combined cart quantity exceeds available stock (${prod.stock} ${prod.unit}).`);
      return;
    }

    const pricePerUnit = prod.sellingPrice;
    const baseVal = pricePerUnit * quantity;
    const gstVal = baseVal * (prod.gstPercentage / 100);
    const totalVal = baseVal + gstVal;

    if (existingIndex >= 0) {
      const updatedCart = [...cart];
      const existingItem = updatedCart[existingIndex];
      existingItem.quantity += quantity;
      existingItem.subtotal = existingItem.quantity * pricePerUnit;
      existingItem.gstAmount = existingItem.subtotal * (prod.gstPercentage / 100);
      existingItem.total = existingItem.subtotal + existingItem.gstAmount;
      setCart(updatedCart);
    } else {
      setCart([...cart, {
        productId: prod.id,
        productName: prod.name,
        brand: prod.brand,
        quantity: quantity,
        unit: prod.unit,
        sellingPrice: pricePerUnit,
        gstPercentage: prod.gstPercentage,
        subtotal: baseVal,
        gstAmount: gstVal,
        total: totalVal
      }]);
    }

    setSelectedProductId('');
    setProductQuantity('1');
  };

  const handleRemoveFromCart = (index) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    setCart(updatedCart);
  };

  // CALCULATE CART TOTALS
  const cartSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const cartGst = cart.reduce((sum, item) => sum + item.gstAmount, 0);
  const cartTotal = cartSubtotal + cartGst;

  // INLINE FARMER REGISTRATION SUBMIT
  const handleRegisterFarmerInline = async (e) => {
    e.preventDefault();
    try {
      const farmerData = {
        firstName: regFirstName,
        lastName: regLastName,
        mobile: regMobile,
        village: regVillage,
        taluka: regTaluka,
        district: regDistrict,
        state: regState,
        pinCode: regPinCode,
        farmSize: parseFloat(regFarmSize),
        farmUnit: regFarmUnit,
        soilType: regSoilType,
        irrigationType: regIrrigationType,
        primaryCrop: regPrimaryCrop,
        outstandingCredit: parseFloat(regOutstandingCredit),
        creditLimit: 999999.0
      };

      const res = await api.post('/api/v1/farmers', farmerData);
      const newFarmer = res.data;
      
      // Add to list and select it
      setFarmers([...farmers, newFarmer]);
      setSelectedFarmerId(newFarmer.id.toString());
      setShowRegisterFarmerModal(false);
      
      // Clear fields
      setRegFirstName('');
      setRegLastName('');
      setRegMobile('');
      setRegVillage('');
      setRegTaluka('');
      setRegDistrict('');
      setRegState('');
      setRegPinCode('');
      setRegFarmSize('5.0');
      setRegOutstandingCredit('0');
      alert(`Farmer ${newFarmer.firstName} registered and selected successfully!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Error registering new farmer.');
    }
  };

  // GENERATE BILL CHECKOUT
  const handleCheckoutBill = async () => {
    if (!selectedFarmerId) {
      alert('Please select a farmer for the bill.');
      return;
    }
    if (cart.length === 0) {
      alert('Your billing cart is empty.');
      return;
    }

    const farmer = farmers.find(f => f.id === parseInt(selectedFarmerId));
    if (!farmer) {
      alert('Selected farmer not found.');
      return;
    }

    try {
      const parsedAmountPaid = paymentMethod === 'PARTIAL' ? parseFloat(amountPaid) : (paymentMethod === 'CREDIT' ? 0.0 : cartTotal);
      if (isNaN(parsedAmountPaid) || parsedAmountPaid < 0 || parsedAmountPaid > cartTotal) {
        alert('Invalid amount paid. It must be between 0 and total bill amount.');
        return;
      }

      const payload = {
        farmerId: farmer.id,
        paymentMethod: paymentMethod,
        amountPaid: parsedAmountPaid,
        items: cart
      };

      const res = await api.post('/api/v1/sales/create', payload);
      const generatedBill = res.data;

      // Trigger WhatsApp simulation settings
      setWhatsAppTarget({
        name: `${farmer.firstName} ${farmer.lastName}`,
        phone: farmer.mobile
      });
      setShowWhatsAppModal(true);

      // Open printed receipt modal
      setActiveSalesInvoice(generatedBill);

      // Reset cart and settings
      setCart([]);
      setSelectedFarmerId('');
      setPaymentMethod('CASH');
      setAmountPaid('0');
      setIsCreatingBill(false);

      // Refresh data
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error checking out sales bill.');
    }
  };

  const handleOpenInvoice = async (payment) => {
    try {
      const res = await api.get(`/api/v1/payments/invoice/${payment.id}`);
      setActiveInvoice({
        ...res.data,
        paymentDetails: payment
      });
    } catch (err) {
      // Fallback
      setActiveInvoice({
        invoiceNumber: `INV-SUB-${payment.id}`,
        amount: payment.amount,
        gst: payment.gst,
        createdAt: payment.paymentDate || new Date().toISOString(),
        paymentDetails: payment
      });
    }
  };

  // Farmer filter
  const filteredFarmers = farmers.filter(f => 
    `${f.firstName} ${f.lastName}`.toLowerCase().includes(farmerSearchQuery.toLowerCase()) ||
    f.farmerCode.toLowerCase().includes(farmerSearchQuery.toLowerCase()) ||
    f.mobile.includes(farmerSearchQuery)
  );

  const selectedFarmerObject = farmers.find(f => f.id === parseInt(selectedFarmerId));

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading billing records...</div>;
  }

  return (
    <div>
      {/* Dynamic Style injection to handle print media neatly */}
      <style>{`
        @media print {
          /* Hide everything on page */
          body * {
            visibility: hidden;
            background: transparent !important;
          }
          /* Show only the printable invoice card */
          #printable-invoice-area, #printable-invoice-area * {
            visibility: visible;
          }
          #printable-invoice-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #printable-invoice-area table th {
            background-color: #f3f4f6 !important;
            color: #000000 !important;
          }
          /* Hide print action buttons during print */
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Billing & Receipts</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Create tax bills for farmers, manage stock deductions, and track purchase histories</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem' }} className="no-print">
          {!isCreatingBill && tab === 'sales' && (
            <button onClick={() => setIsCreatingBill(true)} className="btn btn-primary">
              <Plus size={16} />
              <span>Create New Bill</span>
            </button>
          )}
          {isCreatingBill && (
            <button onClick={() => { setIsCreatingBill(false); setCart([]); }} className="btn btn-secondary">
              <ArrowLeft size={16} />
              <span>Back to Billing</span>
            </button>
          )}
          <button onClick={loadAllData} className="btn btn-secondary">
            <RotateCw size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {/* Tabs Menu */}
      {!isCreatingBill && (
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-glass)', marginBottom: '2rem' }} className="no-print">
          <button 
            onClick={() => setTab('sales')} 
            style={{
              background: 'none',
              border: 'none',
              paddingBottom: '0.75rem',
              color: tab === 'sales' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: 'bold',
              borderBottom: tab === 'sales' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Customer Invoices (Sales History)
          </button>
          <button 
            onClick={() => setTab('subscriptions')} 
            style={{
              background: 'none',
              border: 'none',
              paddingBottom: '0.75rem',
              color: tab === 'subscriptions' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: 'bold',
              borderBottom: tab === 'subscriptions' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Subscription Receipts (SoftEdgeX Payments)
          </button>
        </div>
      )}

      {/* VIEW: POS CREATE BILL SCREEN */}
      {isCreatingBill ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2rem' }} className="no-print">
          {/* Left: Cart items builder */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag size={18} />
              <span>Billing Cart Items</span>
            </h2>

            {/* Product Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr auto', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Add Product *</label>
                <select 
                  className="input-field" 
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  style={{ background: '#121b16' }}
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                      {p.name} ({p.brand}) - ₹{p.sellingPrice} [{p.stock} {p.unit} in stock]
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Quantity *</label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="0.1" 
                  className="input-field" 
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(e.target.value)}
                />
              </div>

              <button type="button" onClick={handleAddToCart} className="btn btn-primary" style={{ height: '42px', padding: '0 1rem' }}>
                <Plus size={16} />
                <span>Add</span>
              </button>
            </div>

            {/* Cart Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Item Description</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>GST %</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {cart.length > 0 ? (
                  cart.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-glass)', fontSize: '0.9rem' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ fontWeight: 'bold' }}>{item.productName}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Brand: {item.brand}</span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>₹{item.sellingPrice}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>{item.quantity} {item.unit}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>{item.gstPercentage}%</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 'bold' }}>₹{item.total?.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                        <button onClick={() => handleRemoveFromCart(idx)} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}>
                          <Trash size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No items added to billing cart yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Right: Checkout settings & Customer details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Customer selector */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>1. Select Farmer</h3>
                <button 
                  onClick={() => setShowRegisterFarmerModal(true)} 
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem', alignItems: 'center', background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.2)', color: 'var(--accent-primary)' }}
                >
                  <UserPlus size={12} />
                  <span>New Farmer</span>
                </button>
              </div>

              {/* Farmer Search Autocomplete Dropdown */}
              <div className="form-group">
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem', background: '#121b16', marginBottom: '0.75rem' }}>
                  <Search size={16} style={{ color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Search by name, kisan code, or mobile..." 
                    className="input-field"
                    style={{ border: 'none', background: 'transparent', padding: 0 }}
                    value={farmerSearchQuery}
                    onChange={(e) => setFarmerSearchQuery(e.target.value)}
                  />
                </div>

                <select 
                  required 
                  className="input-field"
                  value={selectedFarmerId}
                  onChange={(e) => {
                    setSelectedFarmerId(e.target.value);
                    setFarmerSearchQuery(''); // clear query once selected
                  }}
                  style={{ background: '#121b16' }}
                >
                  <option value="">-- Selected Farmer Account * --</option>
                  {filteredFarmers.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.firstName} {f.lastName} ({f.farmerCode}) - {f.village} [Ph: {f.mobile}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Farmer details card */}
              {selectedFarmerObject && (
                <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.4rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <User size={14} />
                    <span>{selectedFarmerObject.firstName} {selectedFarmerObject.lastName} ({selectedFarmerObject.farmerCode})</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                    <MapPin size={12} /> {selectedFarmerObject.village}, {selectedFarmerObject.taluka}, {selectedFarmerObject.district}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.4rem' }}>
                    <Phone size={12} /> {selectedFarmerObject.mobile}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '0.4rem' }}>
                    <span>Outstanding Udhar:</span>
                    <span style={{ fontWeight: 'bold', color: selectedFarmerObject.outstandingCredit > 0 ? '#f87171' : 'var(--success)' }}>₹{selectedFarmerObject.outstandingCredit?.toLocaleString('en-IN') || 0}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Checkout parameters & Totals */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>2. Bill Checkout Summary</h3>
              
              {/* Payment Mode */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Payment Mode *</label>
                <select 
                  className="input-field" 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ background: '#121b16' }}
                >
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI / Net Banking</option>
                  <option value="CREDIT">CREDIT (Book Account)</option>
                  <option value="PARTIAL">PARTIAL PAYMENT</option>
                </select>
              </div>

              {/* Partial Payment Amount Input */}
              {paymentMethod === 'PARTIAL' && (
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Amount Paid Now (₹) *</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    max={cartTotal} 
                    className="input-field" 
                    value={amountPaid} 
                    onChange={(e) => setAmountPaid(e.target.value)} 
                    placeholder="Enter cash/upi amount paid"
                  />
                </div>
              )}

              {/* Pricing breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-glass)', borderRadius: '8px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Taxable Subtotal:</span>
                  <span>₹{cartSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>CGST (half tax value):</span>
                  <span>₹{(cartGst / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>SGST (half tax value):</span>
                  <span>₹{(cartGst / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '0.5rem', fontWeight: 'bold', fontSize: '1.05rem' }}>
                  <span>Total Bill Amount:</span>
                  <span style={{ color: 'var(--accent-secondary)' }}>₹{cartTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <button 
                type="button" 
                onClick={handleCheckoutBill}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem 0', fontWeight: 'bold' }}
                disabled={cart.length === 0 || !selectedFarmerId}
              >
                <span>Generate & Print Bill</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW: INVOICES ARCHIVES TABLES */
        <div className="no-print">
          {tab === 'sales' ? (
            /* Customer Sales Bills List */
            <div className="glass-panel" style={{ padding: '2rem', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <th style={{ padding: '1rem' }}>Bill No.</th>
                    <th style={{ padding: '1rem' }}>Bill Date</th>
                    <th style={{ padding: '1rem' }}>Farmer Customer</th>
                    <th style={{ padding: '1rem' }}>Mobile</th>
                    <th style={{ padding: '1rem' }}>Total Amount</th>
                    <th style={{ padding: '1rem' }}>Mode</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.length > 0 ? (
                    sales.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border-glass)', fontSize: '0.95rem' }}>
                        <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{s.invoiceNumber}</td>
                        <td style={{ padding: '1rem' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{s.farmerName}</td>
                        <td style={{ padding: '1rem' }}>{s.farmerMobile}</td>
                        <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--accent-secondary)' }}>₹{s.totalAmount?.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '1rem' }}>
                          <span className={`status-badge ${s.paymentMethod === 'CREDIT' ? 'badge-danger' : 'badge-success'}`}>
                            {s.paymentMethod}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <button 
                            onClick={() => setActiveSalesInvoice(s)}
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          >
                            <FileText size={14} />
                            <span>View Bill</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No customer purchase bills recorded yet. Click 'Create New Bill' to make sales checkout.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* original Subscription Payments List */
            <div className="glass-panel" style={{ padding: '2rem', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <th style={{ padding: '1rem' }}>Order ID</th>
                    <th style={{ padding: '1rem' }}>Payment Date</th>
                    <th style={{ padding: '1rem' }}>Base Price</th>
                    <th style={{ padding: '1rem' }}>GST (18%)</th>
                    <th style={{ padding: '1rem' }}>Total Amount</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Tax Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length > 0 ? (
                    payments.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border-glass)', fontSize: '0.95rem' }}>
                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.orderId || 'N/A'}</td>
                        <td style={{ padding: '1rem' }}>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'Pending'}</td>
                        <td style={{ padding: '1rem' }}>₹{p.amount?.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '1rem' }}>₹{p.gst?.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--accent-secondary)' }}>₹{p.totalAmount?.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '1rem' }}>
                          <span className={`status-badge badge-${p.status?.toLowerCase()}`}>{p.status}</span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          {p.status === 'SUCCESS' ? (
                            <button 
                              onClick={() => handleOpenInvoice(p)}
                              className="btn btn-secondary" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            >
                              <FileText size={14} />
                              <span>View Invoice</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Unavailable</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No subscription billing records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* POPUP OVERLAY: PRINTABLE CUSTOMER PURCHASE TAX INVOICE */}
      {activeSalesInvoice && (() => {
        const logoSrc = dealerDetails?.logoUrl || user?.logoUrl;
        const totalAmount = activeSalesInvoice.totalAmount || 0;
        const amountPaidNow = activeSalesInvoice.amountPaid || 0;
        const outstandingBalance = activeSalesInvoice.outstandingBalance || 0;

        let statusText = 'PAID';
        let statusColor = '#22c55e';
        if (outstandingBalance > 0) {
          if (amountPaidNow > 0) {
            statusText = 'PARTIALLY PAID';
            statusColor = '#fbbf24';
          } else {
            statusText = 'UNPAID / UDHAR';
            statusColor = '#ef4444';
          }
        }

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
                  {logoSrc ? (
                    <img src={logoSrc} style={{ height: '50px', width: 'auto', objectFit: 'contain' }} alt="Store Logo" />
                  ) : (
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10b981', fontFamily: 'system-ui, sans-serif', letterSpacing: '-0.5px' }}>
                      {dealerDetails?.businessName || user?.businessName || 'Agriculture Retailer Store'}
                    </div>
                  )}
                  
                  <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '1rem', whiteSpace: 'pre-line', lineHeight: '1.4' }}>
                    {dealerDetails?.businessName || user?.businessName || 'AgriSuite Retailer'}<br />
                    {dealerDetails?.address || 'Main Shop Road'}<br />
                    Village: {dealerDetails?.village || 'N/A'}, District: {dealerDetails?.district || 'N/A'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#000000', margin: '0 0 1rem 0', fontFamily: 'system-ui, sans-serif' }}>INVOICE</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.4rem', fontSize: '0.85rem', color: '#1f2937', textAlign: 'left' }}>
                    <span style={{ color: '#4b5563' }}>Invoice #</span>
                    <span style={{ fontWeight: 700 }}>{activeSalesInvoice.invoiceNumber}</span>
                    <span style={{ color: '#4b5563' }}>Invoice Date</span>
                    <span>{new Date(activeSalesInvoice.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span style={{ color: '#4b5563' }}>Invoice Amount</span>
                    <span style={{ fontWeight: 700 }}>₹{totalAmount.toFixed(2)}</span>
                    <span style={{ color: '#4b5563' }}>Payment Terms</span>
                    <span>Due Upon Receipt</span>
                  </div>
                  <div style={{ marginTop: '0.75rem', color: statusColor, fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.5px' }}>
                    {statusText}
                  </div>
                </div>
              </div>

              {/* Billed To vs Transaction metadata splits */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2.5rem' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#4b5563', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.25rem', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>BILLED TO</div>
                  <div style={{ fontSize: '0.85rem', color: '#1f2937', lineHeight: '1.4' }}>
                    <strong>{activeSalesInvoice.farmerName}</strong><br />
                    Mobile: +91 {activeSalesInvoice.farmerMobile}<br />
                    India
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#4b5563', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.25rem', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>TRANSACTION DETAILS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.3rem', fontSize: '0.85rem', color: '#1f2937' }}>
                    <span style={{ color: '#4b5563' }}>Payment Method</span>
                    <span style={{ fontWeight: 600 }}>{activeSalesInvoice.paymentMethod}</span>
                    <span style={{ color: '#4b5563' }}>Billed Store</span>
                    <span>{dealerDetails?.businessName || user?.businessName}</span>
                    <span style={{ color: '#4b5563' }}>GSTIN</span>
                    <span>{dealerDetails?.gstNumber || '27AASDF9981X1Z2'}</span>
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
                  {activeSalesInvoice.itemsJson && JSON.parse(activeSalesInvoice.itemsJson).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', color: '#1f2937' }}>
                      <td style={{ padding: '1rem 0', fontWeight: 700 }}>
                        {item.productName} <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'normal' }}>({item.brand})</span>
                      </td>
                      <td style={{ padding: '1rem 0', textAlign: 'center' }}>{item.quantity} {item.unit || 'Bags'}</td>
                      <td style={{ padding: '1rem 0', textAlign: 'right' }}>₹{item.sellingPrice?.toFixed(2)}</td>
                      <td style={{ padding: '1rem 0', textAlign: 'right' }}>₹{item.total?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Calculations Block */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2.5rem' }}>
                <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                    <span>Subtotal (Excl. Tax)</span>
                    <span>₹{(activeSalesInvoice.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                    <span>GST Tax Collected</span>
                    <span>₹{(activeSalesInvoice.gst || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563', borderTop: '1px solid #e5e7eb', paddingTop: '0.4rem' }}>
                    <span>Total Amount</span>
                    <span style={{ fontWeight: 700 }}>₹{totalAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                    <span>Amount Paid Now</span>
                    <span style={{ fontWeight: 700, color: '#22c55e' }}>₹{amountPaidNow.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #e5e7eb', paddingTop: '0.5rem', fontWeight: 800, fontSize: '1rem', color: '#000000' }}>
                    <span>Outstanding Udhar</span>
                    <span style={{ color: outstandingBalance > 0 ? '#ef4444' : '#000000' }}>₹{outstandingBalance.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payments Footer */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.25rem', fontSize: '0.85rem', color: '#4b5563', marginBottom: '2.5rem' }}>
                <div style={{ fontWeight: 800, marginBottom: '0.4rem', color: '#1f2937', letterSpacing: '0.5px' }}>PAYMENTS</div>
                ₹{amountPaidNow.toFixed(2)} was paid on {new Date(activeSalesInvoice.createdAt).toLocaleDateString()} by payment method {activeSalesInvoice.paymentMethod || 'UPI'}.
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid #f3f4f6', paddingTop: '1.25rem' }} className="no-print">
                <button 
                  onClick={() => window.print()}
                  className="btn btn-primary"
                  style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Printer size={16} />
                  <span>Print Bill Invoice</span>
                </button>
                <button 
                  onClick={() => setActiveSalesInvoice(null)}
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

      {/* POPUP OVERLAY: PRINTABLE DEALER SUBSCRIPTION TAX INVOICE */}
      {activeInvoice && (
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
              maxWidth: '720px', 
              padding: '2.5rem', 
              background: '#ffffff', 
              color: '#1f2937', 
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}
          >
            {/* Store details header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #10b981', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>
                  {dealerDetails?.businessName || user?.businessName || 'Agriculture Software Services'}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>PLATFORM SUBSCRIPTION RECEIPT</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10b981', margin: '0 0 0.25rem 0' }}>TAX INVOICE</h2>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#374151' }}>Invoice No: {activeInvoice.invoiceNumber}</div>
                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Date: {new Date(activeInvoice.createdAt).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Bill Details cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                <div style={{ fontWeight: 800, color: '#111827', marginBottom: '0.4rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Service Provider:</div>
                <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                  SoftEdgeX AgriSuite Inc.<br />
                  GSTIN: 27SFTEX8876P1Z9<br />
                  Email: billing@softedgex.com
                </div>
              </div>
              
              <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                <div style={{ fontWeight: 800, color: '#111827', marginBottom: '0.4rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subscriber Billed:</div>
                <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                  Business Name: <span style={{ fontWeight: 700, color: '#111827' }}>{dealerDetails?.businessName || user?.businessName}</span><br />
                  GSTIN: {dealerDetails?.gstNumber || 'N/A'}<br />
                  Payment Method: <span style={{ fontWeight: 600, color: '#111827' }}>{activeInvoice.paymentDetails?.paymentMethod || 'UPI'}</span>
                </div>
              </div>
            </div>

            {/* Professional Table */}
            <div style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb', color: '#374151' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 700 }}>Item Description</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700 }}>SAC Code</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700 }}>Taxable Value</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700 }}>CGST (9%)</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700 }}>SGST (9%)</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700 }}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>
                    <td style={{ padding: '1rem 0.75rem', fontWeight: 600, color: '#111827' }}>
                      SoftEdgeX AgriSuite Subscription Plan Renewal
                    </td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>997331</td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>₹{activeInvoice.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>₹{(activeInvoice.gst / 2)?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>₹{(activeInvoice.gst / 2)?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 700, color: '#111827' }}>
                      ₹{activeInvoice.paymentDetails?.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Calculations Summary Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', maxWidth: '350px' }}>
                <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem', color: '#374151' }}>Declaration:</span>
                We declare that this invoice shows the actual price of the software licensing services described and that all particulars are true and correct. This is a computer-generated document and requires no physical signature.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '260px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                  <span>Taxable Subtotal:</span>
                  <span style={{ fontWeight: 600 }}>₹{activeInvoice.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                  <span>CGST (9%):</span>
                  <span style={{ fontWeight: 600 }}>₹{(activeInvoice.gst / 2)?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                  <span>SGST (9%):</span>
                  <span style={{ fontWeight: 600 }}>₹{(activeInvoice.gst / 2)?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #10b981', paddingTop: '0.5rem', fontSize: '1.05rem', color: '#111827' }}>
                  <span style={{ fontWeight: 800 }}>Total (Inclusive of GST):</span>
                  <span style={{ fontWeight: 900, color: '#10b981' }}>₹{activeInvoice.paymentDetails?.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
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
      )}

      {/* MODAL: MOCK WHATSAPP NOTIFICATION OVERLAY */}
      {showWhatsAppModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }} className="no-print">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel"
            style={{ width: '100%', maxWidth: '420px', padding: '2rem', textAlign: 'center' }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '1rem', borderRadius: '50%' }}>
                <Send size={32} />
              </div>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>WhatsApp Notification</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Invoice PDF has been successfully generated and sent to **{whatsAppTarget.name}** at **+91 {whatsAppTarget.phone}** on WhatsApp!
            </p>
            <button 
              onClick={() => setShowWhatsAppModal(false)}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.6rem 0' }}
            >
              Okay
            </button>
          </motion.div>
        </div>
      )}

      {/* MODAL: INLINE REGISTER NEW FARMER IN POS */}
      {showRegisterFarmerModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }} className="no-print">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel"
            style={{ width: '100%', maxWidth: '600px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}
          >
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--accent-primary)' }}>Register Farmer (Inline POS)</h3>
            <form onSubmit={handleRegisterFarmerInline}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input required type="text" className="input-field" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input required type="text" className="input-field" value={regLastName} onChange={(e) => setRegLastName(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <input required type="text" pattern="\d{10}" className="input-field" value={regMobile} onChange={(e) => setRegMobile(e.target.value)} placeholder="10-digit number" />
                </div>
                <div className="form-group">
                  <label className="form-label">Udhar / Outstanding Payment (₹) *</label>
                  <input required type="number" className="input-field" value={regOutstandingCredit} onChange={(e) => setRegOutstandingCredit(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Village *</label>
                  <input required type="text" className="input-field" value={regVillage} onChange={(e) => setRegVillage(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Taluka *</label>
                  <input required type="text" className="input-field" value={regTaluka} onChange={(e) => setRegTaluka(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">District *</label>
                  <input required type="text" className="input-field" value={regDistrict} onChange={(e) => setRegDistrict(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">State *</label>
                  <input required type="text" className="input-field" value={regState} onChange={(e) => setRegState(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">PIN Code *</label>
                  <input required type="text" pattern="\d{6}" className="input-field" value={regPinCode} onChange={(e) => setRegPinCode(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Farm Size *</label>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <input required type="number" step="0.1" className="input-field" value={regFarmSize} onChange={(e) => setRegFarmSize(e.target.value)} />
                    <select className="input-field" value={regFarmUnit} onChange={(e) => setRegFarmUnit(e.target.value)} style={{ width: '90px', background: '#121b16' }}>
                      <option value="Acre">Acre</option>
                      <option value="Hectare">Hectare</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Primary Crop *</label>
                  <input required type="text" className="input-field" value={regPrimaryCrop} onChange={(e) => setRegPrimaryCrop(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowRegisterFarmerModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Register Farmer</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
