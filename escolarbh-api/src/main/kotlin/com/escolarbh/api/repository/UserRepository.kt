package com.escolarbh.api.repository

import com.escolarbh.api.domain.model.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface UserRepository : JpaRepository<User, UUID> {
    fun findByEmail(email: String): User?
    fun findByCpf(cpf: String): User?
    fun existsByEmail(email: String): Boolean
    fun existsByCpf(cpf: String): Boolean
}
