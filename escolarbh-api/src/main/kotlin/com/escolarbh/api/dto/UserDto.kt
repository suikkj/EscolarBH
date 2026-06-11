package com.escolarbh.api.dto

import com.escolarbh.api.domain.enums.UserRole
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import java.time.OffsetDateTime
import java.util.UUID

data class UserCreateRequest(
    @field:NotBlank(message = "O nome completo é obrigatório")
    val nomeCompleto: String,

    @field:NotBlank(message = "O email é obrigatório")
    @field:Email(message = "Email inválido")
    val email: String,

    @field:NotBlank(message = "O CPF é obrigatório")
    val cpf: String,

    @field:NotBlank(message = "O telefone é obrigatório")
    val telefone: String,

    val role: UserRole
)

data class UserResponse(
    val id: UUID,
    val nomeCompleto: String,
    val email: String,
    val telefone: String?,
    val role: UserRole,
    val criadoEm: OffsetDateTime,
    val cpf: String?,
    val cep: String?,
    val estado: String?,
    val cidade: String?,
    val rua: String?,
    val numero: String?,
    val complemento: String?
)
