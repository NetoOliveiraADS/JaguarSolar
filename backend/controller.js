import { database } from "./database.js";
import { PropostaRepositorio } from "./repository.js";

const repositorioProposta = new PropostaRepositorio(database);

export async function obterDashboard(req, res) {
  const metricas = await repositorioProposta.obterMetricasDashboard();
  if (metricas.erro) return res.status(500).json(metricas.erro);
  res.status(200).json(metricas);
}

export async function apagarProposta(req, res) {
  const { id } = req.params;
  const sucesso = await repositorioProposta.deletarProposta(id);
  
  if (sucesso.erro) return res.status(500).json(sucesso.erro);
  if (!sucesso) return res.status(404).json({ erro: "Proposta não encontrada." });
  
  res.status(200).json({ mensagem: "Excluída com sucesso." });
}

export async function atualizarStatusVisita(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  
  const visita = await repositorioProposta.atualizarStatusVisita(id, status);
  if (visita?.erro) return res.status(500).json(visita.erro);
  
  res.status(200).json(visita);
}

export async function remarcarVisita(req, res) {
  const { id } = req.params;
  const { dataVisita } = req.body;
  
  if (!dataVisita) return res.status(400).json({ erro: "A nova data é obrigatória." });

  try {
    const visita = await repositorioProposta.atualizarDataVisita(id, dataVisita);
    if (visita?.erro) return res.status(500).json(visita.erro);
    
    res.status(200).json(visita);
  } catch (error) {
    res.status(500).json({ erro: "Erro interno ao remarcar a vistoria." });
  }
}

export async function listarPropostas(req, res) {
  const resultadoBanco = await repositorioProposta.obterPropostas();
  if (resultadoBanco.erro) return res.status(500).json(resultadoBanco.erro);

  const listaFormatada = resultadoBanco.map(linha => ({
    idProposta: linha.idProposta,
    qtdPaineis: linha.qtdPaineis,
    geracaoAnualKwh: Number(linha.geracaoAnualKwh),
    valorEstimado: Number(linha.valorEstimado),
    dataCriacao: linha.dataCriacao,
    visita: linha.idVisita ? { id: linha.idVisita, data: linha.dataVisita, status: linha.statusVisita } : null,
    cliente: {
      idCliente: linha.idCliente,
      nome: linha.nomeCliente,
      email: linha.emailCliente
    }
  }));

  res.status(200).json(listaFormatada);
}

export async function gerarProposta(req, res) {
  const { nome, email, consumoMensalKwh } = req.body;

  try {
    const clientes = await repositorioProposta.obterClientePorEmail(email);
    if (clientes.erro) return res.status(500).json(clientes.erro);

    let idCliente;
    let nomeCliente = nome;

    if (clientes.length > 0) {
      idCliente = clientes[0].id_cliente;
      nomeCliente = clientes[0].nome;
    } else {
      const novoCliente = await repositorioProposta.criarCliente(nome, email, consumoMensalKwh);
      if (novoCliente.erro) return res.status(500).json(novoCliente.erro);
      idCliente = novoCliente.id_cliente;
    }

    const geracaoAnualKwh = consumoMensalKwh * 12;
    const qtdPaineis = Math.floor(geracaoAnualKwh / 500) + 1;
    const valorEstimado = qtdPaineis * 1500.0;

    const novaProposta = await repositorioProposta.criarProposta(idCliente, qtdPaineis, geracaoAnualKwh, valorEstimado);
    if (novaProposta.erro) return res.status(500).json(novaProposta.erro);

    res.status(201).json({
      idProposta: novaProposta.id_proposta,
      qtdPaineis,
      geracaoAnualKwh,
      valorEstimado,
      dataCriacao: novaProposta.data_criacao,
      cliente: { idCliente, nome: nomeCliente, email, consumoMensalKwh }
    });
  } catch (error) {
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
}

export async function agendarVisita(req, res) {
  const { idProposta, dataVisita } = req.body;
  if (!idProposta || !dataVisita) return res.status(400).json({ erro: "Dados insuficientes para o agendamento." });

  try {
    const novaVisita = await repositorioProposta.criarVisita(idProposta, dataVisita);
    if (novaVisita.erro) return res.status(500).json(novaVisita.erro);
    res.status(201).json(novaVisita);
  } catch (error) {
    res.status(500).json({ erro: "Erro interno no servidor." });
  }
}