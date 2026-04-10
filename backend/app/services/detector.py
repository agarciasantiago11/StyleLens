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

# Clases COCO que pueden contener ropa (YOLO11 está entrenado en COCO)
# 0=person es la más útil — detecta a la persona completa para recortar
CLASES_ROPA = {0: "person", 26: "handbag", 27: "tie", 28: "suitcase"}

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "models", "yolo11s.pt")
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

        # Embedding FashionCLIP
        inputs = clip_processor(images=recorte, return_tensors="pt")
        with torch.no_grad():
            outputs = clip_model.vision_model(pixel_values=inputs["pixel_values"])
            embedding = outputs.pooler_output
            embedding = embedding / embedding.norm(dim=-1, keepdim=True)  # normalizar
            embedding = embedding[0].tolist()

        detecciones.append({
            "bbox": [x1, y1, x2, y2],
            "clase": CLASES_ROPA[clase_id],
            "confianza": confianza,
            "embedding": embedding,
        })

    return detecciones
