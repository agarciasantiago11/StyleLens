import logging
import os
import re
from urllib.parse import urlparse

from dotenv import load_dotenv
from serpapi import GoogleSearch

load_dotenv()

logger = logging.getLogger(__name__)

MAX_RESULTS = 5
CANDIDATE_POOL = 10

COUNTRY = "es"
LANGUAGE = "es"

SOFT_PRICE_CEILING_EUR = 80.0

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

# Fast-fashion / consumo masivo → priorizamos fuerte (+60)
FAST_FASHION_DOMAINS = {
    # Inditex
    "zara.com", "pullandbear.com", "bershka.com", "stradivarius.com",
    "massimodutti.com", "oysho.com", "lefties.com",
    # Fast-fashion internacional
    "hm.com", "www2.hm.com", "shein.com", "primark.com", "mango.com",
    "shop.mango.com", "asos.com", "uniqlo.com", "newyorker.com",
    "boohoo.com", "prettylittlething.com", "missguided.com",
    "kiabi.es", "c-and-a.com",
}

# Mid-market accesible (+25)
MID_FASHION_DOMAINS = {
    "zalando.es", "zalando.com", "elcorteingles.es", "decathlon.es",
    "carrefour.es", "lidl.es", "amazon.es", "amazon.com",
    "springfield.com", "cortefiel.com",
}

# Lujo → penalización fuerte (-80). No se bloquean para mantener fallback.
LUXURY_DOMAINS = {
    "gucci.com", "prada.com", "louisvuitton.com", "hermes.com", "chanel.com",
    "dior.com", "balenciaga.com", "burberry.com", "fendi.com", "valentino.com",
    "bottegaveneta.com", "saintlaurent.com", "celine.com", "loewe.com",
    "loropiana.com", "ysl.com", "givenchy.com", "tomford.com",
    "moncler.com", "stoneisland.com", "off---white.com", "moschino.com",
    "armani.com", "versace.com", "dolcegabbana.com",
    "farfetch.com", "mytheresa.com", "matchesfashion.com", "ssense.com",
    "net-a-porter.com", "luisaviaroma.com",
}

_PRICE_REGEX = re.compile(r"(\d+[\.,]?\d*)")


def buscar_por_imagen(imagen_url: str) -> list[dict]:
    """
    Llama a SerpAPI con Google Lens y devuelve los primeros resultados visuales,
    rankeados para favorecer fast-fashion y opciones asequibles.

    Cada resultado incluye: nombre, tienda, precio, imagen_url, link.
    Devuelve lista vacía si no hay resultados o falla la llamada.
    """
    params = {
        "engine": "google_lens",
        "url": imagen_url,
        "country": COUNTRY,
        "hl": LANGUAGE,
        "api_key": os.getenv("SERPAPI_KEY"),
    }

    try:
        datos = GoogleSearch(params).get_dict()
    except Exception as exc:
        logger.warning("SerpAPI Google Lens fallo: %s", exc)
        return []

    visual_matches = (datos.get("visual_matches") or [])[:CANDIDATE_POOL]

    # 1) Filtrar dominios bloqueados / sin link
    # 2) Rankear por dominio (fast-fashion vs lujo) y por precio
    candidates = [match for match in visual_matches if _is_match_allowed(match)]
    ranked_candidates = sorted(candidates, key=_rank_match, reverse=True)

    # Si el filtro es demasiado estricto, degradar al listado original
    source_matches = ranked_candidates if ranked_candidates else visual_matches

    resultados = []
    for match in source_matches[:MAX_RESULTS]:
        precio = _extraer_precio(match.get("price"))
        if precio is None:
            precio = _buscar_precio_en_shopping(
                titulo=match.get("title") or "",
                dominio_esperado=_extract_domain(match.get("link")),
            )
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


def _matches_domain_set(domain: str, dominios: set[str]) -> bool:
    if not domain:
        return False
    return any(domain == d or domain.endswith(f".{d}") for d in dominios)


def _is_match_allowed(match: dict) -> bool:
    if not match.get("link"):
        return False
    if _matches_domain_set(_extract_domain(match.get("link")), BLOCKED_DOMAINS):
        return False
    return True


def _rank_match(match: dict) -> int:
    score = 0
    domain = _extract_domain(match.get("link"))

    # Tier de dominio
    if _matches_domain_set(domain, FAST_FASHION_DOMAINS):
        score += 60
    elif _matches_domain_set(domain, MID_FASHION_DOMAINS):
        score += 25
    elif _matches_domain_set(domain, LUXURY_DOMAINS):
        score -= 80

    # Score por precio
    precio = _extraer_precio(match.get("price"))
    if precio is not None:
        score += 5  # tener precio extraído es señal de ecommerce real
        if precio <= 20:
            score += 20
        elif precio <= 50:
            score += 12
        elif precio <= SOFT_PRICE_CEILING_EUR:
            score += 4
        else:
            score -= int(min(40, (precio - SOFT_PRICE_CEILING_EUR) / 5))

    # Bonus por patrón de URL de producto
    link = str(match.get("link") or "").lower()
    if "/product" in link or "/products" in link or "/p/" in link or "/dp/" in link:
        score += 3

    return score


def _buscar_precio_en_shopping(titulo: str, dominio_esperado: str = "") -> float | None:
    """
    Llamada secundaria a SerpAPI con engine=google_shopping para enriquecer el
    precio de un visual match que no lo trajo. Prioriza resultados del mismo
    dominio que el match original; si no hay, acepta el primer precio numérico.

    Coste: hasta MAX_RESULTS llamadas extra por búsqueda en el peor caso.
    """
    if not titulo or not titulo.strip():
        return None

    params = {
        "engine": "google_shopping",
        "q": titulo.strip(),
        "gl": COUNTRY,
        "hl": LANGUAGE,
        "api_key": os.getenv("SERPAPI_KEY"),
    }

    try:
        datos = GoogleSearch(params).get_dict()
    except Exception as exc:
        logger.warning("SerpAPI google_shopping fallo para '%s': %s", titulo, exc)
        return None

    shopping_results = datos.get("shopping_results") or []
    if not shopping_results:
        return None

    # 1) Preferir coincidencia exacta del dominio del visual match
    if dominio_esperado:
        for r in shopping_results:
            r_domain = _extract_domain(r.get("link"))
            if _matches_domain_set(r_domain, {dominio_esperado}):
                precio = _extraer_precio(r.get("extracted_price"))
                if precio is None:
                    precio = _extraer_precio(r.get("price"))
                if precio is not None:
                    return precio

    # 2) Fallback: primer resultado con precio numérico
    for r in shopping_results:
        precio = _extraer_precio(r.get("extracted_price"))
        if precio is None:
            precio = _extraer_precio(r.get("price"))
        if precio is not None:
            return precio

    return None


def _extraer_precio(price_info) -> float | None:
    """
    Extrae el valor numérico del precio. SerpAPI devuelve a veces un dict
    {"extracted_value": 29.99, "value": "$29.99", "currency": "$"} y otras
    un string suelto ("29,99 €") o un número directo.
    """
    if price_info is None:
        return None

    if isinstance(price_info, dict):
        valor = price_info.get("extracted_value")
        if valor is not None:
            try:
                return float(valor)
            except (TypeError, ValueError):
                return None
        price_info = price_info.get("value")

    if isinstance(price_info, (int, float)):
        return float(price_info)

    if isinstance(price_info, str):
        match = _PRICE_REGEX.search(price_info.replace(",", "."))
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                return None

    return None
