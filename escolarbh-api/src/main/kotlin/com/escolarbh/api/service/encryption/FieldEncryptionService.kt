package com.escolarbh.api.service.encryption

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import jakarta.annotation.PostConstruct
import java.security.SecureRandom
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

/**
 * Serviço de criptografia de campo para conformidade LGPD.
 *
 * Implementa AES-256-GCM (Authenticated Encryption) para criptografar
 * campos sensíveis de menores de idade na tabela 'students'.
 *
 * Formato de armazenamento: Base64(IV || Ciphertext || AuthTag)
 * - IV: 12 bytes (gerado aleatoriamente por operação)
 * - AuthTag: 128 bits (autenticação integrada)
 *
 * Uso:
 *   val encrypted = fieldEncryptionService.encrypt("João Silva")
 *   val decrypted = fieldEncryptionService.decrypt(encrypted)  // "João Silva"
 */
@Service
class FieldEncryptionService(
    @Value("\${escolarbh.encryption.master-key}")
    private val masterKeyBase64: String,

    @Value("\${escolarbh.encryption.algorithm:AES/GCM/NoPadding}")
    private val algorithm: String,

    @Value("\${escolarbh.encryption.iv-size:12}")
    private val ivSize: Int,

    @Value("\${escolarbh.encryption.tag-size:128}")
    private val tagSize: Int
) {
    private val logger = LoggerFactory.getLogger(FieldEncryptionService::class.java)
    private val secureRandom = SecureRandom()
    private lateinit var secretKey: SecretKey

    @PostConstruct
    fun init() {
        require(masterKeyBase64.isNotBlank()) {
            "ENCRYPTION_MASTER_KEY é obrigatória. Gere com: openssl rand -base64 32"
        }
        val keyBytes = Base64.getDecoder().decode(masterKeyBase64)
        require(keyBytes.size == 32) {
            "ENCRYPTION_MASTER_KEY deve ter 256 bits (32 bytes). Tamanho atual: ${keyBytes.size * 8} bits"
        }
        secretKey = SecretKeySpec(keyBytes, "AES")
        logger.info("FieldEncryptionService inicializado com AES-256-GCM")
    }

    /**
     * Criptografa um texto plano usando AES-256-GCM.
     *
     * @param plaintext Texto a ser criptografado
     * @return String Base64 contendo IV + Ciphertext + AuthTag
     * @throws IllegalStateException se a chave não foi inicializada
     */
    fun encrypt(plaintext: String): String {
        if (plaintext.isBlank()) return plaintext

        val iv = ByteArray(ivSize).also { secureRandom.nextBytes(it) }
        val cipher = Cipher.getInstance(algorithm)
        val gcmSpec = GCMParameterSpec(tagSize, iv)
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec)

        val ciphertext = cipher.doFinal(plaintext.toByteArray(Charsets.UTF_8))

        // Formato: IV || Ciphertext (inclui AuthTag no modo GCM)
        val combined = ByteArray(iv.size + ciphertext.size)
        System.arraycopy(iv, 0, combined, 0, iv.size)
        System.arraycopy(ciphertext, 0, combined, iv.size, ciphertext.size)

        return Base64.getEncoder().encodeToString(combined)
    }

    /**
     * Descriptografa um texto cifrado com AES-256-GCM.
     *
     * @param ciphertext String Base64 contendo IV + Ciphertext + AuthTag
     * @return Texto plano original
     * @throws javax.crypto.AEADBadTagException se o texto foi adulterado
     */
    fun decrypt(ciphertext: String): String {
        if (ciphertext.isBlank()) return ciphertext

        val combined = Base64.getDecoder().decode(ciphertext)

        val iv = combined.copyOfRange(0, ivSize)
        val encrypted = combined.copyOfRange(ivSize, combined.size)

        val cipher = Cipher.getInstance(algorithm)
        val gcmSpec = GCMParameterSpec(tagSize, iv)
        cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec)

        val plaintext = cipher.doFinal(encrypted)
        return String(plaintext, Charsets.UTF_8)
    }

    /**
     * Criptografa um campo opcional (null-safe).
     */
    fun encryptNullable(plaintext: String?): String? =
        plaintext?.let { encrypt(it) }

    /**
     * Descriptografa um campo opcional (null-safe).
     */
    fun decryptNullable(ciphertext: String?): String? =
        ciphertext?.let { decrypt(it) }
}
