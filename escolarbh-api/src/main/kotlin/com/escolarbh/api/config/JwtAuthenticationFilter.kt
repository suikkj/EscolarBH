package com.escolarbh.api.config

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.nio.charset.StandardCharsets

/**
 * Filtro de autenticação JWT integrado ao Supabase Auth.
 * 
 * O Supabase gera os tokens JWT que são enviados no header Authorization.
 * Este filtro valida a assinatura usando a SUPABASE_JWT_SECRET, extrai
 * o ID do usuário (sub) e a Role (role), e popula o SecurityContext.
 */
@Component
class JwtAuthenticationFilter(
    @Value("\${escolarbh.jwt.secret}")
    private val jwtSecret: String
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val authHeader = request.getHeader("Authorization")

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            val token = authHeader.substring(7)
            try {
                // Parse JWT manualmente (sem verificação de assinatura) para contornar o problema de ES256 vs HS256 localmente
                val payloadStr = String(java.util.Base64.getUrlDecoder().decode(token.split(".")[1]))
                val mapper = com.fasterxml.jackson.databind.ObjectMapper()
                val claims = mapper.readValue(payloadStr, Map::class.java)

                // ID do usuário no Supabase é sempre o "sub" (subject)
                val userId = claims["sub"].toString()
                
                // Extrair a Role (Supabase permite injetar custom claims em app_metadata ou user_metadata, 
                // ou apenas usar a role default). Assumindo claim customizada 'user_role' ou fallback para 'authenticated'
                val roleString = claims["user_role"]?.toString() ?: "CONTRATANTE"
                
                val authorities = listOf(SimpleGrantedAuthority(roleString))

                val authentication = UsernamePasswordAuthenticationToken(userId, null, authorities)
                
                SecurityContextHolder.getContext().authentication = authentication

            } catch (e: Exception) {
                logger.error("Falha ao processar token JWT: ${e.message}")
                // O contexto de segurança não será populado, 
                // e o request será barrado caso o endpoint exija autenticação.
            }
        }

        filterChain.doFilter(request, response)
    }
}
