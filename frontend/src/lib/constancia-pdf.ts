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

  const monthIndex = MESES.indexOf(data.fecha_mes);
  const monthNum = monthIndex !== -1 ? String(monthIndex + 1).padStart(2, "0") : "01";
  const catCode = categoriaLabel.slice(0, 1).toUpperCase();

  const voaeInitials = (data.voae_nombre || "")
    .split(" ")
    .filter((p) => !["lic.", "dr.", "dra.", "msc.", "ing.", "por:"].includes(p.toLowerCase()))
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  const initialsLine = `${voaeInitials || "MC"}/Yadira Flores`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Constancia - ${data.estudiante_nombre}</title>
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
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><circle cx='80' cy='80' r='60' fill='none' stroke='%23004b87' stroke-opacity='0.02' stroke-width='0.5'/><circle cx='80' cy='80' r='50' fill='none' stroke='%23004b87' stroke-opacity='0.02' stroke-width='0.5'/><circle cx='80' cy='80' r='40' fill='none' stroke='%23ffd100' stroke-opacity='0.03' stroke-width='0.5'/><circle cx='80' cy='80' r='30' fill='none' stroke='%23ffd100' stroke-opacity='0.03' stroke-width='0.5'/><circle cx='80' cy='80' r='20' fill='none' stroke='%23004b87' stroke-opacity='0.01' stroke-width='0.5'/><circle cx='80' cy='80' r='10' fill='none' stroke='%23004b87' stroke-opacity='0.01' stroke-width='0.5'/><line x1='0' y1='80' x2='160' y2='80' stroke='%23004b87' stroke-opacity='0.01' stroke-width='0.5'/><line x1='80' y1='0' x2='80' y2='160' stroke='%23004b87' stroke-opacity='0.01' stroke-width='0.5'/></svg>");
      background-repeat: repeat;
      background-color: #ffffff;
      position: relative;
    }
    .corner-accent {
      position: absolute;
      top: 0;
      right: 0;
      width: 22px;
      height: 140px;
      background-color: var(--puma-gold);
    }
    .cert-content {
      padding: 2.5cm 2cm 2cm 2.2cm;
      box-sizing: border-box;
      height: 100%;
      position: relative;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .divider {
      border: none;
      border-top: 2px solid var(--puma-gold);
      margin: 15px 0 25px 0;
    }
    .title {
      text-align: center;
      font-size: 19pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      color: var(--puma-dark);
      margin: 35px 0 30px 0;
      text-decoration: underline;
    }
    .body-text {
      text-align: justify;
      font-size: 12pt;
      text-indent: 1.5cm;
      margin: 20px 0;
      line-height: 1.75;
    }
    .body-text p {
      margin: 18px 0;
    }
    .body-text strong {
      color: #000000;
      font-weight: bold;
    }
    .date-text {
      text-align: justify;
      margin-top: 30px;
      line-height: 1.75;
    }
    .signature-area {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      gap: 32px;
      margin-top: 35px;
    }
    .sig-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      min-width: 0;
    }
    .sig-col.sig-col-firma {
      min-width: 280px;
    }
    .sig-col p {
      margin: 0;
    }
    .signature-line {
      width: 280px;
      border-top: 1.5px solid #0f172a;
      margin: 6px auto 0;
    }
    .firma-wrapper {
      position: relative;
      width: 280px;
      height: 55px;
      margin: 0 auto;
    }
    .firma-wrapper .firma-imagen {
      position: absolute;
      bottom: 6px;
      left: 50%;
      transform: translateX(-50%);
      width: auto;
      max-width: 200px;
      height: auto;
      max-height: 45px;
      opacity: 0.85;
      pointer-events: none;
      z-index: 2;
      display: block;
    }
    .sig-seal-img {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .sig-compliance {
      border: 1.8px solid #003366;
      color: #003366;
      font-family: Arial, sans-serif;
      font-size: 7.5pt;
      font-weight: bold;
      padding: 8px 12px;
      border-radius: 4px;
      text-align: center;
      transform: rotate(2deg);
      opacity: 0.85;
      background: rgba(255,255,255,0.85);
      line-height: 1.5;
    }
    .sig-qr-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
    }
    .sig-qr-wrap img {
      width: 80px;
      height: 80px;
    }
    .sig-qr-wrap span {
      font-family: Arial, sans-serif;
      font-size: 5.5pt;
      color: #475569;
      text-align: center;
      max-width: 85px;
    }
    .archive-note {
      position: absolute;
      bottom: 105px;
      left: 2cm;
      font-family: Arial, sans-serif;
      font-size: 8pt;
      color: #64748b;
      line-height: 1.3;
    }
    .motto-container {
      position: absolute;
      bottom: 60px;
      left: 0;
      right: 0;
      text-align: center;
    }
    .motto-line {
      width: 85%;
      border-top: 1.2px dashed #7f1d1d;
      margin: 0 auto;
    }
    .motto-text {
      font-family: 'Times New Roman', Times, serif;
      font-style: italic;
      color: #7f1d1d;
      font-size: 10.5pt;
      font-weight: bold;
      margin: 6px 0;
      letter-spacing: 0.2px;
    }
    .footer-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: var(--puma-dark);
      color: #ffffff;
      text-align: center;
      padding: 10px 20px;
      font-family: Arial, sans-serif;
      font-size: 8pt;
      font-weight: 500;
      letter-spacing: 0.2px;
      border-top: 2px solid var(--puma-gold);
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
  </style>
