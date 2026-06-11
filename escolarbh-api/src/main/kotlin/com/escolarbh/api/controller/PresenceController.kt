package com.escolarbh.api.controller

import com.escolarbh.api.dto.PresenceRequest
import com.escolarbh.api.dto.PresenceResponse
import com.escolarbh.api.service.PresenceService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/v1/presence")
@CrossOrigin(origins = ["*"]) // Em produção, restringir origens
class PresenceController(
    private val presenceService: PresenceService
) {

    // Em uma aplicação real, o driverId e parentId (responsavelId) seriam extraídos
    // do token JWT/Supabase Auth (via SecurityContextHolder)
    
    @PostMapping
    fun recordPresence(
        @RequestHeader("X-User-Id") driverId: UUID,
        @RequestBody request: PresenceRequest
    ): ResponseEntity<PresenceResponse> {
        val response = presenceService.recordPresence(driverId, request)
        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

    @GetMapping("/student/{studentId}")
    fun getStudentHistory(
        @RequestHeader("X-User-Id") responsavelId: UUID,
        @PathVariable studentId: UUID
    ): ResponseEntity<List<PresenceResponse>> {
        val history = presenceService.getStudentHistory(studentId, responsavelId)
        return ResponseEntity.ok(history)
    }
}
