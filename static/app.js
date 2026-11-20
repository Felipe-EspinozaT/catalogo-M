/**
 * Catálogo Mecatrónico — Frontend ligero en JavaScript puro
 */

const state = {
  viewMode: "componente", // "componente" | "escala"
  search: "",
  quickFilter: "",
  componentes: [],
  customColumns: [],
  categorias: [],
  escalas: [],
  bomSelected: new Set(),
  collapsedBlocks: new Set(),
  zoomTargetId: null,
  usosTargetId: null,
  uploadTargetId: null,
  energyLoads: [
    { name: "ESP32 (WiFi activo)", qty: 1, avgMa: 180, peakMa: 500, driver: "Regulador Buck 3.3V / 5V" },
    { name: "Motorreductor TT / N20", qty: 2, avgMa: 250, peakMa: 1200, driver: "DRV8833 / TB6612FNG" },
  ],
};

const els = {
  catalogContainer: document.getElementById("catalogContainer"),
  btnViewComponente: document.getElementById("btnViewComponente"),
  btnViewEscala: document.getElementById("btnViewEscala"),
  searchInput: document.getElementById("searchInput"),
  quickFilter: document.getElementById("quickFilter"),
  btnNewModel: document.getElementById("btnNewModel"),
  btnNewColumn: document.getElementById("btnNewColumn"),
  btnEnergyCalc: document.getElementById("btnEnergyCalc"),
  btnMaqueta3D: document.getElementById("btnMaqueta3D"),
  bomBar: document.getElementById("bomBar"),
  bomCount: document.getElementById("bomCount"),
  bomTotal: document.getElementById("bomTotal"),
  btnCopyBom: document.getElementById("btnCopyBom"),
  btnClearBom: document.getElementById("btnClearBom"),
  modalNewModel: document.getElementById("modalNewModel"),
  formNewModel: document.getElementById("formNewModel"),
  categoriasList: document.getElementById("categoriasList"),
  modalNewColumn: document.getElementById("modalNewColumn"),
  formNewColumn: document.getElementById("formNewColumn"),
  modalImageZoom: document.getElementById("modalImageZoom"),
  zoomTitle: document.getElementById("zoomTitle"),
  zoomToggleGroup: document.getElementById("zoomToggleGroup"),
  btnZoomPhoto: document.getElementById("btnZoomPhoto"),
  btnZoomRuler: document.getElementById("btnZoomRuler"),
  zoomImg: document.getElementById("zoomImg"),
  btnZoomReplace: document.getElementById("btnZoomReplace"),
  btnZoomDelete: document.getElementById("btnZoomDelete"),
  modalUsos: document.getElementById("modalUsos"),
  usosTitle: document.getElementById("usosTitle"),
  usosSubtitle: document.getElementById("usosSubtitle"),
  usosPreview: document.getElementById("usosPreview"),
  usosTextarea: document.getElementById("usosTextarea"),
  btnSaveUsos: document.getElementById("btnSaveUsos"),
  modalEnergy: document.getElementById("modalEnergy"),
  energyBatteryPreset: document.getElementById("energyBatteryPreset"),
  energyBattV: document.getElementById("energyBattV"),
  energyBattMah: document.getElementById("energyBattMah"),
  energyBattC: document.getElementById("energyBattC"),
  energyEfficiency: document.getElementById("energyEfficiency"),
  energyLoadPreset: document.getElementById("energyLoadPreset"),
  btnAddEnergyRow: document.getElementById("btnAddEnergyRow"),
  energyDriversList: document.getElementById("energyDriversList"),
  energyLoadsBody: document.getElementById("energyLoadsBody"),
  energyResults: document.getElementById("energyResults"),
  modalAddEnergyLoad: document.getElementById("modalAddEnergyLoad"),
  btnLoadModeCatalog: document.getElementById("btnLoadModeCatalog"),
  btnLoadModeManual: document.getElementById("btnLoadModeManual"),
  loadCatalogPickers: document.getElementById("loadCatalogPickers"),
  loadCatSelect: document.getElementById("loadCatSelect"),
  loadCompSelect: document.getElementById("loadCompSelect"),
  formAddEnergyLoad: document.getElementById("formAddEnergyLoad"),
  loadNameInput: document.getElementById("loadNameInput"),
  loadQtyInput: document.getElementById("loadQtyInput"),
  loadDriverInput: document.getElementById("loadDriverInput"),
  loadAvgMaInput: document.getElementById("loadAvgMaInput"),
  loadPeakMaInput: document.getElementById("loadPeakMaInput"),
  hiddenFotoInput: document.getElementById("hiddenFotoInput"),
  hiddenPdfInput: document.getElementById("hiddenPdfInput"),
  toast: document.getElementById("toast"),
};

let toastTimer = null;
function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.add("hidden"), 2600);
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let detail = "Error en la operación";
    try {
      const err = await res.json();
      if (err.detail) detail = err.detail;
    } catch (_) {}
    throw new Error(detail);
  }
  return res.json();
}

