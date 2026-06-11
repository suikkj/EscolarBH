package com.escolarbh.api.controller

import com.escolarbh.api.service.geofencing.CoverageResult
import com.escolarbh.api.service.geofencing.GeofencingService
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * Controller de Geofencing — Validação de Área de Cobertura.
 *
 * Endpoint principal: POST /api/v1/coverage/check
 * Recebe endereço do pai/responsável e retorna motoristas disponíveis na região.
 */
@RestController
@RequestMapping("/v1/coverage")
class GeofencingController(
    private val geofencingService: GeofencingService
) {
    private val logger = LoggerFactory.getLogger(GeofencingController::class.java)

    /**
     * Verifica cobertura de transporte escolar para um endereço.
     *
     * Fluxo:
     * 1. Recebe endereço textual
     * 2. Geocodifica via Google Maps
     * 3. Consulta PostGIS (ST_Contains) contra polígonos de motoristas
     * 4. Retorna motoristas disponíveis
     *
     * @param request Endereço para verificação
     * @return Lista de motoristas que atendem a região
     */
    @PostMapping("/check")
    suspend fun checkCoverage(
        @Valid @RequestBody request: AddressCheckRequest
    ): ResponseEntity<ApiResponse<CoverageResult>> {
        logger.info("Requisição de verificação de cobertura: {}", request.endereco)

        val result = geofencingService.checkCoverage(request.endereco)

        return ResponseEntity.ok(
            ApiResponse(
                success = result.covered,
                data = result,
                message = result.message
            )
        )
    }

    /**
     * Verifica se um ponto específico está na área de um motorista.
     *
     * Útil para validação em tempo real no mapa do frontend.
     */
    @GetMapping("/check/driver/{driverId}")
    fun checkPointInDriverArea(
        @PathVariable driverId: java.util.UUID,
        @RequestParam lat: Double,
        @RequestParam lng: Double
    ): ResponseEntity<ApiResponse<PointCheckResult>> {
        val isInArea = geofencingService.isPointInDriverArea(driverId, lat, lng)

        return ResponseEntity.ok(
            ApiResponse(
                success = isInArea,
                data = PointCheckResult(
                    driverId = driverId,
                    latitude = lat,
                    longitude = lng,
                    withinArea = isInArea
                ),
                message = if (isInArea) "Endereço dentro da área de cobertura"
                         else "Endereço fora da área de cobertura deste motorista"
            )
        )
    }

    /**
     * Atualiza o polígono de geofencing do motorista autenticado.
     */
    @PutMapping("/driver/me/geofence")
    fun updateMyGeofence(
        @RequestBody request: GeofenceUpdateRequest,
        javaPrincipal: java.security.Principal
    ): ResponseEntity<ApiResponse<Unit>> {
        val userId = java.util.UUID.fromString(javaPrincipal.name)
        geofencingService.updateDriverGeofence(userId, request.points)

        return ResponseEntity.ok(
            ApiResponse(
                success = true,
                message = "Área de atuação atualizada com sucesso!"
            )
        )
    }
}

// ── DTOs ──

data class AddressCheckRequest(
    @field:NotBlank(message = "Endereço é obrigatório")
    val endereco: String,

    val cidade: String = "Belo Horizonte",
    val estado: String = "MG"
)

data class PointCheckResult(
    val driverId: java.util.UUID,
    val latitude: Double,
    val longitude: Double,
    val withinArea: Boolean
)

data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val message: String? = null,
    val errors: List<String>? = null
)

data class GeofenceUpdateRequest(
    val points: List<List<Double>>
)
