// history/history.js — De Sousa Consulting

const API_BASE = "https://api.fbos.org";
const DEMO_SLUG = "implementations";

const ENDPOINT_ACTIONS = `${API_BASE}/api/demos/${DEMO_SLUG}/actions?limit=50`;
const ENDPOINT_CLOSED = `${API_BASE}/api/demos/${DEMO_SLUG}/actions/closed?limit=50`;

const CLOSED_STATE = "Cerradas";

const els = {
  countLabel: document.getElementById("countLabel"),
  refreshBtn: document.getElementById("refreshBtn"),
  searchInput: document.getElementById("searchInput"),
  status: document.getElementById("status"),
  content: document.getElementById("content"),
};

const modal = {
  root: document.getElementById("historyModal"),
  body: document.getElementById("historyModalBody"),
  closeBtn: document.getElementById("historyCloseBtn"),
};

let allClosed = [];

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseTs(ts) {
  const t = Date.parse(ts);
  return Number.isFinite(t) ? t : 0;
}

function fmtDate(ts) {
  const t = parseTs(ts);
  if (!t) return "—";
  const d = new Date(t);
  return d.toLocaleString("es-CR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function setStatus(kind, text) {
  els.status.className = "status " + (kind === "err" ? "err" : "ok");
  els.status.textContent = text || "";
}

function normalizeQuery(q) {
  const s = String(q || "").trim();
  if (!s) return "";
  if (/^fbos-\d+$/i.test(s)) return s.toUpperCase();
  return s;
}

function filterRows(query) {
  const q = normalizeQuery(query).toLowerCase();
  if (!q) return allClosed;

  return allClosed.filter((a) => {
    const p = a.payload || {};

    const hay = [
      a.action_id,
      a.category,
      a.description,
      a.location,
      p.customer_name,
      p.customer_email,
      p.industry,
      p.teamSize,
      p.pain,
    ]
      .map((x) => String(x || "").toLowerCase())
      .join(" ");

    return hay.includes(q);
  });
}

function renderTable(rows) {
  els.countLabel.textContent = `Cerradas (${rows.length})`;

  if (!rows.length) {
    els.content.innerHTML = `<div class="empty-box">No hay solicitudes cerradas.</div>`;
    return;
  }

  const html = rows
    .map((a) => {
      const p = a.payload || {};

      return `
        <tr>
          <td><strong>${escapeHtml(a.action_id)}</strong></td>
          <td>${escapeHtml(a.category || "")}</td>
          <td>${escapeHtml(p.customer_name || "")}</td>
          <td>${escapeHtml(a.location || "")}</td>
          <td>${escapeHtml(fmtDate(a.created_at))}</td>
          <td>${escapeHtml(fmtDate(a.updated_at))}</td>
        </tr>
      `;
    })
    .join("");

  els.content.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Categoría</th>
            <th>Cliente</th>
            <th>País</th>
            <th>Creado</th>
            <th>Cerrado</th>
          </tr>
        </thead>
        <tbody>${html}</tbody>
      </table>
    </div>
  `;
}

async function fetchClosed() {
  els.refreshBtn.disabled = true;
  els.refreshBtn.textContent = "Cargando…";

  try {
    const res = await fetch(ENDPOINT_ACTIONS);
    const data = await res.json();

    if (!data.success) throw new Error("Error API");

    const actions = data.actions || [];

    const closed = actions.filter(
      (a) => String(a.state || "").trim() === CLOSED_STATE
    );

    allClosed = closed.sort(
      (a, b) => parseTs(b.updated_at) - parseTs(a.updated_at)
    );

    renderTable(filterRows(els.searchInput.value));
  } catch (err) {
    setStatus("err", "No se pudo cargar el historial");
    console.error(err);
  } finally {
    els.refreshBtn.disabled = false;
    els.refreshBtn.textContent = "Actualizar";
  }
}

function attach() {
  els.refreshBtn.addEventListener("click", fetchClosed);

  els.searchInput.addEventListener("input", () => {
    renderTable(filterRows(els.searchInput.value));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  attach();
  fetchClosed();
});
