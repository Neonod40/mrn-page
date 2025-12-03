import os
import requests
from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Разрешаем фронтенду делать fetch
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPSTREAM_BASE = os.environ.get("UPSTREAM_BASE", "https://demo.polskipcs.pl/gateway/containers")

@app.get("/api/get-mrn")
def get_mrn(number: str = Query(..., min_length=1)):
    container = number.strip().upper()
    if not container:
        return JSONResponse(content={"error": "Номер контейнера пустой"}, status_code=400)

    try:
        response = requests.get(f"{UPSTREAM_BASE}?numbers={container}", timeout=10)
        if response.status_code != 200:
            return JSONResponse(content={"error": f"Ошибка upstream {response.status_code}"}, status_code=500)
        data = response.json()
        for item in reversed(data):
            if item.get("mrn"):
                mrn_list = [m.strip() for m in item["mrn"]]
                return {"mrn": ", ".join(mrn_list)}
        return {"result": "Т1 не оформлена, или сбой"}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)