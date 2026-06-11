import axios from 'axios';
export { supabase } from './supabaseClient';
import { supabase } from './supabaseClient';
import { Platform } from 'react-native';

import Constants from 'expo-constants';

// No Android Emulator, localhost é 10.0.2.2. No iOS Simulator ou dispositivo real, mude para o IP da sua máquina.
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:8080/api/v1`;
  }
  
  if (Platform.OS === 'android') return 'http://10.0.2.2:8080/api/v1';
  return 'http://localhost:8080/api/v1'; // iOS ou Web fallback
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
    if (session.user) {
      config.headers['X-User-Id'] = session.user.id;
    }
  }
  return config;
});

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  schoolName: string;
  address: string;
  status: 'PENDING' | 'BOARDED' | 'DROPPED_OFF';
  contractId?: string;
  ordemRota?: number;
}

export interface Contract {
  id: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  monthlyFee: number;
  startDate: string;
  endDate: string;
  parentName: string;
  isDelinquent: boolean;
}

export interface Subscription {
  id: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  amount: number;
  dueDate: string;
  paymentDate?: string;
  paymentMethod?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  cep?: string;
  estado?: string;
  cidade?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
}

export const appApi = {
  getMyStudents: async (): Promise<Student[]> => {
    const { data, error } = await supabase.from('students').select('*');
    if (error) {
      console.error('Error fetching students:', error);
      return [];
    }
    return data.map(item => ({
      id: item.id,
      firstName: item.primeiro_nome || '',
      lastName: '', // dados sensíveis estariam no nome_completo_enc
      schoolName: item.escola_nome || '',
      address: item.ponto_busca_endereco || '',
      status: 'PENDING',
      contractId: '00000000-0000-0000-0000-000000000000', // Mock for now until API returns it
      ordemRota: item.ordem_rota || 1
    }));
  },
  getMyContracts: async (): Promise<Contract[]> => {
    const { data, error } = await supabase.from('contracts').select('*');
    if (error) {
      console.error('Error fetching contracts:', error);
      return [];
    }
    return data.map(item => ({
      id: item.id,
      status: item.status,
      monthlyFee: 0, // depende da regra de negócio
      startDate: item.vigencia_inicio || '',
      endDate: item.vigencia_fim || '',
      parentName: 'Responsável', // precisa de JOIN com users
      isDelinquent: item.status === 'SUSPENSO'
    }));
  },
  getMySubscriptions: async (): Promise<Subscription[]> => {
    const { data, error } = await supabase.from('subscriptions').select('*');
    if (error) {
      console.error('Error fetching subscriptions:', error);
      return [];
    }
    return data.map(item => ({
      id: item.id,
      status: item.status,
      amount: item.valor_mensalidade || 0,
      dueDate: item.data_vencimento || '',
      paymentDate: item.data_pagamento,
      paymentMethod: item.forma_pagamento
    }));
  },
  checkInStudent: async (studentId: string, contractId: string, lat: number, lng: number) => {
    await api.post('/presence', {
      studentId,
      contractId,
      status: 'EMBARCADO',
      locationLat: lat,
      locationLng: lng
    });
  },
  checkOutStudent: async (studentId: string, contractId: string, lat: number, lng: number) => {
    await api.post('/presence', {
      studentId,
      contractId,
      status: 'DESEMBARCADO',
      locationLat: lat,
      locationLng: lng
    });
  },
  getMyProfile: async (): Promise<UserProfile | null> => {
    try {
      const { data } = await api.get('/users/me');
      return {
        id: data.id,
        name: data.nomeCompleto,
        email: data.email,
        cpf: data.cpf,
        phone: data.telefone || '',
        cep: data.cep,
        estado: data.estado,
        cidade: data.cidade,
        rua: data.rua,
        numero: data.numero,
        complemento: data.complemento
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },
  updateMyProfile: async (data: Partial<UserProfile>): Promise<void> => {
    try {
      await api.put('/users/me', data);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },
  registerPushToken: async (token: string) => {
    try {
      await api.put('/users/me/push-token', { token });
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  },
  checkEmail: async (email: string): Promise<boolean> => {
    try {
      const response = await api.get(`/users/check-email?email=${encodeURIComponent(email)}`);
      return response.data?.exists || false;
    } catch (error) {
      console.error('Error checking email:', error);
      return true; // Assume it exists to prevent bypassing if network fails
    }
  }
};
