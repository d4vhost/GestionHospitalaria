// URL base de la API
const API_URL = 'https://localhost:7207/api/EmpleadosApi';

// DOM elements
const empleadoForm = document.getElementById('empleadoForm');
const empleadoIdInput = document.getElementById('empleadoId');
const nombreInput = document.getElementById('nombre');
const apellidoInput = document.getElementById('apellido');
const cargoInput = document.getElementById('cargo');
const emailInput = document.getElementById('email');
const telefonoInput = document.getElementById('telefono');
const btnLimpiar = document.getElementById('btnLimpiar');
const btnBuscar = document.getElementById('btnBuscar');
const searchInput = document.getElementById('searchInput');
const tablaEmpleados = document.getElementById('tablaEmpleados').getElementsByTagName('tbody')[0];

// Estado de la aplicación
let empleados = [];
let editando = false;

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
  cargarEmpleados();
  
  // Event listeners
  empleadoForm.addEventListener('submit', guardarEmpleado);
  btnLimpiar.addEventListener('click', limpiarFormulario);
  btnBuscar.addEventListener('click', buscarEmpleados);
  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      buscarEmpleados();
    }
  });
});

// Función para cargar todos los empleados
async function cargarEmpleados() {
  try {
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Manejar la estructura específica de la respuesta
    if (data && data.$values) {
      empleados = data.$values;
    } else {
      empleados = data; // En caso de que la API devuelva un array directamente
    }
    
    renderizarTabla(empleados);
  } catch (error) {
    console.error('Error al cargar empleados:', error);
    mostrarNotificacion('Error al cargar los empleados. Intente nuevamente.', 'error');
  }
}

// Función para renderizar la tabla de empleados
function renderizarTabla(listaEmpleados) {
  tablaEmpleados.innerHTML = '';
  
  if (listaEmpleados.length === 0) {
    const row = tablaEmpleados.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 7;
    cell.textContent = 'No hay empleados registrados';
    cell.style.textAlign = 'center';
    cell.style.padding = '1rem';
    return;
  }
  
  listaEmpleados.forEach(empleado => {
    const row = tablaEmpleados.insertRow();
    
    // Agregar celdas con los datos del empleado
    row.insertCell().textContent = empleado.empleadoID;
    row.insertCell().textContent = empleado.nombre;
    row.insertCell().textContent = empleado.apellido;
    row.insertCell().textContent = empleado.cargo || '---';
    row.insertCell().textContent = empleado.email || '---';
    row.insertCell().textContent = empleado.telefono || '---';
    
    // Celda para botones de acción
    const accionesCell = row.insertCell();
    
    // Botón Editar
    const btnEditar = document.createElement('button');
    btnEditar.className = 'btn-action btn-edit';
    btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
    btnEditar.title = 'Editar';
    btnEditar.onclick = () => cargarEmpleadoParaEditar(empleado);
    accionesCell.appendChild(btnEditar);
    
    // Espacio entre botones
    accionesCell.appendChild(document.createTextNode(' '));
    
    // Botón Eliminar
    const btnEliminar = document.createElement('button');
    btnEliminar.className = 'btn-action btn-delete';
    btnEliminar.innerHTML = '<i class="fas fa-trash-alt"></i>';
    btnEliminar.title = 'Eliminar';
    btnEliminar.onclick = () => confirmarEliminarEmpleado(empleado.empleadoID);
    accionesCell.appendChild(btnEliminar);
  });
}

// Función para guardar un empleado (crear o actualizar)
async function guardarEmpleado(e) {
  e.preventDefault();
  
  if (!empleadoForm.checkValidity()) {
    empleadoForm.reportValidity();
    return;
  }
  
  const empleadoData = {
    nombre: nombreInput.value,
    apellido: apellidoInput.value,
    cargo: cargoInput.value || null,
    email: emailInput.value || null,
    telefono: telefonoInput.value || null
  };
  
  try {
    let response;
    let mensaje;
    
    if (editando) {
      // Actualizar empleado existente
      const id = parseInt(empleadoIdInput.value);
      empleadoData.empleadoID = id;
      
      response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(empleadoData)
      });
      
      mensaje = 'Empleado actualizado correctamente';
    } else {
      // Crear nuevo empleado
      response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(empleadoData)
      });
      
      mensaje = 'Empleado agregado correctamente';
    }
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    mostrarNotificacion(mensaje, 'success');
    limpiarFormulario();
    cargarEmpleados();
  } catch (error) {
    console.error('Error al guardar empleado:', error);
    mostrarNotificacion('Error al guardar el empleado. Intente nuevamente.', 'error');
  }
}

// Función para cargar un empleado en el formulario para editar
function cargarEmpleadoParaEditar(empleado) {
  editando = true;
  document.querySelector('.form-section h2').textContent = 'Editar Empleado';
  
  empleadoIdInput.value = empleado.empleadoID;
  nombreInput.value = empleado.nombre;
  apellidoInput.value = empleado.apellido;
  cargoInput.value = empleado.cargo || '';
  emailInput.value = empleado.email || '';
  telefonoInput.value = empleado.telefono || '';
  
  // Hacer scroll hacia el formulario
  document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

// Función para confirmar y eliminar un empleado
function confirmarEliminarEmpleado(id) {
  if (confirm('¿Está seguro que desea eliminar este empleado?')) {
    eliminarEmpleado(id);
  }
}

// Función para eliminar un empleado
async function eliminarEmpleado(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    mostrarNotificacion('Empleado eliminado correctamente', 'success');
    cargarEmpleados();
  } catch (error) {
    console.error('Error al eliminar empleado:', error);
    mostrarNotificacion('Error al eliminar el empleado. Intente nuevamente.', 'error');
  }
}

// Función para limpiar el formulario
function limpiarFormulario() {
  editando = false;
  document.querySelector('.form-section h2').textContent = 'Nuevo Empleado';
  
  empleadoForm.reset();
  empleadoIdInput.value = '';
}

// Función para buscar empleados
function buscarEmpleados() {
  const busqueda = searchInput.value.toLowerCase().trim();
  
  if (!busqueda) {
    renderizarTabla(empleados);
    return;
  }
  
  const resultados = empleados.filter(empleado => 
    empleado.nombre.toLowerCase().includes(busqueda) || 
    empleado.apellido.toLowerCase().includes(busqueda) ||
    (empleado.cargo && empleado.cargo.toLowerCase().includes(busqueda)) ||
    (empleado.email && empleado.email.toLowerCase().includes(busqueda))
  );
  
  renderizarTabla(resultados);
}

// Función para mostrar notificaciones temporales
function mostrarNotificacion(mensaje, tipo) {
  // Esta es una implementación simple con alert
  // En una aplicación real se usaría un sistema de notificaciones más elegante
  if (tipo === 'error') {
    alert(`Error: ${mensaje}`);
  } else {
    alert(mensaje);
  }
}