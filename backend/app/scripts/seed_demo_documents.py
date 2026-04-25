"""
Run from backend/ directory:
    python -m app.scripts.seed_demo_documents

Creates a demo PDF and a document record for Nadia's account.
Requires seed_demo_users to have been run first.
"""
import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import fitz
from sqlalchemy import select

from app.core.config import ORIGINAL_DIR
from app.core.database import SessionLocal
from app.models.document import Document
from app.models.user import User
from app.utils.helpers import generate_document_code

import app.models.organization     # noqa
import app.models.review           # noqa
import app.models.signature        # noqa
import app.models.share            # noqa
import app.models.log              # noqa
import app.models.saved_signature  # noqa
import app.models.user_token       # noqa


def _create_demo_pdf(path: str, title: str) -> None:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text(
        (72, 100),
        f"MEMO KERJA SAMA VENDOR\n\n"
        f"Judul     : {title}\n"
        f"Tanggal   : {datetime.utcnow().strftime('%d %B %Y')}\n\n"
        "Kepada Yth.\nPimpinan PT Mitra Teknologi Nusantara\n\n"
        "Dengan hormat,\n\n"
        "Sehubungan dengan rencana kerja sama pengadaan sistem informasi, kami bermaksud\n"
        "untuk menyampaikan draft memo ini sebagai dasar diskusi lebih lanjut.\n\n"
        "Poin-poin kesepakatan:\n"
        "1. Masa kerja sama: 12 bulan dengan opsi perpanjangan\n"
        "2. Nilai kontrak akan ditentukan setelah negosiasi teknis\n"
        "3. Hak dan kewajiban kedua pihak mengacu pada regulasi yang berlaku\n"
        "4. Penyelesaian sengketa melalui mediasi bersama\n\n"
        "Demikian memo ini kami sampaikan untuk ditindaklanjuti.\n\n"
        "Hormat kami,\nDepartemen Pengadaan",
        fontsize=11,
    )
    doc.save(path)
    doc.close()


def seed():
    db = SessionLocal()
    try:
        nadia = db.scalar(select(User).where(User.email == "nadia@lontarasign.local"))
        if not nadia:
            print("ERROR: Nadia tidak ditemukan. Jalankan seed_demo_users terlebih dahulu.")
            return

        title = "Draft Memo Kerja Sama Vendor"
        doc_code = generate_document_code()
        filename = f"{doc_code}_draft_memo_kerja_sama_vendor.pdf"
        file_path = str(ORIGINAL_DIR / filename)

        _create_demo_pdf(file_path, title)
        print(f"  [+] Demo PDF dibuat: {filename}")

        doc = Document(
            document_code=doc_code,
            title=title,
            original_file_name="draft_memo_kerja_sama_vendor.pdf",
            original_file_path=file_path,
            uploaded_by=nadia.id,
            status="draft_uploaded",
            current_version_label="v1",
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        print(f"  [+] Document record dibuat: {doc_code} (id={doc.id})")
        print(f"\nSelesai! Login sebagai nadia@lontarasign.local / password123")
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding demo documents...")
    seed()
