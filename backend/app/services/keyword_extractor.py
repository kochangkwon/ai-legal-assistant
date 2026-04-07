"""규칙 기반 키워드 추출 (LLM 미사용 — 비용 절감)"""

# 법률 분야별 키워드 매핑
CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "civil": ["계약", "손해배상", "채무", "채권", "불법행위", "대여금", "매매", "위약금"],
    "criminal": ["폭행", "사기", "절도", "횡령", "배임", "명예훼손", "모욕", "협박", "살인"],
    "family": ["이혼", "양육권", "위자료", "재산분할", "상속", "유류분", "친권", "면접교섭"],
    "labor": ["해고", "임금", "퇴직금", "근로계약", "산재", "부당해고", "체불", "야근", "수당"],
    "realestate": ["임대차", "보증금", "전세", "월세", "매매", "등기", "명도", "계약갱신"],
}

# 법률 용어 변환 사전 (구어체 → 법률 용어)
LEGAL_TERM_MAP: dict[str, str] = {
    "월급 안 줘": "임금 체불",
    "월급을 안 줘": "임금 체불",
    "급여 안 줘": "임금 체불",
    "보증금 안 줘": "보증금 반환",
    "보증금을 안 돌려": "보증금 반환",
    "보증금 못 받": "보증금 반환",
    "보증금 안 돌려": "보증금 반환",
    "잘렸어": "부당해고",
    "잘렸는데": "부당해고",
    "해고됐": "부당해고",
    "해고당했": "부당해고",
    "이혼하고 싶": "이혼 청구",
    "이혼하려": "이혼 청구",
    "집주인이 안 줘": "임대차 보증금 반환",
    "집주인이 안 돌려": "임대차 보증금 반환",
    "사기 당했": "사기죄",
    "사기를 당했": "사기죄",
    "맞았": "폭행죄",
    "때렸": "폭행죄",
    "돈 안 갚": "채무불이행",
    "돈을 안 갚": "채무불이행",
    "퇴직금 안 줘": "퇴직금 미지급",
    "퇴직금을 안 줘": "퇴직금 미지급",
    "야근수당": "연장근로수당",
    "산재": "산업재해",
    "전세 사기": "전세 보증금 사기",
    "전세금 못 받": "전세 보증금 반환",
    "계약 해지": "계약 해제",
    "위약금": "위약금 청구",
    "상속 포기": "상속 포기",
    "유산 분배": "상속 재산분할",
}

# 관련 법률명 매핑
CATEGORY_LAW_NAMES: dict[str, list[str]] = {
    "civil": ["민법"],
    "criminal": ["형법", "형사소송법"],
    "family": ["민법", "가사소송법"],
    "labor": ["근로기준법", "노동조합법"],
    "realestate": ["주택임대차보호법", "상가건물임대차보호법", "부동산등기법"],
}


def extract_keywords(message: str, category: str) -> list[str]:
    """사용자 메시지에서 법률 키워드를 규칙 기반으로 추출"""
    keywords: list[str] = []

    # 1. 법률 용어 변환 (구어체 → 법률 용어)
    for colloquial, legal in LEGAL_TERM_MAP.items():
        if colloquial in message:
            keywords.append(legal)

    # 2. 분야별 키워드 매칭
    for kw in CATEGORY_KEYWORDS.get(category, []):
        if kw in message:
            keywords.append(kw)

    # 3. 관련 법률명 추가
    for law_name in CATEGORY_LAW_NAMES.get(category, []):
        if law_name in message:
            keywords.append(law_name)

    # 4. fallback: 키워드가 없으면 메시지 자체를 검색어로 사용
    if not keywords:
        keywords = [message[:30]]

    return list(set(keywords))[:5]
