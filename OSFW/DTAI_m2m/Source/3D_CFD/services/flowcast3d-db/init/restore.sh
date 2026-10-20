#!/usr/bin/env bash
# 새 볼륨에 초기 자료 복원
(
    set +x
    set -Eeuo pipefail
    umask 077

    # 복원 경로와 상태 마커
    init_directory="${FLOWCAST_INIT_DIR:-/docker-entrypoint-initdb.d}"
    input_directory="${FLOWCAST_DB_INPUT_DIR:-/initial-data}"
    data_directory="${FLOWCAST_DB_PATH:-/data/db}"
    pending="$data_directory/.flowcast-init-pending"
    ready="$data_directory/.flowcast-init-ready.json"
    legacy_pending="$data_directory/.flowcast-seed-pending"
    legacy_ready="$data_directory/.flowcast-seed-ready.json"
    restore_config=""

    # 종료 시 임시 비밀 설정 정리
    cleanup() {
        local status=$?
        if [ -n "$restore_config" ]; then
            rm -f -- "$restore_config"
        fi
        if [ "$status" -ne 0 ]; then
            printf '%s\n' 'Flowcast seed initialization failed. Readiness was not published.' >&2
        fi
    }
    trap cleanup EXIT

    # 미완료 볼륨은 자동 재복원 차단
    if [ -e "$pending" ] || [ -e "$legacy_pending" ]; then
        printf '%s\n' 'An incomplete initialization marker exists. Manual review is required.' >&2
        exit 1
    fi

    # 완료된 볼륨은 재복원하지 않음
    if [ -e "$ready" ] || [ -e "$legacy_ready" ]; then
        printf '%s\n' 'Flowcast 초기 자료 준비 마커가 있어 복원을 반복하지 않음'
        exit 0
    fi

    # 복원 전 입력 검사
    mkdir -p -- "$data_directory"
    printf '%s\n' '{"schema":"flowcast.init-pending/1","status":"pending"}' > "$pending"
    for file in flowcast3d.archive.gz flowcast3d.sha256 flowcast3d.manifest.json; do
        if [ ! -s "$input_directory/$file" ]; then
            printf '%s\n' "Required Flowcast seed file not found: $file" >&2
            exit 1
        fi
    done

    restore_config="$(mktemp /tmp/flowcast-init-tools.XXXXXXXX.json)"
    export FLOWCAST_INIT_DIR="$init_directory"
    export FLOWCAST_DB_INPUT_DIR="$input_directory"
    export FLOWCAST_DB_PATH="$data_directory"
    export FLOWCAST_RESTORE_CONFIG="$restore_config"

    # 공식 이미지의 임시 초기화 서버는 27017 포트 사용
    export FLOWCAST_DB_PORT=27017

    # 비밀이 명령 인수에 노출되지 않도록 권한 600의 임시 설정 사용
    mongosh --quiet --nodb --file "$init_directory/prepare.cjs"

    # 체크섬 확인 후 복원
    (cd -- "$input_directory" && sha256sum --check --strict --status flowcast3d.sha256)
    printf '%s\n' 'Flowcast 초기 자료 SHA256 확인 완료'
    mongorestore --config "$restore_config" --gzip \
        --archive="$input_directory/flowcast3d.archive.gz" \
        --nsInclude 'flowcast3d.*' \
        --nsExclude 'flowcast3d.jobs' --nsExclude 'flowcast3d.worker_jobs' --stopOnError

    # 검증이 끝난 뒤 준비 상태 공개
    mongosh --quiet --nodb --file "$init_directory/verify.cjs"
    rm -f -- "$pending"
    printf '%s\n' 'Flowcast 초기 자료 복원과 검증 완료'
)
