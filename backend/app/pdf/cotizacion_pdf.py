import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def generar_pdf_cotizacion(cotizacion, solicitud):

    os.makedirs("uploads/cotizaciones", exist_ok=True)

    nombre_archivo = f"uploads/cotizaciones/cotizacion_{cotizacion.id_cotizacion}.pdf"

    c = canvas.Canvas(nombre_archivo, pagesize=letter)

    c.setFont("Helvetica-Bold", 18)
    c.drawString(200, 750, "COTIZACIÓN FIXYA")

    c.setFont("Helvetica", 12)
    c.drawString(50, 700, f"Solicitud ID: {solicitud.id_solicitud}")
    c.drawString(50, 680, f"Título: {solicitud.titulo_solicitud}")
    c.drawString(50, 650, "Descripción del problema:")
    c.drawString(50, 630, solicitud.descripcion_problema)
    c.drawString(50, 590, f"Técnico: {cotizacion.tecnico_usuario_rut}")
    c.drawString(50, 560, f"Monto estimado: ${cotizacion.monto_estimado}")
    c.drawString(50, 530, "Detalle técnico:")
    c.drawString(50, 510, cotizacion.mensaje_cotizacion or "")
    c.drawString(50, 470, f"Fecha vigencia: {cotizacion.fecha_vigencia}")
    c.drawString(50, 420, "Firma técnico:")
    c.line(50, 390, 250, 390)

    c.save()

    return nombre_archivo