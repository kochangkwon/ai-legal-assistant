from __future__ import annotations

"""LLM API 일일 사용량 추적 (무료 티어 한도 관리)"""

import asyncio
import logging
from datetime import date

logger = logging.getLogger(__name__)


class UsageTracker:
    """일일 API 호출 횟수 추적 (동시성 안전)"""

    def __init__(self, daily_limit: int = 240):
        self.daily_count = 0
        self.daily_limit = daily_limit  # 250에서 여유분 10 확보
        self.last_reset = date.today()
        self._lock = asyncio.Lock()

    def _check_reset(self) -> None:
        """날짜가 바뀌면 카운트 리셋"""
        if date.today() > self.last_reset:
            logger.info("일일 사용량 리셋 (어제: %d회)", self.daily_count)
            self.daily_count = 0
            self.last_reset = date.today()

    async def try_consume(self) -> bool:
        """호출 가능 여부 확인 + 기록을 원자적으로 수행. 성공 시 True."""
        async with self._lock:
            self._check_reset()
            if self.daily_count >= self.daily_limit:
                return False
            self.daily_count += 1
            if self.daily_count % 50 == 0:
                logger.info("LLM 사용량: %d/%d", self.daily_count, self.daily_limit)
            return True

    async def remaining(self) -> int:
        """남은 호출 횟수"""
        async with self._lock:
            self._check_reset()
            return max(0, self.daily_limit - self.daily_count)


# 싱글톤 인스턴스
usage_tracker = UsageTracker()
