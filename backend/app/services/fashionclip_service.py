import gc
import io
import logging
import os
from typing import Optional

from PIL import Image

logger = logging.getLogger(__name__)

MODEL_NAME = "patrickjohncyh/fashion-clip"

# Poner FASHIONCLIP_ENABLED=false en Railway para saltarse el modelo y evitar OOM.
_ENABLED = os.getenv("FASHIONCLIP_ENABLED", "true").lower() not in {"0", "false", "no"}

_model = None
_processor = None


def _get_model():
    global _model, _processor
    if _model is None:
        from transformers import CLIPProcessor, CLIPModel
        logger.info("Cargando FashionCLIP (%s)…", MODEL_NAME)
        _processor = CLIPProcessor.from_pretrained(MODEL_NAME)
        _model = CLIPModel.from_pretrained(MODEL_NAME)
        _model.eval()
        logger.info("FashionCLIP listo.")
    return _model, _processor


def unload_model() -> None:
    """Libera FashionCLIP de memoria tras cada inferencia."""
    global _model, _processor
    if _model is not None:
        del _model
        del _processor
        _model = None
        _processor = None
        gc.collect()


def generar_embedding(imagen_bytes: bytes) -> Optional[list[float]]:
    """
    Genera embedding normalizado de 512 dimensiones para una imagen de prenda.
    Retorna None si el modelo está desactivado o falla (degradación suave).
    """
    if not _ENABLED:
        return None
    try:
        import torch
        model, processor = _get_model()
        imagen = Image.open(io.BytesIO(imagen_bytes)).convert("RGB")
        inputs = processor(images=imagen, return_tensors="pt")
        with torch.no_grad():
            vision_out = model.vision_model(pixel_values=inputs["pixel_values"])
            pooled = vision_out.pooler_output
            features = model.visual_projection(pooled)
            features = features / features.norm(dim=-1, keepdim=True)
        return features[0].cpu().tolist()
    except Exception as exc:
        logger.warning("FashionCLIP embedding fallido: %s", exc)
        return None
