import React, { useState, useEffect } from 'react';
import { CreditCard, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../hooks/AuthProvider';

const Overview: React.FC = () => {
  const { user } = useAuth();
  const [latestNotification, setLatestNotification] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchLatestNotification();
    }
  }, [user]);

  const fetchLatestNotification = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (data) setLatestNotification(data);
  };

  return (
    <>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600 }}>Bem-vindo!</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Acompanhe o transporte escolar dos seus filhos e gerencie seus pagamentos.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Fatura Card - Empty state since DB is not ready for invoices yet */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Próxima Mensalidade</h3>
            <CreditCard size={24} color="var(--color-text-muted)" />
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem', textAlign: 'center', padding: '1rem 0' }}>
            Nenhuma fatura em aberto no momento.
          </p>
        </div>

        {/* Avisos Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', border: latestNotification ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertCircle size={24} color={latestNotification ? 'var(--color-warning)' : 'var(--color-text-muted)'} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: latestNotification ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>Último Aviso</h3>
          </div>
          {latestNotification ? (
            <div>
              <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--color-text-primary)' }}>{latestNotification.title}</strong>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.5, fontSize: '0.9rem' }}>
                {latestNotification.message}
              </p>
            </div>
          ) : (
             <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.5, textAlign: 'center', padding: '1rem 0' }}>
               Sem novos comunicados.
             </p>
          )}
        </div>
      </div>
    </>
  );
};

export default Overview;
