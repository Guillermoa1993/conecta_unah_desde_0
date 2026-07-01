/**
 * TEMA OFICIAL — UNAH Conecta Pumas
 * Fuente única de verdad para colores y tipografía.
 * NO modificar estos valores sin autorización del equipo de diseño.
 * Manual de Identidad Institucional UNAH 2022.
 */

export const UNAH_COLORS = {
  /** Azul institucional principal */
  blue:       '#004B87',
  /** Azul oscuro / navy */
  navy:       '#003366',
  /** Dorado / amarillo institucional */
  gold:       '#FFD100',
  /** Blanco */
  white:      '#FFFFFF',
  /** Fondo general de la app */
  background: '#F0F2F5',
  /** Texto principal */
  text:       '#1A1A2E',
  /** Texto secundario / gris */
  textMuted:  '#6B7280',
  /** Borde suave */
  border:     '#E5E7EB',
  /** Rojo para errores */
  error:      '#DC2626',
  /** Verde para éxito */
  success:    '#16A34A',
} as const;

export const UNAH_FONT = {
  /**
   * Tipografía institucional: sistema operativo nativo.
   * Segoe UI en Windows, SF Pro en macOS/iOS, Roboto en Android.
   */
  family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  size: {
    xs:   '0.75rem',   // 12px
    sm:   '0.875rem',  // 14px
    base: '1rem',      // 16px
    lg:   '1.125rem',  // 18px
    xl:   '1.25rem',   // 20px
    '2xl':'1.5rem',    // 24px
    '3xl':'1.875rem',  // 30px
  },
  weight: {
    normal:    '400',
    medium:    '500',
    semibold:  '600',
    bold:      '700',
  },
} as const;

export const UNAH_RADIUS = {
  sm:   '0.375rem',  // 6px
  md:   '0.5rem',    // 8px
  lg:   '0.75rem',   // 12px
  xl:   '1rem',      // 16px
  '2xl':'1.25rem',   // 20px
  full: '9999px',
} as const;

export const UNAH_SHADOW = {
  sm: '0 1px 3px rgba(0,0,0,0.08)',
  md: '0 2px 8px rgba(0,0,0,0.10)',
  lg: '0 4px 20px rgba(0,0,0,0.12)',
} as const;
