import React, { useState } from 'react';
import { DollarSign, CheckCircle, AlertCircle, Save, X, Edit2 } from 'lucide-react';

const mockFinanceData = [
  { id: '1', nome: 'João Pedro', responsavel: 'Carlos Santos', valor: 350.0, status: 'EM_DIA' },
  { id: '2', nome: 'Maria Clara', responsavel: 'Ana Silva', valor: 400.0, status: 'PENDENTE' },
  { id: '3', nome: 'Lucas Silva', responsavel: 'Roberto Silva', valor: 350.0, status: 'EM_DIA' },
  { id: '4', nome: 'Ana Beatriz', responsavel: 'Fernanda Lima', valor: 450.0, status: 'PENDENTE' },
];

const Finance: React.FC = () => {
  const [studentsData, setStudentsData] = useState(mockFinanceData);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [pendingChanges, setPendingChanges] = useState<{ id: string, name: string, oldVal: number, newVal: number }[]>([]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleValueChange = (id: string, newValue: string) => {
    if (!isEditing) return;
    
    // Apenas permite números e ponto/vírgula
    const cleanValue = newValue.replace(/[^0-9.,]/g, '').replace(',', '.');
    const numericValue = parseFloat(cleanValue);

    setStudentsData(prev => prev.map(student => {
      if (student.id === id) {
        return { ...student, inputValue: newValue, valor: isNaN(numericValue) ? 0 : numericValue };
      }
      return student;
    }));
  };

  const handleSave = () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    const changes = studentsData.filter(s => {
      const newVal = (s as any).valor;
      const oldVal = mockFinanceData.find(m => m.id === s.id)?.valor || 0;
      return newVal !== oldVal;
    }).map(s => ({
      id: s.id,
      name: s.nome,
      oldVal: mockFinanceData.find(m => m.id === s.id)?.valor || 0,
      newVal: (s as any).valor
    }));

    if (changes.length === 0) {
      setIsEditing(false); // Cancel editing if no changes
      return;
    }

    setPendingChanges(changes);
    setModalStep(1);
    setShowModal(true);
  };

  const confirmSave = () => {
    setSaving(true);
    // Simular chamada de API e envio de e-mail
    setTimeout(() => {
      setSaving(false);
      setModalStep(2); // Sucesso e envio de email
    }, 1500);
  };

  const closeModal = () => {
    setShowModal(false);
    if (modalStep === 2) {
      // Atualizar o "mock" local para os novos valores salvos
      mockFinanceData.forEach(m => {
        const changed = pendingChanges.find(p => p.id === m.id);
        if (changed) m.valor = changed.newVal;
      });
      setIsEditing(false);
    }
  };

  return (
    <>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 600 }}>Financeiro e Mensalidades</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Gerencie os valores cobrados de cada aluno e acompanhe os pagamentos.
          </p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: isEditing ? 'var(--color-success)' : 'var(--color-brand-500)' }}
        >
          {isEditing ? <Save size={20} /> : <Edit2 size={20} />}
          {saving ? 'Processando...' : isEditing ? 'Salvar Alterações' : 'Editar Mensalidade'}
        </button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {studentsData.map(student => (
          <div key={student.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            
            {/* Informações do Aluno */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '250px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={24} color="var(--color-brand-400)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{student.nome}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Resp: {student.responsavel}</p>
              </div>
            </div>

            {/* Input de Valor e Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  MENSALIDADE
                </label>
                <div style={{ position: 'relative', width: '120px' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>R$</span>
                  <input 
                    type="text"
                    value={(student as any).inputValue ?? student.valor.toFixed(2)}
                    onChange={(e) => handleValueChange(student.id, e.target.value)}
                    disabled={!isEditing}
                    className="input-field"
                    style={{ paddingLeft: '2rem', paddingRight: '0.5rem', width: '100%', fontSize: '1rem', fontWeight: 500, backgroundColor: isEditing ? 'var(--color-background)' : 'var(--color-background-surface)', opacity: isEditing ? 1 : 0.7 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '100px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  STATUS
                </label>
                {student.status === 'EM_DIA' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-success)', fontWeight: 600, padding: '0.5rem 0' }}>
                    <CheckCircle size={18} />
                    Em Dia
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-error)', fontWeight: 600, padding: '0.5rem 0' }}>
                    <AlertCircle size={18} />
                    Atrasado
                  </div>
                )}
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Modal de Confirmação em Múltiplas Etapas */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            
            {modalStep === 1 && (
              <>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Confirmar Alterações</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                  Você está alterando o valor da mensalidade para os seguintes alunos. Ao confirmar, um <strong>e-mail automático</strong> será enviado aos responsáveis.
                </p>
                <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem' }}>
                  {pendingChanges.map(change => (
                    <div key={change.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--color-text-primary)' }}>{change.name}</span>
                      <div>
                        <span style={{ textDecoration: 'line-through', color: 'var(--color-text-tertiary)', marginRight: '0.5rem' }}>{formatCurrency(change.oldVal)}</span>
                        <span style={{ color: 'var(--color-brand-400)', fontWeight: 'bold' }}>{formatCurrency(change.newVal)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button onClick={closeModal} className="btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>Cancelar</button>
                  <button onClick={confirmSave} disabled={saving} className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                    {saving ? 'Confirmando...' : 'Confirmar e Notificar'}
                  </button>
                </div>
              </>
            )}

            {modalStep === 2 && (
              <div style={{ textAlign: 'center' }}>
                <CheckCircle size={64} color="var(--color-success)" style={{ margin: '0 auto 1.5rem' }} />
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Alteração Concluída!</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                  As mensalidades foram atualizadas no sistema e os e-mails informativos foram enviados para os responsáveis.
                </p>
                <button onClick={closeModal} className="btn-primary" style={{ width: '100%', padding: '0.75rem 1.5rem' }}>
                  Entendi
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Finance;
