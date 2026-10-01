from html import escape
from pathlib import Path


def build_analysis_report_html(user, analysis: dict, image_url: str | None = None, heatmap_url: str | None = None,) -> str:
    return f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>OrthoVision AI Analysis Report</title>
  <style>
    body {{ font-family: Inter, Arial, sans-serif; color: #102033; margin: 40px; line-height: 1.55; }}
    .brand {{ display:flex; align-items:center; gap:12px; color:#0b4f8a; }}
    .logo {{ width:42px; height:42px; border-radius:14px; background:linear-gradient(135deg,#0b4f8a,#06b6d4); }}
    h1 {{ margin: 0; font-size: 28px; }}
    h2 {{ margin-top: 28px; color:#0b4f8a; }}
    .grid {{ display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:14px; margin-top:24px; }}
    .card {{ border:1px solid #d9e5f2; border-radius:16px; padding:16px; background:#f8fbff; }}
    .label {{ display:block; color:#667085; font-size:12px; text-transform:uppercase; letter-spacing:.08em; }}
    img {{ max-width: 100%; border-radius: 18px; border: 1px solid #d9e5f2; }}

.image-comparison {{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: 100%;
  margin-top: 16px;
}}

.image-card {{
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid #d9e5f2;
  border-radius: 10px;
  padding: 8px;
  background: #f8fbff;
}}

.image-card h3 {{
  margin: 0 0 6px;
  color: #0b4f8a;
  font-size: 13px;
}}

.image-card img {{
  display: block;
  width: 100%;
  max-width: 100%;
  height: 220px;
  object-fit: contain;
  box-sizing: border-box;
  border-radius: 6px;
  border: 1px solid #d9e5f2;
}}

@media print {{
  @page {{
    size: A4 portrait;
    margin: 10mm;
  }}

  body {{
    margin: 0;
    width: auto;
  }}

  .image-comparison {{
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px;
    width: 100%;
    page-break-inside: avoid;
    break-inside: avoid;
  }}

  .image-card {{
    width: 100%;
    min-width: 0;
    padding: 6px;
    box-sizing: border-box;
    page-break-inside: avoid;
    break-inside: avoid;
  }}

  .image-card img {{
    width: 100%;
    max-width: 100%;
    height: 220px;
    object-fit: contain;
  }}
}}

@media (max-width: 800px) {{
  .image-comparison {{
    grid-template-columns: 1fr;
  }}
}}

.disclaimer {{
  margin-top: 30px;
  padding: 16px;
  border-radius: 16px;
  background: #fff7ed;
  color: #9a3412;
}}</style>
</head>
<body>
  <div class="brand"><div class="logo"></div><div><h1>OrthoVision AI Analysis Report</h1><p>AI-assisted orthopedic image interpretation</p></div></div>
  <div class="grid">
    {field("Patient", getattr(user, "full_name", "User"))}
    {field("Email", getattr(user, "email", ""))}
    {field("Analysis Date", analysis.get("created_at", ""))}
    {field("Confidence", analysis.get("confidence", "Not available"))}
    {field("Detected Region / Bone", analysis.get("detected_bone", "Not clearly identifiable"))}
    {field("Finding", analysis.get("prediction") or analysis.get("finding", "Not available"))}
    {field("Severity", analysis.get("severity", "Not specified"))}
    {field("Status", analysis.get("status", "completed"))}
  </div>
  <h2>AI Explanation</h2>
  <p>{escape(analysis.get("explanation") or analysis.get("summary") or "No explanation available.")}</p>
  <h2>Recovery / Home-Care Guidance</h2>
  <p>{escape(analysis.get("recovery_guidance") or "No recovery guidance available.")}</p>
  <p>{escape(analysis.get("home_care_guidance") or "")}</p>
  <h2>When To Seek Medical Care</h2>
  <p>{escape(analysis.get("warning_guidance") or "Seek professional medical evaluation for pain, swelling, deformity, numbness, worsening symptoms, or any urgent concern.")}</p>
  {image_comparison_block(image_url, heatmap_url)}
  <div class="disclaimer">
    This report is AI-generated for educational and supportive purposes only. It does not replace evaluation,
    diagnosis, or treatment by a qualified healthcare professional.
  </div>
</body>
</html>"""


def field(label: str, value) -> str:
    return f'<div class="card"><span class="label">{escape(label)}</span><strong>{escape(str(value or "Not available"))}</strong></div>'


def image_comparison_block(
    image_url: str | None,
    heatmap_url: str | None,
) -> str:
    if not image_url and not heatmap_url:
        return ""

    images = []

    if image_url:
        images.append(
            f"""
            <div class="image-card">
              <h3>Annotated X-ray</h3>
              <img src="{escape(image_url)}" alt="Annotated X-ray" />
            </div>
            """
        )

    if heatmap_url:
        images.append(
            f"""
            <div class="image-card">
              <h3>AI Explainable Heatmap</h3>
              <img src="{escape(heatmap_url)}" alt="AI explainable heatmap" />
            </div>
            """
        )

    return f"""
    <h2>Visual Analysis</h2>
    <div class="image-comparison">
      {"".join(images)}
    </div>
    """