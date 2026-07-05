from datetime import date

from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.models.usuario import Usuario
from app.models.tecnico import Tecnico
from app.models.solicitud import Solicitud
from app.models.resena import Resena
from app.models.servicio import Servicio
from app.models.comuna import Comuna
from app.models.tecnico_servicio import TecnicoServicio
from app.models.tecnico_comuna import TecnicoComuna
from app.models.cotizacion import Cotizacion
from app.models.reporte_solicitud import ReporteSolicitud


def obtener_dashboard_admin(db: Session):
    total_usuarios = db.query(Usuario).count()

    total_tecnicos = db.query(Tecnico).count()

    total_clientes = db.query(Usuario).filter(
        Usuario.tipo_usuario == "CLIENTE"
    ).count()

    total_admins = db.query(Usuario).filter(
        Usuario.tipo_usuario == "ADMIN"
    ).count()

    tecnicos_verificados = db.query(Tecnico).filter(
        Tecnico.tecnico_verificado == True
    ).count()

    tecnicos_pendientes = db.query(Tecnico).filter(
        Tecnico.tecnico_verificado == False
    ).count()

    total_solicitudes = db.query(Solicitud).count()

    solicitudes_iniciadas = db.query(Solicitud).filter(
        Solicitud.estado_trabajo == "INICIADO"
    ).count()

    solicitudes_finalizadas = db.query(Solicitud).filter(
        Solicitud.estado_trabajo == "FINALIZADO"
    ).count()

    solicitudes_canceladas = db.query(Solicitud).filter(
        Solicitud.estado_trabajo == "CANCELADO"
    ).count()

    solicitudes_asignadas = db.query(Solicitud).filter(
        Solicitud.estado_trabajo == "ASIGNADO"
    ).count()

    solicitudes_en_proceso = db.query(Solicitud).filter(
        Solicitud.estado_trabajo == "EN_PROCESO"
    ).count()

    solicitudes_activas = db.query(Solicitud).filter(
        Solicitud.solicitud_activa == True,
        Solicitud.estado_trabajo != "FINALIZADO",
        Solicitud.estado_trabajo != "CANCELADO",
    ).count()

    total_resenas = db.query(Resena).count()

    resenas_activas = db.query(Resena).filter(
        Resena.resena_activa == "S"
    ).count()

    resenas_reportadas = db.query(Resena).filter(
        Resena.resena_reportada == "S"
    ).count()

    total_cotizaciones = db.query(Cotizacion).count()

    reportes_solicitudes_pendientes = db.query(ReporteSolicitud).filter(
        ReporteSolicitud.estado_reporte.in_(["PENDIENTE", "EN_REVISION"])
    ).count()

    promedio = db.query(
        func.avg(Resena.calificacion)
    ).scalar()

    return {
        "total_usuarios": total_usuarios,
        "total_tecnicos": total_tecnicos,
        "total_clientes": total_clientes,
        "total_admins": total_admins,
        "tecnicos_verificados": tecnicos_verificados,
        "tecnicos_pendientes": tecnicos_pendientes,
        "total_solicitudes": total_solicitudes,
        "solicitudes_iniciadas": solicitudes_iniciadas,
        "solicitudes_asignadas": solicitudes_asignadas,
        "solicitudes_en_proceso": solicitudes_en_proceso,
        "solicitudes_activas": solicitudes_activas,
        "solicitudes_finalizadas": solicitudes_finalizadas,
        "solicitudes_canceladas": solicitudes_canceladas,
        "total_resenas": total_resenas,
        "resenas_activas": resenas_activas,
        "resenas_reportadas": resenas_reportadas,
        "total_cotizaciones": total_cotizaciones,
        "reportes_solicitudes_pendientes": reportes_solicitudes_pendientes,
        "promedio_general_calificaciones": round(promedio or 0, 2)
    }


# ---------------------------------------------------------------------------
# ANALÍTICA DE LA PLATAFORMA
# ---------------------------------------------------------------------------

ESTADOS_SOLICITUD = [
    "INICIADO",
    "ASIGNADO",
    "EN_PROCESO",
    "FINALIZADO",
    "CANCELADO",
]

