FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    g++ \
    libjpeg-dev \
    libffi-dev \
    curl \
    libxcb1 \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

RUN pip install --no-cache-dir -r requirements.txt

# Pre-descarga FashionCLIP durante el build para evitar descargas en runtime.
# Si FASHIONCLIP_ENABLED=false en Railway este paso sigue siendo inofensivo
# (el modelo estará en caché pero no se cargará en RAM).
RUN python -c "\
from transformers import CLIPProcessor, CLIPModel; \
CLIPProcessor.from_pretrained('patrickjohncyh/fashion-clip'); \
CLIPModel.from_pretrained('patrickjohncyh/fashion-clip'); \
print('FashionCLIP cached OK')"

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]