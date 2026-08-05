let _monitoringData = null;
const _charts = {};
let _lastSuccessTime = null;
// _statusColor, _fmtNow → monitoring-alarm.js
// 임계값은 alarm_service.py(ZONES)가 단일 소스 — /summary 응답의 "zones" 필드에서 읽음
function _getZone(id) {
  return (_monitoringData?.zones?.[id]) ?? { warn: 75, danger: 90 };
}

// ── PVC 할당량(개수/용량) 표시 헬퍼 ────────────────────────────────────────────
function _pvcCountCell(g) {
  const limit = g.quota?.pvc_limit;
  const used = g.pvcs.length;
  const full = limit != null && used >= limit;
  return `<span style="${full ? "color:#ef4444;" : ""}">${used}${limit != null ? ` / ${limit}` : ""}</span>`;
}

function _pvcStorageCell(g) {
  const limit = g.quota?.storage_limit_gb;
  const usedStr = g.total_gb?.toFixed(1) ?? "-";
  const near = limit != null && limit > 0 && (g.total_gb ?? 0) / limit >= 0.9;
  return `<span style="${near ? "color:#ef4444;" : ""}">${usedStr}${limit != null ? ` / ${limit.toFixed(0)}` : ""} GB</span>`;
}

function _pvcPhaseBadge(phase) {
  const colors = { Bound: "#3b82f6", Pending: "#f59e0b", Lost: "#ef4444" };
  const icons = { Bound: "●", Pending: "⚠", Lost: "✕" };
  const label = phase || "-";
  return `<span class="pm-pvc-status-badge" style="color:${colors[label] || "#9ca3af"};">${icons[label] || "-"} ${esc(label)}</span>`;
}

function _pvcPhaseSummaryBadges(counts) {
  const pc = counts || {};
  const parts = [
    pc.Bound > 0 ? `<span class="pm-pvc-status-badge" style="color:#3b82f6;">● ${pc.Bound}</span>` : "",
    pc.Pending > 0 ? `<span class="pm-pvc-status-badge" style="color:#f59e0b;">⚠ ${pc.Pending}</span>` : "",
    pc.Lost > 0 ? `<span class="pm-pvc-status-badge" style="color:#ef4444;">✕ ${pc.Lost}</span>` : "",
  ].filter(Boolean);
  return parts.length
    ? `<span class="pm-pvc-status-group">${parts.join("")}</span>`
    : '<span class="pm-pvc-status-badge pm-pvc-status-muted">-</span>';
}


// 일반 사용자 "PVC 현황" 도넛 밑 범례(할당량 배지)
function _pvcQuotaBadge(group) {
  const quota = group?.quota;
  if (!quota) return "";
  const parts = [];
  if (quota.storage_limit_gb != null) {
    const near =
      quota.storage_limit_gb > 0 &&
      quota.storage_used_gb / quota.storage_limit_gb >= 0.9;
    parts.push(
      `<span style="color:${near ? "#ef4444" : "#6b7280"};">${quota.storage_used_gb.toFixed(1)} / ${quota.storage_limit_gb.toFixed(0)} GB</span>`,
    );
  }
  if (quota.pvc_limit != null) {
    const full = quota.pvc_used >= quota.pvc_limit;
    parts.push(
      `<span style="color:${full ? "#ef4444" : "#6b7280"};">PVC ${quota.pvc_used}/${quota.pvc_limit}개</span>`,
    );
  }
  return parts.length
    ? `<div style="font-size:11px; font-weight:600; display:flex; flex-direction:column; align-items:center; gap:4px; margin-top:8px;">${parts.join("")}</div>`
    : "";
}

// PVC 도넛 색상 팔레트 (PVC/namespace별로 다른 색 배정)
const _PVC_CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

// "내 PVC" 도넛: 할당량(storage_limit_gb) 대비 PVC(pod)별 사용량 슬라이스 + 여유
function _pvcPodSlices(group) {
  const pvcs = group?.pvcs ?? [];
  const labels = pvcs.map((p) => p.name);
  const values = pvcs.map((p) => p.allocated_gb ?? 0);
  const colors = pvcs.map(
    (_, i) => _PVC_CHART_COLORS[i % _PVC_CHART_COLORS.length],
  );

  const limitGb = group?.quota?.storage_limit_gb ?? null;
  const usedGb = values.reduce((sum, v) => sum + v, 0);
  if (limitGb != null && limitGb > usedGb) {
    labels.push("여유");
    values.push(limitGb - usedGb);
    colors.push("#e5e7eb");
  }
  return { labels, values, colors };
}

// 관리자 "사용자별 PVC 현황" 도넛: 전체 할당량(quota 합계) 대비 namespace별 사용량 슬라이스 + 여유
function _pvcNamespaceSlices(pvcGroups) {
  const totalCapacity = pvcGroups.reduce(
    (sum, g) => sum + (g.quota?.storage_limit_gb ?? 0),
    0,
  );

  const used = pvcGroups.filter((g) => (g.total_gb ?? 0) > 0);
  const labels = used.map((g) => g.ns);
  const values = used.map((g) => g.total_gb ?? 0);
  const colors = used.map(
    (_, i) => _PVC_CHART_COLORS[i % _PVC_CHART_COLORS.length],
  );

  const totalUsed = values.reduce((sum, v) => sum + v, 0);
  const remaining = totalCapacity - totalUsed;
  if (remaining > 0) {
    labels.push("여유");
    values.push(remaining);
    colors.push("#e5e7eb");
  }
  return { labels, values, colors };
}


function _latestKserveValue(points, fallback = null) {
  const list = Array.isArray(points) ? points : [];
  for (let i = list.length - 1; i >= 0; i--) {
    const raw = Array.isArray(list[i]) ? list[i][1] : list[i]?.y;
    const value = raw === null || raw === undefined ? NaN : parseFloat(raw);
    if (!Number.isNaN(value)) return value;
  }
  return fallback;
}

function _splitKserveName(label) {
  const value = String(label || "");
  const match = value.match(/^(.*) \((.*)\)$/);
  if (match) return { name: match[1], namespace: match[2], key: value };
  return { name: value || "-", namespace: "", key: value || "-" };
}

function _kserveMetricRows({ endpoints, rps, latency, errorRate, top5Latency }) {
  const rows = new Map();
  const ensure = (name, namespace = "") => {
    const key = namespace ? `${name} (${namespace})` : name;
    if (!rows.has(key)) {
      rows.set(key, {
        key,
        name: name || "-",
        namespace: namespace || "",
        ready: null,
        rps: null,
        errorRate: null,
        p95Ms: null,
      });
    }
    return rows.get(key);
  };

  (endpoints || []).forEach((e) => {
    const row = ensure(e.name, e.namespace);
    row.ready = !!e.ready;
  });

  (rps?.series || []).forEach((s) => {
    const info = _splitKserveName(s.name);
    ensure(info.name, info.namespace).rps = _latestKserveValue(s.data);
  });

  (latency?.series || []).forEach((s) => {
    const info = _splitKserveName(s.name);
    const seconds = _latestKserveValue(s.data);
    if (seconds !== null) ensure(info.name, info.namespace).p95Ms = seconds * 1000;
  });

  (top5Latency?.models || []).forEach((m) => {
    const info = _splitKserveName(m.name);
    ensure(info.name, m.namespace || info.namespace).p95Ms = m.latency_ms ?? null;
  });

  (errorRate?.models || []).forEach((m) => {
    const info = _splitKserveName(m.name);
    ensure(info.name, m.namespace || info.namespace).errorRate = m.error_rate ?? null;
  });

  return Array.from(rows.values()).sort((a, b) => a.key.localeCompare(b.key));
}

function _renderKserveMetricTableRows(rows, isAdminView, noDataTd) {
  if (!rows.length) return noDataTd(isAdminView ? 6 : 5);
  const fmt = (v, digits = 2) =>
    v === null || v === undefined || Number.isNaN(Number(v)) ? "-" : Number(v).toFixed(digits);
  return rows
    .map((r) => {
      const readyText = r.ready === null ? "-" : r.ready ? "Ready" : "Not Ready";
      const readyBg = r.ready === null ? "#e9ecef" : r.ready ? "#d4edda" : "#f8d7da";
      const readyColor = r.ready === null ? "#495057" : r.ready ? "#155724" : "#721c24";
      return `<tr>
        <td style="font-size:14px; font-weight:500;">${esc(r.name)}</td>
        ${isAdminView ? `<td style="font-size:12px; color:var(--text-muted); font-family:var(--font-mono);">${esc(r.namespace || "-")}</td>` : ""}
        <td><span style="padding:2px 8px; border-radius:4px; font-size:10px; font-weight:600; background:${readyBg}; color:${readyColor};">${readyText}</span></td>
        <td style="text-align:right; font-family:var(--font-mono); font-weight:600;">${fmt(r.rps, 3)}</td>
        <td style="text-align:right; font-family:var(--font-mono); font-weight:600; color:${(r.errorRate || 0) > 0 ? "#ef4444" : "#111827"};">${fmt(r.errorRate, 2)}</td>
        <td style="text-align:right; font-family:var(--font-mono); font-weight:600;">${fmt(r.p95Ms, 1)}</td>
      </tr>`;
    })
    .join("");
}

function _kserveMetricSummary(rows) {
  const total = rows.length;
  const rps = rows.reduce((sum, r) => sum + (Number(r.rps) || 0), 0);
  const err = rows.reduce((max, r) => Math.max(max, Number(r.errorRate) || 0), 0);
  const p95 = rows.reduce((max, r) => Math.max(max, Number(r.p95Ms) || 0), 0);
  return {
    total,
    rps: total ? rps.toFixed(3) : "-",
    errorRate: total ? err.toFixed(2) : "-",
    p95Ms: total ? p95.toFixed(1) : "-",
  };
}

