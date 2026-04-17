/* ========================================================
   LÓGICA MAESTRA: FORMULARIO VEHÍCULOS (4 PÁGINAS)
======================================================== */

// 1. CONFIGURACIÓN PRINCIPAL
// Aquí pegaremos el link de Google Script en el siguiente paso
const ENDPOINT_URL = ""; 
const DRAFT_KEY = "fiberplus_vehiculo_draft_v1";

// ==========================================
// 2. UTILIDADES VISUALES Y HELPERS
// ==========================================
function getEl(id) { return document.getElementById(id); }

function showToast(message, type = 'success') {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ==========================================
// 3. MEMORIA TEMPORAL (GUARDAR ENTRE PÁGINAS)
// ==========================================
function getDraft() {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
}

function saveToDraft(key, value) {
    const draft = getDraft();
    draft[key] = value;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

// Restaurar los datos si el usuario regresa de página
function restoreState() {
    const draft = getDraft();
    
    // Restaurar Inputs de Texto y Fechas
    const inputs = ['fecha', 'cedula', 'apellidos', 'nombre', 'placa', 'odoInicio', 'odoFinJornada', 'odoFinEvento', 'odoCombustible', 'galones', 'costo'];
    inputs.forEach(id => {
        if (getEl(id) && draft[id]) getEl(id).value = draft[id];
    });

    // Restaurar Radios (Cuadrilla y Jornada)
    if (draft.tipoCuadrilla) {
        let radio = document.querySelector(`input[name="tipoCuadrilla"][value="${draft.tipoCuadrilla}"]`);
        if (radio) {
            radio.checked = true;
            if (typeof mostrarOpciones === 'function') mostrarOpciones(); // Muestra las cajas ocultas
        }
    }
    
    if (draft.tipoJornada) {
        let radio = document.querySelector(`input[name="tipoJornada"][value="${draft.tipoJornada}"]`);
        if (radio) {
            radio.checked = true;
            if (typeof mostrarEvento === 'function') mostrarEvento(); // Muestra las cajas ocultas
        }
    }

    // Restaurar Checkboxes (Trabajos)
    const checks = ['trabajoMantenimiento', 'trabajoInstalacion'];
    checks.forEach(name => {
        if (draft[name]) {
            document.querySelectorAll(`input[name="${name}"]`).forEach(cb => {
                if (draft[name].includes(cb.value)) cb.checked = true;
            });
        }
    });
}

// Configurar que todo lo que se escriba, se guarde al instante
function setupAutoSave() {
    document.querySelectorAll('input:not([type="file"])').forEach(input => {
        input.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                // Lógica especial para guardar múltiples checkboxes
                let checkedValues = Array.from(document.querySelectorAll(`input[name="${e.target.name}"]:checked`)).map(el => el.value);
                saveToDraft(e.target.name, checkedValues);
            } else {
                saveToDraft(e.target.id || e.target.name, e.target.value);
            }
        });
    });
}

// ==========================================
// 4. COMPRESIÓN DE IMÁGENES (PÁGINA 3)
// ==========================================
// Esta función toma la foto del celular, le baja el peso y la convierte a texto (Base64)
async function compressImageAndSave(file, keyName) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200; // Resolución profesional pero ligera
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Comprime al 70% de calidad JPEG
            const base64Data = canvas.toDataURL('image/jpeg', 0.7);
            
            // Extraer solo el código puro de Base64
            const pureBase64 = base64Data.split(',')[1];
            
            // Guardar en la memoria temporal
            saveToDraft(keyName + "_base64", pureBase64);
            saveToDraft(keyName + "_name", file.name);
            showToast('Imagen adjuntada y comprimida con éxito', 'success');
        }
    };
}

// Escuchar cuando el usuario sube una foto
function setupImageCompression() {
    const fileInputs = ['fotoInicio', 'fotoFinJornada', 'fotoFinEvento', 'fotoOdoCombustible', 'fotoComprobante'];
    fileInputs.forEach(id => {
        const el = getEl(id);
        if (el) {
            el.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    showToast('Procesando imagen...', 'warning');
                    compressImageAndSave(file, id);
                }
            });
        }
    });
}

