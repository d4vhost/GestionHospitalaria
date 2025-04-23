// Variables globales
let medicosData = [];
let especialidadesData = [];
let centrosData = [];
let editandoId = null;

// Eventos DOM
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Inicializar menú hamburguesa
    initMenuHamburguesa();
    
    // Cargar datos iniciales (usando await para asegurar el orden correcto)
    await cargarEspecialidades();
    await cargarCentrosMedicos();
    await cargarMedicos();
    
    // Configurar listeners
    document.getElementById('medicoForm').addEventListener('submit', guardarMedico);
    document.getElementById('btnLimpiar').addEventListener('click', limpiarFormulario);
    document.getElementById('btnBuscar').addEventListener('click', buscarMedicos);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') buscarMedicos();
    });
    
    console.log('Inicialización completada');
    console.log('Especialidades cargadas:', especialidadesData.length);
    console.log('Centros cargados:', centrosData.length);
    console.log('Médicos cargados:', medicosData.length);
  } catch (error) {
    console.error('Error durante la inicialización:', error);
    mostrarNotificacion('Error al inicializar la aplicación', 'error');
  }
});

// Funciones para el menú hamburguesa (sin cambios)
function initMenuHamburguesa() {
  const menuToggle = document.getElementById('menu-toggle');
  const closeMenu = document.getElementById('close-menu');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  
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
}

