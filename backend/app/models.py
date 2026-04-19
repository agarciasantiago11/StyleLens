from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID  # Importante para que funcione con Supabase
from pgvector.sqlalchemy import Vector
from app.database import Base
import uuid # Necesario para generar los IDs por defecto


class Prenda(Base):
    __tablename__ = "prendas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    categoria = Column(String, nullable=False)   # camiseta, pantalon, zapatos...
    color = Column(String)
    marca = Column(String)
    precio = Column(Float)
    tienda = Column(String)
    imagen_url = Column(String)
    embedding = Column(Vector(512))

# --- TUS TABLAS (Añade esto ahora) ---

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, nullable=False)
    prioridad = Column(Integer, nullable=False)

class Usuario(Base):
    __tablename__ = "usuarios"

    # Usamos UUID porque es lo que genera Supabase por defecto
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    nombre_completo = Column(String)
    role_id = Column(Integer, ForeignKey("roles.id"))
    is_active = Column(Boolean, default=True)
    token = Column(String)
    token_expiration = Column(DateTime)
