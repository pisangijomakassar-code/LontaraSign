import base64

import fitz  # PyMuPDF


def _resolve_page_index(doc: fitz.Document, page) -> int:
    total = len(doc)
    if page == "last" or page == -1:
        return total - 1
    return max(0, min(int(page) - 1, total - 1))


def render_page_to_png(pdf_path: str, page="last", zoom: float = 1.5) -> tuple[bytes, float, float, int]:
    """Render halaman PDF ke PNG.

    PENTING: `page_width/height` yang dikembalikan adalah ukuran *cropbox*
    (area yang benar-benar terlihat oleh user), bukan mediabox. Ini harus
    konsisten dengan `embed_signature_to_pdf` agar posisi signature yang
    dikirim frontend tidak bergeser saat di-embed ke PDF.

    Return: (img_bytes, page_width, page_height, total_pages)
    """
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    idx = _resolve_page_index(doc, page)
    pg = doc[idx]

    # cropbox = area yg tampil; sudah memperhitungkan rotation lewat pg.rect
    # Untuk konsistensi: render pakai pg.rect (sama dgn cropbox setelah rotasi).
    page_rect = pg.rect  # rotated, cropped
    page_width = page_rect.width
    page_height = page_rect.height

    mat = fitz.Matrix(zoom, zoom)
    pix = pg.get_pixmap(matrix=mat, alpha=False)
    img_bytes = pix.tobytes("png")
    doc.close()
    return img_bytes, page_width, page_height, total_pages


def extract_text_from_pdf(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    text = "".join(page.get_text() for page in doc)
    doc.close()
    return text.strip()


def render_review_images(pdf_path: str, text: str = "", max_pages: int = 3, zoom: float = 1.0) -> list[str]:
    """Render halaman penting dokumen jadi PNG base64 untuk AI vision review.

    Strategi pemilihan halaman (hemat biaya token gambar):
    - Dokumen digital normal → cukup halaman PERTAMA (kop/nomor/pihak) + TERAKHIR
      (tempat tanda tangan/stempel biasanya berada).
    - Dokumen hasil scan (teks sangat sedikit per halaman) → ambil beberapa
      halaman awal karena teks tidak bisa diandalkan sama sekali.

    Tanda tangan, paraf, dan stempel umumnya berupa GAMBAR — tidak muncul di
    hasil ekstraksi teks — sehingga halaman gambar wajib disertakan agar AI tidak
    salah menyimpulkan "tidak ada tanda tangan".

    Return: list string base64 PNG (tanpa prefix `data:`). Kosong bila gagal.
    """
    try:
        doc = fitz.open(pdf_path)
    except Exception:
        return []
    try:
        total = len(doc)
        if total == 0:
            return []
        chars_per_page = (len(text) / total) if total else 0
        is_scan = chars_per_page < 80  # teks sangat tipis → kemungkinan besar scan/gambar

        if is_scan:
            idxs = list(range(min(total, max_pages)))
        else:
            # halaman pertama + terakhir (dedupe untuk dokumen 1 halaman)
            idxs = sorted({0, total - 1})

        mat = fitz.Matrix(zoom, zoom)
        out: list[str] = []
        for i in idxs:
            pix = doc[i].get_pixmap(matrix=mat, alpha=False)
            out.append(base64.b64encode(pix.tobytes("png")).decode("ascii"))
        return out
    except Exception:
        return []
    finally:
        doc.close()


def embed_signature_to_pdf(
    original_pdf_path: str,
    sign_image_path: str,
    output_path: str,
    page="last",
    x: float = 380,
    y: float = 120,
    width: float = 150,
    height: float = 60,
) -> str:
    """Tempel gambar signature ke PDF.

    Koordinat (x, y) = top-left signature, relatif terhadap cropbox halaman
    (sama dengan yang dipakai `render_page_to_png`). Fungsi ini menggeser
    rect ke koordinat mediabox bila cropbox offset ≠ (0,0).
    """
    doc = fitz.open(original_pdf_path)
    page_idx = _resolve_page_index(doc, page)
    pg = doc[page_idx]

    # Debug: log koordinat aktual untuk diagnosis position shift
    import sys
    print(
        f"[SIGN] page={page_idx} page.rect={pg.rect} "
        f"cropbox={pg.cropbox} mediabox={pg.mediabox} "
        f"rotation={pg.rotation} "
        f"sig_rect=({x},{y},{x+width},{y+height})",
        file=sys.stderr, flush=True,
    )

    # Koordinat frontend sudah dalam sistem yang sama dengan pg.rect
    # (top-left origin, mengikuti page rotation & cropping yang ditampilkan di preview).
    rect = fitz.Rect(x, y, x + width, y + height)
    pg.insert_image(rect, filename=sign_image_path)

    # garbage=4 + clean=True + deflate=True → rewrite xref table & buang orphan objects.
    try:
        doc.save(output_path, garbage=4, clean=True, deflate=True)
    except Exception:
        import io
        buf = io.BytesIO()
        doc.save(buf, garbage=4, clean=True, deflate=True)
        doc.close()
        repaired = fitz.open(stream=buf.getvalue(), filetype="pdf")
        repaired.save(output_path, garbage=4, clean=True, deflate=True)
        repaired.close()
        return output_path
    doc.close()
    return output_path
