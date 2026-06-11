# ============================================================
# Multi-stage Dockerfile para EscolarBH Geo (Rust)
# ============================================================

# Stage 1: Build
FROM rust:1.78-slim AS builder
WORKDIR /app

# Instalar dependências necessárias para build do Rust no Debian
RUN apt-get update && apt-get install -y pkg-config libssl-dev build-essential

COPY Cargo.toml ./
COPY src ./src

# Build de release do binário
RUN cargo build --release

# Stage 2: Runtime (imagem mínima distroless ou debian-slim)
FROM debian:bookworm-slim
WORKDIR /app

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Criar usuário não root
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

COPY --from=builder /app/target/release/escolarbh-geo /usr/local/bin/escolarbh-geo

USER appuser

EXPOSE 8081

# Para habilitar os logs do log::info/env_logger padrão
ENV RUST_LOG=info

ENTRYPOINT ["escolarbh-geo"]