ESTADO_LABEL = {
    "INICIADO": "Pendientes",
    "ASIGNADO": "Asignadas",
    "EN_PROCESO": "En proceso",
    "FINALIZADO": "Finalizadas",
    "CANCELADO": "Canceladas",
}

MESES_ABREV = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
]

RANGOS_ETARIOS = [
    ("18-25", 18, 25),
    ("26-35", 26, 35),
    ("36-45", 36, 45),
    ("46-60", 46, 60),
    ("60+", 61, 200),
]


def _calcular_edad(fecha_nacimiento: date, hoy: date) -> int:
    return (
        hoy.year
        - fecha_nacimiento.year
        - ((hoy.month, hoy.day) < (fecha_nacimiento.month, fecha_nacimiento.day))
    )


def obtener_analitica_admin(db: Session):
    """Analítica de la plataforma para el panel administrativo.

    Todas las métricas se calculan con la información existente en la base de
    datos mediante consultas agregadas (GROUP BY), evitando cargar entidades
    completas en memoria.
    """

    # --- Indicadores generales -------------------------------------------
    total_usuarios = db.query(Usuario).count()
    total_clientes = db.query(Usuario).filter(
        Usuario.tipo_usuario == "CLIENTE"
    ).count()
    total_tecnicos = db.query(Tecnico).count()
    total_solicitudes = db.query(Solicitud).count()

    tecnicos_activos = db.query(Tecnico).filter(
        Tecnico.tecnico_verificado == True  # noqa: E712
    ).count()
    tecnicos_pendientes = db.query(Tecnico).filter(
        Tecnico.tecnico_verificado == False  # noqa: E712
    ).count()

    reportes_pendientes = db.query(Resena).filter(
        Resena.resena_reportada == "S",
        Resena.reporte_resuelto != "S",
    ).count()

    # --- Solicitudes por estado (una sola consulta agregada) -------------
    estado_rows = (
        db.query(Solicitud.estado_trabajo, func.count(Solicitud.id_solicitud))
        .group_by(Solicitud.estado_trabajo)
        .all()
    )
    conteo_estado = {estado: total for estado, total in estado_rows}

    solicitudes_por_estado = [
        {
            "estado": estado,
            "label": ESTADO_LABEL.get(estado, estado),
            "total": conteo_estado.get(estado, 0),
        }
        for estado in ESTADOS_SOLICITUD
    ]

    solicitudes_finalizadas = conteo_estado.get("FINALIZADO", 0)
    solicitudes_canceladas = conteo_estado.get("CANCELADO", 0)

    # --- Solicitudes por oficio ------------------------------------------
    oficio_rows = (
        db.query(Servicio.nombre_servicio, func.count(Solicitud.id_solicitud))
        .join(Solicitud, Solicitud.servicio_id_servicio == Servicio.id_servicio)
        .group_by(Servicio.nombre_servicio)
        .order_by(func.count(Solicitud.id_solicitud).desc())
        .all()
    )
    solicitudes_por_oficio = [
        {"nombre": nombre, "total": total} for nombre, total in oficio_rows
    ]

    # --- Solicitudes por comuna (top 10) ---------------------------------
    comuna_rows = (
        db.query(Comuna.nombre_comuna, func.count(Solicitud.id_solicitud))
        .join(Solicitud, Solicitud.comuna_id_comuna == Comuna.id_comuna)
        .group_by(Comuna.nombre_comuna)
        .order_by(func.count(Solicitud.id_solicitud).desc())
        .limit(10)
        .all()
    )
    solicitudes_por_comuna = [
        {"nombre": nombre, "total": total} for nombre, total in comuna_rows
    ]

    # --- Técnicos por oficio ---------------------------------------------
    tec_oficio_rows = (
        db.query(
            Servicio.nombre_servicio,
            func.count(TecnicoServicio.tecnico_usuario_rut),
        )
        .join(
            TecnicoServicio,
            TecnicoServicio.servicio_id_servicio == Servicio.id_servicio,
        )
        .group_by(Servicio.nombre_servicio)
        .order_by(func.count(TecnicoServicio.tecnico_usuario_rut).desc())
        .all()
    )
    tecnicos_por_oficio = [
        {"nombre": nombre, "total": total} for nombre, total in tec_oficio_rows
    ]

    # --- Clientes por comuna (top 10) ------------------------------------
    cliente_comuna_rows = (
        db.query(Comuna.nombre_comuna, func.count(Usuario.rut))
        .join(Usuario, Usuario.comuna_id_comuna == Comuna.id_comuna)
        .filter(Usuario.tipo_usuario == "CLIENTE")
        .group_by(Comuna.nombre_comuna)
        .order_by(func.count(Usuario.rut).desc())
        .limit(10)
        .all()
    )
    clientes_por_comuna = [
        {"nombre": nombre, "total": total} for nombre, total in cliente_comuna_rows
    ]

    # --- Cobertura de técnicos por comuna --------------------------------
    tec_comuna_rows = (
        db.query(
            Comuna.nombre_comuna,
            func.count(TecnicoComuna.tecnico_usuario_rut),
        )
        .join(
            TecnicoComuna,
            TecnicoComuna.comuna_id_comuna == Comuna.id_comuna,
        )
        .filter(TecnicoComuna.estado_cobertura == True)  # noqa: E712
        .group_by(Comuna.nombre_comuna)
        .order_by(func.count(TecnicoComuna.tecnico_usuario_rut).desc())
        .limit(10)
        .all()
    )
    tecnicos_por_comuna = [
        {"nombre": nombre, "total": total} for nombre, total in tec_comuna_rows
    ]

    # --- Problemas más frecuentes ----------------------------------------
    problema_rows = (
        db.query(Solicitud.tipo_problema, func.count(Solicitud.id_solicitud))
        .group_by(Solicitud.tipo_problema)
        .order_by(func.count(Solicitud.id_solicitud).desc())
        .limit(8)
        .all()
    )
    problemas_frecuentes = [
        {"nombre": tipo, "total": total} for tipo, total in problema_rows
    ]

    # --- Usuarios registrados por mes ------------------------------------
    usuarios_mes_rows = (
        db.query(
            extract("year", Usuario.created_at).label("anio"),
            extract("month", Usuario.created_at).label("mes"),
            Usuario.tipo_usuario,
            func.count(Usuario.id_usuario),
        )
        .group_by("anio", "mes", Usuario.tipo_usuario)
        .order_by("anio", "mes")
        .all()
    )

    periodos: dict[str, dict] = {}
    for anio, mes, tipo, total in usuarios_mes_rows:
        if anio is None or mes is None:
            continue
        anio = int(anio)
        mes = int(mes)
        clave = f"{anio:04d}-{mes:02d}"
        registro = periodos.setdefault(
            clave,
            {
                "periodo": clave,
                "label": f"{MESES_ABREV[mes - 1]} {anio}",
                "clientes": 0,
                "tecnicos": 0,
                "total": 0,
            },
        )
        tipo_str = getattr(tipo, "value", tipo)
        if tipo_str == "CLIENTE":
            registro["clientes"] += total
        elif tipo_str == "TECNICO":
            registro["tecnicos"] += total
        registro["total"] += total

    usuarios_por_mes = [periodos[c] for c in sorted(periodos.keys())]

    # --- Distribución etaria y edad promedio (clientes) ------------------
    hoy = date.today()
    nacimientos = (
        db.query(Usuario.fecha_nacimiento)
        .filter(
            Usuario.tipo_usuario == "CLIENTE",
            Usuario.fecha_nacimiento.isnot(None),
        )
        .all()
    )
    edades = [
        _calcular_edad(fila[0], hoy) for fila in nacimientos if fila[0] is not None
    ]
    distribucion_etaria = [
        {
            "rango": etiqueta,
            "total": sum(1 for e in edades if minimo <= e <= maximo),
        }
        for etiqueta, minimo, maximo in RANGOS_ETARIOS
    ]
    edad_promedio_clientes = round(sum(edades) / len(edades), 1) if edades else 0

    # --- Insights inteligentes -------------------------------------------
    oficio_mas_solicitado = (
        solicitudes_por_oficio[0]["nombre"] if solicitudes_por_oficio else None
    )
    comuna_mayor_demanda = (
        solicitudes_por_comuna[0]["nombre"] if solicitudes_por_comuna else None
    )

    # Menor cobertura: comuna con demanda y menor cantidad de técnicos que la cubren
    cobertura_por_comuna = {r["nombre"]: r["total"] for r in tecnicos_por_comuna}
    comuna_menor_cobertura = None
    for item in solicitudes_por_comuna:
        cobertura = cobertura_por_comuna.get(item["nombre"], 0)
        if comuna_menor_cobertura is None or cobertura < comuna_menor_cobertura[1]:
            comuna_menor_cobertura = (item["nombre"], cobertura)
    comuna_menor_cobertura_nombre = (
        comuna_menor_cobertura[0] if comuna_menor_cobertura else None
    )

    porcentaje_completadas = (
        round(solicitudes_finalizadas / total_solicitudes * 100, 1)
        if total_solicitudes
        else 0
    )

    meses_con_solicitudes = (
        db.query(
            extract("year", Solicitud.fecha_creacion),
            extract("month", Solicitud.fecha_creacion),
        )
        .distinct()
        .count()
    )
    promedio_solicitudes_mes = (
        round(total_solicitudes / meses_con_solicitudes, 1)
        if meses_con_solicitudes
        else 0
    )

    # Crecimiento de usuarios respecto al mes anterior
    crecimiento_usuarios_pct = 0
    tendencia = "estable"
    if len(usuarios_por_mes) >= 2:
        actual = usuarios_por_mes[-1]["total"]
        anterior = usuarios_por_mes[-2]["total"]
        if anterior > 0:
            crecimiento_usuarios_pct = round((actual - anterior) / anterior * 100, 1)
        elif actual > 0:
            crecimiento_usuarios_pct = 100.0
        if crecimiento_usuarios_pct > 0:
            tendencia = "creciente"
        elif crecimiento_usuarios_pct < 0:
            tendencia = "decreciente"
    elif len(usuarios_por_mes) == 1 and usuarios_por_mes[0]["total"] > 0:
        tendencia = "creciente"

    return {
        "indicadores": {
            "total_usuarios": total_usuarios,
            "total_clientes": total_clientes,
            "total_tecnicos": total_tecnicos,
            "total_solicitudes": total_solicitudes,
            "solicitudes_pendientes": conteo_estado.get("INICIADO", 0),
            "solicitudes_asignadas": conteo_estado.get("ASIGNADO", 0),
            "solicitudes_en_proceso": conteo_estado.get("EN_PROCESO", 0),
            "solicitudes_finalizadas": solicitudes_finalizadas,
            "solicitudes_canceladas": solicitudes_canceladas,
            "tecnicos_pendientes": tecnicos_pendientes,
            "tecnicos_activos": tecnicos_activos,
            "reportes_pendientes": reportes_pendientes,
        },
        "solicitudes_por_oficio": solicitudes_por_oficio,
        "solicitudes_por_comuna": solicitudes_por_comuna,
        "usuarios_por_mes": usuarios_por_mes,
        "solicitudes_por_estado": solicitudes_por_estado,
        "tecnicos_por_oficio": tecnicos_por_oficio,
        "clientes_por_comuna": clientes_por_comuna,
        "tecnicos_por_comuna": tecnicos_por_comuna,
        "problemas_frecuentes": problemas_frecuentes,
        "distribucion_etaria": distribucion_etaria,
        "edad_promedio_clientes": edad_promedio_clientes,
        "insights": {
            "oficio_mas_solicitado": oficio_mas_solicitado,
            "comuna_mayor_demanda": comuna_mayor_demanda,
            "comuna_menor_cobertura": comuna_menor_cobertura_nombre,
            "porcentaje_completadas": porcentaje_completadas,
            "promedio_solicitudes_mes": promedio_solicitudes_mes,
            "crecimiento_usuarios_pct": crecimiento_usuarios_pct,
            "tendencia": tendencia,
        },
    }