async function loadData() {
  try {
    const data = await apiFetch("/api/data");
    state.componentes = data.componentes || [];
    state.customColumns = data.custom_columns || [];
    state.categorias = data.categorias || [];
    state.escalas = data.escalas || [];
    syncQuickFilterOptions();
    syncCategoriasDatalist();
    render();
    updateBomBar();
    window.Maqueta3D?.refreshCatalog();
  } catch (err) {
    els.catalogContainer.innerHTML = `<div class="empty-state">Error al cargar datos: ${escapeHtml(err.message)}</div>`;
  }
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function syncCategoriasDatalist() {
  els.categoriasList.innerHTML = state.categorias
    .map((c) => `<option value="${escapeHtml(c)}"></option>`)
    .join("");
}

function syncQuickFilterOptions() {
  const prev = state.quickFilter;
  const opts = ['<option value="">Todos (sin filtro)</option>'];

  if (state.viewMode === "componente") {
    for (const esc of state.escalas) {
      opts.push(`<option value="${escapeHtml(esc.codigo)}">${escapeHtml(esc.titulo)}</option>`);
    }
  } else {
    for (const cat of state.categorias) {
      opts.push(`<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`);
    }
  }
  els.quickFilter.innerHTML = opts.join("");
  // Mantener selección si aún existe en el modo actual
  const exists = Array.from(els.quickFilter.options).some((o) => o.value === prev);
  state.quickFilter = exists ? prev : "";
  els.quickFilter.value = state.quickFilter;
}

function matchesFilters(comp) {
  if (state.quickFilter) {
    if (state.viewMode === "componente" && comp.escala !== state.quickFilter) {
      return false;
    }
    if (state.viewMode === "escala" && comp.categoria !== state.quickFilter) {
      return false;
    }
  }

  const q = state.search.trim().toLowerCase();
  if (!q) return true;

  const customText = Object.values(comp.custom_attrs || {}).join(" ");
  const haystack = [
    comp.modelo,
    comp.categoria,
    comp.escala,
    comp.dimensiones,
    comp.voltaje,
    comp.especificaciones,
    comp.usos,
    comp.precio_est,
    comp.donde_encontrar,
    comp.link_notas,
    customText,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

function getGroupedBlocks(filtered) {
  if (state.viewMode === "componente") {
    return state.categorias
      .map((cat) => ({
        title: cat,
        subtitle: "",
        items: filtered.filter((c) => c.categoria === cat),
      }))
      .filter((b) => b.items.length > 0);
  }

  return state.escalas
    .map((esc) => ({
      title: esc.titulo,
      subtitle: esc.descripcion,
      items: filtered.filter((c) => c.escala === esc.codigo),
    }))
    .filter((b) => b.items.length > 0);
}

function render() {
  const filtered = state.componentes.filter(matchesFilters);
  const blocks = getGroupedBlocks(filtered);

  if (blocks.length === 0) {
    els.catalogContainer.innerHTML = `
      <div class="empty-state">
        No se encontraron componentes que coincidan con el filtro actual.
      </div>`;
    return;
  }

  const firstAttrHeader = state.viewMode === "componente" ? "Escala" : "Componente";

  const html = blocks
    .map((block) => {
      const customThs = state.customColumns
        .map((col) => `<th title="Atributo personalizado">${escapeHtml(col.label)}</th>`)
        .join("");

      const rowsHtml = block.items
        .map((comp) => renderRow(comp))
        .join("");

      const isCollapsed = state.collapsedBlocks.has(block.title);

      return `
        <section class="category-block${isCollapsed ? " collapsed" : ""}">
          <div class="block-header" data-block-toggle="${escapeHtml(block.title)}" title="Clic para minimizar o desplegar">
            <div>
              <div class="block-title-row">
                <span class="block-chevron">&#9660;</span>
                <h2 class="block-title">${escapeHtml(block.title)}</h2>
              </div>
              ${block.subtitle ? `<span class="block-subtitle">${escapeHtml(block.subtitle)}</span>` : ""}
            </div>
            <span class="block-count">${block.items.length} modelo${block.items.length === 1 ? "" : "s"}</span>
          </div>
          <div class="table-scroll">
            <table class="catalog-table">
              <thead>
                <tr>
                  <th class="corner-empty"></th>
                  <th>${firstAttrHeader}</th>
                  <th>Dimensiones</th>
                  <th>Voltaje</th>
                  <th>Especificaciones</th>
                  <th>Usos</th>
                  <th>Precio Est. (S/)</th>
                  <th>Dónde encontrarlo</th>
                  <th>Foto Ref.</th>
                  <th>Datasheet (PDF)</th>
                  <th>Link / Notas</th>
                  ${customThs}
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </section>
      `;
    })
    .join("");

  els.catalogContainer.innerHTML = html;
}

function renderRow(comp) {
  const checked = state.bomSelected.has(comp.id) ? "checked" : "";
  const firstAttrField = state.viewMode === "componente" ? "escala" : "categoria";
  const firstAttrValue = comp[firstAttrField] || "";

  const fotoCell = comp.foto_path
    ? `
      <div class="thumb-wrap">
        <img
          class="foto-thumb"
          src="${escapeHtml(comp.foto_path)}"
          alt="${escapeHtml(comp.modelo)}"
          data-action="zoom-foto"
          data-id="${comp.id}"
          title="Clic para ampliar (incluye regla en mm)"
        />
        <button
          class="thumb-replace-btn"
          data-action="upload-foto"
          data-id="${comp.id}"
          title="Cambiar foto"
        >&#8635;</button>
      </div>`
    : `<button class="add-hover-btn" data-action="upload-foto" data-id="${comp.id}" title="Subir o arrastrar foto">+</button>`;

  const pdfCell = comp.datasheet_path
    ? `
      <div class="pdf-actions">
        <a
          class="pdf-open-btn"
          href="${escapeHtml(comp.datasheet_path)}"
          target="_blank"
          rel="noopener noreferrer"
          title="Abrir Datasheet PDF"
        >PDF</a>
        <button
          class="mini-icon-btn"
          data-action="upload-pdf"
          data-id="${comp.id}"
          title="Reemplazar PDF"
        >&#8635;</button>
        <button
          class="mini-icon-btn"
          data-action="delete-pdf"
          data-id="${comp.id}"
          title="Quitar PDF"
        >&times;</button>
      </div>`
    : `<button class="add-hover-btn" data-action="upload-pdf" data-id="${comp.id}" title="Adjuntar PDF">+</button>`;

  const linkVal = (comp.link_notas || "").trim();
  const isUrl = /^https?:\/\//i.test(linkVal);
  let linkCellContent = "";
  if (!linkVal) {
    linkCellContent = `<button class="add-hover-btn" data-action="edit-cell" title="Agregar link o nota">+</button>`;
  } else if (isUrl) {
    const shortUrl = linkVal.length > 32 ? linkVal.slice(0, 30) + "…" : linkVal;
    linkCellContent = `
      <div class="link-cell-wrap">
        <a class="ext-link" href="${escapeHtml(linkVal)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(linkVal)}">${escapeHtml(shortUrl)}</a>
        <button class="mini-icon-btn" data-action="edit-cell" title="Editar enlace">&#9998;</button>
      </div>`;
  } else {
    linkCellContent = `<span class="cell-text">${escapeHtml(linkVal)}</span>`;
  }

  const customTds = state.customColumns
    .map((col) => {
      const val = (comp.custom_attrs && comp.custom_attrs[col.key]) || "";
      const inner = val
        ? `<span class="cell-text">${escapeHtml(val)}</span>`
        : `<button class="add-hover-btn" data-action="edit-cell" title="Agregar valor">+</button>`;
      return `<td class="editable-cell empty-hover-cell" data-id="${comp.id}" data-field="${escapeHtml(col.key)}">${inner}</td>`;
    })
    .join("");

  return `
    <tr data-row-id="${comp.id}">
      <td class="model-cell">
        <div class="model-cell-inner">
          <input type="checkbox" class="bom-check" data-id="${comp.id}" ${checked} title="Agregar a lista BOM" />
          <span class="model-name editable-cell" data-id="${comp.id}" data-field="modelo">${escapeHtml(comp.modelo)}</span>
          <button class="row-delete-btn" data-action="delete-row" data-id="${comp.id}" title="Eliminar modelo">&times;</button>
        </div>
      </td>
      <td class="editable-cell" data-id="${comp.id}" data-field="${firstAttrField}" data-type="select">
        <span class="escala-badge">${escapeHtml(firstAttrValue)}</span>
      </td>
      <td class="editable-cell" data-id="${comp.id}" data-field="dimensiones">
        <span class="cell-text">${escapeHtml(comp.dimensiones)}</span>
      </td>
      <td class="editable-cell" data-id="${comp.id}" data-field="voltaje">
        <span class="cell-text">${escapeHtml(comp.voltaje)}</span>
      </td>
      <td class="editable-cell" data-id="${comp.id}" data-field="especificaciones">
        <span class="cell-text">${escapeHtml(comp.especificaciones)}</span>
      </td>
      <td class="usos-cell empty-hover-cell">
        ${
          (comp.usos || "").trim()
            ? `<button class="usos-btn" data-action="open-usos" data-id="${comp.id}" title="Ver usos y cosas a considerar">Ver usos</button>`
            : `<button class="add-hover-btn" data-action="open-usos" data-id="${comp.id}" title="Agregar usos y consideraciones">+</button>`
        }
      </td>
      <td class="editable-cell" data-id="${comp.id}" data-field="precio_est">
        <span class="cell-text">${escapeHtml(comp.precio_est)}</span>
      </td>
      <td class="editable-cell" data-id="${comp.id}" data-field="donde_encontrar">
        <span class="cell-text">${escapeHtml(comp.donde_encontrar)}</span>
      </td>
      <td class="media-cell empty-hover-cell" data-drop="foto" data-id="${comp.id}">
        ${fotoCell}
      </td>
      <td class="pdf-cell empty-hover-cell" data-drop="pdf" data-id="${comp.id}">
        ${pdfCell}
      </td>
      <td class="editable-cell empty-hover-cell" data-id="${comp.id}" data-field="link_notas">
        ${linkCellContent}
      </td>
      ${customTds}
    </tr>
  `;
}

/* ==================== Edición directa en celda ==================== */

function startInlineEdit(cellEl) {
  if (cellEl.querySelector("input, select")) return;
  const compId = Number(cellEl.dataset.id);
  const field = cellEl.dataset.field;
  const comp = state.componentes.find((c) => c.id === compId);
  if (!comp) return;

  const isStandard = [
    "modelo",
    "categoria",
    "escala",
    "dimensiones",
    "voltaje",
    "especificaciones",
    "usos",
    "precio_est",
    "donde_encontrar",
    "link_notas",
  ].includes(field);

  const currentVal = isStandard
    ? comp[field] || ""
    : (comp.custom_attrs && comp.custom_attrs[field]) || "";

  if (field === "escala") {
    const select = document.createElement("select");
    select.className = "inline-select";
    for (const esc of state.escalas) {
      const opt = document.createElement("option");
      opt.value = esc.codigo;
      opt.textContent = esc.codigo;
      if (esc.codigo === currentVal) opt.selected = true;
      select.appendChild(opt);
    }
    cellEl.innerHTML = "";
    cellEl.appendChild(select);
    select.focus();

    const finish = async (save) => {
      const nextVal = select.value;
      if (save && nextVal !== currentVal) {
        await saveCellPatch(compId, field, nextVal);
      } else {
        render();
      }
    };
    select.addEventListener("change", () => finish(true));
    select.addEventListener("blur", () => finish(false));
    select.addEventListener("keydown", (e) => {
      if (e.key === "Escape") finish(false);
    });
    return;
  }

  const input = document.createElement("input");
  input.type = "text";
  input.className = "inline-input";
  input.value = currentVal;
  if (field === "categoria") {
    input.setAttribute("list", "categoriasList");
  }

  cellEl.innerHTML = "";
  cellEl.appendChild(input);
  input.focus();
  input.select();

  let done = false;
  const commit = async (save) => {
    if (done) return;
    done = true;
    const nextVal = input.value.trim();
    if (save && nextVal !== currentVal.trim()) {
      await saveCellPatch(compId, field, nextVal);
    } else {
      render();
    }
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      commit(false);
    }
  });
  input.addEventListener("blur", () => commit(true));
}

async function saveCellPatch(compId, field, value) {
  try {
    const updated = await apiFetch(`/api/componentes/${compId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, value }),
    });
    replaceComponenteInState(updated);
    if (field === "categoria" && value && !state.categorias.includes(value)) {
      state.categorias.push(value);
      syncCategoriasDatalist();
      syncQuickFilterOptions();
    }
    render();
    updateBomBar();
    window.Maqueta3D?.refreshCatalog();
    showToast("Guardado en SQLite");
  } catch (err) {
    showToast(err.message);
    render();
  }
}

function replaceComponenteInState(updated) {
  const idx = state.componentes.findIndex((c) => c.id === updated.id);
  if (idx !== -1) {
    state.componentes[idx] = updated;
  }
}

/* ==================== Subida de Fotos y PDFs ==================== */

async function uploadFile(compId, kind, file) {
  const form = new FormData();
  form.append("file", file);
  const endpoint =
    kind === "foto"
      ? `/api/componentes/${compId}/foto`
      : `/api/componentes/${compId}/datasheet`;

  try {
    const updated = await apiFetch(endpoint, { method: "POST", body: form });
    replaceComponenteInState(updated);
    render();
    if (kind === "foto" && state.zoomTargetId === compId) {
      els.zoomImg.src = updated.foto_path;
    }
    showToast(kind === "foto" ? "Foto guardada localmente" : "Datasheet PDF adjuntado");
  } catch (err) {
    showToast(err.message);
  }
}

/* ==================== Armador Rápido de BOM ==================== */

function parsePriceRange(priceStr) {
  if (!priceStr) return [0, 0];
  const matches = priceStr.match(/\d+(?:\.\d+)?/g);
  if (!matches || matches.length === 0) return [0, 0];
  const nums = matches.map(Number).filter((n) => !Number.isNaN(n));
  if (nums.length === 1) return [nums[0], nums[0]];
  return [nums[0], nums[1]];
}

function updateBomBar() {
  const selected = state.componentes.filter((c) => state.bomSelected.has(c.id));
  if (selected.length === 0) {
    els.bomBar.classList.add("hidden");
    return;
  }

  let totalMin = 0;
  let totalMax = 0;
  for (const item of selected) {
    const [mn, mx] = parsePriceRange(item.precio_est);
    totalMin += mn;
    totalMax += mx;
  }

  els.bomCount.textContent = `${selected.length} modelo${selected.length === 1 ? "" : "s"}`;
  if (totalMin === totalMax) {
    els.bomTotal.textContent = `Total Est.: S/ ${totalMin.toFixed(2)}`;
  } else {
    const avg = (totalMin + totalMax) / 2;
    els.bomTotal.textContent = `Total Est.: S/ ${totalMin.toFixed(2)} - S/ ${totalMax.toFixed(2)} (prom. S/ ${avg.toFixed(2)})`;
  }
  els.bomBar.classList.remove("hidden");
}

/* ==================== Eventos ==================== */

els.btnViewComponente.addEventListener("click", () => {
  state.viewMode = "componente";
  els.btnViewComponente.classList.add("active");
  els.btnViewEscala.classList.remove("active");
  syncQuickFilterOptions();
  render();
});

els.btnViewEscala.addEventListener("click", () => {
  state.viewMode = "escala";
  els.btnViewEscala.classList.add("active");
  els.btnViewComponente.classList.remove("active");
  syncQuickFilterOptions();
  render();
});

els.searchInput.addEventListener("input", (e) => {
  state.search = e.target.value;
  render();
});

els.quickFilter.addEventListener("change", (e) => {
  state.quickFilter = e.target.value;
  render();
});

// Delegación de clics en la tabla
els.catalogContainer.addEventListener("click", async (e) => {
  const target = e.target;

  // Minimizar o desplegar bloque de categoría/escala
  const blockHeader = target.closest("[data-block-toggle]");
  if (blockHeader) {
    const title = blockHeader.dataset.blockToggle;
    if (state.collapsedBlocks.has(title)) {
      state.collapsedBlocks.delete(title);
    } else {
      state.collapsedBlocks.add(title);
    }
    render();
    return;
  }

  // Checkbox BOM
  if (target.classList.contains("bom-check")) {
    const id = Number(target.dataset.id);
    if (target.checked) state.bomSelected.add(id);
    else state.bomSelected.delete(id);
    updateBomBar();
    return;
  }

  // Botones con data-action
  const actionEl = target.closest("[data-action]");
  if (actionEl) {
    const action = actionEl.dataset.action;
    const id = Number(actionEl.dataset.id);

    if (action === "upload-foto") {
      state.uploadTargetId = id;
      els.hiddenFotoInput.value = "";
      els.hiddenFotoInput.click();
      return;
    }

    if (action === "upload-pdf") {
      state.uploadTargetId = id;
      els.hiddenPdfInput.value = "";
      els.hiddenPdfInput.click();
      return;
    }

    if (action === "delete-pdf") {
      try {
        const updated = await apiFetch(`/api/componentes/${id}/datasheet`, {
          method: "DELETE",
        });
        replaceComponenteInState(updated);
        render();
        showToast("PDF quitado");
      } catch (err) {
        showToast(err.message);
      }
      return;
    }

    if (action === "zoom-foto") {
      const comp = state.componentes.find((c) => c.id === id);
      if (comp && comp.foto_path) {
        state.zoomTargetId = id;
        els.zoomTitle.textContent = `${comp.modelo} — ${comp.dimensiones || ""}`;
        const isSeedSvg = comp.foto_path.includes("/seed_") && comp.foto_path.endsWith(".svg");
        if (isSeedSvg) {
          els.zoomToggleGroup.classList.add("hidden");
        } else {
          els.zoomToggleGroup.classList.remove("hidden");
          els.btnZoomPhoto.classList.add("active");
          els.btnZoomRuler.classList.remove("active");
        }
        els.zoomImg.src = comp.foto_path;
        els.modalImageZoom.classList.remove("hidden");
      }
      return;
    }

    if (action === "open-usos") {
      const comp = state.componentes.find((c) => c.id === id);
      if (comp) {
        state.usosTargetId = id;
        els.usosTitle.textContent = comp.modelo;
        els.usosSubtitle.textContent = `${comp.categoria} · ${comp.escala} · ${comp.voltaje || ""}`;
        const text = (comp.usos || "").trim();
        els.usosPreview.textContent = text || "Sin usos ni consideraciones registradas aún.";
        els.usosTextarea.value = text;
        els.modalUsos.classList.remove("hidden");
      }
      return;
    }

    if (action === "delete-row") {
      const comp = state.componentes.find((c) => c.id === id);
      if (!comp) return;
      if (!confirm(`¿Eliminar "${comp.modelo}" del catálogo?`)) return;
      try {
        await apiFetch(`/api/componentes/${id}`, { method: "DELETE" });
        state.componentes = state.componentes.filter((c) => c.id !== id);
        state.bomSelected.delete(id);
        render();
        updateBomBar();
        window.Maqueta3D?.refreshCatalog();
        showToast("Modelo eliminado");
      } catch (err) {
        showToast(err.message);
      }
      return;
    }

    if (action === "edit-cell") {
      const cell = actionEl.closest(".editable-cell");
      if (cell) startInlineEdit(cell);
      return;
    }
  }

  // No activar edición si hizo clic en un enlace externo
  if (target.closest("a")) return;

  const editable = target.closest(".editable-cell");
  if (editable) {
    startInlineEdit(editable);
  }
});

// Drag & Drop de Fotos y PDFs
els.catalogContainer.addEventListener("dragover", (e) => {
  const dropCell = e.target.closest("[data-drop]");
  if (!dropCell) return;
  e.preventDefault();
  dropCell.classList.add("drag-over");
});

els.catalogContainer.addEventListener("dragleave", (e) => {
  const dropCell = e.target.closest("[data-drop]");
  if (!dropCell) return;
  dropCell.classList.remove("drag-over");
});

els.catalogContainer.addEventListener("drop", async (e) => {
  const dropCell = e.target.closest("[data-drop]");
  if (!dropCell) return;
  e.preventDefault();
  dropCell.classList.remove("drag-over");

  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  const id = Number(dropCell.dataset.id);
  const kind = dropCell.dataset.drop;
  await uploadFile(id, kind, file);
});

els.hiddenFotoInput.addEventListener("change", async () => {
  const file = els.hiddenFotoInput.files?.[0];
  if (file && state.uploadTargetId) {
    await uploadFile(state.uploadTargetId, "foto", file);
  }
});

els.hiddenPdfInput.addEventListener("change", async () => {
  const file = els.hiddenPdfInput.files?.[0];
  if (file && state.uploadTargetId) {
    await uploadFile(state.uploadTargetId, "pdf", file);
  }
});

// Zoom modal acciones
els.btnZoomPhoto.addEventListener("click", () => {
  const comp = state.componentes.find((c) => c.id === state.zoomTargetId);
  if (!comp || !comp.foto_path) return;
  els.btnZoomPhoto.classList.add("active");
  els.btnZoomRuler.classList.remove("active");
  els.zoomImg.src = comp.foto_path;
});

els.btnZoomRuler.addEventListener("click", () => {
  if (!state.zoomTargetId) return;
  els.btnZoomRuler.classList.add("active");
  els.btnZoomPhoto.classList.remove("active");
  els.zoomImg.src = `/api/componentes/${state.zoomTargetId}/ruler-svg?t=${Date.now()}`;
});

els.btnZoomReplace.addEventListener("click", () => {
  if (!state.zoomTargetId) return;
  state.uploadTargetId = state.zoomTargetId;
  els.hiddenFotoInput.value = "";
  els.hiddenFotoInput.click();
});

els.btnZoomDelete.addEventListener("click", async () => {
  if (!state.zoomTargetId) return;
  try {
    const updated = await apiFetch(`/api/componentes/${state.zoomTargetId}/foto`, {
      method: "DELETE",
    });
    replaceComponenteInState(updated);
    els.modalImageZoom.classList.add("hidden");
    render();
    showToast("Foto eliminada");
  } catch (err) {
    showToast(err.message);
  }
});

// BOM acciones
els.btnClearBom.addEventListener("click", () => {
  state.bomSelected.clear();
  render();
  updateBomBar();
});

els.btnCopyBom.addEventListener("click", async () => {
  const selected = state.componentes.filter((c) => state.bomSelected.has(c.id));
  if (selected.length === 0) return;
  const lines = selected.map(
    (c) => `- ${c.modelo} (${c.escala}) | ${c.precio_est || "S/ -"} | ${c.donde_encontrar || ""}`
  );
  lines.push(`\n${els.bomTotal.textContent}`);
  try {
    await navigator.clipboard.writeText(lines.join("\n"));
    showToast("Lista BOM copiada al portapapeles");
  } catch (_) {
    showToast("No se pudo copiar automáticamente");
  }
});

// Modales
els.btnNewModel.addEventListener("click", () => {
  els.formNewModel.reset();
  els.modalNewModel.classList.remove("hidden");
});

els.btnNewColumn.addEventListener("click", () => {
  els.formNewColumn.reset();
  els.modalNewColumn.classList.remove("hidden");
});

document.addEventListener("click", (e) => {
  const closeId = e.target.dataset?.close;
  if (closeId) {
    document.getElementById(closeId)?.classList.add("hidden");
  }
  if (e.target.classList.contains("modal-backdrop")) {
    e.target.classList.add("hidden");
  }
});

els.formNewModel.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(els.formNewModel);
  const payload = Object.fromEntries(fd.entries());
  try {
    const created = await apiFetch("/api/componentes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    state.componentes.push(created);
    if (!state.categorias.includes(created.categoria)) {
      state.categorias.push(created.categoria);
      syncCategoriasDatalist();
      syncQuickFilterOptions();
    }
    els.modalNewModel.classList.add("hidden");
    render();
    window.Maqueta3D?.refreshCatalog();
    showToast(`Modelo "${created.modelo}" agregado`);
  } catch (err) {
    showToast(err.message);
  }
});

els.formNewColumn.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(els.formNewColumn);
  const label = fd.get("label");
  try {
    const col = await apiFetch("/api/columns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    state.customColumns.push(col);
    els.modalNewColumn.classList.add("hidden");
    render();
    showToast(`Columna "${col.label}" agregada`);
  } catch (err) {
    showToast(err.message);
  }
});

// Guardar Usos y Consideraciones
els.btnSaveUsos.addEventListener("click", async () => {
  if (!state.usosTargetId) return;
  const val = els.usosTextarea.value.trim();
  try {
    const updated = await apiFetch(`/api/componentes/${state.usosTargetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field: "usos", value: val }),
    });
    replaceComponenteInState(updated);
    els.usosPreview.textContent = val || "Sin usos ni consideraciones registradas aún.";
    render();
    showToast("Usos y consideraciones guardados");
  } catch (err) {
    showToast(err.message);
  }
});

