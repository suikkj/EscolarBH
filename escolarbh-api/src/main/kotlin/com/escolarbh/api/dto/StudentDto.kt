package com.escolarbh.api.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.UUID

data class StudentCreateRequest(
    @field:NotBlank(message = "O primeiro nome é obrigatório")
    val primeiroNome: String,

    // Estes campos serão criptografados no Service antes de salvar
    @field:NotBlank(message = "O sobrenome é obrigatório")
    val sobrenome: String,

    @field:NotNull(message = "A data de nascimento é obrigatória")
    val dataNascimento: LocalDate,

    val rgRestrito: String?,
    val dadosMedicos: String?,

    @field:NotBlank(message = "O endereço de busca é obrigatório")
    val enderecoBusca: String,

    @field:NotBlank(message = "A escola/destino é obrigatório")
    val escolaDestino: String,

    // A assinatura do termo LGPD é obrigatória para cadastrar menor
    @field:NotNull(message = "O token de consentimento LGPD é obrigatório")
    val consentimentoLgpdToken: String
)

data class StudentResponse(
    val id: UUID,
    val contratanteId: UUID,
    val primeiroNome: String,
    
    // Decriptados em memória para o contratante (pai)
    val sobrenome: String? = null,
    val dataNascimento: LocalDate? = null,
    val rgRestrito: String? = null,
    val dadosMedicos: String? = null,
    
    val enderecoBusca: String,
    val escolaDestino: String,
    val criadoEm: OffsetDateTime
)

data class StudentPublicResponse(
    val id: UUID,
    val primeiroNome: String, // Único dado visível nativamente
    val enderecoBusca: String,
    val escolaDestino: String
)
