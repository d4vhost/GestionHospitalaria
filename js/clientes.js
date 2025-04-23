// Variables globales
const API_URL = 'https://localhost:7207/api/ClientesApi';
let clientes = [];
let clienteActual = null;

// Elementos DOM
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const menuToggle = document.getElementById('menu-toggle');
const closeMenu = document.getElementById('close-menu');
const clienteForm = document.getElementById('clienteForm');
const formTitle = document.getElementById('formTitle');
const btnLimpiar = document.getElementById('btnLimpiar');
const searchInput = document.getElementById('searchInput');
const btnBuscar = document.getElementById('btnBuscar');
const tablaClientes = document.getElementById('tablaClientes');
const clienteModal = document.getElementById('clienteModal');
const closeModal = document.querySelector('.close');

// ==================== Funcionalidad Menú Hamburguesa ====================
menuToggle.addEventListener('click', () => {
  sidebar.classList.add('active');
  overlay.classList.add('active');
});

closeMenu.addEventListener('click', () => {
  sidebar.classList.remove('active');
  overlay.classList.remove('active');
});

overlay.addEventListener('click', () => {
  sidebar.classList.remove('active');
  overlay.classList.remove('active');
});

// ==================== Funciones para gestionar clientes ====================

// Cargar todos los clientes
async function cargarClientes() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Error al cargar los clientes');
    }
    
    const data = await response.json();
    // Acceder a los valores dentro de la estructura de respuesta
    clientes = data.$values || [];
    mostrarClientes(clientes);
  } catch (error) {
    console.error('Error:', error);
    alert('No se pudieron cargar los clientes. Por favor, intente nuevamente.');
  }
}

// Mostrar los clientes en la tabla
function mostrarClientes(clientesArray) {
  const tbody = tablaClientes.querySelector('tbody');
  tbody.innerHTML = '';

  if (clientesArray.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="6" class="text-center">No hay clientes disponibles</td>';
    tbody.appendChild(row);
    return;
  }

  clientesArray.forEach(cliente => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${cliente.clienteID}</td>
      <td>${cliente.nombre}</td>
      <td>${cliente.apellido}</td>
      <td class="truncate">${cliente.correo || '-'}</td>
      <td>${cliente.telefono || '-'}</td>
      <td>
        <button class="btn-action btn-view" data-id="${cliente.clienteID}" aria-label="Ver detalles">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn-action btn-edit" data-id="${cliente.clienteID}" aria-label="Editar">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-action btn-delete" data-id="${cliente.clienteID}" aria-label="Eliminar">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });

  // Agregar event listeners a los botones
  agregarEventosAcciones();
}

// Agregar eventos a los botones de acción
function agregarEventosAcciones() {
  // Botones de ver detalles
  document.querySelectorAll('.btn-view').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const clienteId = parseInt(e.currentTarget.dataset.id);
      cargarDetallesCliente(clienteId);
    });
  });

  // Botones de editar
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const clienteId = parseInt(e.currentTarget.dataset.id);
      cargarClienteParaEditar(clienteId);
    });
  });

  // Botones de eliminar
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const clienteId = parseInt(e.currentTarget.dataset.id);
      confirmarEliminacion(clienteId);
    });
  });
}

// Cargar un cliente para editar
async function cargarClienteParaEditar(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) {
      throw new Error('Error al cargar el cliente');
    }
    
    clienteActual = await response.json();
    
    // Llenar el formulario con los datos
    document.getElementById('clienteId').value = clienteActual.clienteID;
    document.getElementById('nombre').value = clienteActual.nombre;
    document.getElementById('apellido').value = clienteActual.apellido;
    document.getElementById('correo').value = clienteActual.correo || '';
    document.getElementById('telefono').value = clienteActual.telefono || '';
    
    // Estos campos no existen en el modelo actual, pero están en el HTML
    // Si se agregan a la API, descomenta estas líneas
    /*
    document.getElementById('fechaNacimiento').value = clienteActual.fechaNacimiento || '';
    document.getElementById('direccion').value = clienteActual.direccion || '';
    */
    
    formTitle.innerText = 'Editar Cliente';
  } catch (error) {
    console.error('Error:', error);
    alert('No se pudo cargar el cliente para editar. Por favor, intente nuevamente.');
  }
}

