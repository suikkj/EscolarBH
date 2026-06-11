import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/AuthProvider';
import { formatCEP, fetchAddressByCEP } from '../../utils/validators';

const formatCPF = (value: string) => {
  const numericValue = value.replace(/\D/g, '');
  return numericValue
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .slice(0, 14);
};

export default function Account() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    nome_completo: user?.user_metadata?.name || '',
    email: user?.email || '',
    cpf: user?.user_metadata?.cpf ? formatCPF(user.user_metadata.cpf) : '',
    telefone: '',
    cep: '',
    estado: '',
    cidade: '',
    rua: '',
    numero: '',
    complemento: ''
  });

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        const response = await api.get('/users/me', { headers: { 'X-User-Id': user.id } });
        const data = response.data;
        
        setFormData({
          nome_completo: (data?.nomeCompleto && data.nomeCompleto !== 'Novo Usuário (Local)') ? data.nomeCompleto : (user?.user_metadata?.name || ''),
          email: (data?.email && !data.email.includes('@local.dev')) ? data.email : (user?.email || ''),
          cpf: user?.user_metadata?.cpf ? formatCPF(user.user_metadata.cpf) : (data?.cpf ? formatCPF(data.cpf) : ''),
          telefone: data?.telefone || '',
          cep: data?.cep || '',
          estado: data?.estado || '',
          cidade: data?.cidade || '',
          rua: data?.rua || '',
          numero: data?.numero || '',
          complemento: data?.complemento || ''
        });
      } catch (err: any) {
        console.error('Error loading profile:', err);
        setError('Não foi possível carregar os dados da conta.');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCep = formatCEP(e.target.value);
    setFormData(prev => ({ ...prev, cep: newCep }));
    if (newCep.length === 9) {
      const addr = await fetchAddressByCEP(newCep);
      if (addr) {
        setFormData(prev => ({
          ...prev,
          rua: addr.rua,
          cidade: addr.cidade,
          estado: addr.estado
        }));
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.put('/users/me', {
          nomeCompleto: formData.nome_completo,
          email: user?.email,
          cpf: user?.user_metadata?.cpf ? formatCPF(user.user_metadata.cpf) : undefined,
          telefone: formData.telefone,
          cep: formData.cep.replace(/\D/g, ''),
          estado: formData.estado,
          cidade: formData.cidade,
          rua: formData.rua,
          numero: formData.numero,
          complemento: formData.complemento
      }, { headers: { 'X-User-Id': user.id } });

      setSuccess('Dados da conta atualizados com sucesso!');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError('Erro ao salvar os dados da conta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Minha Conta {loading && <span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', fontWeight: 'normal', marginLeft: '1rem' }}>(Atualizando...)</span>}
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>Visualize e edite suas informações de contato e endereço.</p>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#6ee7b7', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-brand-300)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Dados Pessoais</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Nome Completo</label>
              <input type="text" name="nome_completo" className="input-field" value={formData.nome_completo} onChange={handleChange} required />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>E-mail</label>
                <input type="email" name="email" className="input-field" value={formData.email} disabled style={{ background: 'var(--color-bg-secondary)', cursor: 'not-allowed', opacity: 0.7 }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>O e-mail não pode ser alterado.</span>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>CPF</label>
                <input type="text" name="cpf" className="input-field" value={formData.cpf} disabled style={{ background: 'var(--color-bg-secondary)', cursor: 'not-allowed', opacity: 0.7 }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Por segurança, o CPF não pode ser editado.</span>
              </div>
            </div>

            <div style={{ width: '50%' }}>
              <label style={labelStyle}>Telefone</label>
              <input type="text" name="telefone" className="input-field" value={formData.telefone} onChange={handleChange} placeholder="+55 (31) 99999-9999" />
            </div>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-brand-300)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginTop: '1rem' }}>Endereço</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: '50%' }}>
              <label style={labelStyle}>CEP</label>
              <input type="text" name="cep" className="input-field" value={formData.cep} onChange={handleCEPChange} maxLength={9} required />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 2 }}>
                <label style={labelStyle}>Rua</label>
                <input type="text" name="rua" className="input-field" value={formData.rua} onChange={handleChange} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Número</label>
                <input type="text" name="numero" className="input-field" value={formData.numero} onChange={handleChange} required />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Complemento</label>
                <input type="text" name="complemento" className="input-field" value={formData.complemento} onChange={handleChange} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Cidade</label>
                <input type="text" name="cidade" className="input-field" value={formData.cidade} onChange={handleChange} required />
              </div>
              <div style={{ width: '80px' }}>
                <label style={labelStyle}>UF</label>
                <input type="text" name="estado" className="input-field" value={formData.estado} onChange={handleChange} maxLength={2} required />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>

      </form>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem', color: 'var(--color-text-secondary)' };
