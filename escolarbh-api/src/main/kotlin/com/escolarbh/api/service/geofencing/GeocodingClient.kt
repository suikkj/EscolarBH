package com.escolarbh.api.service.geofencing

import com.fasterxml.jackson.annotation.JsonProperty
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.awaitBody

/**
 * Client HTTP para a API de Geocoding do Google Maps.
 *
 * Converte endereço textual em coordenadas geográficas (lat/lng).
 * Rate limit configurável para controlar custos da API.
 *
 * Exemplo de uso:
 *   val coords = geocodingClient.geocode("Rua Espírito Santo, 500, Belo Horizonte, MG")
 *   // GeoCoordinates(lat = -19.9191, lng = -43.9387)
 */
@Component
class GeocodingClient(
    @Value("\${escolarbh.google-maps.api-key}")
    private val apiKey: String,

    @Value("\${escolarbh.google-maps.geocoding-url}")
    private val geocodingUrl: String
) {
    private val logger = LoggerFactory.getLogger(GeocodingClient::class.java)

    private val webClient = WebClient.builder()
        .baseUrl("https://maps.googleapis.com")
        .build()

    /**
     * Geocodifica um endereço textual em coordenadas.
     *
     * @param address Endereço em texto livre (ex: "Rua Espírito Santo, 500, Belo Horizonte, MG")
     * @return GeoCoordinates com lat/lng ou null se não encontrado
     */
    suspend fun geocode(address: String): GeoCoordinates? {
        logger.debug("Geocodificando endereço: {}", address)

        return try {
            val response = webClient.get()
                .uri { uriBuilder ->
                    uriBuilder
                        .path("/maps/api/geocode/json")
                        .queryParam("address", address)
                        .queryParam("key", apiKey)
                        .queryParam("region", "br")
                        .queryParam("language", "pt-BR")
                        .queryParam("components", "country:BR")
                        .build()
                }
                .retrieve()
                .awaitBody<GoogleGeocodingResponse>()

            if (response.status == "OK" && response.results.isNotEmpty()) {
                val location = response.results[0].geometry.location
                val coords = GeoCoordinates(
                    latitude = location.lat,
                    longitude = location.lng,
                    formattedAddress = response.results[0].formattedAddress
                )
                logger.info("Geocoding OK: {} → ({}, {})", address, coords.latitude, coords.longitude)
                coords
            } else {
                logger.warn("Geocoding falhou para '{}': status={}", address, response.status)
                null
            }
        } catch (e: Exception) {
            logger.error("Erro ao geocodificar endereço: {}", address, e)
            null
        }
    }
}

// ── DTOs de resposta da API Google Maps ──

data class GeoCoordinates(
    val latitude: Double,
    val longitude: Double,
    val formattedAddress: String? = null
)

data class GoogleGeocodingResponse(
    val status: String,
    val results: List<GeocodingResult> = emptyList()
)

data class GeocodingResult(
    @JsonProperty("formatted_address")
    val formattedAddress: String,
    val geometry: GeocodingGeometry
)

data class GeocodingGeometry(
    val location: GeocodingLocation
)

data class GeocodingLocation(
    val lat: Double,
    val lng: Double
)
