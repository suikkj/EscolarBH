package com.escolarbh.api.repository

import com.escolarbh.api.domain.model.DriverProfile
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface DriverProfileRepository : JpaRepository<DriverProfile, UUID> {
    fun findByUserId(userId: UUID): DriverProfile?
    fun findByRegistroBhtrans(registroBhtrans: String): DriverProfile?
}
