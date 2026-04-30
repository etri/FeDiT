"""
user_connectors package

사용자 정의 커넥터들을 포함하는 패키지입니다.

규칙:
1. 모든 커넥터는 {name}_connector.py 형태의 파일명
2. CONNECTOR_CONFIG와 transform_source_data 함수 필수
3. _template_connector.py를 복사하여 새 커넥터 작성
"""

__version__ = "1.0.0"
