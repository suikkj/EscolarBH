package com.escolarbh.api.controller

import com.escolarbh.api.domain.model.Notification
import com.escolarbh.api.repository.NotificationRepository
import com.escolarbh.api.service.EmailService
import com.escolarbh.api.service.FirebaseMessagingService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/v1/notifications")
@CrossOrigin(origins = ["*"])
class NotificationController(
    private val notificationRepository: NotificationRepository,
    private val emailService: EmailService,
    private val firebaseMessagingService: FirebaseMessagingService
) {

    @GetMapping
    fun getMyNotifications(@RequestHeader("X-User-Id") userId: UUID): ResponseEntity<List<Notification>> {
        val notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
        return ResponseEntity.ok(notifications)
    }

    data class CreateAnnouncementRequest(
        val targetUserId: UUID,
        val title: String,
        val body: String,
        val targetEmail: String,
        val targetDeviceToken: String?
    )

    @PostMapping("/announcement")
    fun createAnnouncement(@RequestBody request: CreateAnnouncementRequest): ResponseEntity<String> {
        // 1. Salvar no banco (se aplicável ao seu modelo Notification)
        val notification = Notification(
            id = UUID.randomUUID(),
            userId = request.targetUserId,
            title = request.title,
            body = request.body,
            type = "ANNOUNCEMENT",
            read = false,
            createdAt = java.time.OffsetDateTime.now()
        )
        notificationRepository.save(notification)

        // 2. Enviar Push Notification (Firebase)
        if (!request.targetDeviceToken.isNullOrBlank()) {
            firebaseMessagingService.sendNotification(request.targetDeviceToken, request.title, request.body)
        }

        // 3. Enviar E-mail (Conforme Requisito do Usuário)
        emailService.sendAnnouncementEmail(request.targetEmail, request.title, request.body)

        return ResponseEntity.ok("Comunicado enviado por App e Email com sucesso.")
    }
}
