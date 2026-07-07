"""Generación del PDF de una cotización con formato profesional FixYa.

Reproduce el formato de referencia: encabezado con logo, número y fecha, barra
de estado, datos del técnico y del cliente, descripción del trabajo, detalle con
el total, condiciones del servicio y los dos bloques de firma (técnico siempre;
cliente solo cuando la cotización fue aceptada).
"""

import os
from datetime import datetime

from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import HexColor, white
from reportlab.lib.utils import simpleSplit
from reportlab.pdfgen import canvas
from sqlalchemy import func

from app.models.comuna import Comuna
from app.models.resena import Resena
from app.models.servicio import Servicio
from app.models.solicitud import Solicitud
from app.models.tecnico import Tecnico
from app.models.usuario import Usuario


# Paleta (tomada del formato de referencia).
NAVY = HexColor(0x1F3A5F)
HEADER_BG = HexColor(0xDCEAF5)
ORANGE = HexColor(0xE8792B)
LIGHT_ORANGE = HexColor(0xFDF0E1)
COND_BG = HexColor(0xE9F5EC)
GREY_LINE = HexColor(0xC7D2DE)
GREY_TEXT = HexColor(0x5B6B7B)

PAGE_W, PAGE_H = letter
MARGIN = 40
CONTENT_W = PAGE_W - 2 * MARGIN


ESTADO_LABEL = {
    "ENVIADA": "Pendiente de aceptacion",
    "ACEPTADA": "Aceptada",
    "RECHAZADA": "Rechazada",
    "ANULADA": "Anulada",
    "ANULADA_CAMBIO_ALCANCE": "Anulada por cambio de alcance",
    "EXPIRADA": "Expirada",
}


def _money(valor) -> str:
    """Formatea un monto en pesos chilenos: 20000 -> '$20.000'."""
    try:
        entero = int(round(float(valor)))
    except (TypeError, ValueError):
        return "$0"
    return "$" + f"{entero:,}".replace(",", ".")


def _fecha(dt) -> str:
    if not dt:
        return "-"
    return dt.strftime("%d-%m-%Y %H:%M")


def _fecha_corta(dt) -> str:
    if not dt:
        return "-"
    return dt.strftime("%d-%m-%Y")


def _numero_cotizacion(cotizacion) -> str:
    base = cotizacion.fecha_cotizacion or datetime.utcnow()
    return f"COT-{base.year}-{cotizacion.id_cotizacion:04d}"


def _rating_tecnico(db, tecnico_rut):
    promedio = (
        db.query(func.avg(Resena.calificacion))
        .join(Solicitud, Solicitud.id_solicitud == Resena.solicitud_id_solicitud)
        .filter(
            Solicitud.tecnico_usuario_rut == tecnico_rut,
            Resena.resena_activa == "S",
        )
        .scalar()
    )
    total = (
        db.query(Resena)
        .join(Solicitud, Solicitud.id_solicitud == Resena.solicitud_id_solicitud)
        .filter(
            Solicitud.tecnico_usuario_rut == tecnico_rut,
            Resena.resena_activa == "S",
        )
        .count()
    )
    return (round(float(promedio), 1) if promedio else 0.0), total


def _seccion(c, y, titulo):
    """Barra de sección navy con texto blanco. Devuelve la y inferior."""
    alto = 20
    c.setFillColor(NAVY)
    c.rect(MARGIN, y - alto, CONTENT_W, alto, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN + 8, y - alto + 6, titulo)
    return y - alto


def _lineas(c, x, y, pares, ancho, leading=13):
    """Dibuja pares (etiqueta_negrita, valor) apilados. Devuelve nueva y."""
    for label, valor in pares:
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(NAVY)
        etiqueta = f"{label}: " if label else ""
        c.drawString(x, y, etiqueta)
        ancho_label = c.stringWidth(etiqueta, "Helvetica-Bold", 8.5)
        c.setFont("Helvetica", 8.5)
        c.setFillColor(HexColor(0x22303F))
        texto = str(valor) if valor is not None else "-"
        # Recorta si excede el ancho de la columna.
        maxw = ancho - ancho_label - 4
        while texto and c.stringWidth(texto, "Helvetica", 8.5) > maxw:
            texto = texto[:-1]
        c.drawString(x + ancho_label, y, texto)
        y -= leading
    return y


