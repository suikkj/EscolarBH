import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { formatCPF, isValidCPF, formatCEP, fetchAddressByCEP } from '../utils/validators';
import { Eye, EyeOff } from 'lucide-react';

const Register: React.FC = () => {
  // Step 1 Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [cep, setCep] = useState('');
  const [estado, setEstado] = useState('');
  const [cidade, setCidade] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<'MOTORISTA' | 'CONTRATANTE'>('CONTRATANTE');
  
  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // 1: Form, 2: OTP
  const [otpCode, setOtpCode] = useState('');

  const navigate = useNavigate();

  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCep = formatCEP(e.target.value);
    setCep(newCep);
    if (newCep.length === 9) {
      const addr = await fetchAddressByCEP(newCep);
      if (addr) {
        setRua(addr.rua);
        setCidade(addr.cidade);
        setEstado(addr.estado);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }
    if (!isValidCPF(cpf)) {
      setError('CPF inválido.');
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          name,
          cpf: cpf.replace(/\D/g, '')
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Se a confirmação de e-mail estiver ativa, o usuário é criado mas a sessão fica pendente
    if (data?.user) {
      
      // Alguns provedores retornam session null quando requerem confirmação
      if (!data.session) {
        setStep(2);
        setLoading(false);
        return;
      } else {
        // Se já logou direto (confirmação desativada), cadastra perfil e vai pro app
        await insertProfileAndRedirect(data.user.id);
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: otpError } = await supabase.auth.verifyOtp({
      email,
      token: otpCode.replace('-', ''), // Remove o traço antes de enviar
      type: 'signup'
    });

    if (otpError) {
      setError('Código inválido ou expirado.');
      setLoading(false);
      return;
    }

    if (data?.user) {
      await insertProfileAndRedirect(data.user.id);
    }
  };

  const insertProfileAndRedirect = async (userId: string) => {
    try {
      await api.put('/users/me', {
          nomeCompleto: name,
          email: email,
          cpf: cpf,
          cep: cep.replace(/\D/g, ''),
          estado,
          cidade,
          rua,
          numero,
          complemento
      }, { headers: { 'X-User-Id': userId } });
    } catch (insertError: any) {
      console.warn('Erro ao inserir perfil do usuário:', insertError);
    }

    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, var(--color-brand-900), var(--color-bg-primary))',
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', width: '100%', maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '60px', marginBottom: '0.25rem' }} />
          <h1 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Escolar Allyson
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            {step === 1 ? 'Crie sua conta' : 'Verifique seu E-mail'}
          </p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid var(--color-error)', 
            color: '#fca5a5', 
            padding: '0.75rem', 
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>
              <label style={labelStyle}>Nome Completo</label>
              <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>CPF</label>
                <input type="text" className="input-field" value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} maxLength={14} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>CEP</label>
                <input type="text" className="input-field" value={cep} onChange={handleCEPChange} maxLength={9} required />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 2 }}>
                <label style={labelStyle}>Rua</label>
                <input type="text" className="input-field" value={rua} onChange={(e) => setRua(e.target.value)} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Número</label>
                <input type="text" className="input-field" value={numero} onChange={(e) => setNumero(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Complemento</label>
                <input type="text" className="input-field" value={complemento} onChange={(e) => setComplemento(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Cidade</label>
                <input type="text" className="input-field" value={cidade} onChange={(e) => setCidade(e.target.value)} required />
              </div>
              <div style={{ width: '60px' }}>
                <label style={labelStyle}>UF</label>
                <input type="text" className="input-field" value={estado} onChange={(e) => setEstado(e.target.value)} maxLength={2} required />
              </div>
            </div>

            <div>
              <label style={labelStyle}>E-mail</label>
              <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Senha</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} className="input-field" style={{ paddingRight: '40px' }} value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', padding: '4px' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Confirme a Senha</label>
                <div style={{ position: 'relative' }}>
                  <input type={showConfirmPassword ? 'text' : 'password'} className="input-field" style={{ paddingRight: '40px' }} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', padding: '4px' }}>
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '0.25rem', marginTop: '0.25rem' }}>
              <label style={labelStyle}>Você é um...</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={() => setRole('MOTORISTA')} style={roleBtnStyle(role === 'MOTORISTA')}>
                  Motorista
                </button>
                <button type="button" onClick={() => setRole('CONTRATANTE')} style={roleBtnStyle(role === 'CONTRATANTE')}>
                  Responsável
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.25rem' }}>
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              Já tem uma conta? <button type="button" onClick={() => navigate('/login')} className="link-btn">Entrar</button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>
              Enviamos um código de segurança para o e-mail <strong>{email}</strong>. Digite-o abaixo para confirmar sua conta.
            </p>
            <div>
              <label style={{ ...labelStyle, textAlign: 'center' }}>Código de Verificação</label>
              <input
                type="text"
                className="input-field"
                value={otpCode}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '').substring(0, 8);
                  if (val.length > 4) val = val.replace(/^(\d{4})(\d+)/, '$1-$2');
                  setOtpCode(val);
                }}
                placeholder="0000-0000"
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.2rem' }}
                required
              />
            </div>
            
            <button type="submit" className="btn-primary" disabled={loading || otpCode.replace('-', '').length < 8}>
              {loading ? 'Verificando...' : 'Confirmar E-mail'}
            </button>
            
            <button type="button" onClick={() => setStep(1)} className="link-btn">
              Voltar
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.1rem', color: 'var(--color-text-secondary)' };
const roleBtnStyle = (active: boolean) => ({
  flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)',
  background: active ? 'var(--color-brand-600)' : 'transparent', color: active ? '#fff' : 'var(--color-text-secondary)',
  fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
});

export default Register;
