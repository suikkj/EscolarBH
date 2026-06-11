package com.escolarbh.api.domain.model

import com.escolarbh.api.domain.enums.PaymentMethod
import com.escolarbh.api.domain.enums.PaymentStatus
import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import java.math.BigDecimal
import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.UUID

/**
 * Entidade Subscription — mapeia a tabela 'subscriptions'.
 *
 * Mensalidade recorrente vinculada a um contrato ativo.
 * Gerenciada automaticamente pelo Asaas via webhooks.
 * Relação 1:1 com contracts.
 */
@Entity
@Table(name = "subscriptions")
class Subscription(

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @Column(name = "contract_id", nullable = false, unique = true)
    val contractId: UUID,

    // ── Valores ──
    @Column(name = "valor_mensalidade", nullable = false, precision = 10, scale = 2)
    var valorMensalidade: BigDecimal,

    @Column(name = "desconto", precision = 10, scale = 2)
    var desconto: BigDecimal = BigDecimal.ZERO,

    // valor_cobrado é GENERATED ALWAYS — não mapeamos para escrita

    // ── Status ──
    @Enumerated(EnumType.STRING)
    @Column(name = "status_pagamento", nullable = false)
    var statusPagamento: PaymentStatus = PaymentStatus.PENDENTE,

    @Enumerated(EnumType.STRING)
    @Column(name = "metodo_pagamento")
    var metodoPagamento: PaymentMethod? = null,

    // ── Gateway (Asaas) ──
    @Column(name = "gateway_subscription_id")
    var gatewaySubscriptionId: String? = null,

    @Column(name = "gateway_customer_id")
    var gatewayCustomerId: String? = null,

    @Column(name = "gateway_payment_id")
    var gatewayPaymentId: String? = null,

    // ── Datas ──
    @Column(name = "proximo_vencimento", nullable = false)
    var proximoVencimento: LocalDate,

    @Column(name = "ultimo_pagamento_em")
    var ultimoPagamentoEm: OffsetDateTime? = null,

    @Column(name = "dia_vencimento", nullable = false)
    var diaVencimento: Int = 10,

    // ── Inadimplência ──
    @Column(name = "dias_inadimplente")
    var diasInadimplente: Int = 0,

    @Column(name = "tentativas_cobranca")
    var tentativasCobranca: Int = 0,

    // ── Timestamps ──
    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    val criadoEm: OffsetDateTime? = null,

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    val atualizadoEm: OffsetDateTime? = null
) {
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", insertable = false, updatable = false)
    val contract: Contract? = null
}
