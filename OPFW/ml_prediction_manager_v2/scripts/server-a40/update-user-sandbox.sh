#!/usr/bin/env bash
# Update only the PM application image and the existing frontend proxy config.
set -Eeuo pipefail
if (( EUID != 0 )); then exec sudo bash "$0" "$@"; fi
umask 077
here=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo=$(cd -- "$here/../../../.." && pwd)
git_repo() { git -c safe.directory="$repo" -C "$repo" "$@"; }
relative=OPFW/ml_prediction_manager_v2
export KUBECONFIG=/etc/kubernetes/admin.conf
mountpoint -q /data || { echo '[FAIL] /data is not mounted'; exit 1; }
for tool in docker kubectl python3 git tar flock; do command -v "$tool" >/dev/null || { echo "[FAIL] Missing $tool"; exit 1; }; done
mkdir -p /data/fedit-sandbox-updates
exec 8>/data/fedit-sandbox-updates/update.lock
flock -n 8 || { echo '[FAIL] Another sandbox update is running'; exit 1; }
revision=$(git_repo rev-parse --short=12 HEAD)
[[ -z "$(git_repo status --porcelain -- "$relative/app" "$relative/static" "$relative/scripts/server-a40" OPFW/ml_prediction_manager_v2_frontend/nginx.conf)" ]] || {
  echo '[FAIL] Application or update scripts have uncommitted changes'; exit 1;
}
git_repo cat-file -e "HEAD:$relative/app/services/volume_service.py"
work=$(mktemp -d "/data/fedit-sandbox-updates/${revision}.XXXXXXXX")
nginx_source=''
nginx_changed=false
deployment_changed=false
old_image=''
new_image=''
finish() {
  rc=$?
  trap - EXIT INT TERM
  set +e
  if (( rc != 0 )); then
    echo '[FAIL] Sandbox update failed; restoring changed deployment/configuration.'
    if [[ "$nginx_changed" == true ]]; then
      # Preserve the inode of the file bind-mounted into the existing container.
      if ! { cat "$work/frontend-nginx.before.conf" > "$nginx_source" &&
             docker exec fedit-fe nginx -t && docker exec fedit-fe nginx -s reload; }; then
        echo '[FAIL] Frontend rollback needs inspection'
      fi
    fi
    if [[ "$deployment_changed" == true ]]; then
      if ! { kubectl -n kubeflow set image deployment/prediction-manager "prediction-manager=$old_image" &&
             kubectl -n kubeflow rollout status deployment/prediction-manager --timeout=300s; }; then
        echo '[FAIL] Backend rollback needs inspection'
      fi
    fi
  fi
  printf 'EXIT=%s\nREVISION=%s\nPREVIOUS_IMAGE=%s\nNEW_IMAGE=%s\n' "$rc" "$revision" "$old_image" "$new_image" > "$work/RESULT.txt"
  echo '===== SANDBOX UPDATE RESULT ====='
  cat "$work/RESULT.txt"
  echo "UPDATE_REPORT=$work"
  exit "$rc"
}
trap finish EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
old_image=$(kubectl -n kubeflow get deployment prediction-manager \
  -o 'jsonpath={.spec.template.spec.containers[?(@.name=="prediction-manager")].image}')
