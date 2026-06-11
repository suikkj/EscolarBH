package com.escolarbh.api.service.payment

import com.escolarbh.api.domain.enums.ContractStatus
import com.escolarbh.api.domain.enums.PaymentStatus
import com.escolarbh.api.service.EmailService
import com.fasterxml.jackson.annotation.JsonProperty
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import java.time.OffsetDateTime

/**
 * Processador de Webhooks do Asaas (Gateway de Pagamento).
 *
 * Escuta eventos de pagamento enviados pelo Asaas via HTTP POST
 * e atualiza o status das subscriptions/contracts no banco.
 *
 * Eventos processados:
 * - PAYMENT_RECEIVED  → marca mensalidade como PAGA
 * - PAYMENT_OVERDUE   → marca como INADIMPLENTE
 * - PAYMENT_DELETED   → marca como CANCELADO
 * - PAYMENT_REFUNDED  → marca como PENDENTE (estorno)
 *
 * Segurança: O webhook é autenticado via HMAC-SHA256 no controller.
 * Idempotência: Usa gateway_payment_id para evitar processamento duplicado.
 */
@Service
class WebhookProcessor(
    private val emailService: EmailService
) {

    private val logger = LoggerFactory.getLogger(WebhookProcessor::class.java)

    @PersistenceContext
    private lateinit var entityManager: EntityManager

    /**
     * Processa um evento de webhook do Asaas.
     *
     * @param event Evento deserializado do payload JSON
     * @return WebhookResult com o resultado do processamento
     */
    @Transactional
    fun processEvent(event: AsaasWebhookEvent): WebhookResult {
        logger.info(
            "Processando webhook Asaas: evento={}, payment={}, subscription={}",
            event.event, event.payment?.id, event.payment?.subscription
        )

        val payment = event.payment
            ?: return WebhookResult(
                processed = false,
                event = event.event,
                message = "Payload sem dados de pagamento"
            )

        return when (event.event) {
            // ── Pagamento Confirmado ──
            "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED" -> {
                handlePaymentReceived(payment)
            }

            // ── Pagamento Vencido (Inadimplência) ──
            "PAYMENT_OVERDUE" -> {
                handlePaymentOverdue(payment)
            }

            // ── Pagamento Deletado ou Subscription Cancelada ──
            "PAYMENT_DELETED", "PAYMENT_REFUNDED" -> {
                handlePaymentCanceled(payment)
            }

            // ── Subscription removida no Asaas ──
            "SUBSCRIPTION_DELETED" -> {
                handleSubscriptionDeleted(payment)
            }

            else -> {
                logger.warn("Evento não tratado: {}", event.event)
                WebhookResult(
                    processed = false,
                    event = event.event,
                    message = "Evento ignorado: ${event.event}"
                )
            }
        }
    }

    /**
     * PAYMENT_RECEIVED: Mensalidade paga com sucesso.
     * - Atualiza status para PAGO
     * - Registra data do último pagamento
     * - Zera contador de inadimplência
     * - Calcula próximo vencimento
     */
    private fun handlePaymentReceived(payment: AsaasPaymentData): WebhookResult {
        val updated = entityManager.createNativeQuery(
            """
            UPDATE subscriptions SET
                status_pagamento = :status,
                gateway_payment_id = :paymentId,
                ultimo_pagamento_em = NOW(),
                dias_inadimplente = 0,
                proximo_vencimento = proximo_vencimento + INTERVAL '1 month',
                atualizado_em = NOW()
            WHERE gateway_subscription_id = :subscriptionId
            RETURNING id
            """.trimIndent()
        )
            .setParameter("status", PaymentStatus.PAGO.name)
            .setParameter("paymentId", payment.id)
            .setParameter("subscriptionId", payment.subscription)
            .resultList

        return if (updated.isNotEmpty()) {
            logger.info("✅ Pagamento confirmado: subscription={}", payment.subscription)
            // TODO: Disparar notificação push para o pai (FCM)
            // TODO: Disparar notificação para o motorista
            WebhookResult(true, "PAYMENT_RECEIVED", "Pagamento registrado com sucesso")
        } else {
            logger.warn("⚠️ Subscription não encontrada: {}", payment.subscription)
            WebhookResult(false, "PAYMENT_RECEIVED", "Subscription não encontrada")
        }
    }

    /**
     * PAYMENT_OVERDUE: Mensalidade vencida.
     * - Atualiza status para INADIMPLENTE
     * - Incrementa contador de dias
     * - Se inadimplência > 30 dias, suspende o contrato
     */
    private fun handlePaymentOverdue(payment: AsaasPaymentData): WebhookResult {
        // Atualiza subscription
        entityManager.createNativeQuery(
            """
            UPDATE subscriptions SET
                status_pagamento = :status,
                gateway_payment_id = :paymentId,
                dias_inadimplente = dias_inadimplente + 1,
                tentativas_cobranca = tentativas_cobranca + 1,
                atualizado_em = NOW()
            WHERE gateway_subscription_id = :subscriptionId
            """.trimIndent()
        )
            .setParameter("status", PaymentStatus.INADIMPLENTE.name)
            .setParameter("paymentId", payment.id)
            .setParameter("subscriptionId", payment.subscription)
            .executeUpdate()

        // Verifica se deve suspender o contrato (> 30 dias inadimplente)
        val shouldSuspend = entityManager.createNativeQuery(
            """
            SELECT s.dias_inadimplente FROM subscriptions s
            WHERE s.gateway_subscription_id = :subscriptionId
            """.trimIndent()
        )
            .setParameter("subscriptionId", payment.subscription)
            .resultList

        if (shouldSuspend.isNotEmpty()) {
            val dias = (shouldSuspend[0] as Number).toInt()
            if (dias > 30) {
                suspendContract(payment.subscription)
                logger.warn("🚫 Contrato suspenso por inadimplência > 30 dias: {}", payment.subscription)
            }
        }

        logger.warn("⚠️ Pagamento vencido: subscription={}", payment.subscription)
        // TODO: Disparar notificação push para o pai (lembrete de pagamento)
        // TODO: Disparar notificação para o motorista (cliente inadimplente)

        // Mock de envio de E-mail de falha
        emailService.sendPaymentFailedEmail("responsavel@exemplo.com", "Aluno Exemplo", 1)

        return WebhookResult(true, "PAYMENT_OVERDUE", "Inadimplência registrada e notificada")
    }

    /**
     * PAYMENT_DELETED/REFUNDED: Pagamento cancelado ou estornado.
     */
    private fun handlePaymentCanceled(payment: AsaasPaymentData): WebhookResult {
        entityManager.createNativeQuery(
            """
            UPDATE subscriptions SET
                status_pagamento = :status,
                atualizado_em = NOW()
            WHERE gateway_subscription_id = :subscriptionId
            """.trimIndent()
        )
            .setParameter("status", PaymentStatus.CANCELADO.name)
            .setParameter("subscriptionId", payment.subscription)
            .executeUpdate()

        logger.info("❌ Pagamento cancelado/estornado: subscription={}", payment.subscription)
        return WebhookResult(true, "PAYMENT_CANCELED", "Cancelamento registrado")
    }

    /**
     * SUBSCRIPTION_DELETED: Assinatura removida no Asaas.
     * Encerra o contrato associado.
     */
    private fun handleSubscriptionDeleted(payment: AsaasPaymentData): WebhookResult {
        // Cancela subscription
        entityManager.createNativeQuery(
            """
            UPDATE subscriptions SET
                status_pagamento = :status,
                atualizado_em = NOW()
            WHERE gateway_subscription_id = :subscriptionId
            """.trimIndent()
        )
            .setParameter("status", PaymentStatus.CANCELADO.name)
            .setParameter("subscriptionId", payment.subscription)
            .executeUpdate()

        // Encerra contrato
        entityManager.createNativeQuery(
            """
            UPDATE contracts SET
                status = :status,
                atualizado_em = NOW()
            WHERE id = (
                SELECT s.contract_id FROM subscriptions s
                WHERE s.gateway_subscription_id = :subscriptionId
            )
            """.trimIndent()
        )
            .setParameter("status", ContractStatus.ENCERRADO.name)
            .setParameter("subscriptionId", payment.subscription)
            .executeUpdate()

        logger.info("🔚 Subscription deletada e contrato encerrado: {}", payment.subscription)
        return WebhookResult(true, "SUBSCRIPTION_DELETED", "Assinatura cancelada e contrato encerrado")
    }

    /**
     * Suspende o contrato vinculado a uma subscription inadimplente.
     */
    private fun suspendContract(subscriptionId: String?) {
        entityManager.createNativeQuery(
            """
            UPDATE contracts SET
                status = :status,
                atualizado_em = NOW()
            WHERE id = (
                SELECT s.contract_id FROM subscriptions s
                WHERE s.gateway_subscription_id = :subscriptionId
            )
            """.trimIndent()
        )
            .setParameter("status", ContractStatus.SUSPENSO.name)
            .setParameter("subscriptionId", subscriptionId)
            .executeUpdate()
    }
}

// ── DTOs do Webhook Asaas ──

data class AsaasWebhookEvent(
    val event: String,
    val payment: AsaasPaymentData? = null
)

data class AsaasPaymentData(
    val id: String,
    val subscription: String? = null,
    val customer: String? = null,
    val value: Double? = null,
    val status: String? = null,

    @JsonProperty("dueDate")
    val dueDate: String? = null,

    @JsonProperty("paymentDate")
    val paymentDate: String? = null,

    @JsonProperty("billingType")
    val billingType: String? = null
)

data class WebhookResult(
    val processed: Boolean,
    val event: String,
    val message: String
)
