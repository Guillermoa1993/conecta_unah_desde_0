import { useState, useMemo } from "react";
import { Search } from "lucide-react";

interface Props {
  open: boolean;
  estudianteNombre: string;
  onConfirm: (motivo: string) => void;
  onCancel: () => void;
}

const PREDEFINED_REASONS = [
  "Ubicación no coincide con el lugar del evento registrado",
  "Hora de entrada o salida fuera del horario del evento",
  "Registro de asistencia duplicado",
  "El estudiante no aparece en la lista oficial de inscritos",
  "Documentación de asistencia manual ilegible o inválida",
  "El evento fue cancelado o no se realizó",
  "Carrera del estudiante no habilitada para este evento",
  "El estudiante ya completó las horas máximas permitidas en este ámbito",
  "Inconsistencia entre la asistencia digital y la lista escrita",
  "El evento no cumple los requisitos del Artículo 140 de las N.A. UNAH",
  "Otro motivo",
];

const MAX_WORDS = 100;

function countWords(s: string): number {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

export function RejectModal({ open, estudianteNombre, onConfirm, onCancel }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [comentario, setComentario] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = useMemo(
    () =>
      search.trim()
        ? PREDEFINED_REASONS.filter((r) => r.toLowerCase().includes(search.toLowerCase()))
        : PREDEFINED_REASONS,
    [search],
  );

  const wordCount = countWords(comentario);
  const wordColor =
    wordCount >= MAX_WORDS + 1
      ? "#ef4444"
      : wordCount >= 90
        ? "#f59e0b"
        : "#6b7280";
  const canSubmit = selected.length > 0 && wordCount <= MAX_WORDS;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={() => {
        setSearch("");
        setSelected([]);
        setComentario("");
        onCancel();
      }}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            Rechazar asistencia — {estudianteNombre}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg border"
              style={{ borderColor: "#d1d5db" }}
            >
              <Search className="size-4 text-gray-400" />
              <input
                className="w-full text-sm outline-none bg-transparent"
                placeholder="Escribe para filtrar motivos..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowDropdown(e.target.value.trim().length > 0);
                }}
                onFocus={() => {
                  if (search.trim()) setShowDropdown(true);
                }}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                style={{ border: "none" }}
              />
            </div>

            {showDropdown && filtered.length > 0 && (
              <div className="absolute left-0 right-0 z-50 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filtered.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 transition-colors"
                    style={{ color: "#374151" }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (!selected.includes(reason)) {
                        setSelected((prev) => [...prev, reason]);
                      }
                      setSearch("");
                      setShowDropdown(true);
                    }}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            )}
            {showDropdown && filtered.length === 0 && (
              <div className="absolute left-0 right-0 z-50 mt-1 bg-white border rounded-lg shadow-lg p-3 text-sm text-gray-500">
                No se encontraron motivos
              </div>
            )}
          </div>

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((reason) => (
                <div
                  key={reason}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
                  style={{
                    backgroundColor: "#fee2e2",
                    border: "1px solid #ef4444",
                    color: "#991b1b",
                  }}
                >
                  <span>{reason}</span>
                  <button
                    type="button"
                    className="size-4 rounded-full grid place-items-center hover:bg-red-200 transition-colors text-sm leading-none"
                    onClick={() => setSelected((prev) => prev.filter((r) => r !== reason))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <textarea
              className="w-full rounded-lg border p-3 text-sm resize-none outline-none"
              rows={3}
              placeholder="Comentario adicional (opcional, máximo 100 palabras)..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              style={{ borderColor: "#d1d5db" }}
            />
            <div
              className="text-xs text-right mt-1 font-medium"
              style={{ color: wordColor }}
            >
              {wordCount}/{MAX_WORDS} palabras
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-6 flex gap-3">
          <button
            type="button"
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
            style={{
              backgroundColor: "#ffffff",
              borderColor: "#d1d5db",
              color: "#374151",
            }}
            onClick={() => {
              setSearch("");
              setSelected([]);
              setComentario("");
              onCancel();
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: canSubmit ? "#ef4444" : "#d1d5db",
              color: canSubmit ? "#ffffff" : "#9ca3af",
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
            disabled={!canSubmit}
            onClick={() => {
              if (!canSubmit || selected.length === 0) return;
              const motivo =
                selected.join("; ") + (comentario.trim() ? ": " + comentario.trim() : "");
              setSearch("");
              setSelected([]);
              setComentario("");
              onConfirm(motivo);
            }}
          >
            Enviar rechazo
          </button>
        </div>
      </div>
    </div>
  );
}
