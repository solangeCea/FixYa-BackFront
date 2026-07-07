import { formatCLP, formatDate } from "./format";

export interface ComprobanteData {
  folio: number | string;
  cliente: string;
  tecnico: string;
  servicio: string;
  direccion?: string | null;
  fecha?: string | null;
  monto: string | number | null | undefined;
}

// Escapa texto para insertarlo de forma segura en el HTML del comprobante.
function escaparHtml(valor: string): string {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function construirHtml(data: ComprobanteData): string {
  const filas: Array<[string, string]> = [
    ["Folio", `#${data.folio}`],
    ["Fecha", formatDate(data.fecha)],
    ["Cliente", data.cliente],
    ["Técnico", data.tecnico],
    ["Servicio", data.servicio],
  ];

  if (data.direccion) filas.push(["Dirección", data.direccion]);

  const filasHtml = filas
    .map(
      ([label, valor]) =>
        `<tr><td class="label">${escaparHtml(label)}</td><td class="value">${escaparHtml(
          valor
        )}</td></tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Comprobante FixYa #${escaparHtml(String(data.folio))}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 40px; }
  .doc { max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
  .head { background: #0d9488; color: #fff; padding: 24px 28px; }
  .head h1 { margin: 0; font-size: 22px; }
  .head p { margin: 4px 0 0; font-size: 13px; opacity: .9; }
  .body { padding: 24px 28px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; vertical-align: top; }
  td.label { color: #64748b; width: 40%; font-weight: 600; }
  td.value { color: #0f172a; }
  .total { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 16px; border-top: 2px solid #0f172a; }
  .total span { font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
  .total strong { font-size: 24px; }
  .foot { padding: 16px 28px; background: #f8fafc; font-size: 12px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 0; } .doc { border: none; } }
</style>
</head>
<body>
  <div class="doc">
    <div class="head">
      <h1>FixYa · Comprobante de servicio</h1>
      <p>Documento generado desde tu perfil</p>
    </div>
    <div class="body">
      <table>${filasHtml}</table>
      <div class="total">
        <span>Total del servicio</span>
        <strong>${escaparHtml(formatCLP(data.monto))}</strong>
      </div>
    </div>
    <div class="foot">Este comprobante refleja la información registrada en la plataforma FixYa.</div>
  </div>
</body>
</html>`;
}

// Abre una ventana con el comprobante listo para imprimir o guardar como PDF.
// Devuelve false si el navegador bloqueó la ventana emergente.
export function imprimirComprobante(data: ComprobanteData): boolean {
  const ventana = window.open("", "_blank", "width=720,height=820");
  if (!ventana) return false;

  ventana.document.write(construirHtml(data));
  ventana.document.close();
  ventana.focus();
  ventana.print();
  return true;
}
