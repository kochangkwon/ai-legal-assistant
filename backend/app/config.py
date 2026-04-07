from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """애플리케이션 설정 (환경변수에서 로드)"""

    # Claude API
    anthropic_api_key: str

    # korean-law-mcp
    law_oc: str = ""
    law_mcp_url: str = "http://localhost:3000/mcp"

    # Supabase
    supabase_url: str
    supabase_key: str
    supabase_service_role_key: str = ""

    # 앱 설정
    app_name: str = "AI Legal Assistant"
    debug: bool = False
    cors_origins: str = "http://localhost:8081,http://localhost:19006"
    rate_limit: str = "10/minute"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
