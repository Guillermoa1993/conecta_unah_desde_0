import { useState, useEffect } from "react";
import {
  Settings, Database, Mail, Shield, Code2, Wrench, Download,
  Save, RefreshCcw, Loader2, AlertTriangle, CheckCircle2, Plus, Trash2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

type Param = { id_parametro: number; nombre: string; valor: string };

const BOOL_PARAMS = [
  "MODO_MANTENIMIENTO",
  "MODO_DEV",
  "MODO_PWA",
  "SESION_PERMANENTE",
  "SSL_ACTIVO",
  "NOTIF_EMAIL_ACTIVO",
  "PERMITIR_REGISTRO_EXTERNO",
];

const GROUPS: { label: string; icon: React.ElementType; keys: string[] }[] = [
  {
    label: "Modos del Sistema",
    icon: Settings,
    keys: ["MODO_MANTENIMIENTO", "MODO_DEV", "MODO_PWA"],
  },
  {
    label: "Servidor",
    icon: Code2,
    keys: ["PORT", "FRONTEND_URL", "VITE_API_URL"],
  },
  {
    label: "Seguridad y Sesión",
    icon: Shield,
    keys: ["JWT_SECRET", "SESION_PERMANENTE", "DURACION_SESION_HORAS", "MAX_INTENTOS_LOGIN", "TIEMPO_EXPIRACION_OTP", "SSL_ACTIVO", "SSL_CERTIFICADO"],
  },
  {
    label: "Base de Datos",
    icon: Database,
    keys: ["DATABASE_URL", "DB_URL"],
  },
  {
    label: "Microsoft / Azure",
    icon: Shield,
    keys: ["AZURE_CLIENT_ID", "AZURE_CLIENT_SECRET", "AZURE_TENANT_ID", "AZURE_REDIRECT_URI"],
  },
  {
    label: "Correo / OTP",
    icon: Mail,
    keys: ["GMAIL_USER", "GMAIL_APP_PASSWORD", "SMTP_HOST", "SMTP_PORT", "NOTIF_EMAIL_ACTIVO", "CORREO_SOPORTE", "WHATSAPP_SOPORTE"],
  },
  {
    label: "Eventos",
    icon: Code2,
    keys: ["MAX_INSCRIPCIONES_EVENTO", "DIAS_ANTICIPACION_EVENTO", "HORAS_REQUERIDAS_ART140", "PERMITIR_REGISTRO_EXTERNO"],
  },
];

const LABEL_MAP: Record<string, string> = {
  MODO_MANTENIMIENTO:       "Modo Mantenimiento",
  MODO_DEV:                 "Modo Desarrollador",
  MODO_PWA:                 "Instalar como App (PWA)",
  PORT:                     "Puerto del servidor",
  FRONTEND_URL:             "URL del Frontend",
  VITE_API_URL:             "URL de la API (frontend)",
  JWT_SECRET:               "Clave secreta JWT",
  SSL_ACTIVO:               "SSL Activo",
  SSL_CERTIFICADO:          "Certificado SSL",
  DATABASE_URL:             "URL de Base de Datos",
  DB_URL:                   "URL BD (alternativa)",
  AZURE_CLIENT_ID:          "Azure Client ID",
  AZURE_CLIENT_SECRET:      "Azure Client Secret",
  AZURE_TENANT_ID:          "Azure Tenant ID",
  AZURE_REDIRECT_URI:       "Azure Redirect URI",
  GMAIL_USER:               "Correo Gmail (OTP)",
  GMAIL_APP_PASSWORD:       "Contraseña de App Gmail",
  SMTP_HOST:                "Host SMTP",
  SMTP_PORT:                "Puerto SMTP",
  NOTIF_EMAIL_ACTIVO:       "Notificaciones por Email",
  CORREO_SOPORTE:           "Correo de Soporte",
  WHATSAPP_SOPORTE:         "WhatsApp de Soporte (ej: 50412345678)",
  MAX_INTENTOS_LOGIN:       "Máx. intentos de login",
  TIEMPO_EXPIRACION_OTP:    "Expiración OTP (minutos)",
  SESION_PERMANENTE:        "Sesión permanente (no expira)",
  DURACION_SESION_HORAS:    "Duración de sesión (horas)",
  MAX_INSCRIPCIONES_EVENTO: "Máx. inscripciones por evento",
  DIAS_ANTICIPACION_EVENTO: "Días de anticipación para evento",
  HORAS_REQUERIDAS_ART140:  "Horas requeridas Art. 140",
  PERMITIR_REGISTRO_EXTERNO:"Permitir registro externo",
};

const SENSITIVE = [
  "GMAIL_APP_PASSWORD", "DATABASE_URL", "DB_URL", "SSL_CERTIFICADO",
  "JWT_SECRET", "AZURE_CLIENT_SECRET",
];

export function Parametros() {
  const [params, setParams]     = useState<Param[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState<string | null>(null);
  const [newNombre, setNewNombre] = useState("");
  const [newValor, setNewValor]   = useState("");
  const [adding, setAdding]       = useState(false);

  const token = localStorage.getItem("unah_token") ?? "";

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/parametros`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setParams(data);
    } catch { toast.error("Error al cargar parámetros"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async (nombre: string, valor: string) => {
    setSaving(nombre);
    try {
      await fetch(`${API_URL}/parametros/${nombre}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ valor }),
      });
      setParams(prev => prev.map(p => p.nombre === nombre ? { ...p, valor } : p));
      toast.success(`Parámetro "${nombre}" guardado`);
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(null); }
  };

  const toggle = (nombre: string, current: string) => {
    const newVal = current === "1" ? "0" : "1";
    save(nombre, newVal);
  };

  const addParam = async () => {
    if (!newNombre.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`${API_URL}/parametros`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: newNombre.toUpperCase().trim(), valor: newValor }),
      });
      const data = await res.json();
      setParams(prev => [...prev, data]);
      setNewNombre(""); setNewValor("");
      toast.success("Parámetro creado");
    } catch { toast.error("Error al crear parámetro"); }
    finally { setAdding(false); }
  };

  const get = (nombre: string) => params.find(p => p.nombre === nombre);

  const ungrouped = params.filter(p =>
    !GROUPS.flatMap(g => g.keys).includes(p.nombre)
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-[#004B87]" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#003366]">Parámetros del Sistema</h1>
        <p className="text-sm text-slate-500">Configuración general de la plataforma Conecta Pumas.</p>
      </div>

      {/* Grupos */}
      {GROUPS.map(group => {
        const groupParams = group.keys.map(k => get(k)).filter(Boolean) as Param[];
        if (groupParams.length === 0) return null;
        return (
          <Card key={group.label} className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[#003366] text-base">
                <group.icon className="h-4 w-4 text-[#004B87]" />
                {group.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {groupParams.map(p => {
                const isBool = BOOL_PARAMS.includes(p.nombre);
                const isSensitive = SENSITIVE.includes(p.nombre);
                return (
                  <div key={p.nombre} className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Label className="w-56 text-sm text-slate-600 shrink-0">
                      {LABEL_MAP[p.nombre] ?? p.nombre}
                    </Label>
                    {isBool ? (
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={p.valor === "1"}
                          onCheckedChange={() => toggle(p.nombre, p.valor)}
                        />
                        <Badge variant="outline" className={p.valor === "1" ? "border-green-200 text-green-700" : "border-slate-200 text-slate-500"}>
                          {p.valor === "1" ? "Activo" : "Inactivo"}
                        </Badge>
                        {saving === p.nombre && <Loader2 className="h-3 w-3 animate-spin text-[#004B87]" />}
                      </div>
                    ) : (
                      <div className="flex gap-2 flex-1">
                        <Input
                          type={isSensitive ? "password" : "text"}
                          value={p.valor}
                          onChange={e => setParams(prev => prev.map(x => x.nombre === p.nombre ? { ...x, valor: e.target.value } : x))}
                          className="flex-1 text-sm"
                          placeholder={`Valor de ${p.nombre}`}
                        />
                        <Button
                          size="sm"
                          onClick={() => save(p.nombre, p.valor)}
                          disabled={saving === p.nombre}
                          className="bg-[#004B87] hover:bg-[#003366] text-white"
                        >
                          {saving === p.nombre ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* Otros parámetros no agrupados */}
      {ungrouped.length > 0 && (
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-[#003366] text-base flex items-center gap-2">
              <Settings className="h-4 w-4 text-[#004B87]" />
              Otros Parámetros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ungrouped.map(p => (
              <div key={p.nombre} className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Label className="w-56 text-sm text-slate-600 shrink-0">{p.nombre}</Label>
                <div className="flex gap-2 flex-1">
                  <Input
                    value={p.valor}
                    onChange={e => setParams(prev => prev.map(x => x.nombre === p.nombre ? { ...x, valor: e.target.value } : x))}
                    className="flex-1 text-sm"
                  />
                  <Button size="sm" onClick={() => save(p.nombre, p.valor)} disabled={saving === p.nombre}
                    className="bg-[#004B87] hover:bg-[#003366] text-white">
                    {saving === p.nombre ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Agregar nuevo parámetro */}
      <Card className="border border-dashed border-[#004B87]/30 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#003366] text-base flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#004B87]" />
            Agregar Parámetro
          </CardTitle>
          <CardDescription>Crea un nuevo parámetro personalizado en el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Input
              placeholder="NOMBRE_PARAMETRO"
              value={newNombre}
              onChange={e => setNewNombre(e.target.value.toUpperCase())}
              className="flex-1 min-w-40 text-sm font-mono"
            />
            <Input
              placeholder="valor"
              value={newValor}
              onChange={e => setNewValor(e.target.value)}
              className="flex-1 min-w-40 text-sm"
            />
            <Button onClick={addParam} disabled={adding || !newNombre.trim()}
              className="bg-[#004B87] hover:bg-[#003366] text-white">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Agregar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Botón recargar */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={load} className="border-[#004B87]/30 text-[#004B87]">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Recargar parámetros
        </Button>
      </div>
    </div>
  );
}