/* ==================== Calculadora Energética ==================== */

function syncEnergyDriversDatalist() {
  const drivers = state.componentes.filter(
    (c) =>
      c.categoria === "Drivers" ||
      c.categoria === "Reguladores y Alimentación"
  );
  els.energyDriversList.innerHTML = drivers
    .map((d) => `<option value="${escapeHtml(d.modelo)}"></option>`)
    .join("");
}

function parseMaxCurrentMa(specsText) {
  if (!specsText) return { avgMa: 150, peakMa: 400 };
  // Buscar patrones tipo "500mA", "2.5A", "1.5A" cerca de I máx o al final
  const maMatch = specsText.match(/(\d+(?:\.\d+)?)\s*mA/i);
  if (maMatch) {
    const peak = Math.round(Number(maMatch[1]));
    return { avgMa: Math.max(10, Math.round(peak * 0.35)), peakMa: peak };
  }
  const aMatch = specsText.match(/(\d+(?:\.\d+)?)\s*A\b/i);
  if (aMatch) {
    const peak = Math.round(Number(aMatch[1]) * 1000);
    return { avgMa: Math.max(50, Math.round(peak * 0.3)), peakMa: peak };
  }
  return { avgMa: 150, peakMa: 400 };
}

function renderEnergyLoads() {
  syncEnergyDriversDatalist();
  els.energyLoadsBody.innerHTML = state.energyLoads
    .map(
      (item, idx) => `
      <tr>
        <td><input type="text" data-energy-idx="${idx}" data-key="name" value="${escapeHtml(item.name)}" /></td>
        <td style="width:70px"><input type="number" min="1" step="1" data-energy-idx="${idx}" data-key="qty" value="${item.qty}" /></td>
        <td style="width:130px"><input type="number" min="0" step="10" data-energy-idx="${idx}" data-key="avgMa" value="${item.avgMa}" /></td>
        <td style="width:130px"><input type="number" min="0" step="50" data-energy-idx="${idx}" data-key="peakMa" value="${item.peakMa}" /></td>
        <td><input type="text" list="energyDriversList" data-energy-idx="${idx}" data-key="driver" value="${escapeHtml(item.driver || "")}" placeholder="Escoge o escribe..." /></td>
        <td style="width:42px; text-align:center;">
          <button type="button" class="btn-danger btn-sm" data-energy-del="${idx}" title="Quitar">&times;</button>
        </td>
      </tr>`
    )
    .join("");
  calculateEnergy();
}