// Funciones para cargar datos desde la API (modificadas para manejar mejor la estructura de datos)
async function cargarEspecialidades() {
  try {
    const response = await fetch('https://localhost:7207/api/Especialidades');
    if (!response.ok) {
      throw new Error(`Error al cargar especialidades: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    // Manejar diferentes estructuras posibles de datos
    especialidadesData = data.$values || data || [];
    
    console.log('Datos de especialidades:', especialidadesData);
    
    if (especialidadesData.length === 0) {
      console.warn('No se cargaron especialidades');
    }
    
    // Llenar selector de especialidades
    const especialidadSelect = document.getElementById('especialidad');
    especialidadSelect.innerHTML = '<option value="">Seleccionar especialidad</option>';
    
    especialidadesData.forEach(esp => {
      const option = document.createElement('option');
      option.value = esp.especialidadID;
      option.textContent = esp.nombre;
      especialidadSelect.appendChild(option);
    });
    
    return especialidadesData;
  } catch (error) {
    console.error('Error al cargar especialidades:', error);
    mostrarNotificacion('Error al cargar especialidades', 'error');
    return [];
  }
}

async function cargarCentrosMedicos() {
  try {
    const response = await fetch('https://localhost:7207/api/CentroMedicos');
    if (!response.ok) {
      throw new Error(`Error al cargar centros médicos: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    // Manejar diferentes estructuras posibles de datos
    centrosData = data.$values || data || [];
    
    console.log('Datos de centros médicos:', centrosData);
    
    if (centrosData.length === 0) {
      console.warn('No se cargaron centros médicos');
    }
    
    // Llenar selector de centros médicos
    const centroSelect = document.getElementById('centro');
    centroSelect.innerHTML = '<option value="">Seleccionar centro médico</option>';
    
    centrosData.forEach(centro => {
      const option = document.createElement('option');
      option.value = centro.centroID;
      option.textContent = centro.nombre;
      centroSelect.appendChild(option);
    });
    
    return centrosData;
  } catch (error) {
    console.error('Error al cargar centros médicos:', error);
    mostrarNotificacion('Error al cargar centros médicos', 'error');
    return [];
  }
}

async function cargarMedicos() {
  try {
    const response = await fetch('https://localhost:7207/api/MedicosApi');
    if (!response.ok) {
      throw new Error(`Error al cargar médicos: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    // Manejar diferentes estructuras posibles de datos
    medicosData = data.$values || data || [];
    
    console.log('Datos de médicos cargados:', medicosData);
    
    // Procesar los datos para asegurar que tienen el formato correcto
    medicosData = medicosData.map(medico => {
      // Si medico es una referencia, puede que necesitemos resolverlo
      if (medico.$ref) {
        // Intenta encontrar el objeto referenciado en los datos originales
        const refId = medico.$ref;
        // Esta es una simplificación, podrías necesitar un método más robusto
        const resolvedMedico = findReferenceById(data, refId);
        return resolvedMedico || medico;
      }
      return medico;
    });
    
    renderizarTablaMedicos(medicosData);
    return medicosData;
  } catch (error) {
    console.error('Error al cargar médicos:', error);
    mostrarNotificacion('Error al cargar médicos', 'error');
    return [];
  }
}

// Función para buscar referencias por ID (nuevo)
function findReferenceById(data, refId) {
  // Si el objeto actual tiene el id buscado
  if (data && data.$id === refId) {
    return data;
  }
  
  // Si es un array o un objeto con $values
  if (data && (Array.isArray(data) || data.$values)) {
    const values = Array.isArray(data) ? data : data.$values;
    if (values) {
      for (const item of values) {
        const found = findReferenceById(item, refId);
        if (found) return found;
      }
    }
  }
  
  // Si es un objeto, buscar en todas sus propiedades
  if (data && typeof data === 'object') {
    for (const key in data) {
      if (data.hasOwnProperty(key) && typeof data[key] === 'object') {
        const found = findReferenceById(data[key], refId);
        if (found) return found;
      }
    }
  }
  
  return null;
}

// Función mejorada para renderizar la tabla de médicos
function renderizarTablaMedicos(medicos) {
  const tbody = document.querySelector('#tablaMedicos tbody');
  tbody.innerHTML = '';
  
  if (!medicos || medicos.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="7" class="text-center">No hay médicos registrados</td>';
    tbody.appendChild(tr);
    return;
  }
  
  console.log('Renderizando tabla con', medicos.length, 'médicos');
  
  medicos.forEach(medico => {
    // Verificar si medico tiene todas las propiedades necesarias
    if (!medico || typeof medico !== 'object') {
      console.error('Medico inválido:', medico);
      return;
    }
    
    const tr = document.createElement('tr');
    
    // Depuración
    console.log('Procesando médico:', medico);
    console.log('especialidadID:', medico.especialidadID);
    console.log('centroID:', medico.centroID);
    
    // Verificar si las especialidades y centros se cargaron correctamente
    if (especialidadesData.length === 0) {
      console.warn('Datos de especialidades no disponibles');
    }
    if (centrosData.length === 0) {
      console.warn('Datos de centros no disponibles');
    }
    
    // Encontrar nombres de especialidad y centro con mejor manejo de errores
    let especialidadNombre = 'Desconocida';
    let centroNombre = 'Desconocido';
    
    if (medico.especialidadID) {
      const especialidad = especialidadesData.find(e => e.especialidadID === medico.especialidadID);
      if (especialidad && especialidad.nombre) {
        especialidadNombre = especialidad.nombre;
      } else {
        console.warn(`Especialidad no encontrada para ID: ${medico.especialidadID}`);
      }
    }
    
    if (medico.centroID) {
      const centro = centrosData.find(c => c.centroID === medico.centroID);
      if (centro && centro.nombre) {
        centroNombre = centro.nombre;
      } else {
        console.warn(`Centro médico no encontrado para ID: ${medico.centroID}`);
      }
    }
    
    // Asegurarnos de que todos los campos existan o usar valores por defecto
    const id = medico.medicoID || 'N/A';
    const nombre = medico.nombre || '';
    const apellido = medico.apellido || '';
    const email = medico.email || '';
    const telefono = medico.telefono || '';
    
    tr.innerHTML = `
      <td>${id}</td>
      <td>${nombre} ${apellido}</td>
      <td>${especialidadNombre}</td>
      <td>${centroNombre}</td>
      <td>${email}</td>
      <td>${telefono}</td>
      <td>
        <button class="btn-action btn-edit" data-id="${id}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-action btn-delete" data-id="${id}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
  
  // Agregar event listeners a los botones de acción
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => editarMedico(parseInt(btn.dataset.id)));
  });
  
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => eliminarMedico(parseInt(btn.dataset.id)));
  });
}

