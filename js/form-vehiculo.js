/* ========================================================
   LÓGICA: FORMULARIO REGISTRO DE VEHÍCULO (form-vehiculo.js)
======================================================== */
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
  setTimeout(() => toast.classList.remove('show'), 2800);
}

function scrollToSection(id) {
  const section = getEl(id);
  if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function fileName(id) {
  const input = getEl(id);
  return input && input.files && input.files[0] ? input.files[0].name : '';
}

function selectedRadio(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : '';
}

function selectedChecks(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(el => el.value);
}

function onlyDigits(value) { return String(value || '').replace(/\D+/g, ''); }

function clearChecks(name) {
  document.querySelectorAll(`input[name="${name}"]`).forEach(el => el.checked = false);
}

function hideAllEventBlocks() {
  ['bloqueInicio', 'bloqueFinJornada', 'bloqueFinEvento', 'bloqueCombustible'].forEach(id => getEl(id).classList.add('hidden'));
}

function hideAllCrewBlocks() {
  ['bloqueMantenimiento', 'bloqueInstalaciones'].forEach(id => getEl(id).classList.add('hidden'));
}

function updateCrewBlocks() {
  const crew = selectedRadio('tipoCuadrilla');
  hideAllCrewBlocks();
  clearChecks('trabajoMantenimiento');
  clearChecks('trabajoInstalacion');

  if (crew === 'Mantenimiento') getEl('bloqueMantenimiento').classList.remove('hidden');
  if (crew === 'Instalaciones') getEl('bloqueInstalaciones').classList.remove('hidden');
}

function updateEventBlocks() {
  const eventType = selectedRadio('tipoJornada');
  hideAllEventBlocks();

  if (eventType === 'Inicio de Jornada') getEl('bloqueInicio').classList.remove('hidden');
  if (eventType === 'Fin de Jornada') getEl('bloqueFinJornada').classList.remove('hidden');
  if (eventType === 'Fin de Evento') getEl('bloqueFinEvento').classList.remove('hidden');
  if (eventType === 'Cargó combustible') getEl('bloqueCombustible').classList.remove('hidden');
}

function attachNumericGuards() {
  document.querySelectorAll('.numeric-only').forEach(input => {
    input.addEventListener('input', () => { input.value = onlyDigits(input.value); });
  });

  document.querySelectorAll('.decimal-input').forEach(input => {
    input.addEventListener('input', () => { input.value = input.value.replace(/[^\d.,]/g, ''); });
  });
}

function resetAll() {
  document.querySelectorAll('input').forEach(el => {
    if (el.type === 'radio' || el.type === 'checkbox') el.checked = false;
    else el.value = '';
  });
  document.querySelectorAll('textarea').forEach(el => el.value = '');
  hideAllCrewBlocks();
  hideAllEventBlocks();
  showToast('Formulario reiniciado', 'success');
}

function validateBase() {
  const required = [
    ['fecha', 'Debes ingresar la fecha.'],
    ['cedula', 'Debes ingresar la cédula.'],
    ['apellidos', 'Debes ingresar los apellidos.'],
    ['nombre', 'Debes ingresar el nombre.'],
    ['placa', 'Debes ingresar la placa.']
  ];

  for (const [id, message] of required) {
    if (!getEl(id).value.trim()) return message;
  }

  if (onlyDigits(getEl('cedula').value).length < 10) return 'La cédula debe tener 10 dígitos.';
  if (!selectedRadio('tipoCuadrilla')) return 'Debes seleccionar el tipo de cuadrilla.';
  if (!selectedRadio('tipoJornada')) return 'Debes seleccionar el tipo de jornada.';

  if (selectedRadio('tipoCuadrilla') === 'Mantenimiento' && selectedChecks('trabajoMantenimiento').length === 0) {
    return 'Selecciona al menos un trabajo de mantenimiento.';
  }
  if (selectedRadio('tipoCuadrilla') === 'Instalaciones' && selectedChecks('trabajoInstalacion').length === 0) {
    return 'Selecciona al menos un trabajo de instalaciones.';
  }
  return '';
}

function generateSummary() {
  const baseError = validateBase();
  if (baseError) { showToast(baseError, 'warning'); return; }

  const crew = selectedRadio('tipoCuadrilla');
  const eventType = selectedRadio('tipoJornada');
  const crewTasks = crew === 'Mantenimiento' ? selectedChecks('trabajoMantenimiento') : selectedChecks('trabajoInstalacion');

  const lines = [
    'REGISTRO DIARIO DE VEHÍCULO',
    '============================',
    `Fecha: ${getEl('fecha').value}`,
    `Cédula: ${onlyDigits(getEl('cedula').value)}`,
    `Apellidos: ${getEl('apellidos').value.trim()}`,
    `Nombre: ${getEl('nombre').value.trim()}`,
    `Vehículo / Placa: ${getEl('placa').value.trim().toUpperCase()}`,
    '',
    `Tipo de cuadrilla: ${crew}`,
    `Trabajo seleccionado: ${crewTasks.join(', ')}`,
    '',
    `Evento de jornada: ${eventType}`,
  ];

  if (eventType === 'Inicio de Jornada') {
    lines.push(`Odómetro inicio: ${onlyDigits(getEl('odoInicio').value)} km`);
    lines.push(`Foto odómetro: ${fileName('fotoInicio')}`);
  }
  if (eventType === 'Fin de Jornada') {
    lines.push(`Odómetro final de jornada: ${onlyDigits(getEl('odoFinJornada').value)} km`);
    lines.push(`Foto final: ${fileName('fotoFinJornada')}`);
  }
  if (eventType === 'Fin de Evento') {
    lines.push(`Odómetro final de evento: ${onlyDigits(getEl('odoFinEvento').value)} km`);
    lines.push(`Foto odómetro: ${fileName('fotoFinEvento')}`);
  }
  if (eventType === 'Cargó combustible') {
    lines.push(`Odómetro carga combustible: ${onlyDigits(getEl('odoCombustible').value)} km`);
    lines.push(`Galones: ${getEl('galones').value.trim()}`);
    lines.push(`Costo total USD: ${getEl('costo').value.trim()}`);
    lines.push(`Foto comprobante: ${fileName('fotoComprobante')}`);
  }

  getEl('summaryOutput').value = lines.join('\n');
  showToast('Resumen generado', 'success');
}

async function copySummary() {
  const content = getEl('summaryOutput').value.trim();
  if (!content) { showToast('Primero genera el resumen', 'warning'); return; }
  try {
    await navigator.clipboard.writeText(content);
    showToast('Resumen copiado', 'success');
  } catch (error) {
    showToast('No se pudo copiar automáticamente', 'error');
  }
}

// Futura función para enviar a Google Sheets
function enviarFormulario() {
    showToast('Funcionalidad de envío en construcción', 'warning');
}

function init() {
  attachNumericGuards();
  document.querySelectorAll('input[name="tipoCuadrilla"]').forEach(el => el.addEventListener('change', updateCrewBlocks));
  document.querySelectorAll('input[name="tipoJornada"]').forEach(el => el.addEventListener('change', updateEventBlocks));
}

document.addEventListener('DOMContentLoaded', init);