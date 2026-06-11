import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/AuthProvider';
import { LogOut, Map, Users, FileText, MessageSquare, User, LayoutDashboard, DollarSign } from 'lucide-react';

const DriverLayout: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      {/* Sidebar */}
      <aside className="glass-panel" style={{ 
        width: '260px', 
        borderLeft: 'none', 
        borderTop: 'none', 
        borderBottom: 'none', 
        borderRadius: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '36px' }} />
          <h2 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 700 }}>Escolar Allyson</h2>
        </div>
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Painel do Motorista
          </p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <NavItem to="/driver" end icon={<LayoutDashboard size={20} />} label="Visão Geral" />
          <NavItem to="/driver/finance" icon={<DollarSign size={20} />} label="Financeiro" />
          <NavItem to="/driver/mapa" icon={<Map size={20} />} label="Mapa" />
          <NavItem to="/driver/students" icon={<Users size={20} />} label="Meus Alunos" />
          <NavItem to="/driver/contracts" icon={<FileText size={20} />} label="Contratos" />
          <NavItem to="/driver/comunicados" icon={<MessageSquare size={20} />} label="Comunicados" />
          <NavItem to="/driver/account" icon={<User size={20} />} label="Conta" />
        </nav>

        <div style={{ 
          marginTop: 'auto', 
          paddingTop: '1.5rem', 
          borderTop: '1px solid var(--glass-border)' 
        }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1rem', wordBreak: 'break-all' }}>
            {user?.email}
          </p>
          <button 
            onClick={signOut}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--color-error)', 
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 500
            }}
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2.5rem', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, to, end = false }: { icon: React.ReactNode, label: string, to: string, end?: boolean }) => (
  <NavLink 
    to={to}
    end={end}
    style={({ isActive }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      borderRadius: 'var(--radius-md)',
      color: isActive ? '#fff' : 'var(--color-text-secondary)',
      background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
      textDecoration: 'none',
      transition: 'all 0.2s',
      fontWeight: isActive ? 600 : 500
    })}
  >
    {({ isActive }) => (
      <>
        {React.cloneElement(icon as React.ReactElement<{ color?: string }>, { 
          color: isActive ? 'var(--color-brand-500)' : 'currentColor' 
        })}
        {label}
      </>
    )}
  </NavLink>
);

export default DriverLayout;
