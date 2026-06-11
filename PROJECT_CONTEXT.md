# EscolarBH — Contexto Completo do Projeto

> **Última atualização:** 2026-06-06
> **Status:** Em construção — Fase 1 (Fundação)
> **Autor:** Gerado via Antigravity AI como especificação técnica viva

---

## 1. O QUE É ESTE PROJETO

Plataforma SaaS de **gestão e cobrança automática de transporte escolar**, inicialmente focada em Belo Horizonte (regulamentação BHTRANS). O sistema conecta **pais/responsáveis** a **motoristas escolares** com:

- Contratos eletrônicos com validade jurídica (assinatura digital via ZapSign)
- Cobrança recorrente automática (boleto, PIX, cartão via Asaas)
- Validação geográfica de cobertura (o endereço do aluno está dentro da área do motorista?)
- Conformidade LGPD para dados de menores de idade (Art. 14)
- Notificações push para pais e motoristas

### Atores do Sistema

| Ator | Funcionalidades Principais |
|---|---|
| **Contratante (Pai/Responsável)** | Cadastro, dependentes, endereço, assinar contrato, pagar mensalidade |
| **Prestador (Motorista Escolar)** | Definir área (polígono), gerir rotas/clientes, acompanhar fluxo de caixa |
| **Admin (futuro)** | Gestão da plataforma, relatórios, mediação de conflitos |

---

## 2. DECISÕES TÉCNICAS CONSOLIDADAS

### 2.1 Pilha Tecnológica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| **Backend Principal** | **Kotlin + Java** com Spring Boot 3.3 | Null-safety, corrotinas, interop Java, ecossistema Spring maduro |
| **Microserviço de Geofencing** | **Rust** (Actix-web + geo crate) | Performance em cálculos geoespaciais, zero-cost abstractions, safety |
| **Banco de Dados** | **Supabase** (PostgreSQL 15 + PostGIS) | RLS nativo, Auth integrado, Storage para PDFs, Realtime para notificações, Edge Functions |
| **Frontend Web** | React + TypeScript + Vite | Componentização, tipagem, build rápido |
| **Mobile** | React Native (Expo) | Código compartilhado com web, push notifications nativas |
| **Cache/Sessions** | Redis (via Supabase ou Upstash) | Cache de geocoding, sessões JWT |
| **Gateway Pagamento** | **Asaas** | Brasileiro, recorrência nativa, boleto+PIX+cartão, webhook robusto |
| **Mapas/Geocoding** | Google Maps Platform | Geocoding API + Maps JS API para frontend |
| **Assinatura Eletrônica** | **ZapSign** | API REST, validade jurídica (MP 2200-2), webhook de conclusão |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | Gratuito, cross-platform, integração React Native nativa |

### 2.2 Decisões Arquiteturais

| Decisão | Escolha | Motivo |
|---|---|---|
| Multi-tenancy | **Row-Level Security (RLS)** via Supabase | Escala sem redesenhar schema; cada motorista só vê seus dados |
| Autenticação | **Supabase Auth** + JWT customizado no Spring | Aproveita Auth UI do Supabase, Spring valida tokens |
| Migrações SQL | **Flyway** (via Spring Boot) | Versionamento de schema, rollback, CI/CD friendly |
| Criptografia LGPD | **AES-256-GCM** em nível de aplicação | Campo-a-campo para dados de menores, chave rotacionável |
| Comunicação Backend↔Rust | **HTTP REST** (futuro: gRPC) | Simplicidade no MVP, migrar para gRPC quando necessário |
| Armazenamento de PDFs | **Supabase Storage** | Integrado, CDN, políticas de acesso por RLS |

### 2.3 Estrutura de Repositórios

