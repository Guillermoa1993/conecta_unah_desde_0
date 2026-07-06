// Script para eliminar el fondo blanco de las imágenes PNG
// Compatible con jimp v1.x
const { Jimp } = require('jimp');
const path = require('path');

const images = [
  'public/puma_estudiante.png',
  'public/puma_docente.png',
  'public/puma_unah.png',
];

// Tolerancia para el blanco (0-255)
const TOLERANCE = 50;

function isWhiteish(r, g, b) {
  return r >= (255 - TOLERANCE) && g >= (255 - TOLERANCE) && b >= (255 - TOLERANCE);
}

async function removeWhiteBackground(filePath) {
  console.log(`Procesando: ${filePath}`);
  
  const image = await Jimp.read(filePath);
  const { width, height } = image.bitmap;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = image.bitmap.data[idx + 0];
      const g = image.bitmap.data[idx + 1];
      const b = image.bitmap.data[idx + 2];
      
      if (isWhiteish(r, g, b)) {
        image.bitmap.data[idx + 3] = 0; // transparente
      }
    }
  }
  
  await image.write(filePath);
  console.log(`Completado: ${filePath}`);
}

async function main() {
  for (const imgPath of images) {
    try {
      await removeWhiteBackground(imgPath);
    } catch (err) {
      console.error(`Error en ${imgPath}:`, err.message);
    }
  }
  console.log('\nProceso terminado.');
}

main();
