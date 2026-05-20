from fastapi import FastAPI

app = FastAPI(title="App Network Plan API", version="1.0.0")

@app.get("/")
def read_root():
    return {"status": "success", "message": "Backend is running smoothly on Ubuntu!"}
