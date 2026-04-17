from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, tenants, categories, tags, menu_items, public

app = FastAPI(title="Menu Fácil API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tenants.router)
app.include_router(categories.router)
app.include_router(tags.router)
app.include_router(menu_items.router)
app.include_router(public.router)


@app.get("/health")
def health():
    return {"status": "ok"}
