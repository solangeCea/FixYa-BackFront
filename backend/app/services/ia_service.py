"""Motor de IA para moderación y clasificación de reseñas.

Estrategia: si hay GEMINI_API_KEY se usa Google Gemini (LLM real) para, en una
sola llamada, moderar + clasificar + resumir la reseña. Si no hay clave o la
llamada falla, se cae a un análisis local mejorado (heurístico) para que la
plataforma siga funcionando siempre, incluso sin internet.

La función pública `analizar_resena` devuelve siempre la misma estructura:
{
    "es_ofensiva": bool,
    "motivo": str | None,
    "categorias": list[str],      # subconjunto de CATEGORIAS_VALIDAS
    "sentimiento": "Positivo" | "Neutral" | "Negativo",
    "resumen": str,               # etiqueta corta estilo Uber
    "modo": "IA (Gemini)" | "Local"
}
"""

from __future__ import annotations

import json
import os
import re
import unicodedata

import httpx


# Categorías fijas (estilo Uber) que la IA puede asignar a una reseña.
CATEGORIAS_VALIDAS = [
    "Puntualidad",
    "Calidad del trabajo",
    "Comunicación",
    "Precio",
    "Profesionalismo",
    "Limpieza",
]

SENTIMIENTOS_VALIDOS = ["Positivo", "Neutral", "Negativo"]


# ---------------------------------------------------------------------------
# Utilidades de normalización (para el modo local y para robustez)
# ---------------------------------------------------------------------------

_LEET = str.maketrans({
    "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s",
})


def _normalizar_texto(texto: str) -> str:
    """minúsculas, sin tildes, sin leetspeak y sin repeticiones (idiotaaaa -> idiota)."""
    t = (texto or "").lower()
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode("ascii")
    t = t.translate(_LEET)
    t = re.sub(r"(.)\1{2,}", r"\1", t)
    return t


# ---------------------------------------------------------------------------
# Modo local (fallback sin internet / sin clave)
# ---------------------------------------------------------------------------

# Insultos / groserías reales (ya normalizados: sin tildes/leet). No incluye
# críticas legítimas como "pesimo" o "lento": eso es negativo, no ofensivo.
PALABRAS_OFENSIVAS = {
    "idiota", "estupido", "imbecil", "imbeciles", "tarado", "tonto", "inutil",
    "mierda", "weon", "weona", "wea", "ctm", "conchetumare", "conchesumadre",
    "maricon", "puta", "puto", "sapo", "basura", "asqueroso", "estafador",
    "ladron", "chanta", "hijo de puta", "andate a la mierda", "cagada",
}

SENALES_CATEGORIAS = {
    "Puntualidad": ["puntual", "hora", "rapido", "rapida", "atraso", "atrasado",
                    "demoro", "demora", "tarde", "tiempo", "llego"],
    "Calidad del trabajo": ["solucion", "soluciono", "arreglo", "reparo", "calidad",
                             "bien hecho", "mal hecho", "quedo", "funciona", "termino"],
    "Comunicación": ["explico", "claro", "comunico", "informo", "aviso", "respondio",
                      "amable", "trato", "atento", "grosero"],
    "Precio": ["precio", "costo", "barato", "caro", "cobro", "justo", "presupuesto",
               "valor", "cobra"],
    "Profesionalismo": ["profesional", "responsable", "serio", "cumplio", "experto",
                        "confianza", "recomendado", "recomiendo", "irresponsable"],
    "Limpieza": ["limpio", "ordenado", "limpieza", "desordenado", "sucio", "cuidadoso"],
}

PALABRAS_POSITIVAS = {
    "bueno", "buena", "excelente", "recomendado", "recomiendo", "rapido", "rapida",
    "amable", "profesional", "puntual", "soluciono", "perfecto", "conforme",
    "increible", "genial", "responsable", "atento",
}

PALABRAS_NEGATIVAS = {
    "malo", "mala", "pesimo", "lento", "lenta", "tarde", "demoro", "caro",
    "problema", "incompleto", "confuso", "desordenado", "irresponsable",
    "estafa", "estafo", "nunca", "pesima",
}


def detectar_lenguaje_ofensivo(comentario: str) -> bool:
    """Detección local mejorada: normaliza tildes/leet antes de comparar."""
    if not comentario:
        return False

    texto = _normalizar_texto(comentario)
    return any(palabra in texto for palabra in PALABRAS_OFENSIVAS)


def _detectar_categorias_local(texto_norm: str) -> list[str]:
    conteos = []
    for categoria, palabras in SENALES_CATEGORIAS.items():
        total = sum(1 for palabra in palabras if palabra in texto_norm)
        if total > 0:
            conteos.append((categoria, total))

    conteos.sort(key=lambda item: item[1], reverse=True)
    return [categoria for categoria, _ in conteos[:3]]


def _detectar_sentimiento_local(texto_norm: str, calificacion) -> str:
    puntaje = 0

    try:
        estrellas = float(calificacion) if calificacion is not None else None
    except (TypeError, ValueError):
        estrellas = None

    if estrellas is not None:
        if estrellas >= 4:
            puntaje += 2
        elif estrellas <= 2:
            puntaje -= 2

    puntaje += sum(1 for palabra in PALABRAS_POSITIVAS if palabra in texto_norm)
    puntaje -= sum(1 for palabra in PALABRAS_NEGATIVAS if palabra in texto_norm)

    if puntaje >= 1:
        return "Positivo"
    if puntaje <= -1:
        return "Negativo"
    return "Neutral"


