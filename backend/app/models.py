from sqlalchemy import Column, Integer, String, Float
from pgvector.sqlalchemy import Vector
from app.database import Base


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
