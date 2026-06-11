use crate::geo_engine::GeoEngine;
use crate::models::*;
use actix_web::{web, HttpResponse};

/// Handler: POST /api/v1/geo/check
///
/// Verifica se um ponto (lat/lng) está coberto por algum motorista.
/// Usa o GeoEngine com cache de polígonos em memória.
pub async fn check_coverage(
    engine: web::Data<GeoEngine>,
    body: web::Json<CoverageCheckRequest>,
) -> HttpResponse {
    tracing::debug!(
        "Verificando cobertura: lat={}, lng={}",
        body.latitude,
        body.longitude
    );

    let matching_drivers = engine.check_point(body.latitude, body.longitude);
    let covered = !matching_drivers.is_empty();

    let response = CoverageCheckResponse {
        covered,
        latitude: body.latitude,
        longitude: body.longitude,
        matching_drivers,
    };

    HttpResponse::Ok().json(ApiResponse {
        success: covered,
        data: Some(response),
        message: if covered {
            "Endereço coberto por motorista(s)".to_string()
        } else {
            "Nenhum motorista cobre esta região".to_string()
        },
    })
}

/// Handler: POST /api/v1/geo/check-batch
///
/// Verifica cobertura para múltiplos pontos de uma vez.
/// Útil para validação de rotas completas.
pub async fn check_coverage_batch(
    engine: web::Data<GeoEngine>,
    body: web::Json<BatchCoverageCheckRequest>,
) -> HttpResponse {
    tracing::info!("Verificação em lote: {} pontos", body.points.len());

    let results: Vec<CoverageCheckResponse> = body
        .points
        .iter()
        .map(|p| {
            let matching_drivers = engine.check_point(p.latitude, p.longitude);
            CoverageCheckResponse {
                covered: !matching_drivers.is_empty(),
                latitude: p.latitude,
                longitude: p.longitude,
                matching_drivers,
            }
        })
        .collect();

    let total_checked = results.len();
    let total_covered = results.iter().filter(|r| r.covered).count();

    HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(BatchCoverageCheckResponse {
            results,
            total_checked,
            total_covered,
        }),
        message: format!("{}/{} pontos cobertos", total_covered, total_checked),
    })
}

/// Handler: POST /api/v1/geo/polygons/reload
///
/// Recarrega os polígonos do banco de dados no cache em memória.
/// Deve ser chamado quando um motorista atualiza sua área de atuação.
///
/// TODO: Buscar polígonos do Supabase via REST API
pub async fn reload_polygons(engine: web::Data<GeoEngine>) -> HttpResponse {
    tracing::info!("Recarregando polígonos do banco...");

    // TODO: Implementar busca real do Supabase
    // Por enquanto, retorna o status do cache atual
    let count = engine.polygon_count();

    HttpResponse::Ok().json(ApiResponse::<()> {
        success: true,
        data: None,
        message: format!("{} polígonos no cache", count),
    })
}
