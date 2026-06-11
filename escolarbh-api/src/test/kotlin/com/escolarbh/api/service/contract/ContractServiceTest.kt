package com.escolarbh.api.service.contract

import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.persistence.EntityManager
import jakarta.persistence.Query
import kotlinx.coroutines.runBlocking
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import java.util.UUID

class ContractServiceTest {

    private lateinit var mockWebServer: MockWebServer
    private lateinit var contractService: ContractService
    private lateinit var entityManager: EntityManager
    private val objectMapper = ObjectMapper()

    @BeforeEach
    fun setUp() {
        mockWebServer = MockWebServer()
        mockWebServer.start()

        entityManager = mockk<EntityManager>(relaxed = true)

        val baseUrl = mockWebServer.url("/").toString()
        contractService = ContractService(zapSignToken = "test_token", zapSignBaseUrl = baseUrl)
        
        // Inject entity manager via reflection
        val field = ContractService::class.java.getDeclaredField("entityManager")
        field.isAccessible = true
        field.set(contractService, entityManager)
    }

    @AfterEach
    fun tearDown() {
        mockWebServer.shutdown()
    }

    @Test
    fun `should initiate contract signing and update database`() = runBlocking {
        // Arrange
        val contractId = UUID.randomUUID()
        val mockResponse = ZapSignDocumentResponse(
            token = "doc_token_123",
            signUrl = "https://zapsign.com.br/sign/doc_token_123"
        )

        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(objectMapper.writeValueAsString(mockResponse))
        )

        val queryMock = mockk<Query>(relaxed = true)
        every { entityManager.createNativeQuery(any()) } returns queryMock
        every { queryMock.setParameter(any<String>(), any()) } returns queryMock
        every { queryMock.executeUpdate() } returns 1

        // Act
        val result = contractService.initiateContractSigning(
            contractId = contractId,
            signerName = "Pai Teste",
            signerEmail = "pai@teste.com",
            signerCpf = "123.456.789-00",
            clientIp = "192.168.0.1",
            userAgent = "Mozilla/5.0"
        )

        // Assert
        assertEquals(contractId, result.contractId)
        assertEquals("doc_token_123", result.token)
        assertEquals("https://zapsign.com.br/sign/doc_token_123", result.signUrl)

        val recordedRequest = mockWebServer.takeRequest()
        assertEquals("POST", recordedRequest.method)
        assertEquals("/docs/", recordedRequest.path)
        assertEquals("Bearer test_token", recordedRequest.getHeader("Authorization"))
        
        verify(exactly = 1) { entityManager.createNativeQuery(any()) }
        verify(exactly = 6) { queryMock.setParameter(any<String>(), any()) }
        verify(exactly = 1) { queryMock.executeUpdate() }
    }

    @Test
    fun `should handle signature completed webhook`() {
        // Arrange
        val queryMock = mockk<Query>(relaxed = true)
        every { entityManager.createNativeQuery(any()) } returns queryMock
        every { queryMock.setParameter(any<String>(), any()) } returns queryMock
        every { queryMock.executeUpdate() } returns 1

        // Act
        contractService.handleSignatureCompleted("doc_token_123")

        // Assert
        verify(exactly = 1) { entityManager.createNativeQuery(any()) }
        verify(exactly = 1) { queryMock.setParameter("status", "ATIVO") }
        verify(exactly = 1) { queryMock.setParameter("token", "doc_token_123") }
        verify(exactly = 1) { queryMock.executeUpdate() }
    }
}
