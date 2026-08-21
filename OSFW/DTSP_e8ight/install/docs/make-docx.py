# -*- coding: utf-8 -*-
from docx import Document
from docx.shared import Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

KR = "맑은 고딕"
MONO = "Consolas"

doc = Document()

# 기본 스타일
st = doc.styles["Normal"]
st.font.name = KR
st.font.size = Pt(10.5)
st.element.rPr.rFonts.set(qn("w:eastAsia"), KR)
st.paragraph_format.space_after = Pt(4)
st.paragraph_format.line_spacing = 1.35

sec = doc.sections[0]
sec.top_margin = Cm(2.2); sec.bottom_margin = Cm(2.2)
sec.left_margin = Cm(2.4); sec.right_margin = Cm(2.4)

def shade(el, color):
    sh = OxmlElement("w:shd")
    sh.set(qn("w:val"), "clear"); sh.set(qn("w:color"), "auto"); sh.set(qn("w:fill"), color)
    el.append(sh)

def title(text, size=20):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0); p.paragraph_format.space_after = Pt(2)
    r = p.add_run(text); r.bold = True; r.font.size = Pt(size); r.font.name = KR
    r._element.rPr.rFonts.set(qn("w:eastAsia"), KR)
    return p

def h1(text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(18); p.paragraph_format.space_after = Pt(6)
    r = p.add_run(text); r.bold = True; r.font.size = Pt(13); r.font.name = KR
    r._element.rPr.rFonts.set(qn("w:eastAsia"), KR)
    pPr = p._p.get_or_add_pPr()
    bd = OxmlElement("w:pBdr"); bt = OxmlElement("w:bottom")
    bt.set(qn("w:val"),"single"); bt.set(qn("w:sz"),"6"); bt.set(qn("w:color"),"9AA5A6")
    bt.set(qn("w:space"),"3"); bd.append(bt); pPr.append(bd)
    return p

def step(text):
    """'~ 디렉토리 이동', '~ 실행' 같은 설명 줄"""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10); p.paragraph_format.space_after = Pt(3)
    r = p.add_run(text); r.bold = True; r.font.size = Pt(10.5); r.font.name = KR
    r._element.rPr.rFonts.set(qn("w:eastAsia"), KR)
    return p

def cmd(*lines):
    for ln in lines:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Cm(0.5)
        p.paragraph_format.space_before = Pt(0); p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(ln); r.font.name = MONO; r.font.size = Pt(9.5)
        r._element.rPr.rFonts.set(qn("w:eastAsia"), MONO)
        r.font.color.rgb = RGBColor(0x18, 0x2A, 0x2B)
        shade(p._p.get_or_add_pPr(), "EEF2F2")

def note(text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0.5)
    p.paragraph_format.space_before = Pt(3); p.paragraph_format.space_after = Pt(3)
    r = p.add_run(text); r.font.size = Pt(9.5); r.font.name = KR
    r._element.rPr.rFonts.set(qn("w:eastAsia"), KR)
    r.font.color.rgb = RGBColor(0x5A, 0x6A, 0x6B)
    return p

def table(headers, rows, widths=None):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.LEFT
    hdr = t.rows[0].cells
    for i, h in enumerate(headers):
        hdr[i].text = ""
        p = hdr[i].paragraphs[0]
        p.paragraph_format.space_before = Pt(2); p.paragraph_format.space_after = Pt(2)
        r = p.add_run(h); r.bold = True; r.font.size = Pt(9.5); r.font.name = KR
        r._element.rPr.rFonts.set(qn("w:eastAsia"), KR)
        shade(hdr[i]._tc.get_or_add_tcPr(), "E4EAEA")
    for row in rows:
        cells = t.add_row().cells
        for i, v in enumerate(row):
            cells[i].text = ""
            p = cells[i].paragraphs[0]
            p.paragraph_format.space_before = Pt(2); p.paragraph_format.space_after = Pt(2)
            mono = v.startswith("`") and v.endswith("`") and "\n" not in v
            txt = v.replace("`", "")
            r = p.add_run(txt); r.font.size = Pt(9.5)
            r.font.name = MONO if mono else KR
            r._element.rPr.rFonts.set(qn("w:eastAsia"), MONO if mono else KR)
    if widths:
        for row in t.rows:
            for i, w in enumerate(widths):
                row.cells[i].width = Cm(w)
    doc.add_paragraph().paragraph_format.space_after = Pt(0)
    return t

