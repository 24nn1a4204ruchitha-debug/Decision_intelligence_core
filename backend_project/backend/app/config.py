import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    # General App Config
    APP_NAME: str = "Adaptive Decision Intelligence Platform"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api"

    # Security & JWT
    SECRET_KEY: str = "antigravity-super-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite:///./decision_system.db"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        return ["*"]

    # ML & Decision Thresholds
    ANOMALY_CONTAMINATION: float = 0.10
    CONFIDENCE_THRESHOLD_AUTONOMOUS: float = 0.75
    CONFIDENCE_THRESHOLD_ESCALATION: float = 0.50
    HIGH_RISK_CONFIDENCE_MIN: float = 0.85

    # Storage
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")

    # Pluggable LLM Integration
    LLM_PROVIDER: str = "none"  # "openai", "gemini", "ollama", "none"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_BASE_URL: str = "https://api.openai.com/v1"

    # Live Simulation Demo
    SIMULATION_INTERVAL_SECONDS: int = 4
    SIMULATION_AUTO_START: bool = False


settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
