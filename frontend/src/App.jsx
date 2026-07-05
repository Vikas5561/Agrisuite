import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedLayout } from './components/ProtectedLayout';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { DealerManagement } from './pages/DealerManagement';
import { DealerAdminDashboard } from './pages/DealerAdminDashboard';
import { StaffManagement } from './pages/StaffManagement';
import { FarmerManagement } from './pages/FarmerManagement';
import { ProductManagement } from './pages/ProductManagement';
import { MySubscription } from './pages/MySubscription';
import { BillingHistory } from './pages/BillingHistory';
import { StaffDashboard } from './pages/StaffDashboard';
import { SupplierManagement } from './pages/SupplierManagement';
import { CreditBook } from './pages/CreditBook';
import { VisitTracking } from './pages/VisitTracking';
import { Reports } from './pages/Reports';
import { NotificationCenter } from './pages/NotificationCenter';
import { SettingsPage } from './pages/Settings';
import { PlansManagement } from './pages/PlansManagement';
import { PaymentsManagement } from './pages/PaymentsManagement';
import { AuditLogs } from './pages/AuditLogs';
import { SuperAdminSettings } from './pages/SuperAdminSettings';

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'SUPER_ADMIN') return <Navigate to="/super-admin" replace />;
  if (user.role === 'DEALER_ADMIN') return <Navigate to="/dealer-admin" replace />;
  return <Navigate to="/staff" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Super Admin Routes */}
        <Route path="/super-admin" element={
          <ProtectedLayout allowedRoles={['SUPER_ADMIN']}>
            <SuperAdminDashboard />
          </ProtectedLayout>
        } />
        <Route path="/super-admin/dealers" element={
          <ProtectedLayout allowedRoles={['SUPER_ADMIN']}>
            <DealerManagement />
          </ProtectedLayout>
        } />
        <Route path="/super-admin/plans" element={
          <ProtectedLayout allowedRoles={['SUPER_ADMIN']}>
            <PlansManagement />
          </ProtectedLayout>
        } />
        <Route path="/super-admin/payments" element={
          <ProtectedLayout allowedRoles={['SUPER_ADMIN']}>
            <PaymentsManagement />
          </ProtectedLayout>
        } />
        <Route path="/super-admin/audit-logs" element={
          <ProtectedLayout allowedRoles={['SUPER_ADMIN']}>
            <AuditLogs />
          </ProtectedLayout>
        } />
        <Route path="/super-admin/settings" element={
          <ProtectedLayout allowedRoles={['SUPER_ADMIN']}>
            <SuperAdminSettings />
          </ProtectedLayout>
        } />

        {/* Dealer Admin Routes */}
        <Route path="/dealer-admin" element={
          <ProtectedLayout allowedRoles={['DEALER_ADMIN']}>
            <DealerAdminDashboard />
          </ProtectedLayout>
        } />
        <Route path="/dealer-admin/staff" element={
          <ProtectedLayout allowedRoles={['DEALER_ADMIN']}>
            <StaffManagement />
          </ProtectedLayout>
        } />
        <Route path="/dealer-admin/farmers" element={
          <ProtectedLayout allowedRoles={['DEALER_ADMIN']}>
            <FarmerManagement />
          </ProtectedLayout>
        } />
        <Route path="/dealer-admin/products" element={
          <ProtectedLayout allowedRoles={['DEALER_ADMIN']}>
            <ProductManagement />
          </ProtectedLayout>
        } />
        <Route path="/dealer-admin/suppliers" element={
          <ProtectedLayout allowedRoles={['DEALER_ADMIN']}>
            <SupplierManagement />
          </ProtectedLayout>
        } />
        <Route path="/dealer-admin/credit-book" element={
          <ProtectedLayout allowedRoles={['DEALER_ADMIN']}>
            <CreditBook />
          </ProtectedLayout>
        } />
        <Route path="/dealer-admin/visits" element={
          <ProtectedLayout allowedRoles={['DEALER_ADMIN']}>
            <VisitTracking />
          </ProtectedLayout>
        } />
        <Route path="/dealer-admin/reports" element={
          <ProtectedLayout allowedRoles={['DEALER_ADMIN']}>
            <Reports />
          </ProtectedLayout>
        } />
        <Route path="/dealer-admin/notifications" element={
          <ProtectedLayout allowedRoles={['DEALER_ADMIN']}>
            <NotificationCenter />
          </ProtectedLayout>
        } />
        <Route path="/dealer-admin/settings" element={
          <ProtectedLayout allowedRoles={['DEALER_ADMIN']}>
            <SettingsPage />
          </ProtectedLayout>
        } />
        <Route path="/dealer-admin/subscription" element={
          <ProtectedLayout allowedRoles={['DEALER_ADMIN']}>
            <MySubscription />
          </ProtectedLayout>
        } />
        <Route path="/dealer-admin/billing" element={
          <ProtectedLayout allowedRoles={['DEALER_ADMIN']}>
            <BillingHistory />
          </ProtectedLayout>
        } />

        {/* Staff Routes */}
        <Route path="/staff" element={
          <ProtectedLayout allowedRoles={['STAFF']}>
            <StaffDashboard />
          </ProtectedLayout>
        } />
        <Route path="/staff/farmers" element={
          <ProtectedLayout allowedRoles={['STAFF']}>
            <FarmerManagement />
          </ProtectedLayout>
        } />
        <Route path="/staff/products" element={
          <ProtectedLayout allowedRoles={['STAFF']}>
            <ProductManagement />
          </ProtectedLayout>
        } />
        <Route path="/staff/visits" element={
          <ProtectedLayout allowedRoles={['STAFF']}>
            <VisitTracking />
          </ProtectedLayout>
        } />
        <Route path="/staff/suppliers" element={
          <ProtectedLayout allowedRoles={['STAFF']}>
            <SupplierManagement />
          </ProtectedLayout>
        } />
        <Route path="/staff/credit-book" element={
          <ProtectedLayout allowedRoles={['STAFF']}>
            <CreditBook />
          </ProtectedLayout>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
