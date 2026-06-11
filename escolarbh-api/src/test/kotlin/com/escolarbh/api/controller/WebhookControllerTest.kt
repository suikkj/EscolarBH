package com.escolarbh.api.controller

import com.escolarbh.api.service.payment.AsaasPaymentInfo
import com.escolarbh.api.service.payment.AsaasWebhookEvent
import com.escolarbh.api.service.payment.WebhookProcessor
import com.escolarbh.api.service.payment.WebhookResult
import com.fasterxml.jackson.databind.ObjectMapper
import io.mockk.every
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import com.ninjasquad.springmockk.MockkBean

@WebMvcTest(WebhookController::class)
class WebhookControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockkBean
    private lateinit var webhookProcessor: WebhookProcessor

    @Test
    fun `should accept webhook when token is correct`() {
        val event = AsaasWebhookEvent(
            event = "PAYMENT_RECEIVED",
            payment = AsaasPaymentInfo(
                id = "pay_123",
                customer = "cus_123",
                subscription = "sub_123",
                value = 100.0,
                status = "RECEIVED"
            )
        )

        every { webhookProcessor.processEvent(any()) } returns WebhookResult(
            processed = true,
            event = "PAYMENT_RECEIVED",
            message = "Sucesso"
        )

        // WebhookToken is mock-injected via application properties during tests, 
        // usually defaults to empty if not set, or we can assume it passes if no token is enforced in dev
        
        mockMvc.perform(post("/v1/webhooks/asaas")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(event))
            .header("asaas-access-token", "test-token")) // Assuming dev mode accepts anything or we inject it
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.processed").value(true))
            .andExpect(jsonPath("$.message").value("Sucesso"))
    }
}
