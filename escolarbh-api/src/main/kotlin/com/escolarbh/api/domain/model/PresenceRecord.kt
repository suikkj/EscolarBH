package com.escolarbh.api.domain.model

import com.escolarbh.api.domain.enums.PresenceStatus
import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import java.math.BigDecimal
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "presence_records")
class PresenceRecord(

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @Column(name = "student_id", nullable = false)
    val studentId: UUID,

    @Column(name = "driver_id", nullable = false)
    val driverId: UUID,

    @Column(name = "contract_id", nullable = false)
    val contractId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    var status: PresenceStatus,

    @Column(name = "location_lat", precision = 10, scale = 8)
    var locationLat: BigDecimal? = null,

    @Column(name = "location_lng", precision = 11, scale = 8)
    var locationLng: BigDecimal? = null,

    @CreationTimestamp
    @Column(name = "recorded_at", nullable = false, updatable = false)
    val recordedAt: OffsetDateTime? = null
) {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", insertable = false, updatable = false)
    val student: Student? = null

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", insertable = false, updatable = false)
    val driver: User? = null

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", insertable = false, updatable = false)
    val contract: Contract? = null
}
