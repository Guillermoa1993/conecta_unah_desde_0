import { UserPlus, Edit, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { toast } from "sonner";

const users = [
  { id: "1", name: "Ana García", email: "ana.garcia@pumas.unam.mx", role: "student", status: "active" },
  { id: "2", name: "Dr. Juan Pérez", email: "juan.perez@pumas.unam.mx", role: "tutor", status: "active" },
  { id: "3", name: "Carlos López", email: "carlos.lopez@pumas.unam.mx", role: "student", status: "active" },
  { id: "4", name: "Dra. María González", email: "maria.gonzalez@pumas.unam.mx", role: "tutor", status: "active" },
  { id: "5", name: "Admin Sistema", email: "admin@pumas.unam.mx", role: "admin", status: "active" },
];

export function UserManagement() {
  const handleAddUser = () => {
    toast.success("Formulario para agregar usuario");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#004B87]">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">
            Administra usuarios y permisos del sistema
          </p>
        </div>
        <Button onClick={handleAddUser} className="bg-[#004B87] hover:bg-[#003366]">
          <UserPlus className="mr-2 h-5 w-5" />
          Agregar Usuario
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Todos los Usuarios</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar usuarios..." className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo Electrónico</TableHead>
                  <TableHead className="text-center">Rol</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={
                          user.role === "admin"
                            ? "bg-red-500"
                            : user.role === "tutor"
                            ? "bg-[#004B87]"
                            : "bg-green-500"
                        }
                      >
                        {user.role === "admin"
                          ? "Administrador"
                          : user.role === "tutor"
                          ? "Tutor"
                          : "Estudiante"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-green-500">Activo</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
