import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.config import settings
from app.core.deps import require_restaurant_admin
from app.models import User

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_MB = 5

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    _: User = Depends(require_restaurant_admin),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Formato inválido. Use JPG, PNG ou WebP.")
    contents = await file.read()
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Imagem muito grande. Máximo {MAX_SIZE_MB}MB.")
    result = cloudinary.uploader.upload(
        contents,
        folder="menu-facil/items",
        transformation=[{"width": 900, "crop": "limit", "quality": "auto", "fetch_format": "auto"}],
    )
    return {"url": result["secure_url"]}