# ============================================================
title("서비스 플랫폼")
title("개발 환경 구성 및 설치", 14)
p = doc.add_paragraph()
r = p.add_run("디지털 연합트윈 서비스 플랫폼 설치"); r.font.size = Pt(11); r.font.name = KR
r._element.rPr.rFonts.set(qn("w:eastAsia"), KR)
note("백엔드와 프론트가 폴더로 나뉘어 있고, 환경변수는 최상위 .env 한 파일을 함께 쓴다.")

# ---------------- 0 ----------------
h1("0. 사전 준비")

step("Docker 버전 확인 (Compose v2 필요)")
cmd("docker --version", "docker compose version")

step("이미지 묶음 확인 (이미 들어 있다)")
cmd("ls -lh images/union-twin-service-images.tar.gz   # 약 1.9GB")
note("설치 서버는 레지스트리에 접속하지 않는다. 이 파일을 0-init.sh 가 적재한다.")
note("NGSI-LD 컨텍스트는 플랫폼에서 새로 만들어 쓰면 설치 전에 준비할 것이 없다.")
note("도커 데몬 설정(daemon.json)을 건드릴 일이 없다. insecure-registries 도 docker login 도 필요 없다.")

step("배포 파일 내려받기")
cmd("git clone <배포 저장소> /opt/union-twin")
note("기존: ndxpro-example-code.git / ndxpro-example-envrionment.git 두 개를 각각 clone")

step("설치 디렉터리 이동")
cmd("cd /opt/union-twin")

step("환경변수 파일 생성")
cmd("cp .env.example .env", "vi .env")

# ---------------- 변수 표 ----------------
h1("1. 고치는 값")
note("주소만 서버에 맞게 고친다. 계정·비밀번호·토큰·포트는 기본값 그대로 둔다.")
table(
    ["변수", "설명", "기본값"],
    [
        ["`HOST`", "서버 IP\n이 값 하나로 게이트웨이·뷰어·컨텍스트 주소가 자동 생성된다", "`220.124.222.90`"],
        ["`PUBLIC_URL`", "브라우저로 접속할 주소\n도메인·HTTPS 를 쓰면 그 주소", "`http://220.124.222.90`"],
        ["`REPO`", "데이터·로그 저장 경로", "`/data/ndxpro`"],
        ["`LOGSTASH_URL`\nZIPKIN_URL\nDTMETA_API_URL\nFDT_SYNC_API_URL", "외부 연동 주소\n쓰지 않으면 비워 둔다", "기존 값 그대로"],
    ],
    widths=[4.2, 6.4, 4.6],
)
note("계정 admin / 비밀번호 ndxpro123! / 서비스 토큰은 .env 의 [2] 구역에 이미 채워져 있다. 그대로 설치한 뒤 필요하면 바꾼다.")

h1("2. 초기화")

step("초기 준비 (.env 확인, 포트 점검, 네트워크·디렉터리 생성, 이미지 적재)")
cmd("cd fdt-service-backend", "./install/0-init.sh")
note("묶음을 푸는 것까지 0-init.sh 가 알아서 한다. 따로 명령을 칠 필요가 없다.")

step("직접 풀어야 할 때 (갱신본을 받았거나 이미지가 지워진 경우에만)")
cmd("./scripts/images-load.sh                                  # 다시 적재 (기본 경로)",
    "./scripts/images-load.sh ../images/union-twin-service-images-fe-20260820.tar.gz   # 갱신본",
    "./scripts/check-images.sh                                 # 없는 것·아키텍처 확인")
note("images/union-twin-service-images.tar.gz 을 적재한다. 소스코드에서 빌드하려면 --build 를 붙인다.")
note("기존: docker network create ndxpro 와 /data/ndxpro 하위 디렉터리를 수동 생성 → 스크립트가 대신 수행")

h1("3. 설치 실행")
note("아래 순서대로 실행한다. 각 스크립트는 앞 단계가 뜰 때까지 기다린 뒤 상태를 출력한다. 여러 번 실행해도 안전하다.")

