package com.escolarbh.api.controller

import com.escolarbh.api.domain.model.DriverProfile
import com.escolarbh.api.service.geofencing.GeofencingService
import com.fasterxml.jackson.databind.ObjectMapper
import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.UUID

@WebMvcTest(GeofencingController::class)
@AutoConfigureMockMvc(addFilters = false) // Ignora filtros de segurança (JWT) para testes unitários do controller
class GeofencingControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockkBean
    private lateinit var geofencingService: GeofencingService

    @Test
    fun `should check coverage and return covered status`() {
        val request = CoverageCheckRequest(
            latitude = -19.9191,
            longitude = -43.9387
        )

        val driver = DriverProfile(
            id = UUID.randomUUID(),
            userId = UUID.randomUUID(),
            registroBhtrans = "BH-12345",
            poligonoAtuacaoGeo = null // Geometria ignorada no teste do DTO
        )

        every { geofencingService.findDriversByLocation(request.latitude, request.longitude) } returns listOf(driver)

        mockMvc.perform(post("/v1/coverage/check")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.covered").value(true))
            .andExpect(jsonPath("$.matchingDrivers[0].registroBhtrans").value("BH-12345"))
    }

    @Test
    fun `should return not covered when no drivers found`() {
        val request = CoverageCheckRequest(
            latitude = -19.8530,
            longitude = -43.9680
        )

        every { geofencingService.findDriversByLocation(request.latitude, request.longitude) } returns emptyList()

        mockMvc.perform(post("/v1/coverage/check")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.covered").value(false))
            .andExpect(jsonPath("$.matchingDrivers").isEmpty)
    }
}
