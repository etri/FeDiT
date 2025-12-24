"""
test.py — RAG 검색 체인 테스트 스크립트 (sleep 포함)
-------------------------------------------------
hybrid_chain(question) 호출을 통해
LLM → Elasticsearch → LLM 응답 생성까지의 전체 과정을 검증합니다.
"""

import json
import time
from rag.chain import hybrid_chain  # RAG 체인 함수 직접 호출

if __name__ == "__main__":
    print("\n🚀 RAG 테스트 시작...\n")

    # ✅ 테스트용 질문 리스트
    test_questions = [
        "온도 키워드로 검색",
    ]

    # 질문 사이 대기 시간 (초)
    SLEEP_SEC = 5

    for i, q in enumerate(test_questions, start=1):
        print("=" * 80)
        print(f"[{i}] 질문: {q}")
        print("=" * 80)

        try:
            result = hybrid_chain(q)

            print("\n[생성된 검색 쿼리]")
            print(json.dumps(result.get("query", {}), ensure_ascii=False, indent=2))

            print("\n[검색 결과 개수]")
            print(result.get("result_count", 0))

            print("\n[LLM 응답 요약 텍스트]")
            print(result.get("answer_text", "응답 없음"))
            print("\n" + "-" * 80 + "\n")

        except Exception as e:
            print(f"[ERROR] 테스트 중 예외 발생: {e}\n")

        # 질문 사이 대기
        if i < len(test_questions):
            print(f"⏳ 다음 테스트까지 {SLEEP_SEC}초 대기 중...\n")
            time.sleep(SLEEP_SEC)

    print("\n✅ 모든 RAG 테스트 완료!\n")
