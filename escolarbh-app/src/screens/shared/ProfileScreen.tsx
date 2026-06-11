import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../../theme';
import { supabase } from '../../services/supabaseClient';
import { appApi, UserProfile } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const data = await appApi.getMyProfile();
    setProfile(data);
    if (data) {
      setFormData({
        phone: data.phone || '',
        cep: data.cep || '',
        estado: data.estado || '',
        cidade: data.cidade || '',
        rua: data.rua || '',
        numero: data.numero || '',
        complemento: data.complemento || ''
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await appApi.updateMyProfile(formData);
      await loadProfile();
      setIsEditing(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const maskCPF = (cpf: string) => {
    if (!cpf) return '';
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return cpf;
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '***.$2.***-$4');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.brand[500]} />
      </View>
    );
  }

  const displayName = profile?.name && profile.name !== 'Novo Usuário (Local)' 
    ? profile.name 
    : (session?.user?.user_metadata?.name || 'Usuário');
    
  const displayEmail = profile?.email && !profile.email.includes('@local.dev')
    ? profile.email
    : session?.user?.email || '';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{displayEmail}</Text>
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Dados Pessoais</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Text style={{ color: theme.colors.brand[500], fontWeight: 'bold' }}>Editar</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={20} color={theme.colors.text.secondary} />
            <Text style={styles.infoText}>CPF: {maskCPF(profile?.cpf || '')}</Text>
          </View>

          {isEditing ? (
            <View style={{ marginTop: theme.spacing.md }}>
              <Text style={styles.inputLabel}>Telefone</Text>
              <TextInput style={styles.input} value={formData.phone} onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))} placeholder="Telefone" />

              <Text style={styles.inputLabel}>CEP</Text>
              <TextInput style={styles.input} value={formData.cep} onChangeText={(text) => setFormData(prev => ({ ...prev, cep: text }))} placeholder="CEP" keyboardType="numeric" />

              <Text style={styles.inputLabel}>Rua</Text>
              <TextInput style={styles.input} value={formData.rua} onChangeText={(text) => setFormData(prev => ({ ...prev, rua: text }))} placeholder="Rua" />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Número</Text>
                  <TextInput style={styles.input} value={formData.numero} onChangeText={(text) => setFormData(prev => ({ ...prev, numero: text }))} placeholder="Nº" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Comp.</Text>
                  <TextInput style={styles.input} value={formData.complemento} onChangeText={(text) => setFormData(prev => ({ ...prev, complemento: text }))} placeholder="Apto/Casa" />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.inputLabel}>Cidade</Text>
                  <TextInput style={styles.input} value={formData.cidade} onChangeText={(text) => setFormData(prev => ({ ...prev, cidade: text }))} placeholder="Cidade" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>UF</Text>
                  <TextInput style={styles.input} value={formData.estado} onChangeText={(text) => setFormData(prev => ({ ...prev, estado: text }))} placeholder="MG" maxLength={2} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.lg }}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.background.elevated, borderColor: theme.colors.border, borderWidth: 1 }]} onPress={() => setIsEditing(false)}>
                  <Text style={{ color: theme.colors.text.primary, fontWeight: 'bold' }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.brand[500] }]} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Salvar</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.infoText}>Tel: {profile?.phone || 'Não informado'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={theme.colors.text.secondary} />
                <Text style={[styles.infoText, { flex: 1 }]} numberOfLines={3}>
                  Endereço: {profile?.rua ? `${profile.rua}, ${profile.numero || 'S/N'}${profile.complemento ? ` - ${profile.complemento}` : ''} - ${profile.cidade}/${profile.estado} - CEP: ${profile.cep}` : 'Não cadastrado'}
                </Text>
              </View>
            </>
          )}
        </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color={theme.colors.status.error} />
        <Text style={styles.logoutText}>Sair do Aplicativo</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.lgpdButton}
        onPress={() => Alert.alert('Solicitação LGPD', 'Um email foi enviado com as instruções para apagar seus dados.')}
      >
        <Text style={styles.lgpdText}>Solicitar Exclusão de Dados (LGPD)</Text>
      </TouchableOpacity>

        <Text style={styles.version}>Versão 1.0.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.main,
    padding: theme.spacing.lg,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.brand[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  email: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  section: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.elevated,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.status.error,
    marginBottom: theme.spacing.md,
  },
  logoutText: {
    color: theme.colors.status.error,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: theme.spacing.sm,
  },
  lgpdButton: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  lgpdText: {
    color: theme.colors.text.tertiary,
    textDecorationLine: 'underline',
  },
  version: {
    textAlign: 'center',
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xl,
    fontSize: 12,
  },
  inputLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    color: theme.colors.text.primary,
    fontSize: 14,
  },
  actionButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  }
});