step("DB 서비스 실행 — PostgreSQL / MongoDB / Redis")
cmd("./install/1-db.sh")
note("약 30초 / 직접 실행: docker compose --env-file ../.env -f db/compose.yml up -d")

step("Kafka 관련 실행 — Zookeeper / Kafka / Kafka UI")
cmd("./install/2-kafka.sh")
note("Kafka·Zookeeper 는 묶음에 없다. 이 스크립트가 kafka/build/ 의 Dockerfile 로 직접 빌드한다.")
note("빌드에는 인터넷이 필요하다 (Docker Hub, Ubuntu 저장소, archive.apache.org). 최초 1회 5~10분.")
note("인터넷이 없는 서버라면 pack.sh 를 --no-kafka 없이 돌려 묶음에 포함시킨다.")

step("ndxpro 서비스 실행 — 코어 9개 + 파일 서비스 + FDT 뷰어")
cmd("./install/3-ndxpro.sh")
note("스프링 부트 기동 대기 포함 약 2분 / 끝나면 Eureka 등록 서비스 목록을 출력한다")

step("프론트엔드 서비스 실행 — 연합트윈 화면 + 자체 서버(BFF)")
cmd("cd ../fdt-service-frontend", "./install/1-front.sh")
note("프록시 없이 바로 열려면 --expose, 리버스 프록시까지 올리려면 --nginx")
note("백엔드가 먼저 떠 있어야 한다. BFF 가 백엔드의 PostgreSQL 을 쓴다.")

h1("4. 설치 확인")

step("컨테이너 상태 및 엔드포인트 점검")
cmd("cd ../fdt-service-backend", "./scripts/health.sh")

step("웹 접속")
cmd("브라우저에서 PUBLIC_URL/signin 접속", "계정: admin@e8ight.co.kr / ndxpro123!")


# ---------------- 4 ----------------
h1("5. 기존 설치 방법에서 바뀐 점")
table(
    ["구분", "기존", "변경"],
    [
        ["실행 명령", "`docker compose up -d docker-compose.yml`",
         "`docker compose -f <파일> up -d`\n기존 명령은 파일명을 서비스명으로 해석해 실제로는 동작하지 않았다"],
        ["환경변수", "백엔드/infra/kafka 3개의 .env 에 값 중복",
         "최상위 .env 한 파일. 백엔드·프론트가 --env-file ../.env 로 함께 참조"],
        ["시크릿", "compose 파일에 JWT·DB 비밀번호 평문",
         ".env 로 분리. compose 에는 변수명만"],
        ["디렉터리", "cd infra, cd kafka 로 이동하며 실행",
         "deploy 에서 -f 경로로 실행. 이동 불필요"],
        ["파일 서비스 DB", "`220.124.222.90:55432` (호스트 IP 우회)",
         "`postgres:5432` (컨테이너 네트워크 내부)"],
        ["프론트 DB", "`220.124.222.90:55432`", "`postgres:5432`"],
        ["Kafka 연결", "`pipeline-kafka-1:19092`",
         "`pipeline-kafka-1:9092` (내부 리스너)\n19092 는 외부 프로듀서 전용"],
        ["이미지 레지스트리", "운영·로컬이 서로 다른 주소 사용", "`${IMAGE_REPO_URL}` 로 통일"],
        ["DB 초기화", "schema.sql 에 계정·비밀번호 하드코딩",
         "init 스크립트가 .env 값으로 생성. union_twin DB 도 함께 생성"],
        ["Redis", "존재하지 않는 redis.conf·users.acl 마운트",
         "마운트 제거, --requirepass 만 사용"],
        ["이미지 버전", "mongo·nginx 등 latest", ".env 의 IMG_* 로 고정"],
        ["자동 배포", "watchtower 상시 동작", "기본 비활성 (별도 compose)"],
        ["설치 방법", "compose 파일을 하나씩 직접 실행",
         "각 폴더의 install/ 스크립트를 순서대로 실행. 기동 대기·상태 출력 포함"],
        ["폴더 구조", "cd infra, cd kafka 로 옮겨 다님",
         "백엔드(db·kafka·ndxpro) / 프론트(front·nginx) 두 폴더로 분리. .env 만 공유"],
        ["이미지 준비", "레지스트리에서 pull 만 가능",
         "묶음(tar.gz) 적재 또는 소스 빌드. 설치 서버는 레지스트리에 접속하지 않는다"],
        ["묶음 제작", "없음",
         "image-bundle/ 폴더로 분리. 전체 또는 바뀐 것만(--only) 말 수 있다"],
        ["Kafka 토픽", "수동 생성",
         "2-kafka.sh 가 .env 의 KAFKA_TOPICS 를 생성 (자동 생성이 꺼져 있음)"],
        ["주소 설정", "compose·env 여러 곳에 서버 IP 반복",
         "HOST 한 줄만 고치면 게이트웨이·뷰어·컨텍스트 주소가 따라 바뀐다"],
    ],
    widths=[2.6, 5.6, 7.0],
)

