import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Mail, Phone, Building2, Calendar, IdCard, User, MapPin } from 'lucide-react';

// ── Etiquetas legibles para lo que viene de la BD ──────────────────────────
const ROL_LABEL: Record<string, string> = {
  ESTUDIANTE: 'Estudiante',
  EMPLEADO: 'Empleado / Tutor',
  TUTOR: 'Empleado / Tutor',
  ADMIN: 'Administrador',
  VOAE_DIRECCION: 'VOAE Dirección',
  VOAE_DEPARTAMENTO: 'VOAE Departamento (Coordinación)',
  COORDINACION: 'VOAE Departamento (Coordinación)',
  VOAE: 'VOAE Dirección',
};

const ESTADO_LABEL: Record<string, string> = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
  SUSPENDIDO: 'Suspendido',
};

const ESTADO_BADGE_CLASS: Record<string, string> = {
  ACTIVO: 'bg-green-100 text-green-700 border-green-200',
  INACTIVO: 'bg-gray-100 text-gray-600 border-gray-200',
  SUSPENDIDO: 'bg-red-100 text-red-700 border-red-200',
};

function formatearMiembroDesde(fecha?: string): string {
  if (!fecha) return '—';
  const texto = new Date(fecha).toLocaleDateString('es-HN', { month: 'long', year: 'numeric' });
  return `${texto.charAt(0).toUpperCase()}${texto.slice(1)}`;
}

function iniciales(nombre?: string): string {
  if (!nombre) return 'U';
  const partes = nombre.trim().split(/\s+/);
  return (partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '');
}

interface FilaDatoProps {
  icon: React.ReactNode;
  etiqueta: string;
  valor?: string | null;
}

function FilaDato({ icon, etiqueta, valor }: FilaDatoProps) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 text-[#004B87]">{icon}</div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{etiqueta}</p>
        <p className="text-sm text-gray-800">{valor && valor.trim() !== '' ? valor : '—'}</p>
      </div>
    </div>
  );
}

/**
 * Vista de solo lectura de la ficha institucional (datos capturados al
 * enrolarse) para roles distintos a Estudiante: Empleado/Tutor, Admin,
 * VOAE Dirección y VOAE Departamento. Los datos vienen directamente de
 * useAuth() -> GET /auth/me, sin necesidad de endpoints nuevos.
 */
export function PerfilInstitucional() {
  const { usuario } = useAuth();

  if (!usuario) {
    return (
      <div className="flex items-center justify-center h-full p-10 text-gray-500">
        Cargando perfil...
      </div>
    );
  }

  const u = usuario as any; // el tipo Usuario del frontend aún no declara todos los campos que ya manda el backend
  const rolLabel = ROL_LABEL[u.rol] ?? u.rol;
  const estadoLabel = ESTADO_LABEL[u.estado] ?? u.estado;
  const estadoClass = ESTADO_BADGE_CLASS[u.estado] ?? 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Encabezado */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-[#004B87] to-[#003366]" />
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            <Avatar className="h-24 w-24 border-4 border-white shadow-md">
              <AvatarImage src={u.foto_url ?? undefined} alt={u.nombre} />
              <AvatarFallback className="bg-[#FFD100] text-[#003366] text-xl font-bold">
                {iniciales(u.nombre)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-1">
              <h1 className="text-xl font-bold text-[#003366]">{u.nombre}</h1>
              <p className="text-sm text-gray-500">{u.correo}</p>
            </div>
            <div className="flex flex-wrap gap-2 pb-1">
              <Badge className="bg-[#004B87] text-white border-transparent">{rolLabel}</Badge>
              <Badge variant="outline" className={estadoClass}>{estadoLabel}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos de la ficha */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-[#003366]">Información de la ficha</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100">
          <FilaDato icon={<User size={18} />} etiqueta="Nombre completo" valor={u.nombre} />
          <FilaDato icon={<Mail size={18} />} etiqueta="Correo institucional" valor={u.correo} />
          <FilaDato icon={<Phone size={18} />} etiqueta="Teléfono" valor={u.telefono} />
          <FilaDato icon={<IdCard size={18} />} etiqueta="Número de empleado" valor={u.numero_empleado} />
          <FilaDato icon={<Building2 size={18} />} etiqueta="Departamento" valor={u.departamento ?? u.facultad} />
          <FilaDato icon={<MapPin size={18} />} etiqueta="Centro regional" valor={u.centro_regional} />
          <FilaDato icon={<Calendar size={18} />} etiqueta="Miembro desde" valor={formatearMiembroDesde(u.created_at)} />
        </CardContent>
      </Card>

      {u.biografia && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-[#003366]">Biografía</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 whitespace-pre-line">{u.biografia}</p>
            </CardContent>
          </Card>
          <Separator className="hidden" />
        </>
      )}
    </div>
  );
}