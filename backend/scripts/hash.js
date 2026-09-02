/** Genera un hash bcrypt para una contrasena: npm run hash -- "MiClave" */
import bcrypt from "bcryptjs";

const clave = process.argv[2];
if (!clave) {
  console.error('Uso: npm run hash -- "MiClave"');
  process.exit(1);
}
console.log(bcrypt.hashSync(clave, 10));
