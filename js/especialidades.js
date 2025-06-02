const API_URL = 'https://localhost:7207/api/Especialidades';
let modoEdicion = false;

document.addEventListener('DOMContentLoaded', function() {
    // Menú hamburguesa
    initMenuHamburguesa();

    const form = document.getElementById('especialidadForm');
    const idInput = document.getElementById('especialidadId');
    const nombreInput = document.getElementById('nombre');
    const descripcionInput = document.getElementById('descripcion');
    const btnSubmit = form.querySelector('button[type="submit"]');
    const btnLimpiar = document.getElementById('btnLimpiar');
    const searchInput = document.getElementById('searchInput');
    const btnBuscar = document.getElementById('btnBuscar');
    const tablaEspecialidades = document.getElementById('tablaEspecialidades');
    const formTitle = document.querySelector('.form-section h2');

    cargarEspecialidades();

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const especialidad = {
            nombre: nombreInput.value,
            descripcion: descripcionInput.value
        };

        if (modoEdicion) {
            especialidad.especialidadID = parseInt(idInput.value);
            actualizarEspecialidad(especialidad);
        } else {
            crearEspecialidad(especialidad);
        }
    });

    btnLimpiar.addEventListener('click', limpiarFormulario);

    btnBuscar.addEventListener('click', buscarEspecialidades);

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarEspecialidades();
    });
});

// ========== MENÚ HAMBURGUESA ==========
function initMenuHamburguesa() {
    const menuToggle = document.getElementById('menu-toggle');
    const closeMenu = document.getElementById('close-menu');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    if (menuToggle && sidebar && overlay) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    function closeSidebar() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (closeMenu) {
        closeMenu.addEventListener('click', closeSidebar);
    }

    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }
}

// ========== CRUD ==========
async function cargarEspecialidades() {
    try {
        mostrarCargando(true);
        const res = await fetch(API_URL);
        const data = await res.json();
        const especialidades = data.$values || data;
        renderizarTabla(especialidades);
        mostrarCargando(false);
    } catch (error) {
        mostrarCargando(false);
        mostrarMensaje(`Error al cargar especialidades: ${error.message}`, 'error');
    }
}

async function crearEspecialidad(especialidad) {
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(especialidad)
        });

        if (!res.ok) throw new Error(`Error al crear: ${res.status}`);
        mostrarMensaje('Especialidad creada con éxito', 'success');
        limpiarFormulario();
        cargarEspecialidades();
    } catch (error) {
        mostrarMensaje(`Error al crear especialidad: ${error.message}`, 'error');
    }
}

async function actualizarEspecialidad(especialidad) {
    try {
        const res = await fetch(`${API_URL}/${especialidad.especialidadID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(especialidad)
        });

        if (!res.ok) throw new Error(`Error al actualizar: ${res.status}`);
        mostrarMensaje('Especialidad actualizada con éxito', 'success');
        limpiarFormulario();
        cargarEspecialidades();
    } catch (error) {
        mostrarMensaje(`Error al actualizar especialidad: ${error.message}`, 'error');
    }
}

async function eliminarEspecialidad(id) {
    if (!confirm('¿Eliminar esta especialidad?')) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`Error al eliminar: ${res.status}`);
        mostrarMensaje('Especialidad eliminada con éxito', 'success');
        cargarEspecialidades();
    } catch (error) {
        mostrarMensaje(`Error al eliminar especialidad: ${error.message}`, 'error');
    }
}

function buscarEspecialidades() {
    const termino = document.getElementById('searchInput').value.trim().toLowerCase();

    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            const especialidades = data.$values || data;
            const filtradas = especialidades.filter(e =>
                e.nombre.toLowerCase().includes(termino) ||
                (e.descripcion && e.descripcion.toLowerCase().includes(termino))
            );
            renderizarTabla(filtradas);
        })
        .catch(error => {
            mostrarMensaje(`Error al buscar: ${error.message}`, 'error');
        });
}

// ========== UTILIDADES ==========
function renderizarTabla(especialidades) {
    const tbody = document.querySelector('#tablaEspecialidades tbody');
    tbody.innerHTML = '';

    if (especialidades.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center">No se encontraron especialidades</td></tr>`;
        return;
    }

    especialidades.forEach(e => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${e.especialidadID}</td>
            <td>${e.nombre}</td>
            <td>${e.descripcion || ''}</td>
            <td>
                <button class="btn-action btn-edit" data-id="${e.especialidadID}"><i class="fas fa-edit"></i></button>
                <button class="btn-action btn-delete" data-id="${e.especialidadID}"><i class="fas fa-trash-alt"></i></button>
            </td>`;
        tbody.appendChild(tr);
    });

    configurarAcciones(especialidades);
}

function configurarAcciones(especialidades) {
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const especialidad = especialidades.find(e => e.especialidadID == id);
            if (especialidad) {
                document.getElementById('especialidadId').value = especialidad.especialidadID;
                document.getElementById('nombre').value = especialidad.nombre;
                document.getElementById('descripcion').value = especialidad.descripcion || '';
                document.querySelector('.form-section h2').textContent = 'Editar Especialidad';
                modoEdicion = true;
            }
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => eliminarEspecialidad(btn.dataset.id));
    });
}

function limpiarFormulario() {
    document.getElementById('especialidadForm').reset();
    document.getElementById('especialidadId').value = '';
    document.querySelector('.form-section h2').textContent = 'Nueva Especialidad';
    modoEdicion = false;
}

function mostrarMensaje(msg, tipo) {
    const alerta = document.createElement('div');
    alerta.className = `mensaje-alert ${tipo}`;
    alerta.textContent = msg;
    const ref = document.querySelector('.content-header');
    ref.insertAdjacentElement('afterend', alerta);
    setTimeout(() => alerta.remove(), 3000);
}

function mostrarCargando(mostrar) {
    let indicador = document.querySelector('.cargando-indicador');
    if (indicador) indicador.remove();

    if (mostrar) {
        indicador = document.createElement('div');
        indicador.className = 'cargando-indicador';
        indicador.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
        const ref = document.querySelector('.content-header');
        ref.insertAdjacentElement('afterend', indicador);
    }
}
