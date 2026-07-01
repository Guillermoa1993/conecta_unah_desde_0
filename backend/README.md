# UNAH Conecta Pumas — Backend API

API REST construida con **Clean Architecture**, Express.js y PostgreSQL.

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Framework | Express.js 5 + TypeScript |
| Base de datos | PostgreSQL (via `pg`) |
| Autenticación | JWT (`jsonwebtoken`) + Bcrypt |
| ORM | Ninguno — queries SQL directas |

## Estructura del proyecto

```
backend/
├── database/
│   └── schema.sql              # DDL completo de la base de datos
├── src/
│   ├── domain/
│   │   ├── entities/           # Interfaces TypeScript de cada entidad
│   │   │   ├── Usuario.ts
│   │   │   ├── Evento.ts
│   │   │   ├── Inscripcion.ts
│   │   │   ├── Asistencia.ts
│   │   │   ├── Constancia.ts
│   │   │   └── Notificacion.ts
│   │   └── repositories/       # Contratos (interfaces) de repositorios
│   ├── use-cases/              # Lógica de negocio — sin dependencias de Express ni pg
│   │   ├── auth/               # Login, registro
│   │   ├── eventos/            # CRUD + aprobación VOAE
│   │   ├── inscripciones/      # Inscribir/cancelar estudiante
│   │   ├── asistencia/         # Registro QR
│   │   └── constancias/        # Gestión horas VOAE
│   ├── infrastructure/
│   │   ├── database/db.ts      # Pool de conexión pg
│   │   ├── repositories/       # Implementaciones Postgres de cada repositorio
│   │   └── server/index.ts     # Punto de entrada: DI + registro de rutas
│   └── interfaces/
│       ├── controllers/        # Handlers Express (req → use-case → res)
│       ├── middlewares/        # autenticar(), autorizar(), errorMiddleware
│       └── routes/             # Definición de rutas por módulo
├── .env.example                # Variables de entorno requeridas
├── package.json
└── tsconfig.json
```

## Instalación y ejecución

### 1. Copiar variables de entorno

```bash
cp .env.example .env
# Editar .env con tu DATABASE_URL y un JWT_SECRET seguro
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear las tablas en PostgreSQL

Ejecutar el schema en tu base de datos:

```bash
psql "$DATABASE_URL" -f database/schema.sql
```

O desde Adminer/pgAdmin pegando el contenido de `database/schema.sql`.

### 4. Iniciar en modo desarrollo

```bash
npm run dev
# → http://localhost:5000
```

### 5. Build de producción

```bash
npm run build   # Compila TypeScript a dist/
npm start       # Ejecuta dist/infrastructure/server/index.js
```

## Endpoints disponibles

### Salud
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Estado del servidor y conexión a BD |

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login — devuelve JWT |
| POST | `/api/auth/registro` | Registrar nuevo usuario |
| GET | `/api/auth/me` | Perfil del usuario autenticado |

### Eventos
| Método | Ruta | Auth | Rol |
|--------|------|------|-----|
| GET | `/api/eventos` | ✓ | Todos |
| GET | `/api/eventos/mis-eventos` | ✓ | TUTOR |
| GET | `/api/eventos/pendientes` | ✓ | VOAE, ADMIN |
| GET | `/api/eventos/:id` | ✓ | Todos |
| POST | `/api/eventos` | ✓ | TUTOR |
| PUT | `/api/eventos/:id` | ✓ | TUTOR, ADMIN |
| PATCH | `/api/eventos/:id/aprobar` | ✓ | VOAE, ADMIN |
| PATCH | `/api/eventos/:id/rechazar` | ✓ | VOAE, ADMIN |

### Inscripciones
| Método | Ruta | Rol |
|--------|------|-----|
| GET | `/api/inscripciones/mis-inscripciones` | ESTUDIANTE |
| GET | `/api/inscripciones/evento/:eventoId` | TUTOR, VOAE, ADMIN |
| POST | `/api/inscripciones/evento/:eventoId` | ESTUDIANTE |
| DELETE | `/api/inscripciones/evento/:eventoId` | ESTUDIANTE |

### Asistencia
| Método | Ruta | Rol |
|--------|------|-----|
| GET | `/api/asistencia/evento/:eventoId` | TUTOR, VOAE, ADMIN |
| POST | `/api/asistencia/qr` | ESTUDIANTE |
| POST | `/api/asistencia/manual/evento/:eventoId` | TUTOR, VOAE, ADMIN |

### Constancias VOAE
| Método | Ruta | Rol |
|--------|------|-----|
| GET | `/api/constancias/mis-constancias` | ESTUDIANTE |
| GET | `/api/constancias/pendientes` | VOAE, ADMIN |
| POST | `/api/constancias/evento/:eventoId` | ESTUDIANTE |
| PATCH | `/api/constancias/:id/aprobar` | VOAE, ADMIN |
| PATCH | `/api/constancias/:id/rechazar` | VOAE, ADMIN |

### Notificaciones
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/notificaciones` | Todas las notificaciones del usuario |
| GET | `/api/notificaciones/no-leidas` | Solo las no leídas |
| PATCH | `/api/notificaciones/:id/leer` | Marcar una como leída |
| PATCH | `/api/notificaciones/leer-todas` | Marcar todas como leídas |

## Autenticación

Todas las rutas (excepto `/api/auth/login` y `/api/auth/registro`) requieren el header:

```
Authorization: Bearer <token>
```

El token se obtiene al hacer login y expira en 8 horas.

## Con Docker

Ver el `docker-compose.yml` en la raíz del repositorio.

```bash
# Levantar todo (backend + frontend + adminer)
docker compose up

# Solo el backend
docker compose up backend
```
