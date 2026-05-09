from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.database import Base
from datetime import datetime, timedelta, timezone
import uuid
import hashlib
import secrets


class Prenda(Base):
    """
    Tabla base con los campos comunes a toda prenda.
    El embedding vectorial reside en cada subtabla (JTI) para que la búsqueda
    semántica opere solo sobre la categoría detectada por YOLO y no escanee
    todas las filas.
    """
    __tablename__ = "prendas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    nombre = Column(String, nullable=False)
    categoria = Column(String, nullable=True, index=True)  # prendas_superiores | prendas_inferiores | cuerpo_entero
    subcategoria = Column(String, nullable=True)           # camisetas | chaquetas_y_abrigos | pantalones | shorts | faldas | vestidos
    color = Column(String)
    marca = Column(String)
    precio = Column(Float)
    precio_actual = Column(Float, nullable=True)
    tienda = Column(String)
    imagen_url = Column(String)        # thumbnail del resultado (SerpAPI)
    link = Column(String)              # link al producto en la tienda
    imagen_hash = Column(String, index=True)   # SHA256 de la imagen subida (caché)
    cloudinary_url = Column(String)    # URL pública en Cloudinary
    fuente_precio = Column(String, nullable=True)

    # JTI (Joined Table Inheritance): cada subclase tiene su propia tabla física
    # con el embedding vector(512) para búsqueda semántica por categoría.
    __mapper_args__ = {
        "polymorphic_on": categoria,
        "polymorphic_identity": None,
    }


class PrendaSuperior(Prenda):
    """Prendas de parte superior: camisetas, chaquetas, abrigos, etc."""
    __tablename__ = "prendas_superiores"

    id = Column(UUID(as_uuid=True), ForeignKey("prendas.id"), primary_key=True)
    embedding = Column(Vector(512))

    __mapper_args__ = {"polymorphic_identity": "prendas_superiores"}


class PrendaInferior(Prenda):
    """Prendas de parte inferior: pantalones, shorts, faldas, etc."""
    __tablename__ = "prendas_inferiores"

    id = Column(UUID(as_uuid=True), ForeignKey("prendas.id"), primary_key=True)
    embedding = Column(Vector(512))

    __mapper_args__ = {"polymorphic_identity": "prendas_inferiores"}


class CuerpoEntero(Prenda):
    """Prendas de cuerpo entero: vestidos, monos, etc."""
    __tablename__ = "cuerpo_entero"

    id = Column(UUID(as_uuid=True), ForeignKey("prendas.id"), primary_key=True)
    embedding = Column(Vector(512))

    __mapper_args__ = {"polymorphic_identity": "cuerpo_entero"}



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
    fecha_registro = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    token = Column(String)
    token_expiration = Column(DateTime)

    busquedas = relationship("Busqueda", back_populates="usuario", cascade="all, delete-orphan")


class Busqueda(Base):
    __tablename__ = "busquedas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False, index=True)
    imagen_original_url = Column(String, nullable=True)
    imagen_hash_original = Column(String, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("Usuario", back_populates="busquedas")
    detecciones = relationship("Deteccion", back_populates="busqueda", cascade="all, delete-orphan")


class Deteccion(Base):
    __tablename__ = "detecciones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    busqueda_id = Column(UUID(as_uuid=True), ForeignKey("busquedas.id"), nullable=False, index=True)
    clase = Column(String, nullable=True)        # etiqueta YOLO de la prenda detectada (ej. "trousers")
    confianza = Column(Float, nullable=True)     # puntuación de confianza del modelo (0.0 – 1.0)
    bbox_x = Column(Float, nullable=True)        # coordenada X del centro del bounding box (normalizada 0-1)
    bbox_y = Column(Float, nullable=True)        # coordenada Y del centro del bounding box (normalizada 0-1)
    bbox_w = Column(Float, nullable=True)        # ancho del bounding box (normalizado 0-1)
    bbox_h = Column(Float, nullable=True)        # alto del bounding box (normalizado 0-1)
    recorte_url = Column(String, nullable=True)  # URL en Cloudinary del recorte de la prenda detectada
    created_at = Column(DateTime, default=datetime.utcnow)

    busqueda = relationship("Busqueda", back_populates="detecciones")
    resultados = relationship("Resultado", back_populates="deteccion", cascade="all, delete-orphan")


class Resultado(Base):
    __tablename__ = "resultados"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    deteccion_id = Column(UUID(as_uuid=True), ForeignKey("detecciones.id"), nullable=False, index=True)
    prenda_id = Column(UUID(as_uuid=True), ForeignKey("prendas.id"), nullable=False, index=True)
    rank = Column(Integer, nullable=True)           # posición del resultado dentro de la detección (1 = más relevante)
    similitud_score = Column(Float, nullable=True)  # puntuación de similitud vectorial con la prenda detectada (0.0 – 1.0)
    fuente = Column(String, nullable=True)          # origen del resultado: "cache", "serpapi" o "vectorial"
    created_at = Column(DateTime, default=datetime.utcnow)

    deteccion = relationship("Deteccion", back_populates="resultados")
    prenda = relationship("Prenda")


class AccessRequest(Base):
    __tablename__ = "requests"
    __table_args__ = (
        CheckConstraint(
            "message IN ('register request', 'change password')",
            name="ck_requests_message_allowed",
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, nullable=False, index=True)
    message = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    otp_hash = Column(String, nullable=True)
    otp_expiration = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, default="pending")  # pending | approved | rejected

    def generate_otp(self) -> str:
        otp = f"{secrets.randbelow(1_000_000):06d}"
        self.otp_hash = hashlib.sha256(otp.encode()).hexdigest()
        self.otp_expiration = datetime.now(timezone.utc) + timedelta(minutes=10)
        return otp

    def verify_otp(self, plain_otp: str) -> bool:
        if not self.otp_hash or not self.otp_expiration:
            return False

        exp = self.otp_expiration
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)

        if exp < datetime.now(timezone.utc):
            self.otp_hash = None
            self.otp_expiration = None
            return False

        expected = hashlib.sha256(plain_otp.encode()).hexdigest()
        # compare_digest previene timing attacks
        if not secrets.compare_digest(expected, self.otp_hash):
            return False

        self.otp_hash = None
        self.otp_expiration = None
        return True


class Favorito(Base):
    __tablename__ = "favoritos"

    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), primary_key=True, nullable=False)
    prenda_id = Column(UUID(as_uuid=True), ForeignKey("prendas.id"), primary_key=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    prenda = relationship("Prenda")
