import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/AuthProvider';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';

// Layouts
import DriverLayout from './components/layouts/DriverLayout';
import ParentLayout from './components/layouts/ParentLayout';

import DriverDashboard from './pages/driver/Dashboard';
import Geofencing from './pages/driver/Geofencing';
import DriverStudents from './pages/driver/Students';
import DriverFinance from './pages/driver/Finance';
import DriverContracts from './pages/driver/Contracts';
import DriverComunicados from './pages/driver/Comunicados';

import ParentOverview from './pages/parent/Overview';
import ParentChildren from './pages/parent/Children';
import ParentInvoices from './pages/parent/Invoices';

// Shared Pages
import Account from './pages/shared/Account';

// Admin Pages
import AdminLayout from './components/layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';

const queryClient = new QueryClient();

// Componente para rotas protegidas com base no Role
const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole: 'MOTORISTA' | 'CONTRATANTE' | 'ADMIN' }) => {
  const { session, role, loading } = useAuth();
  
  if (loading) return <div className="p-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>Carregando...</div>;
  if (!session) return <Navigate to="/login" replace />;
  if (role !== allowedRole) return <Navigate to="/" replace />;
  
  return <>{children}</>;
};

// Componente para redirecionar o root baseado no Role
const RootRedirect = () => {
  const { session, role, loading } = useAuth();

  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  
  if (role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (role === 'CONTRATANTE') return <Navigate to="/parent" replace />;
  return <Navigate to="/driver" replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Dashboard Redirect */}
            <Route path="/dashboard" element={<RootRedirect />} />
            
            {/* Driver Routes */}
            <Route 
              path="/driver" 
              element={
                <ProtectedRoute allowedRole="MOTORISTA">
                  <DriverLayout />
                </ProtectedRoute>
              } 
            >
              <Route index element={<DriverDashboard />} />
              <Route path="mapa" element={<Geofencing />} />
              <Route path="students" element={<DriverStudents />} />
              <Route path="finance" element={<DriverFinance />} />
              <Route path="contracts" element={<DriverContracts />} />
              <Route path="comunicados" element={<DriverComunicados />} />
              <Route path="account" element={<Account />} />
            </Route>
            {/* Parent Routes */}
            <Route 
              path="/parent" 
              element={
                <ProtectedRoute allowedRole="CONTRATANTE">
                  <ParentLayout />
                </ProtectedRoute>
              } 
            >
              <Route index element={<ParentOverview />} />
              <Route path="children" element={<ParentChildren />} />
              <Route path="invoices" element={<ParentInvoices />} />
              <Route path="account" element={<Account />} />
            </Route>

            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRole="ADMIN">
                  <AdminLayout />
                </ProtectedRoute>
              } 
            >
              <Route index element={<AdminDashboard />} />
            </Route>            
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
