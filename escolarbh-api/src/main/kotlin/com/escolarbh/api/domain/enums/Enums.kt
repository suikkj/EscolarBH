package com.escolarbh.api.domain.enums

/**
 * Papéis de usuário no sistema.
 * Mapeia diretamente para o ENUM PostgreSQL 'user_role'.
 */
enum class UserRole {
    CONTRATANTE,    // Pai/Responsável
    MOTORISTA,      // Motorista Escolar
    ADMIN           // Administrador da plataforma
}

/**
 * Status do ciclo de vida de um contrato.
 * Mapeia para o ENUM PostgreSQL 'contract_status'.
 */
enum class ContractStatus {
    RASCUNHO,
    AGUARDANDO_ASSINATURA,
    ATIVO,
    SUSPENSO,
    ENCERRADO,
    CANCELADO
}

/**
 * Status de pagamento da mensalidade.
 * Mapeia para o ENUM PostgreSQL 'payment_status'.
 */
enum class PaymentStatus {
    PENDENTE,
    PAGO,
    INADIMPLENTE,
    CANCELADO,
    SUSPENSO
}

/**
 * Método de pagamento utilizado.
 * Mapeia para o ENUM PostgreSQL 'payment_method'.
 */
enum class PaymentMethod {
    BOLETO,
    PIX,
    CARTAO_CREDITO,
    CARTAO_DEBITO
}

/**
 * Tipos de consentimento LGPD (Art. 14).
 * Cada tipo corresponde a uma finalidade de tratamento específica.
 */
enum class ConsentType {
    CADASTRO_DADOS_PESSOAIS,
    CADASTRO_DADOS_SAUDE,
    COMPARTILHAMENTO_MOTORISTA,
    GEOLOCALIZACAO,
    COMUNICACAO_PUSH,
    ARMAZENAMENTO_CONTRATO
}

/**
 * Ação de consentimento — append-only (nunca deletar registros).
 */
enum class ConsentAction {
    CONCEDIDO,
    REVOGADO,
    RENOVADO
}
