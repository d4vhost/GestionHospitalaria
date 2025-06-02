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
menuToggle?.addEventListener('click', () => {
  sidebar.classList.add('active');
  overlay.classList.add('active');
});

closeMenu?.addEventListener('click', () => {
  sidebar.classList.remove('active');
  overlay.classList.remove('active');
});

overlay?.addEventListener('click', () => {
  sidebar.classList.remove('active');
  overlay.classList.remove('active');
});

// ==================== Funciones para gestionar clientes ====================

// Cargar todos los clientes
async function cargarClientes() {
  try {
    console.log('Cargando clientes desde:', API_URL);
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Respuesta de la API:', data);
    
    // Manejar diferentes estructuras de respuesta
    if (Array.isArray(data)) {
      clientes = data;
    } else if (data.$values && Array.isArray(data.$values)) {
      clientes = data.$values;
    } else if (data.data && Array.isArray(data.data)) {
      clientes = data.data;
    } else {
      console.warn('Estructura de datos inesperada:', data);
      clientes = [];
    }
    
    console.log('Clientes cargados:', clientes);
    mostrarClientes(clientes);
  } catch (error) {
    console.error('Error al cargar clientes:', error);
    
    // Mostrar datos de prueba si falla la API
    console.log('Usando datos de prueba...');
    clientes = [
      {
        clienteID: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        correo: 'juan.perez@email.com',
        telefono: '555-0001'
      },
      {
        clienteID: 2,
        nombre: 'María',
        apellido: 'García',
        correo: 'maria.garcia@email.com',
        telefono: '555-0002'
      },
      {
        clienteID: 3,
        nombre: 'Carlos',
        apellido: 'López',
        correo: 'carlos.lopez@email.com',
        telefono: '555-0003'
      }
    ];
    mostrarClientes(clientes);
    
    // Mostrar mensaje de error menos intrusivo
    const errorMsg = document.createElement('div');
    errorMsg.className = 'error-message';
    errorMsg.textContent = 'No se pudo conectar con el servidor. Mostrando datos de ejemplo.';
    errorMsg.style.cssText = 'background: #ffebee; color: #c62828; padding: 10px; margin: 10px 0; border-radius: 4px; border-left: 4px solid #c62828;';
    
    const contentHeader = document.querySelector('.content-header');
    if (contentHeader && !document.querySelector('.error-message')) {
      contentHeader.appendChild(errorMsg);
    }
  }
}

// Mostrar los clientes en la tabla
function mostrarClientes(clientesArray) {
  console.log('Mostrando clientes en tabla:', clientesArray);
  
  const tbody = tablaClientes?.querySelector('tbody');
  if (!tbody) {
    console.error('No se encontró el tbody de la tabla');
    return;
  }
  
  tbody.innerHTML = '';

  if (!clientesArray || clientesArray.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="6" class="text-center" style="text-align: center; padding: 20px;">No hay clientes disponibles</td>';
    tbody.appendChild(row);
    return;
  }

  clientesArray.forEach(cliente => {
    if (!cliente) return;
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${cliente.clienteID || 'N/A'}</td>
      <td>${cliente.nombre || 'N/A'}</td>
      <td>${cliente.apellido || 'N/A'}</td>
      <td class="truncate">${cliente.correo || '-'}</td>
      <td>${cliente.telefono || '-'}</td>
      <td>
        <button class="btn-action btn-view" data-id="${cliente.clienteID}" title="Ver detalles" type="button">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn-action btn-edit" data-id="${cliente.clienteID}" title="Editar" type="button">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-action btn-delete" data-id="${cliente.clienteID}" title="Eliminar" type="button">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });

  // Agregar event listeners a los botones después de crear las filas
  setTimeout(() => {
    agregarEventosAcciones();
  }, 100);
}

// Agregar eventos a los botones de acción
function agregarEventosAcciones() {
  console.log('Agregando eventos a botones de acción');
  
  // Botones de ver detalles
  document.querySelectorAll('.btn-view').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const clienteId = parseInt(e.currentTarget.dataset.id);
      console.log('Ver detalles cliente ID:', clienteId);
      cargarDetallesCliente(clienteId);
    });
  });

  // Botones de editar
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const clienteId = parseInt(e.currentTarget.dataset.id);
      console.log('Editar cliente ID:', clienteId);
      cargarClienteParaEditar(clienteId);
    });
  });

  // Botones de eliminar
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const clienteId = parseInt(e.currentTarget.dataset.id);
      console.log('Eliminar cliente ID:', clienteId);
      confirmarEliminacion(clienteId);
    });
  });
}

