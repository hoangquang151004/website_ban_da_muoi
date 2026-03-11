from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Đèn Đá Muối Himalaya API"
    DEBUG: bool = False
    BACKEND_URL: str = "http://localhost:8000"  # Base URL for static files

    # Database
    DATABASE_URL: str = "mysql+aiomysql://root:password@localhost:3306/da_muoi_db"

    # JWT
    SECRET_KEY: str = "change-this-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # AI / LLM
    OPENAI_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""  # Gemini API key (tuỳ chọn)
    LLM_PROVIDER: str = "openai"  # "openai" | "gemini" | "ollama"
    LLM_MODEL: str = "gpt-4o-mini"  # Model name, thay đổi theo provider

    # Vector DB
    CHROMA_DB_PATH: str = "./chroma_db"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
