use crate::models::{DriverPolygon, MatchingDriver};
use geo::{point, Contains, Coord, LineString, Polygon as GeoPolygon};
use std::sync::RwLock;

/// Engine de geofencing com cache de polígonos em memória.
///
/// Performance: O(n) onde n = número de motoristas, mas cada
/// verificação de ponto-em-polígono é extremamente rápida via
/// ray casting algorithm do crate `geo`.
///
/// Para > 10.000 motoristas, considerar R-tree (crate `rstar`).
pub struct GeoEngine {
    /// Cache de polígonos carregados do banco (thread-safe)
    polygons: RwLock<Vec<CachedPolygon>>,
}

/// Polígono em memória com dados do motorista
struct CachedPolygon {
    driver: DriverPolygon,
    polygon: GeoPolygon<f64>,
}

impl GeoEngine {
    /// Cria uma nova instância do GeoEngine com cache vazio.
    pub fn new() -> Self {
        tracing::info!("GeoEngine inicializado");
        Self {
            polygons: RwLock::new(Vec::new()),
        }
    }

    /// Carrega polígonos do banco de dados no cache.
    ///
    /// Deve ser chamado na inicialização e quando um motorista
    /// atualiza sua área de atuação.
    #[allow(dead_code)]
    pub fn load_polygons(&self, driver_polygons: Vec<DriverPolygon>) {
        let mut cache = self.polygons.write().unwrap();
        cache.clear();

        for dp in driver_polygons {
            if dp.coordinates.len() < 3 {
                tracing::warn!(
                    "Polígono do motorista {} tem menos de 3 pontos — ignorando",
                    dp.driver_id
                );
                continue;
            }

            // Converte coordenadas (lng, lat) para LineString
            let coords: Vec<Coord<f64>> = dp
                .coordinates
                .iter()
                .map(|(lng, lat)| Coord { x: *lng, y: *lat })
                .collect();

            let line_string = LineString::new(coords);
            let polygon = GeoPolygon::new(line_string, vec![]);

            cache.push(CachedPolygon {
                driver: dp,
                polygon,
            });
        }

        tracing::info!("✅ {} polígonos carregados no cache", cache.len());
    }

    /// Verifica quais motoristas cobrem um determinado ponto (lat/lng).
    ///
    /// Algoritmo: Ray casting (winding number) via crate `geo`.
    /// Complexidade: O(n * m) onde n = motoristas, m = vértices do polígono.
    ///
    /// # Arguments
    /// * `latitude` - Latitude do ponto (ex: -19.9191)
    /// * `longitude` - Longitude do ponto (ex: -43.9387)
    ///
    /// # Returns
    /// Lista de motoristas cujo polígono contém o ponto.
    pub fn check_point(&self, latitude: f64, longitude: f64) -> Vec<MatchingDriver> {
        let cache = self.polygons.read().unwrap();
        let test_point = point!(x: longitude, y: latitude);

        cache
            .iter()
            .filter(|cp| cp.polygon.contains(&test_point))
            .map(|cp| MatchingDriver {
                driver_id: cp.driver.driver_id,
                user_id: cp.driver.user_id,
                registro_bhtrans: cp.driver.registro_bhtrans.clone(),
            })
            .collect()
    }

    /// Verifica cobertura para múltiplos pontos (batch).
    /// Útil para validação de rotas inteiras.
    #[allow(dead_code)]
    pub fn check_points_batch(
        &self,
        points: &[(f64, f64)],
    ) -> Vec<(f64, f64, Vec<MatchingDriver>)> {
        points
            .iter()
            .map(|(lat, lng)| (*lat, *lng, self.check_point(*lat, *lng)))
            .collect()
    }

    /// Retorna o número de polígonos no cache.
    pub fn polygon_count(&self) -> usize {
        self.polygons.read().unwrap().len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    /// Cria um polígono de teste cobrindo parte de Belo Horizonte (Savassi/Funcionários)
    fn create_test_polygon() -> DriverPolygon {
        DriverPolygon {
            driver_id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            registro_bhtrans: "BH-12345".to_string(),
            // Polígono aproximado da região Savassi/Funcionários em BH
            // Formato: (longitude, latitude)
            coordinates: vec![
                (-43.9450, -19.9300),
                (-43.9300, -19.9300),
                (-43.9300, -19.9150),
                (-43.9450, -19.9150),
                (-43.9450, -19.9300), // Fecha o polígono
            ],
        }
    }

    #[test]
    fn test_point_inside_polygon() {
        let engine = GeoEngine::new();
        engine.load_polygons(vec![create_test_polygon()]);

        // Ponto dentro da Savassi (Praça da Savassi)
        let result = engine.check_point(-19.9230, -43.9380);
        assert!(
            !result.is_empty(),
            "Ponto dentro do polígono deve retornar motorista"
        );
    }

    #[test]
    fn test_point_outside_polygon() {
        let engine = GeoEngine::new();
        engine.load_polygons(vec![create_test_polygon()]);

        // Ponto fora (Pampulha)
        let result = engine.check_point(-19.8530, -43.9680);
        assert!(
            result.is_empty(),
            "Ponto fora do polígono não deve retornar motoristas"
        );
    }

    #[test]
    fn test_batch_check() {
        let engine = GeoEngine::new();
        engine.load_polygons(vec![create_test_polygon()]);

        let points = vec![
            (-19.9230, -43.9380), // Dentro (Savassi)
            (-19.8530, -43.9680), // Fora (Pampulha)
        ];

        let results = engine.check_points_batch(&points);
        assert_eq!(results.len(), 2);
        assert!(!results[0].2.is_empty()); // Primeiro ponto: dentro
        assert!(results[1].2.is_empty()); // Segundo ponto: fora
    }

    #[test]
    fn test_empty_cache() {
        let engine = GeoEngine::new();
        let result = engine.check_point(-19.9230, -43.9380);
        assert!(result.is_empty(), "Cache vazio deve retornar lista vazia");
    }
}
