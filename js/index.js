document.addEventListener('DOMContentLoaded', function() {
    // Referencia a elementos del DOM
    const loginForm = document.getElementById('loginForm');
    const centroMedicoSelect = document.getElementById('centroMedico');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
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
    
    // Cargar los centros médicos al iniciar
    async function loadCentrosMedicos() {
        const centrosData = await fetchData('https://localhost:7207/api/CentroMedicos');
        
        // Limpiar opciones existentes
        while (centroMedicoSelect.options.length > 1) {
            centroMedicoSelect.remove(1);
        }
        
        // Agregar nuevas opciones desde la API
        centrosData.forEach(centro => {
            const option = document.createElement('option');
            option.value = centro.centroID;
            option.textContent = centro.nombre;
            centroMedicoSelect.appendChild(option);
        });
    }
    
    // Función para validar el login
    async function validarLogin(centroID, email, password) {
        const usuarios = await fetchData('https://localhost:7207/api/UsuarioLogins');
        
        // Buscar usuario que coincida con el centro, email y contraseña
        const usuarioValido = usuarios.find(usuario => 
            usuario.centroID == centroID && 
            usuario.email === email && 
            usuario.contrasena === password
        );
        
        if (usuarioValido) {
            // Guardar información del usuario y centro en sessionStorage
            sessionStorage.setItem('usuarioID', usuarioValido.usuarioID);
            sessionStorage.setItem('centroID', usuarioValido.centroID);
            sessionStorage.setItem('centraNombre', usuarioValido.centro.nombre);
            sessionStorage.setItem('email', usuarioValido.email);
            
            return true;
        }
        
        return false;
    }
    
    // Manejar el envío del formulario
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const centroID = centroMedicoSelect.value;
        const email = emailInput.value;
        const password = passwordInput.value;
        
        if (!centroID) {
            mostrarMensaje('Debe seleccionar un centro médico', 'error');
            return;
        }
        
        // Mostrar indicador de carga
        document.querySelector('.login-btn').textContent = 'Verificando...';
        document.querySelector('.login-btn').disabled = true;
        
        // Validar credenciales
        const loginExitoso = await validarLogin(centroID, email, password);
        
        if (loginExitoso) {
            mostrarMensaje('Acceso correcto. Redirigiendo...', 'success');
            // Redirigir al dashboard después de un breve retraso
            setTimeout(() => {
                window.location.href = '/html/home.html';
            }, 1500);
        } else {
            document.querySelector('.login-btn').textContent = 'Iniciar Sesión';
            document.querySelector('.login-btn').disabled = false;
            mostrarMensaje('Credenciales incorrectas. Por favor, verifique e intente nuevamente.', 'error');
        }
    });
    
    // Función para mostrar mensajes al usuario
    function mostrarMensaje(mensaje, tipo) {
        // Verificar si ya existe un mensaje y eliminarlo
        const mensajeExistente = document.querySelector('.mensaje-alerta');
        if (mensajeExistente) {
            mensajeExistente.remove();
        }
        
        // Crear elemento para el mensaje
        const mensajeElement = document.createElement('div');
        mensajeElement.className = `mensaje-alerta ${tipo}`;
        mensajeElement.textContent = mensaje;
        
        // Insertar después del botón de login
        const loginBtn = document.querySelector('.login-btn');
        loginBtn.insertAdjacentElement('afterend', mensajeElement);
        
        // Eliminar el mensaje después de 5 segundos
        setTimeout(() => {
            mensajeElement.remove();
        }, 5000);
    }
    
    // Cargar los centros médicos al iniciar la página
    loadCentrosMedicos();
});