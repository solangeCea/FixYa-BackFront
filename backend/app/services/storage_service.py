"""Almacenamiento de archivos con dos modos, elegidos por variables de entorno:

- **Producción (Cloudflare R2 / S3):** si están definidas las variables ``R2_*``,
  los archivos se suben a un bucket compatible con S3 y se devuelve su URL pública
  absoluta. Así persisten aunque el contenedor se reinicie o se redepliegue.
- **Desarrollo (disco local):** si NO hay configuración R2, se escribe en
  ``uploads/<subcarpeta>/`` y se devuelve una ruta relativa ``/uploads/...``
  (comportamiento histórico; el backend la sirve con StaticFiles).

De esta forma el mismo código funciona local y en la nube sin cambios.
"""

import os

R2_ENDPOINT = os.getenv("R2_ENDPOINT", "").strip()
R2_BUCKET = os.getenv("R2_BUCKET", "").strip()
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "").strip()
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "").strip()
# URL pública base del bucket (ej: https://pub-xxxx.r2.dev o un dominio propio).
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "").strip().rstrip("/")

_cliente = None


def usa_r2() -> bool:
    """True si hay configuración completa de R2/S3."""
    return all(
        [
            R2_ENDPOINT,
            R2_BUCKET,
            R2_ACCESS_KEY_ID,
            R2_SECRET_ACCESS_KEY,
            R2_PUBLIC_URL,
        ]
    )


def _s3():
    """Cliente S3 (perezoso). boto3 solo se importa/usa si hay R2 configurado."""
    global _cliente
    if _cliente is None:
        import boto3

        _cliente = boto3.client(
            "s3",
            endpoint_url=R2_ENDPOINT,
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
            region_name="auto",
        )
    return _cliente


def guardar_bytes(
    subcarpeta: str,
    nombre_archivo: str,
    data: bytes,
    content_type: str = "application/octet-stream",
) -> str:
    """Guarda ``data`` y devuelve la URL servible.

    - Con R2: sube el objeto ``<subcarpeta>/<nombre_archivo>`` y devuelve su URL absoluta.
    - Sin R2: escribe en ``uploads/<subcarpeta>/<nombre_archivo>`` y devuelve
      ``/uploads/<subcarpeta>/<nombre_archivo>``.
    """
    key = f"{subcarpeta}/{nombre_archivo}"

    if usa_r2():
        _s3().put_object(
            Bucket=R2_BUCKET,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        return f"{R2_PUBLIC_URL}/{key}"

    carpeta_destino = os.path.join("uploads", subcarpeta)
    os.makedirs(carpeta_destino, exist_ok=True)
    ruta_archivo = os.path.join(carpeta_destino, nombre_archivo)
    with open(ruta_archivo, "wb") as buffer:
        buffer.write(data)
    return f"/uploads/{key}"


def eliminar(url: str) -> None:
    """Borra un archivo por su URL (best-effort; nunca lanza)."""
    if not url:
        return

    # Objeto en R2: la URL empieza por la base pública del bucket.
    if usa_r2() and R2_PUBLIC_URL and url.startswith(R2_PUBLIC_URL):
        key = url[len(R2_PUBLIC_URL) + 1:]
        try:
            _s3().delete_object(Bucket=R2_BUCKET, Key=key)
        except Exception:
            pass
        return

    # Archivo local: /uploads/<sub>/<archivo>.
    ruta_relativa = (url or "").lstrip("/")
    if ruta_relativa.startswith("uploads/"):
        try:
            if os.path.isfile(ruta_relativa):
                os.remove(ruta_relativa)
        except OSError:
            pass
