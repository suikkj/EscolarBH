package com.escolarbh.api.domain.enums

enum class PresenceStatus {
    A_CAMINHO,      // Motorista indo buscar
    EMBARCADO,      // Aluno entrou na van
    DESEMBARCADO,   // Aluno desceu da van (escola ou casa)
    FALTOU          // Aluno não compareceu
}
