import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { RestaurantDashboard } from './pages/RestaurantDashboard';
import { CustomerMenu } from './pages/CustomerMenu';
import { StaffFloorPortal } from './components/StaffFloorPortal';

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-slate-400">Loading RestoQR Platform...</p>
      </div>
    </div>
  );
}

function CustomerMenuRoute() {
  const params = useParams();
  const navigate = useNavigate();
  const slug = params.slug || 'urban-bites-cafe';
  const tableNum = params.tableNum ? parseInt(params.tableNum, 10) : undefined;
  return <CustomerMenu slug={slug} tableNumber={tableNum} onNavigate={navigate} />;
}

function RestaurantDashboardRoute() {
  const params = useParams();
  const navigate = useNavigate();
  const tab = params.tab || 'dashboard';
  return <RestaurantDashboard onNavigate={navigate} initialTab={tab} />;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const handleNavigate = (path: string) => navigate(path);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Login onNavigate={handleNavigate} />;
  }

  const isAdmin = user.role === 'platform_admin';

  // Restaurant staff trying to access /admin → redirect
  if (!isAdmin && location.pathname.startsWith('/admin')) {
    return <Navigate to="/restaurant/dashboard" replace />;
  }

  // Waiter → floor portal when specifically on that route
  if (user.role === 'waiter' && location.pathname === '/restaurant/floor') {
    return <StaffFloorPortal onNavigate={handleNavigate} />;
  }

  // Kitchen staff → always kitchen tab
  if (user.role === 'kitchen_staff') {
    return <RestaurantDashboard onNavigate={handleNavigate} initialTab="kitchen" />;
  }

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/" element={<AdminDashboard onNavigate={handleNavigate} />} />
        <Route path="/admin/*" element={<AdminDashboard onNavigate={handleNavigate} />} />
        <Route path="/restaurant/:tab" element={<RestaurantDashboardRoute />} />
        <Route path="/restaurant" element={<RestaurantDashboard onNavigate={handleNavigate} initialTab="dashboard" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Default: restaurant dashboard
  return (
    <Routes>
      <Route path="/" element={<RestaurantDashboard onNavigate={handleNavigate} initialTab="dashboard" />} />
      <Route path="/restaurant" element={<RestaurantDashboard onNavigate={handleNavigate} initialTab="dashboard" />} />
      <Route path="/restaurant/:tab" element={<RestaurantDashboardRoute />} />
      <Route path="/restaurant/floor" element={<StaffFloorPortal onNavigate={handleNavigate} />} />
      <Route path="*" element={<Navigate to="/restaurant/dashboard" replace />} />
    </Routes>
  );
}

function AppContent() {
  return (
    <Routes>
      <Route path="/menu/:slug/table/:tableNum" element={<CustomerMenuRoute />} />
      <Route path="/menu/:slug" element={<CustomerMenuRoute />} />
      <Route path="/menu" element={<CustomerMenuRoute />} />
      <Route path="/*" element={<AppRoutes />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
