# CPU browser full traversal result (2026-08-19 KST)

## Recording

- Video: `CPU_browser_full_service_lifecycle.mp4`
- Duration: 498.1 seconds
- Evidence directory: `CPU_20260819/browser_full_142826`
- Swagger/API documentation was used only as a route check; it is not counted
  as a functional service result.

## Result matrix

| Service / flow | Browser result | Lifecycle evidence |
|---|---|---|
| FeDiT main menu | PASS (15/15 cards) | menu screenshots 01–15 |
| Dataset Catalog | PASS | select → configure → create/upload → preprocess result → delete |
| Data Collection / NiFi | PASS | configure twin/connector → collect → result → stop/delete/apply/cleanup |
| Label Studio SSO | PASS | enter → create project → visible project → delete |
| Dataset → Kubeflow Pipeline | PASS | configure → submit → visible run → terminal result → cleanup |
| AutoML / Ray / MLflow / KServe | PASS | configure → running/result → one-click serve → Ready → browser inference → undeploy/model/job cleanup |
| Direct service routes | PASS (12/12) | route screenshots 01–12; external services are top-level/direct because they are not same-origin FeDiT iframe pages |

## Cleanup and naming checks

- Every functional manifest reports cleanup complete.
- After the recording, the transient pipeline-registered model was removed
  from the clean environment; the final model list and fixture pod list are
  empty.
- Case result file reports exit code 0 for all seven browser cases.
- No forbidden test marker was found in this directory's filenames, manifests,
  or captured labels.
- GPU is a separate pending evidence set and must not inherit this CPU result.
