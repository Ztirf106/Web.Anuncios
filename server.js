const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 3000;

// 🔹 Agregar esta línea para definir la variable global de reservas
let reservations = [];

// Función para registrar eventos
function registrarEvento(usuario, accion, detalles = {}) {
  const timestamp = new Date().toISOString();
  const log = `${timestamp} - Usuario: ${usuario} - Acción: ${accion} - Detalles: ${JSON.stringify(detalles)}\n`;

  fs.appendFile('eventos.log', log, (err) => {
    if (err) console.error('Error al registrar evento:', err);
  });
}

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'index')));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index', 'web Anuncios.html'));
});

// Ruta POST para login
app.post('/login', async (req, res) => {
  const { usuario, contrasena } = req.body;
  try {
    const data = fs.readFileSync('usuarios.txt', 'utf8');
    const lines = data.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      const [storedUser, storedHash] = line.trim().split(':');
      if (storedUser === usuario && await bcrypt.compare(contrasena, storedHash)) {
        const tipo = storedUser.startsWith("admin") ? "Administrador" : "Residente";
        registrarEvento(usuario, 'Inicio de sesión');
        return res.json({ success: true, tipo });
      }
    }
    res.json({ success: false });
  } catch (err) {
    console.error("❌ Error leyendo usuarios.txt:", err.message);
    res.status(500).send('Error del servidor');
  }
});

// Ruta POST para registrar reserva del SUM
app.post('/reservar', (req, res) => {
  const { usuario, fecha, hora, proposito } = req.body;

  // Verificar que el usuario esté autenticado
  if (!usuario) {
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }

  // 1. Validar conflicto en el backend
  const conflictExists = reservations.some(res =>
    res.date === fecha && res.time === hora
  );

  if (conflictExists) {
    registrarEvento(usuario, 'Intento de reserva conflictiva', { fecha, hora });
    return res.json({ success: false, message: 'Conflicto de reserva' });
  }

  // 2. Guardar la reserva
  const newReservation = {
    id: Date.now(),
    user: usuario,
    date: fecha,
    time: hora,
    purpose: proposito
  };

  reservations.push(newReservation);

  // 3. Registrar el log
  registrarEvento(usuario, 'Reserva creada', {
    fecha: fecha,
    hora: hora,
    proposito: proposito
  });

  res.json({ success: true });
});

// 🔹 Ruta GET para cerrar sesión
app.get('/logout', (req, res) => {
  const usuario = req.query.usuario || 'desconocido';
  registrarEvento(usuario, 'Cierre de sesión');
  res.redirect('/');
});

// 🔹 (Opcional) Ver eventos desde el navegador
app.get('/logs', (req, res) => {
  fs.readFile(path.join(__dirname, 'eventos.log'), 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error al leer logs');
    res.type('text').send(data.replace(/\n/g, '<br>'));
  });
});

// Ruta para obtener todos los usuarios
app.get('/api/usuarios', (req, res) => {
  try {
    const data = fs.readFileSync('usuarios.txt', 'utf8');
    const usuarios = data.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [username] = line.split(':');
        return { username };
      });
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: 'Error al leer usuarios' });
  }
});

// Ruta para registrar nuevo usuario
app.post('/api/usuarios/registro', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Verificar si el usuario ya existe
    const data = fs.readFileSync('usuarios.txt', 'utf8');
    if (data.includes(`${username}:`)) {
      return res.status(400).json({ error: 'Usuario ya existe' });
    }
    
    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Guardar el nuevo usuario
    fs.appendFileSync('usuarios.txt', `\n${username}:${hashedPassword}`);
    
    registrarEvento(username, 'Registro de nuevo usuario');
    
    res.status(201).json({
      mensaje: 'Usuario registrado correctamente',
      usuario: { username }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Exporta la app para las pruebas
module.exports = app;

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});