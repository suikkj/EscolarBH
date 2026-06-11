package com.escolarbh.api.repository

import com.escolarbh.api.domain.model.ConsentRecord
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface ConsentRecordRepository : JpaRepository<ConsentRecord, UUID> {
    fun findByResponsavelId(responsavelId: UUID): List<ConsentRecord>
    fun findByStudentId(studentId: UUID): List<ConsentRecord>
}
