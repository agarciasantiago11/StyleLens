from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.database import Base
from datetime import datetime
import uuid


class Prenda(Base):
    __tablename__ = "prendas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    nombre = Column(String, nullable=False)
    categoria = Column(String, nullable=True)    # prendas_superiores | prendas_inferiores | cuerpo_entero
    subcategoria = Column(String, nullable=True) # camisetas | chaquetas_y_abrigos | pantalones | shorts | faldas | vestidos
    color = Column(String)
    marca = Column(String)
    precio = Column(Float)
    precio_actual = Column(Float, nullable=True)
    tienda = Column(String)
    imagen_url = Column(String)                  # thumbnail del resultado (SerpAPI)
    link = Column(String)                        # link al producto en la tienda
    imagen_hash = Column(String, index=True)     # SHA256 de la imagen subida (caché)
    cloudinary_url = Column(String)              # URL pública en Cloudinary
    embedding = Column(Vector(512))
    fuente_precio = Column(String, nullable=True)

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


class Favorito(Base):
    __tablename__ = "favoritos"

    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), primary_key=True, nullable=False)
    prenda_id = Column(UUID(as_uuid=True), ForeignKey("prendas.id"), primary_key=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    prenda = relationship("Prenda")
