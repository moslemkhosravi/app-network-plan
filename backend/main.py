from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, schemas
from database import engine, SessionLocal

# ساخت جداول دیتابیس
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="App Network Plan API", version="1.0.0")

# تنظیمات CORS برای اجازه دادن به فرانت‌اند
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # در محیط توسعه دسترسی را برای همه باز می‌گذاریم
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"status": "success", "message": "Backend is running smoothly!"}

# API ثبت مشتری جدید
@app.post("/clients/", response_model=schemas.ClientResponse)
def create_client(client: schemas.ClientCreate, db: Session = Depends(get_db)):
    db_client = db.query(models.Client).filter(models.Client.name == client.name).first()
    if db_client:
        raise HTTPException(status_code=400, detail="این مشتری قبلا ثبت شده است")
    
    new_client = models.Client(name=client.name, contact_info=client.contact_info)
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    return new_client

# API دریافت لیست تمام مشتریان
@app.get("/clients/", response_model=list[schemas.ClientResponse])
def read_clients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    clients = db.query(models.Client).offset(skip).limit(limit).all()
    return clients
