// =========================================================================
// CONFIGURAÇÃO DA API E VARIÁVEIS GLOBAIS
// =========================================================================

const API_BASE_URL = 'http://localhost:3000/lugares';
let lugarAtual = null; // Armazena os dados do lugar principal

// Elementos do DOM (inicializados no carregamento)
let detalheItemContainer;
let listaAtracoesContainer;
let formAtracao;
let inputImagemFile;
let inputImagemData;
let imgPreview;
let modalAtracao; 

// =========================================================================
// FUNÇÕES AUXILIARES
// =========================================================================

/**
 * Pega um parâmetro específico da URL (ex: id=123)
 * @param {string} param - Nome do parâmetro
 * @returns {string | null}
 */
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * Cria o HTML de erro quando o item não é encontrado ou há falha na API.
 * @param {string} title - Título do erro
 * @param {string} message - Mensagem detalhada
 * @param {string} type - Tipo de erro (danger/info)
 * @returns {string} HTML do erro.
 */
function criarHTMLMensagem(title, message, type = 'danger') {
    return `
        <div class="col-12 text-center p-5 border rounded shadow-lg bg-${type === 'danger' ? 'danger' : 'info'} text-white">
            <h2 class="text-white">${title}</h2>
            <p>${message}</p>
            <a href="index.html" class="btn btn-secondary mt-3">Voltar para a Home</a>
        </div>
    `;
}

/**
 * Converte um arquivo de imagem em Base64
 * @param {File} file - Arquivo de imagem
 * @returns {Promise<string>} String Base64 da imagem
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve('');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// =========================================================================
// REQUISIÇÕES DA API (CRUD)
// =========================================================================

/**
 * GET - Busca os detalhes de um lugar pelo ID.
 */
async function buscarDetalhesDoLugar(id) {
    try {
        const resposta = await fetch(`${API_BASE_URL}/${id}`);
        
        if (resposta.status === 404) {
             detalheItemContainer.innerHTML = criarHTMLMensagem("Item não encontrado!", `O ID ${id} não corresponde a nenhuma cidade cadastrada.`, 'info');
             return null;
        }

        if (!resposta.ok) {
            throw new Error(`Erro na API: ${resposta.status} ${resposta.statusText}`);
        }

        const item = await resposta.json();
        return item;

    } catch (error) {
        console.error("Erro ao buscar detalhes do lugar:", error);
        detalheItemContainer.innerHTML = criarHTMLMensagem(
            "Falha na Comunicação com a API!",
            `Verifique se o seu JSON Server está rodando (comando: <strong>json-server --watch db.json</strong>). Detalhes: ${error.message}`
        );
        return null;
    }
}

/**
 * DELETE - Exclui o lugar principal (cidade)
 */
async function excluirLugarPrincipal(id) {
    try {
        const resposta = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE',
        });

        if (!resposta.ok) {
            throw new Error(`Falha ao excluir o lugar: ${resposta.status}`);
        }

        console.log(`Lugar ID ${id} excluído com sucesso. Redirecionando...`);
        // Se a exclusão foi bem-sucedida, redireciona para a página inicial
        window.location.href = 'index.html';

    } catch (error) {
        console.error("Erro ao excluir lugar:", error);
        alert(`Não foi possível excluir o lugar. Erro: ${error.message}`);
    }
}


/**
 * POST/PUT (PATCH) - Salva as alterações na lista de atrações do lugar principal.
 */
async function salvarAlteracoesNoLugar(dadosAtualizados) {
    try {
        const id = lugarAtual.id;
        console.log(`Tentando salvar alterações no Lugar ID ${id}...`, dadosAtualizados);
        const resposta = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PATCH', // Usamos PATCH para enviar apenas os dados que mudaram
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosAtualizados)
        });

        if (!resposta.ok) {
            throw new Error(`Falha ao salvar as alterações: ${resposta.status} ${resposta.statusText}`);
        }

        // Recarrega os dados e a renderização
        const lugarAtualizado = await resposta.json();
        lugarAtual = lugarAtualizado;
        renderizarDetalhes(lugarAtual); 
        console.log("Alterações salvas com sucesso!");
        return true;

    } catch (error) {
        console.error("ERRO CRÍTICO AO SALVAR ALTERAÇÕES:", error);
        // Feedback para o usuário ver no console que a operação falhou
        console.warn("Atenção: A alteração não foi salva. Verifique se o JSON Server (porta 3000) está ativo.");
        return false;
    }
}


// =========================================================================
// LÓGICA DE RENDERIZAÇÃO E EVENTOS
// =========================================================================

/**
 * Renderiza o HTML das informações gerais do Lugar.
 */
