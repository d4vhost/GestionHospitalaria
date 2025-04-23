document.addEventListener('DOMContentLoaded', function() {
    // Funcionalidad del menú hamburguesa
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
        return { $values: [] };
      }
    }
  
    // Cargar datos para el dashboard
    async function loadDashboardData() {
      // Obtener datos de centros médicos
      const centrosData = await fetchData('https://localhost:7207/api/CentroMedicos');
      const centrosCount = centrosData.$values ? centrosData.$values.length : 0;
      document.getElementById('centros-count').textContent = centrosCount;
  
      // Obtener datos de médicos
      const medicosData = await fetchData('https://localhost:7207/api/MedicosApi');
      const medicosCount = medicosData.$values ? medicosData.$values.length : 0;
      document.getElementById('medicos-count').textContent = medicosCount;
  
      // Obtener datos de especialidades
      const especialidadesData = await fetchData('https://localhost:7207/api/Especialidades');
      const especialidadesCount = especialidadesData.$values ? especialidadesData.$values.length : 0;
      document.getElementById('especialidades-count').textContent = especialidadesCount;
  
      // Obtener datos de consultas
      const consultasData = await fetchData('https://localhost:7207/api/ConsultasApi');
      const consultasCount = consultasData.$values ? consultasData.$values.length : 0;
      document.getElementById('consultas-count').textContent = consultasCount;
    }
  
    // Cargar los datos al iniciar
    loadDashboardData();
  });