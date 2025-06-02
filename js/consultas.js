// consultas.js - Script principal para el módulo de Consultas

document.addEventListener('DOMContentLoaded', async () => {
  const API_BASE = 'https://localhost:7207/api';

  const elements = {
    sidebar: document.getElementById('sidebar'),
    overlay: document.getElementById('overlay'),
    menuToggle: document.getElementById('menu-toggle'),
    closeMenu: document.getElementById('close-menu'),
    logoutBtn: document.querySelector('.logout-btn'),
    form: document.getElementById('consultaForm'),
    formTitle: document.getElementById('formTitle'),
    btnLimpiar: document.getElementById('btnLimpiar'),
    btnBuscar: document.getElementById('btnBuscar'),
    searchInput: document.getElementById('searchInput'),
    especialidad: document.getElementById('especialidad'),
    medico: document.getElementById('medico'),
    cliente: document.getElementById('cliente'),
    fecha: document.getElementById('fechaConsulta'),
    diagnostico: document.getElementById('diagnostico'),
    tratamiento: document.getElementById('tratamiento'),
    tabla: document.querySelector('#tablaConsultas tbody'),
    // Elementos de filtros que faltaban
    filterEspecialidad: document.getElementById('filterEspecialidad'),
    filterMedico: document.getElementById('filterMedico'),
    filterFecha: document.getElementById('filterFecha'),
    consultaId: document.getElementById('consultaId') // Este también faltaba
  };

  let especialidades = [], medicos = [], clientes = [], consultas = [], editandoId = null;

  initMenu();
  initEventos();
  await cargarDatosIniciales();

  function initMenu() {
    elements.menuToggle.addEventListener('click', () => {
      elements.sidebar.classList.add('active');
      elements.overlay.classList.add('active');
    });
    elements.closeMenu.addEventListener('click', cerrarMenu);
    elements.overlay.addEventListener('click', cerrarMenu);
    elements.logoutBtn.addEventListener('click', () => {
      sessionStorage.clear();
      location.href = '/';
    });
  }

  function cerrarMenu() {
    elements.sidebar.classList.remove('active');
    elements.overlay.classList.remove('active');
  }

  function initEventos() {
    elements.form.addEventListener('submit', guardarConsulta);
    elements.btnLimpiar.addEventListener('click', limpiarFormulario);
    elements.btnBuscar.addEventListener('click', buscarConsultas);
    elements.searchInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') buscarConsultas();
    });
    elements.especialidad.addEventListener('change', filtrarMedicos);
    
    // Eventos para los filtros
    elements.filterEspecialidad.addEventListener('change', aplicarFiltros);
    elements.filterMedico.addEventListener('change', aplicarFiltros);
    elements.filterFecha.addEventListener('change', aplicarFiltros);
  }

  async function cargarDatosIniciales() {
    try {
      [especialidades, medicos, clientes, consultas] = await Promise.all([
        fetchAPI('/Especialidades'),
        fetchAPI('/MedicosApi'),
        fetchAPI('/ClientesApi'),
        fetchAPI('/ConsultasApi')
      ]);

      // Llenar selects del formulario
      llenarSelect(elements.especialidad, especialidades, 'especialidadID', 'nombre');
      llenarSelect(elements.cliente, clientes, 'clienteID', c => `${c.nombre} ${c.apellido}`);
      
      // Deshabilitar selector de médicos inicialmente
      elements.medico.disabled = true;
      elements.medico.innerHTML = '<option value="">Primero seleccione una especialidad</option>';
      
      // Llenar selects de filtros
      llenarSelect(elements.filterEspecialidad, especialidades, 'especialidadID', 'nombre');
      llenarSelect(elements.filterMedico, medicos, 'medicoID', m => `${m.nombre} ${m.apellido}`);
      
      renderizarTabla(consultas);
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
    }
  }

  async function fetchAPI(endpoint) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`);
      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status}`);
      }
      const data = await res.json();
      return data.$values || data || [];
    } catch (error) {
      console.error(`Error en fetchAPI(${endpoint}):`, error);
      return [];
    }
  }

  function llenarSelect(select, datos, valueKey, labelKey) {
    if (!select) return;
    
    const defaultText = select === elements.especialidad ? 'Seleccionar especialidad' :
                       select === elements.medico ? 'Seleccionar médico' :
                       select === elements.cliente ? 'Seleccionar paciente' :
                       select === elements.filterEspecialidad ? 'Todas las especialidades' :
                       select === elements.filterMedico ? 'Todos los médicos' :
                       'Seleccionar';
    
    select.innerHTML = `<option value="">${defaultText}</option>`;
    
    datos.forEach(d => {
      const option = document.createElement('option');
      option.value = d[valueKey];
      option.textContent = typeof labelKey === 'function' ? labelKey(d) : d[labelKey];
      select.appendChild(option);
    });
  }

  function filtrarMedicos() {
    const espId = parseInt(elements.especialidad.value);
    if (!espId) {
      elements.medico.innerHTML = '<option value="">Primero seleccione una especialidad</option>';
      elements.medico.disabled = true;
      return;
    }
    
    const medicosFiltrados = medicos.filter(m => m.especialidadID === espId);
    llenarSelect(elements.medico, medicosFiltrados, 'medicoID', m => `${m.nombre} ${m.apellido}`);
    elements.medico.disabled = false;
  }

  async function guardarConsulta(e) {
    e.preventDefault();
    
    try {
      const datos = {
        medicoID: parseInt(elements.medico.value),
        clienteID: parseInt(elements.cliente.value),
        fechaConsulta: elements.fecha.value,
        diagnostico: elements.diagnostico.value,
        tratamiento: elements.tratamiento.value,
      };

      const method = editandoId ? 'PUT' : 'POST';
      const url = `${API_BASE}/ConsultasApi${editandoId ? '/' + editandoId : ''}`;
      if (editandoId) datos.consultaID = editandoId;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });

      if (!response.ok) {
        throw new Error(`Error al guardar: ${response.status}`);
      }

      consultas = await fetchAPI('/ConsultasApi');
      renderizarTabla(consultas);
      limpiarFormulario();
      
      alert(editandoId ? 'Consulta actualizada correctamente' : 'Consulta guardada correctamente');
    } catch (error) {
      console.error('Error al guardar consulta:', error);
      alert('Error al guardar la consulta');
    }
  }

  function limpiarFormulario() {
    elements.form.reset();
    elements.formTitle.textContent = 'Nueva Consulta';
    elements.medico.innerHTML = '<option value="">Primero seleccione una especialidad</option>';
    elements.medico.disabled = true;
    editandoId = null;
  }

  function renderizarTabla(lista) {
    if (!elements.tabla) return;
    
    elements.tabla.innerHTML = '';
    if (!lista.length) {
      const row = elements.tabla.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 8;
      cell.textContent = 'No hay registros disponibles';
      cell.className = 'text-center';
      return;
    }

    lista.forEach(consulta => {
      const row = elements.tabla.insertRow();
      const medico = medicos.find(m => m.medicoID === consulta.medicoID);
      const cliente = clientes.find(c => c.clienteID === consulta.clienteID);
      const especialidad = especialidades.find(e => e.especialidadID === medico?.especialidadID);

      row.innerHTML = `
        <td>${consulta.consultaID}</td>
        <td>${medico ? medico.nombre + ' ' + medico.apellido : 'Desconocido'}</td>
        <td>${especialidad?.nombre || 'Desconocida'}</td>
        <td>${cliente ? cliente.nombre + ' ' + cliente.apellido : 'Desconocido'}</td>
        <td>${formatearFecha(consulta.fechaConsulta)}</td>
        <td>${consulta.diagnostico || '-'}</td>
        <td>${consulta.tratamiento || '-'}</td>
        <td>
          <button class="btn-action btn-edit" title="Editar" onclick="editarConsulta(${consulta.consultaID})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-action btn-delete" title="Eliminar" onclick="eliminarConsulta(${consulta.consultaID})">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
    });
  }

  window.editarConsulta = id => {
    const consulta = consultas.find(c => c.consultaID === id);
    if (!consulta) return;
    
    elements.formTitle.textContent = 'Editar Consulta';
    if (elements.consultaId) elements.consultaId.value = consulta.consultaID;
    
    // Buscar el médico y su especialidad
    const medico = medicos.find(m => m.medicoID === consulta.medicoID);
    if (medico) {
      elements.especialidad.value = medico.especialidadID;
      filtrarMedicos(); // Esto habilitará el selector y cargará los médicos
      
      // Usar setTimeout para asegurar que el select se llene antes de asignar el valor
      setTimeout(() => {
        elements.medico.value = consulta.medicoID;
      }, 100);
    }
    
    elements.cliente.value = consulta.clienteID;
    elements.fecha.value = consulta.fechaConsulta?.slice(0, 16);
    elements.diagnostico.value = consulta.diagnostico || '';
    elements.tratamiento.value = consulta.tratamiento || '';
    editandoId = id;
    elements.form.scrollIntoView({ behavior: 'smooth' });
  };

  window.eliminarConsulta = async id => {
    if (!confirm('¿Está seguro de que desea eliminar esta consulta?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/ConsultasApi/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(`Error al eliminar: ${response.status}`);
      }
      
      consultas = await fetchAPI('/ConsultasApi');
      renderizarTabla(consultas);
      alert('Consulta eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar consulta:', error);
      alert('Error al eliminar la consulta');
    }
  };

  function buscarConsultas() {
    const termino = elements.searchInput.value.toLowerCase();
    const filtradas = consultas.filter(c => {
      const medico = medicos.find(m => m.medicoID === c.medicoID);
      const cliente = clientes.find(cl => cl.clienteID === c.clienteID);
      const especialidad = especialidades.find(e => e.especialidadID === medico?.especialidadID);
      
      return (
        (medico && `${medico.nombre} ${medico.apellido}`.toLowerCase().includes(termino)) ||
        (cliente && `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(termino)) ||
        (especialidad && especialidad.nombre.toLowerCase().includes(termino)) ||
        (c.diagnostico && c.diagnostico.toLowerCase().includes(termino)) ||
        (c.tratamiento && c.tratamiento.toLowerCase().includes(termino))
      );
    });
    renderizarTabla(filtradas);
  }

  function aplicarFiltros() {
    const especialidadFiltro = parseInt(elements.filterEspecialidad.value) || null;
    const medicoFiltro = parseInt(elements.filterMedico.value) || null;
    const fechaFiltro = elements.filterFecha.value || null;
    
    let consultasFiltradas = consultas;
    
    if (especialidadFiltro) {
      const medicosEspecialidad = medicos.filter(m => m.especialidadID === especialidadFiltro);
      const medicosIds = medicosEspecialidad.map(m => m.medicoID);
      consultasFiltradas = consultasFiltradas.filter(c => medicosIds.includes(c.medicoID));
    }
    
    if (medicoFiltro) {
      consultasFiltradas = consultasFiltradas.filter(c => c.medicoID === medicoFiltro);
    }
    
    if (fechaFiltro) {
      consultasFiltradas = consultasFiltradas.filter(c => {
        const fechaConsulta = new Date(c.fechaConsulta).toISOString().split('T')[0];
        return fechaConsulta === fechaFiltro;
      });
    }
    
    renderizarTabla(consultasFiltradas);
  }

  function formatearFecha(fechaStr) {
    if (!fechaStr) return '-';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleString('es-EC', {
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit'
    });
  }
});