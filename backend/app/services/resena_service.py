from datetime import datetime
from decimal import Decimal
import json
import os

import httpx


PALABRAS_OFENSIVAS = [
    "idiota",
    "estupido",
    "estúpido",
    "imbecil",
    "imbécil",
    "mierda",
    "weon",
    "weón",
    "ctm"
]


def detectar_lenguaje_ofensivo(comentario: str) -> bool:
    if not comentario:
        return False

    comentario_lower = comentario.lower()

    return any(
        palabra in comentario_lower
        for palabra in PALABRAS_OFENSIVAS
    )


def preparar_estado_resena(comentario: str):
    ofensiva = detectar_lenguaje_ofensivo(comentario)

    if ofensiva:
        return {
            "resena_activa": "N",
            "resena_reportada": "S",
            "motivo_reporte": "Lenguaje ofensivo detectado automáticamente",
            "fecha_reporte": datetime.utcnow(),
            "reporte_resuelto": "N"
        }

    return {
        "resena_activa": "S",
        "resena_reportada": "N",
        "motivo_reporte": None,
        "fecha_reporte": None,
        "reporte_resuelto": None
    }


SENALES_REPUTACION = {
    "Puntualidad": ["puntual", "hora", "rapido", "rapida", "tiempo", "demora"],
    "Buen trato": ["amable", "trato", "respetuoso", "cordial", "educado"],
    "Calidad tecnica": ["solucion", "arreglo", "reparo", "profesional", "experto", "calidad"],
    "Claridad": ["explico", "claro", "detalle", "informo", "comunico"],
    "Limpieza": ["limpio", "ordenado", "cuidadoso", "limpieza"],
    "Precio justo": ["precio", "costo", "barato", "justo", "cobro"]
}

SENALES_MEJORA = {
    "Tiempo de respuesta": ["tarde", "demoro", "lento", "espera", "atraso"],
    "Comunicacion": ["no aviso", "no respondio", "confuso", "poca comunicacion"],
    "Terminacion": ["incompleto", "pendiente", "falto", "mal terminado"],
    "Precio": ["caro", "costo alto", "cobro extra"]
}

PALABRAS_POSITIVAS = [
    "bueno", "buena", "excelente", "recomendado", "recomiendo",
    "rapido", "rapida", "amable", "profesional", "puntual",
    "solucion", "perfecto", "conforme"
]

PALABRAS_NEGATIVAS = [
    "malo", "mala", "lento", "lenta", "tarde", "demoro",
    "caro", "problema", "incompleto", "confuso", "desordenado"
]


def _normalizar_calificacion(valor):
    if isinstance(valor, Decimal):
        return float(valor)

    return float(valor or 0)


def _contar_senales(comentarios: list[str], senales: dict[str, list[str]]):
    texto = " ".join(comentarios).lower()

    conteos = []
    for nombre, palabras in senales.items():
        total = sum(1 for palabra in palabras if palabra in texto)
        if total > 0:
            conteos.append((nombre, total))

    conteos.sort(key=lambda item: item[1], reverse=True)
    return [nombre for nombre, _ in conteos[:3]]


def _calcular_sentimiento(resenas):
    puntaje = 0

    for resena in resenas:
        comentario = (resena.comentario or "").lower()
        calificacion = _normalizar_calificacion(resena.calificacion)

        if calificacion >= 4:
            puntaje += 2
        elif calificacion <= 2:
            puntaje -= 2

        puntaje += sum(1 for palabra in PALABRAS_POSITIVAS if palabra in comentario)
        puntaje -= sum(1 for palabra in PALABRAS_NEGATIVAS if palabra in comentario)

    if puntaje >= 3:
        return "Positivo"
    if puntaje <= -2:
        return "Crítico"
    return "Mixto"