// Cargar detalles de un cliente para mostrar en el modal
async function cargarDetallesCliente(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) {
      throw new Error('Error al cargar los detalles del cliente');
    }
    
    const cliente = await response.json();
    
    // Llenar el modal con los datos
    document.getElementById('detailNombreCompleto').textContent = `${cliente.nombre} ${cliente.apellido}`;
    document.getElementById('detailCorreo').textContent = cliente.correo || 'No registrado';
    document.getElementById('detailTelefono').textContent = cliente.telefono || 'No registrado';
    
    // Estos campos no existen en el modelo actual, mostrar valor por defecto
    document.getElementById('detailUltimaConsulta').textContent = 'No hay consultas registradas';
    
    // Cargar consultas del cliente (si existen)
    const tbodyHistorial = document.querySelector('#tablaHistorialConsultas tbody');
    tbodyHistorial.innerHTML = '';
    
    if (cliente.consultas && cliente.consultas.$values && cliente.consultas.$values.length > 0) {
      cliente.consultas.$values.forEach(consulta => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${formatDate(consulta.fechaConsulta)}</td>
          <td>Dr(a). ${consulta.medicoID}</td>
          <td>${consulta.diagnostico || 'No registrado'}</td>
        `;
        tbodyHistorial.appendChild(row);
      });
      
      // Actualizar última consulta si hay datos
      if (cliente.consultas.$values.length > 0) {
        // Ordenar consultas por fecha para encontrar la más reciente
        const consultasOrdenadas = [...cliente.consultas.$values].sort((a, b) => 
          new Date(b.fechaConsulta) - new Date(a.fechaConsulta)
        );
        document.getElementById('detailUltimaConsulta').textContent = 
          `${formatDate(consultasOrdenadas[0].fechaConsulta)} con Dr(a). ${consultasOrdenadas[0].medicoID}`;
      }
    } else {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="3" class="text-center">No hay consultas registradas</td>';
      tbodyHistorial.appendChild(row);
    }
    
    // Mostrar modal
    clienteModal.style.display = 'block';
  } catch (error) {
    console.error('Error:', error);
    alert('No se pudieron cargar los detalles del cliente. Por favor, intente nuevamente.');
  }
}

// Guardar cliente (crear o actualizar)
async function guardarCliente(event) {
  event.preventDefault();
  
  const clienteId = document.getElementById('clienteId').value;
  const esNuevo = !clienteId;
  
  // Crear objeto con los datos del formulario
  const clienteData = {
    nombre: document.getElementById('nombre').value,
    apellido: document.getElementById('apellido').value,
    correo: document.getElementById('correo').value,
    telefono: document.getElementById('telefono').value
  };
  
  // Si es una edición, agregar el ID
  if (!esNuevo) {
    clienteData.clienteID = parseInt(clienteId);
    // Mantener la referencia a consultas si existe
    if (clienteActual && clienteActual.consultas) {
      clienteData.consultas = clienteActual.consultas;
    }
  }
  
  try {
    const url = esNuevo ? API_URL : `${API_URL}/${clienteData.clienteID}`;
    const method = esNuevo ? 'POST' : 'PUT';
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(clienteData)
    });
    
    if (!response.ok) {
      throw new Error(`Error al ${esNuevo ? 'crear' : 'actualizar'} el cliente`);
    }
    
    alert(`Cliente ${esNuevo ? 'creado' : 'actualizado'} exitosamente`);
    limpiarFormulario();
    cargarClientes();
  } catch (error) {
    console.error('Error:', error);
    alert(`No se pudo ${esNuevo ? 'crear' : 'actualizar'} el cliente. Por favor, intente nuevamente.`);
  }
}

// Confirmar eliminación de cliente
function confirmarEliminacion(id) {
  if (confirm('¿Está seguro de que desea eliminar este cliente? Esta acción no se puede deshacer.')) {
    eliminarCliente(id);
  }
}

// Eliminar cliente
async function eliminarCliente(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      // Si el servidor devuelve un error, intentar obtener el mensaje
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Error al eliminar el cliente');
    }
    
    alert('Cliente eliminado exitosamente');
    cargarClientes();
  } catch (error) {
    console.error('Error:', error);
    alert('No se pudo eliminar el cliente. Verifique si tiene consultas asociadas.');
  }
}

// Limpiar formulario
function limpiarFormulario() {
  clienteForm.reset();
  document.getElementById('clienteId').value = '';
  formTitle.innerText = 'Nuevo Cliente';
  clienteActual = null;
}

// Buscar clientes
function buscarClientes() {
  const searchTerm = searchInput.value.toLowerCase();
  
  // Filtrar por término de búsqueda
  let clientesFiltrados = clientes.filter(cliente => {
    return cliente.nombre.toLowerCase().includes(searchTerm) ||
           cliente.apellido.toLowerCase().includes(searchTerm) ||
           (cliente.correo && cliente.correo.toLowerCase().includes(searchTerm));
  });
  
  // Si hay filtros adicionales, aplicarlos
  // (En este caso el filtro no aplica porque no tenemos un campo de estado en el modelo)
  if (filtroTipo) {
    // Implementar lógica de filtrado adicional cuando se agregue el campo
  }
  
  mostrarClientes(clientesFiltrados);
}

// Formatear fecha para mostrar
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ==================== Event Listeners ====================

// Evento submit del formulario
clienteForm.addEventListener('submit', guardarCliente);

// Evento botón limpiar
btnLimpiar.addEventListener('click', limpiarFormulario);

// Evento botón buscar
btnBuscar.addEventListener('click', buscarClientes);

// Evento input de búsqueda (búsqueda en tiempo real)
searchInput.addEventListener('input', buscarClientes);

// Evento cerrar modal
closeModal.addEventListener('click', () => {
  clienteModal.style.display = 'none';
});

// Cerrar modal al hacer clic fuera de él
window.addEventListener('click', (e) => {
  if (e.target === clienteModal) {
    clienteModal.style.display = 'none';
  }
});

// Cargar clientes al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
  cargarClientes();
});