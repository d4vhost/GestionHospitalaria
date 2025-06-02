// Variables globales
const API_URL = 'https://localhost:7207/api/CentroMedicos';
let modoEdicion = false;

// Elementos del DOM
const form = document.getElementById('centroMedicoForm');
const idInput = document.getElementById('centroId');
const nombreInput = document.getElementById('nombre');
const ciudadInput = document.getElementById('ciudad');
const direccionInput = document.getElementById('direccion');
const telefonoInput = document.getElementById('telefono');
const btnLimpiar = document.getElementById('btnLimpiar');
const searchInput = document.getElementById('searchInput');
const btnBuscar = document.getElementById('btnBuscar');
const tabla = document.getElementById('tablaCentrosMedicos').querySelector('tbody');

// Menú hamburguesa
function initMenuHamburguesa() {
  const menuToggle = document.getElementById('menu-toggle');
  const closeMenu = document.getElementById('close-menu');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');

  menuToggle.addEventListener('click', () => {
    sidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  closeMenu.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  });
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo = 'success') {
  const notificacion = document.getElementById('notificacion') || document.createElement('div');
  notificacion.id = 'notificacion';
  notificacion.className = `notification ${tipo}`;
  notificacion.textContent = mensaje;
  document.body.appendChild(notificacion);

  notificacion.classList.add('show');
  setTimeout(() => notificacion.classList.remove('show'), 3000);
}

// CRUD
async function cargarCentros() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Error al cargar los centros médicos');
    const data = await res.json();
    renderizarTabla(data.$values || data);
  } catch (err) {
    console.error(err);
    mostrarNotificacion('No se pudieron cargar los centros médicos', 'error');
  }
}

function renderizarTabla(centros) {
  tabla.innerHTML = '';
  if (!centros.length) {
    const row = tabla.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 6;
    cell.classList.add('text-center');
    cell.textContent = 'No hay centros médicos disponibles';
    return;
  }

  centros.forEach(centro => {
    const row = tabla.insertRow();
    row.innerHTML = `
      <td>${centro.centroID}</td>
      <td>${centro.nombre}</td>
      <td>${centro.ciudad}</td>
      <td>${centro.direccion || ''}</td>
      <td>${centro.telefono || ''}</td>
      <td>
        <button class="btn-action btn-edit" title="Editar" onclick='editarCentro(${JSON.stringify(centro)})'>
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-action btn-delete" title="Eliminar" onclick='eliminarCentro(${centro.centroID})'>
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
  });
}

function editarCentro(centro) {
  idInput.value = centro.centroID;
  nombreInput.value = centro.nombre;
  ciudadInput.value = centro.ciudad;
  direccionInput.value = centro.direccion;
  telefonoInput.value = centro.telefono;
  modoEdicion = true;
  document.querySelector('.form-section h2').textContent = 'Editar Centro Médico';
  form.scrollIntoView({ behavior: 'smooth' });
}

async function eliminarCentro(id) {
  if (!confirm('¿Está seguro de eliminar este centro médico?')) return;
  try {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    mostrarNotificacion('Centro médico eliminado correctamente');
    cargarCentros();
  } catch {
    mostrarNotificacion('Error al eliminar centro médico', 'error');
  }
}

async function guardarCentro(e) {
  e.preventDefault();
  const centro = {
    nombre: nombreInput.value.trim(),
    ciudad: ciudadInput.value.trim(),
    direccion: direccionInput.value.trim(),
    telefono: telefonoInput.value.trim()
  };
  const method = modoEdicion ? 'PUT' : 'POST';
  let url = API_URL;
  if (modoEdicion) {
    centro.centroID = parseInt(idInput.value);
    url += `/${centro.centroID}`;
  }

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(centro)
    });
    if (!res.ok) throw new Error();
    mostrarNotificacion(`Centro ${modoEdicion ? 'actualizado' : 'creado'} correctamente`);
    limpiarFormulario();
    cargarCentros();
  } catch {
    mostrarNotificacion(`Error al ${modoEdicion ? 'actualizar' : 'crear'} centro médico`, 'error');
  }
}

function limpiarFormulario() {
  form.reset();
  idInput.value = '';
  modoEdicion = false;
  document.querySelector('.form-section h2').textContent = 'Nuevo Centro Médico';
}

async function buscarCentros() {
  const termino = searchInput.value.trim().toLowerCase();
  if (!termino) return cargarCentros();

  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    const centros = data.$values || data;
    const filtrados = centros.filter(c =>
      c.nombre.toLowerCase().includes(termino) ||
      c.ciudad.toLowerCase().includes(termino) ||
      (c.direccion && c.direccion.toLowerCase().includes(termino))
    );
    renderizarTabla(filtrados);
  } catch (err) {
    mostrarNotificacion('Error al buscar centros médicos', 'error');
  }
}

// Eventos
window.addEventListener('DOMContentLoaded', () => {
  initMenuHamburguesa();
  cargarCentros();
  form.addEventListener('submit', guardarCentro);
  btnLimpiar.addEventListener('click', limpiarFormulario);
  btnBuscar.addEventListener('click', buscarCentros);
  searchInput.addEventListener('keypress', e => e.key === 'Enter' && buscarCentros());
});
