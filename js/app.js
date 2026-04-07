// =========================================
// Archivo: js/app.js (MEMORIA BLINDADA + CATÁLOGOS + CRUD ELIMINAR)
// =========================================

const state = JSON.parse(localStorage.getItem('fiberplus_listas')) || {
  cables: [],
  materials: [],
  tools: []
};

// 1. AUTOGUARDADO TOTAL
['input', 'change'].forEach(evt => {
  document.addEventListener(evt, function(e) {
    if(['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) {
        if(e.target.type !== 'file' && e.target.id && !['toolGroup', 'toolName', 'materialGroup', 'materialType'].includes(e.target.id)) {
            localStorage.setItem('fp_input_' + e.target.id, e.target.value);
        }
    }
  });
});

// 2. RECUPERAR DATOS AL ABRIR LA PÁGINA
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('input, select, textarea').forEach(el => {
      if(el.id && el.type !== 'file' && !['toolGroup', 'toolName', 'materialGroup', 'materialType'].includes(el.id)) {
          let saved = localStorage.getItem('fp_input_' + el.id);
          if(saved) {
              el.value = saved;
              el.dispatchEvent(new Event('change', { bubbles: true }));
          }
      }
  });
  
  if(getEl('cable-list')) renderCableList();
  if(getEl('group-material-list')) renderGroupMaterialList();
  if(getEl('tool-list')) renderToolList();
});

// ==================== LISTA DE CATÁLOGOS COMPLETOS ====================
const groupOptions = {
  "Amarras o correas plásticas": ["10 cm", "15 cm", "35 cm", "55 cm"],
  "Anillos / argollas": ["Anillo de distribución o virolas", "Argollas de dispersión","Otro"],
  "Brazo farol": ["0.50 m", "1 m", "1,50 m", "2 m", "Otro"],
  "Cajas / NAP": ["Caja de distribución NAP de 16 puertos", "Otro"],
  "Cintas": ["Eriban rollo x 30 m 1/2", "Eriban rollo x 30 m 3/4", "Otro"],
  "Espirales": ["Espiral blanco x 10 m 1/4 - 6mm", "Espiral blanco x 10 m 3/8 - 9mm", "Otro"],
  "Galerías / soportes": ["Galería porta reserva", "Otro"],
  "Grilletes / guardacabos": ["Grilletes para cruce americano", "Guardacabo tipo U", "Thimble clevis (Guardacabo)", "Otro"],
  "Hebillas": ["Hebilla para cinta eriban 1/2", "Hebilla para cinta eriban 3/4", "Otro"],
  "Herrajes": ["Retención H1", "Retención H2", "Retención H3", "Retención H4", "B (Cónico)", "D (HD)", "Crucero para cruce americano", "Otro"],
  "Identificadores": ["Identificador acrílico 12,50 cm x 6 cm azul", "Otro"],
  "Kits de bajante": ["Kit de bajante de poste 3\" - 2 m", "Otro"],
  "Mangas porta splitter": ["48 a 96 hilos", "144 hilos", "Otro"],
  "Mangueras / manguitas": ["Manguera corrugada 3/4\" abr EMT", "Manguita termocontraíble de 40 mm", "Otro"],
  "ODF (N° de puertos con pacheo lateral)": ["48", "96", "Otro"],
  "Postes": ["11 m x 350 kg", "12 m x 500 kg", "Otro"],
  "Preformados": ["Curvo para cable acero", "Helicoidal (11,8 - 12,6 mm)", "Helicoidal (12,6 - 13,1 mm)", "Otro"],
  "Rack": ["Rack de piso 2,2 m 19\"", "Otro"],
  "Rondín": ["Rondín", "Otro"],
  "Splitters (1/8)": ["Conectorizado NAP", "No conectorizado", "Otro"]
};