function renderizarDetalhes(item) {
    
    // --- 1. SEÇÃO INFORMAÇÕES GERAIS ---
    const infoGeraisHTML = `
        <section class="mb-5 p-4 border rounded shadow-sm bg-light">
            <h2 class="titulo-secao text-start mb-4 border-bottom pb-2">${item.nome}</h2>
            <div class="row align-items-start">
                <div class="col-md-5 mb-4 mb-md-0">
                    <img src="${item.imagem_pincipal}" class="img-fluid rounded shadow" alt="Imagem principal de ${item.nome}" onerror="this.onerror=null; this.src='https://placehold.co/500x300/ccc/333?text=Sem+Imagem'">
                </div>
                <div class="col-md-7">
                    <h3 class="fs-4 text-primary">${item.descricao}</h3>
                    <p class="lead">${item.conteudo}</p>
                    <ul class="list-group list-group-flush mt-4">
                        <li class="list-group-item"><i class="fas fa-map-marker-alt me-2 text-info"></i> <strong>Estado:</strong> ${item.estado}</li>
                        <li class="list-group-item"><i class="fas fa-calendar-day me-2 text-danger"></i> <strong>Ano de Fundação:</strong> ${item.fundacao}</li>
                        <li class="list-group-item"><i class="fas fa-sun me-2 text-warning"></i> <strong>Clima Predominante:</strong> ${item.clima}</li>
                        <li class="list-group-item"><i class="fas fa-landmark me-2 text-success"></i> <strong>Reconhecimento:</strong> ${item.patrimonio}</li>
                        <li class="list-group-item"><i class="fas fa-star me-2 text-primary"></i> <strong>Ponto de Destaque:</strong> ${item.destaque_cultural}</li>
                    </ul>
                </div>
            </div>
        </section>
    `;
    detalheItemContainer.innerHTML = infoGeraisHTML;

    // --- 2. HABILITA BOTÕES DE CRUD PRINCIPAL ---
    const btnEditarLugar = document.getElementById('btn-editar-lugar');
    const btnExcluirLugar = document.getElementById('btn-excluir-lugar');
    const lugarNomeExcluir = document.getElementById('lugar-nome-excluir');

    if (btnEditarLugar && btnExcluirLugar && lugarNomeExcluir) {
        btnEditarLugar.classList.remove('d-none');
        btnExcluirLugar.classList.remove('d-none');
        lugarNomeExcluir.textContent = item.nome;
    
        // Configura o link de edição
        btnEditarLugar.onclick = () => {
             // Redireciona para o formulário no modo edição
             window.location.href = `formulario.html?id=${item.id}`; 
        };
    }
    
    // --- 3. RENDERIZA ATRAÇÕES ---
    renderizarAtracoes(item.atracoes);
}

/**
 * Renderiza o HTML da lista de atrações (pontos turísticos)
 */
function renderizarAtracoes(atracoes) {
    listaAtracoesContainer.innerHTML = ''; // Limpa antes de renderizar

    if (!atracoes || atracoes.length === 0) {
        listaAtracoesContainer.innerHTML = `<div class="col-12"><p class="text-center text-muted">Nenhuma atração vinculada. Utilize o botão "Adicionar Atração" para começar.</p></div>`;
        return;
    }

    atracoes.forEach(atracao => {
        // Usa a imagem Base64 ou a URL local
        const imagemSrc = atracao.imagem || 'https://placehold.co/300x200/ccc/333?text=Sem+Imagem';
        
        // CORREÇÃO: Passamos apenas o ID, eliminando o risco de erro de JSON/Base64
        const html = `
            <div class="col" data-atracao-id="${atracao.id}">
                <div class="card h-100 shadow-sm text-center">
                    <img src="${imagemSrc}" class="card-img-top img-atracao" alt="Foto da atração ${atracao.nome}" onerror="this.onerror=null; this.src='https://placehold.co/300x200/ccc/333?text=Imagem'">
                    <div class="card-body">
                        <h4 class="card-title fs-5">${atracao.nome}</h4>
                        <p class="card-text small text-muted">${atracao.descricao}</p>
                    </div>
                    <div class="card-footer d-flex justify-content-around">
                        <button class="btn btn-sm btn-info btn-editar-atracao" 
                                data-atracao-id="${atracao.id}" data-bs-toggle="modal" data-bs-target="#modalAtracaoForm">
                            <i class="fas fa-pen"></i> Editar
                        </button>
                        <button class="btn btn-sm btn-danger btn-excluir-atracao" data-atracao-id="${atracao.id}">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                </div>
            </div>
        `;
        listaAtracoesContainer.insertAdjacentHTML('beforeend', html);
    });

    // Adiciona event listeners nos botões de CRUD das atrações
    listaAtracoesContainer.querySelectorAll('.btn-editar-atracao').forEach(btn => {
        btn.addEventListener('click', preencherFormularioEdicao);
    });
    listaAtracoesContainer.querySelectorAll('.btn-excluir-atracao').forEach(btn => {
        btn.addEventListener('click', confirmarExclusaoAtracao);
    });
}

