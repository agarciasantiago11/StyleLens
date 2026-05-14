import time
from pathlib import Path

IMAGEN_TEST = Path(__file__).parent / "assets" / "test_prenda.jpg"


def test_tiempo_yolo():
    from app.services.yolo_service import detectar_y_recortar
    imagen = IMAGEN_TEST.read_bytes()
    t0 = time.perf_counter()
    resultado = detectar_y_recortar(imagen)
    t1 = time.perf_counter()
    elapsed = (t1 - t0) * 1000
    print(f"\nYOLO: {elapsed:.0f} ms — {len(resultado)} prendas detectadas")
    assert elapsed < 10_000, f"YOLO tardó demasiado: {elapsed:.0f} ms"


def test_tiempo_fashionclip():
    from app.services.fashionclip_service import generar_embedding
    imagen = IMAGEN_TEST.read_bytes()
    t0 = time.perf_counter()
    embedding = generar_embedding(imagen)
    t1 = time.perf_counter()
    elapsed = (t1 - t0) * 1000
    print(f"\nFashionCLIP: {elapsed:.0f} ms — embedding dim={len(embedding)}")
    assert embedding is not None
    assert len(embedding) == 512


def test_tiempo_pipeline_completo():
    from app.services.yolo_service import detectar_y_recortar
    from app.services.fashionclip_service import generar_embedding
    imagen = IMAGEN_TEST.read_bytes()
    t0 = time.perf_counter()
    recortes = detectar_y_recortar(imagen)
    embeddings = [generar_embedding(r["bytes"]) for r in recortes]
    t1 = time.perf_counter()
    elapsed = (t1 - t0) * 1000
    print(f"\nPipeline completo: {elapsed:.0f} ms — {len(recortes)} recortes, {sum(e is not None for e in embeddings)} embeddings OK")
    assert elapsed < 30_000, f"Pipeline tardó demasiado: {elapsed:.0f} ms"
