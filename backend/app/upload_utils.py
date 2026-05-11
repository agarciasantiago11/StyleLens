"""
Validación de archivos subidos por endpoints multipart/form-data.

Protege frente a:
- Subidas vacías o demasiado grandes (DoS por espacio/transfer).
- Content-Type fuera del set esperado.
- Imágenes corruptas o "decompression bombs" (resolución artificialmente alta).
"""
from io import BytesIO

from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

# 10 MB cubre fotos de móvil HEIC/HEIF de calidad razonable.
MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024

# 16 MP — imágenes más grandes son sospechosas y consumen demasiada RAM en YOLO/PIL.
MAX_IMAGE_PIXELS = 4096 * 4096

_ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/heic",
    "image/heif",
    "application/octet-stream",  # algunos clientes nativos no marcan content-type
}


async def read_imagen_subida(imagen: UploadFile) -> bytes:
    """Lee y valida un archivo de imagen. Devuelve los bytes si todo OK,
    o lanza HTTPException con un código apropiado.

    No descomprime la imagen completa: PIL.Image.open lee solo el header,
    así que la validación de dimensiones es barata."""
    content_type = (imagen.content_type or "").lower()
    if content_type and content_type not in _ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Content-Type no soportado: {content_type}",
        )

    imagen_bytes = await imagen.read()

    if not imagen_bytes:
        raise HTTPException(status_code=422, detail="La imagen está vacía")

    if len(imagen_bytes) > MAX_UPLOAD_SIZE_BYTES:
        max_mb = MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"Imagen demasiado grande (máximo {max_mb:.0f} MB)",
        )

    try:
        with Image.open(BytesIO(imagen_bytes)) as img:
            w, h = img.size
            if w * h > MAX_IMAGE_PIXELS:
                raise HTTPException(
                    status_code=422,
                    detail=f"Resolución excesiva ({w}x{h}; máximo {MAX_IMAGE_PIXELS // 1_000_000} MP)",
                )
            # verify() detecta corrupción del stream sin descomprimir.
            img.verify()
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError) as e:
        raise HTTPException(status_code=422, detail=f"Imagen inválida o corrupta: {e}")

    return imagen_bytes
