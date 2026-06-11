package com.escolarbh.api.repository

import com.escolarbh.api.domain.model.Student
import com.escolarbh.api.domain.model.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface StudentRepository : JpaRepository<Student, UUID> {
    fun findByResponsavel(responsavel: User): List<Student>
    fun findByResponsavelId(responsavelId: UUID): List<Student>
}
