import { useState } from "react";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";

// ─── tipos ───────────────────────────────────────────────
type CatalogItem = {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
};

type CatalogConfig = {
  title: string;
  subtitle: string;
  nameLabel: string;
  descriptionLabel?: string;
  descriptionOptions?: string[]; // si existe, el campo se vuelve un Select
  items: CatalogItem[];
};

// ─── datos mock por catálogo ──────────────────────────────
const catalogData: Record<string, CatalogConfig> = {
  careers: {
    title: "Carreras",
    subtitle: "Gestiona el catálogo de carreras del sistema",
    nameLabel: "Nombre de la carrera",
    descriptionLabel: "Facultad",
    descriptionOptions: [
      "Facultad de Ingeniería",
      "Facultad de Ciencias Económicas",
      "Facultad de Ciencias Médicas",
      "Facultad de Ciencias Jurídicas",
    ],
    items: [
      { id: "1", name: "Ingeniería en Sistemas",      description: "Facultad de Ingeniería",           status: "active" },
      { id: "2", name: "Administración de Empresas",  description: "Facultad de Ciencias Económicas",  status: "active" },
      { id: "3", name: "Medicina",                    description: "Facultad de Ciencias Médicas",     status: "active" },
      { id: "4", name: "Derecho",                     description: "Facultad de Ciencias Jurídicas",   status: "active" },
    ],
  },
  "regional-centers": {
    title: "Centros regionales",
    subtitle: "Gestiona el catálogo de centros regionales",
    nameLabel: "Nombre del centro",
    descriptionLabel: "Ciudad",
    items: [
      { id: "1", name: "UNAH-VS",     description: "San Pedro Sula", status: "active" },
      { id: "2", name: "UNAH-TEC-DE", description: "Danlí",          status: "active" },
      { id: "3", name: "UNAH-TEC-CO", description: "Comayagua",      status: "active" },
      { id: "4", name: "CU",          description: "Tegucigalpa",    status: "active" },
    ],
  },
  "user-types": {
    title: "Tipos de usuario",
    subtitle: "Gestiona los tipos de usuario del sistema",
    nameLabel: "Nombre del tipo",
    descriptionLabel: "Descripción",
    items: [
      { id: "1", name: "Estudiante",     description: "Acceso a eventos y seguimiento académico", status: "active" },
      { id: "2", name: "Tutor",          description: "Creación y gestión de eventos",            status: "active" },
      { id: "3", name: "Administrador",  description: "Gestión general del sistema",              status: "active" },
      { id: "4", name: "Personal VOAE",  description: "Auditoría y reportes oficiales",           status: "active" },
    ],
  },
  "user-states": {
    title: "Estados de usuario",
    subtitle: "Gestiona los posibles estados de una cuenta",
    nameLabel: "Nombre del estado",
    descriptionLabel: "Descripción",
    items: [
      { id: "1", name: "Activo",     description: "Usuario con acceso completo",      status: "active" },
      { id: "2", name: "Inactivo",   description: "Usuario sin acceso al sistema",    status: "active" },
      { id: "3", name: "Suspendido", description: "Acceso restringido temporalmente", status: "active" },
    ],
  },
  "notification-types": {
    title: "Tipos de notificación",
    subtitle: "Gestiona las categorías de notificaciones del sistema",
    nameLabel: "Nombre del tipo",
    descriptionLabel: "Descripción",
    items: [
      { id: "1", name: "Recordatorio de evento",      description: "Aviso previo a un evento programado",  status: "active" },
      { id: "2", name: "Confirmación de inscripción", description: "Confirmación al registrarse a evento", status: "active" },
      { id: "3", name: "Alerta del sistema",          description: "Notificaciones técnicas o de error",   status: "active" },
    ],
  },
};

