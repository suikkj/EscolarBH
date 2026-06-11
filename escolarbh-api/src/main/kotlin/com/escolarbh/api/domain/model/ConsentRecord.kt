package com.escolarbh.api.domain.model

import com.escolarbh.api.domain.enums.ConsentAction
import com.escolarbh.api.domain.enums.ConsentType
import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.UUID

/**
 * Entidade ConsentRecord — mapeia a tabela 'consent_records'.
 *
 * LGPD Art. 14: Registro granular de consentimentos para
 * tratamento de dados de menores de idade.
 *
 * IMUTÁVEL (append-only): nunca alterar ou deletar registros.
 * A revogação é registrada como um novo registro com acao = REVOGADO.
 */
@Entity
@Table(name = "consent_records")
class ConsentRecord(

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @Column(name = "responsavel_id", nullable = false)
    val responsavelId: UUID,

    @Column(name = "student_id")
    val studentId: UUID? = null,

    // ── Tipo e ação ──
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_consentimento", nullable = false)
    val tipoConsentimento: ConsentType,

    @Enumerated(EnumType.STRING)
    @Column(name = "acao", nullable = false)
    val acao: ConsentAction,

    // ── Finalidade (LGPD Art. 6, I) ──
    @Column(name = "finalidade_tratamento", nullable = false, columnDefinition = "TEXT")
    val finalidadeTratamento: String,

    // ── Evidências eletrônicas ──
    @Column(name = "ip_origem", nullable = false, columnDefinition = "INET")
    val ipOrigem: String,

    @Column(name = "user_agent", columnDefinition = "TEXT")
    val userAgent: String? = null,

    @Column(name = "dispositivo", length = 100)
    val dispositivo: String? = null,

    // ── Versão da política ──
    @Column(name = "versao_politica_privacidade", nullable = false, length = 20)
    val versaoPoliticaPrivacidade: String = "1.0",

    @Column(name = "hash_politica", length = 64)
    val hashPolitica: String? = null,

    // ── Validade ──
    @Column(name = "valido_ate")
    val validoAte: LocalDate? = null,

    @Column(name = "revogado_em")
    val revogadoEm: OffsetDateTime? = null,

    @Column(name = "motivo_revogacao", columnDefinition = "TEXT")
    val motivoRevogacao: String? = null,

    // ── Timestamp ──
    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    val criadoEm: OffsetDateTime? = null
)
