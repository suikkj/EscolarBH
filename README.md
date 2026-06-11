# EscolarBH

**EscolarBH** é uma plataforma completa e integrada para gestão de transporte escolar (vans). O sistema visa conectar motoristas, pais de alunos e escolas, fornecendo rastreamento em tempo real, automação de pagamentos, geração de contratos digitais e geofencing inteligente.

---

## 🏗 Arquitetura do Sistema

O projeto adota uma arquitetura em microsserviços (ou monorepo componentizado) dividida em 4 frentes principais:

- **`escolarbh-api`**: Backend central desenvolvido em Kotlin e Spring Boot 3. Responsável pelas regras de negócio, autenticação JWT, integração com gateways de pagamento (Asaas), envio de e-mails, e gestão de dados relacionais via Hibernate/PostgreSQL.
- **`escolarbh-app`**: Aplicativo Mobile construído com React Native e Expo. Possui fluxos dedicados tanto para **Motoristas** (iniciar rotas, checar presenças) quanto para **Pais** (acompanhar filhos, aprovar contratos, realizar pagamentos).
- **`escolarbh-web`**: Dashboard Administrativo em React e Vite. Destinado à administração das rotas, visualização de finanças avançadas e assinatura eletrônica de contratos de forma responsiva.
- **`escolarbh-geo`**: Motor de geofencing de alta performance feito em Rust (Actix-Web). Responsável por checar rotas e limites geográficos, otimizando as verificações de presença baseadas em coordenadas (GPS).

---

## 🛠 Stack Tecnológica

### Backend (API)
- **Linguagem**: Kotlin (JDK 21)
- **Framework**: Spring Boot 3
- **Banco de Dados**: PostgreSQL com extensão PostGIS (hospedado no Supabase)
- **ORM**: Hibernate + Spring Data JPA
- **Migrações**: Flyway

### Frontend (Web)
- **Framework**: React 18 + Vite
- **Linguagem**: TypeScript
- **Estilização**: CSS Modules / TailwindCSS e componentes Lucide-React
- **Integração Backend**: Supabase Client e consumo da REST API.

### Mobile (App)
- **Framework**: React Native + Expo (EAS Build)
- **Linguagem**: TypeScript
- **Mapas**: React Native Maps + Google Maps API
- **Autenticação**: Supabase Auth

### Geo Engine (Microsserviço Rust)
- **Linguagem**: Rust
- **Framework Web**: Actix-Web
- **Processamento Geoespacial**: Biblioteca `geo`

---

## 🚀 Como Rodar o Projeto Localmente

### Pré-requisitos
- **Java 21** e **Gradle**
- **Node.js** v20+ e **npm**
- **Rust** e **Cargo**
- Conta no **Supabase** (Banco de dados e Auth)
- Conta no **Asaas** (Ambiente Sandbox ou Prod para pagamentos)

### 1. Configurar o Backend (Spring Boot)
1. Navegue até a pasta `escolarbh-api`.
2. Crie ou configure o arquivo `.env` com as chaves do Supabase, Asaas e banco de dados (use `.env.example` como base).
3. Execute a API:
   ```bash
   ./gradlew bootRun --args='--spring.profiles.active=dev'
   ```

### 2. Configurar o Motor de Geofencing (Rust)
1. Navegue até a pasta `escolarbh-geo`.
2. Execute o build e rode o serviço Actix (ele rodará na porta 8081 por padrão):
   ```bash
   cargo run
   ```

### 3. Executar o Dashboard (Web)
1. Navegue até `escolarbh-web`.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

### 4. Executar o Aplicativo (Mobile)
1. Navegue até `escolarbh-app`.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Adicione o seu arquivo `.env` contendo a chave `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (entre outras variáveis de ambiente necessárias).
4. Inicie o Expo:
   ```bash
   npx expo start
   ```

---

## 🔐 Variáveis de Ambiente e Credenciais

> **IMPORTANTE**: As senhas, tokens de API (Asaas, Google Maps, Firebase Admin) e URLs do Supabase **não** devem ser versionadas no repositório público. Use sempre arquivos `.env` locais para desenvolvimento e configure os **Secrets** correspondentes no painel do GitHub ou na sua plataforma de hospedagem para produção.

---

## ⚙️ Integração Contínua (CI/CD)

O projeto possui workflows de integração contínua (GitHub Actions) configurados na pasta `.github/workflows`:
- **CI API**: Executa build e testes unitários do Spring Boot via Gradle.
- **CI Web**: Executa o processo de linting e build estático do painel web.
- **CI Geo**: Verifica a formatação (`cargo fmt`), análises estáticas (`cargo clippy`) e compilação do Rust.

## 📄 Licença

EscolarBH é um software proprietário desenvolvido para uso exclusivo no gerenciamento de transporte escolar. Todos os direitos reservados.
