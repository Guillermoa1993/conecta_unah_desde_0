import { useState, useEffect } from "react";
import {
  Settings, Database, Mail, Shield, Code2, Save, RefreshCcw, Loader2, Plus, Search, Edit3, Check, X,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export type DataType = "TO_CHAR" | "BOOLEAN" | "INT";

export type Param = {
  id_parametro: number;
  nombre: string;
  valor: string;
  tipo_dato?: DataType;
};

// Parámetros conocidos por tipo de dato predeterminado
const INT_PARAMS = [
  "PORT",
  "SMTP_PORT",
  "MAX_INTENTOS_LOGIN",
  "TIEMPO_EXPIRACION_OTP",
  "DURACION_SESION_HORAS",
  "MAX_INSCRIPCIONES_EVENTO",
  "DIAS_ANTICIPACION_EVENTO",
  "HORAS_REQUERIDAS_ART140",
];

const BOOL_PARAMS = [
  "MODO_MANTENIMIENTO",
  "MODO_DEV",
  "MODO_PWA",
  "SESION_PERMANENTE",
  "SSL_ACTIVO",
  "NOTIF_EMAIL_ACTIVO",
  "PERMITIR_REGISTRO_EXTERNO",
  "CONTROL_ACCESO",
  "EXAMEN_CLASE",
];

const GROUPS: { label: string; icon: React.ElementType; keys: string[] }[] = [
  {
    label: "Modos del Sistema",
    icon: Settings,
    keys: ["MODO_MANTENIMIENTO", "MODO_DEV", "MODO_PWA", "CONTROL_ACCESO", "EXAMEN_CLASE"],
  },
  {
    label: "Servidor & URLs",
    icon: Code2,
    keys: ["PORT", "FRONTEND_URL", "VITE_API_URL"],
  },
  {
    label: "Seguridad & Sesión",
    icon: Shield,
    keys: [
      "JWT_SECRET",
      "SESION_PERMANENTE",
      "DURACION_SESION_HORAS",
      "MAX_INTENTOS_LOGIN",
      "TIEMPO_EXPIRACION_OTP",
      "SSL_ACTIVO",
      "SSL_CERTIFICADO",
    ],
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
    label: "Correo & Notificaciones",
    icon: Mail,
    keys: [
      "GMAIL_USER",
      "GMAIL_APP_PASSWORD",
      "SMTP_HOST",
      "SMTP_PORT",
      "NOTIF_EMAIL_ACTIVO",
      "CORREO_SOPORTE",
      "WHATSAPP_SOPORTE",
    ],
  },
  {
    label: "Reglas de Eventos & Académico",
    icon: Code2,
    keys: [
      "MAX_INSCRIPCIONES_EVENTO",
      "DIAS_ANTICIPACION_EVENTO",
      "HORAS_REQUERIDAS_ART140",
      "PERMITIR_REGISTRO_EXTERNO",
      "PERIODO_ACADEMICO_ACTUAL",
    ],
  },
];

const LABEL_MAP: Record<string, string> = {
  MODO_MANTENIMIENTO:       "Modo Mantenimiento",
  MODO_DEV:                 "Modo Desarrollador",
  MODO_PWA:                 "Instalar como App (PWA)",
  CONTROL_ACCESO:           "Control de Acceso General",
  EXAMEN_CLASE:             "Modo Examen de Clase",
  PORT:                     "Puerto del Servidor",
  FRONTEND_URL:             "URL del Frontend",
  VITE_API_URL:             "URL de la API (Frontend)",
  JWT_SECRET:               "Clave Secreta JWT",
  SSL_ACTIVO:               "SSL / HTTPS Activo",
  SSL_CERTIFICADO:          "Certificado SSL",
  DATABASE_URL:             "URL de Base de Datos",
  DB_URL:                   "URL BD Alternativa",
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
  WHATSAPP_SOPORTE:         "WhatsApp de Soporte",
  MAX_INTENTOS_LOGIN:       "Máx. Intentos de Login",
  TIEMPO_EXPIRACION_OTP:    "Expiración OTP (minutos)",
  SESION_PERMANENTE:        "Sesión Permanente (sin expirar)",
  DURACION_SESION_HORAS:    "Duración de Sesión (horas)",
  MAX_INSCRIPCIONES_EVENTO: "Máx. Inscripciones por Evento",
  DIAS_ANTICIPACION_EVENTO: "Días de Anticipación para Evento",
  HORAS_REQUERIDAS_ART140:  "Horas Requeridas Art. 140",
  PERMITIR_REGISTRO_EXTERNO:"Permitir Registro Externo",
  PERIODO_ACADEMICO_ACTUAL: "Período Académico Actual",
};

const SENSITIVE = [
  "GMAIL_APP_PASSWORD", "DATABASE_URL", "DB_URL", "SSL_CERTIFICADO",
  "JWT_SECRET", "AZURE_CLIENT_SECRET",
];

function getDataType(nombre: string, customType?: DataType): DataType {
  if (customType) return customType;
  if (BOOL_PARAMS.includes(nombre)) return "BOOLEAN";
  if (INT_PARAMS.includes(nombre)) return "INT";
  return "TO_CHAR";
}

export function Parametros() {
  const [params, setParams]       = useState<Param[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState<string | null>(null);
  const [search, setSearch]       = useState("");

  // Modal para agregar parámetro
  const [newNombre, setNewNombre] = useState("");
  const [newValor, setNewValor]   = useState("");
  const [newTipo, setNewTipo]     = useState<DataType>("TO_CHAR");
  const [adding, setAdding]       = useState(false);

  // Modal para editar parámetro individual
  const [editParam, setEditParam] = useState<Param | null>(null);
  const [editVal, setEditVal]     = useState("");
  const [editTipo, setEditTipo]   = useState<DataType>("TO_CHAR");

  const token = localStorage.getItem("unah_token") ?? "";

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/parametros`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: Param[] = await res.json();
      setParams(data);
    } catch {
      toast.error("Error al cargar los parámetros del sistema");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const saveParamValue = async (nombre: string, valor: string, tipo?: DataType) => {
    // Validar tipo de dato antes de guardar
    const activeType = tipo ?? getDataType(nombre);

    if (activeType === "INT" && isNaN(Number(valor.trim()))) {
      toast.error(`El parámetro "${nombre}" requiere un número entero válido (INT).`);
      return;
    }

    if (activeType === "BOOLEAN" && valor !== "1" && valor !== "0" && valor !== "true" && valor !== "false") {
      toast.error(`El parámetro "${nombre}" debe ser un valor booleano (1/0 o true/false).`);
      return;
    }

    setSaving(nombre);
    try {
      const res = await fetch(`${API_URL}/parametros/${nombre}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ valor }),
      });

      if (!res.ok) throw new Error("No se pudo actualizar");

      setParams(prev => prev.map(p => p.nombre === nombre ? { ...p, valor, tipo_dato: activeType } : p));
      toast.success(`Parámetro "${nombre}" guardado con éxito (${activeType})`);
      setEditParam(null);
    } catch {
      toast.error(`Error al guardar el parámetro ${nombre}`);
    } finally {
      setSaving(null);
    }
  };

  const toggleBoolean = (nombre: string, currentVal: string) => {
    const newVal = currentVal === "1" ? "0" : "1";
    saveParamValue(nombre, newVal, "BOOLEAN");
  };

  const handleAddParam = async () => {
    const cleanName = newNombre.toUpperCase().trim();
    if (!cleanName) {
      toast.error("Ingrese el nombre del nuevo parámetro.");
      return;
    }

    let finalValue = newValor;
    if (newTipo === "BOOLEAN") {
      finalValue = newValor === "true" || newValor === "1" ? "1" : "0";
    } else if (newTipo === "INT") {
      if (isNaN(Number(newValor.trim()))) {
        toast.error("El valor debe ser un número entero (INT).");
        return;
      }
    }

    setAdding(true);
    try {
      const res = await fetch(`${API_URL}/parametros`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: cleanName, valor: finalValue }),
      });

      if (!res.ok) throw new Error("Error al agregar");

      const data = await res.json();
      setParams(prev => [...prev, { ...data, tipo_dato: newTipo }]);
      setNewNombre("");
      setNewValor("");
      setNewTipo("TO_CHAR");
      toast.success(`Parámetro "${cleanName}" agregado como ${newTipo}`);
    } catch {
      toast.error("Error al crear el parámetro");
    } finally {
      setAdding(false);
    }
  };

  const openEditModal = (p: Param) => {
    setEditParam(p);
    setEditVal(p.valor);
    setEditTipo(p.tipo_dato ?? getDataType(p.nombre));
  };

  const filteredParams = params.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (LABEL_MAP[p.nombre] ?? "").toLowerCase().includes(search.toLowerCase()) ||
    p.valor.toLowerCase().includes(search.toLowerCase())
  );

  const getParam = (nombre: string) => filteredParams.find(p => p.nombre === nombre);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#004B87]" />
        <p className="text-sm text-slate-500 font-medium">Cargando parámetros del sistema...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#003366] tracking-tight">Parámetros del Sistema</h1>
          <p className="text-sm text-slate-500">
            Listado y edición de parámetros abiertos con especificación de tipos de datos (<code>TO_CHAR</code>, <code>BOOLEAN</code>, <code>INT</code>).
          </p>
        </div>
        <Button variant="outline" onClick={load} className="border-[#004B87]/30 text-[#004B87] hover:bg-[#004B87]/5 self-start sm:self-auto">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Recargar
        </Button>
      </div>

      {/* Buscador de Parámetros */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar parámetro por nombre, etiqueta o valor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-white border-slate-200"
        />
      </div>

      {/* Secciones Agrupadas */}
      {GROUPS.map(group => {
        const groupParams = group.keys.map(k => getParam(k)).filter(Boolean) as Param[];
        if (groupParams.length === 0) return null;
        return (
          <Card key={group.label} className="border border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-[#003366] text-base font-semibold">
                <group.icon className="h-4.5 w-4.5 text-[#004B87]" />
                {group.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 divide-y divide-slate-100">
              {groupParams.map(p => {
                const tipo = getDataType(p.nombre, p.tipo_dato);
                const isBool = tipo === "BOOLEAN";
                const isSensitive = SENSITIVE.includes(p.nombre);

                return (
                  <div key={p.nombre} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-[240px]">
                      <Label className="text-sm font-medium text-slate-700">
                        {LABEL_MAP[p.nombre] ?? p.nombre}
                      </Label>
                      {/* Badge de Tipo de Dato */}
                      <Badge
                        variant="secondary"
                        className={
                          tipo === "BOOLEAN"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                            : tipo === "INT"
                            ? "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                            : "bg-blue-50 text-blue-700 border-blue-200 text-[10px]"
                        }
                      >
                        {tipo}
                      </Badge>
                    </div>

                    {/* Control de Edición Rápida o Switch */}
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      {isBool ? (
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={p.valor === "1" || p.valor.toLowerCase() === "true"}
                            onCheckedChange={() => toggleBoolean(p.nombre, p.valor)}
                          />
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${p.valor === "1" || p.valor.toLowerCase() === "true" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>
                            {p.valor === "1" || p.valor.toLowerCase() === "true" ? "VERDADERO (1)" : "FALSO (0)"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 max-w-md flex-1">
                          <Input
                            type={isSensitive ? "password" : tipo === "INT" ? "number" : "text"}
                            value={p.valor}
                            onChange={e => setParams(prev => prev.map(x => x.nombre === p.nombre ? { ...x, valor: e.target.value } : x))}
                            className="text-sm flex-1 bg-white font-mono text-slate-800 h-9"
                          />
                          <Button
                            size="sm"
                            onClick={() => saveParamValue(p.nombre, p.valor, tipo)}
                            disabled={saving === p.nombre}
                            className="bg-[#004B87] hover:bg-[#003366] text-white h-9 px-3 shrink-0"
                          >
                            {saving === p.nombre ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      )}

                      {/* Botón Abrir Modal Edición Completa */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal(p)}
                        className="text-slate-500 hover:text-[#004B87] h-9 w-9 p-0"
                        title="Editar tipo y detalles de parámetro"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* Agregar Nuevo Parámetro Personalizado */}
      <Card className="border border-dashed border-[#004B87]/40 shadow-sm bg-blue-50/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#003366] text-base flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#004B87]" />
            Agregar Nuevo Parámetro
          </CardTitle>
          <CardDescription>
            Permite definir nuevos parámetros abiertos especificando su tipo de dato (<code>TO_CHAR</code>, <code>BOOLEAN</code>, <code>INT</code>).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-slate-600 mb-1 block">Nombre del Parámetro</Label>
              <Input
                placeholder="NUEVO_PARAMETRO"
                value={newNombre}
                onChange={e => setNewNombre(e.target.value.toUpperCase())}
                className="text-sm font-mono uppercase bg-white"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-600 mb-1 block">Tipo de Dato</Label>
              <Select value={newTipo} onValueChange={(val: DataType) => setNewTipo(val)}>
                <SelectTrigger className="bg-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TO_CHAR">TO_CHAR (Cadena de Texto)</SelectItem>
                  <SelectItem value="BOOLEAN">BOOLEAN (Verdadero / Falso / 1 / 0)</SelectItem>
                  <SelectItem value="INT">INT (Número Entero)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-slate-600 mb-1 block">Valor Inicial</Label>
              {newTipo === "BOOLEAN" ? (
                <Select value={newValor || "1"} onValueChange={setNewValor}>
                  <SelectTrigger className="bg-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 (Verdadero / Activo)</SelectItem>
                    <SelectItem value="0">0 (Falso / Inactivo)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={newTipo === "INT" ? "number" : "text"}
                  placeholder={newTipo === "INT" ? "Ej: 60" : "Ej: Valor de configuración"}
                  value={newValor}
                  onChange={e => setNewValor(e.target.value)}
                  className="text-sm bg-white font-mono"
                />
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleAddParam}
              disabled={adding || !newNombre.trim()}
              className="bg-[#004B87] hover:bg-[#003366] text-white"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Guardar Parámetro
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Edición de Parámetro */}
      {editParam && (
        <Dialog open={!!editParam} onOpenChange={open => !open && setEditParam(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#003366]">Editar Parámetro: {editParam.nombre}</DialogTitle>
              <DialogDescription>
                Modifica el tipo de dato o valor asignado al parámetro.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">Tipo de Dato</Label>
                <Select value={editTipo} onValueChange={(val: DataType) => setEditTipo(val)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TO_CHAR">TO_CHAR (Cadena de Texto)</SelectItem>
                    <SelectItem value="BOOLEAN">BOOLEAN (Verdadero / Falso)</SelectItem>
                    <SelectItem value="INT">INT (Número Entero)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-slate-500 mb-1 block">Valor</Label>
                {editTipo === "BOOLEAN" ? (
                  <Select value={editVal === "1" || editVal.toLowerCase() === "true" ? "1" : "0"} onValueChange={setEditVal}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Verdadero / Activo</SelectItem>
                      <SelectItem value="0">0 - Falso / Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={editTipo === "INT" ? "number" : "text"}
                    value={editVal}
                    onChange={e => setEditVal(e.target.value)}
                    className="font-mono text-sm"
                  />
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEditParam(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => saveParamValue(editParam.nombre, editVal, editTipo)}
                disabled={saving === editParam.nombre}
                className="bg-[#004B87] hover:bg-[#003366] text-white"
              >
                {saving === editParam.nombre ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