# ---------------- 5 ----------------
h1("6. 이미지 묶음 (사내 작업)")
note("설치할 때는 이 장이 필요 없다. 묶음은 이미 저장소 루트에 들어 있다.")
note("이 장은 묶음을 새로 만들거나, 새 이미지가 올라와 갱신해야 하는 사내 담당자를 위한 것이다.")

step("사내에서 묶음 만들기 (image-bundle 폴더)")
cmd("cd image-bundle",
    "cp bundle.env.example bundle.env   # 레지스트리 계정 또는 소스코드 경로",
    "./fetch-from-registry.sh           # 방법 A - 사내 레지스트리에서 받기",
    "./build-from-source.sh             # 방법 B - 소스코드에서 빌드",
    "./pack.sh                          # out/union-twin-service-images.tar.gz (약 1.9GB, 사내 13개)")
note("모든 이미지를 linux/amd64 로 강제한다. 맥에서 만들어도 리눅스 서버에서 그대로 쓸 수 있다.")
note("저장 직전에 아키텍처를 검사하고 하나라도 다르면 파일을 만들지 않고 중단한다.")

step("새 이미지가 올라왔을 때 - 바뀐 것만 묶기")
cmd("./fetch-from-registry.sh 172.16.28.217:12000/union-twin-fe:latest",
    "./pack.sh --only 172.16.28.217:12000/union-twin-fe:latest --name union-twin-fe-20260819.tar.gz")
note("설치 서버에서 적재 후 해당 서비스만 remake_container.sh 로 다시 올린다.")

step("설치 서버에서 적재하고 설치")
cmd("./install/0-init.sh              # 묶음 적재 + 이미지 점검",
    "./install/1-db.sh",
    "./install/2-kafka.sh            # 이미지가 있으므로 빌드하지 않는다",
    "./install/3-ndxpro.sh")

step("이미지가 다 있는지, 아키텍처가 맞는지 확인")
cmd("./scripts/check-images.sh")

h1("7. 이미지 버전")
note("운영 서버와 동일한 버전이 .env 에 명시돼 있다. 버전을 올릴 때만 고친다.")
table(
    ["이미지", "태그", "이미지", "태그"],
    [
        ["ndxpro-eurekaserver", "v1.1", "ndxpro-file-service", "v1.0"],
        ["ndxpro-gatewayserver", "v1.1", "fdt-service", "v1.1"],
        ["ndxpro-dataingest", "v1.1", "union-twin-fe", "latest"],
        ["ndxpro-translatorbuilder", "v1.1.1", "union-twin-be", "latest"],
        ["ndxpro-ngsi-translator", "v1.1.1", "postgres", "14.1"],
        ["ndxpro-core-databroker", "v1.1.2", "mongo", "8.2.12"],
        ["ndxpro-dataservice", "v1.1", "redis", "6.2"],
        ["ndxpro-datamanager", "v1.1", "httpd", "2.4-alpine"],
        ["ndxpro-authorization", "v1.1", "nginx", "1.31.4"],
    ],
    widths=[5.0, 2.4, 5.0, 2.4],
)
note("union-twin-fe 는 현장별 태그가 따로 있다 — 제주 jeju, 삼성 samsung.")

