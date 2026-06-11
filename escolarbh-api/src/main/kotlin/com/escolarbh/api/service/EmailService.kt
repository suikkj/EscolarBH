package com.escolarbh.api.service

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.math.BigDecimal

@Service
class EmailService {

    private val logger = LoggerFactory.getLogger(EmailService::class.java)

    fun sendFeeChangedEmail(parentEmail: String, studentName: String, oldValue: BigDecimal, newValue: BigDecimal) {
        // Implementação real usaria JavaMailSender, SendGrid, AWS SES, etc.
        logger.info("================ EMAIL ENVIADO ================")
        logger.info("Para: {}", parentEmail)
        logger.info("Assunto: Alteração no valor da mensalidade - {}", studentName)
        logger.info("Corpo: Olá! O valor da mensalidade do aluno {} foi alterado de R$ {} para R$ {}.", studentName, oldValue, newValue)
        logger.info("===============================================")
    }

    fun sendAnnouncementEmail(parentEmail: String, title: String, content: String) {
        logger.info("================ EMAIL ENVIADO ================")
        logger.info("Para: {}", parentEmail)
        logger.info("Assunto: Novo Comunicado - {}", title)
        logger.info("Corpo: {}", content)
        logger.info("===============================================")
    }

    fun sendPaymentFailedEmail(parentEmail: String, studentName: String, daysOverdue: Int = 0) {
        val warning = if (daysOverdue >= 7) {
            "URGENTE: Esta é a última tentativa. O serviço de transporte será CANCELADO hoje."
        } else {
            "Aviso: Não conseguimos processar a cobrança automática do cartão."
        }
        
        logger.info("================ EMAIL ENVIADO ================")
        logger.info("Para: {}", parentEmail)
        logger.info("Assunto: Falha no Pagamento da Mensalidade - {}", studentName)
        logger.info("Corpo: Olá. {} Por favor, verifique o seu método de pagamento.", warning)
        logger.info("===============================================")
    }
}
