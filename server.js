// Importar módulos necesarios
const express = require('express');
const path = require('path');

// Crear la aplicación Express
const app = express();
const PORT = 3000;

// Configurar middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Ruta principal para servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'index.html'));
});

const cors = require('cors');
app.use(cors());


// Rutas específicas para los otros archivos HTML
app.get('/centros-medicos', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'centros-medicos.html'));
});

app.get('/medicos-especialidades', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'medicos-especialidades.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});