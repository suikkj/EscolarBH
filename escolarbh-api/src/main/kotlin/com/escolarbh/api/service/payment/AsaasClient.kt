package com.escolarbh.api.service.payment

import com.fasterxml.jackson.annotation.JsonProperty
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.awaitBody
import java.math.BigDecimal

/**
 * Client HTTP para a API do Asaas (Gateway de Pagamento).
 *
 * Documentação: https://docs.asaas.com
 *
 * Funcionalidades:
 * - Criar customer (pai/responsável)
 * - Criar subscription (mensalidade recorrente)
 * - Consultar pagamentos
 * - Cancelar subscriptions
 *
 * Ambientes:
 * - Sandbox: https://sandbox.asaas.com/api/v3
 * - Produção: https://api.asaas.com/api/v3
 */
@Component
class AsaasClient(
    @Value("\${escolarbh.asaas.api-key}")
    private val apiKey: String,

    @Value("\${escolarbh.asaas.base-url}")
    private val baseUrl: String
) {
    private val logger = LoggerFactory.getLogger(AsaasClient::class.java)

    private val webClient: WebClient by lazy {
        WebClient.builder()
            .baseUrl(baseUrl)
            .defaultHeader("access_token", apiKey)
            .defaultHeader("Content-Type", "application/json")
            .build()
    }

    /**
     * Cria um customer (cliente) no Asaas.
     * Deve ser chamado quando um pai/responsável assina um contrato.
     *
     * @param name Nome completo do pai
     * @param cpf CPF formatado (000.000.000-00)
     * @param email Email do pai
     * @param phone Telefone (opcional)
     * @return AsaasCustomerResponse com o ID do customer no Asaas
     */
    suspend fun createCustomer(
        name: String,
        cpf: String,
        email: String,
        phone: String? = null
    ): AsaasCustomerResponse {
        logger.info("Criando customer no Asaas: {}", email)

        val payload = AsaasCreateCustomerRequest(
            name = name,
            cpfCnpj = cpf.replace(".", "").replace("-", ""),
            email = email,
            phone = phone,
            notificationDisabled = false
        )

        return webClient.post()
            .uri("/customers")
            .bodyValue(payload)
            .retrieve()
            .awaitBody()
    }

    /**
     * Cria uma subscription (assinatura recorrente) no Asaas.
     *
     * @param customerId ID do customer no Asaas
     * @param value Valor da mensalidade
     * @param dueDay Dia do vencimento (1-28)
     * @param description Descrição da cobrança
     * @param billingType Tipo de cobrança: BOLETO, CREDIT_CARD, PIX, UNDEFINED (todos)
     * @return AsaasSubscriptionResponse com o ID da subscription
     */
    suspend fun createSubscription(
        customerId: String,
        value: BigDecimal,
        dueDay: Int = 10,
        description: String = "Transporte Escolar - Mensalidade",
        billingType: String = "UNDEFINED"
    ): AsaasSubscriptionResponse {
        logger.info("Criando subscription no Asaas: customer={}, valor={}", customerId, value)

        val payload = AsaasCreateSubscriptionRequest(
            customer = customerId,
            billingType = billingType,
            value = value.toDouble(),
            cycle = "MONTHLY",
            description = description,
            nextDueDate = calculateNextDueDate(dueDay)
        )

        return webClient.post()
            .uri("/subscriptions")
            .bodyValue(payload)
            .retrieve()
            .awaitBody()
    }

    /**
     * Cancela uma subscription no Asaas.
     */
    suspend fun cancelSubscription(subscriptionId: String) {
        logger.info("Cancelando subscription no Asaas: {}", subscriptionId)

        webClient.delete()
            .uri("/subscriptions/$subscriptionId")
            .retrieve()
            .awaitBody<Any>()
    }

    /**
     * Calcula a próxima data de vencimento baseada no dia desejado.
     */
    private fun calculateNextDueDate(dueDay: Int): String {
        val now = java.time.LocalDate.now()
        val nextDue = if (now.dayOfMonth >= dueDay) {
            now.plusMonths(1).withDayOfMonth(dueDay)
        } else {
            now.withDayOfMonth(dueDay)
        }
        return nextDue.toString() // Formato: yyyy-MM-dd
    }
}

// ── DTOs Asaas ──

data class AsaasCreateCustomerRequest(
    val name: String,
    val cpfCnpj: String,
    val email: String,
    val phone: String? = null,
    val notificationDisabled: Boolean = false
)

data class AsaasCustomerResponse(
    val id: String,
    val name: String,
    val email: String,
    val cpfCnpj: String? = null
)

data class AsaasCreateSubscriptionRequest(
    val customer: String,
    val billingType: String,
    val value: Double,
    val cycle: String = "MONTHLY",
    val description: String,
    val nextDueDate: String
)

data class AsaasSubscriptionResponse(
    val id: String,
    val customer: String,
    val value: Double,
    val cycle: String,
    val status: String,
    @JsonProperty("nextDueDate")
    val nextDueDate: String
)
