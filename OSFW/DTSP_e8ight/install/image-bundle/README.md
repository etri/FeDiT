# image-bundle — 이미지 묶음 제작 (사내 전용)

설치 서버는 레지스트리에 접속하지 않는다. 여기서 만든 **tar.gz 묶음만** 가져가 쓴다.
이 폴더의 스크립트는 사내 망(또는 소스코드가 있는 개발 장비)에서 실행한다.

레지스트리는 프라이빗이라 외부에서는 접속 자체가 되지 않는다.
**계정은 파일에 저장하지 않고 실행할 때 직접 입력한다.**

```
$ ./fetch-from-registry.sh
== 레지스트리에서 이미지 받기 (linux/amd64) ==
   레지스트리: 172.16.28.217:12000

레지스트리 아이디: admin
비밀번호:                      ← 입력이 화면에 보이지 않는다
Login Succeeded
```

한 번 로그인하면 도커가 기억하므로 다음 실행부터는 묻지 않는다.
다시 입력하려면 `docker logout 172.16.28.217:12000` 후 실행한다.
작업이 끝나면 로그아웃해 두는 것을 권한다.

```bash
cp bundle.env.example bundle.env    # 소스 경로는 이미 채워져 있다

# 방법 A — 사내 레지스트리에서 받기 (아이디/비밀번호를 직접 입력)
./fetch-from-registry.sh

# 방법 B — 소스코드에서 빌드하기
./build-from-source.sh

./pack.sh --private-only --split   # out/union-twin-service-images.tar.gz.part-aa ~ .part-au
```

`--split` 없이 돌리면 통짜 `out/union-twin-service-images.tar.gz` 가 나온다.
저장소에 올릴 때는 **`--split` 을 반드시 쓴다** (아래 "저장소에 올리기" 참고).

## 빌드 방식

소스 디렉터리를 보고 자동으로 판별한다.

| 방식 | 대상 | 명령 |
|---|---|---|
| Dockerfile | dataBroker, dataIngest, union-twin fe/be, Kafka, Zookeeper | `docker build --platform linux/amd64` |
| Jib (gradle) | NDXPro 코어 9개 + fdt-service | `./gradlew jibDockerBuild -Djib.from.platforms=linux/amd64` |
| Docker Hub | postgres·mongo·redis·httpd·nginx·kafka-ui | `docker pull --platform linux/amd64` |

**연합트윈 화면과 BFF 는 하나의 모노레포**(`source/union-twin-fe`)에서 `--target` 으로 나눠 빌드한다.
`bundle.env` 의 `OPT_UNION_TWIN_FE` / `OPT_UNION_TWIN_BE` 가 그 인자를 담고 있다(Jenkinsfile 과 동일).

FDT 뷰어 소스는 `source/fdt-service` 다 (jib 대상 이미지 `.../fdt-service:v1.1`).

### Jib 빌드에는 Java 17 이 필요하다

NDXPro 코어는 gradle 7.4~7.5.1 을 쓰는데, 이 버전은 Java 21 에서 빌드가 깨진다
(`Unsupported class file major version 65`). 스크립트가 `/usr/libexec/java_home -v 17` 로
자동 탐색하며, 찾지 못하면 `bundle.env` 의 `JAVA_HOME_FOR_BUILD` 에 경로를 적는다.

`gradlew` 에 실행 권한이 없어도 `sh ./gradlew` 로 실행하므로 소스를 건드리지 않는다.

`out/` 의 tar.gz 을 설치 서버의 `install/images/` 에 두면 된다.
`.env` 의 `IMAGE_BUNDLE` 이 그 파일을 가리킨다.

## 새 이미지가 올라왔을 때 (갱신)

전체를 다시 말 필요 없이 바뀐 것만 묶어 보낼 수 있다.

```bash
# 1) 바뀐 이미지만 받거나 빌드한다
./fetch-from-registry.sh 172.16.28.217:12000/union-twin-fe:latest
#   또는
./build-from-source.sh   172.16.28.217:12000/union-twin-fe:latest

# 2) 그것만 묶는다
./pack.sh --only 172.16.28.217:12000/union-twin-fe:latest \
          --name union-twin-fe-20260819.tar.gz
```

