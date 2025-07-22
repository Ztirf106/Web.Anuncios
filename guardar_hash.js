const fs = require('fs');
const bcrypt = require('bcrypt');

const contraseñaComun = "clave123";
const usuarios = ["admin01", "admin02", "A101", "A102", "A103", "A104", "A105", "A106", "A107", "A108", "A109", "A110"];

(async () => {
  let contenido = "";

  for (let user of usuarios) {
    const hash = await bcrypt.hash(contraseñaComun, 10);
    contenido += `${user}:${hash}\n`;
  }

  fs.writeFileSync('usuarios.txt', contenido);
  console.log("✅ usuarios.txt creado correctamente con contraseñas cifradas.");
})();
