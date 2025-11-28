import io
import json
from typing import Dict, Any, List, Optional
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import black, Color
from pypdf import PdfReader, PdfWriter
import os


def _register_default_fonts():
    # Register a Unicode-capable font if available; fallback to Helvetica
    # Try several common locations on Windows/Linux and project media folder.
    candidates = [
        # Project media fonts (recommended location)
        os.path.join(os.getcwd(), "backend", "media", "fonts", "DejaVuSans.ttf"),
        os.path.join(os.getcwd(), "media", "fonts", "DejaVuSans.ttf"),
        # Current working directory
        os.path.join(os.getcwd(), "DejaVuSans.ttf"),
        # Windows Arial Unicode MS
        os.path.join(os.environ.get("WINDIR", "C:\\Windows"), "Fonts", "arialuni.ttf"),
        # Linux common path
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/local/share/fonts/DejaVuSans.ttf",
    ]
    for path in candidates:
        try:
            if path and os.path.exists(path):
                pdfmetrics.registerFont(TTFont("DejaVu", path))
                return "DejaVu"
        except Exception:
            pass
    return "Helvetica"


def _as_float(value: Optional[Any], default: float) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except Exception:
        return default


def build_overlay(page_width: float, page_height: float, entries: List[Dict[str, Any]], grid: Dict[str, Any] | None = None) -> io.BytesIO:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=(page_width, page_height))
    font_name = _register_default_fonts()
    c.setFillColor(black)

    # Optional debug grid
    if grid and grid.get("enabled"):
        step = _as_float(grid.get("step", 50), 50.0)
        c.setStrokeColor(Color(0.8, 0.8, 0.8))
        c.setLineWidth(0.25)
        # Vertical lines
        x = 0.0
        while x <= page_width:
            c.line(x, 0, x, page_height)
            c.setFont(font_name, 6)
            c.drawString(x + 2, 2, f"{int(x)}")
            x += step
        # Horizontal lines
        y = 0.0
        while y <= page_height:
            c.line(0, y, page_width, y)
            c.setFont(font_name, 6)
            c.drawString(2, y + 2, f"{int(y)}")
            y += step

    def _wrap_lines(txt: str, max_width: float, font: str, font_size: float) -> List[str]:
        if not max_width or max_width <= 0:
            return [txt]
        words = txt.split()
        lines: List[str] = []
        cur = ""
        for w in words:
            candidate = (cur + " " + w).strip()
            width = pdfmetrics.stringWidth(candidate, font, font_size)
            if width <= max_width or not cur:
                cur = candidate
            else:
                lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        return lines

    for e in entries:
        text = str(e.get("text", ""))
        x = _as_float(e.get("x", 0), 0.0)
        y = _as_float(e.get("y", 0), 0.0)
        size = _as_float(e.get("size", 10), 10.0)
        max_width = _as_float(e.get("max_width", 0), 0.0)
        leading = _as_float(e.get("leading", max(2, size * 1.2)), max(2.0, size * 1.2))
        c.setFont(font_name, size)
        lines = _wrap_lines(text, max_width, font_name, size) if max_width else [text]
        for idx, line in enumerate(lines):
            c.drawString(x, y - idx * leading, line)

    c.showPage()
    c.save()
    buf.seek(0)
    return buf


def fill_pdf_template(template_pdf_path: str, output_pdf_path: str, context: Dict[str, Any], mapping: Dict[str, Any]) -> None:
    """
    Overlay text on a PDF template based on a mapping file structure:
    {
      "pages": [
        {
          "width": 595, "height": 842,  # optional; auto-read from template if missing
          "fields": [
            {"name": "project_name", "x": 100, "y": 700, "size": 11},
            {"name": "act_date", "x": 450, "y": 700, "size": 11}
          ]
        },
        { "fields": [ ... ] }
      ]
    }
    Coordinates are in PDF points from bottom-left.
    """
    reader = PdfReader(template_pdf_path)
    writer = PdfWriter()

    pages_map = mapping.get("pages", [])
    num_pages = len(reader.pages)

    for i in range(num_pages):
        base_page = reader.pages[i]
        base_width = float(base_page.mediabox.width)
        base_height = float(base_page.mediabox.height)

        page_cfg = pages_map[i] if i < len(pages_map) else {"fields": []}
        page_width = _as_float(page_cfg.get("width", base_width), base_width)
        page_height = _as_float(page_cfg.get("height", base_height), base_height)

        # Build overlay entries from context
        entries: List[Dict[str, Any]] = []
        debug_names = False
        try:
            if isinstance(mapping, dict):
                debug_names = bool(mapping.get("debug_names"))
        except Exception:
            debug_names = False
        for f in page_cfg.get("fields", []):
            name = f.get("name")
            if not name:
                continue
            value = None
            if debug_names:
                value = f.get("label") or name
            else:
                if name in context and context.get(name) not in (None, ""):
                    value = context.get(name)
            if value is not None:
                entries.append({
                    "text": str(value),
                    "x": f.get("x", 0),
                    "y": f.get("y", 0),
                    "size": f.get("size", 10),
                    "max_width": f.get("max_width"),
                    "leading": f.get("leading"),
                })

        grid_cfg = mapping.get("grid") if isinstance(mapping, dict) else None
        if entries or (grid_cfg and grid_cfg.get("enabled")):
            overlay_buf = build_overlay(page_width, page_height, entries, grid_cfg)
            overlay_reader = PdfReader(overlay_buf)
            overlay_page = overlay_reader.pages[0]
            base_page.merge_page(overlay_page)

        writer.add_page(base_page)

    with open(output_pdf_path, "wb") as f:
        writer.write(f)
