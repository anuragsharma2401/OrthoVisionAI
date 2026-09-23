import base64
from io import BytesIO
import json
import os
from pathlib import Path

import requests

DEFAULT_GEMINI_MODELS = "gemini-3.6-flash,gemini-3.5-flash-lite"


class GeminiNotConfiguredError(RuntimeError):
    pass


def enrich_xray_analysis(image_path: str, ml_result: dict) -> dict:
    prompt = f"""
You are assisting OrthoVision AI. YOLO is the primary detector. Do not invent a YOLO detection.
Given the YOLO output below and the X-ray image, return JSON only with:
body_region, finding, severity, explanation, recovery_information, home_care_guidance, warning_guidance, uncertainty_notes.
If body region is not visually clear, say "Not clearly identifiable".
If recovery guidance is general, say it is general and clinician review is required.
YOLO output: {json.dumps(ml_result, ensure_ascii=False)}
"""
    return _generate_json(prompt, file_path=image_path, mime_type=_mime_type(image_path))


def analyze_medical_report(file_path: str) -> dict:
    prompt = """
Analyze this uploaded medical report for OrthoVision AI. Return JSON only with:
report_type, key_findings (array), explanation, severity, recovery_information,
home_care_guidance, warning_guidance, uncertainty_notes.
Do not provide a definitive diagnosis. Explain in patient-friendly language and recommend clinician review.
"""
    return _generate_json(prompt, file_path=file_path, mime_type=_mime_type(file_path))


def _generate_json(prompt: str, file_path: str | None = None, mime_type: str | None = None) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise GeminiNotConfiguredError("GEMINI_API_KEY is not configured.")

    parts = [{"text": prompt}]
    if file_path:
        path = Path(file_path)
        encoded_file, resolved_mime_type = _encode_file_for_gemini(path, mime_type)
        parts.append({
            "inline_data": {
                "mime_type": resolved_mime_type,
                "data": encoded_file,
            }
        })

    payload = {
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": {
            "temperature": 0.2,
            "response_mime_type": "application/json",
        },
    }

    response = None
    errors = []
    timeout_seconds = int(os.getenv("GEMINI_TIMEOUT_SECONDS", "20"))

    for model in _gemini_models():
        try:
            response = requests.post(
                _gemini_url(model),
                params={"key": api_key},
                json=payload,
                timeout=timeout_seconds,
            )
        except requests.Timeout:
            errors.append(f"Gemini model '{model}' timed out after {timeout_seconds}s.")
            continue
        except requests.RequestException as exc:
            errors.append(f"Gemini model '{model}' request failed: {exc}")
            continue

        if response.status_code < 400:
            break

        errors.append(_gemini_error_message(response, model))

        if response.status_code not in {404, 429, 503}:
            break

    if response is None or response.status_code >= 400:
        raise RuntimeError(" | ".join(errors) or "Gemini API request failed.")

    text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
    return json.loads(text)


def _encode_file_for_gemini(path: Path, mime_type: str | None) -> tuple[str, str]:
    resolved_mime_type = mime_type or _mime_type(str(path))

    if resolved_mime_type.startswith("image/"):
        try:
            from PIL import Image

            max_size = int(os.getenv("GEMINI_IMAGE_MAX_SIZE", "768"))
            quality = int(os.getenv("GEMINI_IMAGE_QUALITY", "72"))
            with Image.open(path) as image:
                image = image.convert("RGB")
                image.thumbnail((max_size, max_size))
                buffer = BytesIO()
                image.save(buffer, format="JPEG", quality=quality, optimize=True)
                return base64.b64encode(buffer.getvalue()).decode("utf-8"), "image/jpeg"
        except Exception:
            pass

    return base64.b64encode(path.read_bytes()).decode("utf-8"), resolved_mime_type


def _gemini_models() -> list[str]:
    configured_models = os.getenv("GEMINI_MODELS") or os.getenv("GEMINI_MODEL") or DEFAULT_GEMINI_MODELS
    return [model.strip() for model in configured_models.split(",") if model.strip()]


def _gemini_url(model: str) -> str:
    return f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


def _gemini_error_message(response: requests.Response, model: str) -> str:
    try:
        detail = response.json().get("error", {}).get("message")
    except ValueError:
        detail = response.text

    if response.status_code == 404:
        return (
            f"Gemini model '{model}' was not found or is not enabled for this API key. "
            "Set GEMINI_MODELS to available model names for your key. "
            f"Google response: {detail}"
        )

    return f"Gemini model '{model}' failed with HTTP {response.status_code}: {detail}"


def _mime_type(file_path: str) -> str:
    suffix = Path(file_path).suffix.lower()
    if suffix in {".jpg", ".jpeg"}:
        return "image/jpeg"
    if suffix == ".png":
        return "image/png"
    if suffix == ".pdf":
        return "application/pdf"
    return "application/octet-stream"
