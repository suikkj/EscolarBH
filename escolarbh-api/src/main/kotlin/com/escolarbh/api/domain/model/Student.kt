package com.escolarbh.api.domain.model

import com.escolarbh.api.domain.enums.Turno
import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import org.locationtech.jts.geom.Point
import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.UUID

/**
 * Entidade Student — mapeia a tabela 'students'.
 *
 * LGPD Art. 14: Dados de menores de idade.
 * Os campos com sufixo _enc são criptografados em nível de aplicação
 * via FieldEncryptionService (AES-256-GCM) antes de serem persistidos.
 *
 * O campo 'primeiroNome' é o único dado textual visível ao motorista
 * (princípio de minimização de dados).
 */
@Entity
@Table(name = "students")
class Student(

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @Column(name = "responsavel_id", nullable = false)
    val responsavelId: UUID,

    // ── Campos criptografados (AES-256-GCM) ──
    // Armazenados como TEXT (Base64 do ciphertext)
    @Column(name = "nome_completo_enc", nullable = false, columnDefinition = "TEXT")
    var nomeCompletoEnc: String,

    @Column(name = "cpf_enc", columnDefinition = "TEXT")
    var cpfEnc: String? = null,

    @Column(name = "restricoes_medicas_enc", columnDefinition = "TEXT")
    var restricoesMedicasEnc: String? = null,

    // ── Campos em texto plano (para queries e exibição limitada) ──
    @Column(name = "primeiro_nome", nullable = false, length = 100)
    var primeiroNome: String,

    @Column(name = "data_nascimento", nullable = false)
    var dataNascimento: LocalDate,

    @Column(name = "escola_nome")
    var escolaNome: String? = null,

    @Column(name = "escola_endereco", columnDefinition = "TEXT")
    var escolaEndereco: String? = null,

    // ── Geolocalização do ponto de busca ──
    @Column(name = "ponto_busca_geo", columnDefinition = "GEOMETRY(POINT, 4326)")
    var pontoBuscaGeo: Point? = null,

    @Column(name = "ponto_busca_endereco", columnDefinition = "TEXT")
    var pontoBuscaEndereco: String? = null,

    // ── Logística de Rota ──
    @Enumerated(EnumType.STRING)
    @Column(name = "turno")
    var turno: Turno? = Turno.MANHA,

    @Column(name = "ordem_rota")
    var ordemRota: Int? = null,

    // ── LGPD metadata ──
    @Column(name = "consentimento_id")
    var consentimentoId: UUID? = null,

    @Column(name = "dados_anonimizados", nullable = false)
    var dadosAnonimizados: Boolean = false,

    // ── Timestamps ──
    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    val criadoEm: OffsetDateTime? = null,

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    val atualizadoEm: OffsetDateTime? = null
) {
    // Relacionamento com User (pai/responsável) — lazy para performance
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsavel_id", insertable = false, updatable = false)
    val responsavel: User? = null
}
