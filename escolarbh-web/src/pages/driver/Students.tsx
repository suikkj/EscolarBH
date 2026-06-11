import React, { useState } from 'react';
import { User } from 'lucide-react';

const mockStudents = [
  { id: '1', nome: 'João Pedro', escola: 'Escola Municipal A', turno: 'MANHA' },
  { id: '2', nome: 'Maria Clara', escola: 'Colégio B', turno: 'TARDE' },
  { id: '3', nome: 'Lucas Silva', escola: 'Centro Educacional C', turno: 'INTEGRAL' },
  { id: '4', nome: 'Ana Beatriz', escola: 'Escola Municipal A', turno: 'MANHA' },
];

const Students: React.FC = () => {
  const [filter, setFilter] = useState<'TODOS' | 'MANHA' | 'TARDE' | 'INTEGRAL'>('TODOS');

  const filteredStudents = mockStudents.filter(s => filter === 'TODOS' || s.turno === filter);

  const getShiftLabel = (turno: string) => {
    switch (turno) {
      case 'MANHA': return 'Manhã';
      case 'TARDE': return 'Tarde';
      case 'INTEGRAL': return 'Integral';
      default: return turno;
    }
  };

  const getShiftColor = (turno: string) => {
    switch (turno) {
      case 'MANHA': return 'var(--color-brand-400)';
      case 'TARDE': return 'var(--color-warning)';
      case 'INTEGRAL': return 'var(--color-success)';
      default: return 'var(--color-text-secondary)';
    }
  };

  return (
    <>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600 }}>Meus Alunos</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Gerencie a lista de alunos vinculados aos seus contratos ativos.
        </p>
      </header>

      {/* Filtros de Turno */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setFilter('TODOS')}
          style={{ padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--glass-border)', background: filter === 'TODOS' ? 'var(--color-brand-500)' : 'var(--glass-bg)', color: '#fff', cursor: 'pointer' }}
        >
          Todos
        </button>
        <button 
          onClick={() => setFilter('MANHA')}
          style={{ padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--glass-border)', background: filter === 'MANHA' ? 'var(--color-brand-400)' : 'var(--glass-bg)', color: filter === 'MANHA' ? '#000' : '#fff', cursor: 'pointer', fontWeight: filter === 'MANHA' ? 600 : 400 }}
        >
          Manhã
        </button>
        <button 
          onClick={() => setFilter('TARDE')}
          style={{ padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--glass-border)', background: filter === 'TARDE' ? 'var(--color-warning)' : 'var(--glass-bg)', color: filter === 'TARDE' ? '#000' : '#fff', cursor: 'pointer', fontWeight: filter === 'TARDE' ? 600 : 400 }}
        >
          Tarde
        </button>
        <button 
          onClick={() => setFilter('INTEGRAL')}
          style={{ padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--glass-border)', background: filter === 'INTEGRAL' ? 'var(--color-success)' : 'var(--glass-bg)', color: filter === 'INTEGRAL' ? '#000' : '#fff', cursor: 'pointer', fontWeight: filter === 'INTEGRAL' ? 600 : 400 }}
        >
          Integral
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredStudents.length > 0 ? (
          filteredStudents.map(student => (
            <div key={student.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={24} color="var(--color-text-secondary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{student.nome}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{student.escola}</p>
                </div>
              </div>
              <div>
                <span style={{ 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem', 
                  fontWeight: 600,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: getShiftColor(student.turno),
                  border: `1px solid ${getShiftColor(student.turno)}`
                }}>
                  {getShiftLabel(student.turno)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <p>Nenhum aluno encontrado para este turno.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Students;
