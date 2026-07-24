export const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export interface ConstanciaData {
  estudiante_nombre: string;
  estudiante_carrera: string;
  estudiante_cuenta: string;
  estudiante_foto_url?: string;
  tutor_nombre: string;
  evento_nombre: string;
  evento_mes_anio: string;
  horas: number;
  categoria: string;
  voae_nombre: string;
  voae_cargo: string;
  voae_departamento: string;
  voae_codigo: string;
  voae_firma_url?: string;
  fecha_dia: number;
  fecha_mes: string;
  fecha_anio: number;
  constancia_id?: string;
  qr_data_url?: string;
  sello_url?: string;
  dia?: number;
  total_dias?: number;
}

export function generateConstanciaHtml(data: ConstanciaData): string {
  const categoryUpper = (data.categoria || "").toUpperCase();
  let categoriaLabel = categoryUpper;
  if (
    categoryUpper === "ACADEMICO" ||
    categoryUpper === "CIENTÍFICO-ACADÉMICO" ||
    categoryUpper === "CIENTIFICO-ACADEMICO"
  ) {
    categoriaLabel = "CIENTÍFICO-ACADÉMICO";
  } else if (
    categoryUpper === "CULTURAL" ||
    categoryUpper === "CULTURAL-ARTÍSTICO" ||
    categoryUpper === "CULTURAL-ARTISTICO"
  ) {
    categoriaLabel = "CULTURAL-ARTÍSTICO";
  } else if (categoryUpper === "DEPORTIVO") {
    categoriaLabel = "DEPORTIVO";
  } else if (categoryUpper === "SOCIAL") {
    categoriaLabel = "SOCIAL";
  }

  const cleanStudentName = (data.estudiante_nombre || "Estudiante").replace(/[^a-zA-Z0-9-_]/g, "_");
  const cleanEventName = (data.evento_nombre || "Evento").replace(/[^a-zA-Z0-9-_]/g, "_");
  const pdfTitle = `Constancia_VOAE_${cleanStudentName}_${cleanEventName}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${pdfTitle}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 210mm;
      height: 297mm;
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      color: #0f172a;
      line-height: 1.6;
      background-color: #ffffff;
      position: relative;
    }
    .cert-content {
      padding: 2.2cm 2cm 2cm 2.2cm;
      box-sizing: border-box;
      height: 100%;
      position: relative;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1.5px solid #003366;
      padding-bottom: 12px;
      margin-bottom: 25px;
    }
    .title {
      text-align: center;
      font-size: 18pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #003366;
      margin: 25px 0 25px 0;
      text-decoration: underline;
      text-underline-offset: 4px;
    }
    .body-text {
      text-align: justify;
      font-size: 12pt;
      margin: 20px 0;
      line-height: 1.8;
    }
    .body-text p {
      margin: 16px 0;
    }
    .student-name-box {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      text-transform: uppercase;
      color: #000000;
      margin: 20px 0 10px 0;
    }
    .student-meta-box {
      text-align: center;
      font-size: 12pt;
      margin-bottom: 20px;
    }
    .date-text {
      text-align: justify;
      margin-top: 30px;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .signature-area {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      align-items: end;
      justify-items: center;
      gap: 15px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    .sig-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      width: 100%;
    }
    .signature-line {
      width: 180px;
      border-top: 1.5px solid #0f172a;
      margin: 4px auto;
    }
    .firma-wrapper {
      position: relative;
      height: 55px;
      width: 180px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    .firma-imagen {
      max-width: 160px;
      max-height: 50px;
      object-fit: contain;
    }
    .sig-seal-img {
      width: 100px;
      height: 100px;
      object-fit: contain;
    }
    .sig-qr-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .sig-qr-wrap img {
      width: 85px;
      height: 85px;
    }
    .sig-qr-wrap span {
      font-family: Arial, sans-serif;
      font-size: 7pt;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="cert-content">
    <div class="header">
      <div style="display: flex; align-items: center; gap: 12px;">
        <img src="__ORIGIN__/logo-unah.png" alt="UNAH" style="height: 70px; width: auto; object-fit: contain;" />
        <img src="__ORIGIN__/logo-voae.png" alt="VOAE" style="height: 70px; width: auto; object-fit: contain;" />
      </div>
      <div style="text-align: right; font-family: Arial, sans-serif; font-size: 8.5pt; color: #475569; line-height: 1.4;">
        <div>Tel: 22166100</div>
        <div>Ext. 100304</div>
        <div>voae@unah.edu.hn</div>
      </div>
    </div>

    <div class="title">CONSTANCIA DE PARTICIPACIÓN${data.dia ? `<br/><span style="font-size:12pt;letter-spacing:1px;">DÍA ${data.dia} DE ${data.total_dias || "—"}</span>` : ""}</div>

    <div class="body-text">
      <p>La Vicerrectoría de Orientación y Asuntos Estudiantiles de la Universidad Nacional Autónoma de Honduras, <strong>HACE CONSTAR QUE:</strong></p>
      
      <div class="student-name-box">${data.estudiante_nombre.toUpperCase()}</div>
      
      <div class="student-meta-box">
        estudiante de la Carrera de <strong>${data.estudiante_carrera.toUpperCase()}</strong><br/>
        con No. de Cta. <strong>${data.estudiante_cuenta}</strong>
      </div>

      <p>ha participado durante su proceso formativo en el <strong>“${data.evento_nombre.toUpperCase()}”</strong>, como parte de las actividades establecidas en el Artículo 140 de las Normas Académicas de la UNAH; en dicho evento el (la) estudiante acumuló <strong>${data.horas} ${data.horas === 1 ? "HORA" : "HORAS"}</strong> cubriendo así el ámbito <strong>${categoriaLabel}</strong>.</p>
      
      <p>La presente constancia se extiende conforme datos recibidos desde la unidad académica responsable del desarrollo de la actividad antes descrita y para fines de trámite de graduación.</p>
    </div>

    <div class="date-text">
      Dado en Ciudad Universitaria José Trinidad Reyes a los ${data.fecha_dia} días del mes de ${data.fecha_mes} del año ${data.fecha_anio}.
    </div>

    <div class="signature-area">
      <!-- Columna 1: Firma y datos VOAE -->
      <div class="sig-col">
        <div class="firma-wrapper">
          ${
            data.voae_firma_url
              ? `<img src="${data.voae_firma_url}" alt="Firma" class="firma-imagen" />`
              : `<div style="height:40px;"></div>`
          }
        </div>
        <div class="signature-line"></div>
        <p style="margin: 4px 0 0; font-size: 9.5pt; font-weight: bold; color: #003366;">Por: ${data.voae_nombre.toUpperCase()}</p>
        <p style="margin: 1px 0; font-size: 8.5pt; color: #475569;">${data.voae_cargo}</p>
        <p style="margin: 1px 0; font-size: 8.5pt; color: #475569;">${data.voae_departamento}</p>
        <p style="margin: 2px 0 0; font-size: 8pt; color: #0284c7; font-family: monospace; font-weight: bold;">Cód. Reg. ${data.voae_codigo}</p>
      </div>

      <!-- Columna 2: Sello Oficial VOAE -->
      <div class="sig-col">
        ${
          data.sello_url
            ? `<img src="${data.sello_url}" alt="Sello" class="sig-seal-img" />`
            : `<div style="width:90px; height:90px; border-radius:50%; border:2px solid #003366; display:flex; flex-direction:column; align-items:center; justify-center; text-align:center; font-size:7pt; font-weight:bold; color:#003366; padding:6px; box-sizing:border-box;"><div>SELLO OFICIAL</div><div>VOAE UNAH</div></div>`
        }
      </div>

      <!-- Columna 3: Código QR -->
      <div class="sig-col">
        ${
          data.qr_data_url
            ? `
          <div class="sig-qr-wrap">
            <img src="${data.qr_data_url}" alt="QR" />
            <span>Escanea para verificar</span>
          </div>
        `
            : ""
        }
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function generateSealCanvasDataUrl(
  nombre: string,
  cargo: string,
  departamento: string,
  codigo_firma: string,
): string {
  try {
    if (typeof document === "undefined") return "";
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const cx = 120, cy = 120;
    ctx.globalAlpha = 0.9;

    ctx.beginPath();
    ctx.arc(cx, cy, 110, 0, Math.PI * 2);
    ctx.strokeStyle = "#003366";
    ctx.lineWidth = 3.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 103, 0, Math.PI * 2);
    ctx.strokeStyle = "#003366";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = "bold 13px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#003366";

    ctx.fillText("UNIVERSIDAD NACIONAL", cx, cy - 65);
    ctx.fillText("AUTÓNOMA DE HONDURAS", cx, cy - 48);

    ctx.font = "bold 12px Arial, sans-serif";
    ctx.fillText("VOAE", cx, cy - 20);

    ctx.font = "10px Arial, sans-serif";
    ctx.fillText("Cumplimiento Art. 140", cx, cy + 5);
    ctx.fillText("Normas Académicas", cx, cy + 20);

    ctx.font = "bold 9px monospace";
    ctx.fillText(codigo_firma || "ART.202606-18-S-CU", cx, cy + 50);

    ctx.beginPath();
    ctx.arc(cx, cy, 95, 0, Math.PI * 2);
    ctx.strokeStyle = "#003366";
    ctx.lineWidth = 1;
    ctx.stroke();

    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Error generando sello:", error);
    return "";
  }
}

function buildVerificationUrl(data: ConstanciaData): string {
  return JSON.stringify({
    estudiante: data.estudiante_nombre,
    cuenta: data.estudiante_cuenta,
    carrera: data.estudiante_carrera,
    evento: data.evento_nombre,
    horas: data.horas,
    categoria: data.categoria,
    firmante: data.voae_nombre,
    codigo_registro: data.voae_codigo || "ART.202606-18-S-CU",
    fecha: `${data.fecha_dia} ${data.fecha_mes} ${data.fecha_anio}`,
  });
}

export async function downloadConstanciaPdf(data: ConstanciaData): Promise<void> {
  try {
    if (!data || !data.estudiante_nombre) {
      console.warn("downloadConstanciaPdf: datos inválidos", data);
      return;
    }

    // Auto-generate official seal image if not provided
    let sello_url = data.sello_url;
    if (!sello_url && typeof document !== "undefined") {
      sello_url = generateSealCanvasDataUrl(
        data.voae_nombre || "Lic. Roberto Fiallos",
        data.voae_cargo || "Vicerrector",
        data.voae_departamento || "Orientación y Asuntos Estudiantiles",
        data.voae_codigo || "ART.202606-18-S-CU",
      );
    }

    // Auto-generate QR code if not provided
    let qr_data_url: string | undefined = data.qr_data_url;
    if (!qr_data_url) {
      try {
        const QRCode = (await import("qrcode")).default;
        const verUrl = buildVerificationUrl(data);
        qr_data_url = await QRCode.toDataURL(verUrl, {
          width: 200,
          margin: 1,
          color: { dark: "#003366", light: "#ffffff" },
        });
      } catch {
        qr_data_url = undefined;
      }
    }

    let html = generateConstanciaHtml({
      ...data,
      sello_url: sello_url || data.sello_url,
      qr_data_url: qr_data_url || data.qr_data_url,
    });

    html = html.replace(/__ORIGIN__/g, typeof window !== "undefined" ? window.location.origin : "");
    if (typeof window === "undefined") return;

    const cleanStudentName = (data.estudiante_nombre || "Estudiante").replace(/[^a-zA-Z0-9-_]/g, "_");
    const cleanEventName = (data.evento_nombre || "Evento").replace(/[^a-zA-Z0-9-_]/g, "_");
    const pdfTitle = `Constancia_VOAE_${cleanStudentName}_${cleanEventName}`;
    const originalTitle = typeof document !== "undefined" ? document.title : "";
    if (typeof document !== "undefined") {
      document.title = pdfTitle;
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          if (typeof document !== "undefined") {
            document.title = originalTitle;
          }
        }, 1500);
      }, 500);
    }
  } catch (error) {
    console.error("Error generando PDF:", error);
  }
}

export async function generateConstanciaHtmlWithQr(data: ConstanciaData): Promise<string> {
  let qr_data_url: string | undefined = data.qr_data_url;
  if (!qr_data_url) {
    try {
      const QRCode = (await import("qrcode")).default;
      const verUrl = buildVerificationUrl(data);
      qr_data_url = await QRCode.toDataURL(verUrl, {
        width: 200,
        margin: 1,
        color: { dark: "#003366", light: "#ffffff" },
      });
    } catch {
      qr_data_url = undefined;
    }
  }
  let html = generateConstanciaHtml({ ...data, qr_data_url });
  html = html.replace(/__ORIGIN__/g, typeof window !== "undefined" ? window.location.origin : "");
  return html;
}
