import * as fs from 'fs';
import * as path from 'path';

const originalPath = path.join(__dirname, '../../codigo_grupo3_avanzado/src/routes/_app.empleado.eventos.tsx');
const targetPath = path.join(__dirname, '../../frontend/src/app/pages/tutor/TutorEventos.tsx');

function run() {
  console.log('📖 Leyendo _app.empleado.eventos.tsx original...');
  let content = fs.readFileSync(originalPath, 'utf8');

  // Replace TanStack Router imports
  content = content.replace(
    `import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";`,
    `import { Link, useNavigate } from "react-router";\nimport { api } from "../../../services/api";`
  );

  // Replace aliases
  content = content.replace(/from "@\/components\/ui\/button"/g, 'from "../../components/ui/button"');
  content = content.replace(/from "@\/components\/ui\/dialog"/g, 'from "../../components/ui/dialog"');
  content = content.replace(/from "@\/lib\/role-context"/g, 'from "../../../lib/role-context"');
  content = content.replace(/from "@\/lib\/mock-data"/g, 'from "../../../lib/mock-data"');
  content = content.replace(/from "@\/lib\/event-store"/g, 'from "../../../lib/event-store"');
  content = content.replace(/from "@\/components\/app\/EventForm"/g, 'from "./EventForm"');
  content = content.replace(/from "@\/components\/app\/LocationPicker"/g, 'from "./LocationPicker"');
  content = content.replace(/from "@\/lib\/utils"/g, 'from "../../../lib/utils"');

  // Remove TanStack Route definition
  content = content.replace(
    /export const Route = createFileRoute\("\/_app\/empleado\/eventos"\)\(\{[\s\S]*?\}\);/g,
    ''
  );

  // Change function declaration to export
  content = content.replace('function GestionEventosPage() {', 'export function TutorEventos() {');

  // Update Link paths inside EventCard
  content = content.replace(
    /<Link to="\/empleado\/events\/\$id" params=\{\{ id: event\.id \}\}>/g,
    `<Link to={\`/tutor/event/\${event.id_evento || event.id}\`}>`
  );

  // Update navigation inside EventCard
  content = content.replace(
    /onClick=\{\(\) => navigate\({ to: "\/empleado\/events\/\$id", params: \{ id: event\.id \} }\)\}/g,
    `onClick={() => navigate(\`/tutor/event/\${event.id_evento || event.id}\`)}`
  );

  // Link to create-event
  content = content.replace(
    /<Link to="\/empleado\/create">/g,
    `<Link to="/tutor/create-event">`
  );

  // Modify EventCard signature to accept onRefresh and change typing to any
  content = content.replace(
    `function EventCard({
  event,
  onDelete,
  onEdit,
}: {
  event: UniEvent;
  onDelete: (id: string) => void;
  onEdit: (event: UniEvent) => void;
}) {`,
    `function EventCard({
  event,
  onDelete,
  onEdit,
  onRefresh,
}: {
  event: any;
  onDelete: (id: string) => void;
  onEdit: (event: any) => void;
  onRefresh: () => void;
}) {`
  );

  // Replace handlePublish with real API put call
  const oldHandlePublish = `  const handlePublish = () => {
    const idx = EVENTS.findIndex((e) => e.id === event.id);
    if (idx !== -1) {
      if (event.tipo_evento === "RECREACION") {
        EVENTS[idx] = {
          ...EVENTS[idx],
          estado: "PROGRAMADO",
          updated_at: new Date().toISOString(),
        };
        toast.success("Evento publicado automáticamente");
      } else {
        EVENTS[idx] = {
          ...EVENTS[idx],
          estado: "PENDIENTE_APROBACION",
          updated_at: new Date().toISOString(),
        };
        toast.success("Evento enviado a VOAE para revisión");
      }
      setPublishConfirm(false);
      window.location.reload();
    }
  };`;

  const newHandlePublish = `  const handlePublish = async () => {
    try {
      const newEstado = event.tipo_evento === "RECREACION" ? "PROGRAMADO" : "PENDIENTE_APROBACION";
      const payload = {
        ...event,
        estado: newEstado
      };
      await api.put(\`/eventos/\${event.id_evento || event.id}\`, payload);
      toast.success(
        event.tipo_evento === "RECREACION"
          ? "¡Evento publicado automáticamente!"
          : "¡Evento enviado a VOAE para revisión!"
      );
      setPublishConfirm(false);
      onRefresh();
    } catch (err: any) {
      toast.error("Error al publicar el evento", { description: err.message });
    }
  };`;

  content = content.replace(oldHandlePublish, newHandlePublish);

  // Replace delete handler inside delete confirm dialog
  const oldDeleteConfirmClick = `              onClick={() => {
                const idx = EVENTS.findIndex((e) => e.id === event.id);
                if (idx !== -1) {
                  EVENTS.splice(idx, 1);
                  toast.success("Borrador eliminado");
                  window.location.reload();
                }
                setDeleteConfirm(false);
              }}`;

  const newDeleteConfirmClick = `              onClick={async () => {
                try {
                  await api.delete(\`/eventos/\${event.id_evento || event.id}\`);
                  toast.success("Borrador eliminado");
                  setDeleteConfirm(false);
                  onRefresh();
                } catch (err: any) {
                  toast.error("Error al eliminar borrador", { description: err.message });
                }
              }}`;

  content = content.replace(oldDeleteConfirmClick, newDeleteConfirmClick);

  // Replace state declarations and loading inside TutorEventos
  const oldState = `  const { user } = useRole();
  const [tab, setTab] = useState<Tab>("borradores");
  const [editingEvent, setEditingEvent] = useState<UniEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    const timer = setTimeout(() => {
      try {
        const events = EVENTS.filter((e) => e.tutor_id === user.id);
        if (events.length === 0 && EVENTS.length > 0) {
          setError(false);
        }
        setLoading(false);
      } catch {
        setError(true);
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [user.id, tab]);

  const tutorEvents = useMemo(() => EVENTS.filter((e) => e.tutor_id === user.id), [user.id]);`;

  const newState = `  const { user } = useRole();
  const [tab, setTab] = useState<Tab>("borradores");
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await api.get<any[]>('/eventos/mis-eventos');
      setEvents(data);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user.id]);

  const tutorEvents = events;`;

  content = content.replace(oldState, newState);

  // Replace handleRetry to refresh from API
  content = content.replace(
    `  const handleRetry = () => {
    setLoading(true);
    setError(false);
    setTimeout(() => setLoading(false), 300);
  };`,
    `  const handleRetry = () => {
    fetchEvents();
  };`
  );

  // Replace EventCard rendering to pass onRefresh
  content = content.replace(
    `<EventCard key={event.id} event={event} onDelete={() => {}} onEdit={handleEdit} />`,
    `<EventCard key={event.id || event.id_evento} event={event} onDelete={() => {}} onEdit={handleEdit} onRefresh={fetchEvents} />`
  );

  console.log('✍️ Escribiendo TutorEventos.tsx modificado...');
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log('✅ Integración de TutorEventos terminada.');
}

run();
