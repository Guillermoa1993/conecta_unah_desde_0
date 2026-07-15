# UNAH Conecta Pumas — Proyecto Limpio desde 0

Plantilla base con backend (Clean Architecture), frontend (React + TypeScript) y conexión a PostgreSQL en Render.com, lista para construir encima.

---

## Estructura

```
proyecto_unah_conecta_desde_0/
├── backend/
│   ├── database/
│   │   └── schema.sql              ← DDL completo de la BD
│   ├── scripts/
│   │   └── initDb.ts               ← Inicializa las tablas
│   └── src/
│       ├── domain/
│       │   ├── entities/           ← Tipos/interfaces del dominio
│       │   └── repositories/       ← Contratos de repositorios
│       ├── use-cases/              ← Lógica de negocio
│       ├── infrastructure/
│       │   ├── database/
│       │   │   └── db.ts           ← Conexión Pool a PostgreSQL
│       │   └── repositories/       ← Implementaciones SQL
│       └── interfaces/
│           ├── controllers/        ← Handlers de Express
│           ├── middlewares/        ← JWT auth, manejo de errores
│           └── routes/             ← Definición de rutas
│
├── frontend/
│   └── src/
│       ├── types/index.ts          ← Tipos TypeScript compartidos
│       ├── services/
│       │   ├── api.ts              ← Cliente fetch con JWT automático
│       │   └── auth.service.ts     ← Login, registro, logout
│       ├── context/
│       │   └── AuthContext.tsx     ← Estado global de autenticación
│       ├── hooks/
│       │   └── useAuth.ts          ← Hook de acceso al AuthContext
│       └── app/
│           ├── pages/
│           │   ├── LoginPage.tsx   ← Página de login
│           │   └── DashboardPage.tsx ← Dashboard post-login
│           └── App.tsx             ← Router + rutas
│
├── docker-compose.yml              ← Backend + Frontend + Adminer
└── .gitignore
```

---

## Inicio rápido

### Requisitos

- Node.js 18+
- (Opcional) Docker Desktop para Docker Compose

### Backend

```bash
cd backend
npm install
npm run dev
# → http://localhost:5000
# → http://localhost:5000/api/health
```

### Inicializar tablas (solo la primera vez)

```bash
cd backend
npm run db:init
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Con Docker

```bash
# Producción
docker compose up --build

# Desarrollo (hot-reload)
docker compose --profile dev up --build
```

| Servicio  | URL                   |
|-----------|-----------------------|
| Frontend  | http://localhost:5173 |
| Backend   | http://localhost:5000 |
| Adminer   | http://localhost:8080 |

### Adminer — conectarse a la BD

| Campo      | Valor                                            |
|------------|--------------------------------------------------|
| Sistema    | PostgreSQL                                       |
| Servidor   | dpg-d931mbugvqtc739qj7h0-a.virginia-postgres.render.com |
| Usuario    | unah_conecta2_user                               |
| Base datos | unah_conecta2                                    |

---

## Variables de entorno

### `backend/.env`

```env
DATABASE_URL=postgresql://unah_conecta2_user:PASSWORD@dpg-d931mbugvqtc739qj7h0-a.virginia-postgres.render.com/unah_conecta2
PORT=5000
JWT_SECRET=tu_secreto_aqui
FRONTEND_URL=http://localhost:5185
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Arquitectura del backend

```
Interfaces (HTTP)  →  Use Cases (Negocio)  →  Domain (Entidades)
                              ↑
                    Infrastructure (BD, APIs)
```

- **Domain**: entidades e interfaces sin dependencias externas
- **Use Cases**: lógica de negocio pura
- **Infrastructure**: implementaciones concretas (PostgreSQL, etc.)
- **Interfaces**: controllers, middlewares, rutas de Express

---

Universidad Nacional Autónoma de Honduras — Grupo 1
