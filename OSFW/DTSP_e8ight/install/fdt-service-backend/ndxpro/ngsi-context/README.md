이 디렉터리에 NGSI-LD `@context` 파일(`fdt-twin-context-v1.0.1.jsonld` 등)을 넣는다.

`make bootstrap` 이 여기 있는 `*.jsonld` 를 `${REPO}/ngsi-context/` 로 복사하고,
httpd 컨테이너가 `http://${HOST}:${PORT_CONTEXT}/<파일명>` 으로 서빙한다.
`.env` 의 `FDT_CONTEXT` 가 이 URL 을 가리켜야 한다.