function calculateEnergy() {
  const battV = Math.max(0.1, Number(els.energyBattV.value) || 0);
  const battMah = Math.max(1, Number(els.energyBattMah.value) || 0);
  const battC = Math.max(0.1, Number(els.energyBattC.value) || 0);
  const effPct = Math.min(100, Math.max(10, Number(els.energyEfficiency.value) || 80));

  let totalAvgMa = 0;
  let totalPeakMa = 0;
  for (const row of state.energyLoads) {
    const q = Math.max(0, Number(row.qty) || 0);
    totalAvgMa += q * Math.max(0, Number(row.avgMa) || 0);
    totalPeakMa += q * Math.max(0, Number(row.peakMa) || 0);
  }

  const totalAvgA = totalAvgMa / 1000;
  const totalPeakA = totalPeakMa / 1000;
  const avgWatts = battV * totalAvgA;
  const usableMah = battMah * (effPct / 100);
  const battMaxDischargeA = (battMah / 1000) * battC;

  const formatCurrent = (ma) =>
    ma >= 1000 ? `${(ma / 1000).toFixed(2)} A` : `${Math.round(ma)} mA`;

  let runtimeText = "∞";
  let runtimeClass = "good";
  if (totalAvgMa > 0) {
    const hours = usableMah / totalAvgMa;
    const totalMins = Math.round(hours * 60);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    runtimeText = `${h} h + ${m} min`;
    if (hours < 0.4) runtimeClass = "bad";
    else if (hours < 1.2) runtimeClass = "warn";
  }

  const peakOk = totalPeakA <= battMaxDischargeA;
  const alertHtml = peakOk
    ? `<div class="energy-alert ok">✓ La batería soporta los picos (${formatCurrent(totalPeakMa)} &le; ${battMaxDischargeA.toFixed(1)} A máx).</div>`
    : `<div class="energy-alert warn">⚠ Peligro de brownout: el pico (${formatCurrent(totalPeakMa)}) supera la descarga máx. (${battMaxDischargeA.toFixed(1)} A).</div>`;

  els.energyResults.innerHTML = `
    <div class="energy-stat">
      <div class="energy-stat-label">Duración Esperada</div>
      <div class="energy-stat-val ${runtimeClass}">${runtimeText}</div>
    </div>
    <div class="energy-stat">
      <div class="energy-stat-label">Consumo Promedio</div>
      <div class="energy-stat-val">${formatCurrent(totalAvgMa)} · ${avgWatts.toFixed(1)} W</div>
    </div>
    <div class="energy-stat">
      <div class="energy-stat-label">Pico Máximo</div>
      <div class="energy-stat-val ${peakOk ? "good" : "bad"}">${formatCurrent(totalPeakMa)}</div>
    </div>
    <div class="energy-stat">
      <div class="energy-stat-label">Descarga Máx. (${battC}C)</div>
      <div class="energy-stat-val">${battMaxDischargeA.toFixed(1)} A (${(battV * (battMah / 1000)).toFixed(1)} Wh)</div>
    </div>
    ${alertHtml}
  `;
}