// Cargar un cliente para editar
async function cargarClienteParaEditar(id) {
  try {
    console.log('Cargando cliente para editar, ID:', id);
    
    // Buscar en el array local primero
    const clienteLocal = clientes.find(c => c.clienteID === id);
    if (clienteLocal) {
      clienteActual = clienteLocal;
      llenarFormularioEdicion(clienteActual);
      return;
    }
    
    // Si no está en local, intentar cargar desde API
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) {
      throw new Error('Error al cargar el cliente');
    }
    
    clienteActual = await response.json();
    llenarFormularioEdicion(clienteActual);
    
  } catch (error) {
    console.error('Error:', error);
    alert('No se pudo cargar el cliente para editar. Por favor, intente nuevamente.');
  }
}

// Función auxiliar para llenar el formulario de edición
function llenarFormularioEdicion(cliente) {
  console.log('Llenando formulario con:', cliente);
  
  document.getElementById('clienteId').value = cliente.clienteID;
  document.getElementById('nombre').value = cliente.nombre || '';
  document.getElementById('apellido').value = cliente.apellido || '';
  document.getElementById('correo').value = cliente.correo || '';
  document.getElementById('telefono').value = cliente.telefono || '';
  
  formTitle.textContent = 'Editar Cliente';
  
  // Scroll al formulario
  document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

// Cargar detalles de un cliente para mostrar en el modal
async function cargarDetallesCliente(id) {
  try {
    console.log('Cargando detalles cliente ID:', id);
    
    // Buscar en el array local primero
    let cliente = clientes.find(c => c.clienteID === id);
    
    if (!cliente) {
      // Si no está en local, intentar cargar desde API
      const response = await fetch(`${API_URL}/${id}`);
      if (!response.ok) {
        throw new Error('Error al cargar los detalles del cliente');
      }
      cliente = await response.json();
    }
    
    mostrarDetallesEnModal(cliente);
    
  } catch (error) {
    console.error('Error:', error);
    alert('No se pudieron cargar los detalles del cliente. Por favor, intente nuevamente.');
  }
}

// Función auxiliar para mostrar detalles en el modal
function mostrarDetallesEnModal(cliente) {
  console.log('Mostrando detalles en modal:', cliente);
  
  // Llenar el modal con los datos
  document.getElementById('detailNombreCompleto').textContent = `${cliente.nombre || ''} ${cliente.apellido || ''}`;
  document.getElementById('detailCorreo').textContent = cliente.correo || 'No registrado';
  document.getElementById('detailTelefono').textContent = cliente.telefono || 'No registrado';
  
  // Información por defecto para campos que no están en el modelo actual
  document.getElementById('detailUltimaConsulta').textContent = 'No hay consultas registradas';
  
  // Cargar consultas del cliente si existen
  const tbodyHistorial = document.querySelector('#tablaHistorialConsultas tbody');
  if (tbodyHistorial) {
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
      const consultasOrdenadas = [...cliente.consultas.$values].sort((a, b) => 
        new Date(b.fechaConsulta) - new Date(a.fechaConsulta)
      );
      document.getElementById('detailUltimaConsulta').textContent = 
        `${formatDate(consultasOrdenadas[0].fechaConsulta)} con Dr(a). ${consultasOrdenadas[0].medicoID}`;
    } else {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="3" style="text-align: center; padding: 20px;">No hay consultas registradas</td>';
      tbodyHistorial.appendChild(row);
    }
  }
  
  // Mostrar modal
  if (clienteModal) {
    clienteModal.style.display = 'block';
  }
}

