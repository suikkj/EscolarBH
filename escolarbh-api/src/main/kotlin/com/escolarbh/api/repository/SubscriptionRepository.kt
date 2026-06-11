package com.escolarbh.api.repository

import com.escolarbh.api.domain.model.Subscription
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface SubscriptionRepository : JpaRepository<Subscription, UUID> {
    fun findByContractId(contractId: UUID): Subscription?
    fun findByGatewaySubscriptionId(gatewaySubscriptionId: String): Subscription?
}
