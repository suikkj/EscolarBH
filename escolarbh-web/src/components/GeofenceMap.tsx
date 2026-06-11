import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet-draw';

// Corrigir os ícones padrão do Leaflet no Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface GeofenceMapProps {
  initialPolygon?: [number, number][]; // Array de [lat, lng]
  onPolygonSave?: (polygon: [number, number][]) => void;
  centerPoint?: [number, number];
}

const GeofenceMap: React.FC<GeofenceMapProps> = ({ initialPolygon, onPolygonSave, centerPoint }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const drawnItems = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const [currentPolygon, setCurrentPolygon] = useState<[number, number][] | null>(initialPolygon || null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Inicializa o mapa focado em BH (Belo Horizonte)
    const map = L.map(mapRef.current).setView([-19.9167, -43.9345], 12);
    mapInstance.current = map;

    // Camada de visualização (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Adiciona o grupo de itens desenhados ao mapa
    map.addLayer(drawnItems.current);

    // Controle de desenho
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems.current,
        remove: true
      },
      draw: {
        polygon: {
          allowIntersection: false,
          drawError: { color: '#e1e100', message: '<strong>Atenção:</strong> polígonos não podem se cruzar!' },
          shapeOptions: { color: 'var(--color-brand-500)' }
        },
        polyline: false,
        circle: false,
        rectangle: false,
        marker: false,
        circlemarker: false,
      }
    });
    map.addControl(drawControl);

    // Renderiza o polígono inicial, se existir
    if (initialPolygon && initialPolygon.length > 0) {
      const polygon = L.polygon(initialPolygon, { color: '#3b82f6' });
      drawnItems.current.addLayer(polygon);
      map.fitBounds(polygon.getBounds());
    }

    // Eventos de criação e edição
    map.on(L.Draw.Event.CREATED, (e: any) => {
      const type = e.layerType;
      const layer = e.layer;

      if (type === 'polygon') {
        // Limpa os anteriores para permitir apenas 1 polígono de área de atuação
        drawnItems.current.clearLayers();
        drawnItems.current.addLayer(layer);
        
        // Extrai as coordenadas
        const latLngs = layer.getLatLngs()[0] as L.LatLng[];
        const coords: [number, number][] = latLngs.map(ll => [ll.lat, ll.lng]);
        setCurrentPolygon(coords);
      }
    });

    map.on(L.Draw.Event.EDITED, (e: any) => {
      const layers = e.layers;
      layers.eachLayer((layer: any) => {
        if (layer instanceof L.Polygon) {
          const latLngs = layer.getLatLngs()[0] as L.LatLng[];
          const coords: [number, number][] = latLngs.map(ll => [ll.lat, ll.lng]);
          setCurrentPolygon(coords);
        }
      });
    });

    map.on(L.Draw.Event.DELETED, () => {
      if (drawnItems.current.getLayers().length === 0) {
        setCurrentPolygon(null);
      }
    });

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [initialPolygon]);

  useEffect(() => {
    if (centerPoint && mapInstance.current) {
      mapInstance.current.setView(centerPoint, 18);
    }
  }, [centerPoint]);

  const handleSave = () => {
    if (onPolygonSave && currentPolygon) {
      onPolygonSave(currentPolygon);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />
      
      {currentPolygon && (
        <div style={{ 
          position: 'absolute', 
          bottom: '1rem', 
          right: '1rem', 
          zIndex: 1000,
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(12px)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-md)'
        }}>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600 }}>Área de Busca Definida</p>
          <button className="btn-primary" onClick={handleSave} style={{ width: '100%', padding: '0.5rem 1rem' }}>
            Salvar Polígono
          </button>
        </div>
      )}
    </div>
  );
};

export default GeofenceMap;
