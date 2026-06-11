use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Requisição de verificação de cobertura (ponto único)
#[derive(Debug, Deserialize)]
pub struct CoverageCheckRequest {
    pub latitude: f64,
    pub longitude: f64,
}

/// Requisição de verificação em lote
#[derive(Debug, Deserialize)]
pub struct BatchCoverageCheckRequest {
    pub points: Vec<CoverageCheckRequest>,
}

/// Polígono de um motorista carregado do banco
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DriverPolygon {
    pub driver_id: Uuid,
    pub user_id: Uuid,
    pub registro_bhtrans: String,
    /// Coordenadas do polígono: Vec<(longitude, latitude)>
    pub coordinates: Vec<(f64, f64)>,
}

/// Resultado da verificação de cobertura
#[derive(Debug, Serialize)]
pub struct CoverageCheckResponse {
    pub covered: bool,
    pub latitude: f64,
    pub longitude: f64,
    pub matching_drivers: Vec<MatchingDriver>,
}

/// Motorista que cobre o ponto verificado
#[derive(Debug, Serialize)]
pub struct MatchingDriver {
    pub driver_id: Uuid,
    pub user_id: Uuid,
    pub registro_bhtrans: String,
}

/// Resultado de verificação em lote
#[derive(Debug, Serialize)]
pub struct BatchCoverageCheckResponse {
    pub results: Vec<CoverageCheckResponse>,
    pub total_checked: usize,
    pub total_covered: usize,
}

/// Resposta genérica da API
#[derive(Debug, Serialize)]
pub struct ApiResponse<T: Serialize> {
    pub success: bool,
    pub data: Option<T>,
    pub message: String,
}
