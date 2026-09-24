import cv2
import torch
import numpy as np

from ultralytics import YOLO
from pathlib import Path


# ==================================================
# SETTINGS
# ==================================================

MODEL_PATH = "bone.pt"
IMAGE_PATH = "xray4.0.png"

IMG_SIZE = 832

HEATMAP_EXPANSION = 1.6
BLUR_SIZE = 25
HEATMAP_ALPHA = 0.75


# ==================================================
# 1. YOLO PREDICTION
# ==================================================

model = YOLO(MODEL_PATH)

results = model.predict(
    source=IMAGE_PATH,
    imgsz=IMG_SIZE,
    conf=0.35,
    iou=0.35,
    max_det=10,
    verbose=False
)

result = results[0]


# ==================================================
# 2. GET DETECTIONS
# ==================================================

detections = []

if result.boxes is not None:

    for box in result.boxes:

        class_id = int(box.cls[0])
        confidence = float(box.conf[0])

        name = model.names[class_id]

        # Ignore text detections
        if name == "text":
            continue

        detections.append(box)


if not detections:

    raise RuntimeError(
        "YOLO did not find any useful detections."
    )


print()
print("================================")
print("YOLO DETECTIONS")
print("================================")

for box in detections:

    class_id = int(box.cls[0])
    confidence = float(box.conf[0])

    print(
        f"{model.names[class_id]} "
        f"confidence = {confidence:.3f}"
    )


# ==================================================
# 3. LOAD ORIGINAL IMAGE
# ==================================================

image = cv2.imread(IMAGE_PATH)

if image is None:

    raise FileNotFoundError(
        IMAGE_PATH
    )


image_rgb = cv2.cvtColor(
    image,
    cv2.COLOR_BGR2RGB
)


height, width = image.shape[:2]


print()
print(
    f"Original image size: "
    f"{width} x {height}"
)


# ==================================================
# 4. MANUAL YOLO-STYLE LETTERBOX
# ==================================================

print()
print("Preparing aspect-ratio-preserving image...")


# --------------------------------------------------
# Calculate resize ratio
# --------------------------------------------------

scale = min(
    IMG_SIZE / width,
    IMG_SIZE / height
)


new_width = int(
    round(width * scale)
)

new_height = int(
    round(height * scale)
)


# --------------------------------------------------
# Resize while KEEPING aspect ratio
# --------------------------------------------------

resized_image = cv2.resize(
    image_rgb,
    (new_width, new_height),
    interpolation=cv2.INTER_LINEAR
)


# --------------------------------------------------
# Calculate padding
# --------------------------------------------------

pad_width = IMG_SIZE - new_width
pad_height = IMG_SIZE - new_height


left = pad_width // 2
right = pad_width - left

top = pad_height // 2
bottom = pad_height - top


# --------------------------------------------------
# Add padding
# YOLO normally uses 114
# --------------------------------------------------

processed_image = cv2.copyMakeBorder(
    resized_image,
    top,
    bottom,
    left,
    right,
    cv2.BORDER_CONSTANT,
    value=(114, 114, 114)
)


print(
    f"Resized content: "
    f"{new_width} x {new_height}"
)

print(
    f"Padding: "
    f"left={left}, right={right}, "
    f"top={top}, bottom={bottom}"
)

print(
    f"Model input: "
    f"{processed_image.shape[1]} x "
    f"{processed_image.shape[0]}"
)


# Safety check

if processed_image.shape[:2] != (
    IMG_SIZE,
    IMG_SIZE
):

    raise RuntimeError(
        "Preprocessed image is not "
        f"{IMG_SIZE}x{IMG_SIZE}."
    )


# ==================================================
# 5. PREPARE GRAD-CAM MODEL
# ==================================================

cam_model = YOLO(MODEL_PATH)


# Layer before detection head

target_layer = cam_model.model.model[21]


activations = []


def forward_hook(
    module,
    inputs,
    output
):

    activations.append(output)

    output.retain_grad()


hook_handle = target_layer.register_forward_hook(
    forward_hook
)


# ==================================================
# 6. IMAGE -> TENSOR
# ==================================================

