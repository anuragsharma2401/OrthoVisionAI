from functools import lru_cache
from pathlib import Path
import os
import sys
from uuid import uuid4

CLASS_NAMES = {
    0: "boneanomaly",
    1: "bonelesion",
    2: "foreignbody",
    3: "fracture",
    4: "metal",
    5: "periostealreaction",
    6: "pronatorsign",
    7: "softtissue",
    8: "text",
}

REPO_ROOT = Path(__file__).resolve().parents[1]
ML_ROOT = Path(__file__).resolve().parent
if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

try:
    from dotenv import load_dotenv

    load_dotenv(REPO_ROOT / "backend" / ".env")
except ImportError:
    pass


def resolve_project_path(value: str | os.PathLike) -> Path:
    path = Path(value)
    if path.is_absolute():
        return path

    candidates = [
        (REPO_ROOT / path).resolve(),
        (REPO_ROOT / "backend" / path).resolve(),
        (ML_ROOT / path).resolve(),
    ]

    for candidate in candidates:
        if candidate.exists():
            return candidate

    return candidates[0]


DEFAULT_MODEL_PATH = resolve_project_path(os.getenv("ORTHOVISION_MODEL_PATH", "ml/bone.pt"))
DEFAULT_OUTPUT_DIR = resolve_project_path(
    os.getenv("ORTHOVISION_PREDICTION_OUTPUT_DIR", "backend/uploads/predictions")
)
DEFAULT_YOLO_CONFIG_DIR = resolve_project_path(
    os.getenv("YOLO_CONFIG_DIR", "backend/uploads/ultralytics")
)
DEFAULT_YOLO_CONFIG_DIR.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("YOLO_CONFIG_DIR", str(DEFAULT_YOLO_CONFIG_DIR))


@lru_cache(maxsize=1)
def load_model(model_path: str = str(DEFAULT_MODEL_PATH)):
    from ultralytics import YOLO

    path = Path(model_path)
    if not path.exists():
        raise FileNotFoundError(f"Model weights not found at {path}")

    return YOLO(str(path))


def predict_xray(image_path: str, output_dir: str | None = None) -> dict:
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError("Uploaded X-ray image was not found.")

    model = load_model()
    results = model.predict(
        source=str(path),
        imgsz=int(os.getenv("ORTHOVISION_MODEL_IMAGE_SIZE", "832")),
        conf=float(os.getenv("ORTHOVISION_MODEL_CONFIDENCE", "0.25")),
        iou=float(os.getenv("ORTHOVISION_MODEL_IOU", "0.35")),
        max_det=int(os.getenv("ORTHOVISION_MODEL_MAX_DETECTIONS", "10")),
        save=False,
        verbose=False,
    )

    detections = []
    top_detection = None

    for result in results:
        if result.boxes is None:
            continue

        for box in result.boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            bbox = [float(value) for value in box.xyxy[0].tolist()]
            detection = {
                "class_id": class_id,
                "label": CLASS_NAMES.get(class_id, f"class_{class_id}"),
                "confidence": round(confidence, 4),
                "bbox": bbox,
            }
            detections.append(detection)

            if top_detection is None or detection["confidence"] > top_detection["confidence"]:
                top_detection = detection

    result_image_path = None
    if results:
        destination = Path(output_dir) if output_dir else DEFAULT_OUTPUT_DIR
        destination.mkdir(parents=True, exist_ok=True)
        result_image_path = destination / f"{path.stem}-{uuid4().hex[:8]}-result.jpg"
        plotted = results[0].plot()

        import cv2

        cv2.imwrite(str(result_image_path), plotted)

    return {
        "prediction": top_detection["label"] if top_detection else "No detection",
        "confidence": top_detection["confidence"] if top_detection else None,
        "detected_bone": None,
        "finding": top_detection["label"] if top_detection else "No detection",
        "detections": detections,
        "result_image_path": str(result_image_path) if result_image_path else None,
        "model": str(DEFAULT_MODEL_PATH),
    }
