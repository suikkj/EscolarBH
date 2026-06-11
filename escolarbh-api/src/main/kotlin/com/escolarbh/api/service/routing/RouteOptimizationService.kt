package com.escolarbh.api.service.routing

import com.escolarbh.api.domain.enums.Turno
import com.escolarbh.api.domain.model.Student
import com.escolarbh.api.repository.StudentRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate
import org.slf4j.LoggerFactory
import org.springframework.transaction.annotation.Transactional

@Service
class RouteOptimizationService(
    private val studentRepository: StudentRepository
) {
    private val log = LoggerFactory.getLogger(RouteOptimizationService::class.java)

    @Value("\${escolarbh.google-maps.api-key:}")
    private lateinit var googleMapsApiKey: String

    // Endereço fixo ou coordenado da base (escola)
    private val BASE_LOCATION = "-19.9166813,-43.9344931" // Placeholder BH Central

    /**
     * Otimiza a rota dos estudantes de um turno usando a API de Directions do Google.
     * Google Directions suporta max 25 waypoints com optimize:true.
     */
    @Transactional
    fun optimizeShiftRoute(turno: Turno) {
        val students = studentRepository.findAll().filter { it.turno == turno && it.pontoBuscaGeo != null }
        if (students.isEmpty()) return

        if (googleMapsApiKey.isEmpty()) {
            log.warn("Google Maps API Key not configured. Using linear sorting by creation time.")
            students.sortedBy { it.criadoEm }.forEachIndexed { index, student ->
                student.ordemRota = index + 1
                studentRepository.save(student)
            }
            return
        }

        try {
            val waypoints = students.joinToString("|") { "${it.pontoBuscaGeo!!.y},${it.pontoBuscaGeo!!.x}" }
            
            val restTemplate = RestTemplate()
            val url = "https://maps.googleapis.com/maps/api/directions/json" +
                    "?origin=$BASE_LOCATION" +
                    "&destination=$BASE_LOCATION" +
                    "&waypoints=optimize:true|$waypoints" +
                    "&key=$googleMapsApiKey"

            val response = restTemplate.getForObject(url, Map::class.java)
            val routes = response?.get("routes") as? List<Map<String, Any>>
            
            if (!routes.isNullOrEmpty()) {
                val waypointOrder = routes[0]["waypoint_order"] as? List<Int>
                if (waypointOrder != null && waypointOrder.size == students.size) {
                    waypointOrder.forEachIndexed { newOrder, originalIndex ->
                        val student = students[originalIndex]
                        student.ordemRota = newOrder + 1
                        studentRepository.save(student)
                    }
                    log.info("Successfully optimized route for shift $turno with ${students.size} students.")
                }
            } else {
                log.error("Google Maps API returned no routes or failed: ${response?.get("status")}")
            }
        } catch (e: Exception) {
            log.error("Failed to optimize route with Google Maps", e)
        }
    }
}
