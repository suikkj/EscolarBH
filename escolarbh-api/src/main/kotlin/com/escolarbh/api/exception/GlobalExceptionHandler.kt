package com.escolarbh.api.exception

import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.context.request.WebRequest
import java.time.OffsetDateTime

/**
 * Interceptador global de exceções para padronizar as respostas de erro da API.
 * Garante que todas as falhas retornem o mesmo formato JSON.
 */
@RestControllerAdvice
class GlobalExceptionHandler {

    private val logger = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)

    /**
     * Tratamento para erros de validação de DTOs (@Valid / @NotBlank, etc).
     */
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationExceptions(
        ex: MethodArgumentNotValidException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        val errors = ex.bindingResult.fieldErrors.map { "${it.field}: ${it.defaultMessage}" }
        val message = "Erro de validação: ${errors.joinToString(", ")}"
        
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message)
    }

    /**
     * Tratamento para validações de regra de negócio customizadas.
     */
    @ExceptionHandler(BusinessValidationException::class)
    fun handleBusinessException(
        ex: BusinessValidationException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "BUSINESS_RULE_VIOLATION", ex.message ?: "Erro de negócio")
    }

    /**
     * Tratamento para recursos não encontrados.
     */
    @ExceptionHandler(ResourceNotFoundException::class)
    fun handleNotFoundException(
        ex: ResourceNotFoundException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        return buildErrorResponse(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", ex.message ?: "Recurso não encontrado")
    }

    /**
     * Tratamento genérico para qualquer outra exceção não mapeada (Evitar stacktrace no client).
     */
    @ExceptionHandler(Exception::class)
    fun handleAllUncaughtException(
        ex: Exception,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        logger.error("Erro interno não tratado", ex)
        return buildErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "INTERNAL_SERVER_ERROR",
            "Ocorreu um erro interno no servidor"
        )
    }

    private fun buildErrorResponse(
        status: HttpStatus,
        code: String,
        message: String
    ): ResponseEntity<ErrorResponse> {
        val response = ErrorResponse(
            error = ErrorDetail(
                code = code,
                message = message,
                timestamp = OffsetDateTime.now()
            )
        )
        return ResponseEntity.status(status).body(response)
    }
}

// ── DTOs de Erro ──

data class ErrorResponse(
    val error: ErrorDetail
)

data class ErrorDetail(
    val code: String,
    val message: String,
    val timestamp: OffsetDateTime
)
