package com.escolarbh.api

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling
import jakarta.annotation.PostConstruct
import java.util.TimeZone

/**
 * Ponto de entrada da API EscolarBH.
 *
 * Plataforma SaaS de gestão de transporte escolar para Belo Horizonte.
 * Timezone padrão: UTC (conversão para America/Sao_Paulo no frontend).
 */
@SpringBootApplication
@EnableScheduling
class EscolarBhApplication {

    @PostConstruct
    fun init() {
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"))
    }
}

fun main(args: Array<String>) {
    runApplication<EscolarBhApplication>(*args)
}
