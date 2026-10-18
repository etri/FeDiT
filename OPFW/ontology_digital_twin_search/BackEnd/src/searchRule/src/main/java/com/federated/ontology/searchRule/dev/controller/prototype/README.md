# Neo4j 접근 방식 프로토타입 비교

## 방식 A: @Node OGM (ogm 패키지)
- JPA 스타일, 엔티티 클래스 + Repository
- `digitalTwinRepository.save(node)` 한 줄로 저장

## 방식 B: Cypher 직접 (cypher 패키지)
- 기존 GraphServiceImpl과 동일한 패턴
- `neo4jClient.query("MERGE ...").bind(...).run()` 으로 저장

## 공통 (common 패키지)
- NGSI-LD JSON → 플랫 데이터 변환 유틸
- ThreadPool 설정
- 실패 로거
