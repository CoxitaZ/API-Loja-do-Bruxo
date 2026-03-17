const API = window.API_BASE_URL;

// Estado
let state = {
  page: 1,
  limit: 10,
  q: "",
  totalPages: 1
};

const qs = sel => document.querySelector(sel);

// Elementos
const tbody = qs("#clientesTbody");
const pageInfo = qs("#pageInfo");
const prevBtn = qs("#prevPageBtn");
const nextBtn = qs("#nextPageBtn");
const searchInput = qs("#searchInput");
const filterBtn = qs("#filterBtn");
const resetBtn = qs("#resetBtn");
const openCreateBtn = qs("#openCreateBtn");

// Modal
const modal = qs("#clienteModal");
const form = qs("#clienteForm");
const modalTitle = qs("#modalTitle");
const formError = qs("#formError");

// Inputs
const idIn = qs("#clienteId");
const nomeIn = qs("#nome");
const emailIn = qs("#email");
const telIn = qs("#telefone");
const endIn = qs("#endereco");

// Toast
const toast = qs("#toast");
function showToast(mensagem, tempo = 2300) {
  toast.textContent = mensagem;
  toast.hidden = false;
  setTimeout(() => toast.hidden = true, tempo);
}

// Util
function fmtData(d) {
  return new Date(d).toLocaleDateString("pt-BR") + " " +
         new Date(d).toLocaleTimeString("pt-BR");
}

// Carregar lista
async function loadClientes() {
  tbody.innerHTML = "<tr><td colspan='7'>Carregando...</td></tr>";

  const params = new URLSearchParams({
    page: state.page,
    limit: state.limit
  });

  if (state.q) params.set("q", state.q);

  const r = await fetch(`${API}/clientes?${params.toString()}`);
  const json = await r.json();

  const clientes = json.data;
  const pag = json.pagination;

  state.totalPages = pag.pages;

  pageInfo.textContent =
    `Página ${pag.page} de ${pag.pages} — Total: ${pag.total}`;

  renderTable(clientes);
}

function renderTable(clientes) {
  if (clientes.length === 0) {
    tbody.innerHTML = "<tr><td colspan='7'>Nenhum cliente encontrado.</td></tr>";
    return;
  }

  tbody.innerHTML = clientes.map(c => `
    <tr>
      <td>${c.id}</td>
      <td>${c.nome}</td>
      <td>${c.email}</td>
      <td>${c.telefone ?? "-"}</td>
      <td>${c.endereco ?? "-"}</td>
      <td>${fmtData(c.criado_em)}</td>
      <td>
        <button data-id="${c.id}" data-action="edit">✏️ Editar</button>
        <button data-id="${c.id}" data-action="del" class="danger">🗑 Excluir</button>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-action='edit']").forEach(btn => {
    btn.onclick = () => loadToEdit(btn.dataset.id);
  });

  tbody.querySelectorAll("[data-action='del']").forEach(btn => {
    btn.onclick = () => delCliente(btn.dataset.id);
  });
}

// Criar / Editar
function openCreate() {
  idIn.value = "";
  form.reset();
  formError.textContent = "";
  modalTitle.textContent = "Novo cliente";
  modal.showModal();
}

async function loadToEdit(id) {
  const r = await fetch(`${API}/clientes/${id}`);
  const json = await r.json();
  const c = json.data;

  idIn.value = c.id;
  nomeIn.value = c.nome;
  emailIn.value = c.email;
  telIn.value = c.telefone ?? "";
  endIn.value = c.endereco ?? "";

  formError.textContent = "";
  modalTitle.textContent = "Editar cliente #" + id;

  modal.showModal();
}

async function saveCliente(e) {
  e.preventDefault();

  const payload = {
    nome: nomeIn.value.trim(),
    email: emailIn.value.trim(),
    telefone: telIn.value.trim() || null,
    endereco: endIn.value.trim() || null
  };

  let url = `${API}/clientes`;
  let method = "POST";

  if (idIn.value) {
    url = `${API}/clientes/${idIn.value}`;
    method = "PUT";
  }

  const r = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!r.ok) {
    const json = await r.json().catch(() => null);
    formError.textContent = json?.error?.message ?? "Erro ao salvar.";
    return;
  }

  modal.close();
  await loadClientes();
  showToast("Cliente salvo com sucesso!");
}

// Excluir
async function delCliente(id) {
  if (!confirm("Deseja excluir este cliente?")) return;

  const r = await fetch(`${API}/clientes/${id}`, { method: "DELETE" });
  if (!r.ok) {
    showToast("Erro ao excluir.");
    return;
  }

  await loadClientes();
  showToast("Cliente excluído.");
}

// Eventos
openCreateBtn.onclick = openCreate;
form.onsubmit = saveCliente;
qs("#cancelBtn").onclick = () => modal.close();

filterBtn.onclick = () => {
  state.q = searchInput.value.trim();
  state.page = 1;
  loadClientes();
};

resetBtn.onclick = () => {
  searchInput.value = "";
  state.q = "";
  state.page = 1;
  loadClientes();
};

prevBtn.onclick = () => {
  if (state.page > 1) {
    state.page--;
    loadClientes();
  }
};

nextBtn.onclick = () => {
  if (state.page < state.totalPages) {
    state.page++;
    loadClientes();
  }
};

// Inicializar
loadClientes();