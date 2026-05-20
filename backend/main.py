from fastapi import FastAPI
import models
from database import engine

# این خط به دیتابیس دستور می‌دهد که جداول را به صورت خودکار بسازد
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="App Network Plan API", version="1.0.0")

@app.get("/")
def read_root():
    return {"status": "success", "message": "Backend is running smoothly on Ubuntu!"}