const toolCatalog = {
  "EPP y seguridad": ["Casco", "Gorra", "Botas de seguridad", "Gafas", "Guantes multiflex", "Guantes de vaqueta", "Guantes nitrilo", "Botas de caucho", "Chaleco con reflectivo", "Cinturón de seguridad", "Botiquín primeros auxilios Tipo B"],
  "Ropa de trabajo": ["Camisa", "Chaqueta", "Pantalón"],
  "Herramientas manuales": ["Alicate universal aislado", "Segueta con marco", "Machete para poda", "Bisturí industrial", "Cinta métrica 50 mts", "Cortafrío industrial", "Cortatubo", "Cuchillo en acero inoxidable de 4\"", "Juego de destornilladores estrella y pala", "Juego de destornilladores perilleros", "Llave de expansión No. 10", "Llaves fijas varias medidas", "Martillo", "Pala con palo", "Pico con palo", "Pinzas con punta para corte", "Barras"],
  "Herramientas de corte": ["Cortadora", "Cizalla"],
  "Herramientas de medición": ["Multímetro AC/DC rango automático"],
  "Herramientas eléctricas": ["Taladro percutor", "Extensión eléctrica de 20 mts", "Inversor", "Bomba de succión"],
  "Equipos de fibra óptica": ["Empalmadora de fusión por arco eléctrico", "OTDR de rango dinámico 40 dB", "Power Meter PON", "Bobina de lanzamiento 1000 m", "Portabobinas"],
  "Equipos de apoyo en campo": ["Escalera", "Linterna tipo minero y de mano", "Linterna con pilas", "Malacate (tensión mensajero)", "Antenalla / sapo / mordaza para tensión", "Zunchadora para cinta band-it", "Pértiga"],
  "Señalización y trabajo en vía": ["Conos", "Cinta de advertencia"],
  "Oficina y apoyo administrativo": ["Laptop", "Juego de útiles de escritorio", "Muebles de oficina"]
};

// ==================== FUNCIONES DE APOYO ====================
function getEl(id) { return document.getElementById(id); }
function getValue(id) { const el = getEl(id); return el ? String(el.value ?? "").trim() : ""; }
function saveState() { localStorage.setItem('fiberplus_listas', JSON.stringify(state)); }

