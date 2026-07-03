import { X, Star } from "lucide-react";
import type { EncuestaSatisfaccion } from "@/lib/mock-data";

type RatingDrawerProps = {
  open: boolean;
  onClose: () => void;
  encuestas: EncuestaSatisfaccion[];
};

export function RatingDrawer({ open, onClose, encuestas }: RatingDrawerProps) {
  const sorted = [...encuestas].sort(
    (a, b) => new Date(b.enviado_at).getTime() - new Date(a.enviado_at).getTime(),
  );
  const avg =
    sorted.length > 0 ? sorted.reduce((s, c) => s + c.calificacion_evento, 0) / sorted.length : 0;
  const distribution = [0, 0, 0, 0, 0];
  sorted.forEach((e) => {
    if (e.calificacion_evento >= 1 && e.calificacion_evento <= 5)
      distribution[5 - e.calificacion_evento]++;
  });
  const maxCount = Math.max(...distribution, 1);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div
        className="relative h-full overflow-y-auto bg-card border-l shadow-xl animate-in slide-in-from-right duration-300"
        style={{ width: "40%", minWidth: "480px", maxWidth: "640px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card z-10 flex items-center justify-between px-6 py-5 border-b">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--puma-dark)" }}>
              Opiniones del evento
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {sorted.length} respuestas totales
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full grid place-items-center hover:bg-red-50 transition"
            style={{ color: "#ef4444" }}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {sorted.length === 0 ? (
            <div className="text-center py-12">
              <Star className="size-12 mx-auto" style={{ color: "#d1d5db" }} />
              <p className="text-sm text-muted-foreground mt-3">
                Aún no hay opiniones para este evento.
              </p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="rounded-xl border p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold" style={{ color: "var(--puma-dark)" }}>
                    {avg.toFixed(1)}
                  </div>
                  <div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <Star
                          key={v}
                          className={`size-5 ${avg >= v ? "fill-gold" : "fill-none"}`}
                          style={{ color: avg >= v ? "var(--puma-gold)" : "#d1d5db" }}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {sorted.length} opiniones
                    </div>
                  </div>
                </div>

                {/* Distribution bars */}
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((stars, i) => (
                    <div key={stars} className="flex items-center gap-2 text-sm">
                      <span className="w-8 text-right text-muted-foreground">{stars}</span>
                      <Star className="size-3.5 shrink-0" style={{ color: "var(--puma-gold)" }} />
                      <div
                        className="flex-1 h-2.5 rounded-full"
                        style={{ backgroundColor: "#f1f5f9" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(distribution[i] / maxCount) * 100}%`,
                            backgroundColor: "var(--puma-blue)",
                          }}
                        />
                      </div>
                      <span className="w-6 text-right text-xs text-muted-foreground">
                        {distribution[i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Individual comments */}
              <div className="space-y-0 divide-y">
                {sorted.map((enc) => {
                  const initials = enc.id.split("-").slice(1).join("").slice(0, 2).toUpperCase();
                  return (
                    <div key={enc.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div
                          className="size-10 rounded-full grid place-items-center text-xs font-semibold text-white shrink-0"
                          style={{ backgroundColor: "var(--puma-blue)" }}
                        >
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">Estudiante</span>
                            <span className="text-xs text-muted-foreground">
                              · {enc.enviado_at.slice(0, 10)}
                            </span>
                          </div>
                          <div className="flex gap-0.5 mt-1">
                            {[1, 2, 3, 4, 5].map((v) => (
                              <Star
                                key={v}
                                className={`size-3.5 ${enc.calificacion_evento >= v ? "fill-gold" : "fill-none"}`}
                                style={{
                                  color:
                                    enc.calificacion_evento >= v ? "var(--puma-gold)" : "#d1d5db",
                                }}
                              />
                            ))}
                          </div>
                          {enc.comentario && (
                            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                              {enc.comentario}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
