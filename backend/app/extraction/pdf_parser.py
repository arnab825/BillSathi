import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
import fitz  # PyMuPDF
from PIL import Image

logger = logging.getLogger(__name__)


class TextSpan:
    def __init__(self, text: str, bbox: List[float], page: int):
        self.text = text
        self.bbox = bbox  # [x0, y0, x1, y1] in points
        self.page = page

    def to_dict(self) -> Dict[str, Any]:
        return {
            "text": self.text,
            "bbox": [round(b, 2) for b in self.bbox],
            "page": self.page,
        }


class ParsedDocument:
    def __init__(
        self,
        raw_text: str,
        spans: List[TextSpan],
        page_count: int,
        page_previews: List[str],
        page_dimensions: List[Dict[str, float]],
    ):
        self.raw_text = raw_text
        self.spans = spans
        self.page_count = page_count
        self.page_previews = page_previews  # relative file paths of rendered page images
        self.page_dimensions = page_dimensions


def parse_pdf_document(file_path: Path, preview_dir: Path, doc_id: str) -> ParsedDocument:
    """
    Parses a PDF file using PyMuPDF.
    Extracts text blocks, word bounding boxes, renders page previews to PNG,
    and returns full structured text with spatial coordinates.
    """
    doc = fitz.open(str(file_path))
    spans: List[TextSpan] = []
    full_text_parts: List[str] = []
    page_previews: List[str] = []
    page_dimensions: List[Dict[str, float]] = []

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        page_num = page_idx + 1
        rect = page.rect
        page_dimensions.append({"width": rect.width, "height": rect.height, "page": page_num})

        # Render page preview to high-res PNG for frontend evidence viewer
        preview_filename = f"{doc_id}_page_{page_num}.png"
        preview_path = preview_dir / preview_filename
        pix = page.get_pixmap(dpi=150)
        pix.save(str(preview_path))
        page_previews.append(preview_filename)

        # Extract text blocks & words with bounding boxes
        blocks = page.get_text("blocks")
        for b in blocks:
            # b: (x0, y0, x1, y1, text, block_no, block_type)
            if len(b) >= 5:
                text = b[4].strip()
                if text:
                    bbox = [float(b[0]), float(b[1]), float(b[2]), float(b[3])]
                    spans.append(TextSpan(text=text, bbox=bbox, page=page_num))
                    full_text_parts.append(text)

    full_text = "\n".join(full_text_parts)
    return ParsedDocument(
        raw_text=full_text,
        spans=spans,
        page_count=len(doc),
        page_previews=page_previews,
        page_dimensions=page_dimensions,
    )


def parse_image_document(file_path: Path, preview_dir: Path, doc_id: str) -> ParsedDocument:
    """
    Parses an image file (PNG/JPEG).
    Generates preview image and creates initial text spans.
    """
    img = Image.open(str(file_path))
    preview_filename = f"{doc_id}_page_1.png"
    preview_path = preview_dir / preview_filename
    img.save(str(preview_path), format="PNG")

    page_dimensions = [{"width": float(img.width), "height": float(img.height), "page": 1}]
    spans: List[TextSpan] = []
    raw_text = ""

    # If tesseract / pytesseract is available, OCR it. Otherwise wrap in placeholder or PyMuPDF OCR
    try:
        import pytesseract
        raw_text = pytesseract.image_to_string(img).strip()
        ocr_data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
        n_boxes = len(ocr_data['text'])
        for i in range(n_boxes):
            word = ocr_data['text'][i].strip()
            if word:
                x = float(ocr_data['left'][i])
                y = float(ocr_data['top'][i])
                w = float(ocr_data['width'][i])
                h = float(ocr_data['height'][i])
                spans.append(TextSpan(text=word, bbox=[x, y, x + w, y + h], page=1))
        if not raw_text:
            raw_text = f"Image document: {file_path.name}"
    except Exception as e:
        logger.info(f"Tesseract OCR not installed or failed ({e}); image stored with standard image dimensions.")
        raw_text = f"Image document: {file_path.name}"

    return ParsedDocument(
        raw_text=raw_text,
        spans=spans,
        page_count=1,
        page_previews=[preview_filename],
        page_dimensions=page_dimensions,
    )