img_tensor = torch.from_numpy(
    np.ascontiguousarray(processed_image)
)


img_tensor = img_tensor.permute(
    2,
    0,
    1
).float()


img_tensor /= 255.0


img_tensor = img_tensor.unsqueeze(0)


img_tensor.requires_grad_(True)


# ==================================================
# 7. FORWARD PASS
# ==================================================

print()
print("Running Grad-CAM...")


cam_model.model.zero_grad()


with torch.enable_grad():

    _ = cam_model.model(
        img_tensor
    )


if not activations:

    raise RuntimeError(
        "Could not capture feature activation."
    )


activation = activations[-1]


print(
    "Feature map:",
    tuple(activation.shape)
)


# ==================================================
# 8. FEATURE MAP MASK
# ==================================================

_, _, feature_h, feature_w = (
    activation.shape
)


feature_mask = torch.zeros(
    (
        1,
        1,
        feature_h,
        feature_w
    ),
    dtype=activation.dtype,
    device=activation.device
)


# ==================================================
# 9. MAP YOLO BOXES THROUGH SAME TRANSFORMATION
# ==================================================

for box in detections:

    x1, y1, x2, y2 = (
        box.xyxy[0]
        .detach()
        .cpu()
        .numpy()
        .astype(np.float32)
    )


    # ----------------------------------------------
    # Expand box slightly
    # ----------------------------------------------

    box_width = x2 - x1
    box_height = y2 - y1


    x1 -= box_width * 0.30
    x2 += box_width * 0.30

    y1 -= box_height * 0.30
    y2 += box_height * 0.30


    # ----------------------------------------------
    # Clamp to original image
    # ----------------------------------------------

    x1 = np.clip(
        x1,
        0,
        width
    )

    x2 = np.clip(
        x2,
        0,
        width
    )

    y1 = np.clip(
        y1,
        0,
        height
    )

    y2 = np.clip(
        y2,
        0,
        height
    )


    # ----------------------------------------------
    # ORIGINAL -> LETTERBOX coordinates
    # ----------------------------------------------

    lx1 = (
        x1 * scale
        + left
    )

    lx2 = (
        x2 * scale
        + left
    )

    ly1 = (
        y1 * scale
        + top
    )

    ly2 = (
        y2 * scale
        + top
    )


    # ----------------------------------------------
    # LETTERBOX -> FEATURE MAP
    # ----------------------------------------------

    fx1 = int(
        np.floor(
            lx1 / IMG_SIZE
            * feature_w
        )
    )

    fx2 = int(
        np.ceil(
            lx2 / IMG_SIZE
            * feature_w
        )
    )

    fy1 = int(
        np.floor(
            ly1 / IMG_SIZE
            * feature_h
        )
    )

    fy2 = int(
        np.ceil(
            ly2 / IMG_SIZE
            * feature_h
        )
    )


    # ----------------------------------------------
    # Clamp feature coordinates
    # ----------------------------------------------

    fx1 = np.clip(
        fx1,
        0,
        feature_w - 1
    )

    fx2 = np.clip(
        fx2,
        fx1 + 1,
        feature_w
    )

    fy1 = np.clip(
        fy1,
        0,
        feature_h - 1
    )

    fy2 = np.clip(
        fy2,
        fy1 + 1,
        feature_h
    )


    feature_mask[
        :,
        :,
        fy1:fy2,
        fx1:fx2
    ] = 1.0


# ==================================================
# 10. BACKWARD PASS
# ==================================================

target = (
    activation
    * feature_mask
).mean()


cam_model.model.zero_grad()


target.backward()


gradient = activation.grad


if gradient is None:

    raise RuntimeError(
        "Grad-CAM gradient was not captured."
    )


# ==================================================
# 11. CREATE GRAD-CAM
# ==================================================

weights = gradient.mean(
    dim=(2, 3),
    keepdim=True
)


cam = (
    weights
    * activation
).sum(
    dim=1
)


cam = torch.relu(
    cam
)


cam = (
    cam[0]
    .detach()
    .cpu()
    .numpy()
)


# ==================================================
# 12. FEATURE MAP -> 832 x 832
# ==================================================

