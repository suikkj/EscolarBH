import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header */}
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1.5rem',
        borderBottom: '1px solid var(--glass-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '40px' }} />
          <h1 className="gradient-text" style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
            Escolar Allyson
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/login')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-full)',
              background: 'transparent',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            Entrar
          </button>
          <button 
            onClick={() => navigate('/register')}
            className="btn-primary"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-full)'
            }}
          >
            Criar Conta Livre
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{
        padding: '5rem 3rem',
        textAlign: 'center',
        background: 'radial-gradient(circle at center, var(--color-brand-900), var(--color-bg-primary))'
      }}>
        <h2 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.1 }}>
          O transporte escolar dos <br/>seus filhos com <span className="gradient-text">Segurança e Paz</span>
        </h2>
        <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto 3rem auto', lineHeight: 1.6 }}>
          A plataforma completa para gerenciar o transporte escolar. Assinatura de contrato digital, cobrança automática e rastreio para responsáveis e motoristas.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            onClick={() => navigate('/register')}
            className="btn-primary"
            style={{ padding: '1rem 2rem', fontSize: '1.125rem', borderRadius: 'var(--radius-full)' }}
          >
            Começar Agora
          </button>
        </div>
      </main>

      {/* Features */}
      <section style={{
        padding: '5rem 3rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Segurança LGPD</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Seus dados e os dados do seu filho são criptografados de ponta a ponta.
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Contrato Digital</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Esqueça os papéis. Assine o contrato de prestação de serviços com validade jurídica de qualquer lugar.
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Pagamento Automático</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Cobrança via PIX ou Boleto que funciona de forma automática, tirando a dor de cabeça da gestão financeira.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Landing;
