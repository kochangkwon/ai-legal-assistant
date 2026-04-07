"""LLM API 일일 사용량 추적 (무료 티어 한도 관리)"""

import logging
from datetime import date

logger = logging.getLogger(__name__)


class UsageTracker:
    """일일 API 호출 횟수 추적"""

    def __init__(self, daily_limit: int = 240):
        self.daily_count = 0
        self.daily_limit = daily_limit  # 250에서 여유분 10 확보
        self.last_reset = date.today()

    def _check_reset(self) -> None:
        """날짜가 바뀌면 카운트 리셋"""
        if date.today() > self.last_reset:
            logger.info("일일 사용량 리셋 (어제: %d회)", self.daily_count)
            self.daily_count = 0
            self.last_reset = date.today()

    def can_call(self) -> bool:
        """API 호출 가능 여부"""
        self._check_reset()
        return self.daily_count < self.daily_limit

    def record_call(self) -> None:
        """호출 1회 기록"""
        self._check_reset()
        self.daily_count += 1
        if self.daily_count % 50 == 0:
            logger.info("LLM 사용량: %d/%d", self.daily_count, self.daily_limit)

    def remaining(self) -> int:
        """남은 호출 횟수"""
        self._check_reset()
        return max(0, self.daily_limit - self.daily_count)


# 싱글톤 인스턴스
usage_tracker = UsageTracker()
