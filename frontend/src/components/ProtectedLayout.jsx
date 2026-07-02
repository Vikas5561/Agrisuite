import React from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../utils/translations';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Package, 
  CreditCard, 
  Settings, 
  LogOut, 
  AlertTriangle,
  Layers,
  Wheat,
  CircleDot,
  ShoppingBag,
  BookOpen,
  Clipboard,
  TrendingUp,
  Bell
} from 'lucide-react';

export const ProtectedLayout = ({ children, allowedRoles }) => {
  const { user, loading, logout, subExpired, setSubExpired, language, changeLanguage } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', gap: '1rem', flexDirection: 'column' }}>
        <Wheat size={48} className="animate-pulse" style={{ color: 'var(--accent-primary)' }} />
        <div style={{ color: 'var(--text-secondary)' }}>Loading SoftEdgeX AgriSuite...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  // Sidebar Links based on role
  const getSidebarLinks = () => {
    switch (user.role) {
      case 'SUPER_ADMIN':
        return [
          { to: '/super-admin', label: t('dashboard', language), icon: LayoutDashboard },
          { to: '/super-admin/dealers', label: t('dealers', language), icon: Users },
          { to: '/super-admin/plans', label: t('platformSubscriptionPlans', language), icon: Layers },
          { to: '/super-admin/payments', label: t('payments', language), icon: CreditCard },
          { to: '/super-admin/audit-logs', label: t('auditLogs', language), icon: CircleDot },
          { to: '/super-admin/settings', label: t('systemSettings', language), icon: Settings },
        ];
      case 'DEALER_ADMIN':
        return [
          { to: '/dealer-admin', label: t('dashboard', language), icon: LayoutDashboard },
          { to: '/dealer-admin/staff', label: t('staffDirectory', language), icon: UserCheck },
          { to: '/dealer-admin/farmers', label: t('farmerProfiles', language), icon: Users },
          { to: '/dealer-admin/products', label: t('productsInventory', language), icon: Package },
          { to: '/dealer-admin/suppliers', label: t('suppliersPurchases', language), icon: ShoppingBag },
          { to: '/dealer-admin/credit-book', label: t('farmerCreditBook', language), icon: BookOpen },
          { to: '/dealer-admin/visits', label: t('advisoryFieldVisits', language), icon: Clipboard },
          { to: '/dealer-admin/reports', label: t('reportsBI', language), icon: TrendingUp },
          { to: '/dealer-admin/notifications', label: t('notificationCenter', language), icon: Bell },
          { to: '/dealer-admin/settings', label: t('systemSettings', language), icon: Settings },
          { to: '/dealer-admin/subscription', label: t('mySubscription', language), icon: Layers },
          { to: '/dealer-admin/billing', label: t('billingReceipts', language), icon: CreditCard },
        ];
      case 'STAFF':
        return [
          { to: '/staff', label: t('myDashboard', language), icon: LayoutDashboard },
          { to: '/staff/farmers', label: t('farmersRegistry', language), icon: Users },
          { to: '/staff/products', label: t('viewProducts', language), icon: Package },
          { to: '/staff/visits', label: t('fieldVisitTracker', language), icon: Clipboard },
        ];
      default:
        return [];
    }
  };

  const links = getSidebarLinks();

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <motion.aside 
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className="sidebar glass-panel"
        style={{ margin: '1rem', height: 'calc(100vh - 2rem)', borderRadius: 'var(--radius-lg)' }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
            {user.logoUrl ? (
              <img 
                src={user.logoUrl} 
                alt="Business Logo" 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '8px', 
                  objectFit: 'contain', 
                  background: '#ffffff',
                  padding: '2px',
                  border: '1px solid var(--border-glass)' 
                }} 
              />
            ) : (
              <div style={{ padding: '0.5rem', borderRadius: '12px', background: 'var(--accent-glow)' }}>
                <Wheat size={28} style={{ color: 'var(--accent-primary)' }} />
              </div>
            )}
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }} title={user.businessName || 'AgriSuite'}>
                {user.businessName || 'AgriSuite'}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {user.businessName ? 'AgriSuite' : 'SoftEdgeX Tech'}
              </span>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.85rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    background: isActive ? 'linear-gradient(135deg, var(--accent-primary), #047857)' : 'transparent',
                    boxShadow: isActive ? '0 4px 12px var(--accent-glow)' : 'none',
                    transition: 'var(--transition-smooth)',
                    fontWeight: 600
                  }}
                >
                  <Icon size={20} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile footer */}
        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {user.logoUrl ? (
              <img 
                src={user.logoUrl} 
                alt="Dealer Logo" 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  objectFit: 'cover', 
                  background: '#ffffff',
                  border: '1px solid var(--border-glass)' 
                }} 
              />
            ) : (
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                {(user.displayName || user.username).substring(0, 2).toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user.displayName || user.username}>{user.displayName || user.username}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user.role.replace('_', ' ')}</div>
              
              <select 
                value={language} 
                onChange={(e) => changeLanguage(e.target.value)} 
                style={{ 
                  marginTop: '0.35rem', 
                  width: '100%', 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid var(--border-glass)', 
                  borderRadius: '6px', 
                  color: 'var(--text-secondary)', 
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.35rem',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <option value="English" style={{background:'#121b16'}}>English</option>
                <option value="Marathi" style={{background:'#121b16'}}>Marathi (मराठी)</option>
                <option value="Hindi" style={{background:'#121b16'}}>Hindi (हिन्दी)</option>
                <option value="Bengali" style={{background:'#121b16'}}>Bengali (বাংলা)</option>
                <option value="Telugu" style={{background:'#121b16'}}>Telugu (తెలుగు)</option>
                <option value="Tamil" style={{background:'#121b16'}}>Tamil (தமிழ்)</option>
                <option value="Gujarati" style={{background:'#121b16'}}>Gujarati (ગુજરાતી)</option>
                <option value="Kannada" style={{background:'#121b16'}}>Kannada (ಕನ್ನಡ)</option>
                <option value="Odia" style={{background:'#121b16'}}>Odia (ଓଡ଼ିଆ)</option>
                <option value="Malayalam" style={{background:'#121b16'}}>Malayalam (മലയാളं)</option>
                <option value="Punjabi" style={{background:'#121b16'}}>Punjabi (ਪੰਜਾਬੀ)</option>
                <option value="Assamese" style={{background:'#121b16'}}>Assamese (অসমীয়া)</option>
              </select>
            </div>
          </div>
          
          <button 
            onClick={logout} 
            className="btn btn-secondary" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>

          <div style={{ textAlign: 'center', fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 500, padding: '0.25rem 0' }}>
            © SoftEdgex Technologies
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Subscription Expired Blocking Overlay */}
      {subExpired && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)'
          }}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel"
            style={{ padding: '3rem', maxWidth: '500px', textAlign: 'center', margin: '2rem' }}
          >
            <AlertTriangle size={64} style={{ color: 'var(--error)', marginBottom: '1.5rem' }} />
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Subscription Expired</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1rem' }}>
              Your softedgex AgriSuite subscription has expired. Access to business modules is locked. Please renew to continue managing staff, farmers, and products.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              {user.role === 'DEALER_ADMIN' ? (
                <Link to="/dealer-admin/subscription" onClick={() => setSubExpired(false)} className="btn btn-primary">
                  Renew Subscription
                </Link>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Please contact your Dealer Administrator to renew the subscription.
                </div>
              )}
              <button onClick={logout} className="btn btn-secondary">
                Logout
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
