from fastapi import APIRouter, UploadFile, File

router = APIRouter()

MOCK_RESPONSE = {
    "prendas": [
        {
            "nombre": "Sudadera Essentials",
            "marca": "Fear of God",
            "modelo": "FW23-ESS-001",
            "precio": "89.99€",
            "url_compra": "https://www.fearofgod.com/essentials",
            "url_imagen": "https://via.placeholder.com/400x400?text=Prenda",
            "similitud": None,
            "fuente": "mock"
        }
    ]
}


@router.post("/detectar")
async def detectar(imagen: UploadFile = File(...)):
    return MOCK_RESPONSE