function _formatChartTime(value) {
  const date = new Date(Number(value));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function _showChartPlaceholder(canvas, msg, color) {
  const parent = canvas?.parentElement;
  if (!parent) return;
  canvas.style.display = "none";
  let placeholder = parent.querySelector(`[data-chart-placeholder="${canvas.id}"]`);
  if (!placeholder) {
    placeholder = document.createElement("div");
    placeholder.dataset.chartPlaceholder = canvas.id;
    placeholder.style.cssText = "position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:20px; font-weight:700; letter-spacing:0.5px; white-space:nowrap;";
    parent.appendChild(placeholder);
  }
  placeholder.textContent = msg;
  placeholder.style.color = color;
}

function _hideChartPlaceholder(canvas) {
  const parent = canvas?.parentElement;
  if (!parent) return;
  canvas.style.display = "";
  parent.querySelector(`[data-chart-placeholder="${canvas.id}"]`)?.remove();
}


function _trendPoints(data) {
  return (data || [])
    .filter((point) => Array.isArray(point) && point.length >= 2 && point[1] !== null && point[1] !== undefined)
    .map(([ts, value]) => ({ x: Number(ts), y: Number(value) }));
}

function _resourceTrendItems(data) {
  const trends = data?.resource_trends || {};
  const gpu = data?.gpu || {};
  const sys = data?.system || {};
  const gpuMemMax = gpu.mem_total_mb ? Math.ceil(gpu.mem_total_mb / 1024) : undefined;
  const memMax = sys.mem_total_gb ? Number(sys.mem_total_gb) : undefined;
  return [
    { id: "trend-gpu-util", src: trends.gpu_util, color: "#2563eb", unit: "%", max: 100 },
    { id: "trend-gpu-mem", src: trends.gpu_mem_used_gb, color: "#ef4444", unit: "GB", max: gpuMemMax },
    { id: "trend-cpu", src: trends.cpu_pct, color: "#3b82f6", unit: "%", max: 100 },
    { id: "trend-mem", src: trends.mem_used_gb, color: "#8b5cf6", unit: "GB", max: memMax },
  ];
}

function _trendTickLabel(value, unit) {
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  if (unit === "%") return `${Math.round(n)}%`;
  return `${Number.isInteger(n) ? n : n.toFixed(1)} ${unit}`;
}

function _renderResourceTrendCharts(data) {
  const now = Date.now();
  _resourceTrendItems(data).forEach(({ id, src, color, unit, max }) => {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const points = _trendPoints(src?.data);
    if (!points.length) return;
    const yMax = max && max > 0 ? max : undefined;
    _charts[id]?.destroy?.();
    _charts[id] = new Chart(canvas, {
      type: "line",
      data: {
        datasets: [{
          data: points,
          borderColor: color,
          backgroundColor: "transparent",
          tension: 0.25,
          pointRadius: 0,
          pointHitRadius: 8,
          borderWidth: 1.8,
          fill: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: {
            type: "linear",
            min: now - 60 * 60 * 1000,
            max: now,
            grid: { color: "#f3f4f6", drawTicks: false },
            border: { display: false },
            ticks: {
              display: false,
              maxTicksLimit: 0,
            },
          },
          y: {
            min: 0,
            max: yMax,
            grid: { color: "#eef2f7", drawTicks: false },
            border: { display: false },
            ticks: {
              color: "#6b7280",
              font: { size: 9 },
              maxTicksLimit: 2,
              padding: 0,
              callback: (v) => _trendTickLabel(v, unit),
            },
          },
        },
      },
    });
  });
}

function _updateResourceTrendCharts(data) {
  const now = Date.now();
  _resourceTrendItems(data).forEach(({ id, src, max }) => {
    const chart = _charts[id];
    if (!chart) {
      _renderResourceTrendCharts(data);
      return;
    }
    const points = _trendPoints(src?.data);
    if (!points.length) return;
    chart.data.datasets[0].data = points;
    chart.options.scales.x.min = now - 60 * 60 * 1000;
    chart.options.scales.x.max = now;
    chart.options.scales.y.max = max && max > 0 ? max : undefined;
    chart.update("none");
  });
}


// 최초 진입 시 전체 HTML 생성
async function renderMonitoring() {
  let data;
  try {
    data = await API.get("/api/monitoring/summary");
    _monitoringData = data;
  } catch (e) {
    return `
        <div class="pm-page-header">
            <h1>MLOps 모니터링</h1>
        </div>
        <div style="background:#fee2e2; border:1px solid #fca5a5; padding:16px 20px; border-radius:8px; color:#b91c1c; font-size:13px;">
            지표를 불러올 수 없습니다. Prometheus 연결을 확인해주세요.
        </div>`;
  }

  const gpu = data.gpu || {};
  const sys = data.system || {};
  const allNull = [
    gpu.util_pct,
    gpu.mem_used_gb,
    sys.cpu_cores,
    sys.mem_used_gb,
  ].every((v) => v === null || v === undefined);

  const prometheusWarning = allNull
    ? `
    <div style="background:#fff3cd; border:1px solid #fde68a; padding:10px 14px; border-radius:8px; font-size:12px; margin-bottom:16px; color:#92400e;">
        지표를 불러올 수 없습니다. Prometheus 연결을 확인해주세요.
    </div>`
    : "";

  const donutChart = (id, label, valueStr, subStr, pct, accent, trendId = "") => `
        <div class="pm-resource-gauge">
            <div class="pm-resource-gauge-main">
                <canvas id="${id}" width="54" height="54" data-pct="${pct ?? 0}" data-accent="${accent}"></canvas>
                <div class="pm-resource-gauge-copy">
                    <div class="pm-resource-gauge-label">${esc(label)}</div>
                    <span id="val-${id}" class="pm-resource-gauge-value">${esc(valueStr ?? "-")}</span>
                    ${subStr ? `<span id="sub-${id}" class="pm-resource-gauge-sub">${esc(subStr)}</span>` : ""}
                </div>
            </div>
            ${trendId ? `<div class="pm-resource-mini-chart"><canvas id="${trendId}"></canvas></div>` : ""}
        </div>`;

  const gpuUtil = gpu.util_pct ?? null;
  const gpuMemUsedMb = gpu.mem_used_mb ?? null;
  const gpuMemTotalMb = gpu.mem_total_mb ?? null;
  const gpuMemPct = gpu.mem_pct ?? null;
  const _fmtMem = (mb) =>
    mb == null
      ? null
      : mb < 1024
        ? mb + " MiB"
        : (mb / 1024).toFixed(1) + " GB";
  const gpuMemUsed = _fmtMem(gpuMemUsedMb);
  const gpuMemTotal = _fmtMem(gpuMemTotalMb);
  const gpuTemp = gpu.temp_c ?? null;
  const gpuPower = gpu.power_w ?? null;
  const cpuCores = sys.cpu_cores ?? null;
  const cpuTotal = sys.cpu_total_cores ?? null;
  const cpuPct = sys.cpu_pct ?? null;
  const memUsedGb = sys.mem_used_gb ?? null;
  const memTotalGb = sys.mem_total_gb ?? null;
  const memPct = sys.mem_pct ?? null;

  const isAdminView = data.is_admin_view ?? true;
  const currentNs = data.namespace ?? "";
  const currentEmail = data.user_email ?? "";

  const ray = data.ray || {};
  const rayStatus = ray.status ?? "error";
  const rayTrend = data.ray_trend || {};
  const rayClusterUtil = data.ray_cluster_util || {};
  const rayNodeCount = data.ray_node_count || {};
  const automl = data.automl || {};
  const automlError = automl.error ?? true;
  const automlJobs = automl.jobs || [];
  const kserve = data.kserve || {};
  const kserveError = kserve.error ?? true;
  const kserveEndpoints = kserve.endpoints || [];
  const mlflowStats = data.mlflow || {
    status: "error",
    experiments: null,
    models: null,
    runs: null,
  };
  const mlflowModelsStatus = data.mlflow_models?.status ?? "error";
  const mlflowModels = data.mlflow_models?.models ?? [];
  const notebookStatus = data.notebook_resources?.status ?? "error";
  const notebookRows = data.notebook_resources?.rows ?? [];
  const runningNbStatus = data.running_notebooks?.status ?? "error";
  const runningNbs = data.running_notebooks?.notebooks ?? [];
  const pvcStatus = data.pvc?.status ?? "error";
  const pvcGroups = data.pvc?.groups ?? [];
  const mlflowExpRunsStatus = data.mlflow_experiment_runs?.status ?? "error";
  const mlflowExpRuns = data.mlflow_experiment_runs?.experiments ?? [];

  const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}초 전`;
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
  };

  const statusBadge = (status) => {
    const colors = {
      SUCCEEDED: { bg: "#d4edda", color: "#155724" },
      RUNNING: { bg: "#e8f4ff", color: "#1a56a8" },
      FAILED: { bg: "#f8d7da", color: "#721c24" },
      STOPPED: { bg: "#fff3cd", color: "#856404" },
      QUEUED: { bg: "#f5e6ff", color: "#6f42c1" },
      PENDING: { bg: "#e9ecef", color: "#495057" },
    };
    const c = colors[status] || { bg: "#e9ecef", color: "#495057" };
    return `<span style="padding:2px 8px; border-radius:4px; font-size:10px; font-weight:600; background:${c.bg}; color:${c.color};">${esc(status)}</span>`;
  };

  const noConnTd = (cols) =>
    `<tr><td colspan="${cols}" style="text-align:center; padding:32px 0; font-size:20px; font-weight:700; color:#ef4444; letter-spacing:0.5px;">No connection</td></tr>`;
  const noDataTd = (cols) =>
    `<tr><td colspan="${cols}" style="text-align:center; padding:32px 0; font-size:20px; font-weight:700; color:#d1d5db; letter-spacing:0.5px;">No data</td></tr>`;
  const noConnDiv = `<div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:20px; font-weight:700; color:#ef4444; letter-spacing:0.5px; white-space:nowrap;">No connection</div>`;
  const noDataDiv = `<div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:20px; font-weight:700; color:#d1d5db; letter-spacing:0.5px; white-space:nowrap;">No data</div>`;

  const automlDisplayJobs = isAdminView
    ? automlJobs
    : automlJobs.filter((j) => j.submitted_by === currentEmail);
  const automlRows = automlDisplayJobs
    .map(
      (j) => `
        <tr>
            <td>
                <div style="font-size:14px; font-weight:500;">${esc(j.name)}</div>
                ${isAdminView ? `<div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${esc(j.submitted_by)}</div>` : ""}
            </td>
            <td>${statusBadge(j.status)}</td>
            <td>
                <div style="font-size:13px; font-weight:500;">${timeAgo(j.submitted_at)}</div>
                <div style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono); margin-top:2px;">${esc(j.submitted_at)}</div>
            </td>
        </tr>`,
    )
    .join("");

  const kserveDisplayEndpoints = isAdminView
    ? kserveEndpoints
    : kserveEndpoints.filter((e) => e.namespace === currentNs);
  const kserveRows = kserveDisplayEndpoints
    .map(
      (e) => `
        <tr>
            <td style="font-size:14px; font-weight:500;">${esc(e.name)}</td>
            ${isAdminView ? `<td style="font-size:13px; color:var(--text-muted); font-family:var(--font-mono);">${esc(e.namespace)}</td>` : ""}
            <td><span style="padding:2px 8px; border-radius:4px; font-size:10px; font-weight:600; background:${e.ready ? "#d4edda" : "#f8d7da"}; color:${e.ready ? "#155724" : "#721c24"};">${e.ready ? "Ready" : "Not Ready"}</span></td>
        </tr>`,
    )
    .join("");

  const kserveRps = data.kserve_rps || { status: "error", series: [] };
  const kserveLatency = data.kserve_latency_p95 || { status: "error", series: [] };
  const kserveErrorRate = data.kserve_error_rate || { status: "error", models: [] };
  const kserveTop5Latency = data.kserve_top5_latency || { status: "error", models: [] };
  const kserveMetricRows = _kserveMetricRows({
    endpoints: kserveDisplayEndpoints,
    rps: kserveRps,
    latency: kserveLatency,
    errorRate: kserveErrorRate,
    top5Latency: kserveTop5Latency,
  });
  const kserveMetricSummary = _kserveMetricSummary(kserveMetricRows);
  const kserveMetricStatus =
    kserveError && !kserveMetricRows.length
      ? "error"
      : kserveMetricRows.length
        ? "ok"
        : "empty";

  const gpuTempPct = gpuTemp !== null ? Math.min(100, Math.round(gpuTemp)) : 0;
  const gpuTempFillColor =
    gpuTempPct >= 85 ? "#EF4444" : gpuTempPct >= 75 ? "#F59E0B" : "#1DB877";
  const gpuTempLabel =
    gpuTemp === null
      ? "-"
      : gpuTempPct >= 85
        ? "위험"
        : gpuTempPct >= 75
          ? "주의"
          : "정상";
  const gpuTempLabelColor =
    gpuTempPct >= 85 ? "#EF4444" : gpuTempPct >= 75 ? "#b07415" : "#0d8a57";

  return `
    <div class="pm-page-header">
        <h1>MLOps 모니터링</h1>
        <p style="margin:0;">GPU/CPU, Ray, AutoML, KServe 상태를 모니터링 합니다.</p>
    </div>

    <button class="pm-alarm-btn" id="pm-alarm-btn" onclick="document.getElementById('pm-alarm-sidebar')?.classList.contains('open') ? window._closeAlarmSidebar() : window._openAlarmSidebar()" title="알람 이력" style="position:fixed; bottom:28px; right:28px; z-index:900; width:auto; padding:0 18px; gap:7px; flex-direction:row; font-size:13px; font-weight:600; color:#fff; border:none; border-radius:14px; background:#3b82f6; height:44px; box-shadow:0 4px 10px rgba(59,130,246,0.15);">
        <img src="static/icons/log.svg" width="22" height="22" alt="알람 이력" style="display:block; background:transparent; filter:brightness(0) invert(1);">
        알람 이력
    </button>

    ${prometheusWarning}

    <div id="section-gpu" class="pm-gpu-grid-wrapper">

        <div class="pm-monitor-card pm-resource-status-card">
            <span id="alarm-ind-gpu" style="display:none; position:absolute; top:14px; right:14px;"><span data-tip="" style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#e53935;color:white;font-size:11px;font-weight:700;cursor:default;">!</span></span>
            <div class="pm-resource-status-header">
                <div>
                    <div class="pm-section-title" style="font-size:17px; margin-bottom:3px;">내 자원 상태</div>
                    <div class="pm-resource-status-desc">GPU, CPU, 메모리, 온도와 전력 상태를 확인합니다.</div>
                </div>
            </div>
            <div class="pm-resource-metric-grid">
                <div class="pm-resource-metric-card">
                    ${donutChart("chart-gpu-util", "GPU 사용률", gpuUtil !== null ? gpuUtil + "%" : null, "", gpuUtil, "#2563eb", "trend-gpu-util")}
                </div>
                <div class="pm-resource-metric-card">
                    ${donutChart("chart-gpu-mem", "GPU 메모리", gpuMemUsed, gpuMemTotal ? `/ ${gpuMemTotal}` : "", gpuMemPct, "#ef4444", "trend-gpu-mem")}
                </div>
                <div id="section-system" class="pm-resource-metric-card">
                    <span id="alarm-ind-system" style="display:none; position:absolute; top:12px; right:12px;"><span data-tip="" style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#f59e0b;color:white;font-size:11px;font-weight:700;cursor:default;">!</span></span>
                    ${donutChart("chart-cpu", "CPU 사용률", cpuPct !== null ? cpuPct + "%" : null, cpuCores !== null ? `${cpuCores.toFixed(2)} / ${cpuTotal ?? "-"} core` : "", cpuPct, "#3b82f6", "trend-cpu")}
                </div>
                <div class="pm-resource-metric-card">
                    ${donutChart("chart-mem", "메모리 사용량", memUsedGb !== null ? memUsedGb.toFixed(1) + " GB" : null, memTotalGb !== null ? `/ ${memTotalGb} GB` : "", memPct, "#8b5cf6", "trend-mem")}
                </div>
                <div id="section-gpu-temp" class="pm-resource-metric-card pm-resource-metric-card--plain">
                    <span id="alarm-ind-gpu-temp" style="display:none; position:absolute; top:12px; right:12px;"><span data-tip="" style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#e53935;color:white;font-size:11px;font-weight:700;cursor:default;">!</span></span>
                    <div class="pm-resource-temp-visual">
                        <div class="pm-resource-temp-bar">
                            <div id="bar-gpu-temp-fill" style="height:${gpuTempPct}%; background:${gpuTempFillColor};"></div>
                        </div>
                        <div id="bulb-gpu-temp" class="pm-resource-temp-bulb" style="background:${gpuTempFillColor};"></div>
                    </div>
                    <div class="pm-resource-plain-copy">
                        <div class="pm-resource-gauge-label">GPU 온도</div>
                        <div id="stat-gpu-temp-value" class="pm-resource-plain-value" style="color:${gpuTempLabelColor};">${gpuTemp !== null ? gpuTemp + "°C" : "-"} <span>${gpuTempLabel}</span></div>
                        <div class="pm-resource-gauge-sub">기준 75° / 85°</div>
                    </div>
                </div>
                <div class="pm-resource-metric-card pm-resource-metric-card--plain">
                    <div class="pm-resource-power-icon">PWR</div>
                    <div class="pm-resource-plain-copy">
                        <div class="pm-resource-gauge-label">GPU 전력</div>
                        <div id="stat-gpu-power-value" class="pm-resource-plain-value pm-resource-plain-value--power">${gpuPower !== null ? gpuPower + " W" : "-"}</div>
                        <div class="pm-resource-gauge-sub">Prometheus 전력 지표 기준</div>
                    </div>
                </div>
            </div>
        </div>

        <div id="section-automl" class="pm-monitor-card pm-fixed-card">
        <span id="alarm-ind-automl" style="display:none; position:absolute; top:14px; right:14px;"><span data-tip="" style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#f59e0b;color:white;font-size:11px;font-weight:700;cursor:default;">!</span></span>
        <div class="pm-automl-header-row">
            <div class="pm-section-title" style="font-size:15px;">AutoML 최근 Job</div>
            <div class="pm-automl-summary-inline">
            ${[
              {
                id: "stat-automl-total",
                label: "전체",
                value: automlError ? "-" : automlDisplayJobs.length,
                color: "#6b7280",
              },
              {
                id: "stat-automl-running",
                label: "실행중",
                value: automlError
                  ? "-"
                  : automlDisplayJobs.filter((j) => j.status === "RUNNING")
                      .length,
                color: "#2563eb",
              },
              {
                id: "stat-automl-success",
                label: "성공",
                value: automlError
                  ? "-"
                  : automlDisplayJobs.filter((j) => j.status === "SUCCEEDED")
                      .length,
                color: "#16a34a",
              },
              {
                id: "stat-automl-failed",
                label: "실패",
                value: automlError
                  ? "-"
                  : automlDisplayJobs.filter((j) => j.status === "FAILED")
                      .length,
                color: "#ef4444",
              },
            ]
              .map(
                (s) => `
                <div class="pm-automl-summary-item">
                    <span class="pm-automl-summary-dot" style="background:${s.color};"></span>
                    <span class="pm-automl-summary-label">${s.label}</span>
                    <span id="${s.id}" class="pm-automl-summary-value" style="color:${s.color};">${s.value}</span>
                </div>`,
              )
              .join("")}
            </div>
        </div>
        <div style="flex:1; min-height:0; overflow-y:auto; border-radius:6px;">
        <table class="pm-table">
            <thead style="position:sticky; top:0; background:#fff; z-index:1;"><tr><th>${isAdminView ? "이름 / 제출자" : "이름"}</th><th>상태</th><th>제출 시간 / 경과</th></tr></thead>
            <tbody id="tbody-automl">${
              automlError
                ? noConnTd(3)
                : automlDisplayJobs.length === 0
                  ? noDataTd(3)
                  : automlRows
            }</tbody>
        </table>
        </div>
    </div>
        <div id="section-notebook-resources" class="pm-monitor-card pm-fixed-card">
            <div class="pm-section-title" style="font-size:15px; margin-bottom:12px; flex-shrink:0;">${isAdminView ? "사용자별 노트북 자원 사용량" : "노트북 자원 사용량"} (CPU cores / Memory GB)</div>
            <div style="flex:1; min-height:0; overflow-y:auto; border-radius:6px;">
            <table class="pm-table">
                <thead style="position:sticky; top:0; background:#fff; z-index:1;">
                    <tr>
                        <th>Time</th>
                        ${isAdminView ? "<th>Namespace</th>" : ""}
                        <th>Pod</th>
                        <th>상태</th>
                        <th style="text-align:right;">Value #A (CPU cores)</th>
                        <th style="text-align:right;">Value #B (Memory GB)</th>
                    </tr>
                </thead>
                <tbody id="tbody-notebook-res">
                    ${
                      notebookStatus === "error"
                        ? noConnTd(isAdminView ? 6 : 5)
                        : notebookStatus === "empty" ||
                            notebookRows.length === 0
                          ? noDataTd(isAdminView ? 6 : 5)
                          : notebookRows
                              .map(
                                (r) => `
                    <tr>
                        <td style="font-size:12px; font-family:var(--font-mono); color:var(--text-muted);">${esc(r.time)}</td>
                        ${isAdminView ? `<td style="font-size:13px;">${esc(r.ns)}</td>` : ""}
                        <td style="font-size:12px; font-family:var(--font-mono);">${esc(r.pod)}</td>
                        <td><span style="padding:2px 8px; border-radius:4px; font-size:10px; font-weight:600; background:#d4edda; color:#155724;">Running</span></td>
                        <td style="font-size:13px; font-family:var(--font-mono); text-align:right;">${esc(String(r.cpu))}</td>
                        <td style="font-size:13px; font-family:var(--font-mono); text-align:right;">${esc(String(r.mem))}</td>
                    </tr>`,
                              )
                              .join("")
                    }
                </tbody>
            </table>
            </div>
        </div>

    <div id="section-pvc" class="pm-monitor-card pm-fixed-card">
        <span id="alarm-ind-pvc" style="display:none; position:absolute; top:14px; right:14px;"><span data-tip="" style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#e53935;color:white;font-size:11px;font-weight:700;cursor:default;">!</span></span>
        <div class="pm-pvc-body">
            <div style="flex:3; display:flex; flex-direction:column; min-height:0;">
            ${isAdminView ? `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-shrink:0;">
                <div id="pvc-table-title" class="pm-section-title" style="font-size:15px; margin-bottom:0;">사용자별 PVC 현황</div>
                <div style="display:flex; gap:4px;">
                    <button id="pvc-left-tab-all"  style="padding:3px 9px; border-radius:5px; border:1px solid #3b82f6; background:#3b82f6; color:#fff; font-size:11px; font-weight:600; cursor:pointer;">전체</button>
                    <button id="pvc-left-tab-mine" style="padding:3px 9px; border-radius:5px; border:1px solid #e5e7eb; background:#fff; color:#6b7280; font-size:11px; font-weight:600; cursor:pointer;">내 PVC</button>
                </div>
            </div>` : `<div style="margin-bottom:6px; flex-shrink:0;">
                <div id="pvc-table-title" class="pm-section-title" style="font-size:15px;">PVC 현황</div>
            </div>`}
            <div style="flex:1; min-height:0; overflow-y:auto; border-radius:6px; position:relative;">
            ${(() => {
              if (pvcStatus === "error") return noConnDiv;
              if (pvcStatus === "empty" || pvcGroups.length === 0)
                return noDataDiv;

              const phaseColors = {
                Bound: "#3b82f6",
                Pending: "#f59e0b",
                Lost: "#ef4444",
              };
              const phaseIcons = { Bound: "●", Pending: "⚠", Lost: "✕" };

              const adminRows = pvcGroups
                .map((g) => {
                  const pc = g.phase_counts || {};
                  const badges = [
                    pc.Bound > 0
                      ? `<span style="color:#3b82f6; font-weight:600; margin-right:6px;">● ${pc.Bound}</span>`
                      : "",
                    pc.Pending > 0
                      ? `<span style="color:#f59e0b; font-weight:600; margin-right:6px;">⚠ ${pc.Pending}</span>`
                      : "",
                    pc.Lost > 0
                      ? `<span style="color:#ef4444; font-weight:600;">✕ ${pc.Lost}</span>`
                      : "",
                  ]
                    .filter(Boolean)
                    .join("");
                  return `<tr>
                        <td style="font-size:13px;">${esc(g.ns)}</td>
                        <td style="text-align:right; font-family:var(--font-mono); font-weight:600;">${_pvcCountCell(g)}</td>
                        <td style="text-align:right; font-family:var(--font-mono);">${_pvcStorageCell(g)}</td>
                        <td class="pm-pvc-status-cell">${_pvcPhaseSummaryBadges(pc)}</td>
                    </tr>`;
                })
                .join("");

              const myGroup = pvcGroups.find((g) => g.ns === currentNs);
              const myPvcs = myGroup?.pvcs ?? [];
              const mineRows = myPvcs
                .map((p) => {
                  const color = phaseColors[p.phase] || "#9ca3af";
                  const icon = phaseIcons[p.phase] || "?";
                  return `<tr>
                        <td style="font-size:12px; font-family:var(--font-mono);" title="${esc(p.name)}">${esc(p.name)}</td>
                        <td style="text-align:right; font-family:var(--font-mono);">${p.allocated_gb.toFixed(1)} GB</td>
                        <td class="pm-pvc-status-cell">${_pvcPhaseBadge(p.phase)}</td>
                    </tr>`;
                })
                .join("");

              if (isAdminView) {
                return `
                    <div id="pvc-view-all">
                        <table class="pm-table">
                            <thead style="position:sticky; top:0; background:#fff; z-index:1;">
                                <tr><th>Namespace</th><th style="text-align:right;">PVC 수</th><th style="text-align:right;">총 용량</th><th class="pm-pvc-status-col">상태</th></tr>
                            </thead>
                            <tbody id="tbody-pvc-all">${adminRows}</tbody>
                        </table>
                    </div>
                    <div id="pvc-view-mine" style="display:none;">
                        <table class="pm-table">
                            <thead style="position:sticky; top:0; background:#fff; z-index:1;">
                                <tr><th>PVC 이름</th><th style="text-align:right;">용량</th><th class="pm-pvc-status-col">상태</th></tr>
                            </thead>
                            <tbody id="tbody-pvc-mine">${mineRows || noDataTd(3)}</tbody>
                        </table>
                    </div>`;
              } else {
                const pvcs = pvcGroups.flatMap((g) => g.pvcs);
                if (pvcs.length === 0) return noDataDiv;
                const userRows = pvcs
                  .map((p) => {
                    const color = phaseColors[p.phase] || "#9ca3af";
                    const icon = phaseIcons[p.phase] || "?";
                    return `<tr>
                            <td style="font-size:12px; font-family:var(--font-mono);" title="${esc(p.name)}">${esc(p.name)}</td>
                            <td style="text-align:right; font-family:var(--font-mono);">${p.allocated_gb.toFixed(1)} GB</td>
                            <td class="pm-pvc-status-cell">${_pvcPhaseBadge(p.phase)}</td>
                        </tr>`;
                  })
                  .join("");
                return `<table class="pm-table">
                        <thead style="position:sticky; top:0; background:#fff; z-index:1;">
                            <tr><th>PVC 이름</th><th style="text-align:right;">용량</th><th class="pm-pvc-status-col">상태</th></tr>
                        </thead>
                        <tbody id="tbody-pvc-user">${userRows}</tbody>
                    </table>`;
              }
            })()}
            </div>
            </div>
            <div style="flex:2; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:0; border-left:1px solid #f3f4f6; padding-left:16px;">
                ${
                  pvcStatus === "ok" && pvcGroups.length > 0
                    ? `<div style="position:relative; width:100%; max-width:180px; aspect-ratio:1/1;">
                           <canvas id="chart-pvc-donut" style="position:absolute; inset:0;"></canvas>
                       </div>
                       ${!isAdminView ? `<div id="pvc-quota-badge">${_pvcQuotaBadge(pvcGroups.find((g) => g.ns === currentNs))}</div>` : ""}`
                    : noDataDiv
                }
            </div>
        </div>
    </div>

        <div id="section-kserve" class="pm-monitor-card pm-fixed-card">
            <span id="alarm-ind-kserve" style="display:none; position:absolute; top:14px; right:14px;"><span data-tip="" style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#e53935;color:white;font-size:11px;font-weight:700;cursor:default;">!</span></span>
            <div class="pm-kserve-header-row">
                <div class="pm-section-title" style="font-size:15px;">KServe Endpoint</div>
                <div class="pm-kserve-summary-inline">
                ${[
                  {
                    id: "stat-kserve-total",
                    label: "전체",
                    value: kserveError ? "-" : kserveDisplayEndpoints.length,
                    color: "#6b7280",
                  },
                  {
                    id: "stat-kserve-ready",
                    label: "Ready",
                    value: kserveError
                      ? "-"
                      : kserveDisplayEndpoints.filter((e) => e.ready).length,
                    color: "#16a34a",
                  },
                  {
                    id: "stat-kserve-notready",
                    label: "Not Ready",
                    value: kserveError
                      ? "-"
                      : kserveDisplayEndpoints.filter((e) => !e.ready).length,
                    color: "#ef4444",
                  },
                ]
                  .map(
                    (s) => `
                    <div class="pm-kserve-summary-item">
                        <span class="pm-kserve-summary-dot" style="background:${s.color};"></span>
                        <span class="pm-kserve-summary-label">${s.label}</span>
                        <span id="${s.id}" class="pm-kserve-summary-value" style="color:${s.color};">${s.value}</span>
                    </div>`,
                  )
                  .join("")}
                </div>
            </div>
            <div style="flex:1; min-height:0; overflow-y:auto; border-radius:6px;">
            <table class="pm-table">
                <thead style="position:sticky; top:0; background:#fff; z-index:1;"><tr><th>이름</th>${isAdminView ? "<th>Namespace</th>" : ""}<th>상태</th></tr></thead>
                <tbody id="tbody-kserve">${
                  kserveError
                    ? noConnTd(isAdminView ? 3 : 2)
                    : kserveDisplayEndpoints.length === 0
                      ? noDataTd(isAdminView ? 3 : 2)
                      : kserveRows
                }</tbody>
            </table>
            </div>
        </div>

    </div>



    <div id="section-mlflow" class="pm-monitor-2col pm-mlflow-kserve-row" style="margin-bottom:16px;">
        <div class="pm-monitor-card pm-fixed-card pm-mlflow-overview-card">
            <div class="pm-mlflow-header-row">
                <div class="pm-section-title" style="font-size:15px;">MLflow 현황</div>
                <div class="pm-mlflow-summary">
                    ${[
                      { id: "stat-mlflow-exp", label: "Experiments", value: mlflowStats.experiments ?? "-", color: "#16a34a" },
                      { id: "stat-mlflow-models", label: "Models", value: mlflowStats.models ?? "-", color: "#2563eb" },
                      { id: "stat-mlflow-runs", label: "Runs", value: mlflowStats.runs ?? "-", color: "#9333ea" },
                    ]
                      .map(
                        (s) => `
                        <div class="pm-mlflow-summary-item">
                            <span class="pm-mlflow-summary-dot" style="background:${s.color};"></span>
                            <span class="pm-mlflow-summary-label">${s.label}</span>
                            <span id="${s.id}" class="pm-mlflow-summary-value" style="color:${s.color};">${s.value}</span>
                        </div>`,
                      )
                      .join("")}
                </div>
            </div>
            <div class="pm-mlflow-tables-grid">
                <div class="pm-mlflow-subtable">
                    <div class="pm-mlflow-subtitle">실험별 Run 수</div>
                    <div class="pm-mlflow-table-scroll">
                        <table class="pm-table">
                            <thead style="position:sticky; top:0; background:#fff; z-index:1;">
                                <tr><th>실험명</th><th style="text-align:right;">Run 수</th></tr>
                            </thead>
                            <tbody id="tbody-mlflow-exp-runs">
                                ${
                                  mlflowExpRunsStatus === "error"
                                    ? noConnTd(2)
                                    : mlflowExpRunsStatus === "empty" || mlflowExpRuns.length === 0
                                      ? noDataTd(2)
                                      : mlflowExpRuns
                                          .map(
                                            (e) => `
                                <tr>
                                    <td>${esc(e.name)}</td>
                                    <td style="text-align:right; font-family:var(--font-mono); font-weight:600;">${e.runs}</td>
                                </tr>`,
                                          )
                                          .join("")
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="pm-mlflow-subtable">
                    <div class="pm-mlflow-subtitle">모델별 버전 수</div>
                    <div class="pm-mlflow-table-scroll">
                        <table class="pm-table">
                            <thead style="position:sticky; top:0; background:#fff; z-index:1;">
                                <tr><th>모델명</th><th style="text-align:center;">버전 수</th><th>최신 Stage</th></tr>
                            </thead>
                            <tbody id="tbody-mlflow-models">
                                ${
                                  mlflowModelsStatus === "error"
                                    ? noConnTd(3)
                                    : mlflowModelsStatus === "empty" || mlflowModels.length === 0
                                      ? noDataTd(3)
                                      : mlflowModels
                                          .map((m) => {
                                            const stageStyle =
                                              m.stage === "Production"
                                                ? "background:#e8f4ff; color:#1a56a8;"
                                                : m.stage === "Staging"
                                                  ? "background:#f5e6ff; color:#6f42c1;"
                                                  : "background:#e9ecef; color:#495057;";
                                            return `<tr>
                                                <td>${esc(m.name)}</td>
                                                <td style="text-align:center; font-family:var(--font-mono); font-weight:600;">${m.versions}</td>
                                                <td><span style="padding:2px 8px; border-radius:4px; font-size:10px; font-weight:600; ${stageStyle}">${esc(m.stage)}</span></td>
                                            </tr>`;
                                          })
                                          .join("")
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
            <div id="section-kserve-metrics" class="pm-monitor-card pm-fixed-card">
                <span id="section-kserve-latency" style="position:absolute; inset:auto auto 0 0; width:1px; height:1px; overflow:hidden;"></span>
                <span id="section-kserve-error" style="position:absolute; inset:auto auto 0 0; width:1px; height:1px; overflow:hidden;"></span>
                <span id="alarm-ind-kserve-latency" style="display:none; position:absolute; top:14px; right:14px;"><span data-tip="" style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#f59e0b;color:white;font-size:11px;font-weight:700;cursor:default;">!</span></span>
                <span id="alarm-ind-kserve-error" style="display:none; position:absolute; top:14px; right:40px;"><span data-tip="" style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#e53935;color:white;font-size:11px;font-weight:700;cursor:default;">!</span></span>
                <div class="pm-kserve-metrics-header-row">
                    <div class="pm-section-title" style="font-size:15px;">KServe 추론 지표</div>
                    <div class="pm-kserve-metrics-summary">
                        <span>모델 <b id="stat-kserve-metric-models">${kserveMetricSummary.total}</b></span>
                        <span>RPS <b id="stat-kserve-metric-rps">${kserveMetricSummary.rps}</b></span>
                        <span>5xx <b id="stat-kserve-metric-5xx">${kserveMetricSummary.errorRate}%</b></span>
                        <span>p95 <b id="stat-kserve-metric-p95">${kserveMetricSummary.p95Ms} ms</b></span>
                    </div>
                </div>
                <div style="flex:1; min-height:0; overflow-y:auto; border-radius:6px;">
                    <table class="pm-table">
                        <thead style="position:sticky; top:0; background:#fff; z-index:1;">
                            <tr>
                                <th>모델</th>
                                ${isAdminView ? "<th>Namespace</th>" : ""}
                                <th>상태</th>
                                <th style="text-align:right;">RPS</th>
                                <th style="text-align:right;">5xx(%)</th>
                                <th style="text-align:right;">p95(ms)</th>
                            </tr>
                        </thead>
                        <tbody id="tbody-kserve-metrics">
                            ${kserveMetricStatus === "error" ? noConnTd(isAdminView ? 6 : 5) : _renderKserveMetricTableRows(kserveMetricRows, isAdminView, noDataTd)}
                        </tbody>
                    </table>
                </div>
            </div>
    </div>

    <div id="section-ray" class="pm-monitor-card pm-ray-section">
        <div class="pm-section-title" style="font-size:15px; margin-bottom:0; flex-shrink:0;">Ray 클러스터</div>
        <div class="pm-ray-inner">
            <div id="section-ray-util" style="flex:1; min-height:0; background:#fff; border:1px solid transparent; border-radius:8px; display:flex; flex-direction:column; padding:12px;">
                <div style="text-align:center; font-size:13px; font-weight:600; color:#374151; margin-bottom:4px; flex-shrink:0;">Cluster Utilization</div>
                <div id="legend-ray-util" style="display:flex; flex-wrap:wrap; gap:4px 14px; margin-bottom:6px; flex-shrink:0; justify-content:center;"></div>
                <div style="flex:1; min-height:0; position:relative;">
                    <canvas id="chart-ray-util"></canvas>
                </div>
            </div>
            <div id="section-ray-node" style="flex:1; min-height:0; background:#fff; border:1px solid transparent; border-radius:8px; display:flex; flex-direction:column; padding:12px;">
                <div style="position:relative; text-align:center; margin-bottom:4px; flex-shrink:0;">
                    <div style="font-size:13px; font-weight:600; color:#374151;">Node Count</div>
                    <div id="stat-ray-finished" style="position:absolute; right:0; top:0; font-size:11px; color:#6b7280;"></div>
                </div>
                <div id="legend-ray-node" style="display:flex; flex-wrap:wrap; gap:4px 14px; margin-bottom:6px; flex-shrink:0; justify-content:center;"></div>
                <div style="flex:1; min-height:0; position:relative;">
                    <canvas id="chart-ray-node-count"></canvas>
                </div>
            </div>
        </div>
    </div>

    `;
}

// ── Ray 커스텀 범례 렌더 헬퍼 ────────────────────────────────────────────────
const _renderRayLegend = (elId, datasets, fmtVal) => {
  const el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = datasets
    .map((ds) => {
      const last = ds.data.length ? ds.data[ds.data.length - 1]?.y : null;
      const val = last != null ? fmtVal(last) : "-";
      const label = String(ds.label)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `<div style="display:flex; align-items:center; gap:5px;">
            <div style="width:12px; height:12px; background:${ds.borderColor}; flex-shrink:0;"></div>
            <span style="font-size:11px; color:#6b7280; white-space:nowrap;">${label}</span>
            <span style="font-size:11px; color:#9ca3af; white-space:nowrap;">${val}</span>
        </div>`;
    })
    .join("");
};

// 차트 및 이벤트 초기화
async function setupMonitoringPage() {
  Object.values(_charts).forEach((c) => c?.destroy());
  Object.keys(_charts).forEach((k) => delete _charts[k]);

  Chart.defaults.animation = false;

  const isAdminView = _monitoringData?.is_admin_view ?? true;
  const currentNs = _monitoringData?.namespace ?? "";

  const gpuTrend = _monitoringData?.gpu_trend || {};
  const kserveRps = _monitoringData?.kserve_rps || {
    status: "error",
    series: [],
  };
  const kserveLatency = _monitoringData?.kserve_latency_p95 || {
    status: "error",
    series: [],
  };
  const kserveErrorRate = _monitoringData?.kserve_error_rate || {
    status: "error",
    models: [],
  };
  const kserveTop5Latency = _monitoringData?.kserve_top5_latency || {
    status: "error",
    models: [],
  };

  let tooltip = document.getElementById("pm-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "pm-tooltip";
    document.body.appendChild(tooltip);
    document.addEventListener("mouseover", (e) => {
      const el = e.target.closest("[data-tip]");
      if (!el) return;
      tooltip.textContent = el.dataset.tip;
      tooltip.style.display = "block";
    });
    document.addEventListener("mousemove", (e) => {
      tooltip.style.left = "auto";
      tooltip.style.right = (window.innerWidth - e.clientX) + "px";
      tooltip.style.top = e.clientY + "px";
    });
    document.addEventListener("mouseout", (e) => {
      if (!e.target.closest("[data-tip]")) return;
      tooltip.style.display = "none";
    });
  }
  ["chart-gpu-util", "chart-gpu-mem", "chart-cpu", "chart-mem"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const pct = Math.max(0, Math.min(100, parseFloat(el.dataset.pct) || 0));
      const accent = el.dataset.accent || "#2563eb";
      const statusColor = _statusColor(id);
      const color = statusColor === "#1DB877" ? accent : statusColor;
      _charts[id] = new Chart(el, {
        type: "doughnut",
        data: {
          datasets: [
            {
              data: [pct, 100 - pct],
              backgroundColor: [color, "#eef2f7"],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: false,
          cutout: "72%",
          layout: { padding: 0 },
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
        },
      });
    },
  );

  const KSERVE_COLORS = [
    { border: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
    { border: "#10b981", bg: "rgba(16,185,129,0.12)" },
    { border: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    { border: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    { border: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  ];
  const KSERVE_WINDOW_MS = 30 * 60 * 1000;

  _renderResourceTrendCharts(_monitoringData);

  const top5El = document.getElementById("chart-top5-latency");
  if (top5El) {
    const top5Placeholder = (msg, isError) => {
      const card = top5El.closest(".pm-fixed-card");
      top5El.remove();
      card.appendChild(
        Object.assign(document.createElement("div"), {
          style: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:20px; font-weight:700; letter-spacing:0.5px; white-space:nowrap; color:${isError ? "#ef4444" : "#d1d5db"};`,
          textContent: msg,
        }),
      );
    };

    if (kserveTop5Latency.status === "error") {
      top5Placeholder("No connection", true);
    } else if (
      kserveTop5Latency.status === "empty" ||
      !kserveTop5Latency.models?.length
    ) {
      top5Placeholder("No data", false);
    } else {
      _charts["chart-top5-latency"] = new Chart(top5El, {
        type: "bar",
        data: {
          labels: kserveTop5Latency.models.map((m) => m.name),
          datasets: [
            {
              label: "p95 지연시간 (ms)",
              data: kserveTop5Latency.models.map((m) => m.latency_ms),
              backgroundColor: "#3b82f6",
              borderRadius: 4,
              borderSkipped: false,
              maxBarThickness: 32,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.parsed.x.toLocaleString()} ms`,
              },
            },
          },
          scales: {
            x: {
              min: 0,
              grid: { color: "#f3f4f6" },
              ticks: {
                font: { size: 11 },
                color: "#9ca3af",
                callback: (v) => v + " ms",
              },
            },
            y: {
              grid: { display: false },
              ticks: { font: { size: 11 }, color: "#6b7280" },
            },
          },
        },
      });
    }
  }

  const errorRateEl = document.getElementById("chart-kserve-error-rate");
  if (errorRateEl) {
    const errPlaceholder = (msg, isError) => {
      const card = errorRateEl.closest(".pm-fixed-card");
      errorRateEl.remove();
      card.appendChild(
        Object.assign(document.createElement("div"), {
          style: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:20px; font-weight:700; letter-spacing:0.5px; white-space:nowrap; color:${isError ? "#ef4444" : "#d1d5db"};`,
          textContent: msg,
        }),
      );
    };

    if (kserveErrorRate.status === "error") {
      errPlaceholder("No connection", true);
    } else if (
      kserveErrorRate.status === "empty" ||
      !kserveErrorRate.models?.length
    ) {
      errPlaceholder("No data", false);
    } else {
      const labels = kserveErrorRate.models.map((m) => m.name);
      const values = kserveErrorRate.models.map((m) => m.error_rate);
      const barColors = values.map((v) =>
        v >= 5 ? "#ef4444" : v >= 1 ? "#f59e0b" : "#10b981",
      );

      _charts["chart-kserve-error-rate"] = new Chart(errorRateEl, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "에러율 (%)",
              data: values,
              backgroundColor: barColors,
              borderRadius: 4,
              borderSkipped: false,
              maxBarThickness: 40,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.parsed.y.toFixed(4)} %`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 }, color: "#6b7280" },
            },
            y: {
              min: -2,
              suggestedMax: 10,
              grid: { color: "#f3f4f6" },
              ticks: {
                font: { size: 11 },
                color: "#9ca3af",
                callback: (v) => (v < 0 ? "" : v + "%"),
              },
            },
          },
        },
      });
    }
  }

  const latencyEl = document.getElementById("chart-kserve-latency");
  if (latencyEl) {
    const latencyPlaceholder = (msg, isError) => {
      const card = latencyEl.closest(".pm-fixed-card");
      latencyEl.remove();
      card.appendChild(
        Object.assign(document.createElement("div"), {
          style: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:20px; font-weight:700; letter-spacing:0.5px; white-space:nowrap; color:${isError ? "#ef4444" : "#d1d5db"};`,
          textContent: msg,
        }),
      );
    };

    if (kserveLatency.status === "error") {
      latencyPlaceholder("No connection", true);
    } else if (
      kserveLatency.status === "empty" ||
      !kserveLatency.series?.length
    ) {
      latencyPlaceholder("No data", false);
    } else {
      const now = Date.now();
      const datasets = kserveLatency.series.map((s, i) => {
        const color = KSERVE_COLORS[i % KSERVE_COLORS.length];
        return {
          label: s.name,
          data: s.data.map(([ts, v]) => ({ x: ts, y: v })),
          borderColor: color.border,
          backgroundColor: color.border,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
          fill: false,
        };
      });

      _charts["chart-kserve-latency"] = new Chart(latencyEl, {
        type: "line",
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: {
              display: true,
              position: "top",
              labels: {
                font: { size: 11 },
                color: "#6b7280",
                boxWidth: 12,
                padding: 10,
              },
            },
            tooltip: {
              callbacks: {
                label: (ctx) =>
                  ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(4)} s`,
              },
            },
          },
          scales: {
            x: {
              type: "linear",
              min: now - KSERVE_WINDOW_MS,
              max: now,
              grid: { color: "#f3f4f6" },
              ticks: { font: { size: 11 }, color: "#9ca3af", maxTicksLimit: 7, callback: (v) => _formatChartTime(v) },
            },
            y: {
              min: 0,
              grid: { color: "#f3f4f6" },
              ticks: {
                font: { size: 11 },
                color: "#9ca3af",
                callback: (v) => v + " s",
              },
            },
          },
        },
      });
    }
  }

  const rpsEl = document.getElementById("chart-kserve-rps");
  if (rpsEl) {
    const rpsPlaceholder = (msg, isError) => {
      const card = rpsEl.closest(".pm-fixed-card");
      rpsEl.remove();
      card.appendChild(
        Object.assign(document.createElement("div"), {
          style: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:20px; font-weight:700; letter-spacing:0.5px; white-space:nowrap; color:${isError ? "#ef4444" : "#d1d5db"};`,
          textContent: msg,
        }),
      );
    };

    if (kserveRps.status === "error") {
      rpsPlaceholder("No connection", true);
    } else if (kserveRps.status === "empty" || !kserveRps.series?.length) {
      rpsPlaceholder("No data", false);
    } else {
      const now = Date.now();
      const datasets = kserveRps.series.map((s, i) => {
        const color = KSERVE_COLORS[i % KSERVE_COLORS.length];
        return {
          label: s.name,
          data: s.data.map(([ts, v]) => ({ x: ts, y: v })),
          borderColor: color.border,
          backgroundColor: color.bg,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
          fill: true,
        };
      });

      _charts["chart-kserve-rps"] = new Chart(rpsEl, {
        type: "line",
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: {
              display: true,
              position: "top",
              labels: {
                font: { size: 11 },
                color: "#6b7280",
                boxWidth: 12,
                padding: 10,
              },
            },
            tooltip: {
              callbacks: {
                label: (ctx) =>
                  ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(4)} req/s`,
              },
            },
          },
          scales: {
            x: {
              type: "linear",
              min: now - KSERVE_WINDOW_MS,
              max: now,
              grid: { color: "#f3f4f6" },
              ticks: { font: { size: 11 }, color: "#9ca3af", maxTicksLimit: 7, callback: (v) => _formatChartTime(v) },
            },
            y: {
              min: 0,
              grid: { color: "#f3f4f6" },
              ticks: {
                font: { size: 11 },
                color: "#9ca3af",
                callback: (v) => v + " req/s",
              },
            },
          },
        },
      });
    }
  }

  const trendEl = document.getElementById("chart-gpu-trend");
  if (trendEl) {
    const now = Date.now();
    const chartPlaceholder = (msg, color) => {
      trendEl.replaceWith(
        Object.assign(document.createElement("div"), {
          style: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:20px; font-weight:700; color:${color}; letter-spacing:0.5px; white-space:nowrap;`,
          textContent: msg,
        }),
      );
    };

    if (gpuTrend.status === "error") {
      chartPlaceholder("No connection", "#ef4444");
    } else if (gpuTrend.status === "empty" || !gpuTrend.data?.length) {
      chartPlaceholder("No data", "#d1d5db");
    } else {
      const trendPoints = gpuTrend.data.map(([ts, v]) => ({ x: ts, y: v }));

      _charts["chart-gpu-trend"] = new Chart(trendEl, {
        type: "line",
        data: {
          datasets: [
            {
              label: "GPU 사용률 (%)",
              data: trendPoints,
              borderColor: "#f59e0b",
              backgroundColor: "rgba(245,158,11,0.1)",
              tension: 0,
              pointRadius: 0,
              pointHitRadius: 20,
              pointBackgroundColor: "#f59e0b",
              borderWidth: 2.5,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: { legend: { display: false } },
          scales: {
            x: {
              type: "linear",
              grid: { color: "#f3f4f6" },
              ticks: { font: { size: 11 }, color: "#9ca3af", maxTicksLimit: 7, callback: (v) => _formatChartTime(v) },
            },
            y: {
              min: 0,
              grid: { color: "#f3f4f6" },
              ticks: {
                font: { size: 11 },
                color: "#9ca3af",
                callback: (v) => v + "%",
              },
            },
          },
        },
      });
    } // else
  }

  // ── Cluster Utilization ──────────────────────────────────────────────────
  const rayUtilEl = document.getElementById("chart-ray-util");
  if (rayUtilEl) {
    const ru = _monitoringData?.ray_cluster_util || {};
    const placeholder = (msg, color) => _showChartPlaceholder(rayUtilEl, msg, color);
    if (ru.status === "error") {
      placeholder("No connection", "#ef4444");
    } else if (
      ru.status === "empty" ||
      (!ru.cpu?.length && !ru.mem?.length && !ru.disk?.length)
    ) {
      placeholder("No data", "#d1d5db");
    } else {
      _hideChartPlaceholder(rayUtilEl);
      const toPoints = (arr) =>
        (arr || []).map(([ts, v]) => ({
          x: ts,
          y: v !== null ? parseFloat(v) : null,
        }));
      const utilDatasets = [
        {
          label: "Disk",
          data: toPoints(ru.disk),
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59,130,246,0.08)",
          tension: 0,
          pointRadius: 0,
          pointHitRadius: 20,
          borderWidth: 2,
          fill: true,
        },
        {
          label: "CPU (physical)",
          data: toPoints(ru.cpu),
          borderColor: "#1DB877",
          backgroundColor: "rgba(29,184,119,0.08)",
          tension: 0,
          pointRadius: 0,
          pointHitRadius: 20,
          borderWidth: 2,
          fill: true,
        },
        {
          label: "Memory (RAM)",
          data: toPoints(ru.mem),
          borderColor: "#67E8F9",
          backgroundColor: "rgba(103,232,249,0.08)",
          tension: 0,
          pointRadius: 0,
          pointHitRadius: 20,
          borderWidth: 2,
          fill: true,
        },
      ];
      _charts["chart-ray-util"] = new Chart(rayUtilEl, {
        type: "line",
        data: { datasets: utilDatasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) =>
                  ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(2) ?? "-"}%`,
              },
            },
          },
          scales: {
            x: {
              type: "linear",
              min: Date.now() - 60 * 60 * 1000,
              max: Date.now(),
              grid: { color: "#f3f4f6" },
              ticks: { font: { size: 11 }, color: "#9ca3af", maxTicksLimit: 7, callback: (v) => _formatChartTime(v) },
            },
            y: {
              min: 0,
              max: 100,
              grid: { color: "#f3f4f6" },
              ticks: {
                font: { size: 11 },
                color: "#9ca3af",
                callback: (v) => v + "%",
              },
            },
          },
        },
      });
      _renderRayLegend(
        "legend-ray-util",
        utilDatasets,
        (v) => v.toFixed(2) + " %",
      );
    }
  }

  // ── Node Count ───────────────────────────────────────────────────────────
  const rayNodeEl = document.getElementById("chart-ray-node-count");
  if (rayNodeEl) {
    const rn = _monitoringData?.ray_node_count || {};
    const finishedEl = document.getElementById("stat-ray-finished");
    if (finishedEl && rn.finished_jobs != null) {
      finishedEl.textContent = `완료 Job: ${rn.finished_jobs.toLocaleString()}`;
    }
    const placeholder = (msg, color) => _showChartPlaceholder(rayNodeEl, msg, color);
    if (rn.status === "error") {
      placeholder("No connection", "#ef4444");
    } else if (rn.status === "empty" || !rn.types?.length) {
      placeholder("No data", "#d1d5db");
    } else {
      _hideChartPlaceholder(rayNodeEl);
      const NODE_COLORS = [
        "#F59E0B",
        "#3B82F6",
        "#1DB877",
        "#8B5CF6",
        "#EF4444",
      ];
      const toPoints = (arr) =>
        (arr || []).map(([ts, v]) => ({
          x: ts,
          y: v !== null ? parseFloat(v) : null,
        }));
      const nodeDatasets = rn.types.slice(0, 5).map((t, i) => ({
        label: !t.name || t.name === "unknown" ? "전체 노드" : t.name,
        data: toPoints(t.data),
        borderColor: NODE_COLORS[i],
        backgroundColor: NODE_COLORS[i] + "26",
        tension: 0,
        pointRadius: 0,
        pointHitRadius: 20,
        borderWidth: 2,
        fill: true,
      }));
      _charts["chart-ray-node-count"] = new Chart(rayNodeEl, {
        type: "line",
        data: { datasets: nodeDatasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) =>
                  ` ${ctx.dataset.label}: ${ctx.parsed.y ?? "-"} nodes`,
              },
            },
          },
          scales: {
            x: {
              type: "linear",
              min: Date.now() - 60 * 60 * 1000,
              max: Date.now(),
              grid: { color: "#f3f4f6" },
              ticks: { font: { size: 11 }, color: "#9ca3af", maxTicksLimit: 7, callback: (v) => _formatChartTime(v) },
            },
            y: {
              min: 0,
              stacked: true,
              grid: { color: "#f3f4f6" },
              ticks: {
                font: { size: 11 },
                color: "#9ca3af",
                stepSize: 1,
                callback: (v) => (Number.isInteger(v) ? v + " nodes" : ""),
              },
            },
          },
        },
      });
      _renderRayLegend("legend-ray-node", nodeDatasets, (v) => v + " nodes");
    }
  }

  const pvcDonutEl = document.getElementById("chart-pvc-donut");
  if (pvcDonutEl) {
    const isAdminView = _monitoringData?.is_admin_view ?? false;
    const pvcGroups = _monitoringData?.pvc?.groups ?? [];

    const namespaceUsage = _pvcNamespaceSlices(pvcGroups);
    const myUsage = _pvcPodSlices(pvcGroups.find((g) => g.ns === currentNs));

    const initialLabels = isAdminView ? namespaceUsage.labels : myUsage.labels;
    const initialValues = isAdminView ? namespaceUsage.values : myUsage.values;
    const initialColors = isAdminView ? namespaceUsage.colors : myUsage.colors;

    if (initialValues.length && !initialValues.every((v) => v === 0)) {
      const chart = (_charts["chart-pvc-donut"] = new Chart(pvcDonutEl, {
        type: "doughnut",
        data: {
          labels: initialLabels,
          datasets: [
            {
              data: initialValues,
              backgroundColor: initialColors,
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "60%",
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: () => [],
                label: (ctx) => {
                  const label =
                    ctx.label.length > 20
                      ? ctx.label.slice(0, 17) + "..."
                      : ctx.label;
                  return ` ${label}: ${ctx.parsed.toFixed(1)} GB`;
                },
              },
            },
          },
        },
      }));

      if (isAdminView) {
        const TAB_ON =
          "padding:4px 10px; border-radius:6px; border:1px solid #3b82f6; background:#3b82f6; color:#fff; font-size:11px; font-weight:600; cursor:pointer;";
        const TAB_OFF =
          "padding:4px 10px; border-radius:6px; border:1px solid #e5e7eb; background:#fff; color:#6b7280; font-size:11px; font-weight:600; cursor:pointer;";

        const btnAll = document.getElementById("pvc-left-tab-all");
        const btnMine = document.getElementById("pvc-left-tab-mine");
        const viewAll = document.getElementById("pvc-view-all");
        const viewMine = document.getElementById("pvc-view-mine");
        const tableTitle = document.getElementById("pvc-table-title");

        const switchMode = (mode) => {
          const isMine = mode === "mine";
          const newLabels = isMine ? myUsage.labels : namespaceUsage.labels;
          const newValues = isMine ? myUsage.values : namespaceUsage.values;
          const newColors = isMine ? myUsage.colors : namespaceUsage.colors;

          viewAll.style.display = isMine ? "none" : "";
          viewMine.style.display = isMine ? "" : "none";
          btnAll.style.cssText = isMine ? TAB_OFF : TAB_ON;
          btnMine.style.cssText = isMine ? TAB_ON : TAB_OFF;
          if (tableTitle)
            tableTitle.firstChild.nodeValue = isMine
              ? "PVC 현황"
              : "사용자별 PVC 현황";

          chart.data.labels = newLabels;
          chart.data.datasets[0].data = newValues;
          chart.data.datasets[0].backgroundColor = newColors;
          chart.update();
        };

        btnAll?.addEventListener("click", () => switchMode("all"));
        btnMine?.addEventListener("click", () => switchMode("mine"));
      }
    } // if (initialValues.length && ...)
  }

  setupAlarmHistoryCards();
  if (_monitoringData) updateAlarmIndicators(_monitoringData);

  const params = new URLSearchParams(window.location.search);
  const scrollTo = params.get("scrollTo");
  const alarmFilter = params.get("alarmFilter");
  if (scrollTo) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById(scrollTo);
        if (!el) return;
        const headerEl = document.querySelector(".pm-navbar");
        const offset = headerEl ? headerEl.offsetHeight + 16 : 20;
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      });
    });
  }
  if (alarmFilter) {
    requestAnimationFrame(() => {
      window._openAlarmSidebar();
      window._setAlarmFilter(alarmFilter);
    });
  }
}

