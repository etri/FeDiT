# Browser service full traversal (persistent work note)

## Required definition

This task is not complete when HTTP/API/Kubernetes checks pass. For each visible
service UI, record the user-facing lifecycle where applicable:

1. enter/select the feature from the FeDiT screen;
2. configure it in the visible UI;
3. start/submit the real operation;
4. observe the running state and visible result;
5. stop/delete/clean up and observe the final state.

## Browser policy

- Keep the FeDiT iframe in the same browser tab whenever it renders correctly.
- If an iframe is blank, blocked, cross-origin inaccessible, or the service
  requires its own top-level navigation, open the service in a new tab/window
  and record that fact in the manifest.
- Do not count Swagger, curl, raw API, or Kubernetes output as browser-service
  evidence. Those may be supplemental evidence only.
- Capture a visible screenshot at each applicable lifecycle stage and record a
  single desktop video for the traversal. Do not include credentials or tokens.
- Do not use the reserved internal marker in test-case names, filenames,
  manifests, or captured labels.

## Service coverage checklist

- Prediction Manager UI / dataset catalog: select, configure, upload/profile,
  result, delete.
- Data Collection/NiFi: enter, configure connector/twin, start/apply, visible
  result, stop/cleanup.
- Volumes/PVC: enter, configure/create, visible bound/result, delete.
- Label Studio: enter (SSO iframe or new tab), create project, visible project,
  cleanup.
- Kubeflow Pipelines: enter, configure experiment/pipeline, submit, observe
  run/result, delete.
- AutoML/model management/KServe: configure dataset/trial, run, observe
  result/best model, one-click serving/inference, cleanup.
- Ray Dashboard: enter, submit/observe a job where UI supports it, result,
  cleanup.
- MLflow: enter, create experiment/run/model/metric in UI, observe result,
  cleanup.
- TensorBoard: enter, create/open board, visible UI, cleanup.
- MLOps/Prometheus: enter, configure/select metric/query in UI, visible result.

## Execution order

1. Start a clean CPU environment, remove prior test container/volumes first.
2. Run browser traversal and desktop recording; preserve screenshots/manifests.
3. Repeat the same process in a clean GPU environment, including GPU-visible
   UI operations where the service exposes them.
4. Review every case for visible lifecycle evidence and retry only failed cases
   after recording the cause. Do not report API-only coverage as browser-pass.

## Latest CPU browser evidence (2026-08-19 KST)

- Final recording directory: `CPU_20260819/browser_full_142826/`
- Desktop video: `CPU_browser_full_service_lifecycle.mp4` (498.1 seconds)
- Case result file: `CPU_browser_case_results.txt` (all seven browser cases exit 0)
- Main FeDiT menu: 15/15 cards PASS.
- Functional lifecycle cases: Dataset Catalog PASS; Data Collection/NiFi PASS;
  Label Studio SSO CRUD PASS; Dataset-to-Kubeflow Pipeline PASS including
  terminal result; AutoML PASS including one-click KServe serving, Ready state,
  browser inference, undeploy, model deletion, and job cleanup.
- Direct service route traversal: 12/12 PASS (Swagger page is only a route
  check, not functional evidence).
- A repository-wide search of this final evidence directory found no reserved
  internal marker in filenames, manifests, or captured labels.
- GPU must be recorded separately in a clean GPU container; do not reuse this
  CPU result as GPU evidence.