els.btnEnergyCalc.addEventListener("click", () => {
  renderEnergyLoads();
  els.modalEnergy.classList.remove("hidden");
});

els.energyBatteryPreset.addEventListener("change", () => {
  const val = els.energyBatteryPreset.value;
  if (!val) return;
  const [v, mah, c, eff] = val.split(",");
  els.energyBattV.value = v;
  els.energyBattMah.value = mah;
  els.energyBattC.value = c;
  els.energyEfficiency.value = eff;
  calculateEnergy();
});

[els.energyBattV, els.energyBattMah, els.energyBattC, els.energyEfficiency].forEach((inp) => {
  inp.addEventListener("input", calculateEnergy);
});

els.energyLoadPreset.addEventListener("change", () => {
  const val = els.energyLoadPreset.value;
  if (!val) return;
  const [name, qty, avgMa, peakMa] = val.split(",");
  state.energyLoads.push({
    name,
    qty: Number(qty),
    avgMa: Number(avgMa),
    peakMa: Number(peakMa),
    driver: "",
  });
  els.energyLoadPreset.value = "";
  renderEnergyLoads();
});

function populateLoadCategories() {
  els.loadCatSelect.innerHTML = state.categorias
    .map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
    .join("");
  populateLoadComponents();
}

function populateLoadComponents() {
  const cat = els.loadCatSelect.value;
  const items = state.componentes.filter((c) => c.categoria === cat);
  els.loadCompSelect.innerHTML = items
    .map((c) => `<option value="${c.id}">${escapeHtml(c.modelo)}</option>`)
    .join("");
  applySelectedCatalogLoad();
}

