"""Comprobante profesional de trabajo finalizado (PDF).

Sirve como respaldo para cliente, técnico y administración. Incluye número de
comprobante, fecha de emisión, estado, datos de ambas partes, detalle del
trabajo, valores (mano de obra / materiales / total), método de pago, garantía,
observaciones finales y la constancia de aceptación de la cotización.
"""

import io
from datetime import datetime

from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import HexColor, white
from reportlab.lib.utils import simpleSplit
from reportlab.pdfgen import canvas

from app.models.comuna import Comuna
from app.models.cotizacion import Cotizacion
from app.models.servicio import Servicio
from app.models.tecnico import Tecnico
from app.models.usuario import Usuario
from app.services import storage_service

NAVY = HexColor(0x1F3A5F)
HEADER_BG = HexColor(0xDCEAF5)
GREEN = HexColor(0x1E7A46)
GREEN_BG = HexColor(0xE9F5EC)
GREY_LINE = HexColor(0xC7D2DE)
GREY_TEXT = HexColor(0x5B6B7B)

PAGE_W, PAGE_H = letter
MARGIN = 40
CONTENT_W = PAGE_W - 2 * MARGIN


def _money(valor) -> str:
    try:
        entero = int(round(float(valor)))
    except (TypeError, ValueError):
        return "$0"
    return "$" + f"{entero:,}".replace(",", ".")


def _fecha(dt) -> str:
    return dt.strftime("%d-%m-%Y %H:%M") if dt else "-"


def numero_comprobante(solicitud) -> str:
    if getattr(solicitud, "comprobante_codigo", None):
        return solicitud.comprobante_codigo
    base = solicitud.fecha_real or datetime.utcnow()
    return f"COMP-{base.year}-{solicitud.id_solicitud:05d}"


def _seccion(c, y, titulo):
    alto = 20
    c.setFillColor(NAVY)
    c.rect(MARGIN, y - alto, CONTENT_W, alto, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN + 8, y - alto + 6, titulo)
    return y - alto


def _lineas(c, x, y, pares, ancho, leading=13):
    for label, valor in pares:
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(NAVY)
        etiqueta = f"{label}: " if label else ""
        c.drawString(x, y, etiqueta)
        w = c.stringWidth(etiqueta, "Helvetica-Bold", 8.5)
        c.setFont("Helvetica", 8.5)
        c.setFillColor(HexColor(0x22303F))
        texto = str(valor) if valor is not None else "-"
        maxw = ancho - w - 4
        while texto and c.stringWidth(texto, "Helvetica", 8.5) > maxw:
            texto = texto[:-1]
        c.drawString(x + w, y, texto)
        y -= leading
    return y