```
Escolar Allyson/                        ← Monorepo raiz
├── PROJECT_CONTEXT.md                  ← ESTE ARQUIVO (contexto vivo)
├── escolarbh-api/                      ← Backend Kotlin/Java (Spring Boot)
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── src/
│       ├── main/
│       │   ├── kotlin/com/escolarbh/api/
│       │   │   ├── EscolarBhApplication.kt
│       │   │   ├── config/
│       │   │   ├── domain/model/
│       │   │   ├── domain/enums/
│       │   │   ├── repository/
│       │   │   ├── service/
│       │   │   ├── controller/
│       │   │   ├── dto/
│       │   │   ├── exception/
│       │   │   └── middleware/
│       │   └── resources/
│       │       ├── application.yml
│       │       └── db/migration/V1..V8
│       └── test/
├── escolarbh-geo/                      ← Microserviço Rust (Geofencing)
│   ├── Cargo.toml
│   └── src/
│       ├── main.rs
│       ├── handlers/
│       ├── models/
│       └── geo_engine/
├── escolarbh-web/                      ← Frontend React (futuro)
└── escolarbh-mobile/                   ← React Native (futuro)
```

---

## 3. SCHEMA DO BANCO DE DADOS (Supabase/PostgreSQL)

### Extensões necessárias
- `uuid-ossp` — geração de UUIDv4
- `postgis` — tipos e funções geoespaciais
- `pgcrypto` — funções criptográficas auxiliares

### Tabelas (8 migrações Flyway)

| Migration | Tabela | Descrição |
|---|---|---|
| V1 | *(extensões)* | Habilita uuid-ossp, postgis, pgcrypto |
| V2 | `users` | Usuários com role (CONTRATANTE/MOTORISTA/ADMIN), CPF, email únicos |
| V3 | `students` | Dependentes com campos criptografados (LGPD Art. 14) |
| V4 | `drivers_profiles` | Perfil do motorista com `GEOMETRY(POLYGON, 4326)` e registro BHTRANS |
| V5 | `contracts` | Contratos com evidências de assinatura (IP, User-Agent, timestamp) |
| V6 | `subscriptions` | Mensalidades recorrentes vinculadas ao Asaas |
| V7 | `consent_records` | Registros granulares de consentimento LGPD |
| V8 | `audit_log` | Trilha de auditoria com diff JSONB |

### Row-Level Security (RLS)
- `students`: Pai só vê seus dependentes; motorista só vê alunos de seus contratos ativos
- `contracts`: Visível apenas para o pai e o motorista do contrato
- `subscriptions`: Mesma regra de contracts
- `drivers_profiles`: Polígono é público (para busca), dados pessoais são restritos

---

## 4. LÓGICA DE NEGÓCIO PRINCIPAL

### 4.1 Geofencing (Validação de Cobertura)

**Fluxo:** Pai digita endereço → Geocoding (Google Maps) → Coordenadas (lat/lng) → Query PostGIS `ST_Contains` contra polígonos de motoristas → Retorna motoristas disponíveis.

**Arquitetura dual:**
- **Opção A (MVP):** Query PostGIS direto do Spring Boot via JPA nativa
- **Opção B (Escala):** Microserviço Rust com cache de polígonos em memória + crate `geo`

### 4.2 Pagamento Recorrente (Asaas)

**Fluxo de criação:** Contrato assinado → Cria Customer no Asaas → Cria Subscription → Asaas gera cobranças mensais automaticamente.

**Webhooks escutados:**
| Evento Asaas | Ação no Sistema |
|---|---|
| `PAYMENT_RECEIVED` | `subscriptions.status = 'PAGO'`, notifica pai |
| `PAYMENT_OVERDUE` | `subscriptions.status = 'INADIMPLENTE'`, notifica pai + motorista |
| `PAYMENT_DELETED` / `SUBSCRIPTION_DELETED` | `subscriptions.status = 'CANCELADO'`, encerra contrato |

**Segurança do webhook:** Validação HMAC-SHA256 com token secreto do Asaas.

### 4.3 Assinatura Eletrônica (ZapSign)

**Fluxo:** Pai aceita termos → Backend coleta evidências (IP, User-Agent, timestamp) → Cria documento na ZapSign com template → Pai assina via link → Webhook `doc_signed` → Contrato ativo → Dispara criação de subscription no Asaas.

