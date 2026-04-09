"""
Pobla la BD con 20 prendas de prueba con embeddings aleatorios.
En S3 los embeddings se reemplazarán por los reales de FashionCLIP.

Uso: cd backend && python scripts/seed_db.py
"""
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
from app.database import SessionLocal, engine
from app import models

models.Base.metadata.create_all(bind=engine)

PRENDAS = [
    {"nombre": "Camiseta básica blanca", "categoria": "camiseta", "color": "blanco", "marca": "Zara", "precio": 12.99, "tienda": "Zara"},
    {"nombre": "Camiseta oversize negra", "categoria": "camiseta", "color": "negro", "marca": "H&M", "precio": 14.99, "tienda": "H&M"},
    {"nombre": "Camiseta rayas marineras", "categoria": "camiseta", "color": "azul/blanco", "marca": "Mango", "precio": 17.99, "tienda": "Mango"},
    {"nombre": "Pantalón vaquero slim", "categoria": "pantalon", "color": "azul", "marca": "Levi's", "precio": 59.99, "tienda": "El Corte Inglés"},
    {"nombre": "Pantalón chino beige", "categoria": "pantalon", "color": "beige", "marca": "Zara", "precio": 29.99, "tienda": "Zara"},
    {"nombre": "Pantalón negro de vestir", "categoria": "pantalon", "color": "negro", "marca": "Mango", "precio": 39.99, "tienda": "Mango"},
    {"nombre": "Vestido floral verano", "categoria": "vestido", "color": "multicolor", "marca": "H&M", "precio": 24.99, "tienda": "H&M"},
    {"nombre": "Vestido negro midi", "categoria": "vestido", "color": "negro", "marca": "Zara", "precio": 49.99, "tienda": "Zara"},
    {"nombre": "Chaqueta vaquera azul", "categoria": "chaqueta", "color": "azul", "marca": "Levi's", "precio": 79.99, "tienda": "El Corte Inglés"},
    {"nombre": "Blazer gris oversize", "categoria": "chaqueta", "color": "gris", "marca": "Mango", "precio": 69.99, "tienda": "Mango"},
    {"nombre": "Sudadera capucha gris", "categoria": "sudadera", "color": "gris", "marca": "Nike", "precio": 54.99, "tienda": "Nike"},
    {"nombre": "Sudadera crop rosa", "categoria": "sudadera", "color": "rosa", "marca": "H&M", "precio": 22.99, "tienda": "H&M"},
    {"nombre": "Zapatillas blancas", "categoria": "zapatos", "color": "blanco", "marca": "Adidas", "precio": 89.99, "tienda": "Adidas"},
    {"nombre": "Zapatillas negras running", "categoria": "zapatos", "color": "negro", "marca": "Nike", "precio": 99.99, "tienda": "Nike"},
    {"nombre": "Botines marrón piel", "categoria": "zapatos", "color": "marrón", "marca": "Zara", "precio": 59.99, "tienda": "Zara"},
    {"nombre": "Falda midi plisada", "categoria": "falda", "color": "verde", "marca": "Zara", "precio": 29.99, "tienda": "Zara"},
    {"nombre": "Falda vaquera mini", "categoria": "falda", "color": "azul", "marca": "H&M", "precio": 19.99, "tienda": "H&M"},
    {"nombre": "Abrigo camel largo", "categoria": "abrigo", "color": "camel", "marca": "Mango", "precio": 119.99, "tienda": "Mango"},
    {"nombre": "Bolso piel negro", "categoria": "accesorio", "color": "negro", "marca": "Zara", "precio": 39.99, "tienda": "Zara"},
    {"nombre": "Cinturón cuero marrón", "categoria": "accesorio", "color": "marrón", "marca": "El Corte Inglés", "precio": 24.99, "tienda": "El Corte Inglés"},
]


def seed():
    db = SessionLocal()
    try:
        if db.query(models.Prenda).count() > 0:
            print("La BD ya tiene datos, skipping seed.")
            return

        for data in PRENDAS:
            # Embedding aleatorio de 512 dimensiones — se reemplaza en S3 con FashionCLIP
            embedding = np.random.rand(512).tolist()
            prenda = models.Prenda(**data, embedding=embedding)
            db.add(prenda)

        db.commit()
        print(f"Insertadas {len(PRENDAS)} prendas correctamente.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
