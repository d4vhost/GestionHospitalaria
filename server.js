// Importar módulos necesarios
const express = require('express');
const path = require('path');
const cors = require('cors');

// Crear la aplicación Express
const app = express();
const PORT = 3000;

// Configurar middleware para servir archivos estáticos y analizar JSON
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// Configurar CORS para permitir peticiones a la API
app.use(cors());

// Ruta principal para servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'index.html'));
});

// Rutas específicas para los otros archivos HTML
app.get('/centros-medicos', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'centros-medicos.html'));
});

app.get('/medicos-especialidades', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'medicos-especialidades.html'));
});

// Ruta para el dashboard (página principal después del login)
app.get('/html/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'dashboard.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});