// ─── componente reutilizable ──────────────────────────────
function CatalogTable({ catalogKey }: { catalogKey: string }) {
  const config = catalogData[catalogKey];
  const [items, setItems] = useState<CatalogItem[]>(config.items);
  const [search, setSearch] = useState("");

  // estado del modal
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<"active" | "inactive">("active");

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.description?.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setEditingItem(null);
    setFormName("");
    setFormDescription("");
    setFormStatus("active");
    setIsOpen(true);
  };

  const openEditModal = (item: CatalogItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormDescription(item.description ?? "");
    setFormStatus(item.status);
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    if (editingItem) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? { ...i, name: formName, description: formDescription, status: formStatus }
            : i
        )
      );
      toast.success(`"${formName}" actualizado`);
    } else {
      const newItem: CatalogItem = {
        id: String(Date.now()),
        name: formName,
        description: formDescription,
        status: formStatus,
      };
      setItems((prev) => [...prev, newItem]);
      toast.success(`"${formName}" agregado al catálogo`);
    }

    setIsOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success(`"${name}" eliminado del catálogo`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#004B87]">{config.title}</h1>
        <p className="text-muted-foreground mt-1">{config.subtitle}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Todos los registros</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Buscar ${config.title.toLowerCase()}...`}
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button className="bg-[#004B87] hover:bg-[#003366]" onClick={openAddModal}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>{config.nameLabel}</TableHead>
                  {config.descriptionLabel && (
                    <TableHead>{config.descriptionLabel}</TableHead>
                  )}
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No se encontraron registros.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground text-sm">{index + 1}</TableCell>
                      <TableCell className="font-medium text-[#004B87]">{item.name}</TableCell>
                      {config.descriptionLabel && (
                        <TableCell className="text-sm text-muted-foreground">{item.description}</TableCell>
                      )}
                      <TableCell className="text-center">
                        <Badge
                          className={
                            item.status === "active"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                          }
                        >
                          {item.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEditModal(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(item.id, item.name)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Modal Agregar / Editar ──────────────────────── */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? `Editar: ${editingItem.name}` : `Agregar ${config.title.toLowerCase().slice(0, -1)}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">{config.nameLabel}</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={`Ej. ${config.items[0]?.name ?? ""}`}
              />
            </div>

            {config.descriptionLabel && (
              <div className="space-y-2">
                <Label htmlFor="description">{config.descriptionLabel}</Label>
                {config.descriptionOptions ? (
                  <Select value={formDescription} onValueChange={setFormDescription}>
                    <SelectTrigger id="description">
                      <SelectValue placeholder={`Selecciona ${config.descriptionLabel.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {config.descriptionOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder={`Ej. ${config.items[0]?.description ?? ""}`}
                  />
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={formStatus} onValueChange={(v) => setFormStatus(v as "active" | "inactive")}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-[#004B87] hover:bg-[#003366]" onClick={handleSave}>
              {editingItem ? "Guardar cambios" : `Guardar ${config.title.toLowerCase().slice(0, -1)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PageShell({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#004B87]">{title}</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">{description}</p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-600 leading-relaxed">
          Esta funcionalidad es un placeholder de frontend. Aquí puedes conectar la lógica de respaldo o restauración cuando la API esté disponible.
        </p>
      </div>
    </div>
  );
}

export const BackupPage = () => (
  <PageShell
    title="Backup"
    description="Crea copias de seguridad de los datos del sistema."
  />
);

export const ResetPage = () => (
  <PageShell
    title="Reset"
    description="Restaura el sistema a su configuración inicial."
  />
);

// ─── exports por ruta ─────────────────────────────────────
export const CareersPage           = () => <CatalogTable catalogKey="careers" />;
export const RegionalCentersPage   = () => <CatalogTable catalogKey="regional-centers" />;
export const UserTypesPage         = () => <CatalogTable catalogKey="user-types" />;
export const UserStatesPage        = () => <CatalogTable catalogKey="user-states" />;
export const NotificationTypesPage = () => <CatalogTable catalogKey="notification-types" />;
