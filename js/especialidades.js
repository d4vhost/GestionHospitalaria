// Variables globales
const API_URL = 'https://localhost:7207/api/Especialidades';
let modoEdicion = false;

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
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
    
    // Manejo del menú lateral
    const menuToggle = document.getElementById('menu-toggle');
    const closeMenu = document.getElementById('close-menu');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    menuToggle.addEventListener('click', function() {
      sidebar.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    
    function closeSidebar() {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
    
    closeMenu.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);
    
    // Cargar especialidades al iniciar la página
    cargarEspecialidades();
    
    // Manejar envío del formulario
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
    
    // Limpiar formulario y salir del modo edición
    btnLimpiar.addEventListener('click', () => {
      limpiarFormulario();
    });
    
    // Manejar búsqueda
    btnBuscar.addEventListener('click', () => {
      buscarEspecialidades();
    });
    
    // También permitir búsqueda al presionar Enter
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        buscarEspecialidades();
      }
    });
    
    // Funciones CRUD
    async function cargarEspecialidades() {
      try {
        mostrarCargando(true);
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`Error al cargar las especialidades. Código: ${response.status}`);
        }
        
        const data = await response.json();
        // Verifica la estructura de la respuesta y ajusta según sea necesario
        const especialidades = data.$values || data;
        renderizarTabla(especialidades);
        mostrarCargando(false);
      } catch (error) {
        mostrarCargando(false);
        console.error('Error:', error);
        mostrarMensaje(`Error al cargar las especialidades: ${error.message}`, 'error');
      }
    }
    
    async function crearEspecialidad(especialidad) {
      try {
        mostrarCargando(true);
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(especialidad)
        });
        
        if (!response.ok) {
          throw new Error(`Error al crear la especialidad. Código: ${response.status}`);
        }
        
        mostrarMensaje('Especialidad creada con éxito', 'success');
        limpiarFormulario();
        cargarEspecialidades();
      } catch (error) {
        mostrarCargando(false);
        console.error('Error:', error);
        mostrarMensaje(`Error al crear la especialidad: ${error.message}`, 'error');
      }
    }
    
    async function actualizarEspecialidad(especialidad) {
      try {
        mostrarCargando(true);
        const response = await fetch(`${API_URL}/${especialidad.especialidadID}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(especialidad)
        });
        
        if (!response.ok) {
          throw new Error(`Error al actualizar la especialidad. Código: ${response.status}`);
        }
        
        mostrarMensaje('Especialidad actualizada con éxito', 'success');
        limpiarFormulario();
        cargarEspecialidades();
      } catch (error) {
        mostrarCargando(false);
        console.error('Error:', error);
        mostrarMensaje(`Error al actualizar la especialidad: ${error.message}`, 'error');
      }
    }
    
    async function eliminarEspecialidad(id) {
      if (!confirm('¿Está seguro de que desea eliminar esta especialidad?')) {
        return;
      }
      
      try {
        mostrarCargando(true);
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`Error al eliminar la especialidad. Código: ${response.status}`);
        }
        
        mostrarMensaje('Especialidad eliminada con éxito', 'success');
        cargarEspecialidades();
      } catch (error) {
        mostrarCargando(false);
        console.error('Error:', error);
        mostrarMensaje(`Error al eliminar la especialidad: ${error.message}`, 'error');
      }
    }
    
    // Función para buscar especialidades
    async function buscarEspecialidades() {
      const termino = searchInput.value.trim().toLowerCase();
      
      try {
        mostrarCargando(true);
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`Error al buscar especialidades. Código: ${response.status}`);
        }
        
        const data = await response.json();
        const especialidades = data.$values || data;
        
        // Filtrar especialidades por el término de búsqueda
        const resultados = especialidades.filter(esp => 
          esp.nombre.toLowerCase().includes(termino) || 
          (esp.descripcion && esp.descripcion.toLowerCase().includes(termino))
        );
        
        renderizarTabla(resultados);
        mostrarCargando(false);
      } catch (error) {
        mostrarCargando(false);
        console.error('Error:', error);
        mostrarMensaje(`Error al buscar especialidades: ${error.message}`, 'error');
      }
    }
    
    // Funciones de utilidad
    function renderizarTabla(especialidades) {
      const tbody = tablaEspecialidades.querySelector('tbody');
      tbody.innerHTML = '';
      
      if (!especialidades || especialidades.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="4" class="text-center">No se encontraron especialidades</td>`;
        tbody.appendChild(tr);
        return;
      }
      
      especialidades.forEach(especialidad => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${especialidad.especialidadID}</td>
          <td>${especialidad.nombre}</td>
          <td class="descripcion-cell" title="${especialidad.descripcion || ''}">${especialidad.descripcion || ''}</td>
          <td>
            <button class="btn-action btn-edit" data-id="${especialidad.especialidadID}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-action btn-delete" data-id="${especialidad.especialidadID}">
              <i class="fas fa-trash-alt"></i>
            </button>
          </td>
        `;
        
        tbody.appendChild(tr);
      });
      
      configurarBotonesAcciones(especialidades);
    }
    
    function configurarBotonesAcciones(especialidades) {
      // Agregar eventos a los botones de editar
      document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          cargarEspecialidadParaEditar(id, especialidades);
        });
      });
      
      // Agregar eventos a los botones de eliminar
      document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          eliminarEspecialidad(id);
        });
      });
    }
    
    function cargarEspecialidadParaEditar(id, especialidades) {
      const especialidad = especialidades.find(esp => esp.especialidadID == id);
      
      if (especialidad) {
        idInput.value = especialidad.especialidadID;
        nombreInput.value = especialidad.nombre;
        descripcionInput.value = especialidad.descripcion || '';
        
        modoEdicion = true;
        btnSubmit.textContent = 'Actualizar';
        formTitle.textContent = 'Editar Especialidad';
        
        // Desplazarse al formulario
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
      }
    }
    
    function limpiarFormulario() {
      form.reset();
      idInput.value = '';
      modoEdicion = false;
      btnSubmit.textContent = 'Guardar';
      formTitle.textContent = 'Nueva Especialidad';
    }
    
    // Función para mostrar mensajes temporales
    function mostrarMensaje(mensaje, tipo) {
      // Verificar si ya existe un mensaje y eliminarlo
      const mensajeExistente = document.querySelector('.mensaje-alert');
      if (mensajeExistente) {
        mensajeExistente.remove();
      }
      
      // Crear el elemento de mensaje
      const mensajeElement = document.createElement('div');
      mensajeElement.className = `mensaje-alert ${tipo}`;
      mensajeElement.textContent = mensaje;
      
      // Insertar el mensaje después del encabezado de contenido
      const contentHeader = document.querySelector('.content-header');
      contentHeader.parentNode.insertBefore(mensajeElement, contentHeader.nextSibling);
      
      // Eliminar el mensaje después de 3 segundos
      setTimeout(() => {
        mensajeElement.remove();
      }, 3000);
    }
    
    // Función para mostrar un indicador de carga
    function mostrarCargando(mostrar) {
      // Remover el indicador existente, si existe
      const cargandoExistente = document.querySelector('.cargando-indicador');
      if (cargandoExistente) {
        cargandoExistente.remove();
      }
      
      if (mostrar) {
        // Crear y mostrar el indicador de carga
        const cargandoElement = document.createElement('div');
        cargandoElement.className = 'cargando-indicador';
        cargandoElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
        
        // Insertar el indicador después del encabezado de contenido
        const contentHeader = document.querySelector('.content-header');
        contentHeader.parentNode.insertBefore(cargandoElement, contentHeader.nextSibling);
      }
    }
    
    // Agregar estilos para el indicador de carga si no existen
    if (!document.getElementById('estilo-cargando')) {
      const style = document.createElement('style');
      style.id = 'estilo-cargando';
      style.textContent = `
        .cargando-indicador {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          background-color: #f8f9fa;
          color: #495057;
          border-radius: 4px;
          margin-bottom: 15px;
        }
        .cargando-indicador i {
          margin-right: 8px;
        }
      `;
      document.head.appendChild(style);
    }
});