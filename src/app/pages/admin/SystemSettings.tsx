import { Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { toast } from "sonner";

export function SystemSettings() {
  const handleSave = () => {
    toast.success("Configuración guardada exitosamente");
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#004B87]">Configuración del Sistema</h1>
        <p className="text-muted-foreground mt-1">
          Administra parámetros globales y seguridad
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración de Horas</CardTitle>
          <CardDescription>
            Define las horas requeridas para cumplir el Artículo 140
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="required-hours">Horas Requeridas</Label>
            <Input id="required-hours" type="number" defaultValue="60" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seguridad</CardTitle>
          <CardDescription>Configuración de seguridad y acceso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Autenticación de Dos Factores</Label>
              <p className="text-sm text-muted-foreground">
                Requiere 2FA para todos los usuarios
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Respaldos Automáticos</Label>
              <p className="text-sm text-muted-foreground">
                Respaldos diarios de la base de datos
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notificaciones</CardTitle>
          <CardDescription>Configuración de notificaciones del sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Notificaciones por Email</Label>
              <p className="text-sm text-muted-foreground">
                Enviar emails automáticos
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full bg-[#004B87] hover:bg-[#003366]">
        <Save className="mr-2 h-5 w-5" />
        Guardar Configuración
      </Button>
    </div>
  );
}
