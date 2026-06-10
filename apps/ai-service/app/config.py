from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        protected_namespaces=(),  # allow field names starting with 'model_'
    )

    model_name: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "info"


settings = Settings()