def _analizar_local(comentario: str, calificacion) -> dict:
    texto_norm = _normalizar_texto(comentario)
    ofensiva = any(palabra in texto_norm for palabra in PALABRAS_OFENSIVAS)
    categorias = _detectar_categorias_local(texto_norm)
    sentimiento = _detectar_sentimiento_local(texto_norm, calificacion)

    if ofensiva:
        resumen = "Contenido inapropiado detectado"
    elif categorias:
        resumen = f"Destaca: {categorias[0].lower()}"
    elif sentimiento == "Positivo":
        resumen = "Experiencia positiva"
    elif sentimiento == "Negativo":
        resumen = "Experiencia negativa"
    else:
        resumen = "Reseña sin señales claras"

    return {
        "es_ofensiva": ofensiva,
        "motivo": "Lenguaje ofensivo detectado automáticamente" if ofensiva else None,
        "categorias": categorias,
        "sentimiento": sentimiento,
        "resumen": resumen,
        "modo": "Local",
    }


# ---------------------------------------------------------------------------
# Modo IA (Google Gemini)
# ---------------------------------------------------------------------------

def _normalizar_resultado(data: dict, modo: str) -> dict:
    categorias = [
        c for c in (data.get("categorias") or [])
        if c in CATEGORIAS_VALIDAS
    ][:3]

    sentimiento = data.get("sentimiento")
    if sentimiento not in SENTIMIENTOS_VALIDOS:
        sentimiento = "Neutral"

    es_ofensiva = bool(data.get("es_ofensiva"))
    motivo = data.get("motivo")
    if es_ofensiva and not motivo:
        motivo = "Contenido inapropiado detectado por IA"
    if not es_ofensiva:
        motivo = None

    resumen = str(data.get("resumen") or "").strip()[:250] or "Reseña analizada"

    return {
        "es_ofensiva": es_ofensiva,
        "motivo": motivo,
        "categorias": categorias,
        "sentimiento": sentimiento,
        "resumen": resumen,
        "modo": modo,
    }


def _analizar_con_gemini(comentario: str, calificacion):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not (comentario or "").strip():
        return None

    model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    system = (
        "Eres un moderador y analista de reseñas para FixYa, una plataforma chilena "
        "de servicios del hogar. Analizas la reseña que un cliente deja sobre un técnico. "
        "Respondes solo con JSON válido."
    )

    instruccion = {
        "tarea": "Modera y clasifica la reseña del cliente.",
        "categorias_posibles": CATEGORIAS_VALIDAS,
        "reglas": [
            "es_ofensiva=true SOLO si hay insultos, groserías, discriminación, "
            "amenazas o acusaciones graves difamatorias hacia el técnico.",
            "Una crítica negativa pero respetuosa NO es ofensiva.",
            "categorias: elige únicamente de categorias_posibles las que realmente "
            "aparezcan en el texto (entre 0 y 3).",
            "sentimiento: exactamente 'Positivo', 'Neutral' o 'Negativo'.",
            "resumen: una etiqueta muy corta (máximo 8 palabras) del punto principal.",
            "motivo: si es_ofensiva=true, explica brevemente por qué; si no, deja vacío.",
            "No inventes información que no esté en la reseña.",
        ],
        "calificacion_estrellas": calificacion,
        "resena": comentario,
    }

    schema = {
        "type": "object",
        "properties": {
            "es_ofensiva": {"type": "boolean"},
            "motivo": {"type": "string"},
            "categorias": {
                "type": "array",
                "items": {"type": "string", "enum": CATEGORIAS_VALIDAS},
            },
            "sentimiento": {"type": "string", "enum": SENTIMIENTOS_VALIDOS},
            "resumen": {"type": "string"},
        },
        "required": ["es_ofensiva", "categorias", "sentimiento", "resumen"],
    }

    try:
        response = httpx.post(
            url,
            params={"key": api_key},
            json={
                "systemInstruction": {"parts": [{"text": system}]},
                "contents": [
                    {"parts": [{"text": json.dumps(instruccion, ensure_ascii=False)}]}
                ],
                "generationConfig": {
                    "temperature": 0.2,
                    "responseMimeType": "application/json",
                    "responseSchema": schema,
                },
            },
            timeout=20,
        )
        response.raise_for_status()
        data = response.json()
        texto = data["candidates"][0]["content"]["parts"][0]["text"]
        return _normalizar_resultado(json.loads(texto), "IA (Gemini)")
    except Exception:
        return None


# ---------------------------------------------------------------------------
# API pública
# ---------------------------------------------------------------------------

def analizar_resena(comentario: str, calificacion=None) -> dict:
    """Analiza una reseña: intenta Gemini y cae a análisis local si no hay clave."""
    resultado = _analizar_con_gemini(comentario, calificacion)
    if resultado is not None:
        return resultado
    return _analizar_local(comentario, calificacion)
