import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/AuthProvider';
import { LogOut, Users, CreditCard, Home, Bell, User } from 'lucide-react';
import { api } from '../../services/api';

const ParentLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications', { headers: { 'X-User-Id': user?.id } });
      if (response.data) setNotifications(response.data);
    } catch (e) {
      console.error('Error fetching notifications', e);
    }
  };

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
            Portal dos Pais
          </p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <NavItem to="/parent" end icon={<Home size={20} />} label="Resumo" />
          <NavItem to="/parent/children" icon={<Users size={20} />} label="Meus Filhos" />
          <NavItem to="/parent/invoices" icon={<CreditCard size={20} />} label="Mensalidades" />
          <NavItem to="/parent/account" icon={<User size={20} />} label="Conta" />
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
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'hidden' }}>
        
        {/* Header with Notifications */}
        <header style={{ padding: '1.5rem 2.5rem', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative' }}
            >
              <Bell size={24} color="var(--color-text-secondary)" />
              {notifications.length > 0 && (
                <span style={{
                  position: 'absolute', top: -5, right: -5,
                  background: 'var(--color-error)', color: '#fff',
                  borderRadius: '50%', width: '18px', height: '18px',
                  fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="glass-panel" style={{
                position: 'absolute', right: 0, top: '100%', marginTop: '0.5rem',
                width: '320px', zIndex: 50, padding: '1rem', maxHeight: '400px', overflowY: 'auto'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                  Notificações
                </h3>
                {notifications.length === 0 ? (
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>Nenhuma notificação recebida.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {notifications.map(n => (
                      <div key={n.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{n.title}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{n.message}</p>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '0.5rem' }}>
                          {new Date(n.created_at).toLocaleDateString()} às {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <div style={{ flex: 1, padding: '2.5rem', overflowY: 'auto' }}>
          <Outlet />
        </div>
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

export default ParentLayout;
