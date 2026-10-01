# heatmap.py

from pathlib import Path

import cv2
import torch
import numpy as np


# ==================================================
# SETTINGS
# ==================================================

HEATMAP_EXPANSION = 1.6
BLUR_SIZE = 25
HEATMAP_ALPHA = 0.75


def generate_heatmap(
    model,
    image_path: str | Path,
    detections: list[dict],
    output_dir: str | Path,
    img_size: int = 832,
) -> str | None:
    """
    Generate a Grad-CAM heatmap for YOLO detections.

    Parameters
    ----------
    model:
        Already-loaded Ultralytics YOLO model.

    image_path:
        Path to the original X-ray image.

    detections:
        Detection dictionaries returned by predictor.py.
        Each detection must contain:
            - label
            - bbox

    output_dir:
        Directory where the heatmap image will be saved.

    img_size:
        YOLO input image size.

    Returns
    -------
    str | None
        Path to the generated heatmap image.
    """

    image_path = Path(image_path)
    output_dir = Path(output_dir)

    if not image_path.exists():
        raise FileNotFoundError(
            f"X-ray image not found at {image_path}"
        )

    if not detections:
        return None

    # ==================================================
    # 1. LOAD ORIGINAL IMAGE
    # ==================================================

    image = cv2.imread(str(image_path))

    if image is None:
        raise FileNotFoundError(
            f"Could not read X-ray image: {image_path}"
        )

    image_rgb = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2RGB,
    )

    height, width = image.shape[:2]

    # ==================================================
    # 2. YOLO-STYLE LETTERBOX
    # ==================================================

    scale = min(
        img_size / width,
        img_size / height,
    )

    new_width = int(round(width * scale))
    new_height = int(round(height * scale))

    resized_image = cv2.resize(
        image_rgb,
        (new_width, new_height),
        interpolation=cv2.INTER_LINEAR,
    )

    pad_width = img_size - new_width
    pad_height = img_size - new_height

    left = pad_width // 2
    right = pad_width - left

    top = pad_height // 2
    bottom = pad_height - top

    processed_image = cv2.copyMakeBorder(
        resized_image,
        top,
        bottom,
        left,
        right,
        cv2.BORDER_CONSTANT,
        value=(114, 114, 114),
    )

    if processed_image.shape[:2] != (
        img_size,
        img_size,
    ):
        raise RuntimeError(
            f"Preprocessed image is not "
            f"{img_size}x{img_size}."
        )

    # ==================================================
    # 3. PREPARE GRAD-CAM MODEL
    # ==================================================

    try:
        target_layer = model.model.model[21]

        # Grad-CAM requires gradients.
        # Ultralytics may have frozen the model during inference,
        # so enable gradients for this dedicated Grad-CAM pass.
        

    except (IndexError, AttributeError) as exc:
        raise RuntimeError(
            "Could not find YOLO Grad-CAM target layer. "
            "The model architecture may have changed."
        ) from exc

    activations = []

    def forward_hook(module, inputs, output):
        activations.append(output)

        if output.requires_grad:
            output.retain_grad()

    hook_handle = target_layer.register_forward_hook(
        forward_hook
    )

    try:

        # ==================================================
        # 4. IMAGE -> TENSOR
        # ==================================================

        img_tensor = torch.from_numpy(
            np.ascontiguousarray(processed_image)
        )

        img_tensor = img_tensor.permute(
            2,
            0,
            1,
        ).float()

        img_tensor /= 255.0

        img_tensor = img_tensor.unsqueeze(0)

        # ==================================================
        # 5. FORWARD PASS
        # ==================================================

        model.model.zero_grad()

        with torch.enable_grad():
            _ = model.model(img_tensor)

        if not activations:
            raise RuntimeError(
                "Could not capture feature activation."
            )

        activation = activations[-1]

        print("=== ACTIVATION DEBUG ===")
        print("Activation requires_grad:", activation.requires_grad)
        print("Activation grad_fn:", activation.grad_fn)
        print("========================")
        
        # ==================================================
        # 6. FEATURE MAP MASK
        # ==================================================

        _, _, feature_h, feature_w = activation.shape

        feature_mask = torch.zeros(
            (
                1,
                1,
                feature_h,
                feature_w,
            ),
            dtype=activation.dtype,
            device=activation.device,
        )

        # ==================================================
        # 7. MAP DETECTION BOXES
        #    ORIGINAL -> LETTERBOX -> FEATURE MAP
        # ==================================================

        useful_detections = []

        for detection in detections:

            # Ignore text detections
            if detection.get("label", "").lower() == "text":
                continue

            bbox = detection.get("bbox")

            if not bbox or len(bbox) != 4:
                continue

            x1, y1, x2, y2 = map(
                float,
                bbox,
            )

            # ----------------------------------------------
            # Expand box
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
                width,
            )

            x2 = np.clip(
                x2,
                0,
                width,
            )

            y1 = np.clip(
                y1,
                0,
                height,
            )

            y2 = np.clip(
                y2,
                0,
                height,
            )

            # ----------------------------------------------
            # Original -> Letterbox coordinates
            # ----------------------------------------------

            lx1 = x1 * scale + left
            lx2 = x2 * scale + left

            ly1 = y1 * scale + top
            ly2 = y2 * scale + top

            # ----------------------------------------------
            # Letterbox -> Feature map
            # ----------------------------------------------

            fx1 = int(
                np.floor(
                    lx1 / img_size * feature_w
                )
            )

            fx2 = int(
                np.ceil(
                    lx2 / img_size * feature_w
                )
            )

            fy1 = int(
                np.floor(
                    ly1 / img_size * feature_h
                )
            )

            fy2 = int(
                np.ceil(
                    ly2 / img_size * feature_h
                )
            )

            # ----------------------------------------------
            # Clamp feature coordinates
            # ----------------------------------------------

            fx1 = int(
                np.clip(
                    fx1,
                    0,
                    feature_w - 1,
                )
            )

            fx2 = int(
                np.clip(
                    fx2,
                    fx1 + 1,
                    feature_w,
                )
            )

            fy1 = int(
                np.clip(
                    fy1,
                    0,
                    feature_h - 1,
                )
            )

            fy2 = int(
                np.clip(
                    fy2,
                    fy1 + 1,
                    feature_h,
                )
            )

            feature_mask[
                :,
                :,
                fy1:fy2,
                fx1:fx2,
            ] = 1.0

            useful_detections.append(
                detection
            )

        if not useful_detections:
            return None

        # ==================================================
        # 8. BACKWARD PASS
        # ==================================================

        target = (
            activation * feature_mask
        ).mean()

        model.model.zero_grad()

        target.backward()

        gradient = activation.grad

        if gradient is None:
            raise RuntimeError(
                "Grad-CAM gradient was not captured."
            )

        # ==================================================
        # 9. CREATE GRAD-CAM
        # ==================================================

        weights = gradient.mean(
            dim=(2, 3),
            keepdim=True,
        )

        cam = (
            weights * activation
        ).sum(dim=1)

        cam = torch.relu(cam)

        cam = (
            cam[0]
            .detach()
            .cpu()
            .numpy()
        )

        # ==================================================
        # 10. FEATURE MAP -> YOLO IMAGE SIZE
        # ==================================================

        cam = cv2.resize(
            cam,
            (
                img_size,
                img_size,
            ),
            interpolation=cv2.INTER_LINEAR,
        )

        # ==================================================
        # 11. REMOVE LETTERBOX PADDING
        # ==================================================

        cam = cam[
            top:top + new_height,
            left:left + new_width,
        ]

        if cam.size == 0:
            raise RuntimeError(
                "CAM became empty while "
                "removing padding."
            )

        # ==================================================
        # 12. RETURN TO ORIGINAL IMAGE SIZE
        # ==================================================

        cam = cv2.resize(
            cam,
            (
                width,
                height,
            ),
            interpolation=cv2.INTER_LINEAR,
        )

        # ==================================================
        # 13. CREATE SOFT DETECTION ROI
        # ==================================================

        roi = np.zeros(
            (
                height,
                width,
            ),
            dtype=np.float32,
        )

        yy, xx = np.mgrid[
            0:height,
            0:width,
        ]

        for detection in useful_detections:

            x1, y1, x2, y2 = map(
                float,
                detection["bbox"],
            )

            cx = (x1 + x2) / 2.0
            cy = (y1 + y2) / 2.0

            box_width = x2 - x1
            box_height = y2 - y1

            radius_x = max(
                box_width * HEATMAP_EXPANSION,
                25,
            )

            radius_y = max(
                box_height * HEATMAP_EXPANSION,
                25,
            )

            ellipse_distance = (
                ((xx - cx) / radius_x) ** 2
                +
                ((yy - cy) / radius_y) ** 2
            )

            region = np.exp(
                -2.0 * ellipse_distance
            ).astype(np.float32)

            roi = np.maximum(
                roi,
                region,
            )

        # ==================================================
        # 14. APPLY SOFT ROI
        # ==================================================

        cam = cam * roi

        # ==================================================
        # 15. BLUR
        # ==================================================

        blur_size = BLUR_SIZE

        if blur_size % 2 == 0:
            blur_size += 1

        cam = cv2.GaussianBlur(
            cam,
            (
                blur_size,
                blur_size,
            ),
            0,
        )

        # ==================================================
        # 16. NORMALIZE CAM
        # ==================================================

        valid = cam[
            roi > 0.15
        ]

        if valid.size > 0:

            low = np.percentile(
                valid,
                10,
            )

            high = np.percentile(
                valid,
                99,
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
            1.0,
        )

        # Soft fade around detections
        cam *= roi

        # ==================================================
        # 17. COLOR HEATMAP
        # ==================================================

        heatmap_uint8 = np.uint8(
            cam * 255
        )

        heatmap = cv2.applyColorMap(
            heatmap_uint8,
            cv2.COLORMAP_JET,
        )

        # ==================================================
        # 18. OVERLAY ON ORIGINAL X-RAY
        # ==================================================

        alpha = (
            cam * HEATMAP_ALPHA
        )

        alpha = alpha[
            :,
            :,
            np.newaxis,
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
            255,
        ).astype(
            np.uint8
        )

        # ==================================================
        # 19. SAVE
        # ==================================================

        output_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        output_path = (
            output_dir
            /
            f"{image_path.stem}-"
            f"heatmap.jpg"
        )

        success = cv2.imwrite(
            str(output_path),
            overlay,
        )

        if not success:
            raise RuntimeError(
                "Could not save heatmap."
            )

        return str(output_path)

    finally:

        hook_handle.remove()