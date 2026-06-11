package com.escolarbh.api.service.contract

import com.escolarbh.api.domain.enums.ContractStatus
import com.escolarbh.api.service.EmailService
import com.fasterxml.jackson.annotation.JsonProperty
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.awaitBody
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import java.time.OffsetDateTime
import java.time.OffsetDateTime
import java.util.UUID
import java.math.BigDecimal

/**
 * Serviço de Contratos — Integração com ZapSign (Assinatura Eletrônica).
 *
 * Fluxo:
 * 1. Pai aceita termos no frontend
 * 2. Backend coleta evidências (IP, User-Agent, timestamp)
 * 3. Cria documento na ZapSign com template pré-configurado
 * 4. Retorna URL de assinatura para o pai
 * 5. ZapSign envia webhook quando documento é assinado
 * 6. Backend ativa contrato e cria subscription no Asaas
 *
 * Validade jurídica: MP 2200-2, Art. 10, §2º
 * Evidências coletadas: IP, User-Agent, timestamp, hash dos termos
 */
@Service
class ContractService(
    @Value("\${escolarbh.zapsign.api-token}")
    private val zapSignToken: String,

    @Value("\${escolarbh.zapsign.base-url}")
    private val zapSignBaseUrl: String,

    private val emailService: EmailService
) {
    private val logger = LoggerFactory.getLogger(ContractService::class.java)

    @PersistenceContext
    private lateinit var entityManager: EntityManager

    private val webClient: WebClient by lazy {
        WebClient.builder()
            .defaultHeader("Authorization", "Bearer $zapSignToken")
            .defaultHeader("Content-Type", "application/json")
            .build()
    }

    /**
     * Inicia o processo de assinatura de um contrato.
     *
     * @param contractId ID do contrato (já criado como RASCUNHO)
     * @param signerName Nome do assinante (pai/responsável)
     * @param signerEmail Email do assinante
     * @param signerCpf CPF do assinante
     * @param clientIp IP do request (coletado pelo controller)
     * @param userAgent User-Agent do navegador
     * @return SigningResult com URL de assinatura
     */
    @Transactional
    suspend fun initiateContractSigning(
        contractId: UUID,
        signerName: String,
        signerEmail: String,
        signerCpf: String,
        clientIp: String,
        userAgent: String
    ): SigningResult {
        logger.info("Iniciando assinatura do contrato: {}", contractId)

        // 1. Cria documento na ZapSign
        val zapSignDoc = createDocumentOnZapSign(
            name = "Contrato de Transporte Escolar - $signerName",
            signerName = signerName,
            signerEmail = signerEmail,
            signerCpf = signerCpf
        )

        // 2. Atualiza contrato no banco com evidências eletrônicas
        entityManager.createNativeQuery(
            """
            UPDATE contracts SET
                status = :status,
                assinatura_token = :token,
                ip_assinatura = :ip::INET,
                user_agent = :userAgent,
                hash_termos = :hashTermos,
                atualizado_em = NOW()
            WHERE id = :contractId
            """.trimIndent()
        )
            .setParameter("status", ContractStatus.AGUARDANDO_ASSINATURA.name)
            .setParameter("token", zapSignDoc.token)
            .setParameter("ip", clientIp)
            .setParameter("userAgent", userAgent)
            .setParameter("hashTermos", generateTermsHash())
            .setParameter("contractId", contractId)
            .executeUpdate()

        logger.info("✅ Documento ZapSign criado: token={}", zapSignDoc.token)

        return SigningResult(
            contractId = contractId,
            signUrl = zapSignDoc.signUrl,
            token = zapSignDoc.token,
            expiresAt = zapSignDoc.expiresAt
        )
    }

    /**
     * Processa o webhook de assinatura da ZapSign.
     * Chamado quando o documento é assinado pelo pai.
     *
     * @param token Token do documento na ZapSign
     */
    @Transactional
    fun handleSignatureCompleted(token: String) {
        logger.info("Assinatura completada para token: {}", token)

        entityManager.createNativeQuery(
            """
            UPDATE contracts SET
                status = :status,
                assinado_em = NOW(),
                atualizado_em = NOW()
            WHERE assinatura_token = :token
            """.trimIndent()
        )
            .setParameter("status", ContractStatus.ATIVO.name)
            .setParameter("token", token)
            .executeUpdate()

        // TODO: Disparar criação de Subscription no Asaas
        // TODO: Disparar notificação push para motorista (novo contrato ativo)
        logger.info("✅ Contrato ativado via assinatura ZapSign: token={}", token)
    }

    /**
     * Atualiza o valor da mensalidade e notifica o responsável.
     */
    @Transactional
    fun updateContractFee(contractId: UUID, newFee: BigDecimal) {
        logger.info("Atualizando mensalidade do contrato {} para {}", contractId, newFee)
        
        // Em um cenário real, buscaríamos o contrato e recuperaríamos as informações abaixo.
        // Simulando a recuperação de dados do banco para o EmailService:
        val studentName = "Aluno Exemplo"
        val parentEmail = "responsavel@exemplo.com"
        val oldFee = BigDecimal("350.00") // Valor simulado do banco

        // Atualizar no banco (simulação)
        /*
        entityManager.createNativeQuery("UPDATE contracts SET monthly_fee = :newFee WHERE id = :contractId")
            .setParameter("newFee", newFee)
            .setParameter("contractId", contractId)
            .executeUpdate()
        */

        // Enviar o e-mail
        emailService.sendFeeChangedEmail(parentEmail, studentName, oldFee, newFee)
        
        logger.info("✅ Mensalidade atualizada e notificação enviada.")
    }

    /**
     * Cria documento na API da ZapSign.
     *
     * Payload conforme documentação: https://docs.zapsign.com.br
     */
    private suspend fun createDocumentOnZapSign(
        name: String,
        signerName: String,
        signerEmail: String,
        signerCpf: String
    ): ZapSignDocumentResponse {
        val payload = ZapSignCreateDocRequest(
            name = name,
            urlPdf = "", // Em produção: URL do template PDF no Supabase Storage
            lang = "pt-br",
            signers = listOf(
                ZapSignSigner(
                    name = signerName,
                    email = signerEmail,
                    lockEmail = true,
                    lockPhone = false,
                    phoneCountry = "55",
                    authMode = "assinaturaTela",
                    sendAutomaticEmail = true,
                    sendAutomaticWhatsapp = false
                )
            ),
            autoClose = true,
            externalId = UUID.randomUUID().toString()
        )

        return webClient.post()
            .uri("$zapSignBaseUrl/docs/")
            .bodyValue(payload)
            .retrieve()
            .awaitBody()
    }

    /**
     * Gera SHA-256 hash da versão atual dos termos de uso.
     * Garante que o usuário aceitou exatamente esta versão.
     */
    private fun generateTermsHash(): String {
        // Em produção: ler o arquivo de termos e calcular SHA-256
        val termsContent = "Termos de Uso v1.0 - EscolarBH - Transporte Escolar"
        val digest = java.security.MessageDigest.getInstance("SHA-256")
        return digest.digest(termsContent.toByteArray())
            .joinToString("") { "%02x".format(it) }
    }
}

