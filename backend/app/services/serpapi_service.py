import os
from serpapi import GoogleSearch
from dotenv import load_dotenv

load_dotenv()


def buscar_por_imagen(imagen_url: str) -> list[dict]:
    """
    Llama a SerpAPI con Google Lens y devuelve los primeros resultados visuales.

    Cada resultado incluye: nombre, tienda, precio, imagen_url, link.
    Devuelve lista vacía si no hay resultados o falla la llamada.
    """
    params = {
        "engine": "google_lens",
        "url": imagen_url,
        "api_key": os.getenv("SERPAPI_KEY"),
    }

    search = GoogleSearch(params)
    datos = search.get_dict()

    visual_matches = datos.get("visual_matches", [])

    resultados = []
    for match in visual_matches[:5]:  # máximo 5 resultados
        precio = _extraer_precio(match.get("price"))
        resultados.append({
            "nombre": match.get("title") or "Sin nombre",
            "tienda": match.get("source") or "",
            "precio": precio,
            "imagen_url": match.get("thumbnail") or "",
            "link": match.get("link") or "",
        })

    return resultados


def _extraer_precio(price_info) -> float | None:
    """Extrae el valor numérico del campo price de SerpAPI."""
    if isinstance(price_info, dict):
        valor = price_info.get("extracted_value") or price_info.get("value")
        try:
            return float(valor) if valor is not None else None
        except (ValueError, TypeError):
            return None
    return None
