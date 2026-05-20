import logging
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, schemas
from database import engine, SessionLocal

# ==========================================
# تنظیمات سیستم لاگینگ (Logging Configuration)
# ==========================================
logging.basicConfig(
    level=logging.DEBUG, # نمایش تمام جزئیات از جمله دیباگ‌ها
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("NetworkPlan")

# ساخت جداول دیتابیس
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="App Network Plan API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# میدل‌ور برای لاگ کردن تمام درخواست‌های ورودی و خروجی
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response Status: {response.status_code}")
    return response

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# API های مربوط به مشتریان (Clients)
# ==========================================

@app.post("/clients/", response_model=schemas.ClientResponse)
def create_client(client: schemas.ClientCreate, db: Session = Depends(get_db)):
    logger.debug(f"Attempting to create new client: {client.name}")
    
    # بررسی تکراری نبودن مشتری
    db_client = db.query(models.Client).filter(models.Client.name == client.name).first()
    if db_client:
        logger.warning(f"Creation Failed: Client '{client.name}' already exists.")
        raise HTTPException(status_code=400, detail="این مشتری قبلا ثبت شده است")
    
    try:
        new_client = models.Client(name=client.name, contact_info=client.contact_info)
        db.add(new_client)
        db.commit()
        db.refresh(new_client)
        logger.info(f"Success: Client '{client.name}' saved to DB with ID {new_client.id}")
        return new_client
    except Exception as e:
        logger.error(f"Database Error while saving client: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="خطای داخلی در اتصال به دیتابیس")

@app.get("/clients/", response_model=list[schemas.ClientResponse])
def read_clients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logger.debug("Fetching clients list from DB")
    clients = db.query(models.Client).offset(skip).limit(limit).all()
    logger.info(f"Success: Fetched {len(clients)} clients")
    return clients

# ==========================================
# API های مربوط به سایت‌ها (Sites)
# ==========================================

@app.post("/sites/", response_model=schemas.SiteResponse)
def create_site(site: schemas.SiteCreate, db: Session = Depends(get_db)):
    logger.debug(f"Attempting to create new site: {site.name} for client ID: {site.client_id}")
    
    # اول بررسی می‌کنیم که آیا مشتری با این ID اصلاً وجود دارد یا نه؟
    db_client = db.query(models.Client).filter(models.Client.id == site.client_id).first()
    if not db_client:
        logger.error(f"Creation Failed: Client ID '{site.client_id}' not found.")
        raise HTTPException(status_code=404, detail="مشتری مورد نظر یافت نشد")
    
    try:
        new_site = models.Site(name=site.name, address=site.address, client_id=site.client_id)
        db.add(new_site)
        db.commit()
        db.refresh(new_site)
        logger.info(f"Success: Site '{new_site.name}' saved to DB with ID {new_site.id}")
        return new_site
    except Exception as e:
        logger.error(f"Database Error while saving site: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="خطای داخلی در اتصال به دیتابیس")

@app.get("/sites/", response_model=list[schemas.SiteResponse])
def read_sites(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logger.debug("Fetching sites list from DB")
    sites = db.query(models.Site).offset(skip).limit(limit).all()
    logger.info(f"Success: Fetched {len(sites)} sites")
    return sites

