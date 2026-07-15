import * as fs from 'fs';
import * as path from 'path';

const originalPath = path.join(__dirname, '../../codigo_grupo3_avanzado/src/components/app/EventForm.tsx');
const targetPath = path.join(__dirname, '../../frontend/src/app/components/app/EventForm.tsx');

function run() {
  console.log('📖 Leyendo EventForm.tsx original...');
  let content = fs.readFileSync(originalPath, 'utf8');

  // Replace TanStack Router navigate
  content = content.replace(
    `import { useNavigate } from "@tanstack/react-router";`,
    `import { useNavigate } from "react-router";\nimport { api } from "../../../services/api";`
  );

  // Replace component imports and paths
  content = content.replace(/from "@\/components\/ui\/button"/g, 'from "../ui/button"');
  content = content.replace(/from "@\/components\/ui\/input"/g, 'from "../ui/input"');
  content = content.replace(/from "@\/components\/ui\/label"/g, 'from "../ui/label"');
  content = content.replace(/from "@\/components\/ui\/textarea"/g, 'from "../ui/textarea"');
  content = content.replace(/from "@\/components\/ui\/select"/g, 'from "../ui/select"');
  content = content.replace(/from "@\/components\/ui\/switch"/g, 'from "../ui/switch"');
  content = content.replace(/from "@\/components\/ui\/checkbox"/g, 'from "../ui/checkbox"');
  content = content.replace(/from "@\/components\/ui\/dialog"/g, 'from "../ui/dialog"');
  content = content.replace(/from "@\/lib\/mock-data"/g, 'from "../../../lib/mock-data"');
  content = content.replace(/from "@\/lib\/role-context"/g, 'from "../../../lib/role-context"');
  content = content.replace(/from "@\/components\/app\/LocationPicker"/g, 'from "./LocationPicker"');
  content = content.replace(/from "@\/components\/app\/AnalogTimePicker"/g, 'from "./AnalogTimePicker"');
  content = content.replace(/from "@\/lib\/utils"/g, 'from "../../../lib/utils"');

  // Change default export
  content = content.replace('export default function EventForm', 'export function EventForm');

  // Replace handleSubmit with backend operations
  const oldHandleSubmit = `  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(data);
    setErrors(errs);
    const allFields = step2RequiredFields();
    allFields.push("titulo", "descripcion");
    setTouched((prev) => {
      const next = { ...prev };
      allFields.forEach((f) => {
        next[f] = true;
      });
      return next;
    });
    if (Object.keys(errs).length > 0) {
      toast.error("Corrige los campos marcados en rojo");
      return;
    }
    if (!categoriasHoras.some((ch) => ch.checked)) {
      toast.error("Selecciona al menos una categoría / ámbito");
      return;
    }
    const calcDuration = (): number => {
      if (!data.hora_inicio || !data.hora_fin) return 0;
      const [h1, m1] = data.hora_inicio.split(":").map(Number);
      const [h2, m2] = data.hora_fin.split(":").map(Number);
      const diff = h2 * 60 + m2 - (h1 * 60 + m1);
      return diff > 0 ? Math.round((diff / 60) * 10) / 10 : 0;
    };
    const checkedCategorias = categoriasHoras.filter((ch) => ch.checked);
    const primaryCategoria = checkedCategorias.length > 0 ? checkedCategorias[0].categoria : "ACADEMICO";
    const distribucion = data.tipo_evento === "HORAS_VOAE" && checkedCategorias.length > 0
      ? checkedCategorias.map((ch) => ({ categoria: ch.categoria, horas: ch.horas }))
      : undefined;

    if (isEdit && initialEvent) {
      const idx = EVENTS.findIndex((ev) => ev.id === initialEvent.id);
      if (idx !== -1) {
        (EVENTS as any)[idx] = {
          ...EVENTS[idx],
          titulo: data.titulo,
          descripcion: data.descripcion,
          categoria: primaryCategoria,
          tipo_evento: data.tipo_evento === "HORAS_VOAE" ? "HORAS_VOAE" : "RECREACION",
          imagen_url: imgPortada || "",
          fecha_inicio: data.fecha_inicio + "T" + data.hora_inicio + ":00",
          fecha_fin: data.fecha_fin + "T" + data.hora_fin + ":00",
          duracion_horas: data.tipo_evento === "HORAS_VOAE" ? checkedCategorias.reduce((s, c) => s + c.horas, 0) || calcDuration() : calcDuration(),
          cupo_maximo: parseInt(data.cupo_maximo) || 0,
          lugar: data.ubicacion || data.enlace_virtual || "",
          updated_at: new Date().toISOString(),
          tipo_actividad: data.tipo_actividad as "Presencial" | "Virtual" | "Híbrido",
          centro_regional: data.centro_regional,
          usa_imagen_personalizada: data.usa_imagen_personalizada,
          hora_inicio: data.hora_inicio,
          hora_fin: data.hora_fin,
          enlace_virtual: data.enlace_virtual,
          portada_url: imgPortada || undefined,
          imagenes_adicionales: images.length > 0 ? images : undefined,
          tutor_responsable: data.tutor_responsable,
          tipo_duracion: data.tipo_duracion,
          distribucion_horas: distribucion,
        };
      }
      toast.success("Cambios guardados");
    } else {
      const newEventId = "evt-" + Date.now();
      EVENTS.unshift({
        id: newEventId,
        tutor_id: user.id,
        tutor_nombre: user.name || data.tutor_responsable,
        titulo: data.titulo,
        descripcion: data.descripcion,
        categoria: primaryCategoria,
        tipo_evento: data.tipo_evento === "HORAS_VOAE" ? "HORAS_VOAE" : "RECREACION",
        imagen_url: imgPortada || "",
        fecha_inicio: data.fecha_inicio + "T" + data.hora_inicio + ":00",
        fecha_fin: data.fecha_fin + "T" + data.hora_fin + ":00",
        duracion_horas: data.tipo_evento === "HORAS_VOAE" ? checkedCategorias.reduce((s, c) => s + c.horas, 0) || calcDuration() : calcDuration(),
        cupo_maximo: parseInt(data.cupo_maximo) || 0,
        estado: "BORRADOR",
        lugar: data.ubicacion || data.enlace_virtual || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tipo_actividad: data.tipo_actividad as "Presencial" | "Virtual" | "Híbrido",
        centro_regional: data.centro_regional,
        usa_imagen_personalizada: data.usa_imagen_personalizada,
        requiere_inscripcion: true,
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin,
        enlace_virtual: data.enlace_virtual,
        visibilidad: "PUBLICO",
        portada_url: imgPortada || undefined,
        imagenes_adicionales: images.length > 0 ? images : undefined,
        tutor_responsable: data.tutor_responsable,
        tipo_duracion: data.tipo_duracion,
        distribucion_horas: distribucion,
      });
      toast.success("Evento guardado como borrador");
    }
    onClose();
  };`;

  const newHandleSubmit = `  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(data);
    setErrors(errs);
    const allFields = step2RequiredFields();
    allFields.push("titulo", "descripcion");
    setTouched((prev) => {
      const next = { ...prev };
      allFields.forEach((f) => {
        next[f] = true;
      });
      return next;
    });
    if (Object.keys(errs).length > 0) {
      toast.error("Corrige los campos marcados en rojo");
      return;
    }
    if (!categoriasHoras.some((ch) => ch.checked)) {
      toast.error("Selecciona al menos una categoría / ámbito");
      return;
    }
    const calcDuration = (): number => {
      if (!data.hora_inicio || !data.hora_fin) return 0;
      const [h1, m1] = data.hora_inicio.split(":").map(Number);
      const [h2, m2] = data.hora_fin.split(":").map(Number);
      const diff = h2 * 60 + m2 - (h1 * 60 + m1);
      return diff > 0 ? Math.round((diff / 60) * 10) / 10 : 0;
    };
    const checkedCategorias = categoriasHoras.filter((ch) => ch.checked);
    const primaryCategoria = checkedCategorias.length > 0 ? checkedCategorias[0].categoria : "ACADEMICO";
    const distribucion = data.tipo_evento === "HORAS_VOAE" && checkedCategorias.length > 0
      ? checkedCategorias.map((ch) => ({ categoria: ch.categoria, horas: ch.horas }))
      : undefined;

    const payload = {
      titulo: data.titulo,
      descripcion: data.descripcion,
      categoria: primaryCategoria,
      tipo_evento: data.tipo_evento === "HORAS_VOAE" ? "HORAS_VOAE" : "RECREACION",
      fecha_inicio: data.fecha_inicio + "T" + data.hora_inicio + ":00",
      fecha_fin: data.fecha_fin + "T" + data.hora_fin + ":00",
      duracion_horas: data.tipo_evento === "HORAS_VOAE" ? checkedCategorias.reduce((s, c) => s + c.horas, 0) || calcDuration() : calcDuration(),
      cupo_maximo: parseInt(data.cupo_maximo, 10) || 0,
      lugar: data.ubicacion || data.enlace_virtual || "",
      tipo_actividad: data.tipo_actividad,
      centro_regional: data.centro_regional,
      usa_imagen_personalizada: data.usa_imagen_personalizada,
      hora_inicio: data.hora_inicio,
      hora_fin: data.hora_fin,
      enlace_virtual: data.enlace_virtual,
      portada_url: imgPortada || null,
      imagenes_adicionales: images,
      tutor_responsable: data.tutor_responsable,
      tipo_duracion: data.tipo_duracion,
      distribucion_horas: distribucion,
      estado: isEdit ? initialEvent?.estado : "BORRADOR"
    };

    (async () => {
      try {
        if (isEdit && initialEvent) {
          await api.put(\`/eventos/\${initialEvent.id_evento || initialEvent.id}\`, payload);
          toast.success("¡Cambios guardados con éxito!");
        } else {
          await api.post('/eventos', payload);
          toast.success("¡Evento guardado como borrador!");
        }
        onClose();
      } catch (err: any) {
        toast.error("Error al guardar el evento", { description: err.message });
      }
    })();
  };`;

  content = content.replace(oldHandleSubmit, newHandleSubmit);

  console.log('✍️ Escribiendo EventForm.tsx modificado...');
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log('✅ Integración de EventForm terminada.');
}

run();
