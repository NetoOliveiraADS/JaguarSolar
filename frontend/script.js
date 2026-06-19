const PROPOSTAS = 'http://localhost:8080/api/propostas';
const VISITAS = 'http://localhost:8080/api/visitas';
const DASHBOARD = 'http://localhost:8080/api/dashboard';

let idPropostaAtual = null;
const dataLocal = new Date();
const ano = dataLocal.getFullYear();
const mes = String(dataLocal.getMonth() + 1).padStart(2, '0');
const dia = String(dataLocal.getDate()).padStart(2, '0');
const dataMinima = `${ano}-${mes}-${dia}`;

function exibirNotificacao(mensagem, tipo = 'success') {
    const conteiner = document.getElementById('toast-container');
    const notificacao = document.createElement('div');
    notificacao.className = `toast ${tipo}`;
    const icone = tipo === 'success' ? 'ph-check-circle' : 'ph-warning-circle';
    
    notificacao.innerHTML = `<i class="ph-fill ${icone}"></i> <span>${mensagem}</span>`;
    conteiner.appendChild(notificacao);

    setTimeout(() => {
        notificacao.style.animation = 'fadeOut 0.4s forwards';
        setTimeout(() => notificacao.remove(), 400);
    }, 4000);
}

document.getElementById('formularioSolar').addEventListener('submit', async function(evento) {
    evento.preventDefault();
    const botao = document.getElementById('botaoEnviar');
    const indicadorCarregamento = document.getElementById('carregandoBotao');
    
    botao.disabled = true;
    document.getElementById('textoBotao').style.display = 'none';
    indicadorCarregamento.style.display = 'block';

    const dadosFormulario = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        consumoMensalKwh: parseFloat(document.getElementById('consumo').value)
    };

    try {
        const resposta = await fetch(PROPOSTAS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosFormulario)
        });

        if (resposta.ok) {
            const proposta = await resposta.json();
            idPropostaAtual = proposta.idProposta; 
            document.getElementById('estadoVazio').style.display = 'none';
            mostrarBlocoResultados(proposta);
            carregarDadosGerais();
            document.getElementById('formularioSolar').reset();
            exibirNotificacao('Proposta comercial gerada e salva com sucesso!', 'success');
        } else {
            exibirNotificacao('Erro ao processar dados. Verifique os campos informados.', 'error');
        }
    } catch(erro) {
        exibirNotificacao('Falha crônica de conexão com o servidor local.', 'error');
    } finally {
        botao.disabled = false;
        document.getElementById('textoBotao').style.display = 'block';
        indicadorCarregamento.style.display = 'none';
    }
});

function mostrarBlocoResultados(proposta) {
    document.getElementById('resumoTexto').innerHTML = `
        A infraestrutura recomendada para o cliente <strong style="color: var(--brand-dark);">${proposta.cliente.nome}</strong> exigirá <strong style="color: var(--brand-dark);">${proposta.qtdPaineis} módulos fotovoltaicos</strong>.<br>
        O investimento total projetado é de <strong style="color: var(--brand-orange); font-size: 1.2rem;">${proposta.valorEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>.
    `;
    
    document.getElementById('dataVistoria').value = '';
    document.getElementById('dataVistoria').min = dataMinima;
    document.getElementById('botaoAgendar').disabled = false;
    document.getElementById('botaoAgendar').innerHTML = 'Confirmar Agendamento';
    document.getElementById('resultadoDestaque').style.display = 'block';
}

document.getElementById('botaoAgendar').addEventListener('click', async () => {
    const dataSelecionada = document.getElementById('dataVistoria').value;
    const botao = document.getElementById('botaoAgendar');

    if (!dataSelecionada) {
        exibirNotificacao('Por favor, informe uma data válida no calendário.', 'error');
        return;
    }
    if (dataSelecionada < dataMinima) {
        exibirNotificacao('A data da vistoria não pode ser anterior a hoje.', 'error');
        return;
    }

    botao.disabled = true;

    try {
        const resposta = await fetch(VISITAS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idProposta: idPropostaAtual, dataVisita: dataSelecionada })
        });
        if (resposta.ok) {
            exibirNotificacao('Vistoria técnica agendada com sucesso!', 'success');
            carregarDadosGerais();
        }
    } catch(erro) { botao.disabled = false; exibirNotificacao('Erro ao registrar agendamento.', 'error'); }
});

