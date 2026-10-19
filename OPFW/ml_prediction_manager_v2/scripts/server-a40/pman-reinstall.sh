#!/usr/bin/env bash
# Remove this installation's images, reinstall, and run install.sh's full checks.
set -Eeuo pipefail
umask 077
case "${1:-}" in
  -h|--help)
    echo 'Usage: bash pman-reinstall.sh'
    echo 'Run as the original installation account. Re-running resumes an unfinished run.'
    echo 'Removes installed cluster images and its Registry image blobs; preserves PVC files.'
    exit 0 ;;
  '') ;;
  *) echo 'Usage: bash pman-reinstall.sh' >&2; exit 2 ;;
esac
(( $# == 0 )) || exit 2
(( EUID != 0 )) || { echo '[FAIL] Run as the ordinary account that installed this server.' >&2; exit 1; }
here=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo=$(cd -- "$here/../../../.." && pwd)
for file in pman-uninstall.sh pman-stop.sh install.sh sudo-session.sh pman-image-cleanup.py; do
  [[ -r "$here/$file" ]] || { echo "[FAIL] Missing $here/$file" >&2; exit 1; }
  [[ "$file" != *.sh ]] || bash -n "$here/$file"
done
for tool in sudo python3 git flock tar; do command -v "$tool" >/dev/null || { echo "[FAIL] Missing $tool" >&2; exit 1; }; done
git -C "$repo" cat-file -e 725eb2edeec1b756b45abb809cdc4dc971a890bf^{commit}
[[ -z "$(GIT_OPTIONAL_LOCKS=0 git -C "$repo" status --porcelain -- \
  OPFW/ml_prediction_manager_v2/app OPFW/ml_prediction_manager_v2/static \
  OPFW/ml_prediction_manager_v2/scripts/server-a40 OPFW/ml_prediction_manager_v2_frontend/nginx.conf)" ]] || {
  echo '[FAIL] Commit or preserve local application/script edits before reinstalling.' >&2; exit 1;
}
base="$HOME/pman-server-725eb2ed"
[[ -f "$base/installation-started" ]] || { echo '[FAIL] No existing installation for this account.' >&2; exit 1; }
exec 9>>"$base/reinstall.lock"
flock -n 9 || { echo '[FAIL] Another automatic reinstall is running.' >&2; exit 1; }
active="$base/reinstall-active"
if [[ -f "$active" ]]; then
  report=$(cat "$active")
  [[ "$report" =~ ^"$base/reinstall.run."[A-Za-z0-9]+$ && -d "$report" && ! -L "$report" ]] || {
    echo '[FAIL] Invalid saved reinstall report path.' >&2; exit 1;
  }
else
  report=$(mktemp -d "$base/reinstall.run.XXXXXXXX")
  printf '%s\n' "$report" > "$active"
fi
source "$here/sudo-session.sh"
phase=preflight
exec 3>&1 4>&2
exec > >(tee -a "$report/session.private.log") 2>&1
logger=$!
finish() {
  rc=$?
  trap - EXIT INT TERM
  set +e
  if [[ "$phase" == remove-images && -f "$report/uninstall.done" && ! -f "$report/images.done" ]]; then
    sudo -n systemctl stop docker.socket docker.service containerd.service
  fi
  sudo_session_stop
  exec 1>&3 2>&4
  closed=false
  for _ in $(seq 1 50); do
    if ! kill -0 "$logger" 2>/dev/null; then closed=true; break; fi
    sleep 0.1
  done
  if [[ "$closed" == true ]]; then wait "$logger" || rc=1;
  else kill "$logger" 2>/dev/null; rc=1; phase=log-cleanup; fi
  python3 - "$report/session.private.log" "$report/session.log" <<'PY'
import pathlib, re, sys
text = pathlib.Path(sys.argv[1]).read_text(errors='replace')
text = re.sub(r'(?<=--token )[a-z0-9]{6}\.[a-z0-9]{16}', '<REDACTED_BOOTSTRAP_TOKEN>', text)
pathlib.Path(sys.argv[2]).write_text(text, encoding='utf-8')
PY
  if (( $? != 0 )); then rc=1; phase=report; fi
  printf 'EXIT=%s\nSTAGE=%s\nSOURCE_COMMIT=%s\n' "$rc" "$phase" \
    "$(cat "$report/installed-source-commit" 2>/dev/null || git -C "$repo" rev-parse HEAD)" > "$report/RESULT.txt"
  files=(RESULT.txt session.log)
  for name in images-before.json images-removed.json installation-report.tar.gz; do
    [[ ! -f "$report/$name" ]] || files+=("$name")
  done
  if ! tar -czf "$report.tar.gz" -C "$report" "${files[@]}"; then
    rc=1
    printf 'EXIT=1\nSTAGE=report\n' > "$report/RESULT.txt"
  fi
  echo '===== PMAN REINSTALL FINAL RESULT ====='
  cat "$report/RESULT.txt"
  echo "PMAN_REINSTALL_REPORT_ARCHIVE=$report.tar.gz"
  if (( rc == 0 )); then
    rm -f -- "$active"
    echo 'PMAN_IMAGE_CLEANUP_AND_REINSTALL_PASS'
  else echo "Resume with: bash $here/pman-reinstall.sh"; fi
  exit "$rc"
}
trap finish EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
sudo_session_start
sudo -n mountpoint -q /data
sudo -n nvidia-smi --query-gpu=name,driver_version --format=csv,noheader
control_lock() {
  exec 8>>"$base/control.lock"
  flock -n 8 || { echo '[FAIL] Another platform install/check/control operation is running.' >&2; exit 1; }
}
if [[ ! -f "$report/images-before.json" ]]; then
  phase=image-inventory
  control_lock
  sudo -n systemctl start containerd.service docker.service
  sudo -n env FEDIT_REGISTRY_CONTAINER="${FEDIT_REGISTRY_CONTAINER:-}" \
    python3 "$here/pman-image-cleanup.py" inventory --owner "$(id -un)" \
    --repo "$repo" --output "$report/images-before.json"
  sudo -n chown "$(id -un)" "$report/images-before.json"
  exec 8>&-
fi
if [[ ! -f "$report/uninstall.done" ]]; then
  phase=uninstall
  bash "$here/pman-uninstall.sh"
  touch "$report/uninstall.done"
fi
if [[ ! -f "$report/images.done" ]]; then
  phase=remove-images
  control_lock
  sudo -n systemctl start containerd.service docker.service
  sudo -n python3 "$here/pman-image-cleanup.py" cleanup \
    --inventory "$report/images-before.json" --output "$report/images-removed.json"
  sudo -n chown "$(id -un)" "$report/images-removed.json"
  sudo -n systemctl stop docker.socket docker.service containerd.service
  touch "$report/images.done"
  exec 8>&-
fi
phase=install-and-test
# install.sh performs installation, GPU/model smoke tests and the actual PVC test.
if [[ ! -f "$report/install.done" ]]; then
  git -C "$repo" rev-parse HEAD > "$report/installed-source-commit"
  # Await this tee as part of the pipeline: do not parse the still-running
  # outer logger, which may not have written the installer's final line yet.
  bash "$here/install.sh" 2>&1 | tee "$report/install-session.private.log"
  python3 - "$base" "$report" <<'PY'
import pathlib, re, shutil, sys
base, report = map(pathlib.Path, sys.argv[1:])
text = (report/'install-session.private.log').read_text(errors='replace')
matches = re.findall(r'^FEDIT_REPORT_ARCHIVE=(.+)$', text, re.M)
if not matches:
    raise SystemExit('The installer did not produce its final report archive')
archive = pathlib.Path(matches[-1]).resolve()
if not archive.is_relative_to((base/'complete-reports').resolve()) or not archive.is_file():
    raise SystemExit('Invalid installer report archive path')
shutil.copyfile(archive, report/'installation-report.tar.gz')
PY
  touch "$report/install.done"
fi
phase=complete
