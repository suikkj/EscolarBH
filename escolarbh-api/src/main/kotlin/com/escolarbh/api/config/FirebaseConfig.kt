package com.escolarbh.api.config

import com.google.auth.oauth2.GoogleCredentials
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Configuration
import java.io.FileInputStream

@Configuration
class FirebaseConfig {

    private val logger = LoggerFactory.getLogger(FirebaseConfig::class.java)

    @Value("\${firebase.credentials.path:}")
    private lateinit var credentialsPath: String

    @Value("\${firebase.project.id:}")
    private lateinit var projectId: String

    @PostConstruct
    fun initializeFirebaseApp() {
        if (FirebaseApp.getApps().isNotEmpty()) {
            return
        }

        if (credentialsPath.isNotBlank() && projectId.isNotBlank()) {
            try {
                val serviceAccount = FileInputStream(credentialsPath)
                val options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .setProjectId(projectId)
                    .build()

                FirebaseApp.initializeApp(options)
                logger.info("Firebase inicializado com sucesso para o projeto: \$projectId")
            } catch (e: Exception) {
                logger.error("Erro ao inicializar Firebase: \${e.message}")
            }
        } else {
            logger.warn("⚠️ Credenciais do Firebase não configuradas. Notificações Push funcionarão em modo MOCK.")
        }
    }
}
