package com.escolarbh.api.domain.model

import com.escolarbh.api.domain.enums.UserRole
import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import java.time.OffsetDateTime
import java.util.UUID

/**
 * Entidade User — mapeia a tabela 'users'.
 * Representa pais (CONTRATANTE), motoristas (MOTORISTA) e admins (ADMIN).
 */
@Entity
@Table(name = "users")
class User(

    @Id
    val id: UUID? = null,

    @Column(name = "nome_completo", nullable = false)
    var nomeCompleto: String,

    @Column(name = "email", nullable = false, unique = true)
    var email: String,

    @Column(name = "senha_hash", nullable = false)
    var senhaHash: String,

    @Column(name = "cpf", nullable = false, unique = true, length = 14)
    var cpf: String,

    @Column(name = "telefone", length = 20)
    var telefone: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    var role: UserRole = UserRole.CONTRATANTE,

    @Column(name = "ativo", nullable = false)
    var ativo: Boolean = true,

    @Column(name = "email_verificado", nullable = false)
    var emailVerificado: Boolean = false,

    @Column(name = "ultimo_login")
    var ultimoLogin: OffsetDateTime? = null,

    @Column(name = "push_token")
    var pushToken: String? = null,

    @Column(name = "cep", length = 9)
    var cep: String? = null,

    @Column(name = "estado", length = 2)
    var estado: String? = null,

    @Column(name = "cidade", length = 100)
    var cidade: String? = null,

    @Column(name = "rua", length = 255)
    var rua: String? = null,

    @Column(name = "numero", length = 20)
    var numero: String? = null,

    @Column(name = "complemento", length = 100)
    var complemento: String? = null,

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    val criadoEm: OffsetDateTime? = null,

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    val atualizadoEm: OffsetDateTime? = null
)
