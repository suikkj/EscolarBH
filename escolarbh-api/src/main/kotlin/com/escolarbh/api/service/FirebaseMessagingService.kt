package com.escolarbh.api.service

import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.Message
import com.google.firebase.messaging.Notification
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class FirebaseMessagingService {

    private val logger = LoggerFactory.getLogger(FirebaseMessagingService::class.java)

    fun sendNotification(targetToken: String, title: String, body: String) {
        if (FirebaseApp.getApps().isEmpty()) {
            logger.info("📱 [MOCK PUSH NOTIFICATION] Enviando para: $targetToken | Título: '$title' | Corpo: '$body'")
            return
        }

        try {
            val notification = Notification.builder()
                .setTitle(title)
                .setBody(body)
                .build()

            val message = Message.builder()
                .setToken(targetToken)
                .setNotification(notification)
                .build()

            val response = FirebaseMessaging.getInstance().send(message)
            logger.info("Successfully sent message: $response")
        } catch (e: Exception) {
            logger.error("Error sending push notification: ${e.message}")
        }
    }
}
