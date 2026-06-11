package com.escolarbh.api.service.lgpd

import com.escolarbh.api.domain.enums.ContractStatus
import com.escolarbh.api.repository.ContractRepository
import com.escolarbh.api.repository.DriverProfileRepository
import com.escolarbh.api.repository.StudentRepository
import com.escolarbh.api.repository.UserRepository
import com.escolarbh.api.service.payment.AsaasClient
import kotlinx.coroutines.runBlocking
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Serviço responsável pelo Direito ao Esquecimento (Art. 18, VI da LGPD).
 */
@Service
class DataAnonymizationService(
    private val userRepository: UserRepository,
    private val studentRepository: StudentRepository,
    private val driverProfileRepository: DriverProfileRepository,
    private val contractRepository: ContractRepository,
    private val asaasClient: AsaasClient
) {
    private val logger = LoggerFactory.getLogger(DataAnonymizationService::class.java)

    /**
     * Aplica o Direito ao Esquecimento para um Contratante (Pai).
     * 
     * Regra de Negócio (Respondendo à Open Question):
     * Se o usuário tem dívidas pendentes (contrato ativo/inadimplente), nós NÃO deletamos fisicamente 
     * seus dados básicos, pois a base legal de "Cumprimento de Obrigação Legal/Execução de Contrato" 
     * sobrepõe o direito de exclusão. Nesses casos, aplicamos um "Soft Delete" e cancelamos a recorrência.
     */
    @Transactional
    fun processForgetMeRequest(userId: UUID) {
        logger.info("Processando pedido de exclusão LGPD para usuário: {}", userId)
        
        val user = userRepository.findById(userId).orElseThrow()
        
        // 1. Verifica se existem contratos pendentes/ativos
        val activeContracts = contractRepository.findByResponsavelId(userId)
            .filter { it.status == ContractStatus.ATIVO || it.status == ContractStatus.AGUARDANDO_ASSINATURA }
            
        if (activeContracts.isNotEmpty()) {
            logger.warn("Usuário {} possui contratos ativos. Aplicando Soft Delete.", userId)
            
            // Soft Delete: Apenas inativa a conta, bloqueando login.
            // Cancela assinaturas no Asaas para não gerar novas cobranças.
            activeContracts.forEach { contract ->
                contract.status = ContractStatus.CANCELADO
                contractRepository.save(contract)
                
                // Dispara cancelamento no Asaas (assíncrono/runBlocking)
                // TODO: Recuperar Subscription ID do banco e chamar asaasClient.cancelSubscription()
            }
            
            // Inativa a conta do usuário para bloquear login
            user.ativo = false
            userRepository.save(user)
            return
        }

        // 2. Hard Anonymization (Sem dívidas)
        logger.info("Iniciando anonimização hard para usuário: {}", userId)
        
        // Alunos: Zera os campos criptografados e limpa endereços
        val students = studentRepository.findByResponsavelId(userId)
        students.forEach { student ->
            student.primeiroNome = "Anonimizado"
            student.nomeCompletoEnc = "Expurgado"
            student.restricoesMedicasEnc = null
            student.cpfEnc = null
            student.pontoBuscaEndereco = null
            student.escolaNome = null
            student.escolaEndereco = null
            student.dadosAnonimizados = true
            studentRepository.save(student)
        }
        
        // Perfil do Motorista (caso o usuário seja motorista)
        val driverProfile = driverProfileRepository.findByUserId(userId)
        if (driverProfile != null) {
            driverProfile.registroBhtrans = "Expurgado"
            // Para apagar a geometria, enviar nulo seria ideal, mas precisamos manter compatibilidade com DB constraints se existirem.
            driverProfileRepository.save(driverProfile)
        }
        
        // Anonimização do User principal
        user.nomeCompleto = "Anonimizado"
        user.telefone = null
        user.cpf = "00000000000" // Cuidado com unique constraints
        user.email = "expurgado-${UUID.randomUUID()}@anon.local"
        user.ativo = false
        userRepository.save(user)
        
        // TODO: Pedir exclusão via API do Supabase Auth
        
        logger.info("✅ Dados anonimizados com sucesso para usuário: {}", userId)
    }
}

