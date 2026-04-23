import fitz  # PyMuPDF
from pathlib import Path


def extract_text_from_pdf(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    text = "".join(page.get_text() for page in doc)
    doc.close()
    return text.strip()


def embed_signature_to_pdf(
    original_pdf_path: str,
    sign_image_path: str,
    output_path: str,
    page: str | int = "last",
    x: float = 380,
    y: float = 120,
    width: float = 150,
    height: float = 60,
) -> str:
    doc = fitz.open(original_pdf_path)
    total_pages = len(doc)

    if page == "last" or page == -1:
        page_idx = total_pages - 1
    else:
        page_idx = max(0, min(int(page) - 1, total_pages - 1))

    pg = doc[page_idx]
    rect = fitz.Rect(x, y, x + width, y + height)
    pg.insert_image(rect, filename=sign_image_path)

    doc.save(output_path)
    doc.close()
    return output_path
