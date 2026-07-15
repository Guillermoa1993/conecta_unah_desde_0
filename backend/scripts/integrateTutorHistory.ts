import * as fs from 'fs';
import * as path from 'path';

const originalPath = path.join(__dirname, '../../codigo_grupo3_avanzado/src/routes/_app.tutor.history.tsx');
const targetPath = path.join(__dirname, '../../frontend/src/app/pages/tutor/History.tsx');

function run() {
  console.log('📖 Leyendo archivo de historial original...');
  let content = fs.readFileSync(originalPath, 'utf8');

  // Replace TanStack Router imports
  content = content.replace(
    `import { createFileRoute, Link } from "@tanstack/react-router";`,
    `import { Link } from "react-router";`
  );

  // Replace aliases
  content = content.replace(/from "@\/components\/ui\/table"/g, 'from "../../components/ui/table"');
  content = content.replace(/from "@\/components\/ui\/button"/g, 'from "../../components/ui/button"');
  content = content.replace(/from "@\/lib\/mock-data"/g, 'from "../../../lib/mock-data"');
  content = content.replace(/from "@\/lib\/role-context"/g, 'from "../../../lib/role-context"');

  // Remove PageHeader and StatsCard imports
  content = content.replace(`import { PageHeader } from "@/components/app/PageHeader";`, '');
  content = content.replace(`import { StatsCard } from "@/components/app/StatsCard";`, '');

  // Add the Local PageHeader and StatsCard Mocks
  const mocks = `
function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-[#003366]">{title}</h1>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}

function StatsCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: any; tone?: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm flex items-center justify-between bg-white">
      <div>
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-bold mt-2 text-[#003366]">{value}</p>
      </div>
      <div className="p-3 bg-slate-100 rounded-lg text-[#003366]">
        <Icon className="size-6" />
      </div>
    </div>
  );
}
`;
  content = mocks + '\n' + content;

  // Remove Route definition
  content = content.replace(
    /export const Route = createFileRoute\("\/_app\/tutor\/history"\)\(\{[\s\S]*?\}\);/g,
    ''
  );

  // Change function declaration to export
  content = content.replace('function TutorHistory() {', 'export function TutorHistory() {');

  // Change Link params to absolute React Router 7 URL
  content = content.replace(
    /<Link to="\/tutor\/events\/\$id" params=\{\{ id: e\.id \}\}>/g,
    `<Link to={\`/tutor/event/\${e.id}\`}>`
  );

  console.log('✍️ Escribiendo archivo de historial modificado...');
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log('✅ Integración de TutorHistory terminada.');
}

run();
