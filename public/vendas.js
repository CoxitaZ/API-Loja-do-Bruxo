const API = window.API_BASE_URL;

// ELEMENTOS
const clienteSelect = document.querySelector("#clienteSelect");
const itemSelect = document.querySelector("#itemSelect");
const quantidadeInput = document.querySelector("#quantidadeInput");
const itensList = document.querySelector("#itensList");
const totalDisplay = document.querySelector("#totalDisplay");
const addItemBtn = document.querySelector("#addItemBtn");
const finalizarBtn = document.querySelector("#finalizarBtn");
const vendasTbody = document.querySelector("#vendasTbody");

const buscarCliente = document.querySelector("#buscarCliente");
const buscarProduto = document.querySelector("#buscarProduto");

const toast = document.querySelector("#toast");

function showToast(msg, tempo = 2000) {
  toast.textContent = msg;
  toast.hidden = false;
  setTimeout(() => (toast.hidden = true), tempo);
}

// ESTADOS
let vendaItens = [];
let clientesCache = [];
let itensCache = [];

/* ===========================
      CARREGAR CLIENTES
=========================== */
async function loadClientes() {
  const r = await fetch(`${API}/clientes`);
  const json = await r.json();

  clientesCache = json.data;
  renderClientes("");
}

function renderClientes(filtro) {
  const filtrados = clientesCache.filter((c) =>
    c.nome.toLowerCase().includes(filtro.toLowerCase())
  );

  clienteSelect.innerHTML = filtrados
    .map((c) => `<option value="${c.id}">${c.nome}</option>`)
    .join("");
}

buscarCliente.oninput = () => {
  renderClientes(buscarCliente.value);
};

/* ===========================
        CARREGAR ITENS
=========================== */
async function loadItens() {
  const r = await fetch(`${API}/items`);
  const json = await r.json();

  itensCache = json.data;
  renderItens("");
}

function renderItens(filtro) {
  const filtrados = itensCache.filter((i) =>
    i.nome.toLowerCase().includes(filtro.toLowerCase())
  );

  itemSelect.innerHTML = filtrados
    .map(
      (i) =>
        `<option value="${i.id}" data-preco="${i.preco}">${i.nome}</option>`
    )
    .join("");
}

buscarProduto.oninput = () => {
  renderItens(buscarProduto.value);
};

/* ===========================
       LISTA DO CARRINHO
=========================== */
function atualizarLista() {
  itensList.innerHTML = vendaItens
    .map(
      (it) =>
        `<li>${it.nome} × ${it.quantidade} — R$ ${(it.preco * it.quantidade).toFixed(
          2
        )}</li>`
    )
    .join("");

  const total = vendaItens.reduce(
    (soma, it) => soma + it.preco * it.quantidade,
    0
  );

  totalDisplay.textContent = total.toFixed(2);
}

/* ===========================
    ADICIONAR ITEM AO CARRINHO
=========================== */
addItemBtn.onclick = async () => {
  const id = itemSelect.value;
  const option = itemSelect.options[itemSelect.selectedIndex];

  const nome = option.textContent;
  const preco = Number(option.dataset.preco);
  const quantidade = Number(quantidadeInput.value);

  // buscar estoque real
  const r = await fetch(`${API}/items/${id}`);
  const json = await r.json();
  const estoque = json.data.estoque;

  if (quantidade > estoque) {
    showToast(`Estoque insuficiente. Disponível: ${estoque}`);
    return;
  }

  vendaItens.push({ item_id: id, nome, preco, quantidade });
  atualizarLista();
  showToast("Item adicionado!");
};

/* ===========================
         FINALIZAR VENDA
=========================== */
finalizarBtn.onclick = async () => {
  if (!clienteSelect.value) {
    showToast("Selecione um cliente.");
    return;
  }
  if (vendaItens.length === 0) {
    showToast("Adicione ao menos 1 item.");
    return;
  }

  const payload = {
    cliente_id: clienteSelect.value,
    itens: vendaItens.map((i) => ({
      item_id: i.item_id,
      quantidade: i.quantidade,
    })),
  };

  const r = await fetch(`${API}/vendas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const resposta = await r.json().catch(() => ({}));

  if (!r.ok) {
    showToast(resposta.error?.message || "Erro ao finalizar venda.");
    return;
  }

  vendaItens = [];
  atualizarLista();
  loadVendas();
  showToast("Venda registrada!");
};

/* ===========================
         LISTAR VENDAS
=========================== */
async function loadVendas() {
  vendasTbody.innerHTML =
    "<tr><td colspan='5'>Carregando...</td></tr>";

  const r = await fetch(`${API}/vendas`);
  const json = await r.json();

  vendasTbody.innerHTML = json.data
    .map(
      (v) => `
    <tr>
      <td>${v.id}</td>
      <td>${v.cliente_nome}</td>
      <td>R$ ${v.total.toFixed(2)}</td>
      <td>${new Date(v.criado_em).toLocaleString("pt-BR")}</td>
      <td><button class="danger" data-id="${v.id}">Excluir</button></td>
    </tr>`
    )
    .join("");

  // excluir venda
  vendasTbody.querySelectorAll("button.danger").forEach((btn) => {
    btn.onclick = async () => {
      await fetch(`${API}/vendas/${btn.dataset.id}`, {
        method: "DELETE",
      });
      loadVendas();
      showToast("Venda excluída!");
    };
  });
}

/* ===========================
        INICIALIZAÇÃO
=========================== */
loadClientes();
loadItens();
loadVendas();