function showToast(message, type = "success") {
  let toast = document.querySelector(".message-toast");
  if (!toast) { toast = document.createElement("div"); toast.className = "message-toast"; document.body.appendChild(toast); }
  toast.textContent = message; toast.className = `message-toast ${type} show`;
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ==================== LÓGICA DE CABLES ====================
function switchCableType(type) {
  document.querySelectorAll(".selector-tab").forEach(tab => tab.classList.remove("active"));
  const activeTab = document.querySelector(`.selector-tab[data-cable="${type}"]`);
  if (activeTab) activeTab.classList.add("active");
  document.querySelectorAll(".cable-form").forEach(form => form.classList.remove("active"));
  const activeForm = getEl(`form-${type}`);
  if (activeForm) activeForm.classList.add("active");
}

function addCable(type) {
  let item = {};
  if (type === "fibra") {
    const tipo = getValue("fibraTipo"), bobina = getValue("fibraBobina"), hilos = getValue("fibraHilos"), despacho = getValue("fibraDespacho"), utilizado = getValue("fibraUtilizado"), puntoInicial = getValue("fibraPuntoInicial"), puntoFinal = getValue("fibraPuntoFinal"), devuelto = getValue("fibraDevuelto");
    if (!tipo && !bobina && !hilos && !despacho && !utilizado && !puntoInicial && !puntoFinal && !devuelto) return showToast("Ingresa al menos un dato", "warning");
    item = { seccion: "Cable", categoria: "Fibra óptica", tipo: tipo || "-", detalle: bobina ? `Bobina: ${bobina}` : "-", hilos: hilos || "-", despacho: despacho || "0", utilizado: utilizado || "0", puntoInicial: puntoInicial || "0", puntoFinal: puntoFinal || "0", devuelto: devuelto || "0" };
  } else if (type === "cobre") {
    const tipo = getValue("cobreTipo"), despacho = getValue("cobreDespacho"), utilizado = getValue("cobreUtilizado"), puntoInicial = getValue("cobrePuntoInicial"), puntoFinal = getValue("cobrePuntoFinal"), devuelto = getValue("cobreDevuelto");
    if (!tipo && !despacho && !utilizado && !puntoInicial && !puntoFinal && !devuelto) return showToast("Ingresa al menos un dato", "warning");
    item = { seccion: "Cable", categoria: "Cable cobre", tipo: tipo || "-", detalle: "-", hilos: "-", despacho: despacho || "0", utilizado: utilizado || "0", puntoInicial: puntoInicial || "0", puntoFinal: puntoFinal || "0", devuelto: devuelto || "0" };
  } else if (type === "acerado") {
    const despacho = getValue("aceradoM1"), utilizado = getValue("aceradoM2");
    if (!despacho && !utilizado) return showToast("Ingresa al menos un dato", "warning");
    item = { seccion: "Cable", categoria: "Cable acerado", tipo: "-", detalle: "-", hilos: "-", despacho: despacho || "0", utilizado: utilizado || "0", puntoInicial: "0", puntoFinal: "0", devuelto: "0" };
  }
  
  state.cables.push(item); saveState(); renderCableList();
  showToast(`${item.categoria} agregado correctamente`, "success");
  
  document.querySelectorAll(`#form-${type} input, #form-${type} select`).forEach(el => {
      el.value = ''; localStorage.removeItem('fp_input_' + el.id);
  });
}

function deleteCable(index) {
  if(confirm("¿Estás seguro de eliminar este cable de la lista?")) {
    state.cables.splice(index, 1);
    saveState(); renderCableList(); showToast("Cable eliminado", "info");
  }
}

function renderCableList() {
  const container = getEl("cable-list");
  if (!container) return;
  if (!state.cables.length) { container.innerHTML = '<div class="empty-state"><i class="fas fa-plug"></i><br>No hay cables registrados aún</div>'; return; }
  
  const rows = state.cables.map((item, idx) => `
    <tr>
      <td>${idx + 1}</td><td>${item.categoria}</td>
      <td>${item.tipo !== "-" ? item.tipo : ""} ${item.detalle !== "-" ? item.detalle : ""}</td>
      <td>${item.hilos !== "-" ? `${item.hilos} hilos` : "-"}</td>
      <td>${item.despacho !== "0" ? `${item.despacho} m` : "-"}</td>
      <td>${item.utilizado !== "0" ? `${item.utilizado} m` : "-"}</td>
      <td class="actions-col"><button class="btn-delete-row" onclick="deleteCable(${idx})" title="Eliminar"><i class="fas fa-trash-alt"></i></button></td>
    </tr>`).join("");
    
  container.innerHTML = `<div class="list-wrap"><table class="list-table"><thead><tr><th>#</th><th>Tipo</th><th>Detalle</th><th>Hilos</th><th>Despacho</th><th>Usado</th><th class="actions-col">Acción</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

// ==================== LÓGICA DE MATERIALES ====================
function handleGroupChange() {
  const group = getValue("materialGroup"), typeSelect = getEl("materialType");
  if (!typeSelect) return;
  typeSelect.innerHTML = '<option value="">Seleccione...</option>';
  const options = groupOptions[group] || [];
  options.forEach(option => { const opt = document.createElement("option"); opt.value = option; opt.textContent = option; typeSelect.appendChild(opt); });
  
  const extGroup = getEl("brazoFarolExtensionGroup");
  if(extGroup) extGroup.style.display = (group === "Brazo farol") ? "block" : "none";
}

function handleMaterialTypeChange() {
  const group = getValue("materialGroup"), type = getValue("materialType"), otherInput = getEl("materialOther");
  if (!otherInput) return;
  if (type.toUpperCase() === "OTRO") { otherInput.placeholder = "Especifique cuál..."; } 
  else { otherInput.placeholder = "Solo si no está en la lista"; otherInput.value = ""; }
}

function addGroupMaterial() {
  const group = getValue("materialGroup"), type = getValue("materialType"), other = getValue("materialOther"), qty = getValue("materialQty"), obs = getValue("materialObs");
  if (!group || !qty) return showToast("Por favor selecciona el material y pon la cantidad", "warning");
  let finalType = type.toUpperCase() === "OTRO" || !type ? other : type;
  
  state.materials.push({ seccion: "Material", grupo: group, tipo: finalType || "-", cantidad: qty, observacion: obs || "-" });
  saveState(); renderGroupMaterialList(); showToast("Material agregado", "success");
  
  ["materialGroup", "materialType", "materialQty", "materialOther", "materialObs"].forEach(id => {
      let el = getEl(id); if(el) { el.value = ""; localStorage.removeItem('fp_input_' + id); }
  });
}

function deleteMaterial(index) {
  if(confirm("¿Estás seguro de eliminar este material de la lista?")) {
    state.materials.splice(index, 1);
    saveState(); renderGroupMaterialList(); showToast("Material eliminado", "info");
  }
}

function renderGroupMaterialList() {
  const container = getEl("group-material-list");
  if (!container) return;
  if (!state.materials.length) { container.innerHTML = '<div class="empty-state"><i class="fas fa-boxes"></i><br>No hay materiales registrados aún</div>'; return; }
  
  const rows = state.materials.map((item, idx) => `
    <tr>
      <td>${idx + 1}</td><td>${item.grupo}</td><td>${item.tipo}</td>
      <td><strong>${item.cantidad}</strong> und</td><td>${item.observacion}</td>
      <td class="actions-col"><button class="btn-delete-row" onclick="deleteMaterial(${idx})" title="Eliminar"><i class="fas fa-trash-alt"></i></button></td>
    </tr>`).join("");
    
  container.innerHTML = `<div class="list-wrap"><table class="list-table"><thead><tr><th>#</th><th>Grupo</th><th>Detalle</th><th>Cantidad</th><th>Observación</th><th class="actions-col">Acción</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

// ==================== LÓGICA DE HERRAMIENTAS ====================
function handleToolGroupChange() {
  const group = getValue("toolGroup"), toolSelect = getEl("toolName"), otherDiv = getEl("divOtraHerramienta");
  if (!toolSelect) return;
  toolSelect.innerHTML = '<option value="">Seleccione...</option>';
  const options = toolCatalog[group] || [];
  options.forEach(option => { const opt = document.createElement("option"); opt.value = option; opt.textContent = option; toolSelect.appendChild(opt); });
  if (group) { const opt = document.createElement("option"); opt.value = "OTRA_HERRAMIENTA"; opt.textContent = "Otro"; toolSelect.appendChild(opt); }
  if (otherDiv) otherDiv.style.display = "none";
}

function mostrarCampoOtraHerramienta() {
  const sel = getValue("toolName"), otherDiv = getEl("divOtraHerramienta");
  if (otherDiv) otherDiv.style.display = (sel === "OTRA_HERRAMIENTA") ? "block" : "none";
}

function addTool() {
  const group = getValue("toolGroup"), tool = getValue("toolName"), custom = getValue("otraHerramienta"), qty = getValue("toolQty"), obs = getValue("toolObs");
  if (!group || !tool || !qty) return showToast("Por favor selecciona herramienta y cantidad", "warning");
  let finalTool = tool === "OTRA_HERRAMIENTA" ? custom : tool;

  state.tools.push({ seccion: "Herramientas", grupo: group, herramienta: finalTool, cantidad: qty, observacion: obs || "-" });
  saveState(); renderToolList(); showToast("Herramienta agregada", "success");

  ["toolGroup", "toolName", "toolQty", "otraHerramienta", "toolObs"].forEach(id => {
      let el = getEl(id); if(el) { el.value = ""; localStorage.removeItem('fp_input_' + id); }
  });
}

function deleteTool(index) {
  if(confirm("¿Estás seguro de eliminar esta herramienta de la lista?")) {
    state.tools.splice(index, 1);
    saveState(); renderToolList(); showToast("Herramienta eliminada", "info");
  }
}

function renderToolList() {
  const container = getEl("tool-list");
  if (!container) return;
  if (!state.tools.length) { container.innerHTML = '<div class="empty-state"><i class="fas fa-tools"></i><br>No hay herramientas registradas aún</div>'; return; }
  
  const rows = state.tools.map((item, idx) => `
    <tr>
      <td>${idx + 1}</td><td>${item.grupo}</td><td>${item.herramienta}</td>
      <td><strong>${item.cantidad}</strong> und</td><td>${item.observacion}</td>
      <td class="actions-col"><button class="btn-delete-row" onclick="deleteTool(${idx})" title="Eliminar"><i class="fas fa-trash-alt"></i></button></td>
    </tr>`).join("");
    
  container.innerHTML = `<div class="list-wrap"><table class="list-table"><thead><tr><th>#</th><th>Grupo</th><th>Herramienta</th><th>Cantidad</th><th>Observación</th><th class="actions-col">Acción</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

// ==================== LIMPIEZA GLOBAL ====================
function resetAll() {
  if (!confirm("⚠️ ¿Seguro que quieres limpiar todo el sistema y empezar desde cero?")) return;
  localStorage.clear();
  window.location.href = "1_datos.html";
}