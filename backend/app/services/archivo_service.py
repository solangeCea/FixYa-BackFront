import os
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

    fecha = datetime.now().strftime("%Y%m%d%H%M%S")
    nombre_archivo = f"{fecha}_{archivo.filename}"
    ruta_archivo = os.path.join(carpeta_destino, nombre_archivo)

    with open(ruta_archivo, "wb") as buffer:
        shutil.copyfileobj(archivo.file, buffer)

    archivo_url = f"/uploads/{subcarpeta}/{nombre_archivo}"
    return nombre_archivo, archivo_url
