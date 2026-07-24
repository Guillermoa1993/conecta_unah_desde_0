import { toast } from "sonner";

const INSTITUTIONAL_PALETTE = {
  azulMarino: "#1e3a5f",
  dorado: "#d4a017",
};

export function notifyVoaeNewEvent(
  eventTitle: string,
  solicitanteNombre: string,
  eventUrl: string,
) {
  const subject = `Nuevo evento pendiente de aprobación: ${eventTitle}`;
  const body = [
    `Estimado equipo de VOAE,`,
    ``,
    `Se ha recibido un nuevo evento para revisión:`,
    ``,
    `  Título: ${eventTitle}`,
    `  Solicitante: ${solicitanteNombre}`,
    `  Enlace: ${eventUrl}`,
    ``,
    `Por favor, revise los detalles y apruebe o rechace el evento.`,
    ``,
    `Atentamente,`,
    `Sistema de Gestión de Eventos - Conecta Pumas`,
  ].join("\n");

  console.log(
    `%c[EMAIL NOTIFICATION]%c To: voae@unah.hn`,
    `color: ${INSTITUTIONAL_PALETTE.azulMarino}; font-weight: bold;`,
    `color: ${INSTITUTIONAL_PALETTE.dorado};`,
  );
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${body}`);

  toast.success(`Notificación enviada a VOAE: "${eventTitle}"`, {
    description: `Se ha notificado a VOAE sobre el nuevo evento pendiente de aprobación.`,
    style: { backgroundColor: INSTITUTIONAL_PALETTE.azulMarino, color: "white" },
  });
}

export function notifyVoaeEventFinalized(eventTitle: string, eventUrl: string) {
  const subject = `Evento finalizado: ${eventTitle}`;
  const body = [
    `Estimado equipo de VOAE,`,
    ``,
    `El siguiente evento ha sido finalizado:`,
    ``,
    `  Título: ${eventTitle}`,
    `  Enlace: ${eventUrl}`,
    ``,
    `Los certificados están listos para su revisión.`,
    ``,
    `Atentamente,`,
    `Sistema de Gestión de Eventos - Conecta Pumas`,
  ].join("\n");

  console.log(
    `%c[EMAIL NOTIFICATION]%c To: voae@unah.hn`,
    `color: ${INSTITUTIONAL_PALETTE.azulMarino}; font-weight: bold;`,
    `color: ${INSTITUTIONAL_PALETTE.dorado};`,
  );
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${body}`);

  toast.success(`Notificación enviada a VOAE: "${eventTitle}"`, {
    description: `Se ha notificado a VOAE que el evento ha finalizado.`,
    style: { backgroundColor: INSTITUTIONAL_PALETTE.azulMarino, color: "white" },
  });
}
