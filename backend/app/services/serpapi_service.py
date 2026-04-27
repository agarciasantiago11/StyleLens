import os
from urllib.parse import urlparse
from serpapi import GoogleSearch
from dotenv import load_dotenv

load_dotenv()

MAX_RESULTS = 5

# Sitios que suelen devolver ruido para compra de prendas.
BLOCKED_DOMAINS = {
    "instagram.com",
    "facebook.com",
    "tiktok.com",
    "twitter.com",
    "x.com",
    "youtube.com",
    "pinterest.com",
    "reddit.com",
    "tumblr.com",
    "linkedin.com",
    "aliexpress.com",
    "ebay.com",
    "wikipedia.org",
}

# Señales comunes de tienda online en url/title/source.
SHOP_HINTS = {
    "shop",
    "store",
    "tienda",
    "outlet",
    "fashion",
    "clothing",
    "ropa",
    "product",
    "producto",
    "catalog",
    "catalogo",
    "zalando",
    "asos",
    "hm",
    "zara",
    "bershka",
    "stradivarius",
    "pullandbear",
    "mango",
    "uniqlo",
    "nike",
    "adidas",
}


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

    visual_matches = datos.get("visual_matches", []) or []

    # 1) Primero: filtrar basura (redes sociales / dominios bloqueados)
    # 2) Luego: priorizar candidatos con señales de ecommerce
    candidates = [match for match in visual_matches if _is_match_allowed(match)]
    ranked_candidates = sorted(candidates, key=_rank_match, reverse=True)

    # Si el filtro es demasiado estricto y no hay nada, degradar al listado original
    source_matches = ranked_candidates if ranked_candidates else visual_matches

    resultados = []
    for match in source_matches[:MAX_RESULTS]:
        precio = _extraer_precio(match.get("price"))
        resultados.append({
            "nombre": match.get("title") or "Sin nombre",
            "tienda": match.get("source") or "",
            "precio": precio,
            "imagen_url": match.get("thumbnail") or "",
            "link": match.get("link") or "",
        })

    return resultados


def _extract_domain(link: str | None) -> str:
    if not link:
        return ""

    try:
        host = (urlparse(link).hostname or "").lower()
    except Exception:
        return ""

    if host.startswith("www."):
        host = host[4:]
    return host


def _domain_is_blocked(domain: str) -> bool:
    if not domain:
        return False

    return any(domain == blocked or domain.endswith(f".{blocked}") for blocked in BLOCKED_DOMAINS)


def _get_match_text(match: dict) -> str:
    title = str(match.get("title") or "")
    source = str(match.get("source") or "")
    link = str(match.get("link") or "")
    return f"{title} {source} {link}".lower()


def _has_shop_signal(match: dict) -> bool:
    text = _get_match_text(match)
    return any(hint in text for hint in SHOP_HINTS)


def _is_match_allowed(match: dict) -> bool:
    domain = _extract_domain(match.get("link"))
    if _domain_is_blocked(domain):
        return False

    # Descartar resultados sin enlace navegable
    if not match.get("link"):
        return False

    return True


def _rank_match(match: dict) -> int:
    score = 0

    # Preferir resultados con precio (más probable ecommerce real)
    if _extraer_precio(match.get("price")) is not None:
        score += 3

    # Priorizar señales de tienda en texto/URL
    if _has_shop_signal(match):
        score += 2

    # Bonus por enlace con ruta de producto
    link = str(match.get("link") or "").lower()
    if "/product" in link or "/products" in link or "/p/" in link:
        score += 1

    return score


def _extraer_precio(price_info) -> float | None:
    """Extrae el valor numérico del campo price de SerpAPI."""
    if isinstance(price_info, dict):
        valor = price_info.get("extracted_value") or price_info.get("value")
        try:
            return float(valor) if valor is not None else None
        except (ValueError, TypeError):
            return None
    return None
