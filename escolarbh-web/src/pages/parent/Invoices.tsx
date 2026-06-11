import React from 'react';

const Invoices: React.FC = () => {
  return (
    <>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600 }}>Mensalidades</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Histórico de pagamentos e faturas em aberto.
        </p>
      </header>

      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <p>Histórico completo de mensalidades.</p>
      </div>
    </>
  );
};

export default Invoices;
