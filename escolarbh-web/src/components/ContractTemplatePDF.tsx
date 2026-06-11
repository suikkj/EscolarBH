import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Formato padrão do modelo
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.5,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textDecoration: 'underline'
  },
  section: {
    marginBottom: 10,
  },
  bold: {
    fontWeight: 'bold',
  },
  paragraph: {
    marginBottom: 10,
    textAlign: 'justify',
  },
  signatureContainer: {
    marginTop: 40,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureLine: {
    borderTop: '1px solid black',
    width: '45%',
    textAlign: 'center',
    paddingTop: 5,
  },
  witnessContainer: {
    marginTop: 40,
  },
  witnessLine: {
    borderTop: '1px solid black',
    width: '45%',
    marginTop: 30,
    paddingTop: 5,
  }
});

export interface ContractData {
  contratante: {
    nome: string;
    endereco: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
    telefone: string;
    rg: string;
    cpf: string;
    nascimento: string;
  };
  aluno: {
    nome: string;
    cpf: string;
    nascimento: string;
    escola: string;
    turno: string;
  };
  pagamento: {
    valorInicial: string;
    parcelas: string;
    valorParcela: string;
    vencimentoInicial: string;
    vencimentoFinal: string;
    diaVencimento: string;
    ultimoMesPagamento: string;
  };
}

interface Props {
  data: ContractData;
}

