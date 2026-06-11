package com.escolarbh.api.domain.model

import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "messages")
class Message(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @Column(name = "sender_id", nullable = false)
    val senderId: UUID,

    @Column(name = "recipient_id", nullable = true)
    val recipientId: UUID? = null, // null = broadcast para todos os pais do motorista

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    var content: String,

    @Column(name = "is_broadcast", nullable = false)
    var isBroadcast: Boolean = false,

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    val criadoEm: OffsetDateTime? = null
)