</head>
<body>
  <div class="corner-accent"></div>

  <div class="cert-content">
    <div class="header">
      <div style="display: flex; align-items: center; gap: 12px;">
        <img src="__ORIGIN__/logo-unah.png" alt="UNAH" style="width: 60px; height: 60px; object-fit: contain;" />
        <img src="__ORIGIN__/logo-voae.png" alt="VOAE" style="width: 60px; height: 60px; object-fit: contain;" />
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="text-align: right; font-family: Arial, sans-serif; font-size: 7.5pt; color: var(--puma-dark); line-height: 1.4;">
          <div><strong>Tel:</strong> 22166100 Ext. 100304, 100800</div>
          <div><strong>Email:</strong> horasarticulovoae@unah.edu.hn</div>
        </div>
        ${
          data.qr_data_url
            ? `
        <div style="display: flex; flex-direction: column; align-items: center;">
          <img src="${data.qr_data_url}" alt="QR" style="width: 80px; height: 80px;" />
        </div>
        `
            : ""
        }
      </div>
    </div>

      <hr class="divider" />

      <div class="title">CONSTANCIA DE PARTICIPACIÓN${data.dia ? `<br/><span style="font-size:12pt;letter-spacing:1px;">DÍA ${data.dia} DE ${data.total_dias || "—"}</span>` : ""}</div>

    <div class="body-text">
      <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 12px;">
        ${
          data.estudiante_foto_url
            ? `
          <img src="${data.estudiante_foto_url}" alt="" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 2px solid #cbd5e1; flex-shrink: 0;" />
        `
            : `
          <div style="width: 70px; height: 70px; border-radius: 50%; background-color: #1e3a5f; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; font-family: Arial, sans-serif; flex-shrink: 0;">
            ${data.estudiante_nombre
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
        `
        }
        <div>
          <p style="margin: 0 0 4px;">La Vicerrectoría de Orientación y Asuntos Estudiantiles de la Universidad Nacional Autónoma de Honduras, <strong>HACE CONSTAR QUE:</strong></p>
          <p style="margin: 0;"><strong>${data.estudiante_nombre.toUpperCase()}</strong> estudiante de la Carrera de <strong>${data.estudiante_carrera.toUpperCase()}</strong> con No. de Cta. <strong>${data.estudiante_cuenta}</strong>, ha participado durante su proceso formativo en el <strong>“${data.evento_nombre.toUpperCase()}”</strong>, como parte de las actividades establecidas en el Artículo 140 de las Normas Académicas de la UNAH; en dicho evento el (la) estudiante acumuló <strong>${data.horas} ${data.horas === 1 ? "HORA" : "HORAS"}</strong> cubriendo así el ámbito <strong>${categoriaLabel}</strong>.</p>
        </div>
      </div>
      
      <p>La presente constancia se extiende conforme datos recibidos desde la unidad académica responsable del desarrollo de la actividad antes descrita y para fines de trámite de graduación.</p>
    </div>

    <div class="date-text">
      Dado en Ciudad Universitaria “José Trinidad Reyes” a los ${data.fecha_dia} días del mes de ${data.fecha_mes.toLowerCase()} del año ${data.fecha_anio}.
    </div>

    <div class="signature-area">
      <!-- Column 1: Signature + VOAE info -->
      <div class="sig-col sig-col-firma">
        <div class="firma-wrapper">
          ${
            data.voae_firma_url
              ? `
            <img src="${data.voae_firma_url}" alt="Firma" class="firma-imagen" />
          `
              : ""
          }
        </div>
        <div class="signature-line"></div>
        <p style="margin: 8px 0 0; font-size: 10pt; font-weight: bold; color: #003366;">Por: ${data.voae_nombre.toUpperCase()}</p>
        <p style="margin: 1px 0; font-size: 9pt; color: #475569;">${data.voae_cargo}</p>
        <p style="margin: 1px 0; font-size: 9pt; color: #475569;">${data.voae_departamento}</p>
        <p style="margin: 3px 0 0; font-size: 8pt; color: #0284c7; font-family: monospace; font-weight: bold;">Cód. Reg. ${data.voae_codigo}</p>
      </div>

      <!-- Column 2: Canvas seal -->
      ${
        data.sello_url
          ? `
        <div class="sig-col">
          <img src="${data.sello_url}" alt="Sello" class="sig-seal-img" />
        </div>
      `
          : ""
      }

      <!-- Column 3: Compliance text -->
      <div class="sig-col">
        <div class="sig-compliance">
          Cumplimiento Art. 140<br/>N.A. UNAH<br/>UNAH - VOAE
        </div>
      </div>

      <!-- Column 4: QR code -->
      ${
        data.qr_data_url
          ? `
        <div class="sig-col">
          <div class="sig-qr-wrap">
            <img src="${data.qr_data_url}" alt="Código QR de verificación" />
            <span>Escanee para verificar</span>
          </div>
        </div>
      `
          : ""
      }
    </div>

    <div class="archive-note">
      <div style="display: flex; align-items: center; gap: 4px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.7;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
        Archivo
      </div>
      <div style="margin-top: 2px; padding-left: 16px;">${initialsLine}</div>
    </div>

    <div class="motto-container">
      <div class="motto-line"></div>
      <p class="motto-text">"La Educación es la Primera Necesidad de La República"</p>
      <div class="motto-line"></div>
    </div>

    <div class="footer-bar">
      <span>Universidad Nacional Autónoma de Honduras</span>
      <span style="opacity: 0.5;">|</span>
      <span>CIUDAD UNIVERSITARIA</span>
      <span style="opacity: 0.5;">|</span>
      <span>Tegucigalpa M.D.C. Honduras C.A.</span>
      <span style="opacity: 0.5;">|</span>
      <span style="font-weight: bold;">www.unah.edu.hn</span>
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
    if (!ctx) {
      console.warn("No se pudo obtener contexto 2D para el sello");
      return "";
    }

    const rotation = ((Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1) * Math.PI) / 180;
    const cx = 120,
      cy = 120;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.translate(-cx, -cy);

    ctx.globalAlpha = 0.85;

    const drawCurvedText = (
      text: string,
      r: number,
      startAngle: number,
      endAngle: number,
      fontSize: number,
      fontFamily: string,
      bold: boolean,
    ) => {
      ctx.font = `${bold ? "bold " : ""}${fontSize}px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#003366";
      const chars = text.split("");
      const totalAngle = endAngle - startAngle;
      const step = chars.length > 1 ? totalAngle / (chars.length - 1) : 0;
      for (let i = 0; i < chars.length; i++) {
        const a = startAngle + i * step;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a + Math.PI / 2);
        ctx.fillText(chars[i], 0, 0);
        ctx.restore();
      }
    };

    ctx.beginPath();
    ctx.arc(cx, cy, 114, 0, Math.PI * 2);
    ctx.strokeStyle = "#003366";
    ctx.lineWidth = 3.5;
    ctx.setLineDash([10, 7]);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 109, 0, Math.PI * 2);
    ctx.strokeStyle = "#003366";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([]);
    ctx.stroke();

    drawCurvedText(
      departamento.toUpperCase(),
      95,
      -Math.PI * 0.72,
      -Math.PI * 0.28,
      10,
      "Arial, sans-serif",
      true,
    );

    drawCurvedText(codigo_firma, 95, Math.PI * 0.28, Math.PI * 0.72, 8, "monospace", true);

    ctx.font = "bold 15px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#003366";
    ctx.fillText("UNAH / VOAE", cx, cy - 14);

    ctx.font = "bold 9px Arial, sans-serif";
    ctx.fillText(cargo.toUpperCase(), cx, cy + 12);

    ctx.font = "8px Arial, sans-serif";
    ctx.fillText(nombre.toUpperCase(), cx, cy + 26);

    ctx.restore();

    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Error generando sello:", error);
    return "";
  }
}

function buildVerificationUrl(data: ConstanciaData): string {
  const codigo = data.constancia_id || `const-${data.estudiante_cuenta}`;
  return `https://conectapumas.app/verificar/${encodeURIComponent(codigo)}`;
}

export async function downloadConstanciaPdf(data: ConstanciaData): Promise<void> {
  try {
    if (!data || !data.estudiante_nombre) {
      console.warn("downloadConstanciaPdf: datos inválidos", data);
      return;
    }
    let qr_data_url: string | undefined;
    if (!data.qr_data_url) {
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
    let html = generateConstanciaHtml({ ...data, qr_data_url: qr_data_url || data.qr_data_url });
    html = html.replace(/__ORIGIN__/g, typeof window !== "undefined" ? window.location.origin : "");
    if (typeof window === "undefined") return;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    } else {
      console.warn("No se pudo abrir ventana para el PDF (posible bloqueo de popups)");
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