def generar_pdf_comprobante(db, solicitud) -> str:
    buffer = io.BytesIO()

    tecnico = db.query(Tecnico).filter(
        Tecnico.usuario_rut == solicitud.tecnico_usuario_rut
    ).first()
    tecnico_user = db.query(Usuario).filter(
        Usuario.rut == solicitud.tecnico_usuario_rut
    ).first()
    cliente_user = db.query(Usuario).filter(
        Usuario.rut == solicitud.usuario_rut
    ).first()
    servicio = db.query(Servicio).filter(
        Servicio.id_servicio == solicitud.servicio_id_servicio
    ).first()
    comuna = db.query(Comuna).filter(
        Comuna.id_comuna == solicitud.comuna_id_comuna
    ).first()
    cotizacion = db.query(Cotizacion).filter(
        Cotizacion.solicitud_id_solicitud == solicitud.id_solicitud,
        Cotizacion.estado_cotizacion == "ACEPTADA",
    ).first()

    total = float(solicitud.costo_final or 0)
    materiales = float(solicitud.costo_materiales or 0)
    mano_obra = max(total - materiales, 0)

    c = canvas.Canvas(buffer, pagesize=letter)
    c.setTitle(f"Comprobante {numero_comprobante(solicitud)}")

    # ===== ENCABEZADO =====
    head_h = 58
    top = PAGE_H - MARGIN
    c.setFillColor(HEADER_BG)
    c.rect(MARGIN, top - head_h, CONTENT_W, head_h, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.roundRect(MARGIN + 10, top - head_h + 12, 34, 34, 6, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 15)
    c.drawCentredString(MARGIN + 27, top - head_h + 22, "FY")
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(MARGIN + 54, top - 26, "FixYa")
    c.setFillColor(GREY_TEXT)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN + 54, top - 40, "Directorio Inteligente de Tecnicos del Hogar")
    c.setFillColor(GREEN)
    c.setFont("Helvetica-Bold", 15)
    c.drawRightString(PAGE_W - MARGIN - 12, top - 22, "COMPROBANTE DE TRABAJO")
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 9)
    c.drawRightString(PAGE_W - MARGIN - 12, top - 37, f"N {numero_comprobante(solicitud)}")
    c.setFont("Helvetica", 8)
    c.drawRightString(
        PAGE_W - MARGIN - 12, top - 49,
        f"Emitido: {_fecha(solicitud.fecha_real or datetime.utcnow())}",
    )
    y = top - head_h - 12

    # ===== BARRA DE ESTADO =====
    barra_h = 22
    mitad = CONTENT_W / 2
    c.setFillColor(NAVY)
    c.rect(MARGIN, y - barra_h, mitad, barra_h, fill=1, stroke=0)
    c.setFillColor(GREEN_BG)
    c.rect(MARGIN + mitad, y - barra_h, mitad, barra_h, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(MARGIN + mitad / 2, y - barra_h + 7, "ESTADO DEL TRABAJO")
    c.setFillColor(GREEN)
    c.drawCentredString(MARGIN + mitad + mitad / 2, y - barra_h + 7, "FINALIZADO")
    y -= barra_h + 12

    # ===== DATOS TECNICO / CLIENTE =====
    col_w = (CONTENT_W - 12) / 2
    x_izq, x_der = MARGIN, MARGIN + col_w + 12
    c.setFillColor(NAVY)
    c.rect(x_izq, y - 18, col_w, 18, fill=1, stroke=0)
    c.rect(x_der, y - 18, col_w, 18, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(x_izq + col_w / 2, y - 13, "DATOS DEL TECNICO")
    c.drawCentredString(x_der + col_w / 2, y - 13, "DATOS DEL CLIENTE")
    yd = y - 18 - 14
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(NAVY)
    c.drawString(x_izq + 4, yd, str(tecnico_user.nombre_completo if tecnico_user else solicitud.tecnico_usuario_rut))
    c.drawString(x_der + 4, yd, str(cliente_user.nombre_completo if cliente_user else solicitud.usuario_rut))
    tec_pares = [
        ("RUT", solicitud.tecnico_usuario_rut),
        ("Especialidad", (tecnico.nivel_tecnico if tecnico else None) or "Tecnico"),
        ("Telefono", tecnico_user.telefono if tecnico_user else None),
    ]
    cli_pares = [
        ("RUT", solicitud.usuario_rut),
        ("Correo", cliente_user.correo if cliente_user else None),
        ("Telefono", cliente_user.telefono if cliente_user else None),
    ]
    _lineas(c, x_izq + 4, yd - 14, tec_pares, col_w - 8)
    yfin = _lineas(c, x_der + 4, yd - 14, cli_pares, col_w - 8)
    y = yfin - 6

    # ===== DATOS DE LA SOLICITUD =====
    y = _seccion(c, y, "DATOS DEL SERVICIO")
    y_info = y - 14
    info = [
        ("N de solicitud", f"#{solicitud.id_solicitud}"),
        ("Servicio", servicio.nombre_servicio if servicio else "-"),
        ("Direccion", f"{solicitud.direccion} ({comuna.nombre_comuna if comuna else ''})"),
        ("Inicio del trabajo", _fecha(solicitud.fecha_inicio)),
        ("Termino del trabajo", _fecha(solicitud.fecha_real)),
    ]
    _lineas(c, MARGIN + 4, y_info, info, CONTENT_W - 8)
    y = y_info - len(info) * 13 - 4

    # ===== DESCRIPCION DEL TRABAJO =====
    y = _seccion(c, y, "DESCRIPCION DEL TRABAJO REALIZADO") - 12
    c.setFillColor(HexColor(0x22303F))
    c.setFont("Helvetica", 9)
    desc = solicitud.descripcion_problema or "-"
    for linea in simpleSplit(desc, "Helvetica", 9, CONTENT_W - 8)[:4]:
        c.drawString(MARGIN + 4, y, linea)
        y -= 12
    y -= 6

    # ===== DETALLE DE VALORES =====
    y = _seccion(c, y, "DETALLE DE PAGO")
    filas = [("Mano de obra", mano_obra)]
    if materiales > 0:
        filas.append(("Materiales", materiales))
    for etiqueta, valor in filas:
        c.setFillColor(white)
        c.rect(MARGIN, y - 18, CONTENT_W, 18, fill=1, stroke=0)
        c.setStrokeColor(GREY_LINE)
        c.line(MARGIN, y - 18, MARGIN + CONTENT_W, y - 18)
        c.setFillColor(HexColor(0x22303F))
        c.setFont("Helvetica", 9)
        c.drawString(MARGIN + 6, y - 13, etiqueta)
        c.drawRightString(MARGIN + CONTENT_W - 6, y - 13, _money(valor))
        y -= 18
    # Total
    c.setFillColor(NAVY)
    c.rect(MARGIN, y - 22, CONTENT_W, 22, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN + 6, y - 15, "TOTAL PAGADO")
    c.setFillColor(HexColor(0x8CE0A9))
    c.setFont("Helvetica-Bold", 12)
    c.drawRightString(MARGIN + CONTENT_W - 6, y - 15, _money(total))
    y -= 22 + 6
    if solicitud.metodo_pago:
        c.setFillColor(GREY_TEXT)
        c.setFont("Helvetica", 8.5)
        c.drawString(MARGIN + 4, y, f"Metodo de pago: {solicitud.metodo_pago}")
        y -= 14

    # ===== GARANTIA Y OBSERVACIONES =====
    detalles = []
    if solicitud.garantia:
        detalles.append(("Garantia del trabajo", solicitud.garantia))
    if solicitud.observaciones_finales:
        detalles.append(("Observaciones finales", solicitud.observaciones_finales))
    if detalles:
        y = _seccion(c, y, "GARANTIA Y OBSERVACIONES") - 14
        for titulo, texto in detalles:
            c.setFillColor(NAVY)
            c.setFont("Helvetica-Bold", 8.5)
            c.drawString(MARGIN + 4, y, f"{titulo}:")
            y -= 12
            c.setFillColor(HexColor(0x22303F))
            c.setFont("Helvetica", 8.5)
            for linea in simpleSplit(texto, "Helvetica", 8.5, CONTENT_W - 8)[:3]:
                c.drawString(MARGIN + 8, y, linea)
                y -= 12
            y -= 4

    # ===== CONSTANCIA DE ACEPTACION =====
    firma_w = (CONTENT_W - 16) / 2
    firma_h = 78
    for fx, titulo, nombre, rut, extra in (
        (
            MARGIN, "Recibido conforme (cliente)",
            cliente_user.nombre_completo if cliente_user else solicitud.usuario_rut,
            solicitud.usuario_rut,
            f"Cotizacion aceptada el {_fecha(cotizacion.fecha_aceptacion)}" if cotizacion else "Servicio finalizado",
        ),
        (
            MARGIN + firma_w + 16, "Ejecutado por (tecnico)",
            tecnico_user.nombre_completo if tecnico_user else solicitud.tecnico_usuario_rut,
            solicitud.tecnico_usuario_rut,
            "Tecnico verificado por FixYa",
        ),
    ):
        c.setStrokeColor(GREY_LINE)
        c.setFillColor(white)
        c.rect(fx, y - firma_h, firma_w, firma_h, fill=1, stroke=1)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 9.5)
        c.drawCentredString(fx + firma_w / 2, y - 16, titulo)
        c.setStrokeColor(NAVY)
        c.line(fx + 20, y - 44, fx + firma_w - 20, y - 44)
        c.setFillColor(HexColor(0x22303F))
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(fx + firma_w / 2, y - 56, str(nombre))
        c.setFont("Helvetica", 8)
        c.drawCentredString(fx + firma_w / 2, y - 67, f"RUT: {rut}")
        c.setFillColor(GREY_TEXT)
        c.setFont("Helvetica", 7)
        c.drawCentredString(fx + firma_w / 2, y - 75, extra)
    y -= firma_h + 12

    # ===== FOOTER =====
    c.setStrokeColor(GREY_LINE)
    c.line(MARGIN, y, PAGE_W - MARGIN, y)
    c.setFillColor(GREY_TEXT)
    c.setFont("Helvetica", 7)
    c.drawCentredString(
        PAGE_W / 2, y - 12,
        "Comprobante generado automaticamente por la plataforma FixYa como respaldo del servicio realizado.",
    )
    c.drawCentredString(
        PAGE_W / 2, y - 21,
        f"Codigo: {numero_comprobante(solicitud)}  |  www.fixya.cl  |  contacto@fixya.cl",
    )

    c.showPage()
    c.save()

    return storage_service.guardar_bytes(
        "comprobantes",
        f"comprobante_{solicitud.id_solicitud}.pdf",
        buffer.getvalue(),
        "application/pdf",
    )
