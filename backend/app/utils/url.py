"""URL utility functions."""
from app.core.config import settings


def make_absolute_url(path: str | None) -> str | None:
    """Convert relative path to absolute URL.
    
    Args:
        path: Relative path like '/static/uploads/image.png'
    
    Returns:
        Full URL like 'http://localhost:8000/static/uploads/image.png'
    """
    if not path:
        return None
    
    if path.startswith("http://") or path.startswith("https://"):
        return path
    
    return f"{settings.BACKEND_URL}{path}"
