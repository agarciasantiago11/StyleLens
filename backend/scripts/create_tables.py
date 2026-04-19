"""
Crea todas las tablas en la BD si no existen.

Uso: cd backend && python scripts/create_tables.py
"""
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from app import models

models.Base.metadata.create_all(bind=engine)
print("Tablas creadas correctamente.")
