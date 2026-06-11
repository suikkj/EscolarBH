package com.escolarbh.api.service.payment

import com.fasterxml.jackson.databind.ObjectMapper
import kotlinx.coroutines.runBlocking
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.math.BigDecimal

class AsaasClientTest {

    private lateinit var mockWebServer: MockWebServer
    private lateinit var asaasClient: AsaasClient
    private val objectMapper = ObjectMapper()

    @BeforeEach
    fun setUp() {
        mockWebServer = MockWebServer()
        mockWebServer.start()

        val baseUrl = mockWebServer.url("/").toString()
        asaasClient = AsaasClient(apiKey = "test_key", baseUrl = baseUrl)
    }

    @AfterEach
    fun tearDown() {
        mockWebServer.shutdown()
    }

    @Test
    fun `should create customer successfully`() = runBlocking {
        // Arrange
        val expectedResponse = AsaasCustomerResponse(
            id = "cus_000005030234",
            name = "Joao Silva",
            email = "joao@email.com",
            cpfCnpj = "12345678909"
        )
        
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(objectMapper.writeValueAsString(expectedResponse))
        )

        // Act
        val response = asaasClient.createCustomer(
            name = "Joao Silva",
            cpf = "123.456.789-09",
            email = "joao@email.com"
        )

        // Assert
        assertEquals("cus_000005030234", response.id)
        assertEquals("Joao Silva", response.name)
        
        // Verify request payload
        val recordedRequest = mockWebServer.takeRequest()
        assertEquals("POST", recordedRequest.method)
        assertEquals("/customers", recordedRequest.path)
        assertEquals("test_key", recordedRequest.getHeader("access_token"))
        
        val bodyStr = recordedRequest.body.readUtf8()
        assertTrue(bodyStr.contains("Joao Silva"))
        assertTrue(bodyStr.contains("12345678909")) // CPF stripped of formatting
    }

    @Test
    fun `should create subscription successfully`() = runBlocking {
        // Arrange
        val expectedResponse = AsaasSubscriptionResponse(
            id = "sub_12345",
            customer = "cus_000005030234",
            value = 150.00,
            cycle = "MONTHLY",
            status = "ACTIVE",
            nextDueDate = "2026-07-10"
        )
        
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(objectMapper.writeValueAsString(expectedResponse))
        )

        // Act
        val response = asaasClient.createSubscription(
            customerId = "cus_000005030234",
            value = BigDecimal("150.00"),
            dueDay = 10
        )

        // Assert
        assertEquals("sub_12345", response.id)
        assertEquals(150.00, response.value)
        
        val recordedRequest = mockWebServer.takeRequest()
        assertEquals("POST", recordedRequest.method)
        assertEquals("/subscriptions", recordedRequest.path)
        
        val bodyStr = recordedRequest.body.readUtf8()
        assertTrue(bodyStr.contains("cus_000005030234"))
        assertTrue(bodyStr.contains("150.0"))
    }
}
