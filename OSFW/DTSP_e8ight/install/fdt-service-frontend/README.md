# fdt-service-frontend

연합트윈 화면(`union-twin-fe`)과 자체 서버인 BFF(`union-twin-be`).

환경변수는 상위 디렉터리의 `.env` 를 쓴다. 전체 설치 안내는 [../README.md](../README.md).

**백엔드를 먼저 올려야 한다.** BFF 가 백엔드의 PostgreSQL(`union_twin` DB)을 사용한다.

```bash
./install/1-front.sh            # 프록시 뒤에서 동작 (포트 비공개)
./install/1-front.sh --expose   # 프록시 없이 화면 포트를 직접 공개
./install/1-front.sh --nginx    # 리버스 프록시까지 함께
./install/9-clean.sh            # 프론트만 내리기
```

접속: `PUBLIC_URL` + `/signin` → `admin@e8ight.co.kr` / `ADMIN_SEED_PASSWORD`

| 폴더 | 내용 |
|---|---|
| `front/` | 화면 + BFF compose. `compose-expose.yml`(포트 공개), `compose-local.yml`(로컬 개발), `compose-watchtower.yml`(자동 갱신, 기본 비활성) |
| `nginx/` | 리버스 프록시 compose 와 설정 파일 |
| `scripts/` | 컨테이너 교체 |
