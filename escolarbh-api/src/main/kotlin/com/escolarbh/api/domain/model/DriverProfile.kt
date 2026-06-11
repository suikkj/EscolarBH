package com.escolarbh.api.domain.model

import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import org.locationtech.jts.geom.Polygon
import java.math.BigDecimal
import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.UUID

/**
 * Entidade DriverProfile — mapeia a tabela 'drivers_profiles'.
 *
 * O campo poligonoAtuacaoGeo armazena o polígono PostGIS da área
 * de atendimento do motorista. Usado com ST_Contains para verificar
 * se o endereço de um aluno está dentro da área de cobertura.
 */
@Entity
@Table(name = "drivers_profiles")
class DriverProfile(

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @Column(name = "user_id", nullable = false, unique = true)
    val userId: UUID,

    // ── Dados profissionais (BHTRANS) ──
    @Column(name = "registro_bhtrans", nullable = false, unique = true, length = 50)
    var registroBhtrans: String,

    @Column(name = "cnh_categoria", nullable = false, length = 5)
    var cnhCategoria: String,

    @Column(name = "cnh_validade", nullable = false)
    var cnhValidade: LocalDate,

    // ── Veículo ──
    @Column(name = "veiculo_placa", length = 10)
    var veiculoPlaca: String? = null,

    @Column(name = "veiculo_modelo", length = 100)
    var veiculoModelo: String? = null,

    @Column(name = "veiculo_ano")
    var veiculoAno: Int? = null,

    @Column(name = "veiculo_capacidade")
    var veiculoCapacidade: Int = 15,

    // ── Área de atuação (PostGIS Polygon) ──
    @Column(name = "poligono_atuacao_geo", columnDefinition = "GEOMETRY(POLYGON, 4326)")
    var poligonoAtuacaoGeo: Polygon? = null,

    // ── Configurações de negócio ──
    @Column(name = "valor_mensalidade_base", precision = 10, scale = 2)
    var valorMensalidadeBase: BigDecimal? = null,

    @Column(name = "aceita_novos_clientes", nullable = false)
    var aceitaNovosClientes: Boolean = true,

    // ── Status ──
    @Column(name = "ativo", nullable = false)
    var ativo: Boolean = true,

    @Column(name = "verificado", nullable = false)
    var verificado: Boolean = false,

    // ── Timestamps ──
    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    val criadoEm: OffsetDateTime? = null,

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    val atualizadoEm: OffsetDateTime? = null
) {
    // Relacionamento com User
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    val user: User? = null
}
