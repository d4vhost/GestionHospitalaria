document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario está autenticado
    const usuarioID = sessionStorage.getItem('usuarioID');
    const centroID = sessionStorage.getItem('centroID');
   
    if (!usuarioID || !centroID) {
        // Si no hay sesión, redirigir al login
        window.location.href = '/';
        return;
    }
   
    // Mostrar información del centro médico actual
    const centroNombre = sessionStorage.getItem('centraNombre');
    // Verificar si el elemento existe antes de modificarlo
    const centroActualEl = document.querySelector('.site-title');
    if (centroNombre && centroActualEl) {
        centroActualEl.textContent = `Sistema Hospitalario - ${centroNombre}`;
    }
   
    // Funcionalidad del menú hamburguesa
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
        if (sidebar && overlay) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
   
    if (closeMenu) {
        closeMenu.addEventListener('click', closeSidebar);
    }
    
    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }
 
    // Función para obtener datos de las APIs
    async function fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching data from ${url}:`, error);
            return [];
        }
    }
 
    // Cargar datos para el dashboard
    async function loadDashboardData() {
        // Obtener datos de centros médicos - solo mostrar el centro actual
        const centrosCountEl = document.getElementById('centros-count');
        if (centrosCountEl) {
            centrosCountEl.textContent = "1"; // Solo se muestra un centro
        }
 
        // Obtener datos de médicos - filtrar por centro actual
        const medicosData = await fetchData('https://localhost:7207/api/MedicosApi');
        const medicosFiltrados = medicosData.filter(medico => medico.centroID == centroID);
        const medicosCountEl = document.getElementById('medicos-count');
        if (medicosCountEl) {
            medicosCountEl.textContent = medicosFiltrados.length;
        }
 
        // Obtener datos de especialidades - mostrar solo las del centro actual
        const especialidadesData = await fetchData('https://localhost:7207/api/Especialidades');
        // Aquí asumimos que tienes una relación entre especialidades y centros
        const especialidadesCountEl = document.getElementById('especialidades-count');
        if (especialidadesCountEl) {
            especialidadesCountEl.textContent = especialidadesData.length;
        }
 
        // Obtener datos de consultas - filtrar por centro actual
        const consultasData = await fetchData('https://localhost:7207/api/ConsultasApi');
        const consultasFiltradas = consultasData.filter(consulta => consulta.centroID == centroID);
        const consultasCountEl = document.getElementById('consultas-count');
        if (consultasCountEl) {
            consultasCountEl.textContent = consultasFiltradas.length;
        }
    }
 
    // Manejar el cierre de sesión
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            sessionStorage.clear();
            window.location.href = '/';
        });
    }
 
    // Cargar los datos al iniciar
    loadDashboardData();
});