def generar_pdf_cotizacion(db, cotizacion, solicitud):
    os.makedirs("uploads/cotizaciones", exist_ok=True)
    ruta = f"uploads/cotizaciones/cotizacion_{cotizacion.id_cotizacion}.pdf"

    # --- Datos relacionados ---
    tecnico = db.query(Tecnico).filter(
        Tecnico.usuario_rut == cotizacion.tecnico_usuario_rut
    ).first()
    tecnico_user = db.query(Usuario).filter(
        Usuario.rut == cotizacion.tecnico_usuario_rut
    ).first()
    cliente_user = db.query(Usuario).filter(
        Usuario.rut == solicitud.usuario_rut
    ).first()
    servicio = db.query(Servicio).filter(
        Servicio.id_servicio == solicitud.servicio_id_servicio
    ).first()
    comuna_cliente = db.query(Comuna).filter(
        Comuna.id_comuna == solicitud.comuna_id_comuna
    ).first()
    comuna_tecnico = (
        db.query(Comuna).filter(Comuna.id_comuna == tecnico_user.comuna_id_comuna).first()
        if tecnico_user else None
    )
    promedio, total_resenas = _rating_tecnico(db, cotizacion.tecnico_usuario_rut)

    c = canvas.Canvas(ruta, pagesize=letter)
    c.setTitle(f"Cotizacion {_numero_cotizacion(cotizacion)}")

    # ================= ENCABEZADO =================
    head_h = 58
    top = PAGE_H - MARGIN
    c.setFillColor(HEADER_BG)
    c.rect(MARGIN, top - head_h, CONTENT_W, head_h, fill=1, stroke=0)

    # Logo "FY"
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

    # Bloque derecho
    c.setFillColor(ORANGE)
    c.setFont("Helvetica-Bold", 17)
    c.drawRightString(PAGE_W - MARGIN - 12, top - 24, "COTIZACION")
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 9)
    c.drawRightString(
        PAGE_W - MARGIN - 12, top - 38, f"N {_numero_cotizacion(cotizacion)}"
    )
    c.setFont("Helvetica", 8)
    c.drawRightString(
        PAGE_W - MARGIN - 12,
        top - 50,
        f"Fecha: {_fecha_corta(cotizacion.fecha_cotizacion or datetime.utcnow())}",
    )

    y = top - head_h - 12

    # ================= BARRA DE ESTADO =================
    estado = cotizacion.estado_cotizacion or "ENVIADA"
    estado_txt = ESTADO_LABEL.get(estado, estado)
    barra_h = 22
    mitad = CONTENT_W / 2
    c.setFillColor(NAVY)
    c.rect(MARGIN, y - barra_h, mitad, barra_h, fill=1, stroke=0)
    c.setFillColor(LIGHT_ORANGE if estado == "ENVIADA" else HEADER_BG)
    c.rect(MARGIN + mitad, y - barra_h, mitad, barra_h, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(MARGIN + mitad / 2, y - barra_h + 7, "ESTADO DE LA COTIZACION")
    c.setFillColor(ORANGE if estado == "ENVIADA" else NAVY)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(MARGIN + mitad + mitad / 2, y - barra_h + 7, estado_txt)
    y -= barra_h + 12

    # ================= DATOS TECNICO / CLIENTE =================
    col_w = (CONTENT_W - 12) / 2
    x_izq = MARGIN
    x_der = MARGIN + col_w + 12

    # Cabeceras
    c.setFillColor(NAVY)
    c.rect(x_izq, y - 18, col_w, 18, fill=1, stroke=0)
    c.rect(x_der, y - 18, col_w, 18, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(x_izq + col_w / 2, y - 13, "DATOS DEL TECNICO")
    c.drawCentredString(x_der + col_w / 2, y - 13, "DATOS DEL CLIENTE")
    y_datos = y - 18 - 14

    especialidad = (tecnico.nivel_tecnico if tecnico else None) or "Tecnico"
    tecnico_pares = [
        ("", (tecnico_user.nombre_completo if tecnico_user else cotizacion.tecnico_usuario_rut)),
        ("RUT", cotizacion.tecnico_usuario_rut),
        ("Especialidad", especialidad),
        (
            "Calificacion",
            f"{promedio} ({total_resenas} resenas)" if total_resenas else "Sin resenas aun",
        ),
        ("Telefono", tecnico_user.telefono if tecnico_user else None),
        ("Zona", comuna_tecnico.nombre_comuna if comuna_tecnico else None),
    ]
    cliente_pares = [
        ("", (cliente_user.nombre_completo if cliente_user else solicitud.usuario_rut)),
        ("RUT", solicitud.usuario_rut),
        ("Correo", cliente_user.correo if cliente_user else None),
        ("Telefono", cliente_user.telefono if cliente_user else None),
        ("Direccion", solicitud.direccion),
        ("Comuna", comuna_cliente.nombre_comuna if comuna_cliente else None),
    ]

    # El nombre (primer par sin etiqueta) va en negrita más grande.
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(NAVY)
    c.drawString(x_izq + 4, y_datos, str(tecnico_pares[0][1]))
    c.drawString(x_der + 4, y_datos, str(cliente_pares[0][1]))
    _lineas(c, x_izq + 4, y_datos - 14, tecnico_pares[1:], col_w - 8)
    y_fin = _lineas(c, x_der + 4, y_datos - 14, cliente_pares[1:], col_w - 8)
    y = y_fin - 6

    # ================= DESCRIPCION DEL TRABAJO =================
    y = _seccion(c, y, "DESCRIPCION DEL TRABAJO SOLICITADO") - 12
    c.setFillColor(HexColor(0x22303F))
    c.setFont("Helvetica", 9)
    descripcion = solicitud.descripcion_problema or "-"
    for linea in simpleSplit(descripcion, "Helvetica", 9, CONTENT_W - 8)[:4]:
        c.drawString(MARGIN + 4, y, linea)
        y -= 12
    y -= 6

    # ================= DETALLE DE LA COTIZACION =================
    y = _seccion(c, y, "DETALLE DE LA COTIZACION")
    # Cabecera de tabla
    col_item = 34
    col_precio = 90
    col_mat = 90
    col_desc = CONTENT_W - col_item - col_mat - col_precio
    hx = MARGIN
    c.setFillColor(HEADER_BG)
    c.rect(MARGIN, y - 18, CONTENT_W, 18, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(hx + 4, y - 13, "Item")
    c.drawString(hx + col_item + 4, y - 13, "Descripcion")
    c.drawCentredString(hx + col_item + col_desc + col_mat / 2, y - 13, "Incluye materiales")
    c.drawRightString(MARGIN + CONTENT_W - 6, y - 13, "Precio")
    y -= 18

    # Fila única (total único + flag materiales)
    fila_h = 20
    detalle_txt = (cotizacion.mensaje_cotizacion or solicitud.titulo_solicitud or "Servicio").strip()
    if servicio:
        detalle_txt = f"{servicio.nombre_servicio} - {detalle_txt}"
    partes = simpleSplit(detalle_txt, "Helvetica", 8.5, col_desc - 8)[:1]
    detalle_txt = partes[0] if partes else "Servicio"
    c.setFillColor(white)
    c.rect(MARGIN, y - fila_h, CONTENT_W, fila_h, fill=1, stroke=0)
    c.setStrokeColor(GREY_LINE)
    c.line(MARGIN, y - fila_h, MARGIN + CONTENT_W, y - fila_h)
    c.setFillColor(HexColor(0x22303F))
    c.setFont("Helvetica", 8.5)
    c.drawString(hx + 4, y - 13, "1")
    c.drawString(hx + col_item + 4, y - 13, detalle_txt)
    c.drawCentredString(
        hx + col_item + col_desc + col_mat / 2,
        y - 13,
        "Si" if cotizacion.materiales_incluidos else "No",
    )
    c.drawRightString(MARGIN + CONTENT_W - 6, y - 13, _money(cotizacion.monto_estimado))
    y -= fila_h

    # Fila total
    total_h = 22
    c.setFillColor(NAVY)
    c.rect(MARGIN, y - total_h, CONTENT_W, total_h, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(MARGIN + CONTENT_W - col_precio - 10, y - 15, "TOTAL A PAGAR")
    c.setFillColor(ORANGE)
    c.setFont("Helvetica-Bold", 12)
    c.drawRightString(MARGIN + CONTENT_W - 6, y - 15, _money(cotizacion.monto_estimado))
    y -= total_h + 10

    # ================= CONDICIONES DEL SERVICIO =================
    y = _seccion(c, y, "CONDICIONES DEL SERVICIO")
    materiales_txt = (
        "El valor total INCLUYE los materiales necesarios."
        if cotizacion.materiales_incluidos
        else "El valor total NO incluye los materiales (se cobran aparte)."
    )
    condiciones = [
        f"Materiales: {materiales_txt}",
        f"Vigencia de la cotizacion: hasta el {_fecha_corta(cotizacion.fecha_vigencia)}.",
        "Forma de pago: a convenir directamente con el tecnico al finalizar el trabajo.",
        "Trabajos adicionales: si se detectan fallas extra, se informara antes de proceder.",
    ]
    plazo = getattr(cotizacion, "plazo_estimado", None)
    if plazo:
        condiciones.insert(1, f"Plazo estimado de trabajo: {plazo}.")
    box_h = 12 + len(condiciones) * 14
    c.setFillColor(COND_BG)
    c.rect(MARGIN, y - box_h, CONTENT_W, box_h, fill=1, stroke=0)
    c.setFillColor(HexColor(0x244235))
    yy = y - 16
    for cond in condiciones:
        c.setFont("Helvetica-Bold", 8.5)
        c.drawString(MARGIN + 8, yy, "-")
        c.setFont("Helvetica", 8.5)
        c.drawString(MARGIN + 16, yy, cond)
        yy -= 14
    y = y - box_h - 14

    # ================= FIRMAS =================
    firma_w = (CONTENT_W - 16) / 2
    firma_h = 96
    fx_cli = MARGIN
    fx_tec = MARGIN + firma_w + 16
    aceptada = estado == "ACEPTADA"

    for fx, titulo, es_cliente in (
        (fx_cli, "Acepto la cotizacion", True),
        (fx_tec, "Emitida por el tecnico", False),
    ):
        c.setStrokeColor(GREY_LINE)
        c.setFillColor(white)
        c.rect(fx, y - firma_h, firma_w, firma_h, fill=1, stroke=1)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(fx + firma_w / 2, y - 18, titulo)

        if es_cliente and not aceptada:
            c.setFillColor(ORANGE)
            c.setFont("Helvetica-Oblique", 9)
            c.drawCentredString(fx + firma_w / 2, y - firma_h / 2, "Pendiente de aceptacion")
            continue

        # Línea de firma + datos
        c.setStrokeColor(NAVY)
        c.line(fx + 20, y - 52, fx + firma_w - 20, y - 52)
        nombre = (
            (cliente_user.nombre_completo if cliente_user else solicitud.usuario_rut)
            if es_cliente
            else (tecnico_user.nombre_completo if tecnico_user else cotizacion.tecnico_usuario_rut)
        )
        rut = solicitud.usuario_rut if es_cliente else cotizacion.tecnico_usuario_rut
        c.setFillColor(HexColor(0x22303F))
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(fx + firma_w / 2, y - 64, str(nombre))
        c.setFont("Helvetica", 8)
        c.drawCentredString(fx + firma_w / 2, y - 75, f"RUT: {rut}")
        c.setFillColor(GREY_TEXT)
        if es_cliente:
            c.drawCentredString(
                fx + firma_w / 2, y - 86,
                f"Firma digital verificada por FixYa - {_fecha(cotizacion.fecha_aceptacion)}",
            )
        else:
            c.drawCentredString(
                fx + firma_w / 2, y - 86,
                f"Tecnico verificado por FixYa - {_fecha(cotizacion.fecha_cotizacion or datetime.utcnow())}",
            )

    y -= firma_h + 14

    # ================= FOOTER =================
    c.setStrokeColor(GREY_LINE)
    c.line(MARGIN, y, PAGE_W - MARGIN, y)
    c.setFillColor(GREY_TEXT)
    c.setFont("Helvetica", 7)
    footer = (
        "Este documento fue generado automaticamente por la plataforma FixYa. "
        "La cotizacion es valida una vez aceptada digitalmente por el cliente."
    )
    yy = y - 12
    for linea in simpleSplit(footer, "Helvetica", 7, CONTENT_W):
        c.drawCentredString(PAGE_W / 2, yy, linea)
        yy -= 9
    c.drawCentredString(
        PAGE_W / 2, yy,
        f"N {_numero_cotizacion(cotizacion)}  |  www.fixya.cl  |  contacto@fixya.cl",
    )

    c.showPage()
    c.save()

    # URL pública servible (mount /uploads).
    return f"/{ruta}"
