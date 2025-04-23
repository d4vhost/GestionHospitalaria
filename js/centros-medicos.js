// Constantes para la API
const API_URL = 'https://localhost:7207/api/CentroMedicos';

// Elementos del DOM
const centroMedicoForm = document.getElementById('centroMedicoForm');
const centroIdInput = document.getElementById('centroId');
const nombreInput = document.getElementById('nombre');
const ciudadInput = document.getElementById('ciudad');
const direccionInput = document.getElementById('direccion');
const telefonoInput = document.getElementById('telefono');
const btnLimpiar = document.getElementById('btnLimpiar');
const btnBuscar = document.getElementById('btnBuscar');
const searchInput = document.getElementById('searchInput');
const tablaCentrosMedicos = document.getElementById('tablaCentrosMedicos').getElementsByTagName('tbody')[0];

// Función para cargar todos los centros médicos
async function cargarCentrosMedicos() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Error al cargar los centros médicos');
    }
    const data = await response.json();
    // Extraer el array de valores desde la respuesta
    const centrosMedicos = data.$values || [];
    mostrarCentrosMedicos(centrosMedicos);
  } catch (error) {
    console.error('Error:', error);
    alert('No se pudieron cargar los centros médicos. Por favor, intente nuevamente.');
  }
}

// Función para mostrar los centros médicos en la tabla
function mostrarCentrosMedicos(centrosMedicos) {
  // Limpiar la tabla
  tablaCentrosMedicos.innerHTML = '';
  
  // Verificar si hay centros para mostrar
  if (!centrosMedicos || centrosMedicos.length === 0) {
    const row = tablaCentrosMedicos.insertRow();
    const cell = row.insertCell(0);
    cell.colSpan = 6;
    cell.textContent = 'No hay centros médicos disponibles';
    cell.style.textAlign = 'center';
    return;
  }
  
  // Llenar la tabla con los datos
  centrosMedicos.forEach(centro => {
    const row = tablaCentrosMedicos.insertRow();
    
    row.insertCell(0).textContent = centro.centroID;
    row.insertCell(1).textContent = centro.nombre;
    row.insertCell(2).textContent = centro.ciudad;
    
    const cellDireccion = row.insertCell(3);
    cellDireccion.textContent = centro.direccion || '';
    cellDireccion.classList.add('direccion-cell');
    
    row.insertCell(4).textContent = centro.telefono || '';
    
    // Celda para acciones (editar y eliminar)
    const cellAcciones = row.insertCell(5);
    
    // Botón editar
    const btnEditar = document.createElement('button');
    btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
    btnEditar.className = 'btn-action btn-edit';
    btnEditar.title = 'Editar';
    btnEditar.onclick = () => cargarCentroParaEditar(centro);
    cellAcciones.appendChild(btnEditar);
    
    // Botón eliminar
    const btnEliminar = document.createElement('button');
    btnEliminar.innerHTML = '<i class="fas fa-trash-alt"></i>';
    btnEliminar.className = 'btn-action btn-delete';
    btnEliminar.title = 'Eliminar';
    btnEliminar.onclick = () => eliminarCentroMedico(centro.centroID);
    cellAcciones.appendChild(btnEliminar);
  });
}

// Función para buscar centros médicos
async function buscarCentrosMedicos() {
  const searchTerm = searchInput.value.trim();
  
  try {
    let url = API_URL;
    if (searchTerm) {
      url = `${API_URL}/buscar?nombre=${encodeURIComponent(searchTerm)}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Error en la búsqueda');
    }
    
    const data = await response.json();
    // Extraer el array de valores desde la respuesta
    const centrosMedicos = data.$values || [];
    mostrarCentrosMedicos(centrosMedicos);
  } catch (error) {
    console.error('Error:', error);
    alert('Error al realizar la búsqueda. Por favor, intente nuevamente.');
  }
}

// Función para guardar un centro médico (crear o actualizar)
async function guardarCentroMedico(event) {
  event.preventDefault();
  
  const centroMedico = {
    nombre: nombreInput.value,
    ciudad: ciudadInput.value,
    direccion: direccionInput.value,
    telefono: telefonoInput.value,
    medicos: [] // Añadimos el campo 'medicos' vacío para mantener la estructura
  };
  
  const id = centroIdInput.value;
  const isEditing = id !== '';
  
  if (isEditing) {
    centroMedico.centroID = parseInt(id);
  }
  
  try {
    const url = isEditing ? `${API_URL}/${id}` : API_URL;
    const method = isEditing ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(centroMedico)
    });
    
    if (!response.ok) {
      throw new Error(`Error al ${isEditing ? 'actualizar' : 'crear'} el centro médico`);
    }
    
    // Limpiar el formulario y recargar los datos
    limpiarFormulario();
    cargarCentrosMedicos();
    
    alert(`Centro médico ${isEditing ? 'actualizado' : 'creado'} correctamente`);
  } catch (error) {
    console.error('Error:', error);
    alert(`Error al ${isEditing ? 'actualizar' : 'crear'} el centro médico. Por favor, intente nuevamente.`);
  }
}

// Función para cargar un centro médico para editar
function cargarCentroParaEditar(centro) {
  centroIdInput.value = centro.centroID;
  nombreInput.value = centro.nombre;
  ciudadInput.value = centro.ciudad;
  direccionInput.value = centro.direccion || '';
  telefonoInput.value = centro.telefono || '';
  
  // Cambiar texto del formulario
  document.querySelector('.form-section h2').textContent = 'Editar Centro Médico';
}

// Función para eliminar un centro médico
async function eliminarCentroMedico(id) {
  if (!confirm('¿Está seguro que desea eliminar este centro médico?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Error al eliminar el centro médico');
    }
    
    // Recargar la lista de centros médicos
    cargarCentrosMedicos();
    alert('Centro médico eliminado correctamente');
  } catch (error) {
    console.error('Error:', error);
    alert('Error al eliminar el centro médico. Por favor, intente nuevamente.');
  }
}

// Función para limpiar el formulario
function limpiarFormulario() {
  centroMedicoForm.reset();
  centroIdInput.value = '';
  document.querySelector('.form-section h2').textContent = 'Nuevo Centro Médico';
}

// Event Listeners
window.addEventListener('DOMContentLoaded', cargarCentrosMedicos);
centroMedicoForm.addEventListener('submit', guardarCentroMedico);
btnLimpiar.addEventListener('click', limpiarFormulario);
btnBuscar.addEventListener('click', buscarCentrosMedicos);
searchInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    buscarCentrosMedicos();
  }
});