// =========================================================================
// EVENT HANDLERS (AÇÕES DO USUÁRIO)
// =========================================================================

/**
 * Lida com o evento de seleção de arquivo para gerar a preview e Base64
 */
function handleFileChange() {
    const file = this.files[0];
    if (file) {
        fileToBase64(file).then(base64 => {
            imgPreview.src = base64;
            inputImagemData.value = base64;
        }).catch(error => {
            console.error("Erro ao converter arquivo para Base64:", error);
            imgPreview.src = 'https://placehold.co/150x100/ccc/333?text=Erro';
            inputImagemData.value = '';
        });
    } else {
        // Limpa se nenhum arquivo for selecionado
        imgPreview.src = 'https://placehold.co/150x100/ccc/333?text=Preview';
        inputImagemData.value = '';
    }
}


/**
 * Prepara o formulário para criação (POST)
 */
function preencherFormularioCriacao() {
    document.getElementById('modalAtracaoFormLabel').textContent = 'Adicionar Nova Atração';
    formAtracao.reset(); // Limpa o formulário
    formAtracao.classList.remove('was-validated'); // Remove validação antiga
    document.getElementById('atracao-id').value = ''; // Garante que é uma operação POST
    
    // Reseta preview e Base64
    imgPreview.src = 'https://placehold.co/150x100/ccc/333?text=Preview';
    inputImagemData.value = '';
    inputImagemFile.value = '';
}


/**
 * Preenche o formulário para edição (PUT/PATCH)
 */
function preencherFormularioEdicao(event) {
    // CORREÇÃO AQUI: Obtemos o ID do atributo e buscamos o objeto na memória
    const atracaoId = parseInt(event.currentTarget.getAttribute('data-atracao-id'));
    const atracao = lugarAtual.atracoes.find(a => a.id === atracaoId);

    if (!atracao) {
        console.error(`Atração com ID ${atracaoId} não encontrada em lugarAtual.`);
        alert("Erro: Atração não encontrada. Não é possível editar.");
        return;
    }

    document.getElementById('modalAtracaoFormLabel').textContent = `Editar: ${atracao.nome}`;
    document.getElementById('atracao-id').value = atracao.id;
    document.getElementById('atracao-nome').value = atracao.nome;
    document.getElementById('atracao-descricao').value = atracao.descricao;
    
    // Preenche o campo escondido com o Base64/URL existente
    inputImagemData.value = atracao.imagem || '';
    
    // Configura a preview da imagem
    const imagemSrc = atracao.imagem || 'https://placehold.co/150x100/ccc/333?text=Preview';
    imgPreview.src = imagemSrc;
    
    // Limpa o input de arquivo (para não enviar o arquivo antigo se o usuário não selecionar um novo)
    inputImagemFile.value = ''; 
    formAtracao.classList.remove('was-validated'); 
    
    // Já que o botão tem data-bs-toggle="modal", o modal é aberto automaticamente.
    // Se não estivesse, usaríamos: modalAtracao.show();
}

/**
 * Confirmação para exclusão de uma atração (DELETE)
 */
function confirmarExclusaoAtracao(event) {
    const atracaoId = parseInt(event.currentTarget.getAttribute('data-atracao-id'));
    const atracaoNome = lugarAtual.atracoes.find(a => a.id === atracaoId)?.nome || `ID ${atracaoId}`;

    if (confirm(`Tem certeza de que deseja excluir a atração: "${atracaoNome}"?`)) {
        deletarAtracao(atracaoId);
    }
}

/**
 * Lida com o submit do formulário de atração (Criação ou Edição)
 */
async function handleFormSubmit(event) {
    event.preventDefault();

    // 1. Validação
    if (!formAtracao.checkValidity()) {
        formAtracao.classList.add('was-validated');
        console.warn("Formulário inválido. Preencha todos os campos obrigatórios.");
        return;
    }
    
    formAtracao.classList.remove('was-validated');

    // 2. Coleta de dados
    const id = document.getElementById('atracao-id').value;
    const nome = document.getElementById('atracao-nome').value;
    const descricao = document.getElementById('atracao-descricao').value;
    const imagem = inputImagemData.value; 

    const atracaoData = { nome, descricao, imagem };

    // 3. Execução da Ação
    let sucesso = false;
    if (id) {
        // Modo Edição (PUT/PATCH)
        sucesso = await editarAtracao(parseInt(id), atracaoData);
    } else {
        // Modo Criação (POST)
        sucesso = await adicionarNovaAtracao(atracaoData);
    }
    
    // 4. Fechar modal (somente se a API retornar sucesso)
    if (sucesso) {
        modalAtracao.hide();
    }
}


