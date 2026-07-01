import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layouts/RootLayout";
import { ProtectedRoute } from "./components/guards/ProtectedRoute";

// Auth & registro (públicas)
import { Login } from "./pages/Login";
import { RoleSelector } from "./pages/RoleSelector";
import { RegistroSelector } from "./pages/RegistroSelector";
import { FichaEstudiante } from "./pages/student/FichaEstudiante";
import { FichaEmpleado } from "./pages/tutor/FichaEmpleado";

// Student
import { StudentDashboard } from "./pages/student/StudentDashboard";
import { SocialFeed } from "./pages/student/SocialFeed";
import { StudentProfile } from "./pages/student/StudentProfile";
import { AvailableEvents } from "./pages/student/AvailableEvents";
import { QRScanner } from "./pages/student/QRScanner";
import { Survey } from "./pages/student/Survey";
import { AcademicHistory } from "./pages/student/AcademicHistory";

// Tutor
import { TutorDashboard } from "./pages/tutor/TutorDashboard";
import { CreateEvent } from "./pages/tutor/CreateEvent";
import { ManageEvent } from "./pages/tutor/ManageEvent";
import { TutorReports } from "./pages/tutor/TutorReports";

// Admin
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { Administracion } from "./pages/admin/Administracion";
import { EventManagement } from "./pages/admin/EventManagement";
import { UserManagement } from "./pages/admin/UserManagement";
import { SystemSettings } from "./pages/admin/SystemSettings";
import { CommentsReview } from "./pages/admin/CommentsReview";
import { Roles } from "./pages/admin/Roles";
import { Permissions } from "./pages/admin/Permissions";

// Grupo 3 — Student
import { SolicitarEvento } from "./pages/student/SolicitarEvento";

// Grupo 3 — Tutor
import { LiveEvent } from "./pages/tutor/LiveEvent";
import { TutorEventos } from "./pages/tutor/TutorEventos";

// VOAE
import { VOAEDashboard } from "./pages/voae/VOAEDashboard";
import { OfficialReports } from "./pages/voae/OfficialReports";

// Grupo 3 — VOAE
import { Moderadores } from "./pages/voae/Moderadores";
import { VOAERecords } from "./pages/voae/Records";
import { CentrosRegionales } from "./pages/voae/CentrosRegionales";
import { ValidacionEvento } from "./pages/voae/ValidacionEvento";

// Employees (compartido por tutor/admin/voae)
import { Notifications } from "./pages/employees/Notifications";
import { Logs } from "./pages/employees/Logs";

// Mantenimiento (compartido por admin/tutor/voae)
import {
  CareersPage, RegionalCentersPage, UserTypesPage,
  UserStatesPage, NotificationTypesPage,
} from "./pages/maintenance/MaintenanceCatalog";

/* ─── Helper para envolver en ProtectedRoute ─── */
const P = (el: React.ReactNode) => <ProtectedRoute>{el}</ProtectedRoute>;

/* ─── Mantenimiento repetido por prefijo ─── */
const maintenanceRoutes = (prefix: string) => [
  { path: `${prefix}/maintenance/careers`,            element: P(<CareersPage />)           },
  { path: `${prefix}/maintenance/regional-centers`,   element: P(<RegionalCentersPage />)   },
  { path: `${prefix}/maintenance/user-types`,         element: P(<UserTypesPage />)         },
  { path: `${prefix}/maintenance/user-states`,        element: P(<UserStatesPage />)        },
  { path: `${prefix}/maintenance/notification-types`, element: P(<NotificationTypesPage />) },
];

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      // ── Públicas (sin guard) ──────────────────────────────
      { index: true,                    element: <Login /> },
      { path: "roles",                  element: <RoleSelector /> },
      { path: "registro",               element: <RegistroSelector /> },
      { path: "registro/estudiante",    element: <FichaEstudiante /> },
      { path: "registro/empleado",      element: <FichaEmpleado /> },

      // ── Empleados (tutor/admin/voae comparten) ────────────
      { path: "employees/notifications", element: P(<Notifications />) },
      { path: "employees/logs",          element: P(<Logs />) },

      // ── Estudiante ────────────────────────────────────────
      { path: "student",                element: P(<StudentDashboard />) },
      { path: "student/feed",           element: P(<SocialFeed />) },
      { path: "student/ficha",          element: P(<StudentProfile />) },
      { path: "student/events",         element: P(<AvailableEvents />) },
      { path: "student/scan",           element: P(<QRScanner />) },
      { path: "student/survey/:eventId",element: P(<Survey />) },
      { path: "student/history",         element: P(<AcademicHistory />) },
      { path: "student/solicitar",       element: P(<SolicitarEvento />) },
      ...maintenanceRoutes("student"),

      // ── Tutor ─────────────────────────────────────────────
      { path: "tutor",                  element: P(<TutorDashboard />) },
      { path: "tutor/create-event",     element: P(<CreateEvent />) },
      { path: "tutor/event/:eventId",   element: P(<ManageEvent />) },
      { path: "tutor/reports",          element: P(<TutorReports />) },
      { path: "tutor/ficha",             element: P(<FichaEmpleado />) },
      { path: "tutor/live",              element: P(<LiveEvent />) },
      { path: "tutor/eventos",           element: P(<TutorEventos />) },
      ...maintenanceRoutes("tutor"),

      // ── Admin ─────────────────────────────────────────────
      { path: "admin",                  element: P(<AdminDashboard />) },
      { path: "admin/administracion",   element: P(<Administracion />) },
      { path: "admin/events",           element: P(<EventManagement />) },
      { path: "admin/users",            element: P(<UserManagement />) },
      { path: "admin/settings",         element: P(<SystemSettings />) },
      { path: "admin/comments",         element: P(<CommentsReview />) },
      { path: "admin/roles",            element: P(<Roles />) },
      { path: "admin/permissions",      element: P(<Permissions />) },
      ...maintenanceRoutes("admin"),

      // ── VOAE ──────────────────────────────────────────────
      { path: "voae",                    element: P(<VOAEDashboard />) },
      { path: "voae/reports",           element: P(<OfficialReports />) },
      { path: "voae/moderadores",       element: P(<Moderadores />) },
      { path: "voae/records",           element: P(<VOAERecords />) },
      { path: "voae/centros",           element: P(<CentrosRegionales />) },
      { path: "voae/events/:id/validar",element: P(<ValidacionEvento />) },
      ...maintenanceRoutes("voae"),
    ],
  },
]);