function applySelectedCatalogLoad() {
  const id = Number(els.loadCompSelect.value);
  const comp = state.componentes.find((c) => c.id === id);
  if (!comp) return;
  els.loadNameInput.value = comp.modelo;
  const parsed = parseMaxCurrentMa(comp.especificaciones);
  els.loadAvgMaInput.value = parsed.avgMa;
  els.loadPeakMaInput.value = parsed.peakMa;
}

function setAddLoadMode(mode) {
  const isCatalog = mode === "catalog";
  els.btnLoadModeCatalog.classList.toggle("active", isCatalog);
  els.btnLoadModeManual.classList.toggle("active", !isCatalog);
  els.loadCatalogPickers.classList.toggle("hidden", !isCatalog);
  if (isCatalog) {
    populateLoadCategories();
  } else {
    els.loadNameInput.value = "";
    els.loadAvgMaInput.value = 150;
    els.loadPeakMaInput.value = 400;
    els.loadDriverInput.value = "";
    els.loadNameInput.focus();
  }
}

els.btnAddEnergyRow.addEventListener("click", () => {
  syncEnergyDriversDatalist();
  els.loadQtyInput.value = 1;
  els.loadDriverInput.value = "";
  setAddLoadMode("catalog");
  els.modalAddEnergyLoad.classList.remove("hidden");
});

