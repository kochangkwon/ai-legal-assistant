import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class LawMCPService:
    """korean-law-mcp 서버 연동 서비스"""

    def __init__(self):
        self.mcp_url = settings.law_mcp_url

    async def _call_tool(self, tool_name: str, arguments: dict) -> dict[str, Any]:
        """MCP 도구 호출"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                self.mcp_url,
                json={
                    "jsonrpc": "2.0",
                    "method": "tools/call",
                    "params": {
                        "name": tool_name,
                        "arguments": arguments,
                    },
                    "id": 1,
                },
            )
            response.raise_for_status()
            return response.json()

    async def search_precedents(self, query: str, count: int = 5) -> list[dict]:
        """판례 검색"""
        try:
            result = await self._call_tool("search_precedents", {
                "query": query,
                "display": count,
            })
            return result.get("result", {}).get("content", [])
        except Exception as e:
            logger.error("판례 검색 실패 (query=%s): %s", query, e)
            return []

    async def get_precedent_text(self, prec_id: str) -> list[dict]:
        """판례 전문 조회"""
        try:
            result = await self._call_tool("get_precedent_text", {"id": prec_id})
            return result.get("result", {}).get("content", [])
        except Exception as e:
            logger.error("판례 전문 조회 실패 (id=%s): %s", prec_id, e)
            return []

    async def search_law(self, query: str) -> list[dict]:
        """법령 검색"""
        try:
            result = await self._call_tool("search_law", {"query": query})
            return result.get("result", {}).get("content", [])
        except Exception as e:
            logger.error("법령 검색 실패 (query=%s): %s", query, e)
            return []

    async def get_law_text(self, mst: str, jo: str | None = None) -> list[dict]:
        """법령 조문 조회"""
        try:
            args: dict[str, str] = {"mst": mst}
            if jo:
                args["jo"] = jo
            result = await self._call_tool("get_law_text", args)
            return result.get("result", {}).get("content", [])
        except Exception as e:
            logger.error("법령 조문 조회 실패 (mst=%s): %s", mst, e)
            return []

    async def find_similar_precedents(self, prec_id: str) -> list[dict]:
        """유사 판례 검색"""
        try:
            result = await self._call_tool("find_similar_precedents", {"id": prec_id})
            return result.get("result", {}).get("content", [])
        except Exception as e:
            logger.error("유사 판례 검색 실패 (id=%s): %s", prec_id, e)
            return []

    async def search_interpretations(self, query: str, count: int = 5) -> list[dict]:
        """법령해석례 검색"""
        try:
            result = await self._call_tool("search_interpretations", {
                "query": query,
                "display": count,
            })
            return result.get("result", {}).get("content", [])
        except Exception as e:
            logger.error("법령해석례 검색 실패 (query=%s): %s", query, e)
            return []

    async def summarize_precedent(self, prec_id: str) -> list[dict]:
        """판례 요약"""
        try:
            result = await self._call_tool("summarize_precedent", {"id": prec_id})
            return result.get("result", {}).get("content", [])
        except Exception as e:
            logger.error("판례 요약 실패 (id=%s): %s", prec_id, e)
            return []
