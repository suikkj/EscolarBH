use actix_web::{middleware, web, App, HttpResponse, HttpServer};
use tracing_subscriber::EnvFilter;

mod geo_engine;
mod handlers;
mod models;

/// Microserviço de Geofencing EscolarBH
///
/// Serviço Rust de alta performance para cálculos geoespaciais.
/// Complementa o backend Kotlin/Spring Boot para operações
/// computacionalmente intensivas (ponto-em-polígono em lote).
///
/// Endpoints:
///   POST /api/v1/geo/check       → Verifica ponto contra todos os polígonos
///   POST /api/v1/geo/check-batch → Verifica múltiplos pontos (bulk)
///   GET  /health                 → Health check
///
/// Porta padrão: 3001
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Carrega .env se existir
    dotenvy::dotenv().ok();

    // Configura logging
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("info,escolarbh_geo=debug")),
        )
        .init();

    let port = std::env::var("GEO_SERVICE_PORT")
        .unwrap_or_else(|_| "3001".to_string())
        .parse::<u16>()
        .expect("GEO_SERVICE_PORT deve ser um número válido");

    tracing::info!("🚀 EscolarBH Geo Service iniciando na porta {}", port);

    // Inicializa o engine de geofencing com cache de polígonos
    let geo_engine = web::Data::new(geo_engine::GeoEngine::new());

    HttpServer::new(move || {
        App::new()
            .app_data(geo_engine.clone())
            // Health check
            .route(
                "/health",
                web::get()
                    .to(|| async { HttpResponse::Ok().json(serde_json::json!({"status": "ok"})) }),
            )
            // Endpoints de geofencing
            .service(
                web::scope("/api/v1/geo")
                    .route("/check", web::post().to(handlers::check_coverage))
                    .route(
                        "/check-batch",
                        web::post().to(handlers::check_coverage_batch),
                    )
                    .route(
                        "/polygons/reload",
                        web::post().to(handlers::reload_polygons),
                    ),
            )
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
