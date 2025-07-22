const request = require('supertest');
const app = require('../server');

describe('API de usuario', () => {
  // Prueba para obtener todos los usuarios
  it('debe obtener todos los usuarios', async () => {
    const response = await request(app)
      .get('/api/usuarios')
      .expect(200);
    
    expect(response.body).toBeInstanceOf(Array);
  });

  // Prueba para registrar un nuevo usuario
  it('debe registrar un nuevo usuario', async () => {
    const nuevoUsuario = {
      username: 'testuser' + Date.now(), // Usamos timestamp para hacerlo único
      password: 'testpass123'
    };

    const response = await request(app)
      .post('/api/usuarios/registro')
      .send(nuevoUsuario)
      .expect(201);
    
    expect(response.body).toHaveProperty('mensaje');
    expect(response.body.mensaje).toBe('Usuario registrado correctamente');
    expect(response.body).toHaveProperty('usuario');
    console.log("Usuario registrado:", response.body.usuario);
  });
});