package com.escolarbh.api.service.encryption

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

class FieldEncryptionServiceTest {

    // Chave base64 válida para testes:
    private val validMasterKey = "q1w2e3r4t5y6u7i8o9p0q1w2e3r4t5y6u7i8o9p0q1w="
    private val encryptionService = FieldEncryptionService(validMasterKey)

    @Test
    fun `should encrypt and decrypt string successfully`() {
        val originalText = "Dado Sensível LGPD"
        
        val encrypted = encryptionService.encrypt(originalText)
        
        assertNotNull(encrypted)
        assertNotEquals(originalText, encrypted)
        
        val decrypted = encryptionService.decrypt(encrypted!!)
        
        assertEquals(originalText, decrypted)
    }

    @Test
    fun `should return null when encrypting null`() {
        assertNull(encryptionService.encrypt(null))
    }

    @Test
    fun `should return null when decrypting null`() {
        assertNull(encryptionService.decrypt(null))
    }

    @Test
    fun `should throw exception if master key is invalid length`() {
        assertThrows<IllegalArgumentException> {
            FieldEncryptionService("invalid_key_length")
        }
    }

    @Test
    fun `should fail to decrypt tampered data`() {
        val originalText = "Test Data"
        val encrypted = encryptionService.encrypt(originalText)!!
        
        // Modifica 1 caracter do Base64
        val tamperedEncrypted = encrypted.dropLast(1) + if (encrypted.last() == 'A') 'B' else 'A'

        assertThrows<Exception> {
            encryptionService.decrypt(tamperedEncrypted)
        }
    }
}