// Función mejorada para guardar médico (crear o actualizar)
async function guardarMedico(e) {
  e.preventDefault();
  
  try {
    // Obtener datos del formulario
    const formData = {
      nombre: document.getElementById('nombre').value.trim(),
      apellido: document.getElementById('apellido').value.trim(),
      especialidadID: parseInt(document.getElementById('especialidad').value),
      centroID: parseInt(document.getElementById('centro').value),
      email: document.getElementById('email').value.trim(),
      telefono: document.getElementById('telefono').value.trim()
    };
    
    // Validar datos
    const camposFaltantes = [];
    if (!formData.nombre) camposFaltantes.push('Nombre');
    if (!formData.apellido) camposFaltantes.push('Apellido');
    if (isNaN(formData.especialidadID)) camposFaltantes.push('Especialidad');
    if (isNaN(formData.centroID)) camposFaltantes.push('Centro médico');
    if (!formData.email) camposFaltantes.push('Email');
    if (!formData.telefono) camposFaltantes.push('Teléfono');
    
    if (camposFaltantes.length > 0) {
      mostrarNotificacion(`Por favor, complete los siguientes campos: ${camposFaltantes.join(', ')}`, 'error');
      return;
    }
    
    let url = 'https://localhost:7207/api/MedicosApi';
    let method = 'POST';
    
    // Si estamos editando, cambiar método y URL
    if (editandoId) {
      url += `/${editandoId}`;
      method = 'PUT';
      formData.medicoID = editandoId;
    }
    
    console.log(`Enviando solicitud ${method} a ${url} con datos:`, formData);
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al guardar médico: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    // Verificar si la respuesta tiene contenido antes de intentar parsearla como JSON
    const contentType = response.headers.get("content-type");
    let responseData;
    
    if (contentType && contentType.includes("application/json") && response.status !== 204) {
      // Solo parsear como JSON si hay contenido y es del tipo correcto
      const text = await response.text();
      if (text && text.trim()) {
        responseData = JSON.parse(text);
        console.log('Respuesta del servidor:', responseData);
      } else {
        console.log('Respuesta del servidor vacía pero operación exitosa');
      }
    } else {
      console.log('Operación exitosa, sin datos JSON en la respuesta');
    }
    
    // Mostrar mensaje de éxito
    mostrarNotificacion(
      editandoId ? 'Médico actualizado correctamente' : 'Médico agregado correctamente', 
      'success'
    );
    
    // Recargar datos y limpiar formulario
    await cargarMedicos();
    limpiarFormulario();
  } catch (error) {
    console.error('Error al guardar médico:', error);
    mostrarNotificacion(`Error al guardar médico: ${error.message}`, 'error');
  }
}

