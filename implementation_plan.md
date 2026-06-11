# Fase 5 — Evolução do App Mobile (React Native / Expo)

O app `escolarbh-app` já funciona com Login, Dashboard e mapa. Agora precisamos evoluí-lo para cobrir os requisitos restantes da Fase 5 do `PROJECT_CONTEXT.md`.

## Status Atual do App

| Componente | Estado |
|------------|--------|
| Auth (Login + dev bypass) | ✅ Funcionando |
| Dashboard com mapa (react-native-maps) | ✅ Funcionando |
| Navegação entre telas | ⚠️ Apenas Login → Dashboard (Stack) |
| Tela de Alunos (Motorista) | ❌ Não existe |
| Check-in/Check-out de Alunos | ❌ Não existe |
| Tela de Contratos/Pagamentos (Pai) | ❌ Não existe |
| Push Notifications (FCM) | ❌ Não existe |
| Fluxo por Role (Motorista vs Pai) | ❌ Não existe |

---

## Proposed Changes

### 1. Design System Mobile

Criar um módulo de tema centralizado para manter o visual premium dark-mode consistente com o web, reusando as mesmas cores.

#### [NEW] `src/theme.ts`
- Design tokens: cores, espaçamentos, border-radius, shadows
- Paleta dark-mode idêntica ao `escolarbh-web` (brand-500: `#3b82f6`, bg: `#0f172a`, etc.)

---

### 2. Navegação por Tabs + Role

Substituir o `Stack.Navigator` atual por um sistema com Tab Navigator inferior, onde as tabs variam conforme a role do usuário (motorista vs contratante/pai).

#### [MODIFY] `App.tsx`
- Adicionar `@react-navigation/bottom-tabs`
- Criar `DriverTabNavigator` (Mapa, Alunos, Contratos, Perfil)
- Criar `ParentTabNavigator` (Home, Pagamentos, Perfil)
- Manter Login na Stack (fora das tabs)
- Role inicial simulada via `dev_bypass` (MOTORISTA por padrão)

#### [MODIFY] `src/hooks/AuthProvider.tsx`
- Adicionar `role: 'MOTORISTA' | 'CONTRATANTE' | null` ao contexto
- No dev bypass, simular role como `MOTORISTA`
- Na auth real, extrair role do `user_metadata` do Supabase

---

### 3. Telas do Motorista

#### [NEW] `src/screens/driver/StudentsScreen.tsx`
- Lista de alunos vinculados ao motorista (via contratos ativos)
- Cada card mostra: primeiro nome, escola, endereço de busca
- Botões de **Check-in** (embarque) e **Check-out** (desembarque)
- Status visual: 🟢 A caminho / 🔵 Embarcado / ⚪ Desembarcado
- Pull-to-refresh para atualizar a lista

#### [NEW] `src/screens/driver/ContractsScreen.tsx`
- Lista de contratos do motorista (ativos, suspensos, encerrados)
- Status badge colorido por `ContractStatus`
- Valor mensal, nome do responsável, vigência
- Indicador de inadimplência

#### [MODIFY] `src/screens/DashboardScreen.tsx` → `src/screens/driver/MapScreen.tsx`
- Renomear e mover para pasta `driver/`
- Adicionar visualização do polígono de atuação do motorista
- Adicionar marcadores com posição dos alunos (pontos de busca)

---

### 4. Telas do Contratante (Pai)

#### [NEW] `src/screens/parent/HomeScreen.tsx`
- Resumo: próximo vencimento, status do pagamento, motorista vinculado
- Cards com dados dos filhos (primeiro nome, escola)
- Status do contrato atual

#### [NEW] `src/screens/parent/PaymentsScreen.tsx`
- Lista de pagamentos (histórico de subscriptions)
- Status por cor: PAGO (verde), PENDENTE (amarelo), INADIMPLENTE (vermelho)
- Detalhes: valor, método, data do pagamento/vencimento

---

### 5. Tela de Perfil (compartilhada)

#### [NEW] `src/screens/shared/ProfileScreen.tsx`
- Exibe dados do usuário: nome, email, CPF (mascarado), telefone
- Botão de logout
- Link para solicitar exclusão LGPD (Direito ao Esquecimento)
- Versão do app

---

### 6. Push Notifications

#### [NEW] `src/services/notifications.ts`
- Configuração do `expo-notifications`
- Solicitar permissão de push no primeiro login
- Registrar o Expo Push Token no backend (endpoint a criar no futuro)
- Handler para notificações recebidas (abrir tela correta)

#### [MODIFY] `app.json`
- Adicionar configuração de notificações do Expo
- Adicionar `plugins: ["expo-notifications"]`

---

### 7. Service Layer (API calls)

#### [MODIFY] `src/services/api.ts`
- Adicionar funções tipadas para os endpoints existentes do backend:
  - `getMyStudents()` — alunos do motorista
  - `getMyContracts()` — contratos do usuário
  - `getMySubscriptions()` — pagamentos
  - `checkInStudent(studentId)` / `checkOutStudent(studentId)`
  - `getMyProfile()` — dados do perfil
  - `registerPushToken(token)` — registrar token FCM

---

## Dependências a Instalar

```bash
npx expo install @react-navigation/bottom-tabs expo-notifications expo-device expo-constants @expo/vector-icons
```

> [!NOTE]
> `expo-notifications` já cuida de FCM no Android e APNS no iOS via Expo Push Service, sem precisar configurar Firebase diretamente.

---

## Estrutura Final do App

```
escolarbh-app/src/
├── hooks/
│   └── AuthProvider.tsx          [MODIFY]
├── screens/
│   ├── LoginScreen.tsx           (sem mudanças)
│   ├── driver/
│   │   ├── MapScreen.tsx         [NEW - evolução do DashboardScreen]
│   │   ├── StudentsScreen.tsx    [NEW]
│   │   └── ContractsScreen.tsx   [NEW]
│   ├── parent/
│   │   ├── HomeScreen.tsx        [NEW]
│   │   └── PaymentsScreen.tsx    [NEW]
│   └── shared/
│       └── ProfileScreen.tsx     [NEW]
├── services/
│   ├── api.ts                    [MODIFY]
│   ├── supabaseClient.ts        (sem mudanças)
│   └── notifications.ts         [NEW]
└── theme.ts                      [NEW]
```

---

## Open Questions

> [!IMPORTANT]
> **Role no dev bypass**: No modo de teste (`teste@teste.com`), qual role simular por padrão?
> - Opção A: Sempre **MOTORISTA** (vê mapa + alunos + contratos) — mais funcionalidades para testar
> - Opção B: Botão de toggle na tela de login para alternar entre os dois fluxos
> - **Recomendo B** para facilitar testar ambos os fluxos sem precisar de auth real.

> [!NOTE]
> **Check-in/Check-out**: O backend atual não tem endpoint para registrar embarque/desembarque de alunos. Por agora, implementarei o fluxo completo no frontend com estado local, e na próxima fase criaremos o endpoint REST e a migração SQL para a tabela de registros de presença.

---

## Verification Plan

### Manual
- Login com `teste@teste.com` → app deve mostrar tabs de motorista
- Toggle para CONTRATANTE → app deve mostrar tabs de pai
- Navegar por todas as telas sem crashes
- Pull-to-refresh nas listas
- Botões de check-in/check-out mudam o status visual
- Tela de perfil com botão de logout funcional

### Build
```bash
cd escolarbh-app
npx expo start
# Testar no emulador Android e/ou Expo Go
```