els.btnLoadModeCatalog.addEventListener("click", () => setAddLoadMode("catalog"));
els.btnLoadModeManual.addEventListener("click", () => setAddLoadMode("manual"));
els.loadCatSelect.addEventListener("change", populateLoadComponents);
els.loadCompSelect.addEventListener("change", applySelectedCatalogLoad);

els.formAddEnergyLoad.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = els.loadNameInput.value.trim();
  if (!name) return;
  state.energyLoads.push({
    name,
    qty: Math.max(1, Number(els.loadQtyInput.value) || 1),
    avgMa: Math.max(0, Number(els.loadAvgMaInput.value) || 0),
    peakMa: Math.max(0, Number(els.loadPeakMaInput.value) || 0),
    driver: els.loadDriverInput.value.trim(),
  });
  els.modalAddEnergyLoad.classList.add("hidden");
  renderEnergyLoads();
});

els.energyLoadsBody.addEventListener("input", (e) => {
  const idx = e.target.dataset?.energyIdx;
  const key = e.target.dataset?.key;
  if (idx === undefined || !key) return;
  const i = Number(idx);
  state.energyLoads[i][key] = key === "name" || key === "driver" ? e.target.value : Number(e.target.value);
  calculateEnergy();
});

els.energyLoadsBody.addEventListener("click", (e) => {
  const del = e.target.dataset?.energyDel;
  if (del === undefined) return;
  state.energyLoads.splice(Number(del), 1);
  renderEnergyLoads();
});

// Puente hacia Maqueta 3D
window.getCatalogData = () => ({
  componentes: state.componentes,
  categorias: state.categorias,
});

els.btnMaqueta3D.addEventListener("click", () => {
  if (window.Maqueta3D) {
    window.Maqueta3D.open();
  } else {
    showToast("El módulo 3D aún está cargando...");
  }
});

// Inicializar
loadData();
