import { createFileRoute } from "@tanstack/react-router";
import { Music } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EVENTS, CATEGORY_LABEL } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/voae/recreacion")({
  component: Recreacion,
});

function Recreacion() {
  const recreacion = EVENTS.filter((e) => e.tipo_evento === "RECREACION");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Eventos de recreación"
        description="Vista informativa de eventos tipo recreación (sin validación VOAE)"
      />

      {recreacion.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="size-16 rounded-full bg-secondary grid place-items-center">
              <Music className="size-8 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">No hay eventos de recreación registrados</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Actualmente no existen eventos con tipo "RECREACION" en el sistema. Todos los eventos
            registrados son de tipo "Horas VOAE".
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f1f5f9]" style={{ height: 48 }}>
                <TableHead className="text-[var(--puma-dark)] font-bold">Evento</TableHead>
                <TableHead className="text-[var(--puma-dark)] font-bold">Tutor</TableHead>
                <TableHead className="text-[var(--puma-dark)] font-bold">Fecha</TableHead>
                <TableHead className="text-[var(--puma-dark)] font-bold">Categoría</TableHead>
                <TableHead className="text-[var(--puma-dark)] font-bold">Centro regional</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recreacion.map((e) => (
                <TableRow
                  key={e.id}
                  className="even:bg-[#f8f9fa] hover:bg-[#eff6ff]"
                  style={{ height: 48 }}
                >
                  <TableCell className="font-medium">{e.titulo}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="size-7 rounded-full grid place-items-center text-[10px] font-semibold shrink-0"
                        style={{ backgroundColor: "var(--puma-blue)", color: "white" }}
                      >
                        {e.tutor_nombre
                          .split(" ")
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <span className="text-sm">{e.tutor_nombre}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{e.fecha_inicio.slice(0, 10)}</TableCell>
                  <TableCell>
                    <span className="text-xs px-2 py-0.5 rounded bg-secondary">
                      {CATEGORY_LABEL[e.categoria]}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{e.centro_regional || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
