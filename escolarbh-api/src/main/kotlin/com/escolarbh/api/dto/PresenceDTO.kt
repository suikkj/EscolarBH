package com.escolarbh.api.dto

import com.escolarbh.api.domain.enums.PresenceStatus
import java.math.BigDecimal
import java.time.OffsetDateTime
import java.util.UUID

data class PresenceRequest(
    val studentId: UUID,
    val contractId: UUID,
    val status: PresenceStatus,
    val locationLat: BigDecimal?,
    val locationLng: BigDecimal?
)

data class PresenceResponse(
    val id: UUID,
    val studentId: UUID,
    val driverId: UUID,
    val contractId: UUID,
    val status: PresenceStatus,
    val locationLat: BigDecimal?,
    val locationLng: BigDecimal?,
    val recordedAt: OffsetDateTime
)
