연합트윈 CFD 화면(전처리·물리 시뮬레이션·후처리) — E8IGHT 서버 설치 묶음

[이 폴더에 든 것]
  images.tar.gz               페이지 이미지 + 앞단 웹서버(https) 이미지
  docker-compose.yml          compose 설정
  docker-compose.server.yml   이 서버용 덧붙임(1세부 해석엔진의 Docker 네트워크에 붙기)
  env.server                  서버 설정의 처음 값. run.sh 가 서버에 .env 가 없을 때 한 번만 .env 로 복사한다
  certs/                      *.fedit.or.kr 인증서(fullchain.pem)와 비밀 키(privkey.pem) — 밖으로 돌리지 말 것
  proxy/                      앞단 설정 원본(참고용, 이미지에 이미 들어 있음)
  run.sh                      설치·확인 스크립트(다시 실행해도 된다)
  smoke_test.sh               해석 1건으로 처음부터 끝까지 확인(선택)
  BUILD.txt                   만든 날·커밋·파일 확인값

[처음 설치]
  1. 파일질라에 SFTP·배포 계정으로 접속한다. 서버에 ~/cfd-deploy 폴더(배포 계정의 홈 아래)를 만들고,
     이 폴더 안의 파일과 폴더를 모두 그 안에 올린다.
  2. 서버에서(배포 계정 또는 root):
       cd ~/cfd-deploy
       bash run.sh
     마지막에 "완료. 서버 안에서는 모두 정상입니다." 가 나오면 끝.
  3. run.sh 는 1세부 해석엔진을 건드리지 않는다. 우리 컨테이너 둘(union-twin-cfd-renderer-1, union-twin-cfd-proxy-1)만 만든다.
  (선택) 해석 1건 시험 — 1세부 GPU 에서 실제로 돈다:
       PROXY=http://127.0.0.1:8090 bash smoke_test.sh <입력 JSON> [STL ...]

[최종본으로 바꾸기]
  새 묶음 폴더 안의 파일을 같은 서버 폴더(~/cfd-deploy)에 모두 덮어 올리고 bash run.sh.
  서버에서 고친 .env 는 묶음에 없으므로 덮이지 않는다. run.sh 가 바로 앞 판 이미지를 :prev 로 남긴다.

[되돌리기 — 바로 앞 판으로] (run.sh 는 쓰지 않는다. images.tar.gz 의 새 판을 다시 불러오기 때문)
  docker tag union-twin-cfd-renderer:prev union-twin-cfd-renderer:local
  docker tag union-twin-cfd-proxy:prev union-twin-cfd-proxy:local
  docker compose -f docker-compose.yml -f docker-compose.server.yml up -d --no-build renderer proxy

[인증서 교체] (만료일은 run.sh 가 출력한다. 한 달 전에 새 인증서를 받는다)
  certs/ 의 fullchain.pem · privkey.pem 을 새 것으로 덮어쓰고 bash run.sh. run.sh 가 앞단에 새 인증서를 다시 읽힌다.

[밖에서 열리려면]
  제주TP: DNS cfd.fedit.or.kr → 이 서버의 공인 IP, 이 서버 443(·80) 외부 개방. 열리기 전에는 서버 안 run.sh 결과가 기준이다.
  열린 뒤: https://cfd.fedit.or.kr/  (전처리 pre.html · 물리 시뮬레이션 sim.html · 후처리 post.html)
  FeDiT 탭(iframe) 안에서는 FeDiT 가 내려받기 허락(allow-downloads)을 더하기 전까지 내려받기 단추가 막힌다. 해석 실행·후처리 보기는 된다.

[1세부와 함께 쓰는 것]
  - 앞단이 1세부 엔진의 Docker 네트워크(integration_default)에 붙어 있다.
    1세부가 compose down 을 하면 "Network integration_default Resource is still in use" 한 줄이 나오지만 정상이다
    (엔진은 내려가고 네트워크만 남는다). 엔진이 내려간 동안 페이지는 열리고 해석 실행만 안 된다. 다시 up 하면 저절로 다시 붙는다.
  - 작업 폴더(jobs)는 1세부 엔진의 것이고 우리는 읽기만 한다. 쌓인 결과를 지우는 규칙은 1세부와 정한다.
      크기 보기:  du -sh "$(grep '^JOBS_HOST_DIR=' .env | cut -d= -f2-)"   (.env 의 작업 폴더)
      끝난 작업 지우기(1세부와 맞춘 뒤):  curl -X DELETE http://127.0.0.1:18080/jobs/<작업 번호>

[자주 쓰는 명령] (이 폴더에서)
  상태:    docker compose -f docker-compose.yml -f docker-compose.server.yml ps
  로그:    docker compose -f docker-compose.yml -f docker-compose.server.yml logs --tail 50 proxy
  멈추기:  docker compose -f docker-compose.yml -f docker-compose.server.yml down     (해석엔진·결과는 그대로)
  해석 실행 잠그기: .env 의 ACCESS_KEY 에 16자 이상 값(영문·숫자·_·-)을 넣고 bash run.sh 다시 실행
  재부팅 뒤 저절로 뜨는지: systemctl is-enabled docker   (enabled 여야 한다. 아니면 서버 담당·1세부와 맞춘다)

[이 폴더는 이 자리에 둔다]
  ~/cfd-deploy 에 고정한다. 앞단이 이 폴더의 certs/ 를 붙여 쓰므로, 옮기거나 지우면 다음 재시작 때 앞단이 뜨지 못한다.
