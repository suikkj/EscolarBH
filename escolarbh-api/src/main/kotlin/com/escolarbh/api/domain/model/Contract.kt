package com.escolarbh.api.domain.model

import com.escolarbh.api.domain.enums.ContractStatus
import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.net.InetAddress
import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.UUID

/**
 * Entidade Contract — mapeia a tabela 'contracts'.
 *
 * Contrato eletrônico entre pai/responsável e motorista escolar.
 * Inclui evidências de assinatura digital para validade jurídica
 * conforme MP 2200-2 (IP, User-Agent, timestamp).
 */
@Entity
@Table(name = "contracts")
class Contract(

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @Column(name = "responsavel_id", nullable = false)
    val responsavelId: UUID,

    @Column(name = "driver_id", nullable = false)
    val driverId: UUID,

    // ── Status e vigência ──
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: ContractStatus = ContractStatus.RASCUNHO,

    @Column(name = "vigencia_inicio")
    var vigenciaInicio: LocalDate? = null,

    @Column(name = "vigencia_fim")
    var vigenciaFim: LocalDate? = null,

    // ── Documento ──
    @Column(name = "pdf_url", columnDefinition = "TEXT")
    var pdfUrl: String? = null,

    @Column(name = "pdf_storage_path", length = 500)
    var pdfStoragePath: String? = null,

    // ── Evidências de assinatura eletrônica ──
    @Column(name = "assinatura_token")
    var assinaturaToken: String? = null,

    @Column(name = "ip_assinatura", columnDefinition = "INET")
    var ipAssinatura: String? = null,

    @Column(name = "user_agent", columnDefinition = "TEXT")
    var userAgent: String? = null,

    @Column(name = "assinado_em")
    var assinadoEm: OffsetDateTime? = null,

    // ── Termos ──
    @Column(name = "versao_termos", nullable = false, length = 20)
    var versaoTermos: String = "1.0",

    @Column(name = "hash_termos", length = 64)
    var hashTermos: String? = null,

    // ── Alunos vinculados ──
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "alunos_ids", columnDefinition = "UUID[]")
    var alunosIds: Array<UUID> = emptyArray(),

    // ── Timestamps ──
    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    val criadoEm: OffsetDateTime? = null,

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    val atualizadoEm: OffsetDateTime? = null
) {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsavel_id", insertable = false, updatable = false)
    val responsavel: User? = null

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", insertable = false, updatable = false)
    val driver: DriverProfile? = null
}
