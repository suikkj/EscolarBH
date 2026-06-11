package com.escolarbh.api.config

import jakarta.persistence.EntityManager
import org.aspectj.lang.annotation.Aspect
import org.aspectj.lang.annotation.Before
import org.slf4j.LoggerFactory
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component

/**
 * Aspecto que injeta o ID do usuário logado na sessão atual do PostgreSQL.
 * 
 * Isso é fundamental para:
 * 1. Fazer o Row Level Security (RLS) do Supabase funcionar no Spring Boot.
 * 2. Preencher corretamente as tabelas de auditoria (audit_log) via Triggers do PG.
 * 
 * Utilizamos 'SET LOCAL' para que a variável expire automaticamente no final 
 * da transação atual, evitando vazamento de estado no Connection Pool (HikariCP).
 */
@Aspect
@Component
class AuditInterceptor(
    private val entityManager: EntityManager
) {
    private val logger = LoggerFactory.getLogger(AuditInterceptor::class.java)

    /**
     * Intercepta qualquer método anotado com @Transactional (Spring ou Jakarta)
     * e os métodos dos repositórios do Spring Data JPA.
     */
    @Before("@annotation(org.springframework.transaction.annotation.Transactional) || @annotation(jakarta.transaction.Transactional) || execution(* org.springframework.data.jpa.repository.JpaRepository+.*(..))")
    fun setUserContextInDatabase() {
        val auth = SecurityContextHolder.getContext().authentication
        val userId = if (auth != null && auth.isAuthenticated && auth.principal is String) {
            auth.principal as String
        } else {
            // Em rotas não autenticadas ou webhooks, usa-se UUID zerado
            "00000000-0000-0000-0000-000000000000"
        }

        try {
            // Executa a definição da variável de sessão usando set_config() do PostgreSQL,
            // pois o comando SET nativo não aceita parâmetros ($1). O 'true' indica que é LOCAL (apenas na transaction).
            entityManager.createNativeQuery("SELECT set_config('app.current_user_id', :userId, true)")
                .setParameter("userId", userId)
                .singleResult
        } catch (e: Exception) {
            // Se falhar (ex: SELECT puro sem transaction em alguns dialetos), tenta ignorar
            logger.debug("Não foi possível configurar app.current_user_id (Pode ser read-only context): {}", e.message)
        }
    }
}
