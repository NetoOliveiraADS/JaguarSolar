import { database } from "./database.js";

export class PropostaRepositorio {
  constructor(bancoDados) {
    this.bancoDados = bancoDados;
  }

  async obterMetricasDashboard() {
    try {
      const consultaClientes = await this.bancoDados.query("SELECT COUNT(*) as total FROM cliente");
      const consultaVolume = await this.bancoDados.query("SELECT COALESCE(SUM(valor_estimado), 0) as volume FROM proposta_solar");
      const consultaVisitas = await this.bancoDados.query("SELECT COUNT(*) as pendentes FROM visita_tecnica WHERE status = 'Pendente'");
      
      return {
        totalClientes: parseInt(consultaClientes.rows[0].total),
        volumeProjetado: parseFloat(consultaVolume.rows[0].volume),
        vistoriasPendentes: parseInt(consultaVisitas.rows[0].pendentes)
      };
    } catch (erro) {
      return { erro: erro.message };
    }
  }

  async obterPropostas() {
    try {
      const sql = `
        SELECT 
          p.id_proposta as "idProposta",
          p.qtd_paineis as "qtdPaineis",
          p.geracao_anual_kwh as "geracaoAnualKwh",
          p.valor_estimado as "valorEstimado",
          p.data_criacao as "dataCriacao",
          c.id_cliente as "idCliente",
          c.nome as "nomeCliente",
          c.email as "emailCliente",
          v.id_visita as "idVisita",
          v.data_visita as "dataVisita",
          v.status as "statusVisita"
        FROM proposta_solar p
        JOIN cliente c ON p.id_cliente = c.id_cliente
        LEFT JOIN visita_tecnica v ON p.id_proposta = v.id_proposta
        ORDER BY p.id_proposta DESC
      `;
      const resultado = await this.bancoDados.query(sql);
      return resultado.rows;
    } catch (erro) {
      return { erro: erro.message };
    }
  }

  async deletarProposta(id) {
    try {
      const sql = "DELETE FROM proposta_solar WHERE id_proposta = $1 RETURNING id_proposta";
      const resultado = await this.bancoDados.query(sql, [id]);
      return resultado.rows.length > 0;
    } catch (erro) {
      return { erro: erro.message };
    }
  }

  async obterClientePorEmail(email) {
    try {
      const sql = "SELECT * FROM cliente WHERE email = $1";
      const resultado = await this.bancoDados.query(sql, [email]);
      return resultado.rows;
    } catch (erro) { return { erro: erro.message }; }
  }

  async criarCliente(nome, email, consumoMensalKwh) {
    try {
      const sql = "INSERT INTO cliente (nome, email, consumo_mensal_kwh) VALUES ($1, $2, $3) RETURNING id_cliente";
      const resultado = await this.bancoDados.query(sql, [nome, email, consumoMensalKwh]);
      return resultado.rows[0];
    } catch (erro) { return { erro: erro.message }; }
  }

  async criarProposta(idCliente, qtdPaineis, geracaoAnualKwh, valorEstimado) {
    try {
      const sql = "INSERT INTO proposta_solar (id_cliente, qtd_paineis, geracao_anual_kwh, valor_estimado) VALUES ($1, $2, $3, $4) RETURNING id_proposta, data_criacao";
      const resultado = await this.bancoDados.query(sql, [idCliente, qtdPaineis, geracaoAnualKwh, valorEstimado]);
      return resultado.rows[0];
    } catch (erro) { return { erro: erro.message }; }
  }

  async criarVisita(idProposta, dataVisita) {
    try {
      const sql = "INSERT INTO visita_tecnica (id_proposta, data_visita) VALUES ($1, $2) RETURNING *";
      const resultado = await this.bancoDados.query(sql, [idProposta, dataVisita]);
      return resultado.rows[0];
    } catch (erro) { return { erro: erro.message }; }
  }

  async atualizarStatusVisita(idVisita, status) {
    try {
      const sql = "UPDATE visita_tecnica SET status = $1 WHERE id_visita = $2 RETURNING *";
      const resultado = await this.bancoDados.query(sql, [status, idVisita]);
      return resultado.rows[0];
    } catch (erro) { return { erro: erro.message }; }
  }

  async atualizarDataVisita(idVisita, novaData) {
    try {
      const sql = "UPDATE visita_tecnica SET data_visita = $1 WHERE id_visita = $2 RETURNING *";
      const resultado = await this.bancoDados.query(sql, [novaData, idVisita]);
      return resultado.rows[0];
    } catch (erro) { return { erro: erro.message }; }
  }
}