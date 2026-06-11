package com.escolarbh.api.repository

import com.escolarbh.api.domain.enums.ContractStatus
import com.escolarbh.api.domain.model.Contract
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface ContractRepository : JpaRepository<Contract, UUID> {
    fun findByResponsavelId(responsavelId: UUID): List<Contract>
    fun findByDriverId(driverId: UUID): List<Contract>
    fun findByAssinaturaToken(token: String): Contract?
    fun findByResponsavelIdAndStatus(responsavelId: UUID, status: ContractStatus): List<Contract>
    fun findByDriverIdAndStatus(driverId: UUID, status: ContractStatus): List<Contract>
}
