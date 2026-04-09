// =========================================
// Archivo: js/app.js (VERSIÓN PRO FINAL: COMPRESIÓN DE FOTOS)
// =========================================

const state = JSON.parse(localStorage.getItem('fiberplus_listas')) || {
  cables: [],
  materials: [],
  tools: []
};

// 1. MOTOR DE COMPRESIÓN: Reduce el peso de las fotos al 70% antes de enviarlas
async function convertirImagen(inputId) {
  const input = getEl(inputId);
  if (!input || !input.files || input.files.length === 0) return "";
  
  const file = input.files[0];
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        // Reducimos el ancho a 800px para que el Excel no colapse
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800; 
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Comprime la imagen en JPG con calidad del 70%
        const base64Comprimido = canvas.toDataURL("image/jpeg", 0.7);
        resolve(base64Comprimido);
      };
      img.onerror = () => resolve("");
    };
    reader.onerror = () => resolve("");
  });
}

// 2. AUTOGUARDADO DE TEXTO
['input', 'change'].forEach(evt => {
  document.addEventListener(evt, function(e) {
    if(['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) {
        if(e.target.type !== 'file' && e.target.id && !['toolGroup', 'toolName', 'materialGroup', 'materialType'].includes(e.target.id)) {
            localStorage.setItem('fp_input_' + e.target.id, e.target.value);
        }
    }
  });
});

// 3. RECUPERAR DATOS AL ABRIR
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

// ==================== CATÁLOGOS ====================
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

// ==================== LÓGICA DE CABLES ====================
function switchCableType(type) {
  document.querySelectorAll(".selector-tab").forEach(tab => tab.classList.remove("active"));
  document.querySelector(`.selector-tab[data-cable="${type}"]`).classList.add("active");
  document.querySelectorAll(".cable-form").forEach(form => form.classList.remove("active"));
  getEl(`form-${type}`).classList.add("active");
}

async function addCable(type) {
  const btn = event.currentTarget;
  const textoOriginal = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESANDO FOTOS...';
  btn.disabled = true;

  let item = {};
  if (type === "fibra") {
    item = {
      seccion: "Cable", categoria: "Fibra óptica", tipo: getValue("fibraTipo"), detalle: getValue("fibraBobina"),
      hilos: getValue("fibraHilos"), despacho: getValue("fibraDespacho"), utilizado: getValue("fibraUtilizado"),
      puntoInicial: getValue("fibraPuntoInicial"), puntoFinal: getValue("fibraPuntoFinal"), devuelto: getValue("fibraDevuelto"),
      fotoDespacho: await convertirImagen("fibraFotoDespacho"), fotoDevuelto: await convertirImagen("fibraFotoDevuelto"),
      fotoInicial: await convertirImagen("fibraFotoInicial"), fotoFinal: await convertirImagen("fibraFotoFinal")
    };
  } else if (type === "cobre") {
    item = {
      seccion: "Cable", categoria: "Cable cobre", tipo: getValue("cobreTipo"), despacho: getValue("cobreDespacho"),
      utilizado: getValue("cobreUtilizado"), puntoInicial: getValue("cobrePuntoInicial"), puntoFinal: getValue("cobrePuntoFinal"),
      devuelto: getValue("cobreDevuelto"),
      fotoDespacho: await convertirImagen("cobreFotoDespacho"), fotoDevuelto: await convertirImagen("cobreFotoDevuelto"),
      fotoInicial: await convertirImagen("cobreFotoInicial"), fotoFinal: await convertirImagen("cobreFotoFinal")
    };
  } else if (type === "acerado") {
    item = {
      seccion: "Cable", categoria: "Cable acerado", despacho: getValue("aceradoM1"), utilizado: getValue("aceradoM2"),
      fotoDespacho: await convertirImagen("aceradoFotoDespacho"), fotoInicial: await convertirImagen("aceradoFotoUtilizado"),
      fotoDevuelto: "", fotoFinal: ""
    };
  }

  state.cables.push(item);
  saveState();
  renderCableList();
  showToast("Cable y fotos agregados correctamente");
  
  btn.innerHTML = textoOriginal;
  btn.disabled = false;
  document.querySelectorAll(`#form-${type} input`).forEach(el => el.value = "");
}

function renderCableList() {
  const container = getEl("cable-list");
  if (!container) return;
  if (!state.cables.length) { container.innerHTML = '<div class="empty-state"><i class="fas fa-plug"></i><br>No hay cables registrados aún</div>'; return; }
  const rows = state.cables.map((item, idx) => `<tr><td>${idx + 1}</td><td>${item.categoria}</td><td>${item.tipo} ${item.detalle}</td><td>${item.hilos}</td><td>${item.despacho} m</td><td>${item.utilizado} m</td><td class="actions-col"><button class="btn-delete-row" onclick="deleteCable(${idx})"><i class="fas fa-trash-alt"></i></button></td></tr>`).join("");
  container.innerHTML = `<div class="list-wrap"><table class="list-table"><thead><tr><th>#</th><th>Tipo</th><th>Detalle</th><th>Hilos</th><th>Despacho</th><th>Usado</th><th>Acción</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function deleteCable(i) { if(confirm("¿Eliminar?")) { state.cables.splice(i, 1); saveState(); renderCableList(); } }

// ==================== LÓGICA DE MATERIALES ====================
function handleGroupChange() {
  const group = getValue("materialGroup"), typeSelect = getEl("materialType");
  typeSelect.innerHTML = '<option value="">Seleccione...</option>';
  (groupOptions[group] || []).forEach(opt => { const o = document.createElement("option"); o.value = opt; o.textContent = opt; typeSelect.appendChild(o); });
  if(getEl("brazoFarolExtensionGroup")) getEl("brazoFarolExtensionGroup").style.display = (group === "Brazo farol") ? "block" : "none";
}

function handleMaterialTypeChange() {
  const type = getValue("materialType"), other = getEl("materialOther");
  if(other) other.placeholder = (type.toUpperCase() === "OTRO") ? "Especifique cuál..." : "Solo si no está en la lista";
}

function addGroupMaterial() {
  const group = getValue("materialGroup"), qty = getValue("materialQty");
  if (!group || !qty) return showToast("Faltan datos", "warning");
  const type = getValue("materialType").toUpperCase() === "OTRO" ? getValue("materialOther") : getValue("materialType");
  state.materials.push({ seccion: "Material", grupo: group, tipo: type || "-", cantidad: qty, observacion: getValue("materialObs") || "-" });
  saveState(); renderGroupMaterialList();
  ["materialGroup", "materialType", "materialQty", "materialOther", "materialObs"].forEach(id => { if(getEl(id)) getEl(id).value = ""; });
}

function renderGroupMaterialList() {
  const container = getEl("group-material-list");
  if (!container || !state.materials.length) return;
  const rows = state.materials.map((item, idx) => `<tr><td>${idx+1}</td><td>${item.grupo}</td><td>${item.tipo}</td><td>${item.cantidad}</td><td>${item.observacion}</td><td class="actions-col"><button class="btn-delete-row" onclick="deleteMat(${idx})"><i class="fas fa-trash-alt"></i></button></td></tr>`).join("");
  container.innerHTML = `<div class="list-wrap"><table class="list-table"><thead><tr><th>#</th><th>Grupo</th><th>Detalle</th><th>Cant.</th><th>Obs.</th><th>Acción</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function deleteMat(i) { state.materials.splice(i, 1); saveState(); renderGroupMaterialList(); }

// ==================== LÓGICA DE HERRAMIENTAS ====================
function handleToolGroupChange() {
  const group = getValue("toolGroup"), toolSelect = getEl("toolName");
  toolSelect.innerHTML = '<option value="">Seleccione...</option>';
  (toolCatalog[group] || []).forEach(opt => { const o = document.createElement("option"); o.value = opt; o.textContent = opt; toolSelect.appendChild(o); });
}

function addTool() {
  const tool = getValue("toolName"), qty = getValue("toolQty");
  if (!tool || !qty) return showToast("Faltan datos", "warning");
  state.tools.push({ seccion: "Herramientas", grupo: getValue("toolGroup"), herramienta: tool, cantidad: qty, observacion: getValue("toolObs") || "-" });
  saveState(); renderToolList();
  ["toolGroup", "toolName", "toolQty", "toolObs"].forEach(id => { if(getEl(id)) getEl(id).value = ""; });
}

function renderToolList() {
  const container = getEl("tool-list");
  if (!container || !state.tools.length) return;
  const rows = state.tools.map((item, idx) => `<tr><td>${idx+1}</td><td>${item.grupo}</td><td>${item.herramienta}</td><td>${item.cantidad}</td><td>${item.observacion}</td><td class="actions-col"><button class="btn-delete-row" onclick="deleteTool(${idx})"><i class="fas fa-trash-alt"></i></button></td></tr>`).join("");
  container.innerHTML = `<div class="list-wrap"><table class="list-table"><thead><tr><th>#</th><th>Grupo</th><th>Herramienta</th><th>Cant.</th><th>Obs.</th><th>Acción</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function deleteTool(i) { state.tools.splice(i, 1); saveState(); renderToolList(); }

// ==================== GLOBALES ====================
function getEl(id) { return document.getElementById(id); }
function getValue(id) { return getEl(id) ? getEl(id).value.trim() : ""; }
function saveState() { localStorage.setItem('fiberplus_listas', JSON.stringify(state)); }
function showToast(m, t="success") { 
  let toast = document.querySelector(".message-toast");
  if(!toast) { toast = document.createElement("div"); toast.className="message-toast"; document.body.appendChild(toast); }
  toast.textContent = m; toast.className = `message-toast ${t} show`;
  setTimeout(()=>toast.classList.remove("show"), 3000);
}
function resetAll() { if(confirm("¿Limpiar todo?")) { localStorage.clear(); location.href="1_datos.html"; } }