h1("8. Windows 서버에 설치할 때")
note("이미지는 전부 linux/amd64 다. 컨테이너 안은 리눅스로 고정이고 호스트 OS 는 상관없다.")
note("다만 설치 스크립트가 bash 라서 Windows 에서는 WSL2 안에서 실행해야 한다.")
table(
    ["호스트", "동작", "방식"],
    [
        ["Linux x86_64", "그대로", "네이티브"],
        ["Windows", "됨", "WSL2 (내부에 리눅스 커널)"],
        ["macOS Intel", "됨", "Docker Desktop 리눅스 VM"],
        ["macOS Apple Silicon", "됨, 느림", "Rosetta 에뮬레이션"],
        ["Linux arm64", "안 됨", "이미지가 amd64 전용"],
    ],
    widths=[4.6, 3.0, 7.0],
)
note("중요한 것은 OS 가 아니라 CPU 아키텍처다. arm64 서버에는 올릴 수 없다.")

step("WSL2 + Ubuntu 설치 (관리자 PowerShell)")
cmd("wsl --install -d Ubuntu-22.04")

step("WSL 안에서 도커 설치")
cmd("sudo apt update && sudo apt install -y docker.io docker-compose-v2",
    "sudo usermod -aG docker $USER      # 로그아웃 후 재접속")

step("저장소 내려받기 (반드시 WSL 파일시스템 안에)")
cmd("git config --global core.autocrlf input   # 줄바꿈이 CRLF 로 바뀌는 것을 막는다",
    "git lfs install",
    "git clone <저장소> ~/DTSP_연합",
    "cd ~/DTSP_연합/install")
note("/mnt/c/... 에 두면 I/O 가 느리고 파일 권한이 꼬여 볼륨 마운트가 실패한다.")
note(".env 의 REPO 도 WSL 내부 경로(/data/ndxpro)로 둔다. 이후 설치 절차는 리눅스와 동일하다.")

step("외부 접속용 포트 포워딩 (관리자 PowerShell)")
cmd("$ip = (wsl hostname -I).Split(\" \")[0]",
    "foreach ($p in 50028,50038,53005,54002) {",
    "  netsh interface portproxy add v4tov4 listenport=$p listenaddress=0.0.0.0 connectport=$p connectaddress=$ip",
    "  New-NetFirewallRule -DisplayName \"DTSP $p\" -Direction Inbound -LocalPort $p -Protocol TCP -Action Allow",
    "}")
note("WSL 의 IP 는 재부팅마다 바뀐다. Windows Server 2022 이상은 .wslconfig 에 networkingMode=mirrored 를 넣으면 포워딩이 불필요하다.")
note(".env 의 HOST/PUBLIC_URL 에는 WSL IP 가 아니라 Windows 서버의 IP 를 적는다.")

step("Docker Desktop 을 쓰는 경우")
cmd("Settings → General → Use WSL 2 based engine 켜기",
    "Linux containers 모드 확인 (Windows containers 모드로는 동작하지 않음)")

h1("9. 자주 쓰는 명령")
step("상태 / 로그")
cmd("docker ps", "docker logs -f gateway")
step("서비스 하나만 최신 이미지로 교체")
cmd("./scripts/remake_container.sh union-twin-fe front/compose.yml")
step("버전 올리기")
cmd("vi ../.env       # 해당 TAG_* 수정", "./install/3-ndxpro.sh")
step("백업 / 중지")
cmd("./scripts/backup.sh                       # DB 백업",
    "cd ../fdt-service-frontend && ./install/9-clean.sh    # 프론트 내리기",
    "cd ../fdt-service-backend  && ./install/9-clean.sh --data   # 백엔드 + 데이터 삭제")
step("로컬 PC 에서 화면만 실행 (개발용)")
cmd("cd fdt-service-frontend",
    "docker compose --env-file ../.env -f front/compose-local.yml up -d   # localhost:50028")

note("포트 목록, 트러블슈팅, 폐쇄망 설치는 docs/reference.md 참고")

# 이 스크립트가 있는 디렉터리에 저장한다 (경로를 하드코딩하지 않는다)
import os
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "디지털연합트윈_설치_해설서.docx")
doc.save(out)
print("saved:", out)
