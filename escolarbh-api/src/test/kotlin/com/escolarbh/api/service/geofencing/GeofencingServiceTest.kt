package com.escolarbh.api.service.geofencing

import com.escolarbh.api.domain.model.DriverProfile
import com.escolarbh.api.domain.model.User
import io.mockk.every
import io.mockk.mockk
import jakarta.persistence.EntityManager
import jakarta.persistence.Query
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import java.util.UUID

class GeofencingServiceTest {

    private val entityManager = mockk<EntityManager>(relaxed = true)
    private val geofencingService = GeofencingService(entityManager)

    @Test
    fun `should return driver when point is inside polygon`() {
        // Arrange
        val mockQuery = mockk<Query>(relaxed = true)
        val mockDriver = mockk<DriverProfile>(relaxed = true)
        
        every { entityManager.createNativeQuery(any(), DriverProfile::class.java) } returns mockQuery
        every { mockQuery.setParameter(any<String>(), any()) } returns mockQuery
        
        // Simula que o banco retornou 1 motorista cobrindo a área
        every { mockQuery.resultList } returns listOf(mockDriver)

        // Act
        val result = geofencingService.findDriversByLocation(latitude = -19.9191, longitude = -43.9387)

        // Assert
        assertEquals(1, result.size)
        assertEquals(mockDriver, result[0])
    }

    @Test
    fun `should return empty list when no driver covers the area`() {
        // Arrange
        val mockQuery = mockk<Query>(relaxed = true)
        
        every { entityManager.createNativeQuery(any(), DriverProfile::class.java) } returns mockQuery
        every { mockQuery.setParameter(any<String>(), any()) } returns mockQuery
        
        // Simula que o banco não encontrou nenhum motorista
        every { mockQuery.resultList } returns emptyList<DriverProfile>()

        // Act
        val result = geofencingService.findDriversByLocation(latitude = -19.8530, longitude = -43.9680)

        // Assert
        assertTrue(result.isEmpty())
    }
}
