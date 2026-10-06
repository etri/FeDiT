#!/usr/bin/env bash
# SPDX-License-Identifier: LGPL-2.1-only
# Copyright (c) 2022-2026 E8IGHT Co., Ltd.
#
# 예제 JSON 하나를 Linux 실행 파일로 돌리고 성공 여부를 판정한다. (run_case.ps1 의 Linux판)
#
#   scripts/run_case.sh <json> [lbm|lbm_dem]
#
# 1. 엔진을 주지 않으면 JSON에 입자 설정(particle_generation)이 있을 때 lbm_dem, 없으면 lbm을 쓴다.
# 2. release/linux/<엔진>/ 폴더가 없으면 같은 폴더의 .tar.xz 묶음을 푼다.
# 3. runs/<yyMMdd_HHMMSS>_<JSON 이름>/ 작업 폴더를 새로 만들고 JSON과 JSON이 참조하는 STL을 복사한다.
# 4. 작업 폴더에서 실행 파일을 돌린다. 화면 출력은 run.log, 오류 출력은 run.err.log 에 남는다.
# 5. 판정: 종료 코드 0이고 로그의 마지막 결과 코드 줄이 "RC : 0" 이면 성공이다.
#    lbm_dem은 계산이 발산해도 종료 코드 0으로 끝날 수 있으므로, 로그에 nan/inf가 있으면 실패로 본다.
# 6. 판정과 결과 파일 요약을 result.json 에 남기고, 성공이면 종료 코드 0, 실패면 1로 끝난다.
#
# 필요한 것: NVIDIA GPU와 드라이버, libgomp1, bash, tar, xz, grep. 컨테이너에서는 --gpus all 로 띄운다.
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "사용법: $0 <json> [lbm|lbm_dem]" >&2
  exit 2
fi

module_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
json_path="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
json_name="$(basename "$json_path")"
src_dir="$(dirname "$json_path")"

# 1) 엔진 선택
engine="${2:-auto}"
if [ "$engine" = "auto" ]; then
  if grep -q '"particle_generation"' "$json_path"; then engine=lbm_dem; else engine=lbm; fi
fi
case "$engine" in
  lbm)     exe_name=NFLOW_LBM;     archive_name=NFLOW_LBM_linux_x64.tar.xz ;;
  lbm_dem) exe_name=NFLOW_LBM_DEM; archive_name=NFLOW_LBM_DEM_linux_x64.tar.xz ;;
  *) echo "엔진은 lbm 또는 lbm_dem 이어야 합니다: $engine" >&2; exit 2 ;;
esac
release_dir="$module_root/release/linux"
exe="$release_dir/$engine/bin/$exe_name"

# 2) 실행 파일 준비
if [ ! -x "$exe" ]; then
  archive="$release_dir/$archive_name"
  [ -f "$archive" ] || { echo "실행 파일도 묶음도 없습니다: $archive" >&2; exit 1; }
  command -v xz >/dev/null || { echo "묶음(.tar.xz)을 풀려면 xz가 필요합니다. Ubuntu: apt-get install xz-utils" >&2; exit 1; }
  echo "묶음을 풉니다: $archive"
  tar -xJf "$archive" -C "$release_dir"
fi
# 실행 파일은 같은 묶음의 lib/ 를 RUNPATH($ORIGIN)로 찾으므로 LD_LIBRARY_PATH는 필요 없다.

# 3) 작업 폴더
run_dir="$module_root/runs/$(date +%y%m%d_%H%M%S)_${json_name%.json}"
mkdir -p "$run_dir"
cp "$json_path" "$run_dir/"
mapfile -t stls < <(grep -o '"[^"]*\.stl"' "$json_path" | tr -d '"' | sort -u)
for s in "${stls[@]}"; do
  [ -f "$src_dir/$s" ] || { echo "JSON이 참조하는 STL이 없습니다: $src_dir/$s" >&2; exit 1; }
  cp "$src_dir/$s" "$run_dir/"
done

# 4) 실행
echo "실행: $engine $json_name  ->  $run_dir"
start=$(date +%s.%N)
set +e
(cd "$run_dir" && "$exe" "$json_name" >run.log 2>run.err.log)
exit_code=$?
set -e
seconds=$(awk -v s="$start" -v e="$(date +%s.%N)" 'BEGIN { printf "%.1f", e - s }')

# 5) 판정
text="$(cat "$run_dir/run.log" "$run_dir/run.err.log" | sed 's/\x1b\[[0-9;]*m//g')"
last_rc_line="$(printf '%s\n' "$text" | grep -o 'RC : -\?[0-9]*, .*' | tail -n 1 || true)"
last_rc="$(printf '%s' "$last_rc_line" | sed -n 's/^RC : \(-\?[0-9]*\),.*/\1/p')"
nan_lines=$(printf '%s\n' "$text" | grep -c -i -E '\b(nan|inf)\b|diverg' || true)

if [ "$exit_code" -eq 0 ] && [ "$last_rc" = "0" ]; then
  if [ "$engine" = "lbm_dem" ] && [ "$nan_lines" -gt 0 ]; then
    status=failed; message="로그에 nan/inf가 있습니다(${nan_lines}줄). 계산이 발산했을 수 있습니다."
  else
    status=completed; message="해석이 끝났습니다."
  fi
elif [ -n "$last_rc" ]; then
  status=failed; message="결과 코드 ${last_rc_line}"
else
  status=failed; message="종료 코드 ${exit_code}, 결과 코드 줄이 없습니다."
fi

# 6) 결과 요약. 결과는 작업 폴더 아래 meta.title 이름의 폴더에 생긴다.
output_files=$(find "$run_dir" -mindepth 2 -type f | wc -l)
output_mb=$(find "$run_dir" -mindepth 2 -type f -printf '%s\n' | awk '{ s += $1 } END { printf "%.1f", s / 1048576 }')
message_json="$(printf '%s' "$message" | sed 's/\\/\\\\/g; s/"/\\"/g')"
cat >"$run_dir/result.json" <<EOF
{
  "json": "$json_name",
  "engine": "$engine",
  "status": "$status",
  "message": "$message_json",
  "exit_code": $exit_code,
  "seconds": $seconds,
  "nan_inf_lines": $nan_lines,
  "output_files": $output_files,
  "output_MB": $output_mb,
  "run_dir": "$run_dir"
}
EOF
cat "$run_dir/result.json"
[ "$status" = "completed" ]
