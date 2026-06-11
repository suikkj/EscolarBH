package com.escolarbh.api.controller

import com.escolarbh.api.domain.model.User
import com.escolarbh.api.repository.UserRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.client.RestTemplate
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.beans.factory.annotation.Value
import java.util.UUID

@RestController
@RequestMapping("/v1/users")
@CrossOrigin(origins = ["*"])
class UserController(
    private val userRepository: UserRepository
) {
    @Value("\${SUPABASE_URL:}")
    private lateinit var supabaseUrl: String

    @Value("\${SUPABASE_SERVICE_KEY:}")
    private lateinit var supabaseServiceKey: String

    data class PushTokenRequest(val token: String)

    data class UpdateUserRequest(
        val nomeCompleto: String?,
        val email: String?,
        val cpf: String?,
        val telefone: String?,
        val cep: String?,
        val estado: String?,
        val cidade: String?,
        val rua: String?,
        val numero: String?,
        val complemento: String?
    )

    @PutMapping("/me/push-token")
    fun updatePushToken(
        @RequestHeader("X-User-Id") userId: UUID,
        @RequestBody request: PushTokenRequest
    ): ResponseEntity<Void> {
        val user = userRepository.findById(userId).orElseThrow { IllegalArgumentException("User not found") }
        user.pushToken = request.token
        userRepository.save(user)
        return ResponseEntity.ok().build()
    }

    @GetMapping("/me")
    fun getMyProfile(@RequestHeader("X-User-Id") userId: UUID): ResponseEntity<User> {
        val user = userRepository.findById(userId).orElseGet {
            val newUser = User(
                id = userId,
                nomeCompleto = "Novo Usuário (Local)",
                email = "${userId.toString().substring(0,8)}@local.dev",
                cpf = "${(100..999).random()}.${(100..999).random()}.${(100..999).random()}-${(10..99).random()}",
                senhaHash = "auth_managed"
            )
            userRepository.save(newUser)
        }
        return ResponseEntity.ok(user)
    }

    @PutMapping("/me")
    fun updateMyProfile(
        @RequestHeader("X-User-Id") userId: UUID,
        @RequestBody request: UpdateUserRequest
    ): ResponseEntity<User> {
        val user = userRepository.findById(userId).orElseGet {
            val newUser = User(
                id = userId,
                nomeCompleto = "Novo Usuário (Local)",
                email = "${userId.toString().substring(0,8)}@local.dev",
                cpf = "${(100..999).random()}.${(100..999).random()}.${(100..999).random()}-${(10..99).random()}",
                senhaHash = "auth_managed"
            )
            userRepository.save(newUser)
        }
        
        request.nomeCompleto?.let { user.nomeCompleto = it }
        request.email?.let { user.email = it }
        request.cpf?.let { user.cpf = it }
        request.telefone?.let { user.telefone = it }
        request.cep?.let { user.cep = it }
        request.estado?.let { user.estado = it }
        request.cidade?.let { user.cidade = it }
        request.rua?.let { user.rua = it }
        request.numero?.let { user.numero = it }
        request.complemento?.let { user.complemento = it }

        val updatedUser = userRepository.save(user)
        return ResponseEntity.ok(updatedUser)
    }

    @GetMapping("/check-email")
    fun checkEmailExists(@RequestParam email: String): ResponseEntity<Map<String, Boolean>> {
        if (supabaseUrl.isEmpty() || supabaseServiceKey.isEmpty()) {
            return ResponseEntity.ok(mapOf("exists" to false))
        }

        try {
            val restTemplate = RestTemplate()
            val headers = HttpHeaders()
            headers.set("Authorization", "Bearer $supabaseServiceKey")
            headers.set("apikey", supabaseServiceKey)
            
            val entity = HttpEntity<String>(headers)
            val response = restTemplate.exchange(
                "$supabaseUrl/auth/v1/admin/users",
                HttpMethod.GET,
                entity,
                List::class.java
            )
            
            val users = response.body as? List<Map<String, Any>> ?: emptyList()
            val exists = users.any { it["email"] == email }
            
            return ResponseEntity.ok(mapOf("exists" to exists))
        } catch (e: Exception) {
            e.printStackTrace()
            return ResponseEntity.ok(mapOf("exists" to false))
        }
    }
}
