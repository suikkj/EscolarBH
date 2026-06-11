import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabaseClient';
import { formatCPF, isValidCPF, formatCEP, fetchAddressByCEP } from '../utils/validators';

export default function RegisterScreen({ navigation }: any) {
  // Form State
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
  const role = 'CONTRATANTE';

  // Control State
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // 1: Form, 2: OTP
  const [otpCode, setOtpCode] = useState('');

  const handleCEPChange = async (text: string) => {
    const newCep = formatCEP(text);
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

  const handleRegister = async () => {
    if (!email || !password || !name || !cpf || !cep || !rua || !numero || !cidade || !estado) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não conferem.');
      return;
    }

    if (!isValidCPF(cpf)) {
      Alert.alert('Erro', 'CPF inválido.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          name,
          cpf: cpf.replace(/\D/g, '')
        },
      },
    });

    if (error) {
      Alert.alert('Erro no Cadastro', error.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      if (!data.session) {
        setStep(2);
        setLoading(false);
      } else {
        await insertProfileAndRedirect(data.user.id);
      }
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) return;
    setLoading(true);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode.replace('-', ''),
      type: 'signup'
    });

    if (error) {
      Alert.alert('Erro', 'Código inválido ou expirado.');
      setLoading(false);
      return;
    }

    if (data?.user) {
      await insertProfileAndRedirect(data.user.id);
    }
  };

  const insertProfileAndRedirect = async (userId: string) => {
    const { error: insertError } = await supabase.from('users').upsert([{
      id: userId,
      email,
      role,
      cpf: cpf.replace(/\D/g, ''),
      nome_completo: name,
      senha_hash: 'auth_managed',
      cep: cep.replace(/\D/g, ''),
      estado,
      cidade,
      rua,
      numero,
      complemento
    }]);

    if (insertError && !insertError.message.includes('duplicate key')) {
      console.warn('Erro ao inserir perfil:', insertError);
    }

    setLoading(false);
    // App Navigator lidará com a mudança de estado e redirecionará para a home
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      <Text style={styles.title}>Escolar Allyson</Text>
      <Text style={styles.subtitle}>
        {step === 1 ? 'Crie sua conta' : 'Verificação de E-mail'}
      </Text>

      {step === 1 ? (
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="Nome Completo" placeholderTextColor="#9ca3af" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="CPF" placeholderTextColor="#9ca3af" value={cpf} onChangeText={(t) => setCpf(formatCPF(t))} keyboardType="number-pad" maxLength={14} />
          
          <View style={styles.row}>
            <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="CEP" placeholderTextColor="#9ca3af" value={cep} onChangeText={handleCEPChange} keyboardType="number-pad" maxLength={9} />
            <TextInput style={[styles.input, { width: 60, marginRight: 8 }]} placeholder="UF" placeholderTextColor="#9ca3af" value={estado} onChangeText={setEstado} maxLength={2} />
            <TextInput style={[styles.input, { flex: 2 }]} placeholder="Cidade" placeholderTextColor="#9ca3af" value={cidade} onChangeText={setCidade} />
          </View>
          
          <View style={styles.row}>
            <TextInput style={[styles.input, { flex: 2, marginRight: 8 }]} placeholder="Rua" placeholderTextColor="#9ca3af" value={rua} onChangeText={setRua} />
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Nº" placeholderTextColor="#9ca3af" value={numero} onChangeText={setNumero} />
          </View>
          
          <TextInput style={styles.input} placeholder="Complemento" placeholderTextColor="#9ca3af" value={complemento} onChangeText={setComplemento} />
          <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#9ca3af" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          
          <View style={styles.row}>
            <View style={[styles.passwordContainer, { flex: 1, marginRight: 8, marginBottom: 0 }]}>
              <TextInput style={styles.passwordInput} placeholder="Senha" placeholderTextColor="#9ca3af" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <View style={[styles.passwordContainer, { flex: 1, marginBottom: 0 }]}>
              <TextInput style={styles.passwordInput} placeholder="Confirmar" placeholderTextColor="#9ca3af" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Criar Conta</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Login')} disabled={loading}>
            <Text style={styles.linkText}>Já tem uma conta? Entrar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.inputContainer}>
          <Text style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 16 }}>
            Enviamos um código de segurança para o e-mail {email}.
          </Text>
          <TextInput
            style={[styles.input, { textAlign: 'center', fontSize: 24, letterSpacing: 4 }]}
            placeholder="0000-0000"
            placeholderTextColor="#9ca3af"
            value={otpCode}
            onChangeText={(t) => {
              let val = t.replace(/\D/g, '').substring(0, 8);
              if (val.length > 4) val = val.replace(/^(\d{4})(\d+)/, '$1-$2');
              setOtpCode(val);
            }}
            keyboardType="number-pad"
          />
          <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading || otpCode.replace('-', '').length < 8}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Confirmar E-mail</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={() => setStep(1)} disabled={loading}>
            <Text style={styles.linkText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 48 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#94a3b8', textAlign: 'center', marginBottom: 32 },
  inputContainer: { backgroundColor: 'rgba(30, 41, 59, 0.7)', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  input: { backgroundColor: '#0f172a', color: '#ffffff', padding: 14, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#334155', fontSize: 14 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  passwordInput: { flex: 1, color: '#ffffff', padding: 14, fontSize: 14 },
  eyeButton: { padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  roleContainer: { marginBottom: 16 },
  roleLabel: { color: '#94a3b8', marginBottom: 8, fontSize: 14 },
  roleButtons: { flexDirection: 'row', gap: 8 },
  toggleBtn: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#334155', borderRadius: 8, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  toggleBtnText: { color: '#94a3b8', fontWeight: '500' },
  toggleBtnTextActive: { color: '#ffffff', fontWeight: 'bold' },
  button: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  linkButton: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#60a5fa', fontSize: 14 },
});
