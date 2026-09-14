from ultralytics import YOLO

model = YOLO("bone.pt")

image_path = r"C:\Users\Lenovo\Pictures\Screenshots\Screenshot 2026-08-26 140630.png"

results = model.predict(
    source=image_path,
    imgsz=832,
    conf=0.35,
    iou=0.35,
    max_det=10,
    save=True
)

print("Prediction complete.")
print("Results saved in runs/detect/")