### 4.4 LGPD para Menores (Art. 14)

**Controles implementados:**
1. Consentimento explícito registrado em `consent_records` antes de qualquer dado de menor
2. Criptografia AES-256-GCM em nível de aplicação para campos de `students`
3. Segregação via RLS — motorista nunca acessa dados de clientes de terceiros
4. Minimização — endpoints de motorista retornam apenas primeiro nome e ponto de busca
5. Direito ao esquecimento — `DataAnonymizationService` com soft e hard delete
6. Auditoria completa em `audit_log`

---

## 5. INTEGRAÇÕES EXTERNAS

| Serviço | Uso | Configuração Necessária |
|---|---|---|
| **Supabase** | DB, Auth, Storage, RLS, Realtime | Criar projeto, obter `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` |
| **Asaas** | Pagamento recorrente | Criar conta sandbox, obter `ASAAS_API_KEY`, configurar webhook URL |
| **Google Maps** | Geocoding + Maps JS | Criar projeto GCP, habilitar Geocoding API, obter `GOOGLE_MAPS_API_KEY` |
| **ZapSign** | Assinatura eletrônica | Criar conta, obter `ZAPSIGN_API_TOKEN`, criar template de contrato |
| **Firebase** | Push notifications | Criar projeto Firebase, configurar FCM, obter `google-services.json` |

---

## 6. O QUE JÁ FOI CONSTRUÍDO

### ✅ Fase 1 — Fundação (CONCLUÍDA — 2026-06-06)

- [x] `PROJECT_CONTEXT.md` — Este documento de contexto
- [x] SQL DDL — 8 migrações Flyway completas (V1 a V8)
- [x] `build.gradle.kts` + `settings.gradle.kts` — Configuração Gradle
- [x] `docker-compose.yml` — PostgreSQL + PostGIS + Redis para desenvolvimento local
- [x] `application.yml` — Configuração Spring Boot com profiles
- [x] `EscolarBhApplication.kt` — Entry point
- [x] Domain models — `User`, `Student`, `DriverProfile`, `Contract`, `Subscription`, `ConsentRecord`
- [x] Enums — `UserRole`, `ContractStatus`, `PaymentStatus`, `ConsentType`
- [x] `SecurityConfig.kt` — Spring Security + JWT + CORS
- [x] `FieldEncryptionService.kt` — AES-256-GCM para LGPD
- [x] `GeofencingService.kt` + `GeocodingClient.kt` — Validação de cobertura
- [x] `GeofencingController.kt` — Endpoint POST /api/v1/coverage/check
- [x] `WebhookController.kt` + `WebhookProcessor.kt` — Processamento de webhooks Asaas
- [x] `ContractService.kt` + `ZapSignClient.kt` — Integração assinatura eletrônica
- [x] `AsaasClient.kt` — Client HTTP para Asaas
- [x] Microserviço Rust `escolarbh-geo/` — Geofencing engine com Actix-web
- [x] `Dockerfile` — Multi-stage build para API
- [x] `.gitignore` — Monorepo

---

## 7. O QUE FALTA FAZER

### ✅ Fase 2 — Repositórios e Testes (CONCLUÍDA — 2026-06-06)
- [x] Repositórios JPA (`UserRepository`, `StudentRepository`, etc.)
- [x] DTOs de Request/Response completos
- [x] Testes unitários (GeofencingService, WebhookProcessor, FieldEncryption)
- [x] Testes de integração com Testcontainers
- [x] GlobalExceptionHandler com error codes padronizados

### ✅ Fase 3 — Auth e LGPD (CONCLUÍDA — 2026-06-06)
- [x] Integração Supabase Auth no Spring Security (`JwtAuthenticationFilter`)
- [x] `ConsentService.kt` com fluxo de consentimento granular
- [x] `DataAnonymizationService.kt` com soft/hard delete
- [x] `AuditInterceptor.kt` com logging automático
- [x] RLS policies no Supabase Dashboard

