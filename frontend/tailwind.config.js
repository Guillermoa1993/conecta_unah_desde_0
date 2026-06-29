/**
 * Configuración de Tailwind — UNAH Conecta Pumas
 * Los colores institucionales están definidos aquí como fuente única.
 * NO cambiar los valores de 'unah-*' sin autorización del equipo de diseño.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'unah-blue':  '#004B87',  // Azul institucional principal
        'unah-navy':  '#003366',  // Azul oscuro / navy
        'unah-gold':  '#FFD100',  // Dorado institucional
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"',
          'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif',
        ],
      },
      borderRadius: {
        'xl':  '1rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
