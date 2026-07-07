import os
import re
from datetime import datetime

from fastapi import UploadFile

from app.services import storage_service


def guardar_archivo(archivo: UploadFile, subcarpeta: str) -> tuple[str, str]:
    """Guarda un archivo subido y retorna ``(nombre_archivo, archivo_url)``.

    Delega el almacenamiento en ``storage_service``: en producción va a R2/S3
    (URL absoluta) y en desarrollo a ``uploads/<subcarpeta>`` (ruta ``/uploads/...``).
    Centraliza el nombrado seguro con timestamp para reutilizarlo entre módulos
    (documentos técnicos, fotos de solicitudes).
    """
    # Sanitiza el nombre recibido del cliente: solo el basename (evita "../" y
    # separadores de ruta) y caracteres seguros, para no escribir fuera de la carpeta.
    original = os.path.basename(archivo.filename or "archivo")
    original = re.sub(r"[^A-Za-z0-9._-]", "_", original).strip("._") or "archivo"

    fecha = datetime.now().strftime("%Y%m%d%H%M%S")
    nombre_archivo = f"{fecha}_{original}"

    data = archivo.file.read()
    content_type = archivo.content_type or "application/octet-stream"

    archivo_url = storage_service.guardar_bytes(
        subcarpeta, nombre_archivo, data, content_type
    )
    return nombre_archivo, archivo_url
