package com.escolarbh.api.dto

import com.escolarbh.api.domain.enums.ContractStatus
import com.escolarbh.api.domain.enums.PaymentStatus
import java.math.BigDecimal
import java.time.OffsetDateTime
import java.util.UUID

data class ContractResponse(
    val id: UUID,
    val responsavelId: UUID,
    val driverId: UUID,
    val alunosIds: List<UUID>,
    val status: ContractStatus,
    val valorMensalidade: BigDecimal,
    val diaVencimento: Int,
    val assinaturaToken: String?,
    val assinadoEm: OffsetDateTime?,
    val criadoEm: OffsetDateTime
)

data class SubscriptionResponse(
    val id: UUID,
    val contractId: UUID,
    val asaasSubscriptionId: String,
    val status: PaymentStatus,
    val valorCobrado: BigDecimal,
    val diaVencimento: Int,
    val proximoVencimento: OffsetDateTime?,
    val criadoEm: OffsetDateTime
)
