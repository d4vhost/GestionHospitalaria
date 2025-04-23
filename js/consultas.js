document.addEventListener('DOMContentLoaded', function() {
    // URLs de las API
    const URL_API_MEDICOS = 'https://localhost:7207/api/MedicosApi';
    const URL_API_ESPECIALIDADES = 'https://localhost:7207/api/Especialidades';
    const URL_API_CLIENTES = 'https://localhost:7207/api/ClientesApi';
    const URL_API_CONSULTAS = 'https://localhost:7207/api/ConsultasApi';

    // Referencias a elementos del DOM
    const sidebarElement = document.getElementById('sidebar');
    const overlayElement = document.getElementById('overlay');
    const menuToggleBtn = document.getElementById('menu-toggle');
    const closeMenuBtn = document.getElementById('close-menu');
    const formConsulta = document.getElementById('consultaForm');
    const selectEspecialidad = document.getElementById('especialidad');
    const selectMedico = document.getElementById('medico');
    const selectCliente = document.getElementById('cliente');
    const consultaModal = document.getElementById('consultaModal');
    const btnLimpiar = document.getElementById('btnLimpiar');
    const btnBuscar = document.getElementById('btnBuscar');
    const filterEspecialidad = document.getElementById('filterEspecialidad');
    const filterMedico = document.getElementById('filterMedico');
    const filterFecha = document.getElementById('filterFecha');
    const searchInput = document.getElementById('searchInput');
    const closeModalBtn = document.querySelector('.close');

    // Almacenamiento de datos
    let especialidades = [];
    let medicos = [];
    let clientes = [];
    let consultas = [];
    let consultaEditando = null;

    // Inicialización
    inicializarEventos();

    async function inicializar() {
        inicializarEventos();
        
        try {
            // Cargar datos secuencialmente para garantizar el orden
            await cargarEspecialidades();
            await cargarMedicos();
            await cargarClientes();
            // Solo cargar consultas cuando todo lo demás ha terminado
            await cargarConsultas();
        } catch (error) {
            console.error('Error durante la inicialización:', error);
            mostrarMensaje('Error al cargar datos. Por favor, recargue la página.', 'error');
        }
    }
    
    // Llamar a la función de inicialización
    inicializar();

    // Funciones de inicialización
    function inicializarEventos() {
        // Eventos del menú hamburguesa
        menuToggleBtn.addEventListener('click', abrirMenu);
        closeMenuBtn.addEventListener('click', cerrarMenu);
        overlayElement.addEventListener('click', cerrarMenu);

        // Eventos del formulario
        formConsulta.addEventListener('submit', guardarConsulta);
        btnLimpiar.addEventListener('click', limpiarFormulario);
        selectEspecialidad.addEventListener('change', filtrarMedicosPorEspecialidad);

        // Eventos de búsqueda y filtros
        btnBuscar.addEventListener('click', aplicarFiltros);
        filterEspecialidad.addEventListener('change', actualizarFiltroMedicos);
        
        // Evento del modal
        closeModalBtn.addEventListener('click', cerrarModal);
    }

    // Funciones del menú hamburguesa
    function abrirMenu() {
        sidebarElement.classList.add('active');
        overlayElement.classList.add('active');
    }

    function cerrarMenu() {
        sidebarElement.classList.remove('active');
        overlayElement.classList.remove('active');
    }

    // Funciones de carga de datos
    async function cargarEspecialidades() {
        try {
            const response = await fetch(URL_API_ESPECIALIDADES);
            if (!response.ok) throw new Error('Error al cargar especialidades');
            
            const data = await response.json();
            especialidades = data.$values || [];
            
            // Llenar selector de especialidades en el formulario
            selectEspecialidad.innerHTML = '<option value="">Seleccionar especialidad</option>';
            filterEspecialidad.innerHTML = '<option value="">Todas las especialidades</option>';
            
            especialidades.forEach(esp => {
                // Para el formulario
                const optionForm = document.createElement('option');
                optionForm.value = esp.especialidadID;
                optionForm.textContent = esp.nombre;
                selectEspecialidad.appendChild(optionForm);
                
                // Para el filtro
                const optionFilter = document.createElement('option');
                optionFilter.value = esp.especialidadID;
                optionFilter.textContent = esp.nombre;
                filterEspecialidad.appendChild(optionFilter);
            });
            
            console.log('Especialidades cargadas:', especialidades);
        } catch (error) {
            console.error('Error al cargar especialidades:', error);
            mostrarMensaje('Error al cargar especialidades', 'error');
            throw error; // Propagar el error para manejarlo en inicializar()
        }
    }

    async function cargarMedicos() {
        try {
            const response = await fetch(URL_API_MEDICOS);
            if (!response.ok) throw new Error('Error al cargar médicos');
            
            const data = await response.json();
            
            // Procesamiento mejorado para manejar diferentes estructuras de respuesta
            if (data.$values) {
                // Si es un array dentro de $values
                medicos = procesarDatosMedicos(data.$values);
            } else if (Array.isArray(data)) {
                // Si es un array directamente
                medicos = procesarDatosMedicos(data);
            } else {
                // Si es otro formato
                console.error('Formato de datos de médicos inesperado:', data);
                medicos = [];
            }
            
            console.log('Médicos cargados:', medicos);
            
            // Después de cargar médicos, si hay una especialidad seleccionada, actualizar selectores
            if (selectEspecialidad.value) {
                filtrarMedicosPorEspecialidad();
            }
            
            actualizarFiltroMedicos();
        } catch (error) {
            console.error('Error al cargar médicos:', error);
            mostrarMensaje('Error al cargar médicos', 'error');
        }
    }
    
    // Función para procesar los datos de médicos en diferentes formatos
// Función mejorada para procesar los datos de médicos
function procesarDatosMedicos(datos) {
    // Crear un mapa para resolver las referencias
    const refMap = new Map();
    
    // Primera pasada: construir el mapa de referencias
    function buildRefMap(obj) {
        if (!obj) return;
        
        if (obj.$id) {
            refMap.set(obj.$id, obj);
        }
        
        // Procesar objetos anidados
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                buildRefMap(obj[key]);
            }
        }
    }
    
    // Construir el mapa de referencias desde los datos
    datos.forEach(buildRefMap);
    
    // Segunda pasada: procesar los médicos
    const medicosProcessed = [];
    
    datos.forEach(med => {
        // Si es una referencia, buscar el objeto original
        if (med.$ref) {
            med = refMap.get(med.$ref);
            if (!med) return; // Si no se encuentra la referencia, saltar
        }
        
        // Extraer la información básica del médico
        const medico = {
            medicoID: med.medicoID,
            nombre: med.nombre,
            apellido: med.apellido,
            especialidadID: med.especialidadID,
            centroID: med.centroID,
            email: med.email,
            telefono: med.telefono
        };
        
        // Añadir información de especialidad si está disponible
        if (med.especialidad) {
            // Si especialidad es una referencia, resolverla
            let especialidad = med.especialidad;
            if (especialidad.$ref) {
                especialidad = refMap.get(especialidad.$ref);
            }
            
            if (especialidad) {
                medico.especialidad = {
                    especialidadID: especialidad.especialidadID,
                    nombre: especialidad.nombre,
                    descripcion: especialidad.descripcion
                };
            }
        }
        
        // Añadir información de centro si está disponible
        if (med.centro) {
            // Si centro es una referencia, resolverla
            let centro = med.centro;
            if (centro.$ref) {
                centro = refMap.get(centro.$ref);
            }
            
            if (centro) {
                medico.centro = {
                    centroID: centro.centroID,
                    nombre: centro.nombre,
                    ciudad: centro.ciudad,
                    direccion: centro.direccion,
                    telefono: centro.telefono
                };
            }
        }
        
        // Verificar si este médico ya existe en el array (para evitar duplicados)
        const medicoExistente = medicosProcessed.find(m => m.medicoID === medico.medicoID);
        if (!medicoExistente) {
            medicosProcessed.push(medico);
        }
    });
    
    console.log('Médicos procesados:', medicosProcessed);
    return medicosProcessed;
}

    async function cargarClientes() {
        try {
            const response = await fetch(URL_API_CLIENTES);
            if (!response.ok) throw new Error('Error al cargar clientes');
            
            const data = await response.json();
            
            if (data.$values) {
                clientes = data.$values;
            } else if (Array.isArray(data)) {
                clientes = data;
            } else {
                console.error('Formato de datos de clientes inesperado:', data);
                clientes = [];
            }
            
            // Llenar selector de clientes
            selectCliente.innerHTML = '<option value="">Seleccionar paciente</option>';
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.clienteID;
                option.textContent = `${cliente.nombre} ${cliente.apellido}`;
                selectCliente.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar clientes:', error);
            mostrarMensaje('Error al cargar clientes', 'error');
        }
    }

    async function cargarConsultas() {
        try {
            const response = await fetch(URL_API_CONSULTAS);
            if (!response.ok) throw new Error('Error al cargar consultas');
            
            const data = await response.json();
            
            // Mapa para resolver referencias
            const refMap = new Map();
            
            // Construir mapa de referencias
            function buildRefMap(obj) {
                if (!obj) return;
                
                if (obj.$id) {
                    refMap.set(obj.$id, obj);
                }
                
                // Procesar objetos anidados
                for (const key in obj) {
                    if (typeof obj[key] === 'object' && obj[key] !== null) {
                        buildRefMap(obj[key]);
                    }
                }
            }
            
            // Procesar datos
            if (data.$id) {
                buildRefMap(data);
            }
            
            let consultasData = [];
            
            if (data.$values) {
                consultasData = data.$values;
            } else if (Array.isArray(data)) {
                consultasData = data;
            } else {
                console.error('Formato de datos de consultas inesperado:', data);
                consultasData = [];
            }
            
            // Procesar consultas y resolver referencias
            consultas = consultasData.map(consulta => {
                // Si es una referencia, resolverla
                if (consulta.$ref) {
                    consulta = refMap.get(consulta.$ref);
                    if (!consulta) return null;
                }
                
                return {
                    consultaID: consulta.consultaID,
                    medicoID: consulta.medicoID,
                    clienteID: consulta.clienteID,
                    fechaConsulta: consulta.fechaConsulta,
                    diagnostico: consulta.diagnostico,
                    tratamiento: consulta.tratamiento
                };
            }).filter(c => c !== null); // Eliminar las consultas nulas
            
            actualizarTablaConsultas();
        } catch (error) {
            console.error('Error al cargar consultas:', error);
            mostrarMensaje('Error al cargar consultas', 'error');
        }
    }

    // Función para filtrar médicos según la especialidad seleccionada
    // Mejorar la función de filtrado de médicos por especialidad
    function filtrarMedicosPorEspecialidad() {
        const especialidadId = selectEspecialidad.value;
        
        // Limpiar selector de médicos
        selectMedico.innerHTML = '<option value="">Seleccionar médico</option>';
        
        if (!especialidadId) return;
        
        console.log(`Filtrando médicos por especialidad ID: ${especialidadId}`);
        
        // Filtrar médicos por especialidad (convertir IDs a enteros para comparación)
        const medicosFiltrados = medicos.filter(medico => {
            return parseInt(medico.especialidadID) === parseInt(especialidadId);
        });
        
        console.log('Médicos filtrados:', medicosFiltrados);
        
        // Llenar selector con médicos filtrados
        medicosFiltrados.forEach(medico => {
            const option = document.createElement('option');
            option.value = medico.medicoID;
            option.textContent = `${medico.nombre} ${medico.apellido}`;
            selectMedico.appendChild(option);
        });
        
        // Si no hay médicos para la especialidad seleccionada
        if (medicosFiltrados.length === 0) {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "No hay médicos disponibles para esta especialidad";
            option.disabled = true;
            selectMedico.appendChild(option);
        }
    }


    function actualizarFiltroMedicos() {
        const especialidadId = filterEspecialidad.value;
        
        // Limpiar selector de filtro de médicos
        filterMedico.innerHTML = '<option value="">Todos los médicos</option>';
        
        let medicosMostrar = medicos;
        
        // Si hay una especialidad seleccionada, filtrar médicos
        if (especialidadId) {
            medicosMostrar = medicos.filter(medico => 
                parseInt(medico.especialidadID) === parseInt(especialidadId)
            );
        }
        
        console.log('Médicos para filtro:', medicosMostrar);
        
        // Llenar selector de filtro con médicos
        medicosMostrar.forEach(medico => {
            const option = document.createElement('option');
            option.value = medico.medicoID;
            option.textContent = `${medico.nombre} ${medico.apellido}`;
            filterMedico.appendChild(option);
        });
    }

    // Operaciones CRUD para consultas
    async function guardarConsulta(e) {
        e.preventDefault();
        
        // Validar formulario
        if (!validarFormulario()) return;
        
        // Obtener datos del formulario
        const consultaId = document.getElementById('consultaId').value;
        const medicoId = selectMedico.value;
        const clienteId = selectCliente.value;
        const fechaConsulta = document.getElementById('fechaConsulta').value;
        const diagnostico = document.getElementById('diagnostico').value;
        const tratamiento = document.getElementById('tratamiento').value;
        
        // Crear objeto de consulta
        const consultaData = {
            medicoID: parseInt(medicoId),
            clienteID: parseInt(clienteId),
            fechaConsulta: fechaConsulta,
            diagnostico: diagnostico,
            tratamiento: tratamiento
        };
        
        try {
            let response;
            
            if (consultaId) {
                // Actualizar consulta existente
                consultaData.consultaID = parseInt(consultaId);
                response = await fetch(`${URL_API_CONSULTAS}/${consultaId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(consultaData)
                });
                
                if (!response.ok) throw new Error('Error al actualizar la consulta');
                mostrarMensaje('Consulta actualizada correctamente', 'success');
            } else {
                // Crear nueva consulta
                response = await fetch(URL_API_CONSULTAS, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(consultaData)
                });
                
                if (!response.ok) throw new Error('Error al crear la consulta');
                mostrarMensaje('Consulta guardada correctamente', 'success');
            }
            
            // Recargar consultas y limpiar formulario
            await cargarConsultas();
            limpiarFormulario();
            
        } catch (error) {
            console.error('Error al guardar consulta:', error);
            mostrarMensaje('Error al guardar la consulta', 'error');
        }
    }
    
    async function eliminarConsulta(consultaId) {
        if (!confirm('¿Está seguro de eliminar esta consulta?')) return;
        
        try {
            const response = await fetch(`${URL_API_CONSULTAS}/${consultaId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Error al eliminar la consulta');
            
            mostrarMensaje('Consulta eliminada correctamente', 'success');
            await cargarConsultas();
            
        } catch (error) {
            console.error('Error al eliminar consulta:', error);
            mostrarMensaje('Error al eliminar la consulta', 'error');
        }
    }
    
    function editarConsulta(consulta) {
        console.log('Editando consulta:', consulta);
        
        // Establecer modo edición
        document.getElementById('formTitle').textContent = 'Editar Consulta';
        document.getElementById('consultaId').value = consulta.consultaID;
        
        // Obtener especialidad del médico
        const medico = medicos.find(m => m.medicoID == consulta.medicoID);
        if (!medico) {
            console.error('Médico no encontrado:', consulta.medicoID);
            return;
        }
        
        // Cargar datos en el formulario
        selectEspecialidad.value = medico.especialidadID;
        
        // Disparar el evento change para actualizar los médicos según la especialidad
        const event = new Event('change');
        selectEspecialidad.dispatchEvent(event);
        
        // Esperar un momento para que se actualice el selector de médicos
        setTimeout(() => {
            selectMedico.value = consulta.medicoID;
            selectCliente.value = consulta.clienteID;
            document.getElementById('fechaConsulta').value = formatearFechaISO(consulta.fechaConsulta);
            document.getElementById('diagnostico').value = consulta.diagnostico || '';
            document.getElementById('tratamiento').value = consulta.tratamiento || '';
            
            // Guardar referencia a la consulta que se está editando
            consultaEditando = consulta;
            
            // Desplazarse al formulario
            formConsulta.scrollIntoView({ behavior: 'smooth' });
        }, 300); // Aumentado a 300ms para dar más tiempo a la actualización del selector
    }
    
    function verDetalleConsulta(consulta) {
        console.log('Viendo detalles de consulta:', consulta);
        
        // Buscar médico por ID
        const medico = medicos.find(m => m.medicoID == consulta.medicoID);
        
        // Completar datos en el modal
        document.getElementById('detailEspecialidad').textContent = 
            medico ? obtenerNombreEspecialidad(medico.especialidadID) : 'No disponible';
        
        document.getElementById('detailMedico').textContent = 
            medico ? `${medico.nombre} ${medico.apellido}` : 'No disponible';
        
        const cliente = clientes.find(c => c.clienteID == consulta.clienteID);
        document.getElementById('detailPaciente').textContent = 
            cliente ? `${cliente.nombre} ${cliente.apellido}` : 'No disponible';
        
        document.getElementById('detailFecha').textContent = formatearFecha(consulta.fechaConsulta);
        document.getElementById('detailDiagnostico').textContent = consulta.diagnostico || 'No registrado';
        document.getElementById('detailTratamiento').textContent = consulta.tratamiento || 'No registrado';
        
        // Mostrar modal
        consultaModal.style.display = 'block';
    }
    
    function cerrarModal() {
        consultaModal.style.display = 'none';
    }
    
    function limpiarFormulario() {
        document.getElementById('formTitle').textContent = 'Nueva Consulta';
        document.getElementById('consultaId').value = '';
        formConsulta.reset();
        selectMedico.innerHTML = '<option value="">Seleccionar médico</option>';
        consultaEditando = null;
    }
    
    // Función para validar el formulario
    function validarFormulario() {
        const medicoId = selectMedico.value;
        const clienteId = selectCliente.value;
        const fechaConsulta = document.getElementById('fechaConsulta').value;
        
        if (!medicoId) {
            mostrarMensaje('Debe seleccionar un médico', 'error');
            return false;
        }
        
        if (!clienteId) {
            mostrarMensaje('Debe seleccionar un paciente', 'error');
            return false;
        }
        
        if (!fechaConsulta) {
            mostrarMensaje('Debe seleccionar una fecha de consulta', 'error');
            return false;
        }
        
        return true;
    }

    // Funciones para la tabla de consultas
    function actualizarTablaConsultas(consultasFiltradas = null) {
        const tabla = document.getElementById('tablaConsultas').getElementsByTagName('tbody')[0];
    const listaConsultas = consultasFiltradas || consultas;
        
        // Limpiar tabla
        tabla.innerHTML = '';
        
        if (listaConsultas.length === 0) {
            const fila = tabla.insertRow();
            const celda = fila.insertCell();
            celda.colSpan = 8;
            celda.textContent = 'No hay consultas registradas';
            celda.className = 'no-data';
            return;
        }
        
        // Llenar tabla con datos
        listaConsultas.forEach(consulta => {
            const fila = tabla.insertRow();
            
            // Buscar médico
            const medico = medicos.find(m => m.medicoID == consulta.medicoID);
            
            // Buscar especialidad
            let especialidadNombre = 'Desconocida';
            if (medico) {
                especialidadNombre = obtenerNombreEspecialidad(medico.especialidadID);
            }
            
            // Buscar cliente
            const cliente = clientes.find(c => c.clienteID == consulta.clienteID);
            
            // Insertar celdas
            fila.insertCell().textContent = consulta.consultaID;
            fila.insertCell().textContent = medico ? `${medico.nombre} ${medico.apellido}` : 'Desconocido';
            fila.insertCell().textContent = especialidadNombre;
            fila.insertCell().textContent = cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Desconocido';
            fila.insertCell().textContent = formatearFecha(consulta.fechaConsulta);
            
            const celdaDiagnostico = fila.insertCell();
            celdaDiagnostico.textContent = consulta.diagnostico ? 
                (consulta.diagnostico.length > 20 ? consulta.diagnostico.substring(0, 20) + '...' : consulta.diagnostico) : 
                'No registrado';
            
            const celdaTratamiento = fila.insertCell();
            celdaTratamiento.textContent = consulta.tratamiento ? 
                (consulta.tratamiento.length > 20 ? consulta.tratamiento.substring(0, 20) + '...' : consulta.tratamiento) : 
                'No registrado';
            
            // Celda de acciones
            const celdaAcciones = fila.insertCell();
            
            // Botón ver detalles
            const btnVer = document.createElement('button');
            btnVer.innerHTML = '<i class="fas fa-eye"></i>';
            btnVer.className = 'btn-icon btn-view';
            btnVer.title = 'Ver detalles';
            btnVer.onclick = () => verDetalleConsulta(consulta);
            celdaAcciones.appendChild(btnVer);
            
            // Botón editar
            const btnEditar = document.createElement('button');
            btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
            btnEditar.className = 'btn-icon btn-edit';
            btnEditar.title = 'Editar';
            btnEditar.onclick = () => editarConsulta(consulta);
            celdaAcciones.appendChild(btnEditar);
            
            // Botón eliminar
            const btnEliminar = document.createElement('button');
            btnEliminar.innerHTML = '<i class="fas fa-trash"></i>';
            btnEliminar.className = 'btn-icon btn-delete';
            btnEliminar.title = 'Eliminar';
            btnEliminar.onclick = () => eliminarConsulta(consulta.consultaID);
            celdaAcciones.appendChild(btnEliminar);
        });
    }
    
    // Funciones para filtrado y búsqueda
    function aplicarFiltros() {
        const filtroEspecialidad = filterEspecialidad.value;
        const filtroMedico = filterMedico.value;
        const filtroFecha = filterFecha.value;
        const textoBusqueda = searchInput.value.toLowerCase();
        
        // Aplicar filtros
        let consultasFiltradas = consultas;
        
        // Filtrar por especialidad (a través del médico)
        if (filtroEspecialidad) {
            consultasFiltradas = consultasFiltradas.filter(consulta => {
                const medico = medicos.find(m => m.medicoID == consulta.medicoID);
                return medico && parseInt(medico.especialidadID) === parseInt(filtroEspecialidad);
            });
        }
        
        // Filtrar por médico
        if (filtroMedico) {
            consultasFiltradas = consultasFiltradas.filter(consulta => 
                parseInt(consulta.medicoID) === parseInt(filtroMedico)
            );
        }
        
        // Filtrar por fecha
        if (filtroFecha) {
            const fechaSeleccionada = new Date(filtroFecha);
            fechaSeleccionada.setHours(0, 0, 0, 0);
            
            consultasFiltradas = consultasFiltradas.filter(consulta => {
                const fechaConsulta = new Date(consulta.fechaConsulta);
                fechaConsulta.setHours(0, 0, 0, 0);
                return fechaConsulta.getTime() === fechaSeleccionada.getTime();
            });
        }
        
        // Buscar por texto
        if (textoBusqueda) {
            consultasFiltradas = consultasFiltradas.filter(consulta => {
                // Buscar en médico
                const medico = medicos.find(m => m.medicoID == consulta.medicoID);
                const nombreMedico = medico ? `${medico.nombre} ${medico.apellido}`.toLowerCase() : '';
                
                // Buscar en cliente
                const cliente = clientes.find(c => c.clienteID == consulta.clienteID);
                const nombreCliente = cliente ? `${cliente.nombre} ${cliente.apellido}`.toLowerCase() : '';
                
                // Buscar en diagnóstico y tratamiento
                const diagnostico = (consulta.diagnostico || '').toLowerCase();
                const tratamiento = (consulta.tratamiento || '').toLowerCase();
                
                return nombreMedico.includes(textoBusqueda) || 
                       nombreCliente.includes(textoBusqueda) || 
                       diagnostico.includes(textoBusqueda) || 
                       tratamiento.includes(textoBusqueda);
            });
        }
        
        // Actualizar tabla con resultados filtrados
        actualizarTablaConsultas(consultasFiltradas);
    }
    
    // Funciones utilitarias
    function obtenerNombreEspecialidad(especialidadId) {
        if (!especialidadId) return 'Desconocida';
        
        const especialidadIdInt = parseInt(especialidadId);
        const especialidad = especialidades.find(e => parseInt(e.especialidadID) === especialidadIdInt);
        return especialidad ? especialidad.nombre : 'Desconocida';
    }
    
    function formatearFecha(fechaStr) {
        if (!fechaStr) return 'Fecha no disponible';
        
        try {
            const fecha = new Date(fechaStr);
            return fecha.toLocaleString('es-ES', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit', 
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error al formatear fecha:', error);
            return 'Fecha inválida';
        }
    }
    
    function formatearFechaISO(fechaStr) {
        if (!fechaStr) return '';
        
        try {
            const fecha = new Date(fechaStr);
            const tzoffset = fecha.getTimezoneOffset() * 60000; // offset en milisegundos
            const fechaLocal = new Date(fecha.getTime() - tzoffset);
            return fechaLocal.toISOString().slice(0, 16); // Formato: YYYY-MM-DDTHH:MM
        } catch (error) {
            console.error('Error al formatear fecha ISO:', error);
            return '';
        }
    }
    
    function mostrarMensaje(mensaje, tipo) {
        alert(mensaje);
    }
    
    // Cerrar modal al hacer clic fuera de él
    window.onclick = function(event) {
        if (event.target == consultaModal) {
            cerrarModal();
        }
    };
});