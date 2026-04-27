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


def _clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(max_value, value))


def _get_model() -> YOLO:
    """Carga el modelo una sola vez (singleton)."""
    global _model, _model_source
    if _model is None:
        _model_source = _resolve_model_source()
        _model = YOLO(_model_source)
    return _model


def _iter_detections(imagen: Image.Image) -> list[dict]:
    model = _get_model()
    results = model(imagen, verbose=False)

    detecciones = []
    for result in results:
        if result.boxes is None:
            continue

        for box in result.boxes:
            confianza = float(box.conf[0])
            if confianza < 0.3:
                continue

            clase_id = int(box.cls[0])
            clase_nombre = model.names[clase_id]
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())

            detecciones.append({
                "clase": clase_nombre,
                "confianza": round(confianza, 3),
                "x1": x1,
                "y1": y1,
                "x2": x2,
                "y2": y2,
            })

    return detecciones


def _expand_bbox(x1: int, y1: int, x2: int, y2: int, img_w: int, img_h: int, margin_ratio: float = 0.05) -> tuple[int, int, int, int]:
    margen_x = int((x2 - x1) * margin_ratio)
    margen_y = int((y2 - y1) * margin_ratio)
    nx1 = max(0, x1 - margen_x)
    ny1 = max(0, y1 - margen_y)
    nx2 = min(img_w, x2 + margen_x)
    ny2 = min(img_h, y2 + margen_y)
    return nx1, ny1, nx2, ny2


def detectar_cajas(imagen_bytes: bytes) -> list[dict]:
    """Detecta prendas y devuelve bbox normalizadas para overlay en cliente."""
    imagen = Image.open(io.BytesIO(imagen_bytes)).convert("RGB")
    img_w, img_h = imagen.size

    detecciones = _iter_detections(imagen)

    cajas = []
    for idx, det in enumerate(detecciones):
        x1, y1, x2, y2 = _expand_bbox(det["x1"], det["y1"], det["x2"], det["y2"], img_w, img_h)
        bw = max(1, x2 - x1)
        bh = max(1, y2 - y1)

        cajas.append({
            "id": idx,
            "clase": det["clase"],
            "confianza": det["confianza"],
            "bbox": {
                "x": round(x1 / img_w, 6),
                "y": round(y1 / img_h, 6),
                "w": round(bw / img_w, 6),
                "h": round(bh / img_h, 6),
            },
        })

    return cajas


def recortar_por_bbox_normalizada(imagen_bytes: bytes, x: float, y: float, w: float, h: float) -> bytes:
    """Recorta una prenda concreta usando bbox normalizada (0-1)."""
    imagen = Image.open(io.BytesIO(imagen_bytes)).convert("RGB")
    img_w, img_h = imagen.size

    x = _clamp(x, 0.0, 1.0)
    y = _clamp(y, 0.0, 1.0)
    w = _clamp(w, 0.0, 1.0 - x)
    h = _clamp(h, 0.0, 1.0 - y)

    x1 = int(x * img_w)
    y1 = int(y * img_h)
    x2 = int((x + w) * img_w)
    y2 = int((y + h) * img_h)

    x1, y1, x2, y2 = _expand_bbox(x1, y1, x2, y2, img_w, img_h)

    if x2 <= x1 or y2 <= y1:
        raise ValueError("La bbox seleccionada no es valida")

    recorte = imagen.crop((x1, y1, x2, y2))
    buffer = io.BytesIO()
    recorte.save(buffer, format="JPEG", quality=90)
    return buffer.getvalue()


def detectar_y_recortar(imagen_bytes: bytes) -> list[dict]:
    """
    Detecta prendas en la imagen y devuelve recortes individuales.

    Retorna lista de dicts con:
      - 'bytes': bytes del recorte (JPEG)
      - 'clase': nombre de la prenda detectada (ej. 'trousers')
      - 'confianza': float entre 0 y 1
    """
    imagen = Image.open(io.BytesIO(imagen_bytes)).convert("RGB")
    img_w, img_h = imagen.size

    detecciones = _iter_detections(imagen)

    recortes = []
    for det in detecciones:
        x1, y1, x2, y2 = _expand_bbox(det["x1"], det["y1"], det["x2"], det["y2"], img_w, img_h)
        recorte = imagen.crop((x1, y1, x2, y2))

        buffer = io.BytesIO()
        recorte.save(buffer, format="JPEG", quality=90)
        recorte_bytes = buffer.getvalue()

        recortes.append({
            "bytes": recorte_bytes,
            "clase": det["clase"],
            "confianza": det["confianza"],
        })

    return recortes
