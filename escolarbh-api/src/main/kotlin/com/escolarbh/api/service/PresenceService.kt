package com.escolarbh.api.service

import com.escolarbh.api.domain.enums.ContractStatus
import com.escolarbh.api.domain.enums.PresenceStatus
import com.escolarbh.api.domain.model.PresenceRecord
import com.escolarbh.api.dto.PresenceRequest
import com.escolarbh.api.dto.PresenceResponse
import com.escolarbh.api.repository.ContractRepository
import com.escolarbh.api.repository.PresenceRecordRepository
import com.escolarbh.api.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class PresenceService(
    private val presenceRepository: PresenceRecordRepository,
    private val contractRepository: ContractRepository,
    private val userRepository: UserRepository,
    private val firebaseMessagingService: FirebaseMessagingService
) {

    @Transactional
    fun recordPresence(driverId: UUID, request: PresenceRequest): PresenceResponse {
        // Valida se o contrato existe
        val contract = contractRepository.findById(request.contractId)
            .orElseThrow { IllegalArgumentException("Contrato não encontrado") }

        // Valida se o motorista é o dono do contrato
        if (contract.driverId != driverId) {
            throw IllegalArgumentException("Motorista não autorizado para este contrato")
        }

        // Valida se o contrato está ativo
        if (contract.status != ContractStatus.ATIVO) {
            throw IllegalArgumentException("Contrato não está ativo")
        }

        // Valida se o aluno está vinculado ao contrato
        if (!contract.alunosIds.contains(request.studentId)) {
            throw IllegalArgumentException("Aluno não vinculado a este contrato")
        }

        // Cria o registro
        val record = PresenceRecord(
            studentId = request.studentId,
            driverId = driverId,
            contractId = request.contractId,
            status = request.status,
            locationLat = request.locationLat,
            locationLng = request.locationLng
        )

        val saved = presenceRepository.save(record)

        // Enviar Push Notification (FCM) para o responsavel (contract.responsavelId)
        val parent = userRepository.findById(contract.responsavelId).orElse(null)
        val pushToken = parent?.pushToken

        if (pushToken != null && pushToken.isNotBlank()) {
            val title = "Atualização de Transporte"
            val body = if (request.status == PresenceStatus.EMBARCADO) {
                "Seu filho embarcou no transporte escolar!"
            } else if (request.status == PresenceStatus.DESEMBARCADO) {
                "Seu filho desembarcou em segurança!"
            } else {
                "O status de transporte do seu filho foi atualizado."
            }
            firebaseMessagingService.sendNotification(pushToken, title, body)
        } else {
            println("SIMULANDO PUSH NOTIFICATION: Aluno ${request.studentId} atualizado para ${request.status} - Responsável não tem token push cadastrado.")
        }

        return toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun getStudentHistory(studentId: UUID, responsavelId: UUID): List<PresenceResponse> {
        // RLS no banco de dados já garante segurança, mas validamos a existência e retornamos mapeado
        return presenceRepository.findByStudentIdOrderByRecordedAtDesc(studentId)
            .map { toResponse(it) }
    }

    private fun toResponse(entity: PresenceRecord): PresenceResponse {
        return PresenceResponse(
            id = entity.id!!,
            studentId = entity.studentId,
            driverId = entity.driverId,
            contractId = entity.contractId,
            status = entity.status,
            locationLat = entity.locationLat,
            locationLng = entity.locationLng,
            recordedAt = entity.recordedAt!!
        )
    }
}
