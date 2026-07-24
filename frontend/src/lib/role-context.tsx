import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "empleado" | "voae" | "student";

export const ROLE_META: Record<Role, { label: string; description: string; basePath: string }> = {
  empleado: {
    label: "Empleado",
    description: "Crea y gestiona eventos",
    basePath: "/empleado/muro",
  },
  voae: {
    label: "Personal VOAE",
    description: "Audita y valida actividades",
    basePath: "/voae/muro",
  },
  student: { label: "Estudiante", description: "Perfil y actividades", basePath: "/student/muro" },
};

export type AppUser = {
  name: string;
  email: string;
  id: string;
  carrera?: string;
  numero_cuenta?: string;
  firma_url?: string;
  cargo?: string;
  departamento?: string;
  codigo_firma?: string;
};

type Ctx = {
  role: Role;
  setRole: (r: Role) => void;
  user: AppUser;
};

const RoleContext = createContext<Ctx | null>(null);

const USERS: Record<Role, AppUser> = {
  empleado: { name: "Dr. Carlos Mendoza", email: "carlos.mendoza@unah.hn", id: "TUT-0034" },
  voae: {
    name: "Lic. Roberto Fiallos",
    email: "roberto.fiallos@voae.unah.hn",
    id: "VOAE-012",
    firma_url:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='50' viewBox='0 0 150 50'%3E%3Ctext x='10' y='35' font-family='cursive' font-size='28' fill='%23004B87'%3ERoberto Fiallos%3C/text%3E%3C/svg%3E",
    cargo: "Vicerrector",
    departamento: "Orientación y Asuntos Estudiantiles",
    codigo_firma: "ART.202606-18-S-CU",
  },
  student: {
    name: "Valeria Estrada",
    email: "valeria.estrada@unah.edu.hn",
    id: "20241000001",
    carrera: "Licenciatura en Administración",
  },
};

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("student");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("cp-role") : null;
    if (stored && ["empleado", "voae", "student"].includes(stored)) {
      setRoleState(stored as Role);
    }
  }, []);

  const setRole = (r: Role) => {
    setRoleState(r);
    if (typeof window !== "undefined") localStorage.setItem("cp-role", r);
  };

  return (
    <RoleContext.Provider value={{ role, setRole, user: USERS[role] }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  return ctx;
}
