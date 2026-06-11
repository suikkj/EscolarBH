package com.escolarbh.api.service.lgpd

import com.escolarbh.api.domain.enums.ConsentAction
import com.escolarbh.api.domain.enums.ConsentType
import com.escolarbh.api.domain.model.ConsentRecord
import com.escolarbh.api.exception.BusinessValidationException
import com.escolarbh.api.repository.ConsentRecordRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class ConsentService(
    private val consentRecordRepository: ConsentRecordRepository
) {
    private val logger = LoggerFactory.getLogger(ConsentService::class.java)

    /**
     * Registra o consentimento de um pai para tratar os dados de um dependente menor de idade.
     */
    @Transactional
    fun registerConsent(
        userId: UUID,
        studentId: UUID?,
        type: ConsentType,
        finalidade: String,
        ipAddress: String,
        userAgent: String
    ): ConsentRecord {
        logger.info("Registrando consentimento CONCEDIDO para usuário: {}", userId)
        
        val record = ConsentRecord(
            responsavelId = userId,
            studentId = studentId,
            tipoConsentimento = type,
            acao = ConsentAction.CONCEDIDO,
            finalidadeTratamento = finalidade,
            ipOrigem = ipAddress,
            userAgent = userAgent
        )
        
        return consentRecordRepository.save(record)
    }

    /**
     * Revoga um consentimento existente. Note que não apagamos o registro antigo (LGPD exige trilha),
     * apenas inserimos um novo registro de revogação (Append-Only).
     */
    @Transactional
    fun revokeConsent(
        userId: UUID,
        studentId: UUID?,
        type: ConsentType,
        finalidade: String,
        ipAddress: String,
        userAgent: String
    ): ConsentRecord {
        logger.info("Registrando consentimento REVOGADO para usuário: {}", userId)
        
        val record = ConsentRecord(
            responsavelId = userId,
            studentId = studentId,
            tipoConsentimento = type,
            acao = ConsentAction.REVOGADO,
            finalidadeTratamento = finalidade,
            ipOrigem = ipAddress,
            userAgent = userAgent
        )
        
        return consentRecordRepository.save(record)
    }

    /**
     * Valida se um determinado estudante possui consentimento ativo.
     * Utilizado antes de retornar dados do aluno para motoristas.
     */
    @Transactional(readOnly = true)
    fun hasActiveConsent(studentId: UUID, type: ConsentType): Boolean {
        val records = consentRecordRepository.findByStudentId(studentId)
            .filter { it.tipoConsentimento == type }
            .sortedByDescending { it.criadoEm }
            
        if (records.isEmpty()) return false
        
        // Se o último registro temporal for CONCEDIDO, está válido.
        return records.first().acao == ConsentAction.CONCEDIDO
    }
    
    fun validateConsentOrThrow(studentId: UUID, type: ConsentType) {
        if (!hasActiveConsent(studentId, type)) {
            throw BusinessValidationException("Falta de consentimento LGPD ativo para esta ação.")
        }
    }
}