/**
 * DELETE - Executa a exclusão de uma atração aninhada.
 */
async function deletarAtracao(id) {
    const atracoes = lugarAtual.atracoes.filter(a => a.id !== id);
    const sucesso = await salvarAlteracoesNoLugar({ atracoes });

    if (sucesso) {
        console.log("Atração excluída com sucesso!");
    }
    return sucesso;
}

/**
 * POST - Executa a adição de uma nova atração aninhada.
 */
async function adicionarNovaAtracao(novaAtracao) {
    // Gera um novo ID simples (o JSON Server faria isso, mas como estamos no sub-array, fazemos no front)
    const novoId = lugarAtual.atracoes.length > 0 
        ? Math.max(...lugarAtual.atracoes.map(a => a.id)) + 1 
        : 1;

    const atracaoComId = { ...novaAtracao, id: novoId };
    
    const novasAtracoes = [...lugarAtual.atracoes, atracaoComId];
    
    const sucesso = await salvarAlteracoesNoLugar({ atracoes: novasAtracoes });
    
    if (sucesso) {
        console.log("Nova atração adicionada com sucesso!");
    }
    return sucesso;
}

/**
 * PUT/PATCH - Executa a edição de uma atração aninhada.
 */
async function editarAtracao(id, dadosEditados) {
    const novasAtracoes = lugarAtual.atracoes.map(atracao => 
        atracao.id === id ? { ...atracao, ...dadosEditados, id } : atracao
    );

    const sucesso = await salvarAlteracoesNoLugar({ atracoes: novasAtracoes });
    
    if (sucesso) {
        console.log("Atração editada com sucesso!");
    }
    return sucesso;
}


// =========================================================================
// INICIALIZAÇÃO E SETUP
// =========================================================================

/**
 * Inicializa as variáveis do DOM e listeners.
 */
function setupEventListeners() {
    detalheItemContainer = document.getElementById("detalhe-item");
    listaAtracoesContainer = document.getElementById("lista-atracoes");
    formAtracao = document.getElementById('form-atracao');
    inputImagemFile = document.getElementById('atracao-imagem-file');
    inputImagemData = document.getElementById('atracao-imagem-data');
    imgPreview = document.getElementById('atracao-imagem-preview');
    // Inicializa o modal
    const modalElement = document.getElementById('modalAtracaoForm');
    if (modalElement && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        modalAtracao = new bootstrap.Modal(modalElement);
    } else {
        // Isso pode ocorrer se o script carregar antes do Bootstrap ou HTML.
        console.error("Erro: Bootstrap Modal ou modalElement não encontrado.");
        return;
    }


    if (formAtracao) {
        // Listener principal de submissão do formulário
        formAtracao.addEventListener('submit', handleFormSubmit);

        // Listener para o botão de criação
        const btnAdicionarAtracao = document.getElementById('btn-adicionar-atracao');
        if (btnAdicionarAtracao) {
            btnAdicionarAtracao.addEventListener('click', preencherFormularioCriacao);
        }

        // Listener para o input de arquivo (Base64)
        if (inputImagemFile) {
            inputImagemFile.addEventListener('change', handleFileChange);
        }
        
    } else {
        console.error("Erro: Formulário de Atração (form-atracao) não encontrado.");
    }
}


/**
 * Função principal que inicia tudo
 */
async function init() {
    // 1. Configura listeners e variáveis do DOM
    setupEventListeners();

    // 2. Lógica de carregamento de dados
    const id = getQueryParam("id");

    if (id) {
        // Se o ID existir na URL, busca o lugar
        lugarAtual = await buscarDetalhesDoLugar(id);
        if (lugarAtual) {
            renderizarDetalhes(lugarAtual);
            
            // Adiciona listener para a exclusão do lugar principal
            const btnConfirmarExclusao = document.getElementById('confirmar-exclusao-lugar');
            if (btnConfirmarExclusao) {
                btnConfirmarExclusao.addEventListener('click', () => {
                    excluirLugarPrincipal(lugarAtual.id);
                });
            }
        }
    } else {
        // Se o ID NÃO existir, mostra a mensagem de erro
        detalheItemContainer.innerHTML = criarHTMLMensagem(
            "ID Faltando!",
            "O ID do lugar não foi especificado na URL (ex: detalhes.html?id=1). Por favor, utilize um link válido da página inicial."
        );
    }
}

// Inicia a aplicação após o carregamento completo do DOM
window.addEventListener('load', () => {
    // Garante que o script só rode na página correta
    if (window.location.pathname.includes("detalhes.html")) {
        init();
    }
});
