"""
Servicio de detección de prendas usando YOLO11 + FashionCLIP.

Flujo:
  1. YOLO11 detecta objetos → filtramos clases relevantes (persona + ropa)
  2. Recortamos cada bounding box de la imagen original
  3. FashionCLIP genera un embedding de 512 dims por cada recorte
"""
from ultralytics import YOLO
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import torch
import io
import os

# Clases DeepFashion2 — detecta prendas individuales
CLASES_ROPA = {
    0: "short sleeve top", 1: "long sleeve top",
    2: "short sleeve outwear", 3: "long sleeve outwear",
    4: "vest", 5: "sling", 6: "shorts",
    7: "trousers", 8: "skirt", 9: "short sleeve dress",
    10: "long sleeve dress", 11: "vest dress", 12: "sling dress"
}

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "models", "deepfashion2_yolov8s-seg.pt")
FASHIONCLIP_MODEL = "patrickjohncyh/fashion-clip"

# Carga en arranque (singleton)
_yolo = None
_clip_model = None
_clip_processor = None


def _get_yolo():
    global _yolo
    if _yolo is None:
        _yolo = YOLO(MODEL_PATH)
    return _yolo


def _get_clip():
    global _clip_model, _clip_processor
    if _clip_model is None:
        _clip_processor = CLIPProcessor.from_pretrained(FASHIONCLIP_MODEL)
        _clip_model = CLIPModel.from_pretrained(FASHIONCLIP_MODEL)
        _clip_model.eval()
    return _clip_model, _clip_processor


def detectar_y_embeddings(imagen_bytes: bytes) -> list[dict]:
    """
    Recibe los bytes de una imagen y devuelve una lista de prendas detectadas,
    cada una con su bounding box y embedding FashionCLIP.

    Returns:
        [
            {
                "bbox": [x1, y1, x2, y2],
                "clase": "person",
                "confianza": 0.87,
                "embedding": [0.12, -0.34, ...]  # 512 dims
            },
            ...
        ]
    """
    imagen = Image.open(io.BytesIO(imagen_bytes)).convert("RGB")
    yolo = _get_yolo()
    clip_model, clip_processor = _get_clip()

    # Detección YOLO11
    resultados = yolo(imagen, verbose=False)[0]

    detecciones = []
    for box in resultados.boxes:
        clase_id = int(box.cls[0])
        if clase_id not in CLASES_ROPA:
            continue

        confianza = float(box.conf[0])
        if confianza < 0.4:
            continue

        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
        recorte = imagen.crop((x1, y1, x2, y2))

        # Embedding FashionCLIP (512 dims via visual_projection)
        inputs = clip_processor(images=recorte, return_tensors="pt")
        with torch.no_grad():
            vision_out = clip_model.vision_model(pixel_values=inputs["pixel_values"])
            pooled = vision_out.pooler_output          # (1, 768)
            embedding = clip_model.visual_projection(pooled)  # (1, 512)
            embedding = embedding / embedding.norm(dim=-1, keepdim=True)
            embedding = embedding[0].tolist()

        detecciones.append({
            "bbox": [x1, y1, x2, y2],
            "clase": CLASES_ROPA[clase_id],
            "confianza": confianza,
            "embedding": embedding,
        })

    return detecciones
