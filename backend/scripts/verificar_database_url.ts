import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.DATABASE_URL || '';
// Enmascaramos la contraseña para no mostrarla en pantalla
const enmascarada = url.replace(/:([^:@]+)@/, ':****@');

console.log('\nDATABASE_URL que está usando este proceso ahora mismo:\n');
console.log(enmascarada || '(vacío - no se encontró DATABASE_URL)');