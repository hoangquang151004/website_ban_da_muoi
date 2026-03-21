from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Đèn Đá Muối Himalaya API"
    DEBUG: bool = False
    BACKEND_URL: str = "http://localhost:8000"  # Base URL for static files
    FRONTEND_URL: str = "http://localhost:3000"

    # Database
    DATABASE_URL: str = "mysql+aiomysql://root:password@localhost:3306/da_muoi_db"

    # JWT
    SECRET_KEY: str = "change-this-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # AI / LLM
    OPENAI_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""  # Gemini API key (tuỳ chọn)
    HF_TOKEN: str = ""  # HuggingFace API token
    LLM_PROVIDER: str = "openai"  # "openai" | "gemini" | "ollama" | "huggingface"
    LLM_MODEL: str = "gpt-4o-mini"  # Model name, thay đổi theo provider

    # Embeddings
    EMBEDDING_PROVIDER: str = "baseline"  # "baseline" | "gemini"
    EMBEDDING_MODEL: str = ""  # Optional override model name for selected provider
    EMBEDDING_BATCH_SIZE: int = 32

    # Vector DB
    CHROMA_DB_PATH: str = "./chroma_db"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # VNPay
    VNPAY_TMN_CODE: str = ""
    VNPAY_HASH_SECRET: str = ""
    VNPAY_PAYMENT_URL: str = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
    VNPAY_RETURN_URL: str = "http://localhost:8000/api/v1/payments/vnpay/return"
    VNPAY_ORDER_TYPE: str = "other"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
