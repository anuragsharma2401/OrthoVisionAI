from ultralytics import YOLO
from pathlib import Path

# Model
model = YOLO("bone.pt")

# Put your test image here
image_path = r"C:\Users\Lenovo\Pictures\Screenshots\Screenshot 2026-08-26 140630.png"

# Class names
class_names = {
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

results = model.predict(
    source=image_path,
    imgsz=832,
    conf=0.25,
    iou=0.35,
    save=True
)

print("\n" + "=" * 60)
print("DETECTIONS")
print("=" * 60)

for result in results:
    if result.boxes is None or len(result.boxes) == 0:
        print("No detections.")
        continue

    for box in result.boxes:
        cls_id = int(box.cls[0])
        confidence = float(box.conf[0])

        name = class_names.get(cls_id, f"class_{cls_id}")

        print(f"{name:20s} confidence = {confidence:.3f}")

print("\nResult image saved in runs/detect/predict/")