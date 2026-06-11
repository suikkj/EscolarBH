package com.escolarbh.api.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

/**
 * Configuração de segurança do Spring Security.
 *
 * Estratégia:
 * - JWT stateless (sem sessão no servidor)
 * - BCrypt para hashing de senhas
 * - CORS configurado para frontend web e mobile
 * - Endpoints de webhook e health são públicos
 * - Todos os demais endpoints requerem autenticação
 * - @PreAuthorize para controle de acesso por role
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
class SecurityConfig(
    @Value("\${escolarbh.cors.allowed-origins}")
    private val allowedOrigins: List<String>,

    @Value("\${escolarbh.cors.allowed-methods}")
    private val allowedMethods: String,

    @Value("\${escolarbh.cors.max-age}")
    private val maxAge: Long,
    
    private val jwtAuthenticationFilter: JwtAuthenticationFilter
) {

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            // Desabilita CSRF (API stateless com JWT)
            .csrf { it.disable() }

            // CORS
            .cors { it.configurationSource(corsConfigurationSource()) }

            // Sessão stateless
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }

            // Autorização de endpoints
            .authorizeHttpRequests { auth ->
                auth
                    // Endpoints públicos
                    .requestMatchers("/v1/auth/**").permitAll()
                    .requestMatchers("/v1/webhooks/**").permitAll()  // Webhooks do Asaas/ZapSign
                    .requestMatchers("/actuator/health").permitAll()
                    .requestMatchers("/actuator/info").permitAll()

                    // Geofencing: requer autenticação (qualquer role)
                    .requestMatchers("/v1/coverage/**").authenticated()

                    // Endpoints de motorista
                    .requestMatchers(org.springframework.http.HttpMethod.PUT, "/v1/drivers/**").hasAuthority("MOTORISTA")
                    .requestMatchers(org.springframework.http.HttpMethod.PATCH, "/v1/drivers/**").hasAuthority("MOTORISTA")

                    // Admin only
                    .requestMatchers("/v1/admin/**").hasAuthority("ADMIN")

                    // Todos os demais requerem autenticação
                    .anyRequest().authenticated()
            }

            // Desabilita login form (API REST pura)
            .formLogin { it.disable() }
            .httpBasic { it.disable() }

            // Adiciona nosso filtro JWT antes do filtro de username/password
            .addFilterBefore(jwtAuthenticationFilter, org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter::class.java)

        return http.build()
    }

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder(12)

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration().apply {
            allowedOrigins = this@SecurityConfig.allowedOrigins
            allowedMethods = this@SecurityConfig.allowedMethods.split(",")
            allowedHeaders = listOf("*")
            allowCredentials = true
            maxAge = this@SecurityConfig.maxAge
            exposedHeaders = listOf("Authorization", "X-Request-Id")
        }

        return UrlBasedCorsConfigurationSource().apply {
            registerCorsConfiguration("/**", configuration)
        }
    }
}
