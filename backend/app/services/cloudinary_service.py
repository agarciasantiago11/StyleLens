import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(cloudinary_url=os.getenv("CLOUDINARY_URL"))


def subir_imagen(imagen_bytes: bytes, nombre: str = None) -> str:
    """Sube imagen a Cloudinary y devuelve URL pública segura (HTTPS)."""
    result = cloudinary.uploader.upload(
        imagen_bytes,
        folder="stylelens",
        public_id=nombre,
        overwrite=True,
        resource_type="image",
    )
    return result["secure_url"]


def eliminar_imagen(public_id: str) -> None:
    """Elimina una imagen de Cloudinary por su public_id."""
    cloudinary.uploader.destroy(public_id)
