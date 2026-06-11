import React, { useState } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import ContractTemplatePDF, { type ContractData } from './ContractTemplatePDF';
import { supabase } from '../services/supabaseClient';

interface AdesaoFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  parentProfile: any; // Dados do contratante
}
const formatCPF = (value: string) => {
  const numericValue = value.replace(/\D/g, '');
  return numericValue
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .slice(0, 14);
};

const AdesaoForm: React.FC<AdesaoFormProps> = ({ onSuccess, onCancel, parentProfile }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1 to 12
  const currentYear = currentDate.getFullYear();
  const targetYear = 2026;
  const targetMonth = 12;

  const initialParcelas = ((targetYear - currentYear) * 12) + (targetMonth - currentMonth + 1);
  const valorMensal = 350;
  const initialValorAnual = (initialParcelas > 0 ? initialParcelas : 1) * valorMensal;

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const mesAtualStr = capitalize(currentDate.toLocaleString('pt-BR', { month: 'long' }));

  const [contractData, setContractData] = useState<ContractData>({
    contratante: {
      nome: parentProfile?.nome_completo || '',
      endereco: parentProfile?.rua ? `${parentProfile.rua}, ${parentProfile.numero}` : '',
      bairro: parentProfile?.bairro || '',
      cidade: parentProfile?.cidade || '',
      uf: parentProfile?.estado || '',
      cep: parentProfile?.cep || '',
      telefone: parentProfile?.telefone || '',
      rg: parentProfile?.rg || '',
      cpf: parentProfile?.cpf ? formatCPF(parentProfile.cpf) : '',
      nascimento: '',
    },
    aluno: {
      nome: '',
      cpf: '',
      nascimento: '',
      escola: 'Colégio M2',
      turno: 'Manhã',
    },
    pagamento: {
      valorInicial: initialValorAnual.toFixed(2).replace('.', ','),
      parcelas: (initialParcelas > 0 ? initialParcelas : 1).toString(),
      valorParcela: '350,00',
      vencimentoInicial: `${mesAtualStr}/${currentYear}`,
      vencimentoFinal: `Dezembro/${targetYear}`,
      diaVencimento: '05',
      ultimoMesPagamento: 'Dezembro',
    }
  });

  const handleContractDataChange = (section: keyof ContractData, field: string, value: string) => {
    setContractData((prev: any) => {
      const newData = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      };

      // Recalcular valor anual se parcelas mudar
      if (section === 'pagamento' && (field === 'parcelas' || field === 'valorParcela')) {
        const parcelas = parseInt(newData.pagamento.parcelas) || 0;
        const valorParcela = parseFloat(newData.pagamento.valorParcela.replace(',', '.')) || 0;
        newData.pagamento.valorInicial = (parcelas * valorParcela).toFixed(2).replace('.', ',');
      }

      return newData;
    });
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSignContract = async () => {
    setLoading(true);
    setError('');

    try {
      const { error: dbError } = await supabase.from('contracts').insert({
        parent_id: parentProfile.id,
        // Assuming a mock driver_id or fetching from available drivers
        driver_id: '00000000-0000-0000-0000-000000000000', // Você precisará passar o ID do motorista real aqui
        student_name: contractData.aluno.nome,
        school_name: contractData.aluno.escola,
        school_shift: contractData.aluno.turno,
        contract_value: parseFloat(contractData.pagamento.valorInicial.replace(',', '.')),
        installments: parseInt(contractData.pagamento.parcelas),
        installment_value: parseFloat(contractData.pagamento.valorParcela.replace(',', '.')),
        status: 'Assinado',
        signed_at: new Date().toISOString()
      });

      if (dbError) throw dbError;
      
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao assinar contrato.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>
        Nova Adesão - Contrato de Transporte
      </h2>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* STEP 1: Dados do Aluno e Responsável */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Dados do Aluno */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-brand-300)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
              Passo 1: Dados do Aluno
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Nome Completo do Aluno (O mesmo do CPF)</label>
                <input type="text" className="input-field" value={contractData.aluno.nome} onChange={(e) => handleContractDataChange('aluno', 'nome', e.target.value)} placeholder="Ex: João da Silva" />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>CPF do Aluno</label>
                  <input type="text" className="input-field" value={contractData.aluno.cpf} onChange={(e) => handleContractDataChange('aluno', 'cpf', formatCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Data de Nascimento do Aluno</label>
                  <input type="date" className="input-field" value={contractData.aluno.nascimento} onChange={(e) => handleContractDataChange('aluno', 'nascimento', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Dados do Responsável */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-brand-300)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>
              Dados do Responsável (Contratante)
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Nome Completo do Responsável</label>
                <input type="text" className="input-field" value={contractData.contratante.nome} onChange={(e) => handleContractDataChange('contratante', 'nome', e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>CPF do Responsável</label>
                  <input type="text" className="input-field" value={contractData.contratante.cpf} onChange={(e) => handleContractDataChange('contratante', 'cpf', formatCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Data de Nascimento do Responsável</label>
                  <input type="date" className="input-field" value={contractData.contratante.nascimento} onChange={(e) => handleContractDataChange('contratante', 'nascimento', e.target.value)} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Endereço do Responsável (Baseado no seu perfil)</label>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  {contractData.contratante.endereco ? `${contractData.contratante.endereco}, ${contractData.contratante.bairro} - ${contractData.contratante.cidade}/${contractData.contratante.uf} - CEP: ${contractData.contratante.cep}` : 'Endereço não cadastrado no perfil.'}
                </div>
              </div>
            </div>
          </div>

          {/* Dados da Escola */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-brand-300)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>
              Instituição de Ensino
            </h3>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 2 }}>
                <label style={labelStyle}>Nome da Escola</label>
                <input type="text" className="input-field" value={contractData.aluno.escola} readOnly style={{ background: 'var(--color-bg-secondary)', cursor: 'not-allowed', opacity: 0.8 }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Turno</label>
                <select className="input-field" value={contractData.aluno.turno} onChange={(e) => handleContractDataChange('aluno', 'turno', e.target.value)}>
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Integral">Integral</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
            <button className="btn-primary" onClick={handleNext} disabled={!contractData.aluno.nome || !contractData.aluno.cpf || !contractData.contratante.nascimento}>Avançar</button>
          </div>
        </div>
      )}

      {/* STEP 2: Pagamento */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--color-brand-300)' }}>Passo 2: Condições de Pagamento</h3>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Valor Anual/Total (R$)</label>
              <input type="text" className="input-field" value={contractData.pagamento.valorInicial} readOnly style={{ background: 'var(--color-bg-secondary)', cursor: 'not-allowed' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Número de Parcelas</label>
              <input type="number" className="input-field" value={contractData.pagamento.parcelas} onChange={(e) => handleContractDataChange('pagamento', 'parcelas', e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Valor da Parcela (R$)</label>
              <input type="text" className="input-field" value={contractData.pagamento.valorParcela} onChange={(e) => handleContractDataChange('pagamento', 'valorParcela', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Mês Inicial Vencimento</label>
              <input type="text" className="input-field" value={contractData.pagamento.vencimentoInicial} onChange={(e) => handleContractDataChange('pagamento', 'vencimentoInicial', e.target.value)} placeholder="Ex: Janeiro/2026" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Mês Final Vencimento</label>
              <input type="text" className="input-field" value={contractData.pagamento.vencimentoFinal} onChange={(e) => handleContractDataChange('pagamento', 'vencimentoFinal', e.target.value)} placeholder="Ex: Dezembro/2026" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Dia de Vencimento</label>
              <select className="input-field" value={contractData.pagamento.diaVencimento} onChange={(e) => handleContractDataChange('pagamento', 'diaVencimento', e.target.value)}>
                <option value="05">05</option>
                <option value="10">10</option>
                <option value="15">15</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn-secondary" onClick={handleBack}>Voltar</button>
            <button className="btn-primary" onClick={handleNext}>Avançar para Assinatura</button>
          </div>
        </div>
      )}

      {/* STEP 3: Preview and Sign */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--color-brand-300)' }}>Passo 3: Revisão e Assinatura</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Por favor, revise o contrato gerado abaixo. Ao clicar em assinar, você concorda com os termos eletronicamente.
          </p>

          <div style={{ height: '500px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
            <PDFViewer width="100%" height="100%">
              <ContractTemplatePDF data={contractData} />
            </PDFViewer>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn-secondary" onClick={handleBack}>Voltar para Editar</button>
            <button className="btn-primary" onClick={handleSignContract} disabled={loading}>
              {loading ? 'Assinando...' : 'Li e Aceito: Assinar Contrato'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem', color: 'var(--color-text-secondary)' };

export default AdesaoForm;