cam = cv2.resize(
    cam,
    (
        IMG_SIZE,
        IMG_SIZE
    ),
    interpolation=cv2.INTER_LINEAR
)


# ==================================================
# 13. REMOVE LETTERBOX PADDING
# ==================================================

cam = cam[
    top:top + new_height,
    left:left + new_width
]


if cam.size == 0:

    raise RuntimeError(
        "CAM became empty while "
        "removing padding."
    )


# ==================================================
# 14. RETURN CAM TO ORIGINAL IMAGE SIZE
# ==================================================

cam = cv2.resize(
    cam,
    (
        width,
        height
    ),
    interpolation=cv2.INTER_LINEAR
)


# ==================================================
# 15. CREATE SOFT DETECTION ROI
# ==================================================

roi = np.zeros(
    (
        height,
        width
    ),
    dtype=np.float32
)


yy, xx = np.mgrid[
    0:height,
    0:width
]


for box in detections:

    x1, y1, x2, y2 = (
        box.xyxy[0]
        .detach()
        .cpu()
        .numpy()
        .astype(np.float32)
    )


    cx = (
        x1 + x2
    ) / 2.0

    cy = (
        y1 + y2
    ) / 2.0


    box_width = (
        x2 - x1
    )

    box_height = (
        y2 - y1
    )


    radius_x = max(
        box_width
        * HEATMAP_EXPANSION,
        25
    )

    radius_y = max(
        box_height
        * HEATMAP_EXPANSION,
        25
    )


    ellipse_distance = (
        ((xx - cx) / radius_x) ** 2
        +
        ((yy - cy) / radius_y) ** 2
    )


    region = np.exp(
        -2.0
        * ellipse_distance
    ).astype(
        np.float32
    )


    roi = np.maximum(
        roi,
        region
    )


# ==================================================
# 16. APPLY SOFT ROI
# ==================================================

cam = (
    cam
    * roi
)


# ==================================================
# 17. BLUR
# ==================================================

# GaussianBlur kernel must be odd.

if BLUR_SIZE % 2 == 0:

    BLUR_SIZE += 1


cam = cv2.GaussianBlur(
    cam,
    (
        BLUR_SIZE,
        BLUR_SIZE
    ),
    0
)


# ==================================================
# 18. NORMALIZE CAM
# ==================================================

valid = cam[
    roi > 0.15
]


if valid.size > 0:

    low = np.percentile(
        valid,
        10
    )

    high = np.percentile(
        valid,
        99
    )


    if high > low:

        cam = (
            cam - low
        ) / (
            high - low
        )

    else:

        cam = np.zeros_like(
            cam
        )

else:

    cam = np.zeros_like(
        cam
    )


cam = np.clip(
    cam,
    0.0,
    1.0
)


# Soft fade around detections

cam *= roi


# ==================================================
# 19. COLOR HEATMAP
# ==================================================

heatmap_uint8 = np.uint8(
    cam * 255
)


heatmap = cv2.applyColorMap(
    heatmap_uint8,
    cv2.COLORMAP_JET
)


# ==================================================
# 20. OVERLAY ON ORIGINAL X-RAY
# ==================================================

alpha = (
    cam
    * HEATMAP_ALPHA
)


alpha = alpha[
    :,
    :,
    np.newaxis
]


overlay = (
    image.astype(np.float32)
    * (1.0 - alpha)
    +
    heatmap.astype(np.float32)
    * alpha
)


overlay = np.clip(
    overlay,
    0,
    255
).astype(
    np.uint8
)


# ==================================================
# 21. SAVE
# ==================================================

output_folder = Path(
    "heatmap"
)


output_folder.mkdir(
    exist_ok=True
)


output_path = (
    output_folder
    / "heatmap_result.jpg"
)


success = cv2.imwrite(
    str(output_path),
    overlay
)


if not success:

    raise RuntimeError(
        "Could not save heatmap."
    )


hook_handle.remove()


print()
print("================================")
print("HEATMAP CREATED SUCCESSFULLY")
print("================================")

print(
    f"Saved to: {output_path}"
)