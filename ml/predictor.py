from functools import lru_cache
from pathlib import Path
import os
import sys
from uuid import uuid4
from test_heatmap import generate_heatmap
import cv2
import torch
import numpy as np
from ultralytics import YOLO


CLASS_NAMES = {
    0: "Bone anomaly",
    1: "Bone lesion",
    2: "Foreign body",
    3: "Fracture",
    4: "Metal",
    5: "Periosteal reaction",
    6: "Pronator sign",
    7: "Soft tissue",
    8: "Text",
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

def load_gradcam_model(model_path: str = str(DEFAULT_MODEL_PATH)):
    from ultralytics import YOLO

    path = Path(model_path)
    if not path.exists():
        raise FileNotFoundError(f"Model weights not found at {path}")

    return YOLO(str(path))

def predict_xray(image_path: str, output_dir: str | None = None) -> dict:
    path = Path(image_path)

    if not path.exists():
        raise FileNotFoundError(
            "Uploaded X-ray image was not found."
        )

    model = load_model()

    image_size = int(
        os.getenv(
            "ORTHOVISION_MODEL_IMAGE_SIZE",
            "832",
        )
    )

    results = model.predict(
        source=str(path),
        imgsz=image_size,
        conf=float(
            os.getenv(
                "ORTHOVISION_MODEL_CONFIDENCE",
                "0.25",
            )
        ),
        iou=float(
            os.getenv(
                "ORTHOVISION_MODEL_IOU",
                "0.35",
            )
        ),
        max_det=int(
            os.getenv(
                "ORTHOVISION_MODEL_MAX_DETECTIONS",
                "10",
            )
        ),
        save=False,
        verbose=False,
    )

    detections = []
    top_detection = None

    for result in results:

        if result.boxes is None:
            continue

        for box in result.boxes:

            class_id = int(
                box.cls[0]
            )

            confidence = float(
                box.conf[0]
            )

            bbox = [
                float(value)
                for value in box.xyxy[0].tolist()
            ]

            detection = {
                "class_id": class_id,
                "label": CLASS_NAMES.get(
                    class_id,
                    f"class_{class_id}",
                ),
                "confidence": round(
                    confidence,
                    4,
                ),
                "bbox": bbox,
            }

            detections.append(
                detection
            )

            if (
                top_detection is None
                or
                detection["confidence"]
                >
                top_detection["confidence"]
            ):
                top_detection = detection

    # ==================================================
    # SAVE YOLO RESULT IMAGE
    # ==================================================

    result_image_path = None

    destination = (
        Path(output_dir)
        if output_dir
        else DEFAULT_OUTPUT_DIR
    )

    destination.mkdir(
        parents=True,
        exist_ok=True,
    )

    if results:

        result_image_path = (
            destination
            /
            f"{path.stem}-"
            f"{uuid4().hex[:8]}-result.jpg"
        )

        plotted = results[0].plot()

        cv2.imwrite(
            str(result_image_path),
            plotted,
        )

    # ==================================================
    # GENERATE HEATMAP
    # ==================================================

    heatmap_path = None

    if detections:

        # print("=== HEATMAP GRAD DEBUG ===")
        # print("Grad enabled:", torch.is_grad_enabled())
        # print(
        #     "First model parameter requires_grad:",
        #     next(model.model.parameters()).requires_grad,
        # )
        # print("===========================")

        gradcam_model = load_gradcam_model()

        # Grad-CAM needs autograd.
        gradcam_model.model.requires_grad_(True)   

        print("=== GRADCAM MODEL DEBUG ===")
        print(
            "GradCAM model parameter requires_grad:",
            next(gradcam_model.model.parameters()).requires_grad,
        )
        print(
            "Grad enabled:",
            torch.is_grad_enabled(),
        )
        print("============================")
        heatmap_path = generate_heatmap(
            model=gradcam_model,
            image_path=path,
            detections=detections,
            output_dir=destination,
            img_size=image_size,
        )

    # ==================================================
    # RETURN RESULT
    # ==================================================

    return {
        "prediction": (
            top_detection["label"]
            if top_detection
            else "No detection"
        ),

        "confidence": (
            top_detection["confidence"]
            if top_detection
            else None
        ),

        "detected_bone": None,

        "finding": (
            top_detection["label"]
            if top_detection
            else "No detection"
        ),

        "detections": detections,

        "result_image_path": (
            str(result_image_path)
            if result_image_path
            else None
        ),

        "heatmap_path": heatmap_path,

        "model": str(DEFAULT_MODEL_PATH),
    }
