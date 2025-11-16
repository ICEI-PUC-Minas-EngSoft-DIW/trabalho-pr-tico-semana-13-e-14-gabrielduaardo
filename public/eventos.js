// ==========================
// CONFIGURAÇÃO
// ==========================

const URL = "http://localhost:3000";

// Campos do popup
const btnAbrirPopup = document.getElementById("btnAbrirPopup");
const btnFecharPopup = document.getElementById("btnFecharPopup");
const btnSalvarEvento = document.getElementById("btnSalvarEvento");

const popup = document.getElementById("popupEvento");

const selectCidade = document.getElementById("eventoCidade");
const selectAtracao = document.getElementById("eventoAtracao");

const listaEventos = document.getElementById("listaEventos");

// ==========================
// POPUP
// ==========================

btnAbrirPopup.addEventListener("click", () => popup.style.display = "flex");
btnFecharPopup.addEventListener("click", () => popup.style.display = "none");

// ==========================
// CARREGAR CIDADES
// ==========================

async function carregarCidades() {
    const resp = await fetch(`${URL}/lugares`);
    const cidades = await resp.json();

    selectCidade.innerHTML = `<option value="">Selecione...</option>`;

    cidades.forEach(c => {
        const op = document.createElement("option");
        op.value = c.id;
        op.textContent = c.nome;
        selectCidade.appendChild(op);
    });
}

// ==========================
// CARREGAR ATRAÇÕES AO ESCOLHER CIDADE
// ==========================

selectCidade.addEventListener("change", async function () {
    const id = this.value;

    if (!id) {
        selectAtracao.innerHTML = `<option value="">Selecione uma cidade primeiro</option>`;
        return;
    }

    const resp = await fetch(`${URL}/lugares/${id}`);
    const cidade = await resp.json();

    selectAtracao.innerHTML = "";

    if (!cidade.atracoes || cidade.atracoes.length === 0) {
        selectAtracao.innerHTML = `<option value="">Nenhuma atração encontrada</option>`;
        return;
    }

    cidade.atracoes.forEach(a => {
        const op = document.createElement("option");
        op.value = a.id;
        op.textContent = a.nome;
        selectAtracao.appendChild(op);
    });
});

// ==========================
// SALVAR EVENTO
// ==========================

btnSalvarEvento.addEventListener("click", async function () {

    const evento = {
        titulo: document.getElementById("eventoTitulo").value,
        data: document.getElementById("eventoData").value,
        descricaoCurta: document.getElementById("eventoDescricaoCurta").value,
        descricao: document.getElementById("eventoDescricao").value,
        cidadeId: selectCidade.value,
        atracaoId: selectAtracao.value
    };

    if (!evento.titulo || !evento.data || !evento.cidadeId || !evento.atracaoId) {
        alert("Preencha todos os campos!");
        return;
    }

    await fetch(`${URL}/eventos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evento)
    });

    popup.style.display = "none";
    carregarEventos();
});

// ==========================
// LISTAR EVENTOS NA TELA INICIAL
// ==========================

async function carregarEventos() {
    const resp = await fetch(`${URL}/eventos`); // <<< CORRIGIDO
    const eventos = await resp.json();

    const cidades = await fetch(`${URL}/lugares`).then(r => r.json());

    listaEventos.innerHTML = "<h2>Eventos cadastrados</h2>";

    eventos.forEach(e => {

        // Busca cidade
        const cidade = cidades.find(c => c.id == e.cidadeId);
        const nomeCidade = cidade ? cidade.nome : "Cidade não encontrada";

        // Busca atração
        const atracao = cidade?.atracoes?.find(a => a.id == e.atracaoId);
        const nomeAtracao = atracao ? atracao.nome : "Atração não encontrada";

        listaEventos.innerHTML += `
            <div class="card my-3 p-3">
                <h3>${e.titulo}</h3>

                <p><strong>Data:</strong> ${e.data}</p>

                <p><strong>Cidade:</strong> ${nomeCidade}</p>
                <p><strong>Atração:</strong> ${nomeAtracao}</p>

                <p>${e.descricaoCurta}</p>

                <a href="evento.html?id=${e.id}" class="btn btn-primary btn-sm">Ver detalhes</a>
            </div>
        `;
    });
}

// ==========================
// INICIAR
// ==========================

document.addEventListener("DOMContentLoaded", () => {
    carregarCidades();
    carregarEventos();
});
