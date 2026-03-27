from fastapi import FastAPI

app = FastAPI(title="StyleLens API", version="1.0")

@app.get("/")
def health_check():
    return {"status": "Hola mundo"}