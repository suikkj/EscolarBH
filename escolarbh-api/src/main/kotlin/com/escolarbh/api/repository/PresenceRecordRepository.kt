package com.escolarbh.api.repository

import com.escolarbh.api.domain.model.PresenceRecord
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface PresenceRecordRepository : JpaRepository<PresenceRecord, UUID> {
    
    // Busca o histórico de um aluno específico, ordenado do mais recente para o mais antigo
    fun findByStudentIdOrderByRecordedAtDesc(studentId: UUID): List<PresenceRecord>
    
    // Busca o histórico registrado por um motorista específico hoje (útil para o app do motorista)
    fun findByDriverIdOrderByRecordedAtDesc(driverId: UUID): List<PresenceRecord>
}