// ── DTOs ZapSign ──

data class ZapSignCreateDocRequest(
    val name: String,
    @JsonProperty("url_pdf") val urlPdf: String,
    val lang: String = "pt-br",
    val signers: List<ZapSignSigner>,
    @JsonProperty("auto_close") val autoClose: Boolean = true,
    @JsonProperty("external_id") val externalId: String? = null
)

data class ZapSignSigner(
    val name: String,
    val email: String,
    @JsonProperty("lock_email") val lockEmail: Boolean = true,
    @JsonProperty("lock_phone") val lockPhone: Boolean = false,
    @JsonProperty("phone_country") val phoneCountry: String = "55",
    @JsonProperty("auth_mode") val authMode: String = "assinaturaTela",
    @JsonProperty("send_automatic_email") val sendAutomaticEmail: Boolean = true,
    @JsonProperty("send_automatic_whatsapp") val sendAutomaticWhatsapp: Boolean = false
)

data class ZapSignDocumentResponse(
    val token: String,
    @JsonProperty("sign_url") val signUrl: String,
    @JsonProperty("created_at") val createdAt: String? = null,
    @JsonProperty("expires_at") val expiresAt: String? = null
)

data class SigningResult(
    val contractId: UUID,
    val signUrl: String,
    val token: String,
    val expiresAt: String?
)