async function carregarDadosGerais() {
    try {
        const respostaMétricas = await fetch(DASHBOARD);
        const metricas = await respostaMétricas.json();
        
        document.getElementById('dashClientes').innerText = metricas.totalClientes;
        document.getElementById('dashVolume').innerText = metricas.volumeProjetado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
        document.getElementById('dashVisitas').innerText = metricas.vistoriasPendentes;
    } catch(erro) {}

    try {
        const respostaTabela = await fetch(PROPOSTAS);
        const propostas = await respostaTabela.json();
        const corpoTabela = document.getElementById('corpoTabelaPropostas');
        corpoTabela.innerHTML = '';

        propostas.forEach(prop => {
            const linhaTabela = document.createElement('tr');
            let htmlVisita = '';

            if (prop.visita) {
                const dataOriginalIso = prop.visita.data.split('T')[0];
                const [ano, mes, dia] = dataOriginalIso.split('-');
                const dataFormatadaBR = `${dia}/${mes}/${ano}`;

                if (prop.visita.status === 'Pendente') {
                    htmlVisita = `
                        <div id="bloco-visualizacao-${prop.visita.id}">
                            <div style="font-size:0.85rem; font-weight:700; color:var(--brand-orange)"><i class="ph ph-clock"></i> Pendente: ${dataFormatadaBR}</div>
                            <div style="margin-top:8px; display:flex; gap:6px;">
                                <button onclick="atualizarStatusVistoria(${prop.visita.id}, 'Realizada')" style="background:var(--success); color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:0.75rem; transition: 0.2s;" title="Concluir Vistoria"><i class="ph ph-check"></i></button>
                                <button onclick="alternarModoEdicao(${prop.visita.id}, true)" style="background:var(--brand-blue); color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:0.75rem; transition: 0.2s;" title="Remarcar Vistoria"><i class="ph ph-pencil"></i></button>
                            </div>
                        </div>
                        
                        <div id="bloco-edicao-${prop.visita.id}" style="display:none; margin-top:5px; flex-direction:column; gap:6px;">
                            <input type="date" id="campo-data-${prop.visita.id}" value="${dataOriginalIso}" min="${dataMinima}" style="padding:6px; border-radius:6px; border:2px solid rgba(249,115,22,0.4); font-size:0.8rem; outline: none;">
                            <div style="display:flex; gap:6px;">
                                <button onclick="salvarAlteracaoData(${prop.visita.id})" style="background:var(--brand-orange); color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:0.75rem; font-weight: 600;">Salvar</button>
                                <button onclick="alternarModoEdicao(${prop.visita.id}, false)" style="background:#f1f5f9; color:#475569; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:0.75rem; font-weight: 600;">Cancelar</button>
                            </div>
                        </div>
                    `;
                } else {
                    htmlVisita = `
                        <div style="font-size:0.85rem; font-weight:700; color:var(--success)"><i class="ph ph-check-circle"></i> Vistoria Realizada</div>
                        <div style="font-size:0.75rem; color:var(--text-secondary)">Concluída em ${dataFormatadaBR}</div>
                    `;
                }
            } else {
                htmlVisita = `
                    <div id="bloco-cadastro-visita-${prop.idProposta}">
                        <span style="color:var(--text-secondary); font-size:0.8rem; display:block; margin-bottom: 6px;"><i class="ph ph-warning-circle"></i> Sem Vistoria</span>
                        <button onclick="alternarModoCadastroTabela(${prop.idProposta}, true)" style="background:var(--brand-orange); color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:0.75rem; font-weight: 600; transition: 0.2s; box-shadow: 0 3px 8px rgba(249,115,22,0.3);"><i class="ph ph-calendar-plus"></i> Agendar</button>
                    </div>
                    <div id="bloco-formulario-tabela-${prop.idProposta}" style="display:none; margin-top:5px; flex-direction:column; gap:6px;">
                        <input type="date" id="campo-novo-agendamento-${prop.idProposta}" min="${dataMinima}" style="padding:6px; border-radius:6px; border:2px solid rgba(249,115,22,0.4); font-size:0.8rem; outline: none;">
                        <div style="display:flex; gap:6px;">
                            <button onclick="salvarNovoAgendamentoDireto(${prop.idProposta})" style="background:var(--brand-orange); color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:0.75rem; font-weight: 600;">Salvar</button>
                            <button onclick="alternarModoCadastroTabela(${prop.idProposta}, false)" style="background:#f1f5f9; color:#475569; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:0.75rem; font-weight: 600;">X</button>
                        </div>
                    </div>
                `;
            }

            linhaTabela.innerHTML = `
                <td style="color: var(--brand-blue); font-weight: 600;">#${prop.idProposta.toString().padStart(4, '0')}</td>
                <td><strong style="color:var(--brand-dark)">${prop.cliente.nome}</strong><br><small style="color:var(--text-secondary)">${prop.cliente.email}</small></td>
                <td><strong style="color:var(--brand-orange); font-size: 1.05rem;">${prop.valorEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong><br><small style="color:var(--text-secondary)">${prop.qtdPaineis} módulos</small></td>
                <td style="min-width: 170px;">${htmlVisita}</td>
                <td style="text-align: center;">
                    <button onclick="removerRegistroProposta(${prop.idProposta})" style="background:rgba(239, 68, 68, 0.1); color:#ef4444; border:none; width:36px; height:36px; border-radius:8px; cursor:pointer; transition:0.2s;" onmouseover="this.style.background='#ef4444'; this.style.color='white'" onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'; this.style.color='#ef4444'" title="Excluir Proposta">
                        <i class="ph ph-trash" style="font-size:1.2rem"></i>
                    </button>
                </td>
            `;
            corpoTabela.appendChild(linhaTabela);
        });
    } catch(erro) {}
}

