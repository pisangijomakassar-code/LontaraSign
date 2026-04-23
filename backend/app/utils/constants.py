DOCUMENT_STATUSES = {
    "draft_uploaded",
    "reviewed_by_ai",
    "needs_revision",
    "approved",
    "pending_sign",
    "signed",
}
SIGN_METHODS = {"draw", "upload"}
SHARE_METHODS = {"link", "copy_link", "download", "email"}

BLOCKED_FILENAME_KEYWORDS = {"ktp", "npwp", "slip", "password", "medis", "rahasia"}
MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB
ALLOWED_MIME_TYPES = {"application/pdf"}
