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

const toast = document.querySelector("#toast");

function showToast(msg, tempo = 2000) {
  toast.textContent = msg;
  toast.hidden = false;
  setTimeout(() => toast.hidden = true, tempo);
}

// ESTADO DA VENDA
let vendaItens = [];

// CARREGAR CLIENTES
async function loadClientes() {
  const r = await fetch(`${API}/clientes`);
  const json = await r.json();

  clienteSelect.innerHTML = json.data
    .map(c => `<option value="${c.id}">${c.nome}</option>`)
    .join("");
}

// CARREGAR ITENS
async function loadItens() {
  const r = await fetch(`${API}/items`);
  const json = await r.json();

  itemSelect.innerHTML = json.data
    .map(i =>
      `<option value="${i.id}" data-preco="${i.preco}">${i.nome}</option>`
    )
    .join("");
}

// ATUALIZAR LISTA E TOTAL
function atualizarLista() {
  itensList.innerHTML = vendaItens
    .map(
      it =>
        `<li>${it.nome} × ${it.quantidade} — R$ ${(it.preco * it.quantidade).toFixed(2)}</li>`
    )
    .join("");

  const total = vendaItens.reduce(
    (soma, it) => soma + it.preco * it.quantidade,
    0
  );

  totalDisplay.textContent = total.toFixed(2);
}

// ADICIONAR ITEM NA VENDA
addItemBtn.onclick = () => {
  const id = itemSelect.value;
  const nome = itemSelect.options[itemSelect.selectedIndex].text;
  const preco = Number(itemSelect.options[itemSelect.selectedIndex].dataset.preco);
  const quantidade = Number(quantidadeInput.value);

  vendaItens.push({ item_id: id, nome, preco, quantidade });

  atualizarLista();
  showToast("Item adicionado!");
};

// FINALIZAR VENDA
finalizarBtn.onclick = async () => {
  if (!clienteSelect.value) {
    showToast("Selecione um cliente.");
    return;
  }
  if (vendaItens.length === 0) {
    showToast("Adicione um item.");
    return;
  }

  const payload = {
    cliente_id: clienteSelect.value,
    itens: vendaItens.map(i => ({
      item_id: i.item_id,
      quantidade: i.quantidade
    }))
  };

  const r = await fetch(`${API}/vendas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!r.ok) {
    showToast("Erro ao finalizar venda.");
    return;
  }

  vendaItens = [];
  atualizarLista();
  loadVendas();
  showToast("Venda registrada!");
};

// LISTAR VENDAS
async function loadVendas() {
  vendasTbody.innerHTML = "<tr><td colspan='5'>Carregando...</td></tr>";

  const r = await fetch(`${API}/vendas`);
  const json = await r.json();

  vendasTbody.innerHTML = json.data
    .map(
      v => `
    <tr>
      <td>${v.id}</td>
      <td>${v.cliente_nome}</td>
      <td>R$ ${v.total.toFixed(2)}</td>
      <td>${new Date(v.criado_em).toLocaleString("pt-BR")}</td>
      <td><button class="danger" data-id="${v.id}">Excluir</button></td>
    </tr>`
    )
    .join("");

  vendasTbody.querySelectorAll("button.danger").forEach(btn => {
    btn.onclick = async () => {
      await fetch(`${API}/vendas/${btn.dataset.id}`, { method: "DELETE" });
      loadVendas();
      showToast("Venda excluída!");
    };
  });
}

// INICIALIZAÇÃO
loadClientes();
loadItens();
loadVendas();