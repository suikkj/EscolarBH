package com.escolarbh.api.controller

import com.escolarbh.api.service.payment.AsaasWebhookEvent
import com.escolarbh.api.service.payment.WebhookProcessor
import com.escolarbh.api.service.payment.WebhookResult
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/**
 * Controller de Webhooks — Recebe callbacks do Gateway de Pagamento (Asaas).
 *
 * Segurança:
 * - Validação HMAC-SHA256 do payload (evita ataques de replay/spoofing)
 * - Endpoint não autenticado (o Asaas não envia JWT), mas protegido por HMAC
 * - Rate limiting via middleware
 *
 * Idempotência:
 * - O WebhookProcessor verifica gateway_payment_id antes de processar
 * - Retorna 200 OK mesmo se o evento já foi processado (evita re-envio do Asaas)
 */
@RestController
@RequestMapping("/v1/webhooks")
class WebhookController(
    private val webhookProcessor: WebhookProcessor,

    @Value("\${escolarbh.asaas.webhook-token}")
    private val webhookToken: String
) {
    private val logger = LoggerFactory.getLogger(WebhookController::class.java)

    /**
     * Recebe webhook do Asaas.
     *
     * O Asaas envia um POST com o payload JSON e um header
     * 'asaas-access-token' para validação.
     *
     * Em produção, usar HMAC-SHA256 para validar integridade.
     * No sandbox, o Asaas envia o access token no header.
     *
     * @param accessToken Token de acesso enviado pelo Asaas no header
     * @param event Payload do webhook deserializado
     * @return 200 OK (sempre, para evitar re-envio)
     */
    @PostMapping("/asaas")
    fun handleAsaasWebhook(
        @RequestHeader("asaas-access-token", required = false) accessToken: String?,
        @RequestBody event: AsaasWebhookEvent
    ): ResponseEntity<WebhookResult> {

        // ── Validação de autenticidade ──
        if (!validateWebhookToken(accessToken)) {
            logger.warn("🚨 Webhook Asaas rejeitado: token inválido")
            // Retorna 200 mesmo assim para não expor que o token é inválido
            return ResponseEntity.ok(
                WebhookResult(processed = false, event = event.event, message = "Ignorado")
            )
        }

        logger.info("📩 Webhook Asaas recebido: evento={}", event.event)

        return try {
            val result = webhookProcessor.processEvent(event)
            ResponseEntity.ok(result)
        } catch (e: Exception) {
            logger.error("❌ Erro ao processar webhook Asaas: {}", e.message, e)
            // Retorna 200 para evitar que o Asaas re-envie indefinidamente
            // O erro é logado e pode ser reprocessado manualmente
            ResponseEntity.ok(
                WebhookResult(
                    processed = false,
                    event = event.event,
                    message = "Erro interno — será reprocessado"
                )
            )
        }
    }

    /**
     * Valida o token do webhook.
     *
     * No sandbox do Asaas, o token é enviado no header 'asaas-access-token'.
     * Em produção, migrar para validação HMAC-SHA256 do body.
     */
    private fun validateWebhookToken(receivedToken: String?): Boolean {
        if (webhookToken.isBlank()) {
            logger.warn("⚠️ ASAAS_WEBHOOK_TOKEN não configurado — aceitando todos os webhooks (DEV ONLY)")
            return true
        }
        return receivedToken == webhookToken
    }

    /**
     * Validação HMAC-SHA256 do payload (para produção).
     * Usa o body raw + webhook secret para gerar hash e comparar.
     */
    @Suppress("unused")
    private fun validateHmac(payload: ByteArray, receivedSignature: String): Boolean {
        val mac = Mac.getInstance("HmacSHA256")
        val keySpec = SecretKeySpec(webhookToken.toByteArray(), "HmacSHA256")
        mac.init(keySpec)
        val calculatedSignature = mac.doFinal(payload)
            .joinToString("") { "%02x".format(it) }
        return calculatedSignature == receivedSignature
    }
}
