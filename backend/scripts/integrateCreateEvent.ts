import * as fs from 'fs';
import * as path from 'path';

const originalPath = path.join(__dirname, '../../codigo_grupo3_avanzado/src/routes/_app.tutor.create.tsx');
const targetPath = path.join(__dirname, '../../frontend/src/app/pages/tutor/CreateEvent.tsx');

function run() {
  console.log('📖 Leyendo archivo original...');
  let content = fs.readFileSync(originalPath, 'utf8');

  // Replace TanStack Router imports
  content = content.replace(
    `import { createFileRoute, Link } from "@tanstack/react-router";`,
    `import { Link, useNavigate } from "react-router";\nimport { api } from "../../../services/api";`
  );

  // Replace aliases
  content = content.replace(/from "@\/components\/app\/PageHeader"/g, 'from "../../components/app/PageHeader"');
  content = content.replace(/from "@\/components\/ui\/button"/g, 'from "../../components/ui/button"');
  content = content.replace(/from "@\/components\/ui\/input"/g, 'from "../../components/ui/input"');
  content = content.replace(/from "@\/components\/ui\/label"/g, 'from "../../components/ui/label"');
  content = content.replace(/from "@\/components\/ui\/textarea"/g, 'from "../../components/ui/textarea"');
  content = content.replace(/from "@\/components\/ui\/select"/g, 'from "../../components/ui/select"');
  content = content.replace(/from "@\/components\/ui\/switch"/g, 'from "../../components/ui/switch"');
  content = content.replace(/from "@\/components\/ui\/badge"/g, 'from "../../components/ui/badge"');
  content = content.replace(/from "@\/lib\/mock-data"/g, 'from "../../../lib/mock-data"');
  content = content.replace(/from "@\/lib\/event-store"/g, 'from "../../../lib/event-store"');
  content = content.replace(/from "@\/lib\/role-context"/g, 'from "../../../lib/role-context"');
  content = content.replace(/from "@\/utils"/g, 'from "../../../lib/utils"');
  content = content.replace(/from "@\/lib\/utils"/g, 'from "../../../lib/utils"');

  // Remove the PageHeader import so we can mock it locally or use it if PageHeader is replaced
  content = content.replace(`import { PageHeader } from "@/components/app/PageHeader";`, '');
  content = content.replace(`import { PageHeader } from "../../components/app/PageHeader";`, '');

  // Add the Local PageHeader Mock and state variables for real API
  const headerMock = `
function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-[#003366]">{title}</h1>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}
`;
  content = headerMock + '\n' + content;

  // Remove Route definition
  content = content.replace(
    /export const Route = createFileRoute\("\/_app\/tutor\/create"\)\(\{[\s\S]*?\}\);/g,
    ''
  );

  // Change function declaration to export
  content = content.replace('function CreateEvent() {', 'export function CreateEvent() {');

  // Find and replace the mock handleSubmit and success state
  // We want to add states at the start of CreateEvent:
  const targetStateInsert = `export function CreateEvent() {
  const navigate = useNavigate();
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [createdQrUrl, setCreatedQrUrl] = useState<string | null>(null);`;

  content = content.replace('export function CreateEvent() {', targetStateInsert);

  // Update handleSubmit to call database
  const oldHandleSubmit = `  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(data);
    setErrors(errs);
    setTouched(Object.fromEntries(requiredFields().map((f) => [f, true])) as any);
    if (Object.keys(errs).length > 0) {
      toast.error("Corrige los campos marcados en rojo");
      return;
    }
    const estado = data.tipo_evento === "RECREACION" ? "PROGRAMADO" : "PENDIENTE_APROBACION";
    const submissionData = { ...data, estado, creado_por_rol: "TUTOR" };
    setStep("success");
  };`;

  const newHandleSubmit = `  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(data);
    setErrors(errs);
    setTouched(Object.fromEntries(requiredFields().map((f) => [f, true])) as any);
    if (Object.keys(errs).length > 0) {
      toast.error("Corrige los campos marcados en rojo");
      return;
    }

    try {
      const payload = {
        ...data,
        cupo_maximo: parseInt(data.cupo_maximo, 10),
        duracion_horas: parseFloat(data.duracion_horas),
        latitud: data.latitud ? parseFloat(data.latitud) : null,
        longitud: data.longitud ? parseFloat(data.longitud) : null,
        portada_url: imgPortada || null,
        imagenes_adicionales: images,
      };

      const res = await api.post<any>('/eventos', payload);
      toast.success("¡Evento creado correctamente!");
      
      setCreatedEventId(res.id_evento);
      setCreatedQrUrl(\`https://conectapumas.app/inscribirse/\${res.id_evento}\`);
      setStep("success");
    } catch (err: any) {
      toast.error("Error al crear el evento", { description: err.message });
    }
  };`;

  content = content.replace(oldHandleSubmit, newHandleSubmit);

  // In success screen, replace mock qrUrl with createdQrUrl
  content = content.replace(
    /const mockEventId = `evt-\${Date\.now\(\)}`[\s\S]*?<QRCodeCanvas value=\{qrUrl\} size=\{220\} level="M" \/>/g,
    `<QRCodeCanvas value={createdQrUrl || ""} size={220} level="M" />`
  );

  // Link to panel path should be /tutor/eventos
  content = content.replace(
    `<Link to="/tutor">Ir al panel</Link>`,
    `<Link to="/tutor/eventos">Ir al panel</Link>`
  );

  console.log('✍️ Escribiendo archivo modificado...');
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log('✅ Integración del Formulario Multistep terminada.');
}

run();
