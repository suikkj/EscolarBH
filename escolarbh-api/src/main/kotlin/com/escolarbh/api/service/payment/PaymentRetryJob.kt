package com.escolarbh.api.service.payment

import com.escolarbh.api.domain.enums.ContractStatus
import com.escolarbh.api.service.EmailService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext

@Service
class PaymentRetryJob(
    private val emailService: EmailService
) {
    private val logger = LoggerFactory.getLogger(PaymentRetryJob::class.java)

    @PersistenceContext
    private lateinit var entityManager: EntityManager

    /**
     * Executa todos os dias à meia-noite.
     * Verifica assinaturas que estão com pagamentos pendentes/falhos
     * e processa regras de aviso ou cancelamento (7 dias limite).
     */
    @Scheduled(cron = "0 0 0 * * *", zone = "America/Sao_Paulo")
    @Transactional
    fun checkAndProcessFailedPayments() {
        logger.info("Iniciando rotina de verificação de pagamentos em atraso...")

        // Em um cenário real, aqui seria feita uma consulta ao banco (ex: repository.findOverdueSubscriptions())
        // Como o modelo exato de Faturas não está totalmente mapeado aqui, simulamos a lógica:

        val overdueSubscriptionsMock = listOf(
            mapOf("studentName" to "João Pedro", "email" to "joao.pai@email.com", "daysOverdue" to 1, "contractId" to "123"),
            mapOf("studentName" to "Maria Clara", "email" to "maria.mae@email.com", "daysOverdue" to 3, "contractId" to "456"),
            mapOf("studentName" to "Ana Beatriz", "email" to "ana.resp@email.com", "daysOverdue" to 7, "contractId" to "789")
        )

        for (sub in overdueSubscriptionsMock) {
            val daysOverdue = sub["daysOverdue"] as Int
            val email = sub["email"] as String
            val studentName = sub["studentName"] as String
            val contractId = sub["contractId"] as String

            if (daysOverdue == 7) {
                logger.warn("Cancelando contrato do aluno {} por inadimplência de 7 dias.", studentName)
                
                // Enviar aviso final de cancelamento
                emailService.sendPaymentFailedEmail(email, studentName, daysOverdue)

                // Cancelar no Banco
                /*
                entityManager.createNativeQuery("UPDATE contracts SET status = :status WHERE id = :id")
                    .setParameter("status", ContractStatus.CANCELADO.name)
                    .setParameter("id", UUID.fromString(contractId))
                    .executeUpdate()
                */
            } else if (daysOverdue == 1 || daysOverdue == 3 || daysOverdue == 5) {
                logger.info("Enviando aviso de falha na cobrança (dia {}). Aluno: {}", daysOverdue, studentName)
                // O gateway de pagamento (Asaas) fará a tentativa automática na madrugada.
                // Aqui apenas avisamos o cliente da falha contínua.
                emailService.sendPaymentFailedEmail(email, studentName, daysOverdue)
            }
        }

        logger.info("Rotina de verificação finalizada.")
    }
}
