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

    # MoMo Payment Gateway
    MOMO_PARTNER_CODE: str = ""
    MOMO_ACCESS_KEY: str = ""
    MOMO_SECRET_KEY: str = ""
    MOMO_PARTNER_NAME: str = "Himalayan Glow"
    MOMO_STORE_ID: str = "HimalayanGlow"
    MOMO_ENDPOINT: str = "https://test-payment.momo.vn/v2/gateway/api/create"
    MOMO_RETURN_URL: str = "http://localhost:8000/api/v1/payments/momo/return"
    MOMO_IPN_URL: str = "http://localhost:8000/api/v1/payments/momo/ipn"
    # captureWallet = quét QR ví MoMo | payWithATM = thẻ/ATM, nhập TK ngân hàng
    MOMO_REQUEST_TYPE: str = "payWithATM"
    # Tên biến cũ (tương thích .env có sẵn)
    MOMO_API_URL: str = ""
    MOMO_NOTIFY_URL: str = ""

    @property
    def momo_create_endpoint(self) -> str:
        return self.MOMO_ENDPOINT or self.MOMO_API_URL

    @property
    def momo_ipn_endpoint(self) -> str:
        return self.MOMO_IPN_URL or self.MOMO_NOTIFY_URL

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