// ==========================================
// 5. ENVÍO FINAL AL SERVIDOR (PÁGINA 4)
// ==========================================
async function enviarAlServidor() {
    const btnEnviar = getEl('btnEnviarFinal');
    const draft = getDraft();

    // 1. Validaciones finales antes de enviar
    if (!draft.gpsLatitud || !draft.gpsLongitud) {
        showToast('Error: Debes capturar el GPS antes de enviar', 'error');
        return;
    }
    if (!ENDPOINT_URL) {
        showToast('Error: Falta configurar el servidor (URL vacía)', 'error');
        return;
    }

    // 2. Cambiar estado del botón
    btnEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ENVIANDO DATOS...';
    btnEnviar.style.opacity = '0.7';
    btnEnviar.disabled = true;

    // 3. Preparar el "Paquete" (Payload) con el formato exacto del ZIP
    const payload = {
        fecha: draft.fecha || '',
        cedula: draft.cedula || '',
        apellidos: draft.apellidos || '',
        nombre: draft.nombre || '',
        placa: draft.placa || '',
        tipoCuadrilla: draft.tipoCuadrilla || '',
        trabajos: draft.trabajoMantenimiento || draft.trabajoInstalacion || [],
        tipoJornada: draft.tipoJornada || '',
        
        odometroInicio: draft.odoInicio || '',
        odometroFinJornada: draft.odoFinJornada || '',
        odometroFinEvento: draft.odoFinEvento || '',
        odometroCombustible: draft.odoCombustible || '',
        galones: draft.galones || '',
        costoTotalUsd: draft.costo || '',
        
        checkDatos: true, // Asumimos true porque está en la última página
        checkEvento: true,
        checkFotos: true,
        
        gps: {
            latitude: draft.gpsLatitud,
            longitude: draft.gpsLongitud,
            accuracyMeters: draft.gpsPrecision,
            timestampIso: new Date().toISOString(),
            mapsUrl: `https://www.google.com/maps/search/?api=1&query=$?q=${draft.gpsLatitud},${draft.gpsLongitud}`
        },
        
        // Imágenes preparadas
        imagenes: {}
    };

    // Añadir imágenes si existen en el borrador
    if (draft.fotoInicio_base64) payload.imagenes.foto_inicio = { base64: draft.fotoInicio_base64, mimeType: 'image/jpeg' };
    if (draft.fotoFinJornada_base64) payload.imagenes.foto_fin_jornada = { base64: draft.fotoFinJornada_base64, mimeType: 'image/jpeg' };
    if (draft.fotoFinEvento_base64) payload.imagenes.foto_fin_evento = { base64: draft.fotoFinEvento_base64, mimeType: 'image/jpeg' };
    if (draft.fotoOdoCombustible_base64) payload.imagenes.foto_odometro_combustible = { base64: draft.fotoOdoCombustible_base64, mimeType: 'image/jpeg' };
    if (draft.fotoComprobante_base64) payload.imagenes.foto_comprobante_pago = { base64: draft.fotoComprobante_base64, mimeType: 'image/jpeg' };

    // 4. Enviar mediante Fetch
    try {
        const response = await fetch(ENDPOINT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            showToast('¡Reporte enviado exitosamente!', 'success');
            btnEnviar.innerHTML = '<i class="fas fa-check"></i> ENVIADO';
            btnEnviar.style.background = '#10b981';
            
            // Limpiar borrador para el siguiente día
            localStorage.removeItem(DRAFT_KEY);
            
            // Redirigir al inicio después de 3 segundos
            setTimeout(() => {
                window.location.href = 'vehiculos.html';
            }, 3000);
            
        } else {
            throw new Error(result.message || 'Error desconocido del servidor');
        }

    } catch (error) {
        showToast('Fallo al enviar: ' + error.message, 'error');
        btnEnviar.innerHTML = '<i class="fas fa-exclamation-triangle"></i> REINTENTAR ENVÍO';
        btnEnviar.style.background = '#ef4444';
        btnEnviar.style.opacity = '1';
        btnEnviar.disabled = false;
    }
}

// ==========================================
// 6. INICIALIZADOR GENERAL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Restaurar datos al abrir cualquier página
    restoreState();
    
    // 2. Activar el auto-guardado
    setupAutoSave();
    
    // 3. Activar compresión de fotos (Solo aplica en la página 3)
    setupImageCompression();

    // 4. Activar restricciones numéricas
    document.querySelectorAll('input[inputmode="numeric"]').forEach(input => {
        input.addEventListener('input', () => { input.value = input.value.replace(/\D+/g, ''); });
    });

    // 5. Configurar Botón de Envío (Solo en la página 4)
    const btnEnviar = getEl('btnEnviarFinal');
    if (btnEnviar) {
        btnEnviar.addEventListener('click', enviarAlServidor);
    }

    // 6. Configurar lógica especial del GPS (Página 4)
    const btnGps = getEl('btnCapturarGps');
    if (btnGps) {
        btnGps.addEventListener('click', function() {
            showToast('Buscando satélites...', 'warning');
            navigator.geolocation.getCurrentPosition(
                function(posicion) {
                    // Mostrar en pantalla
                    getEl('gpsResultados').style.display = 'block';
                    getEl('lblLat').innerText = posicion.coords.latitude;
                    getEl('lblLng').innerText = posicion.coords.longitude;
                    getEl('lblPrecision').innerText = Math.round(posicion.coords.accuracy);
                    
                    // Guardar en la memoria para el envío
                    saveToDraft('gpsLatitud', posicion.coords.latitude);
                    saveToDraft('gpsLongitud', posicion.coords.longitude);
                    saveToDraft('gpsPrecision', Math.round(posicion.coords.accuracy));
                    
                    btnGps.innerHTML = '<i class="fas fa-check"></i> GPS Capturado';
                    btnGps.style.background = '#10b981';
                    showToast('GPS Satelital obtenido', 'success');
                },
                function(error) {
                    showToast('Error GPS: ' + error.message, 'error');
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        });
    }
});