// Función mejorada para editar médico
function editarMedico(id) {
  console.log('Editando médico con ID:', id);
  
  if (isNaN(id)) {
    console.error('ID de médico inválido:', id);
    mostrarNotificacion('Error: ID de médico inválido', 'error');
    return;
  }
  
  const medico = medicosData.find(m => m.medicoID === id);
  if (!medico) {
    console.error('Médico no encontrado con ID:', id);
    mostrarNotificacion('Error: Médico no encontrado', 'error');
    return;
  }
  
  console.log('Datos del médico a editar:', medico);
  
  // Actualizar formulario con datos del médico
  document.getElementById('formTitle').textContent = 'Editar Médico';
  document.getElementById('medicoId').value = medico.medicoID;
  document.getElementById('nombre').value = medico.nombre || '';
  document.getElementById('apellido').value = medico.apellido || '';
  document.getElementById('especialidad').value = medico.especialidadID || '';
  document.getElementById('centro').value = medico.centroID || '';
  document.getElementById('email').value = medico.email || '';
  document.getElementById('telefono').value = medico.telefono || '';
  
  // Establecer modo de edición
  editandoId = medico.medicoID;
  
  // Desplazarse hacia el formulario
  document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

// Función mejorada para eliminar médico
async function eliminarMedico(id) {
  console.log('Eliminando médico con ID:', id);
  
  if (isNaN(id)) {
    console.error('ID de médico inválido:', id);
    mostrarNotificacion('Error: ID de médico inválido', 'error');
    return;
  }
  
  if (!confirm('¿Está seguro de que desea eliminar este médico?')) {
    return;
  }
  
  try {
    const url = `https://localhost:7207/api/MedicosApi/${id}`;
    console.log(`Enviando solicitud DELETE a ${url}`);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al eliminar médico: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    console.log('Médico eliminado con éxito');
    mostrarNotificacion('Médico eliminado correctamente', 'success');
    
    // Recargar médicos
    await cargarMedicos();
    
    // Si estábamos editando el mismo médico, limpiar formulario
    if (editandoId === id) {
      limpiarFormulario();
    }
  } catch (error) {
    console.error('Error al eliminar médico:', error);
    mostrarNotificacion(`Error al eliminar médico: ${error.message}`, 'error');
  }
}

// Función mejorada para limpiar formulario
function limpiarFormulario() {
  document.getElementById('medicoForm').reset();
  document.getElementById('formTitle').textContent = 'Nuevo Médico';
  document.getElementById('medicoId').value = '';
  editandoId = null;
  console.log('Formulario limpiado');
}

// Función mejorada para buscar médicos
function buscarMedicos() {
  const termino = document.getElementById('searchInput').value.toLowerCase().trim();
  console.log('Buscando médicos con término:', termino);
  
  if (!termino) {
    console.log('Término de búsqueda vacío, mostrando todos los médicos');
    renderizarTablaMedicos(medicosData);
    return;
  }
  
  // Filtrar médicos según término de búsqueda
  const medicosFiltered = medicosData.filter(medico => {
    if (!medico) return false;
    
    // Buscar en nombre y apellido
    if ((medico.nombre && medico.nombre.toLowerCase().includes(termino)) || 
        (medico.apellido && medico.apellido.toLowerCase().includes(termino))) {
      return true;
    }
    
    // Buscar en especialidad
    const especialidad = especialidadesData.find(e => e.especialidadID === medico.especialidadID);
    if (especialidad && especialidad.nombre && especialidad.nombre.toLowerCase().includes(termino)) {
      return true;
    }
    
    // Buscar en centro médico
    const centro = centrosData.find(c => c.centroID === medico.centroID);
    if (centro && centro.nombre && centro.nombre.toLowerCase().includes(termino)) {
      return true;
    }
    
    // Buscar en email o teléfono
    return (medico.email && medico.email.toLowerCase().includes(termino)) || 
           (medico.telefono && medico.telefono.toLowerCase().includes(termino));
  });
  
  console.log(`Filtro aplicado: ${medicosFiltered.length} médicos encontrados`);
  renderizarTablaMedicos(medicosFiltered);
}

// Función mejorada para mostrar notificaciones (sin cambios esenciales)
function mostrarNotificacion(mensaje, tipo) {
  console.log(`Notificación (${tipo}): ${mensaje}`);
  
  // Verificar si ya existe una notificación
  let notificacion = document.querySelector('.notificacion');
  
  if (notificacion) {
    // Remover notificación existente
    notificacion.remove();
  }
  
  // Crear nueva notificación
  notificacion = document.createElement('div');
  notificacion.className = `notificacion ${tipo}`;
  notificacion.textContent = mensaje;
  
  // Estilos para la notificación
  notificacion.style.position = 'fixed';
  notificacion.style.top = '20px';
  notificacion.style.right = '20px';
  notificacion.style.padding = '10px 20px';
  notificacion.style.borderRadius = '4px';
  notificacion.style.zIndex = '1050';
  notificacion.style.opacity = '0';
  notificacion.style.transition = 'opacity 0.3s ease-in-out';
  
  // Estilos según tipo
  if (tipo === 'success') {
    notificacion.style.backgroundColor = 'var(--primary-light)';
    notificacion.style.color = 'white';
  } else {
    notificacion.style.backgroundColor = 'var(--danger)';
    notificacion.style.color = 'white';
  }
  
  // Agregar al DOM
  document.body.appendChild(notificacion);
  
  // Mostrar con animación
  setTimeout(() => {
    notificacion.style.opacity = '1';
  }, 10);
  
  // Ocultar después de 3 segundos
  setTimeout(() => {
    notificacion.style.opacity = '0';
    setTimeout(() => {
      notificacion.remove();
    }, 300);
  }, 3000);
}