document.getElementById('campoPesquisa').addEventListener('input', function(evento) {
    const termoPesquisado = evento.target.value.toLowerCase();
    const linhasTabela = document.querySelectorAll('#corpoTabelaPropostas tr');
    linhasTabela.forEach(linha => {
        const nomeCliente = linha.querySelector('td:nth-child(2) strong').textContent.toLowerCase();
        linha.style.display = nomeCliente.includes(termoPesquisado) ? '' : 'none';
    });
});

async function removerRegistroProposta(id) {
    if(!confirm("Atenção profissional: Confirmar a exclusão irrevogável desta proposta e de todos os seus cronogramas vinculados?")) return;
    try {
        await fetch(`${PROPOSTAS}/${id}`, { method: 'DELETE' });
        exibirNotificacao('Proposta comercial removida do banco de dados.', 'success');
        carregarDadosGerais();
    } catch(erro) { exibirNotificacao('Erro operacional ao excluir o registro.', 'error'); }
}

async function atualizarStatusVistoria(idVisita, novoStatus) {
    try {
        await fetch(`${VISITAS}/${idVisita}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus })
        });
        exibirNotificacao('Status de vistoria consolidado!', 'success');
        carregarDadosGerais();
    } catch(erro) { exibirNotificacao('Erro ao processar alteração de status.', 'error'); }
}

function alternarModoEdicao(idVisita, abrir) {
    document.getElementById(`bloco-visualizacao-${idVisita}`).style.display = abrir ? 'none' : 'block';
    document.getElementById(`bloco-edicao-${idVisita}`).style.display = abrir ? 'flex' : 'none';
}

async function salvarAlteracaoData(idVisita) {
    const novaDataAlvo = document.getElementById(`campo-data-${idVisita}`).value;
    if(!novaDataAlvo) return;

    if (novaDataAlvo < dataMinima) {
        exibirNotificacao('A nova data não pode ser anterior a hoje.', 'error');
        return;
    }

    try {
        await fetch(`${VISITAS}/${idVisita}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataVisita: novaDataAlvo }) });
        exibirNotificacao('Agendamento remarcado com sucesso.', 'success');
        carregarDadosGerais(); 
    } catch(erro) { exibirNotificacao('Erro técnico ao adiar data.', 'error'); }
}

function alternarModoCadastroTabela(idProposta, abrir) {
    document.getElementById(`bloco-cadastro-visita-${idProposta}`).style.display = abrir ? 'none' : 'block';
    document.getElementById(`bloco-formulario-tabela-${idProposta}`).style.display = abrir ? 'flex' : 'none';
}

async function salvarNovoAgendamentoDireto(idProposta) {
    const dataVistoriaTabela = document.getElementById(`campo-novo-agendamento-${idProposta}`).value;
    if(!dataVistoriaTabela) 
        return;

    if (dataVistoriaTabela < dataMinima) {
        exibirNotificacao('A data da vistoria não pode ser anterior a hoje.', 'error');
        return;
    }
    
    try {
        await fetch(URL_VISITAS, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idProposta, dataVisita: dataVistoriaTabela }) });
        exibirNotificacao('Vistoria técnica agendada via CRM.', 'success');
        carregarDadosGerais(); 
    } catch(erro) { exibirNotificacao('Erro operacional ao agendar.', 'error'); }
}

window.onload = carregarDadosGerais;