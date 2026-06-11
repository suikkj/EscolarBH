import React from 'react';

const Contracts: React.FC = () => {
  return (
    <>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600 }}>Meus Contratos</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Visualize todos os seus contratos ativos e faturas.
        </p>
      </header>

      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <p>Você não possui nenhum contrato ativo.</p>
      </div>
    </>
  );
};

export default Contracts;
