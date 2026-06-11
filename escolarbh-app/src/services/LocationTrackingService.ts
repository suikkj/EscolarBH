import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { supabase } from './api';

const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('Erro na task de localização:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const loc = locations[0];
    
    try {
      // 1. Enviar para Supabase para que os pais possam ver a van
      await supabase.from('van_locations').upsert({
        id: 'current_van', // Mock: assumindo 1 van por enquanto
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        timestamp: new Date().toISOString()
      });

      // 2. Chamar o endpoint Rust/Spring para calcular a distância e disparar o Geofencing
      // (Isso dispararia as Push Notifications de "Sua van está a 5 minutos")
      
    } catch (e) {
      console.warn('Falha ao sincronizar localização da van:', e);
    }
  }
});

export const startLocationTracking = async () => {
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== 'granted') return false;

  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== 'granted') return false;

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 10000, // 10 segundos
    distanceInterval: 50, // 50 metros
    showsBackgroundLocationIndicator: true,
  });
  return true;
};

export const stopLocationTracking = async () => {
  const hasTask = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  if (hasTask) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
};
