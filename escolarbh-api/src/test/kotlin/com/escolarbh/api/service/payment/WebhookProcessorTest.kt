package com.escolarbh.api.service.payment

import com.escolarbh.api.domain.enums.PaymentStatus
import com.escolarbh.api.domain.model.Subscription
import com.escolarbh.api.repository.SubscriptionRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import java.math.BigDecimal
import java.time.OffsetDateTime
import java.util.UUID

class WebhookProcessorTest {

    private val subscriptionRepository = mockk<SubscriptionRepository>(relaxed = true)
    private val webhookProcessor = WebhookProcessor(subscriptionRepository)

    @Test
    fun `should process PAYMENT_RECEIVED successfully`() {
        // Arrange
        val subscriptionId = "sub_123"
        val subscription = Subscription(
            id = UUID.randomUUID(),
            contractId = UUID.randomUUID(),
            gatewaySubscriptionId = subscriptionId,
            status = PaymentStatus.PENDENTE,
            valorCobrado = BigDecimal("150.00"),
            diaVencimento = 10,
            criadoEm = OffsetDateTime.now(),
            atualizadoEm = OffsetDateTime.now()
        )
        
        val event = AsaasWebhookEvent(
            event = "PAYMENT_RECEIVED",
            payment = AsaasPaymentInfo(
                id = "pay_123",
                customer = "cus_123",
                subscription = subscriptionId,
                value = 150.00,
                status = "RECEIVED"
            )
        )

        every { subscriptionRepository.findByGatewaySubscriptionId(subscriptionId) } returns subscription

        // Act
        val result = webhookProcessor.processEvent(event)

        // Assert
        assertTrue(result.processed)
        assertEquals(PaymentStatus.PAGO, subscription.status)
        verify(exactly = 1) { subscriptionRepository.save(subscription) }
    }

    @Test
    fun `should ignore event if subscription not found`() {
        // Arrange
        val event = AsaasWebhookEvent(
            event = "PAYMENT_RECEIVED",
            payment = AsaasPaymentInfo(
                id = "pay_123",
                customer = "cus_123",
                subscription = "sub_not_found",
                value = 150.00,
                status = "RECEIVED"
            )
        )

        every { subscriptionRepository.findByGatewaySubscriptionId("sub_not_found") } returns null

        // Act
        val result = webhookProcessor.processEvent(event)

        // Assert
        assertFalse(result.processed)
        assertEquals("Assinatura sub_not_found não encontrada no sistema", result.message)
        verify(exactly = 0) { subscriptionRepository.save(any()) }
    }

    @Test
    fun `should handle PAYMENT_OVERDUE correctly`() {
        // Arrange
        val subscriptionId = "sub_overdue"
        val subscription = Subscription(
            id = UUID.randomUUID(),
            contractId = UUID.randomUUID(),
            gatewaySubscriptionId = subscriptionId,
            status = PaymentStatus.PENDENTE,
            valorCobrado = BigDecimal("150.00"),
            diaVencimento = 10,
            criadoEm = OffsetDateTime.now(),
            atualizadoEm = OffsetDateTime.now()
        )
        
        val event = AsaasWebhookEvent(
            event = "PAYMENT_OVERDUE",
            payment = AsaasPaymentInfo(
                id = "pay_456",
                customer = "cus_123",
                subscription = subscriptionId,
                value = 150.00,
                status = "OVERDUE"
            )
        )

        every { subscriptionRepository.findByGatewaySubscriptionId(subscriptionId) } returns subscription

        // Act
        val result = webhookProcessor.processEvent(event)

        // Assert
        assertTrue(result.processed)
        assertEquals(PaymentStatus.INADIMPLENTE, subscription.status)
        verify(exactly = 1) { subscriptionRepository.save(subscription) }
    }
}
