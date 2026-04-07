from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """애플리케이션 설정 (환경변수에서 로드)"""

    # LLM 설정
    llm_provider: str = "gemini"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash-preview-05-20"
    anthropic_api_key: str = ""
    claude_model: str = "claude-sonnet-4-20250514"

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