[[ "$old_image" =~ ^(127\.0\.0\.1|localhost):[0-9]+/prediction-manager-app(:|@) ]] || {
  echo '[FAIL] Expected the installed local-registry Prediction Manager image'; exit 1;
}
docker inspect fedit-fe > "$work/frontend-inspect.private.json"
nginx_source=$(python3 - "$work/frontend-inspect.private.json" <<'PY'
import json,sys
mounts=json.load(open(sys.argv[1]))[0]['Mounts']
matches=[m['Source'] for m in mounts if m['Type']=='bind' and m['Destination']=='/etc/nginx/conf.d/default.conf']
assert len(matches)==1, 'Cannot identify installed frontend configuration bind mount'
print(matches[0])
PY
)
[[ -f "$nginx_source" ]] || { echo '[FAIL] Frontend configuration file is missing'; exit 1; }
cp -a "$nginx_source" "$work/frontend-nginx.before.conf"
python3 - "$nginx_source" "$work/frontend-nginx.after.conf" <<'PY'
import pathlib,sys
text=pathlib.Path(sys.argv[1]).read_text()
old='proxy_pass http://host.docker.internal:13100/;'
new='proxy_pass http://host.docker.internal:18100/volumes/;'
assert text.count(old)==1 or (text.count(old)==0 and text.count(new)==1), 'Unexpected volume proxy configuration'
pathlib.Path(sys.argv[2]).write_text(text.replace(old,new))
PY
mkdir "$work/context"
git_repo archive HEAD "$relative/app" "$relative/static" | tar -x -C "$work/context" --strip-components=2
python3 "$here/prepare-sandbox-overlay.py" "$work/context"
new_image=$(python3 - "$old_image" "$revision" <<'PY'
import sys,time
image=sys.argv[1].split('@')[0]
if ':' in image.rsplit('/',1)[-1]: image=image.rsplit(':',1)[0]
print(f'{image}:sandbox-{sys.argv[2]}-{time.time_ns()}')
PY
)
printf 'FROM %s\nCOPY app/ /app/app/\nCOPY static/ /app/static/\n' "$old_image" > "$work/context/Dockerfile"
export TMPDIR="$work"
echo '===== Building application update from the existing deployed image ====='
docker image inspect "$old_image" >/dev/null 2>&1 || docker pull "$old_image"
docker build -t "$new_image" "$work/context"
docker run --rm --network none --entrypoint python "$new_image" -m compileall -q /app/app
docker push "$new_image"
# Add only read access needed for dormant workload and PodDefault volume checks.
kubectl get clusterrole prediction-manager -o json > "$work/role.before.json"
python3 - "$work/role.before.json" "$work/role.patch.json" <<'PY'
import json,pathlib,sys
role=json.loads(pathlib.Path(sys.argv[1]).read_text())
patch=[{'op':'test','path':'/metadata/resourceVersion','value':role['metadata']['resourceVersion']}]
for group,resource in [('apps','daemonsets'),('batch','cronjobs'),('kubeflow.org','poddefaults')]:
    covered=any(group in rule.get('apiGroups',[]) and resource in rule.get('resources',[]) and {'get','list'}<=set(rule.get('verbs',[])) for rule in role['rules'])
    if not covered: patch.append({'op':'add','path':'/rules/-','value':{'apiGroups':[group],'resources':[resource],'verbs':['get','list']}})
pathlib.Path(sys.argv[2]).write_text(json.dumps(patch))
PY
kubectl patch clusterrole prediction-manager --type=json --patch-file "$work/role.patch.json"
echo '===== Updating backend ====='
deployment_changed=true
kubectl -n kubeflow set image deployment/prediction-manager "prediction-manager=$new_image"
kubectl -n kubeflow rollout status deployment/prediction-manager --timeout=600s
echo '===== Updating the public volume route ====='
nginx_changed=true
cat "$work/frontend-nginx.after.conf" > "$nginx_source"
docker exec fedit-fe nginx -t
docker exec fedit-fe nginx -s reload
echo '===== Checking the public sandbox route and system-namespace denial ====='
url=${FEDIT_SANDBOX_CHECK_URL:-http://127.0.0.1:18000}
python3 "$here/check-user-sandbox-route.py" "$url" "$work" \
  "$repo/$relative/static/js/volumes-sandbox.js"
echo '[PASS] User image/volume application policy deployed; Nginx now routes volumes through the PM API.'
echo 'Run verify-user-sandbox.sh for the real PVC lifecycle checks (install.sh runs it automatically).'
