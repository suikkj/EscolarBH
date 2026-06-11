-- ============================================================
-- V1: Extensões PostgreSQL necessárias
-- ============================================================
-- Executar no Supabase via SQL Editor ou localmente via Flyway.
-- No Supabase, postgis e uuid-ossp geralmente já estão habilitados.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Comentário de auditoria
COMMENT ON EXTENSION "uuid-ossp" IS 'Geração de UUIDv4 para chaves primárias';
COMMENT ON EXTENSION "postgis" IS 'Tipos e funções geoespaciais para geofencing';
COMMENT ON EXTENSION "pgcrypto" IS 'Funções criptográficas auxiliares';
