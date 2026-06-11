package com.escolarbh.api.service.geofencing

import com.escolarbh.api.domain.model.DriverProfile
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Serviço de Geofencing — Validação de Área de Cobertura.
 *
 * Fluxo principal:
 * 1. Recebe endereço textual do pai/responsável
 * 2. Geocodifica via Google Maps API (endereço → lat/lng)
 * 3. Executa query PostGIS ST_Contains contra polígonos de motoristas
 * 4. Retorna lista de motoristas que atendem a região
 *
 * A query PostGIS usa o índice GiST na coluna poligono_atuacao_geo
 * para performance O(log n) mesmo com milhares de motoristas.
 */
@Service
class GeofencingService(
    private val geocodingClient: GeocodingClient,

    @Value("\${escolarbh.geofencing.use-rust-service:false}")
    private val useRustService: Boolean
) {
    private val logger = LoggerFactory.getLogger(GeofencingService::class.java)

    @PersistenceContext
    private lateinit var entityManager: EntityManager

    /**
     * Verifica quais motoristas atendem um determinado endereço.
     *
     * @param address Endereço textual (ex: "Rua Espírito Santo, 500, BH, MG")
     * @return CoverageResult com a lista de motoristas que cobrem a região
     */
    @Transactional(readOnly = true)
    suspend fun checkCoverage(address: String): CoverageResult {
        logger.info("Verificando cobertura para endereço: {}", address)

        // 1. Geocoding: endereço → coordenadas
        val coordinates = geocodingClient.geocode(address)
            ?: return CoverageResult(
                covered = false,
                address = address,
                coordinates = null,
                drivers = emptyList(),
                message = "Endereço não encontrado. Verifique e tente novamente."
            )

        // 2. Query PostGIS: ponto está dentro de algum polígono de motorista?
        val drivers = findDriversCoveringPoint(coordinates.latitude, coordinates.longitude)

        val result = CoverageResult(
            covered = drivers.isNotEmpty(),
            address = coordinates.formattedAddress ?: address,
            coordinates = coordinates,
            drivers = drivers.map { driver ->
                DriverCoverageInfo(
                    driverId = driver.id!!,
                    userId = driver.userId,
                    registroBhtrans = driver.registroBhtrans,
                    valorMensalidadeBase = driver.valorMensalidadeBase?.toDouble(),
                    veiculoModelo = driver.veiculoModelo,
                    veiculoCapacidade = driver.veiculoCapacidade
                )
            },
            message = if (drivers.isNotEmpty())
                "${drivers.size} motorista(s) disponível(is) na sua região"
            else
                "Nenhum motorista atende sua região no momento"
        )

        logger.info(
            "Cobertura para ({}, {}): {} motorista(s) encontrado(s)",
            coordinates.latitude, coordinates.longitude, drivers.size
        )

        return result
    }

    /**
     * Query PostGIS: encontra motoristas cujo polígono contém o ponto (lat/lng).
     *
     * SQL equivalente:
     *   SELECT * FROM drivers_profiles
     *   WHERE ativo = TRUE
     *     AND aceita_novos_clientes = TRUE
     *     AND verificado = TRUE
     *     AND ST_Contains(
     *           poligono_atuacao_geo,
     *           ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
     *         )
     *
     * Nota: ST_MakePoint recebe (longitude, latitude) — ordem invertida!
     * O índice GiST garante performance com grande volume de motoristas.
     */
    private fun findDriversCoveringPoint(latitude: Double, longitude: Double): List<DriverProfile> {
        val query = entityManager.createNativeQuery(
            """
            SELECT dp.* FROM drivers_profiles dp
            WHERE dp.ativo = TRUE
              AND dp.aceita_novos_clientes = TRUE
              AND dp.verificado = TRUE
              AND dp.poligono_atuacao_geo IS NOT NULL
              AND ST_Contains(
                    dp.poligono_atuacao_geo,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
                  )
            ORDER BY dp.valor_mensalidade_base ASC NULLS LAST
            """.trimIndent(),
            DriverProfile::class.java
        )
        query.setParameter("lat", latitude)
        query.setParameter("lng", longitude)

        @Suppress("UNCHECKED_CAST")
        return query.resultList as List<DriverProfile>
    }

    /**
     * Verifica se um ponto específico está dentro do polígono de um motorista.
     * Útil para validações pontuais (ex: atualização de endereço de aluno).
     */
    @Transactional(readOnly = true)
    fun isPointInDriverArea(driverId: UUID, latitude: Double, longitude: Double): Boolean {
        val query = entityManager.createNativeQuery(
            """
            SELECT COUNT(*) FROM drivers_profiles dp
            WHERE dp.id = :driverId
              AND ST_Contains(
                    dp.poligono_atuacao_geo,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
                  )
            """.trimIndent()
        )
        query.setParameter("driverId", driverId)
        query.setParameter("lat", latitude)
        query.setParameter("lng", longitude)

        val count = (query.singleResult as Number).toLong()
        return count > 0
    }

    /**
     * Atualiza o polígono de atuação de um motorista na base de dados PostGIS.
     * Recebe uma lista de coordenadas no formato [lat, lng] vindas do frontend.
     */
    @Transactional
    fun updateDriverGeofence(userId: UUID, coordinates: List<List<Double>>) {
        if (coordinates.size < 3) {
            throw IllegalArgumentException("Um polígono precisa ter pelo menos 3 pontos.")
        }

        // PostGIS exige que o primeiro e o último ponto sejam idênticos para fechar o polígono linear
        val points = coordinates.toMutableList()
        val first = points.first()
        val last = points.last()
        
        if (first[0] != last[0] || first[1] != last[1]) {
            points.add(first)
        }

        // Converte a lista para string WKT no formato POLYGON((lng lat, lng lat...))
        val pointsWkt = points.joinToString(", ") { "${it[1]} ${it[0]}" }
        val wkt = "POLYGON(($pointsWkt))"

        val query = entityManager.createNativeQuery(
            """
            UPDATE drivers_profiles 
            SET poligono_atuacao_geo = ST_GeomFromText(:wkt, 4326) 
            WHERE user_id = :userId
            """.trimIndent()
        )
        query.setParameter("wkt", wkt)
        query.setParameter("userId", userId)

        val updatedRows = query.executeUpdate()
        if (updatedRows == 0) {
            throw IllegalArgumentException("Perfil de motorista não encontrado para o usuário.")
        }
        
        logger.info("Polígono de geofencing atualizado para o usuário {}", userId)
    }
}

// ── DTOs de resultado ──

data class CoverageResult(
    val covered: Boolean,
    val address: String,
    val coordinates: GeoCoordinates?,
    val drivers: List<DriverCoverageInfo>,
    val message: String
)

data class DriverCoverageInfo(
    val driverId: UUID,
    val userId: UUID,
    val registroBhtrans: String,
    val valorMensalidadeBase: Double?,
    val veiculoModelo: String?,
    val veiculoCapacidade: Int
)
