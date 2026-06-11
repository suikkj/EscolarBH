package com.escolarbh.api.exception

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus

/**
 * Exceção base para erros de negócio.
 * Retorna HTTP 400 Bad Request.
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
class BusinessValidationException(message: String) : RuntimeException(message)

/**
 * Exceção para recursos não encontrados.
 * Retorna HTTP 404 Not Found.
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
class ResourceNotFoundException(message: String) : RuntimeException(message)

/**
 * Exceção para erros de integração com APIs externas (ex: Asaas, ZapSign, Google Maps).
 * Retorna HTTP 502 Bad Gateway.
 */
@ResponseStatus(HttpStatus.BAD_GATEWAY)
class ExternalIntegrationException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)
