Diseña el frontend completo del módulo de Eventos para una plataforma universitaria llamada “Conecta Pumas”. El sistema está enfocado en la gestión y validación digital de actividades académicas relacionadas con el artículo 140 de la universidad. El diseño debe ser moderno, profesional, limpio, responsive y altamente intuitivo, utilizando una estética tecnológica institucional universitaria.

La interfaz debe desarrollarse utilizando React + TypeScript + Tailwind CSS y debe seguir una arquitectura escalable basada en componentes reutilizables. El diseño debe ser tipo dashboard moderno y compatible con Progressive Web App (PWA), optimizado para móviles, tablets y computadoras.

La identidad visual debe respetar estrictamente la siguiente paleta de colores institucional:

* Primary Blue: #004B87
* Gold: #FFD100
* Dark Navy: #003366
* White: #FFFFFF
* Light Gray: #F4F6F8

El color azul principal debe utilizarse para navegación, botones principales y elementos interactivos importantes. El dorado debe utilizarse como color de acento para notificaciones, indicadores y detalles destacados. El fondo general debe mantenerse limpio usando blanco y gris claro.

El módulo de Eventos debe contemplar cuatro roles principales:

1. Estudiante
2. Tutor o Facilitador
3. Administrador del Sistema
4. Personal VOAE

Cada rol debe tener interfaces y permisos visuales diferenciados.

---

## DISEÑO GENERAL DEL MÓDULO

Crear un dashboard principal moderno con:

* Sidebar lateral colapsable.
* Navbar superior con perfil de usuario.
* Sistema de notificaciones.
* Diseño minimalista tipo SaaS moderno.
* Cards con sombras suaves y bordes redondeados.
* Iconografía limpia y profesional.
* Espaciado amplio y excelente jerarquía visual.

Usar animaciones suaves y transiciones modernas.

---

## VISTAS DEL ESTUDIANTE

Diseñar las siguientes pantallas:

1. Dashboard del estudiante

* Resumen de horas acumuladas.
* Próximos eventos.
* Eventos finalizados.
* Estado de cumplimiento del artículo 140.
* Barra de progreso visual.
* Historial reciente de asistencia.

2. Vista de eventos disponibles

* Cards de eventos con:

  * nombre,
  * tutor,
  * fecha,
  * hora,
  * duración,
  * cupos,
  * estado.
* Botón para ingresar al evento.
* Filtros por fecha y categoría.
* Buscador dinámico.

3. Escaneo QR

* Interfaz móvil centrada.
* Simulación de cámara QR moderna.
* Estado de validación en tiempo real.
* Confirmación visual de asistencia exitosa.
* Animaciones de éxito/error.

4. Encuesta de satisfacción

* Diseño amigable y minimalista.
* Preguntas con rating por estrellas.
* Campo de comentarios.
* Indicador de progreso.
* Confirmación final elegante.

5. Historial académico

* Tabla moderna con:

  * eventos asistidos,
  * horas acumuladas,
  * fecha,
  * estado validado.
* Descarga de certificados PDF.

---

## VISTAS DEL TUTOR

1. Dashboard del tutor

* Eventos activos.
* Total de estudiantes registrados.
* Estadísticas rápidas.
* Próximas tutorías.
* Actividad reciente.

2. Crear evento

* Formulario moderno dividido por secciones:

  * título,
  * descripción,
  * fecha,
  * hora,
  * duración,
  * ubicación,
  * límite de participantes.
* Selector de categorías.
* Validaciones visuales.
* Calendario elegante.
* Inputs modernos.

3. Gestión en tiempo real

* Pantalla principal del evento activo.
* Generación de QR dinámico grande y visible.
* Temporizador del QR.
* Lista de estudiantes registrados en tiempo real.
* Indicador de asistencia.
* Botón de finalizar evento.
* Estadísticas rápidas del evento.

4. Reportes del tutor

* Gráficas modernas.
* Participación estudiantil.
* Cantidad de asistentes.
* Eventos realizados.
* Horas impartidas.

---

## VISTAS DEL ADMINISTRADOR

1. Dashboard administrativo

* KPIs generales.
* Total de eventos.
* Total de estudiantes activos.
* Eventos del día.
* Reportes rápidos.
* Estado del sistema.

2. Gestión de eventos

* Tabla avanzada con filtros.
* Editar eventos.
* Eliminar eventos.
* Cambiar estados.
* Supervisar actividades.

3. Gestión de usuarios

* CRUD visual moderno.
* Roles y permisos.
* Estado activo/inactivo.
* Búsqueda rápida.

4. Configuración del sistema

* Parámetros globales.
* Configuración de horas.
* Seguridad.
* Control de respaldos.

---

## VISTAS DE VOAE

1. Panel de auditoría

* Validación de eventos.
* Revisión de asistencia.
* Verificación de certificados.
* Historial institucional.

2. Reportes oficiales

* Exportación PDF.
* Estadísticas generales.
* Horas acumuladas por estudiante.
* Filtros avanzados.

---

## REQUERIMIENTOS VISUALES IMPORTANTES

* Diseño extremadamente limpio y profesional.
* UI moderna tipo plataformas SaaS premium.
* Totalmente responsive.
* Excelente experiencia móvil.
* Compatible con PWA.
* Componentes reutilizables.
* Modo claro elegante.
* Tablas modernas.
* Cards minimalistas.
* Inputs modernos con validaciones visuales.
* Loading states.
* Skeleton loaders.
* Empty states.
* Toast notifications.
* Modales elegantes.
* Navegación fluida.

---

## COMPONENTES IMPORTANTES

Crear componentes reutilizables para:

* EventCard
* QRScanner
* DynamicQRCode
* AttendanceTable
* ProgressCard
* SurveyForm
* StatsCard
* Sidebar
* Navbar
* NotificationPanel
* ModalConfirm
* UserProfileCard

---

## ESTILO VISUAL DE REFERENCIA

Inspirarse visualmente en:

* Notion
* Stripe Dashboard
* Linear
* Vercel Dashboard
* Clerk
* Supabase Dashboard

Mantener una apariencia:

* tecnológica,
* académica,
* minimalista,
* elegante,
* rápida,
* accesible.

Evitar diseños sobrecargados o colores excesivos. Priorizar claridad visual, usabilidad y experiencia del usuario.
