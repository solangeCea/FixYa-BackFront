import os
import re
import shutil
from datetime import datetime

from fastapi import UploadFile


def guardar_archivo(archivo: UploadFile, subcarpeta: str) -> tuple[str, str]:
    """Guarda un archivo subido en ``uploads/<subcarpeta>`` y retorna
    ``(nombre_archivo, archivo_url)``.

    Centraliza la lógica de subida (crear carpeta, nombrar con timestamp,
    copiar y construir la URL pública) para reutilizarla entre los distintos
    módulos que aceptan archivos (documentos técnicos, fotos de solicitudes),
    evitando duplicar código.
    """
    carpeta_destino = os.path.join("uploads", subcarpeta)
    os.makedirs(carpeta_destino, exist_ok=True)

    # Sanitiza el nombre recibido del cliente: solo el basename (evita "../" y
    # separadores de ruta) y caracteres seguros, para no escribir fuera de la carpeta.
    original = os.path.basename(archivo.filename or "archivo")
    original = re.sub(r"[^A-Za-z0-9._-]", "_", original).strip("._") or "archivo"

    fecha = datetime.now().strftime("%Y%m%d%H%M%S")
    nombre_archivo = f"{fecha}_{original}"
    ruta_archivo = os.path.join(carpeta_destino, nombre_archivo)

    with open(ruta_archivo, "wb") as buffer:
        shutil.copyfileobj(archivo.file, buffer)

    archivo_url = f"/uploads/{subcarpeta}/{nombre_archivo}"
    return nombre_archivo, archivo_url