// Guardar cliente (crear o actualizar)
async function guardarCliente(event) {
  event.preventDefault();
  
  const clienteId = document.getElementById('clienteId').value;
  const esNuevo = !clienteId;
  
  // Validar campos requeridos
  const nombre = document.getElementById('nombre').value.trim();
  const apellido = document.getElementById('apellido').value.trim();
  
  if (!nombre || !apellido) {
    alert('Por favor, complete al menos el nombre y apellido.');
    return;
  }
  
  // Crear objeto con los datos del formulario
  const clienteData = {
    nombre: nombre,
    apellido: apellido,
    correo: document.getElementById('correo').value.trim(),
    telefono: document.getElementById('telefono').value.trim()
  };
  
  // Si es una edición, agregar el ID
  if (!esNuevo) {
    clienteData.clienteID = parseInt(clienteId);
    if (clienteActual && clienteActual.consultas) {
      clienteData.consultas = clienteActual.consultas;
    }
  }
  
  try {
    const url = esNuevo ? API_URL : `${API_URL}/${clienteData.clienteID}`;
    const method = esNuevo ? 'POST' : 'PUT';
    
    console.log(`${method} ${url}`, clienteData);
    
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
    
    // Para propósitos de demostración, simular éxito
    console.log('Simulando guardado exitoso...');
    
    if (esNuevo) {
      clienteData.clienteID = Math.max(...clientes.map(c => c.clienteID), 0) + 1;
      clientes.push(clienteData);
    } else {
      const index = clientes.findIndex(c => c.clienteID === clienteData.clienteID);
      if (index !== -1) {
        clientes[index] = clienteData;
      }
    }
    
    alert(`Cliente ${esNuevo ? 'creado' : 'actualizado'} exitosamente (modo demostración)`);
    limpiarFormulario();
    mostrarClientes(clientes);
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
    console.log('Eliminando cliente ID:', id);
    
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Error al eliminar el cliente');
    }
    
    alert('Cliente eliminado exitosamente');
    cargarClientes();
  } catch (error) {
    console.error('Error:', error);
    
    // Para propósitos de demostración, simular eliminación
    console.log('Simulando eliminación exitosa...');
    clientes = clientes.filter(c => c.clienteID !== id);
    alert('Cliente eliminado exitosamente (modo demostración)');
    mostrarClientes(clientes);
  }
}

// Limpiar formulario
function limpiarFormulario() {
  if (clienteForm) {
    clienteForm.reset();
  }
  document.getElementById('clienteId').value = '';
  if (formTitle) {
    formTitle.textContent = 'Nuevo Cliente';
  }
  clienteActual = null;
}

// Buscar clientes
function buscarClientes() {
  const searchTerm = searchInput?.value?.toLowerCase() || '';
  console.log('Buscando:', searchTerm);
  
  if (!searchTerm.trim()) {
    mostrarClientes(clientes);
    return;
  }
  
  const clientesFiltrados = clientes.filter(cliente => {
    if (!cliente) return false;
    
    const nombre = (cliente.nombre || '').toLowerCase();
    const apellido = (cliente.apellido || '').toLowerCase();
    const correo = (cliente.correo || '').toLowerCase();
    
    return nombre.includes(searchTerm) ||
           apellido.includes(searchTerm) ||
           correo.includes(searchTerm);
  });
  
  console.log('Clientes filtrados:', clientesFiltrados);
  mostrarClientes(clientesFiltrados);
}

// Formatear fecha para mostrar
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'N/A';
  }
}

// ==================== Event Listeners ====================

// Evento submit del formulario
clienteForm?.addEventListener('submit', guardarCliente);

// Evento botón limpiar
btnLimpiar?.addEventListener('click', limpiarFormulario);

// Evento botón buscar
btnBuscar?.addEventListener('click', buscarClientes);

// Evento input de búsqueda (búsqueda en tiempo real)
searchInput?.addEventListener('input', buscarClientes);

// Evento cerrar modal
closeModal?.addEventListener('click', () => {
  if (clienteModal) {
    clienteModal.style.display = 'none';
  }
});

// Cerrar modal al hacer clic fuera de él
window.addEventListener('click', (e) => {
  if (e.target === clienteModal) {
    clienteModal.style.display = 'none';
  }
});

// Cargar clientes al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM cargado, iniciando aplicación...');
  
  // Verificar que los elementos existen
  console.log('Elementos encontrados:', {
    tablaClientes: !!tablaClientes,
    clienteForm: !!clienteForm,
    searchInput: !!searchInput,
    clienteModal: !!clienteModal
  });
  
  cargarClientes();
});

// Para debugging - exponer funciones al objeto window
if (typeof window !== 'undefined') {
  window.debugClientes = {
    clientes,
    cargarClientes,
    mostrarClientes,
    buscarClientes
  };
}