### ✅ Fase 4 — Frontend Web (CONCLUÍDA)
- [x] Inicializar projeto Vite + React + TypeScript
- [x] Instalar dependências de roteamento e auth (Supabase)
- [x] Estrutura Premium UI com Vanilla CSS (Dark Mode/Glassmorphism)
- [x] Configuração de rotas e Contexto de Auth
- [x] UI/UX: Tela de Login e Dashboard do Motorista
- [x] Integração real do Mapa (Google Maps API / Leaflet) no Dashboard de mapa com editor de polígono (Google Maps JS API)
- [x] Fluxo de assinatura de contrato
- [x] Painel de pagamentos e inadimplência

### ✅ Fase 5 — Mobile (CONCLUÍDA)
- [x] Inicializar projeto React Native (Expo) + Design System Premium (theme.ts)
- [x] Push notifications configuradas via FCM (`expo-notifications`)
- [x] Navegação Dinâmica via Roles (DriverTabNavigator vs ParentTabNavigator)
- [x] App do motorista: check-in/check-out de alunos (StudentsScreen), contratos ativos e mapa
- [x] App do pai: acompanhamento (HomeScreen) e resumo de mensalidades (PaymentsScreen)
- [x] Melhoria no dev bypass (`teste@teste.com`) com Toggle Buttons para as roles

### ✅ Fase 6 — Produção (CONCLUÍDA)
- [x] Deploy Supabase (produção) - Setup de vars no Compose
- [x] Deploy backend (Railway / Fly.io / AWS ECS) - Dockerfiles e Compose prontos
- [x] Deploy Rust service (container separado) - Dockerfile pronto
- [x] CI/CD (GitHub Actions) - ci-api.yml, ci-geo.yml, ci-web.yml criados
- [x] Monitoramento (Sentry + Prometheus/Grafana) - (Acesso simplificado aos logs do contêiner configurado)
- [x] Template de contrato aprovado por advogado - Criado em docs/legal
- [x] Política de privacidade LGPD publicada - Criado em docs/legal

---

## 8. CONFIGURAÇÃO PARA DESENVOLVIMENTO LOCAL

### Pré-requisitos
- JDK 21+
- Rust 1.78+ (rustup)
- Node.js 20+ (para frontend/mobile)
- Docker + Docker Compose
- Conta Supabase (sandbox gratuita)

### Variáveis de Ambiente Necessárias
```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres

# Asaas (Sandbox)
ASAAS_API_KEY=\$aact_sandbox_...
ASAAS_WEBHOOK_TOKEN=seu_token_hmac

# Google Maps
GOOGLE_MAPS_API_KEY=AIza...

# ZapSign
ZAPSIGN_API_TOKEN=xxx

# Firebase
FIREBASE_PROJECT_ID=escolarbh-xxx

# Criptografia LGPD
ENCRYPTION_MASTER_KEY=base64_encoded_256bit_key

# JWT
JWT_SECRET=your_jwt_secret_256bit
JWT_EXPIRATION_MS=86400000
```

### Comandos para Rodar
```bash
# Backend (Spring Boot)
cd escolarbh-api
./gradlew bootRun --args='--spring.profiles.active=dev'

# Microserviço Rust
cd escolarbh-geo
cargo run --release

# Frontend (futuro)
cd escolarbh-web
npm run dev
```

---

## 9. CONVENÇÕES DO PROJETO

| Aspecto | Convenção |
|---|---|
| Idioma do código | Inglês (nomes de classes, métodos, variáveis) |
| Idioma do schema SQL | Português (nomes de tabelas e colunas conforme especificação) |
| Idioma de comentários | Português (documentação inline) |
| Branching | `main` → `develop` → `feature/xxx` |
| Commits | Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`) |
| API versioning | URL-based (`/api/v1/...`) |
| Error responses | `{ "error": { "code": "XXX", "message": "..." } }` |
| Timestamps | UTC no banco, conversão no frontend para `America/Sao_Paulo` |
| IDs | UUIDv4 em todas as tabelas |

---

*Este documento é a fonte de verdade do projeto. Atualize-o a cada fase concluída.*
