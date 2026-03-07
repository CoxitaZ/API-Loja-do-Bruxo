// Config
const API = window.API_BASE_URL ?? "http://localhost:3000";
const qs = (sel, el = document) => el.querySelector(sel);

// Estado da UI
let state = {
  page: 1,
  limit: 10,
  q: "",
  categoria: "",
  totalPages: 1,
};

// Elementos
const tbody = qs("#itemsTbody");
const pageInfo = qs("#pageInfo");
const prevBtn = qs("#prevPageBtn");
const nextBtn = qs("#nextPageBtn");
const searchInput = qs("#searchInput");
const categoryInput = qs("#categoryInput");
const filterBtn = qs("#filterBtn");
const resetBtn = qs("#resetBtn");
const openCreateBtn = qs("#openCreateBtn");

// Modal/Forms
const modal = qs("#itemModal");
const modalTitle = qs("#modalTitle");
const form = qs("#itemForm");
const itemId = qs("#itemId");
const nomeIn = qs("#nome");
const categoriaIn = qs("#categoria");
const precoIn = qs("#preco");
const estoqueIn = qs("#estoque");
const descricaoIn = qs("#descricao");
const cancelBtn = qs("#cancelBtn");
const formError = qs("#formError");

// Toast
const toast = qs("#toast");
function showToast(msg, timeout = 2200) {
  toast.textContent = msg;
  toast.hidden = false;
  setTimeout(() => (toast.hidden = true), timeout);
}

// Helpers
function fmtMoney(v){
  return Number(v).toLocaleString("pt-BR",{ style:"currency", currency:"BRL" });
}
function fmtDate(iso){
  try { return new Date(iso).toLocaleString("pt-BR"); } catch { return iso; }
}

// Carregar lista
async function loadItems() {
  tbody.innerHTML = `<tr><td colspan="7">Carregando...</td></tr>`;
  try {
    const params = new URLSearchParams({
      page: String(state.page),
      limit: String(state.limit),
    });
    if (state.q) params.set("q", state.q);
    if (state.categoria) params.set("categoria", state.categoria);

    const res = await fetch(`${API}/items?${params.toString()}`);
    if (!res.ok) throw new Error(`Falha ao buscar itens (${res.status})`);
    const json = await res.json();

    renderTable(json.data);
    renderPagination(json.pagination);
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="7">Erro ao carregar itens.</td></tr>`;
  }
}

function renderTable(items = []) {
  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="7">Nenhum item encontrado.</td></tr>`;
    return;
  }
  tbody.innerHTML = items.map(item => {
    return `
      <tr data-id="${item.id}">
        <td>${item.id}</td>
        <td>${escapeHtml(item.nome)}</td>
        <td>${item.categoria ? `<span class="badge">${escapeHtml(item.categoria)}</span>` : "-"}</td>
        <td>${fmtMoney(item.preco)}</td>
        <td>${item.estoque}</td>
        <td>${fmtDate(item.created_at)}</td>
        <td>
          <button class="secondary" data-action="edit" data-id="${item.id}">Editar</button>
          <button class="danger" data-action="delete" data-id="${item.id}">Excluir</button>
        </td>
      </tr>
    `;
  }).join("");

  // Ações de linha
  tbody.querySelectorAll("button[data-action='edit']").forEach(btn => {
    btn.addEventListener("click", () => openEdit(Number(btn.dataset.id)));
  });
  tbody.querySelectorAll("button[data-action='delete']").forEach(btn => {
    btn.addEventListener("click", () => confirmDelete(Number(btn.dataset.id)));
  });
}

function renderPagination(p) {
  const { page, pages, total } = {
    page: p.page,
    pages: p.pages,
    total: p.total,
  };
  state.totalPages = pages;
  pageInfo.textContent = `Página ${page} de ${pages} — Total: ${total}`;
  prevBtn.disabled = state.page <= 1;
  nextBtn.disabled = state.page >= state.totalPages;
}

// CRUD
async function fetchItem(id) {
  const res = await fetch(`${API}/items/${id}`);
  if (!res.ok) throw new Error("Item não encontrado");
  const json = await res.json();
  return json.data;
}

function openCreate(){
  modalTitle.textContent = "Novo item";
  itemId.value = "";
  nomeIn.value = "";
  categoriaIn.value = "";
  precoIn.value = "";
  estoqueIn.value = "";
  descricaoIn.value = "";
  formError.textContent = "";
  modal.showModal();
}

async function openEdit(id){
  formError.textContent = "";
  try {
    const item = await fetchItem(id);
    modalTitle.textContent = `Editar item #${id}`;
    itemId.value = item.id;
    nomeIn.value = item.nome ?? "";
    categoriaIn.value = item.categoria ?? "";
    precoIn.value = item.preco ?? 0;
    estoqueIn.value = item.estoque ?? 0;
    descricaoIn.value = item.descricao ?? "";
    modal.showModal();
  } catch (err) {
    console.error(err);
    showToast("Falha ao carregar item.");
  }
}

async function saveItem(e){
  e?.preventDefault?.();
  formError.textContent = "";

  const payload = {
    nome: nomeIn.value.trim(),
    categoria: categoriaIn.value.trim() || null,
    preco: Number(precoIn.value),
    estoque: Number(estoqueIn.value),
    descricao: descricaoIn.value.trim() || null,
  };

  // Validação rápida no client
  const errors = [];
  if (payload.nome.length < 2) errors.push("Nome deve ter pelo menos 2 caracteres.");
  if (!(Number.isFinite(payload.preco)) || payload.preco < 0) errors.push("Preço inválido.");
  if (!Number.isInteger(payload.estoque) || payload.estoque < 0) errors.push("Estoque inválido.");
  if (errors.length) {
    formError.textContent = errors.join(" ");
    return;
  }

  const id = itemId.value ? Number(itemId.value) : null;
  const method = id ? "PUT" : "POST";
  const url = id ? `${API}/items/${id}` : `${API}/items`;

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errJson = await safeJson(res);
      const msg = errJson?.error?.message || `Falha ao salvar (${res.status})`;
      throw new Error(msg);
    }
    modal.close();
    await loadItems();
    showToast(id ? "Item atualizado!" : "Item criado!");
  } catch (err) {
    console.error(err);
    formError.textContent = err.message;
  }
}

async function confirmDelete(id){
  const ok = confirm(`Tem certeza que deseja excluir o item #${id}?`);
  if (!ok) return;
  try {
    const res = await fetch(`${API}/items/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) throw new Error(`Falha ao excluir (${res.status})`);
    await loadItems();
    showToast("Item excluído!");
  } catch (err) {
    console.error(err);
    showToast("Erro ao excluir.");
  }
}

// Eventos
openCreateBtn.addEventListener("click", openCreate);
cancelBtn.addEventListener("click", () => modal.close());
form.addEventListener("submit", saveItem);

filterBtn.addEventListener("click", () => {
  state.page = 1;
  state.q = searchInput.value.trim();
  state.categoria = categoryInput.value.trim();
  loadItems();
});
resetBtn.addEventListener("click", () => {
  searchInput.value = "";
  categoryInput.value = "";
  state = { ...state, page: 1, q: "", categoria: "" };
  loadItems();
});

prevBtn.addEventListener("click", () => {
  if (state.page > 1) { state.page--; loadItems(); }
});
nextBtn.addEventListener("click", () => {
  if (state.page < state.totalPages) { state.page++; loadItems(); }
});

// Utils
function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, (ch) =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[ch])
  );
}
async function safeJson(res){
  try { return await res.json(); } catch { return null; }
}

// Inicialização
loadItems();