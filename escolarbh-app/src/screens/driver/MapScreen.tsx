import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Platform, TextInput, FlatList } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from '../../components/Map';
import * as Location from 'expo-location';
import { theme } from '../../theme';
import { startLocationTracking, stopLocationTracking } from '../../services/LocationTrackingService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchAddressByCEP } from '../../utils/validators';

export default function MapScreen({ route }: any) {
  const [tracking, setTracking] = useState(false);
  
  // O turno recebido pela navegação (MANHA ou TARDE)
  const shift = route?.params?.period || 'MANHA';

  const mapRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [markerCoordinate, setMarkerCoordinate] = useState({ latitude: -19.916681, longitude: -43.934493 });

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    setSearchResults([]);
    setShowDropdown(true);

    try {
      let queryToSearch = searchQuery;
      const cleanInput = searchQuery.replace(/\D/g, '');
      if (cleanInput.length === 8) {
        const addressData = await fetchAddressByCEP(cleanInput);
        if (addressData) {
          queryToSearch = `${addressData.rua}, ${addressData.cidade}, ${addressData.estado}`;
        }
      }

      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&q=${encodeURIComponent(queryToSearch)}`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível buscar o endereço.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectAddress = (lat: string, lon: string, displayName: string) => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    setMarkerCoordinate({ latitude, longitude });
    setSearchQuery(displayName);
    setShowDropdown(false);
    
    if (mapRef.current && mapRef.current.animateToRegion) {
      mapRef.current.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  };

  const toggleTracking = async () => {
    if (!tracking) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Negada', 'Precisamos da sua localização para compartilhar a rota com os pais.');
        return;
      }
      
      const started = await startLocationTracking();
      if (started) {
        setTracking(true);
        Alert.alert('Rota Iniciada', `Acompanhamento ativado para a rota da ${shift}. Os pais foram notificados!`);
      }
    } else {
      await stopLocationTracking();
      setTracking(false);
      Alert.alert('Rota Finalizada', 'O acompanhamento de GPS foi encerrado.');
    }
  };
  return (
    <View style={styles.container}>
      {/* Search Bar Overlay */}
      <View style={styles.searchOverlay}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar endereço ou CEP..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholderTextColor={theme.colors.text.tertiary}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={isSearching}>
            <MaterialCommunityIcons name="magnify" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {showDropdown && (
          <View style={styles.dropdownContainer}>
            {isSearching ? (
              <Text style={styles.dropdownText}>Buscando...</Text>
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.dropdownItem}
                    onPress={() => handleSelectAddress(item.lat, item.lon, item.display_name)}
                  >
                    <MaterialCommunityIcons name="map-marker" size={20} color={theme.colors.brand[500]} />
                    <Text style={styles.dropdownItemText}>{item.display_name}</Text>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 200 }}
              />
            ) : (
              <Text style={styles.dropdownText}>Nenhum endereço encontrado.</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.mapContainer}>
        {/* Usando MapView do React Native Maps centrado em Belo Horizonte */}
        {Platform.OS === 'web' ? (
          <View style={[styles.map, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e0e0e0' }]}>
            <Text>📍 Mapa do Motorista (Apenas no Celular)</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={{
              latitude: -19.916681,
              longitude: -43.934493,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            <Marker
              coordinate={markerCoordinate}
              title="Endereço Selecionado"
            />
          </MapView>
        )}
      </View>
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.startButton, tracking && styles.stopButton]} 
          onPress={toggleTracking}
        >
          <Text style={styles.startButtonText}>
            {tracking ? 'Finalizar Rota' : 'Começar Rota'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.main,
  },
  mapContainer: {
    flex: 1,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  footer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    backgroundColor: theme.colors.background.surface,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  startButton: {
    backgroundColor: theme.colors.brand[500],
    padding: 16,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: theme.colors.status.error,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchOverlay: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    height: 50,
    color: theme.colors.text.primary,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: theme.colors.brand[500],
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  dropdownContainer: {
    backgroundColor: theme.colors.background.surface,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  dropdownText: {
    padding: 16,
    textAlign: 'center',
    color: theme.colors.text.secondary,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 12,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
  }
});