설치 서버에서는 같은 방법으로 적재하고 해당 서비스만 다시 올린다.

```bash
cd fdt-service-backend
./scripts/images-load.sh union-twin-service-images-fe-20260819.tar.gz
cd ../fdt-service-frontend
./scripts/remake_container.sh union-twin-fe front/compose.yml
```

버전 태그가 바뀌었다면 먼저 `../.env` 의 해당 `TAG_*` 를 고친다.

## 저장소에 올리기

GitHub 은 파일당 100MB 하드 제한이 있어 1.9 GB 묶음을 그대로 커밋할 수 없다.
**95MB 조각으로 나눠 일반 Git 파일로 올린다.**

```bash
./pack.sh --private-only --split          # SPLIT_SIZE=50m 처럼 조절 가능
rm -f ../images/union-twin-service-images.tar.gz*
mv out/union-twin-service-images.tar.gz.part-* ../images/
cp out/union-twin-service-images.{images,manifest}.txt ../images/
```

`.gitattributes` 는 고치지 않는다. `*.tar.gz` LFS 규칙 아래에
`*.tar.gz.part-* -text` 가 있어서 조각은 LFS 대상에서 빠진다.

```bash
git check-attr filter ../images/union-twin-service-images.tar.gz.part-aa
#  filter: unspecified   → LFS 아님 (정상)
git lfs push --dry-run origin main
#  출력 없음             → LFS 업로드 0건 (정상)
```

**커밋은 조각 2~3개씩(약 200~290 MB) 나눈다.** 한 커밋에 1 GB 넘게 담으면 HTTPS 전송이
`send-pack: unexpected disconnect` 로 끊긴다. LFS 와 무관한 전송 쪽 문제다.

올린 뒤 원격 내용으로 복원 검증을 한다.

```bash
git archive origin/main OSFW/DTSP_e8ight/install/images | tar -x -C /tmp/v
cat /tmp/v/OSFW/DTSP_e8ight/install/images/*.part-* | gzip -t && echo OK
cat /tmp/v/OSFW/DTSP_e8ight/install/images/*.part-* | shasum -a 256
```

> 갱신할 때마다 1.9 GB 가 git 히스토리에 쌓이고 지울 수 없다. 자주 갱신한다면 묶음을 git 에
> 두지 말고 **컨테이너 레지스트리(GHCR 등)에 이미지별로 push** 하는 편이 낫다.
> 레이어 단위 증분 전송이라 바뀐 이미지만 올라간다.
>
> Git LFS 는 쓰지 않는다. 갱신이 쌓여 예산을 넘기면
> `batch response: This repository exceeded its LFS budget.` 로 푸시가 막힌다.

## 아키텍처

`pack.sh` 는 저장 직전에 모든 이미지가 `TARGET_PLATFORM`(기본 `linux/amd64`)인지 검사하고,
하나라도 다르면 중단한다.

맥(Apple Silicon)에서 작업할 때 특히 중요하다. 그냥 받거나 빌드하면 공개 이미지
(`postgres`·`mongo`·`redis`·`httpd`·`nginx`·`kafka-ui`)와 직접 빌드하는 Kafka·Zookeeper 가
arm64 로 만들어져 리눅스 x86_64 서버에서 `exec format error` 가 난다.
`fetch-from-registry.sh` 와 `build-from-source.sh` 는 `--platform` 을 항상 붙인다.

## 파일

| 파일 | 용도 |
|---|---|
| `bundle.env.example` | 레지스트리 계정, 소스코드 경로, 대상 플랫폼 |
| `fetch-from-registry.sh` | 사내 레지스트리에서 이미지 받기 |
| `build-from-source.sh` | 소스코드에서 이미지 빌드 |
| `pack.sh` | tar.gz 묶음 생성 (전체 / 일부 / `--split` 분할) |
| `out/` | 결과물. git 에 올라가지 않는다 |

대상 이미지 목록은 `compose` 파일에서 자동으로 뽑는다. `.env` 의 `TAG_*` 를 고치면 그대로 따라간다.
