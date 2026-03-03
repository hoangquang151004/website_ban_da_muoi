"""Tiện ích tạo slug từ chuỗi tiếng Việt / tiếng Anh."""
import re
import unicodedata


def slugify(text: str) -> str:
    """Chuyển chuỗi sang dạng slug ASCII, chữ thường, dùng dấu gạch ngang."""
    # Normalize Unicode → tách diacritics
    text = unicodedata.normalize("NFKD", text)
    # Encode ASCII, bỏ các ký tự không phải ASCII
    text = text.encode("ascii", "ignore").decode("ascii")
    # Lowercase
    text = text.lower()
    # Thay ký tự không phải chữ/số bằng dấu gạch ngang
    text = re.sub(r"[^a-z0-9]+", "-", text)
    # Bỏ dấu gạch ngang đầu/cuối
    text = text.strip("-")
    return text or "item"


async def unique_slug(base: str, exists_fn) -> str:
    """
    Tạo slug unique bằng cách thêm hậu tố số nếu cần.

    ``exists_fn(slug: str) -> bool`` — hàm async kiểm tra slug đã tồn tại chưa.
    """
    slug = slugify(base)
    candidate = slug
    counter = 1
    while await exists_fn(candidate):
        candidate = f"{slug}-{counter}"
        counter += 1
    return candidate
