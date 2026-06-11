package com.escolarbh.api

import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import org.testcontainers.utility.DockerImageName

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
class EscolarBhApplicationTests {

    companion object {
        @Container
        val postgreSQLContainer = PostgreSQLContainer(DockerImageName.parse("postgis/postgis:16-3.4-alpine"))
            .withDatabaseName("escolarbh_test")
            .withUsername("test")
            .withPassword("test")

        @org.springframework.test.context.DynamicPropertySource
        @JvmStatic
        fun registerDynamicProperties(registry: org.springframework.test.context.DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgreSQLContainer::getJdbcUrl)
            registry.add("spring.datasource.username", postgreSQLContainer::getUsername)
            registry.add("spring.datasource.password", postgreSQLContainer::getPassword)
            registry.add("escolarbh.encryption.master-key") { "q1w2e3r4t5y6u7i8o9p0q1w2e3r4t5y6u7i8o9p0q1w=" }
            registry.add("escolarbh.jwt.secret") { "testing-secret-key-that-is-at-least-32-bytes-long" }
        }
    }

    @Test
    fun contextLoads() {
        // Verifica se o contexto Spring inicializa corretamente com o PostgreSQL + PostGIS via Testcontainers
        assert(postgreSQLContainer.isRunning)
    }
}