// 알람 인디케이터 업데이트 및 과거 이력 관리
// updateAlarmIndicators, setupAlarmHistoryCards → monitoring-alarm.js

// 새로 받아온 모니터링 데이터를 기반으로 화면의 모든 지표와 차트를 업데이트
function updateMonitoringInPlace(newData) {
  _monitoringData = newData;

  const gpu = newData.gpu || {};
  const sys = newData.system || {};
  const ray = newData.ray || {};
  const automl = newData.automl || {};
  const kserve = newData.kserve || {};

  const isAdminView = newData.is_admin_view ?? true;
  const currentNs = newData.namespace ?? "";
  const currentEmail = newData.user_email ?? "";

  const gpuUtil = gpu.util_pct ?? null;
  const gpuMemUsedMb = gpu.mem_used_mb ?? null;
  const gpuMemTotalMb = gpu.mem_total_mb ?? null;
  const gpuMemPct = gpu.mem_pct ?? null;
  const _fmtMemR = (mb) =>
    mb == null
      ? null
      : mb < 1024
        ? mb + " MiB"
        : (mb / 1024).toFixed(1) + " GB";
  const gpuMemUsed = _fmtMemR(gpuMemUsedMb);
  const gpuMemTotal = _fmtMemR(gpuMemTotalMb);
  const gpuTemp = gpu.temp_c ?? null;
  const gpuPower = gpu.power_w ?? null;
  const cpuCores = sys.cpu_cores ?? null;
  const cpuTotal = sys.cpu_total_cores ?? null;
  const cpuPct = sys.cpu_pct ?? null;
  const memUsedGb = sys.mem_used_gb ?? null;
  const memTotalGb = sys.mem_total_gb ?? null;
  const memPct = sys.mem_pct ?? null;

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  // ── 도넛 차트 4개 ──────────────────────────────────────────────
  [
    {
      id: "chart-gpu-util",
      pct: gpuUtil,
      accent: "#f59e0b",
      valueStr: gpuUtil !== null ? gpuUtil + "%" : null,
      subStr: " ",
    },
    {
      id: "chart-gpu-mem",
      pct: gpuMemPct,
      accent: "#ef4444",
      valueStr: gpuMemUsed,
      subStr: gpuMemTotal ?? "",
    },
    {
      id: "chart-cpu",
      pct: cpuPct,
      accent: "#3b82f6",
      valueStr: cpuPct !== null ? cpuPct + "%" : null,
      subStr: cpuCores !== null ? `${cpuCores.toFixed(2)} / ${cpuTotal ?? "-"} core` : "",
    },
    {
      id: "chart-mem",
      pct: memPct,
      accent: "#8b5cf6",
      valueStr: memUsedGb !== null ? memUsedGb.toFixed(1) + " GB" : null,
      subStr: memTotalGb !== null ? memTotalGb + " GB" : "",
    },
  ].forEach(({ id, pct, accent, valueStr, subStr }) => {
    const chart = _charts[id];
    if (chart) {
      const canvas = document.getElementById(id);
      const accent = canvas?.dataset?.accent || "#2563eb";
      const statusColor = _statusColor(id);
      const color = statusColor === "#1DB877" ? accent : statusColor;
      const safePct = Math.max(0, Math.min(100, pct ?? 0));
      chart.data.datasets[0].data = [safePct, 100 - safePct];
      chart.data.datasets[0].backgroundColor = [color, "#eef2f7"];
      chart.update("none");
    }
    setText("val-" + id, valueStr ?? "-");
    setText("sub-" + id, subStr ?? "");
  });

  _updateResourceTrendCharts(newData);

  // ── GPU 온도 / 전력 ────────────────────────────────────────────
  const tempPct = gpuTemp !== null ? Math.min(100, Math.round(gpuTemp)) : 0;
  const tempFillColor =
    tempPct >= 85 ? "#EF4444" : tempPct >= 75 ? "#F59E0B" : "#1DB877";
  const tempLabel =
    gpuTemp === null
      ? "-"
      : tempPct >= 85
        ? "위험"
        : tempPct >= 75
          ? "주의"
          : "정상";
  const tempColor =
    tempPct >= 85 ? "#EF4444" : tempPct >= 75 ? "#b07415" : "#0d8a57";
  const tempEl = document.getElementById("stat-gpu-temp-value");
  if (tempEl) {
    tempEl.style.color = tempColor;
    tempEl.innerHTML = `${gpuTemp !== null ? gpuTemp + "°C" : "-"} <span style="font-size:12px;">${tempLabel}</span>`;
  }
  const barEl = document.getElementById("bar-gpu-temp-fill");
  if (barEl) {
    barEl.style.height = tempPct + "%";
    barEl.style.background = tempFillColor;
  }
  const bulbEl = document.getElementById("bulb-gpu-temp");
  if (bulbEl) bulbEl.style.background = tempFillColor;
  setText("stat-gpu-power-value", gpuPower !== null ? gpuPower + " W" : "-");

  // ── GPU 추이 차트 ──────────────────────────────────────────────
  const gpuTrend = newData.gpu_trend || {};
  if (_charts["chart-gpu-trend"] && gpuTrend.data?.length) {
    const now = Date.now();
    _charts["chart-gpu-trend"].data.datasets[0].data = gpuTrend.data.map(
      ([ts, v]) => ({ x: ts, y: v }),
    );
    _charts["chart-gpu-trend"].update("none");
  }

  // ── Ray: Cluster Utilization ──────────────────────────────────
  const ruNew = newData.ray_cluster_util || {};
  if (_charts["chart-ray-util"] && ruNew.status === "ok") {
    const toP = (arr) =>
      (arr || []).map(([ts, v]) => ({
        x: ts,
        y: v !== null ? parseFloat(v) : null,
      }));
    const nowTs = Date.now();
    if (ruNew.disk?.length)
      _charts["chart-ray-util"].data.datasets[0].data = toP(ruNew.disk);
    if (ruNew.cpu?.length)
      _charts["chart-ray-util"].data.datasets[1].data = toP(ruNew.cpu);
    if (ruNew.mem?.length)
      _charts["chart-ray-util"].data.datasets[2].data = toP(ruNew.mem);
    _charts["chart-ray-util"].options.scales.x.min = nowTs - 60 * 60 * 1000;
    _charts["chart-ray-util"].options.scales.x.max = nowTs;
    _charts["chart-ray-util"].update("none");
    _renderRayLegend(
      "legend-ray-util",
      _charts["chart-ray-util"].data.datasets,
      (v) => v.toFixed(2) + " %",
    );
  }

  // ── Ray: Node Count ───────────────────────────────────────────
  const rnNew = newData.ray_node_count || {};
  const finishedEl = document.getElementById("stat-ray-finished");
  if (finishedEl && rnNew.finished_jobs != null) {
    finishedEl.textContent = `완료 Job: ${rnNew.finished_jobs.toLocaleString()}`;
  }
  if (
    _charts["chart-ray-node-count"] &&
    rnNew.status === "ok" &&
    rnNew.types?.length
  ) {
    const toP = (arr) =>
      (arr || []).map(([ts, v]) => ({
        x: ts,
        y: v !== null ? parseFloat(v) : null,
      }));
    const nowTs = Date.now();
    rnNew.types.slice(0, 5).forEach((t, i) => {
      if (_charts["chart-ray-node-count"].data.datasets[i]) {
        _charts["chart-ray-node-count"].data.datasets[i].data = toP(t.data);
      }
    });
    _charts["chart-ray-node-count"].options.scales.x.min =
      nowTs - 60 * 60 * 1000;
    _charts["chart-ray-node-count"].options.scales.x.max = nowTs;
    _charts["chart-ray-node-count"].update("none");
    _renderRayLegend(
      "legend-ray-node",
      _charts["chart-ray-node-count"].data.datasets,
      (v) => v + " nodes",
    );
  }

  // ── AutoML ────────────────────────────────────────────────────
  const automlError = automl.error ?? true;
  const automlJobs = automl.jobs || [];
  const automlDisplayJobs = isAdminView
    ? automlJobs
    : automlJobs.filter((j) => j.submitted_by === currentEmail);
  const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}초 전`;
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
  };
  const statusBadge = (status) => {
    const colors = {
      SUCCEEDED: { bg: "#d4edda", color: "#155724" },
      RUNNING: { bg: "#e8f4ff", color: "#1a56a8" },
      FAILED: { bg: "#f8d7da", color: "#721c24" },
      STOPPED: { bg: "#fff3cd", color: "#856404" },
      QUEUED: { bg: "#f5e6ff", color: "#6f42c1" },
      PENDING: { bg: "#e9ecef", color: "#495057" },
    };
    const c = colors[status] || { bg: "#e9ecef", color: "#495057" };
    return `<span style="padding:2px 8px; border-radius:4px; font-size:10px; font-weight:600; background:${c.bg}; color:${c.color};">${esc(status)}</span>`;
  };
  const noConnTd = (cols) =>
    `<tr><td colspan="${cols}" style="text-align:center; padding:32px 0; font-size:20px; font-weight:700; color:#ef4444; letter-spacing:0.5px;">No connection</td></tr>`;
  const noDataTd = (cols) =>
    `<tr><td colspan="${cols}" style="text-align:center; padding:32px 0; font-size:20px; font-weight:700; color:#d1d5db; letter-spacing:0.5px;">No data</td></tr>`;

  setText("stat-automl-total", automlError ? "-" : automlDisplayJobs.length);
  setText(
    "stat-automl-running",
    automlError
      ? "-"
      : automlDisplayJobs.filter((j) => j.status === "RUNNING").length,
  );
  setText(
    "stat-automl-success",
    automlError
      ? "-"
      : automlDisplayJobs.filter((j) => j.status === "SUCCEEDED").length,
  );
  setText(
    "stat-automl-failed",
    automlError
      ? "-"
      : automlDisplayJobs.filter((j) => j.status === "FAILED").length,
  );
  const tbodyAutoml = document.getElementById("tbody-automl");
  if (tbodyAutoml) {
    tbodyAutoml.innerHTML = automlError
      ? noConnTd(3)
      : automlDisplayJobs.length === 0
        ? noDataTd(3)
        : automlDisplayJobs
            .map(
              (j) => `
                <tr>
                    <td>
                        <div style="font-size:14px; font-weight:500;">${esc(j.name)}</div>
                        ${isAdminView ? `<div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${esc(j.submitted_by)}</div>` : ""}
                    </td>
                    <td>${statusBadge(j.status)}</td>
                    <td>
                        <div style="font-size:13px; font-weight:500;">${timeAgo(j.submitted_at)}</div>
                        <div style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono); margin-top:2px;">${esc(j.submitted_at)}</div>
                    </td>
                </tr>`,
            )
            .join("");
  }

  // ── KServe ────────────────────────────────────────────────────
  const kserveError = kserve.error ?? true;
  const kserveEndpoints = kserve.endpoints || [];
  const kserveDisplayEndpoints = isAdminView
    ? kserveEndpoints
    : kserveEndpoints.filter((e) => e.namespace === currentNs);

  setText(
    "stat-kserve-total",
    kserveError ? "-" : kserveDisplayEndpoints.length,
  );
  setText(
    "stat-kserve-ready",
    kserveError ? "-" : kserveDisplayEndpoints.filter((e) => e.ready).length,
  );
  setText(
    "stat-kserve-notready",
    kserveError ? "-" : kserveDisplayEndpoints.filter((e) => !e.ready).length,
  );
  const tbodyKserve = document.getElementById("tbody-kserve");
  if (tbodyKserve) {
    tbodyKserve.innerHTML = kserveError
      ? noConnTd(isAdminView ? 3 : 2)
      : kserveDisplayEndpoints.length === 0
        ? noDataTd(isAdminView ? 3 : 2)
        : kserveDisplayEndpoints
            .map(
              (e) => `
                <tr>
                    <td style="font-size:14px; font-weight:500;">${esc(e.name)}</td>
                    ${isAdminView ? `<td style="font-size:13px; color:var(--text-muted); font-family:var(--font-mono);">${esc(e.namespace)}</td>` : ""}
                    <td><span style="padding:2px 8px; border-radius:4px; font-size:10px; font-weight:600; background:${e.ready ? "#d4edda" : "#f8d7da"}; color:${e.ready ? "#155724" : "#721c24"};">${e.ready ? "Ready" : "Not Ready"}</span></td>
                </tr>`,
            )
            .join("");
  }

  const kserveRpsMetrics = newData.kserve_rps || { status: "error", series: [] };
  const kserveLatencyMetrics = newData.kserve_latency_p95 || { status: "error", series: [] };
  const kserveErrorRateMetrics = newData.kserve_error_rate || { status: "error", models: [] };
  const kserveTop5Metrics = newData.kserve_top5_latency || { status: "error", models: [] };
  const kserveMetricRows = _kserveMetricRows({
    endpoints: kserveDisplayEndpoints,
    rps: kserveRpsMetrics,
    latency: kserveLatencyMetrics,
    errorRate: kserveErrorRateMetrics,
    top5Latency: kserveTop5Metrics,
  });
  const kserveMetricSummary = _kserveMetricSummary(kserveMetricRows);
  setText("stat-kserve-metric-models", kserveMetricSummary.total);
  setText("stat-kserve-metric-rps", kserveMetricSummary.rps);
  setText("stat-kserve-metric-5xx", `${kserveMetricSummary.errorRate}%`);
  setText("stat-kserve-metric-p95", `${kserveMetricSummary.p95Ms} ms`);
  const kserveMetricStatus =
    kserveError && !kserveMetricRows.length
      ? "error"
      : kserveMetricRows.length
        ? "ok"
        : "empty";
  const tbodyKserveMetrics = document.getElementById("tbody-kserve-metrics");
  if (tbodyKserveMetrics) {
    tbodyKserveMetrics.innerHTML =
      kserveMetricStatus === "error"
        ? noConnTd(isAdminView ? 6 : 5)
        : _renderKserveMetricTableRows(kserveMetricRows, isAdminView, noDataTd);
  }

  // ── MLflow 통계 ───────────────────────────────────────────────
  const mlflowStats = newData.mlflow || {};
  setText("stat-mlflow-exp", mlflowStats.experiments ?? "-");
  setText("stat-mlflow-models", mlflowStats.models ?? "-");
  setText("stat-mlflow-runs", mlflowStats.runs ?? "-");

  // ── 노트북 자원 사용량 테이블 ─────────────────────────────────
  const notebookStatus = newData.notebook_resources?.status ?? "error";
  const notebookRows = newData.notebook_resources?.rows ?? [];
  const tbodyNb = document.getElementById("tbody-notebook-res");
  if (tbodyNb) {
    tbodyNb.innerHTML =
      notebookStatus === "error"
        ? noConnTd(isAdminView ? 6 : 5)
        : notebookRows.length === 0
          ? noDataTd(isAdminView ? 6 : 5)
          : notebookRows
              .map(
                (r) => `
                <tr>
                    <td style="font-size:12px; font-family:var(--font-mono); color:var(--text-muted);">${esc(r.time)}</td>
                    ${isAdminView ? `<td style="font-size:13px;">${esc(r.ns)}</td>` : ""}
                    <td style="font-size:12px; font-family:var(--font-mono);">${esc(r.pod)}</td>
                    <td><span style="padding:2px 8px; border-radius:4px; font-size:10px; font-weight:600; background:#d4edda; color:#155724;">Running</span></td>
                    <td style="font-size:13px; font-family:var(--font-mono); text-align:right;">${esc(String(r.cpu))}</td>
                    <td style="font-size:13px; font-family:var(--font-mono); text-align:right;">${esc(String(r.mem))}</td>
                </tr>`,
              )
              .join("");
  }

  // ── MLflow 모델 테이블 ────────────────────────────────────────
  const mlflowModels = newData.mlflow_models?.models ?? [];
  const mlflowModelsStatus = newData.mlflow_models?.status ?? "error";
  const tbodyMlflowModels = document.getElementById("tbody-mlflow-models");
  if (tbodyMlflowModels) {
    tbodyMlflowModels.innerHTML =
      mlflowModelsStatus === "error"
        ? noConnTd(3)
        : mlflowModels.length === 0
          ? noDataTd(3)
          : mlflowModels
              .map((m) => {
                const stageStyle =
                  m.stage === "Production"
                    ? "background:#e8f4ff; color:#1a56a8;"
                    : m.stage === "Staging"
                      ? "background:#f5e6ff; color:#6f42c1;"
                      : "background:#e9ecef; color:#495057;";
                return `<tr>
                <td>${esc(m.name)}</td>
                <td style="text-align:center; font-family:var(--font-mono); font-weight:600;">${m.versions}</td>
                <td><span style="padding:2px 8px; border-radius:4px; font-size:10px; font-weight:600; ${stageStyle}">${esc(m.stage)}</span></td>
            </tr>`;
              })
              .join("");
  }

  // ── MLflow 실험별 Run 수 테이블 ───────────────────────────────
  const mlflowExpRunsStatus = newData.mlflow_experiment_runs?.status ?? "error";
  const mlflowExpRuns = newData.mlflow_experiment_runs?.experiments ?? [];
  const tbodyExpRuns = document.getElementById("tbody-mlflow-exp-runs");
  if (tbodyExpRuns) {
    tbodyExpRuns.innerHTML =
      mlflowExpRunsStatus === "error"
        ? noConnTd(2)
        : mlflowExpRuns.length === 0
          ? noDataTd(2)
          : mlflowExpRuns
              .map(
                (e) => `
            <tr>
                <td>${esc(e.name)}</td>
                <td style="text-align:right; font-family:var(--font-mono); font-weight:600;">${e.runs}</td>
            </tr>`,
              )
              .join("");
  }

  // ── KServe 시계열 차트 ────────────────────────────────────────
  const KSERVE_COLORS = [
    { border: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
    { border: "#10b981", bg: "rgba(16,185,129,0.12)" },
    { border: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    { border: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    { border: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  ];
  const KSERVE_WINDOW_MS = 30 * 60 * 1000;
  const now = Date.now();

  const kserveRps = newData.kserve_rps || { status: "error", series: [] };
  const kserveLatency = newData.kserve_latency_p95 || {
    status: "error",
    series: [],
  };

  [
    { key: "chart-kserve-rps", src: kserveRps, fill: true },
    { key: "chart-kserve-latency", src: kserveLatency, fill: false },
  ].forEach(({ key, src, fill }) => {
    const chart = _charts[key];
    if (!chart || src.status === "error" || !src.series?.length) return;
    chart.data.datasets = src.series.map((s, i) => {
      const color = KSERVE_COLORS[i % KSERVE_COLORS.length];
      return {
        label: s.name,
        data: s.data.map(([ts, v]) => ({ x: ts, y: v })),
        borderColor: color.border,
        backgroundColor: fill ? color.bg : color.border,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill,
      };
    });
    chart.options.scales.x.min = now - KSERVE_WINDOW_MS;
    chart.options.scales.x.max = now;
    chart.update("none");
  });

  const kserveErrorRate = newData.kserve_error_rate || {
    status: "error",
    models: [],
  };
  const errChart = _charts["chart-kserve-error-rate"];
  if (
    errChart &&
    kserveErrorRate.status !== "error" &&
    kserveErrorRate.models?.length
  ) {
    const values = kserveErrorRate.models.map((m) => m.error_rate);
    errChart.data.labels = kserveErrorRate.models.map((m) => m.name);
    errChart.data.datasets[0].data = values;
    errChart.data.datasets[0].backgroundColor = values.map((v) =>
      v >= 5 ? "#ef4444" : v >= 1 ? "#f59e0b" : "#10b981",
    );
    errChart.update("none");
  }

  const kserveTop5 = newData.kserve_top5_latency || {
    status: "error",
    models: [],
  };
  const top5Chart = _charts["chart-top5-latency"];
  if (top5Chart && kserveTop5.status !== "error" && kserveTop5.models?.length) {
    top5Chart.data.labels = kserveTop5.models.map((m) => m.name);
    top5Chart.data.datasets[0].data = kserveTop5.models.map(
      (m) => m.latency_ms,
    );
    top5Chart.update("none");
  }

  // ── PVC 테이블 ────────────────────────────────────────────────
  const pvcGroupsNew = newData.pvc?.groups ?? [];
  const _pvcPhaseColors = {
    Bound: "#3b82f6",
    Pending: "#f59e0b",
    Lost: "#ef4444",
  };
  const _pvcPhaseIcons = { Bound: "●", Pending: "⚠", Lost: "✕" };

  const tbodyPvcAll = document.getElementById("tbody-pvc-all");
  if (tbodyPvcAll && pvcGroupsNew.length) {
    tbodyPvcAll.innerHTML = pvcGroupsNew
      .map((g) => {
        const pc = g.phase_counts || {};
        const badges = [
          pc.Bound > 0
            ? `<span style="color:#3b82f6; font-weight:600; margin-right:6px;">● ${pc.Bound}</span>`
            : "",
          pc.Pending > 0
            ? `<span style="color:#f59e0b; font-weight:600; margin-right:6px;">⚠ ${pc.Pending}</span>`
            : "",
          pc.Lost > 0
            ? `<span style="color:#ef4444; font-weight:600;">✕ ${pc.Lost}</span>`
            : "",
        ]
          .filter(Boolean)
          .join("");
        return `<tr>
                <td style="font-size:13px;">${esc(g.ns)}</td>
                <td style="text-align:right; font-family:var(--font-mono); font-weight:600;">${_pvcCountCell(g)}</td>
                <td style="text-align:right; font-family:var(--font-mono);">${_pvcStorageCell(g)}</td>
                <td class="pm-pvc-status-cell">${_pvcPhaseSummaryBadges(pc)}</td>
            </tr>`;
      })
      .join("");
  }
  const tbodyPvcMine = document.getElementById("tbody-pvc-mine");
  if (tbodyPvcMine) {
    const myGroup = pvcGroupsNew.find((g) => g.ns === currentNs);
    const myPvcs = myGroup?.pvcs ?? [];
    tbodyPvcMine.innerHTML =
      myPvcs.length === 0
        ? noDataTd(3)
        : myPvcs
            .map(
              (p) => `<tr>
                <td style="font-size:12px; font-family:var(--font-mono);" title="${esc(p.name)}">${esc(p.name)}</td>
                <td style="text-align:right; font-family:var(--font-mono);">${p.allocated_gb.toFixed(1)} GB</td>
                <td class="pm-pvc-status-cell">${_pvcPhaseBadge(p.phase)}</td>
            </tr>`,
            )
            .join("");
  }
  const pvcQuotaBadge = document.getElementById("pvc-quota-badge");
  if (pvcQuotaBadge) {
    pvcQuotaBadge.innerHTML = _pvcQuotaBadge(
      pvcGroupsNew.find((g) => g.ns === currentNs),
    );
  }

  const tbodyPvcUser = document.getElementById("tbody-pvc-user");
  if (tbodyPvcUser) {
    const pvcs = pvcGroupsNew.flatMap((g) => g.pvcs);
    tbodyPvcUser.innerHTML =
      pvcs.length === 0
        ? noDataTd(3)
        : pvcs
            .map(
              (p) => `<tr>
                <td style="font-size:12px; font-family:var(--font-mono);" title="${esc(p.name)}">${esc(p.name)}</td>
                <td style="text-align:right; font-family:var(--font-mono);">${p.allocated_gb.toFixed(1)} GB</td>
                <td class="pm-pvc-status-cell">${_pvcPhaseBadge(p.phase)}</td>
            </tr>`,
            )
            .join("");
  }

  // ── PVC 도넛 ──────────────────────────────────────────────────
  const pvcGroups = pvcGroupsNew;
  const pvcChart = _charts["chart-pvc-donut"];
  if (pvcChart && pvcGroups.length) {
    const isMineView =
      document.getElementById("pvc-view-mine")?.style.display === "";

    let newLabels, newValues, newColors;
    if (isAdminView && !isMineView) {
      const namespaceUsage = _pvcNamespaceSlices(pvcGroups);
      newLabels = namespaceUsage.labels;
      newValues = namespaceUsage.values;
      newColors = namespaceUsage.colors;
    } else {
      const myUsage = _pvcPodSlices(pvcGroups.find((g) => g.ns === currentNs));
      newLabels = myUsage.labels;
      newValues = myUsage.values;
      newColors = myUsage.colors;
    }
    if (newValues.length && !newValues.every((v) => v === 0)) {
      pvcChart.data.labels = newLabels;
      pvcChart.data.datasets[0].data = newValues;
      pvcChart.data.datasets[0].backgroundColor = newColors;
      pvcChart.update("none");
    }
  }

  updateAlarmIndicators(newData);
}

// _ALARM_SECTIONS, _renderAlarmSidebar, _updateAlarmBadge,
// _openAlarmSidebar, _closeAlarmSidebar → monitoring-alarm.js

// 주기적 모니터링 데이터 리프레시 함수 - 실패해도 기존 데이터 유지하며 재시도
async function refreshMonitoringPage() {
  try {
    const newData = await API.get("/api/monitoring/summary");
    updateMonitoringInPlace(newData);
    _lastSuccessTime = new Date();
  } catch (e) {
    console.warn("[monitoring] 리프레시 실패, 기존 데이터 유지:", e);
  }
}