const ContractTemplatePDF: React.FC<Props> = ({ data }) => {
  const dataAtual = new Date();
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const dataFormatada = `${dataAtual.getDate()} de ${meses[dataAtual.getMonth()]} de ${dataAtual.getFullYear()}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TRANSPORTES ESCOLAR</Text>
        
        <View style={styles.section}>
          <Text style={styles.bold}>CONTRATANTE:</Text>
          <Text>Nome: {data.contratante.nome}</Text>
          <Text>Endereço: {data.contratante.endereco}</Text>
          <Text>Bairro: {data.contratante.bairro}   Cidade: {data.contratante.cidade}</Text>
          <Text>UF: {data.contratante.uf}   CEP: {data.contratante.cep}</Text>
          <Text>Telefone: {data.contratante.telefone}   Data de Nascimento: {data.contratante.nascimento}</Text>
          <Text>Identidade: {data.contratante.rg}   CPF: {data.contratante.cpf}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.bold}>CONTRATADO:</Text>
          <Text>Nome: Allyson Stelmo Gomes Sobrinho</Text>
          <Text>Endereço: Av. Augusto Veloso , n° 253</Text>
          <Text>Bairro: Copacabana   Cidade: Belo Horizonte</Text>
          <Text>UF: MG   CEP: 31.550-230   Telefone: (31) 98540-2285</Text>
          <Text>Identidade: M8-055699   CPF: 035.828.726-02</Text>
          <Text>Veículo: Fiat Ducato   Placa: HIM-3056</Text>
        </View>

        <Text style={styles.paragraph}>
          Contrato que fazem entre si as partes acima identificadas para a prestação do serviço de transporte escolar, nos termos e condições a seguir expostas:
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>CLÁUSULA PRIMEIRA</Text> – O CONTRATADO se compromete a prestar os seus serviços profissionais ao CONTRATANTE, referente ao transporte escolar do aluno(a) {data.aluno.nome} (CPF: {data.aluno.cpf}, Nasc: {data.aluno.nascimento}), para a Escola {data.aluno.escola}, no turno da {data.aluno.turno}, sendo contratado o percurso de IDA e VOLTA.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Parágrafo Único:</Text> O serviço contratado consiste no transporte porta a porta sob a condição inicial de retornar o(a) USUÁRIO(A) (da) Escola {data.aluno.escola} à residência localizada no endereço especificado no preâmbulo do presente instrumento.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>CLÁUSULA SEGUNDA:</Text> Fica acordado que o serviço será prestado durante o calendário letivo normal da Escola/Colégio de 2ª a 6ª feira, excluindo-se os sábados e eventuais dias de provas especiais (recuperações) e excetuando-se os domingos e feriados.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Parágrafo Primeiro:</Text> Ocorrendo o término das aulas antes do horário normal o transporte poderá ser antecipado, desde que o fato ocorra simultaneamente com todos os usuários do veículo.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Parágrafo Segundo:</Text> Havendo simultaneamente alteração no horário de início das aulas de todos os usuários do transporte, o horário de ida poderá ser alterado, dentro das possibilidades do CONTRATADO.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Parágrafo Terceiro:</Text> CONTRATANTE E CONTRATADO se comprometem a comunicar uma eventual ausência e/ou atraso a fim de evitar uma espera desnecessária, sendo a tolerância máxima de atraso de 3 (três) minutos na saída/retorno.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>CLÁUSULA TERCEIRA:</Text> O veículo do CONTRATADO, obrigatoriamente, está equipado de cinto de segurança, IPVA e seguro obrigatório em dia, além do condutor ser credenciado pelo DETRAN/MG, com cursos e autorização específica, para dirigir veículos de transporte escolar e carteira de motorista profissional categoria "D" com idade superior a 21 (vinte e um) anos.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Parágrafo Único:</Text> O CONTRATADO se obriga a transportar com responsabilidade e segurança o USUÁRIO, zelando pela manutenção, conservação, higiene e conforto do veículo, sujeitando-se o mesmo às penalidades das Leis Cíveis, Criminal e do Código de Trânsito Brasileiro.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>CLÁUSULA QUARTA:</Text> O presente contrato terá validade para o ano 2026 e poderá ser renovado para o ano seguinte, mediante assinatura de novo contrato, se houver interesse das partes.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>CLÁUSULA QUINTA:</Text> O valor inicial do presente contrato é de R$ {data.pagamento.valorInicial} podendo ser dividido em {data.pagamento.parcelas} parcelas mensais de R$ {data.pagamento.valorParcela}, vencíveis de {data.pagamento.vencimentoInicial} a {data.pagamento.vencimentoFinal}.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Parágrafo Primeiro:</Text> O(A) CONTRATANTE, neste ato declara optar pelo pagamento em {data.pagamento.parcelas} parcelas iguais de R$ {data.pagamento.valorParcela}. O pagamento será efetuado diretamente ao CONTRATADO ou através de Depósito Bancário, a ser fornecido ao CONTRATANTE.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Parágrafo Segundo:</Text> As parcelas vencerão no dia {data.pagamento.diaVencimento} de cada mês, sendo que a última parcela poderá ser paga em {data.pagamento.ultimoMesPagamento} de 2026, quando o(a) CONTRATANTE receberá pela total quitação deste contrato.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Parágrafo Terceiro:</Text> Em caso de atraso, incidirão multa de R$3,00 sobre o valor da parcela e juros moratórios de R$ 1,00 ao dia, podendo ocorrer ainda, a suspensão imediata da prestação de serviço em 7 dias.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Parágrafo Quarto:</Text> Havendo recessos, greves ou mesmo que o(a) USUÁRIO falte, a parcela deverá que ser paga normalmente.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Parágrafo Quinto:</Text> As parcelas mensais poderão ser reajustadas nos meses de julho e janeiro, conforme o percentual acumulado no aumento dos combustíveis.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>CLÁUSULA SEXTA:</Text> Este contrato é válido a partir da data de sua assinatura até o término do ano letivo de 2026, podendo ser rescindido a qualquer tempo, por qualquer uma das partes, com aviso prévio, por escrito, de 30 (trinta) dias.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Parágrafo Primeiro:</Text> As partes aqui compactuadas, CONTRATANTE e CONTRATADO, que promover a rescisão deste contrato, pagará à outra parte, à título de multa rescisória, 10% (dez por cento), sobre o saldo restante a pagar do contrato.
        </Text>

        <Text style={styles.paragraph}>
          Por estarem justos e contratados, firmam o presente em duas vias de igual teor e forma, elegendo o Foro da Comarca de Belo Horizonte – MG, para dirimir quaisquer questões a respeito desse contrato.
        </Text>

        <Text style={{ textAlign: 'center', marginTop: 30, marginBottom: 20 }}>
          Belo Horizonte, {dataFormatada}
        </Text>

        <View style={styles.signatureContainer}>
          <View style={styles.signatureLine}>
            <Text>CONTRATANTE</Text>
            <Text style={{ fontSize: 8, marginTop: 4 }}>Assinado Eletronicamente</Text>
            <Text style={{ fontSize: 8 }}>CPF: {data.contratante.cpf}</Text>
          </View>
          <View style={styles.signatureLine}>
            <Text>CONTRATADO</Text>
            <Text style={{ fontSize: 8, marginTop: 4 }}>Allyson Stelmo Gomes Sobrinho</Text>
          </View>
        </View>

        <View style={styles.witnessContainer}>
          <Text style={styles.bold}>TESTEMUNHAS</Text>
          <View style={styles.signatureContainer}>
            <View style={styles.witnessLine}>
              <Text>Nome completo:</Text>
              <Text>Doc. Identidade:</Text>
            </View>
            <View style={styles.witnessLine}>
              <Text>Nome completo:</Text>
              <Text>Doc. Identidade:</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ContractTemplatePDF;
