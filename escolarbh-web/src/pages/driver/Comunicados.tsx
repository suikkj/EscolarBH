import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Send, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/AuthProvider';

const Comunicados: React.FC = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    setLoading(true);
    setSuccess('');
    setError('');

    try {
      // 1. Encontrar todos os pais (parent_id) que têm contratos ativos com este motorista.
      const { data: contracts, error: fetchError } = await supabase
        .from('contracts')
        .select('parent_id')
        .eq('driver_id', user?.id)
        .eq('status', 'Assinado');

      if (fetchError) throw fetchError;

      if (!contracts || contracts.length === 0) {
        setError('Você não possui pais com contratos ativos para notificar.');
        setLoading(false);
        return;
      }

      // Remover duplicatas caso o pai tenha mais de um filho (contrato)
      const uniqueParentIds = Array.from(new Set(contracts.map(c => c.parent_id)));

      // 2. Inserir notificações no banco de dados para cada pai
      const notifications = uniqueParentIds.map(parentId => ({
        user_id: parentId,
        sender_id: user?.id,
        title,
        message
      }));

      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) throw insertError;

      setSuccess(`Comunicado enviado com sucesso para ${uniqueParentIds.length} responsável(eis).`);
      setTitle('');
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar comunicado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600 }}>Comunicados</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Envie avisos rápidos para todos os responsáveis.
        </p>
      </header>

      <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px' }}>
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
              Título do Comunicado
            </label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Ex: Feriado na Sexta-feira" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
              Mensagem
            </label>
            <textarea 
              className="input-field" 
              placeholder="Digite aqui o seu comunicado..." 
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              style={{ resize: 'vertical' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || !title || !message}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
          >
            <Send size={18} />
            {loading ? 'Enviando...' : 'Enviar Comunicado'}
          </button>
        </form>
      </div>
    </>
  );
};

export default Comunicados;
