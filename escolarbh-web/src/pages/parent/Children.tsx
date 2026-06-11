import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Users, Plus } from 'lucide-react';
import AdesaoForm from '../../components/AdesaoForm';

const Children: React.FC = () => {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentProfile, setParentProfile] = useState<any>(null);
  const [showAdesaoForm, setShowAdesaoForm] = useState(false);

  useEffect(() => {
    fetchProfileAndChildren();
  }, []);

  const fetchProfileAndChildren = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Fetch Profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profile) setParentProfile(profile);

    // Fetch Contracts (which represent the children enrolled)
    const { data: contractsData } = await supabase
      .from('contracts')
      .select('*')
      .eq('parent_id', session.user.id)
      .order('created_at', { ascending: false });

    if (contractsData) setChildren(contractsData);
    setLoading(false);
  };

  const handleSuccess = () => {
    setShowAdesaoForm(false);
    fetchProfileAndChildren();
  };

  if (showAdesaoForm) {
    return <AdesaoForm onSuccess={handleSuccess} onCancel={() => setShowAdesaoForm(false)} parentProfile={parentProfile} />;
  }

  return (
    <>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 600 }}>Meus Filhos</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Acompanhamento diário e cadastro de adesões.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdesaoForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={20} />
          Nova Adesão
        </button>
      </header>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Carregando dados...</div>
      ) : children.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>Você não possui filhos/adesões cadastradas.</p>
          <button className="btn-primary" onClick={() => setShowAdesaoForm(true)} style={{ marginTop: '1rem' }}>
            Fazer Adesão Agora
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {children.map(child => (
            <div key={child.id} className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{child.student_name}</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{child.school_name}</p>
                </div>
                <div style={{ 
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: 'var(--color-brand-400)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  Cadastrado
                </div>
              </div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <p><strong>Turno:</strong> {child.school_shift}</p>
                <p><strong>Adesão:</strong> {child.status === 'Assinado' ? 'Contrato Assinado' : 'Pendente'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default Children;