def generar_resumen_reputacion_local(resenas):
    total = len(resenas)

    if total == 0:
        return {
            "resumen": "Aún no hay suficientes reseñas para generar un resumen confiable.",
            "sentimiento_general": "Sin datos",
            "fortalezas": [],
            "aspectos_a_mejorar": [],
            "comentarios_analizados": 0,
            "promedio_calificacion": 0,
            "nivel_confianza": "Sin datos",
            "modo_analisis": "Sin datos"
        }

    comentarios = [resena.comentario or "" for resena in resenas]
    promedio = round(
        sum(_normalizar_calificacion(resena.calificacion) for resena in resenas) / total,
        1
    )
    fortalezas = _contar_senales(comentarios, SENALES_REPUTACION)
    mejoras = _contar_senales(comentarios, SENALES_MEJORA)
    sentimiento = _calcular_sentimiento(resenas)

    if fortalezas:
        texto_fortalezas = ", ".join(fortalezas[:2]).lower()
        resumen = f"Los clientes destacan principalmente {texto_fortalezas}."
    elif promedio >= 4:
        resumen = "Las reseñas muestran una experiencia general positiva con este técnico."
    elif promedio <= 2:
        resumen = "Las reseñas muestran señales que requieren revisión antes de contratar."
    else:
        resumen = "Las reseñas muestran una experiencia mixta con este técnico."

    if mejoras:
        resumen = f"{resumen} Aspectos a observar: {', '.join(mejoras[:2]).lower()}."

    return {
        "resumen": resumen,
        "sentimiento_general": sentimiento,
        "fortalezas": fortalezas,
        "aspectos_a_mejorar": mejoras,
        "comentarios_analizados": total,
        "promedio_calificacion": promedio,
        "nivel_confianza": "Alta" if total >= 5 else "Inicial",
        "modo_analisis": "Local"
    }


def _extraer_texto_respuesta_openai(data: dict):
    if data.get("output_text"):
        return data["output_text"]

    for item in data.get("output", []):
        for content in item.get("content", []):
            if content.get("type") in ["output_text", "text"] and content.get("text"):
                return content["text"]

    return None


def _normalizar_resumen_ia(data: dict, resumen_local: dict):
    return {
        "resumen": str(data.get("resumen") or resumen_local["resumen"])[:600],
        "sentimiento_general": str(
            data.get("sentimiento_general") or resumen_local["sentimiento_general"]
        ),
        "fortalezas": list(data.get("fortalezas") or resumen_local["fortalezas"])[:3],
        "aspectos_a_mejorar": list(
            data.get("aspectos_a_mejorar") or resumen_local["aspectos_a_mejorar"]
        )[:3],
        "comentarios_analizados": resumen_local["comentarios_analizados"],
        "promedio_calificacion": resumen_local["promedio_calificacion"],
        "nivel_confianza": str(
            data.get("nivel_confianza") or resumen_local["nivel_confianza"]
        ),
        "modo_analisis": "OpenAI"
    }


def generar_resumen_reputacion_openai(resenas, resumen_local: dict):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or len(resenas) == 0:
        return None

    model = os.getenv("OPENAI_REVIEW_MODEL", "gpt-5.4-mini")
    comentarios = [
        {
            "calificacion": _normalizar_calificacion(resena.calificacion),
            "comentario": resena.comentario
        }
        for resena in resenas
    ]

    prompt = {
        "rol": "Analiza reseñas reales de técnicos de servicios del hogar en Chile.",
        "objetivo": "Generar un resumen breve, justo y útil para clientes sin exponer datos personales ni lenguaje ofensivo.",
        "reglas": [
            "No inventes hechos que no aparezcan en las reseñas.",
            "No copies insultos ni lenguaje ofensivo.",
            "Resume patrones, no casos aislados.",
            "Devuelve solo JSON valido."
        ],
        "formato_json": {
            "resumen": "string maximo 2 frases",
            "sentimiento_general": "Positivo, Mixto, Crítico o Sin datos",
            "fortalezas": ["máximo 3 elementos"],
            "aspectos_a_mejorar": ["máximo 3 elementos"],
            "nivel_confianza": "Inicial, Media o Alta"
        },
        "reseñas": comentarios
    }

    try:
        response = httpx.post(
            "https://api.openai.com/v1/responses",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": model,
                "input": [
                    {
                        "role": "system",
                        "content": "Eres un analista de reputación para una plataforma de servicios del hogar."
                    },
                    {
                        "role": "user",
                        "content": json.dumps(prompt, ensure_ascii=False)
                    }
                ],
                "text": {
                    "format": {
                        "type": "json_object"
                    }
                }
            },
            timeout=20
        )
        response.raise_for_status()
        texto = _extraer_texto_respuesta_openai(response.json())
        if not texto:
            return None

        return _normalizar_resumen_ia(json.loads(texto), resumen_local)
    except Exception:
        return None


def generar_resumen_reputacion(resenas):
    resumen_local = generar_resumen_reputacion_local(resenas)
    resumen_ia = generar_resumen_reputacion_openai(resenas, resumen_local)

    return resumen_ia or resumen_local
