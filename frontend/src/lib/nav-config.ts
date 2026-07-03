import { CalendarDays, History, Megaphone, Building2, FileSearch, User, Newspaper, Calendar } from "lucide-react";
import type { Role } from "./role-context";

export type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export type NavGroup = { label: string; items: NavItem[] };

export const NAV: Record<Role, NavItem[]> = {
  empleado: [
    { to: "/empleado/muro", label: "Muro", icon: Newspaper },
    { to: "/empleado/eventos", label: "Gestión de eventos", icon: CalendarDays },
    { to: "/empleado/history", label: "Historial", icon: History },
  ],
  voae: [
    { to: "/voae/muro", label: "Muro", icon: Newspaper },
    { to: "/gestion", label: "Panel de gestión", icon: CalendarDays },
    { to: "/voae/records", label: "Histórico de eventos", icon: FileSearch },
    { to: "/voae/centros", label: "Centros regionales", icon: Building2 },
  ],
  student: [
    { to: "/student/perfil", label: "Mi Perfil", icon: User },
    { to: "/student/muro", label: "Muro", icon: Newspaper },
    { to: "/student/mis-eventos", label: "Mis Eventos", icon: Calendar },
    { to: "/student/events", label: "Gestión de eventos", icon: CalendarDays },
  ],
};

export const NAV_GROUPS: Record<Role, NavGroup[]> = {
  empleado: [
    {
      label: "General",
      items: [
        { to: "/empleado/muro", label: "Muro", icon: Newspaper },
        { to: "/empleado/history", label: "Historial", icon: History },
      ],
    },
    {
      label: "Gestión de eventos",
      items: [{ to: "/empleado/eventos", label: "Mis eventos", icon: CalendarDays }],
    },
  ],
  voae: [
    {
      label: "General",
      items: [
        { to: "/voae/muro", label: "Muro", icon: Newspaper },
      ],
    },
    {
      label: "Gestión de eventos",
      items: [
        { to: "/gestion", label: "Panel de gestión", icon: CalendarDays },
        { to: "/voae/records", label: "Histórico de eventos", icon: FileSearch },
      ],
    },
    {
      label: "Configuración",
      items: [{ to: "/voae/centros", label: "Centros regionales", icon: Building2 }],
    },
  ],
  student: [
    {
      label: "General",
      items: [
        { to: "/student/perfil", label: "Mi Perfil", icon: User },
        { to: "/student/muro", label: "Muro", icon: Newspaper },
        { to: "/student/mis-eventos", label: "Mis Eventos", icon: Calendar },
      ],
    },
    {
      label: "Gestión de eventos",
      items: [{ to: "/student/events", label: "Eventos disponibles", icon: CalendarDays }],
    },
  ],
};
