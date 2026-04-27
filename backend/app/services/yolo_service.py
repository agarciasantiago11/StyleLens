import os
import io
from PIL import Image
from ultralytics import YOLO

DEFAULT_CUSTOM_MODEL_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../models/deepfashion2_yolov8s-seg.pt")
)
DEFAULT_FALLBACK_MODEL = "yolov8n.pt"


def _resolve_model_source() -> str:
    """
    Prioridad de carga del modelo:
    1) YOLO_MODEL_PATH (si existe)
    2) backend/models/deepfashion2_yolov8s-seg.pt (si existe)
    3) modelo fallback de Ultralytics (descarga automatica si aplica)
    """
    env_model_path = os.getenv("YOLO_MODEL_PATH")
    if env_model_path:
        env_model_path = os.path.abspath(env_model_path)
        if os.path.exists(env_model_path):
            return env_model_path

    if os.path.exists(DEFAULT_CUSTOM_MODEL_PATH):
        return DEFAULT_CUSTOM_MODEL_PATH

    return os.getenv("YOLO_FALLBACK_MODEL", DEFAULT_FALLBACK_MODEL)

_model = None
_model_source = None


def _get_model() -> YOLO:
    """Carga el modelo una sola vez (singleton)."""
    global _model, _model_source
    if _model is None:
        _model_source = _resolve_model_source()
        _model = YOLO(_model_source)
    return _model


def detectar_y_recortar(imagen_bytes: bytes) -> list[dict]:
    """
    Detecta prendas en la imagen y devuelve recortes individuales.

    Retorna lista de dicts con:
      - 'bytes': bytes del recorte (JPEG)
      - 'clase': nombre de la prenda detectada (ej. 'trousers')
      - 'confianza': float entre 0 y 1
    """
    model = _get_model()
    imagen = Image.open(io.BytesIO(imagen_bytes)).convert("RGB")

    results = model(imagen, verbose=False)

    recortes = []
    for result in results:
        if result.boxes is None:
            continue

        for i, box in enumerate(result.boxes):
            confianza = float(box.conf[0])
            if confianza < 0.3:
                continue

            clase_id = int(box.cls[0])
            clase_nombre = model.names[clase_id]

            # Extraer bounding box y recortar
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            # Añadir margen del 5% para no cortar bordes
            w, h = imagen.size
            margen_x = int((x2 - x1) * 0.05)
            margen_y = int((y2 - y1) * 0.05)
            x1 = max(0, x1 - margen_x)
            y1 = max(0, y1 - margen_y)
            x2 = min(w, x2 + margen_x)
            y2 = min(h, y2 + margen_y)

            recorte = imagen.crop((x1, y1, x2, y2))

            buffer = io.BytesIO()
            recorte.save(buffer, format="JPEG", quality=90)
            recorte_bytes = buffer.getvalue()

            recortes.append({
                "bytes": recorte_bytes,
                "clase": clase_nombre,
                "confianza": round(confianza, 3),
            })

    return recortes
