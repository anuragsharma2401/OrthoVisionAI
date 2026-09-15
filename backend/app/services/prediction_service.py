import os
import shutil
from pathlib import Path
from uuid import uuid4

UPLOAD_FOLDER = Path(os.getenv("ORTHOVISION_UPLOAD_DIR", "uploads")) / "xrays"
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png"}
MAX_UPLOAD_BYTES = int(os.getenv("ORTHOVISION_MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))

def save_image(file):
    UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

    extension = Path(file.filename or "").suffix.lower()
    safe_name = f"{uuid4().hex}{extension}"
    file_path = UPLOAD_FOLDER / safe_name

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return str(file_path)
