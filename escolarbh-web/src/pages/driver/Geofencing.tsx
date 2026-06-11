import React, { useState } from 'react';
import GeofenceMap from '../../components/GeofenceMap';
import { api } from '../../services/api';
import { Search, MapPin } from 'lucide-react';
import { fetchAddressByCEP } from '../../utils/validators';

const Geofencing: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [centerPoint, setCenterPoint] = useState<[number, number] | undefined>(undefined);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery) return;
    
    setIsSearching(true);
    setSearchResults([]);
    setShowDropdown(true);

    try {
      let queryToSearch = searchQuery;

      // Se for um CEP (só números ou formato XXXXX-XXX)
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
      alert('Erro ao buscar endereço.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectAddress = (lat: string, lon: string, displayName: string) => {
    setCenterPoint([parseFloat(lat), parseFloat(lon)]);
    setSearchQuery(displayName);
    setShowDropdown(false);
  };

  return (
    <>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 600 }}>Mapa</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Desenhe no mapa a área onde você tem disponibilidade para buscar e deixar os alunos.
          </p>
        </div>
        
        <div style={{ position: 'relative', flex: 1, minWidth: '250px', maxWidth: '400px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Buscar rua, endereço ou CEP..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary" disabled={isSearching} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={18} />
              {isSearching ? '...' : 'Buscar'}
            </button>
          </form>

          {showDropdown && (
            <div className="glass-panel" style={{ 
              position: 'absolute', 
              top: '100%', 
              left: 0, 
              right: 0, 
              marginTop: '0.5rem', 
              zIndex: 2000, 
              maxHeight: '300px', 
              overflowY: 'auto',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--glass-border)'
            }}>
              {isSearching ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Buscando...</div>
              ) : searchResults.length > 0 ? (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {searchResults.map((result, idx) => (
                    <li 
                      key={idx} 
                      onClick={() => handleSelectAddress(result.lat, result.lon, result.display_name)}
                      style={{ 
                        padding: '1rem', 
                        borderBottom: '1px solid var(--glass-border)', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <MapPin size={20} color="var(--color-brand-400)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '0.875rem', lineHeight: 1.4, color: 'var(--color-text-primary)' }}>
                        {result.display_name}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Nenhum endereço encontrado.</div>
              )}
            </div>
          )}
        </div>
      </header>

      <div style={{ height: '500px', position: 'relative' }}>
        <GeofenceMap 
          centerPoint={centerPoint}
          onPolygonSave={async (polygon) => {
            try {
              // Remove o mock anterior e faz a requisição real
              const response = await api.put('/coverage/driver/me/geofence', {
                points: polygon
              });
              
              if (response.data.success) {
                alert('Área de busca salva com sucesso no PostGIS!');
              }
            } catch (error: any) {
              console.error('Erro ao salvar polígono:', error);
              
              // Em modo Bypass, a API vai falhar pois o ID do teste não é um UUID válido.
              if (localStorage.getItem('dev_bypass') === 'true') {
                alert('[Bypass Mode] Se você estivesse com um usuário real do Supabase, o polígono teria sido salvo no banco de dados!');
              } else {
                alert('Ocorreu um erro ao salvar sua área de busca. Tente novamente.');
              }
            }
          }}
        />
      </div>
    </>
  );
};

export default Geofencing;
