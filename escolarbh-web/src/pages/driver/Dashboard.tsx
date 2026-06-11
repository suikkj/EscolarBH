import React from 'react';
import { DollarSign, AlertCircle, CheckCircle, Users } from 'lucide-react';

const Dashboard: React.FC = () => {
  // Mock Data
  const metrics = {
    totalExpected: 5400,
    totalPending: 1200,
    paidStudents: 18,
    unpaidStudents: 4,
    totalStudents: 22
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600 }}>Visão Geral</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Acompanhe o faturamento, os pagamentos do mês e acesse seus relatórios avançados.
        </p>
      </header>

      {/* Cards de Métricas Financeiras */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-brand-500)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Faturamento Previsto (Mês)</h3>
            <DollarSign size={20} color="var(--color-brand-400)" />
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {formatCurrency(metrics.totalExpected)}
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Pendente a Receber</h3>
            <AlertCircle size={20} color="var(--color-warning)" />
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {formatCurrency(metrics.totalPending)}
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Mensalidades Pagas</h3>
            <CheckCircle size={20} color="var(--color-success)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {metrics.paidStudents}
            </p>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>/ {metrics.totalStudents} alunos</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-error)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Mensalidades Atrasadas</h3>
            <Users size={20} color="var(--color-error)" />
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {metrics.unpaidStudents} <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 400 }}>alunos</span>
          </p>
        </div>

      </div>

      {/* Relatórios do Power BI */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
          Relatórios Inteligentes (Power BI)
        </h2>
        
        <div className="glass-panel" style={{ 
          width: '100%', 
          height: '600px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          overflow: 'hidden',
          background: 'var(--color-bg-secondary)',
          position: 'relative'
        }}>
          {/* 
            TODO: Substituir o src do iframe pelo link Embed real do PowerBI.
            Para testar visualmente, estou usando um placeholder ou um design fixo. 
          */}
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <img src="/logo.png" alt="Escolar Allyson" style={{ height: '60px', opacity: 0.3, marginBottom: '1rem' }} />
            <h3 style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Painel do Power BI</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
              Esta área está reservada para o iframe do Power BI. Substitua a URL no código quando o dashboard estiver publicado na web.
            </p>
          </div>

          {/* Exemplo de iFrame comentado pronto para uso: */}
          {/* <iframe 
                title="Relatório EscolarBH" 
                width="100%" 
                height="100%" 
                src="https://app.powerbi.com/view?r=seu-link-aqui" 
                frameBorder="0" 
                allowFullScreen={true}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              ></iframe> 
          */}
        </div>
      </section>
    </>
  );
};

export default Dashboard;
