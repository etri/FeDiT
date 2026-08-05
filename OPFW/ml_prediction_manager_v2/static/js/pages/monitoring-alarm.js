// ── 알람 전역 상태 ────────────────────────────────────────────────────────────
let _activeAlarms = []; // 현재 활성 알람 (updateAlarmIndicators가 채움)
let _badgeAlarms = []; // 아직 사용자가 확인하지 않은 활성 알람
let _cachedHistory = null; // 마지막으로 fetch한 이력 - 사이드바 즉시 렌더용
const _collapsedSections = new Set();

let _activeFilter = "all";
let _activeStatus = "all";

// 차트 ID -> 알람 key 매핑 (임계값은 alarm_service.py 단일 관리)
const _CHART_KEY_MAP = {
  "chart-gpu-util": "gpu",
  "chart-gpu-mem": "gpu",
  "chart-cpu": "system",
  "chart-mem": "system",
};

const _ALARM_SECTIONS = [
  { key: "gpu", label: "GPU 자원", shortLabel: "GPU", guide: "GPU 사용률 또는 메모리 사용량을 확인하고, 불필요한 학습 작업을 종료하세요." },
  { key: "system", label: "시스템 자원", shortLabel: "시스템", guide: "CPU/메모리 사용량이 높은 노트북이나 Job을 확인하세요." },
  { key: "gpu-temp", label: "GPU 온도", shortLabel: "온도", guide: "GPU 온도와 서버 냉각 상태를 확인하세요." },
  { key: "pvc", label: "저장공간", shortLabel: "저장공간", guide: "불필요한 데이터셋, 모델 파일, 실험 산출물을 정리하세요." },
  { key: "automl", label: "학습 작업", shortLabel: "학습", guide: "실패한 AutoML Job의 로그와 리소스 설정을 확인하세요." },
  { key: "kserve", label: "모델 배포", shortLabel: "배포", guide: "KServe Endpoint의 Ready 상태와 Pod 이벤트를 확인하세요." },
  { key: "kserve-latency", label: "응답 지연", shortLabel: "지연", guide: "요청량, 모델 응답 시간, 배포 리소스를 확인하세요." },
  { key: "kserve-error", label: "모델 오류율", shortLabel: "오류율", guide: "최근 5xx 응답과 모델 서버 로그를 확인하세요." },
];

const _ALARM_SECTION_BY_KEY = Object.fromEntries(_ALARM_SECTIONS.map((s) => [s.key, s]));

function _statusColor(id) {
  const key = _CHART_KEY_MAP[id];
  if (!key) return "#1DB877";
  const alarms = _activeAlarms.filter((a) => a.key === key);
  if (alarms.some((a) => a.level === "critical")) return "#EF4444";
  if (alarms.length > 0) return "#F59E0B";
  return "#1DB877";
}

function _escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function _fmtRelTime(isoStr) {
  if (!isoStr) return "";
  const ts = new Date(isoStr).getTime();
  if (!Number.isFinite(ts)) return "";
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function _fmtClock(isoStr) {
  if (!isoStr) return "";
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function _fmtDuration(ms) {
  const min = Math.round(ms / 60000);
  if (min < 1) return "1분 미만";
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

function _isActiveAlarmItem(item) {
  return !item.resolved_at;
}

function _filterHistoryItems(historyData) {
  return (historyData || []).filter((item) => {
    if (_activeFilter !== "all" && item.key !== _activeFilter) return false;
    if (_activeStatus === "active") return _isActiveAlarmItem(item);
    if (_activeStatus === "resolved") return !_isActiveAlarmItem(item);
    return true;
  });
}

function _groupHistoryItems(items) {
  const grouped = new Map(_ALARM_SECTIONS.map((section) => [section.key, []]));
  items.forEach((item) => {
    if (!grouped.has(item.key)) grouped.set(item.key, []);
    grouped.get(item.key).push(item);
  });
  return grouped;
}

function _getSectionLevel(key, items) {
  const activeForKey = _activeAlarms.filter((alarm) => alarm.key === key);
  if (activeForKey.some((alarm) => alarm.level === "critical")) return "critical";
  if (activeForKey.length > 0) return "warning";
  if (items.some((item) => item.level === "critical")) return "critical";
  if (items.length > 0) return "warning";
  return "normal";
}

function _renderFilterChips() {
  const activeKeys = new Set(_activeAlarms.map((alarm) => alarm.key));
  return `
    <div class="pm-alarm-filter-panel">
      <div class="pm-alarm-filter-block">
        <div class="pm-alarm-filter-title">구분</div>
        <div class="pm-alarm-filter-grid">
          <button class="pm-alarm-filter-chip${_activeFilter === "all" ? " active" : ""}" onclick="window._setAlarmFilter('all')">전체</button>
          ${_ALARM_SECTIONS.map((section) => `
            <button class="pm-alarm-filter-chip${_activeFilter === section.key ? " active" : ""}${activeKeys.has(section.key) ? " has-active" : ""}" onclick="window._setAlarmFilter('${section.key}')">
              ${section.label}
            </button>
          `).join("")}
        </div>
      </div>
      <div class="pm-alarm-filter-block">
        <div class="pm-alarm-filter-title">상태</div>
        <div class="pm-alarm-filter-grid pm-alarm-filter-grid--status">
          <button class="pm-alarm-filter-chip${_activeStatus === "all" ? " active" : ""}" onclick="window._setAlarmStatus('all')">전체</button>
          <button class="pm-alarm-filter-chip${_activeStatus === "active" ? " active" : ""}" onclick="window._setAlarmStatus('active')">진행중</button>
          <button class="pm-alarm-filter-chip${_activeStatus === "resolved" ? " active" : ""}" onclick="window._setAlarmStatus('resolved')">해소됨</button>
        </div>
      </div>
    </div>
  `;
}

function _renderAlarmCard(item) {
  const section = _ALARM_SECTION_BY_KEY[item.key] || { label: item.key, guide: "관련 리소스 상태를 확인하세요." };
  const isActive = _isActiveAlarmItem(item);
  const level = item.level === "critical" ? "critical" : "warning";
  const levelLabel = level === "critical" ? "위험" : "주의";
  const timeText = _fmtClock(item.triggered_at) || _fmtRelTime(item.triggered_at);
  const timeline = isActive
    ? `발생 ${_fmtRelTime(item.triggered_at)} · 현재 진행중`
    : `발생 ${_fmtRelTime(item.triggered_at)} · 해소 ${_fmtRelTime(item.resolved_at)}${item.resolved_ts && item.triggered_ts ? ` · 지속 ${_fmtDuration(item.resolved_ts - item.triggered_ts)}` : ""}`;
  const namespace = item.namespace ? `<span class="pm-alarm-card-namespace">${_escapeHtml(item.namespace)}</span>` : "";
  const action = isActive
    ? `<button class="pm-alarm-card-action" onclick="window._navToSection('${_escapeHtml(item.section_id)}')" title="해당 지표로 이동">›</button>`
    : "";

  return `
    <div class="pm-alarm-card${isActive ? " is-active" : " is-resolved"} ${level}">
      <div class="pm-alarm-card-top">
        <div class="pm-alarm-card-level"><span></span>${levelLabel}</div>
        <div class="pm-alarm-card-time">${timeText}</div>
      </div>
      <div class="pm-alarm-card-message">${_escapeHtml(item.msg)}</div>
      <div class="pm-alarm-card-meta">${timeline}${namespace}</div>
      <div class="pm-alarm-card-guide">${_escapeHtml(section.guide)}</div>
      ${action}
    </div>
  `;
}

function _renderAlarmGroup(section, items) {
  const activeCount = items.filter(_isActiveAlarmItem).length;
  const resolvedCount = items.length - activeCount;
  const hasContent = items.length > 0;
  const isOpen = _activeFilter !== "all" || !_collapsedSections.has(section.key);
  const level = _getSectionLevel(section.key, items);
  const countText = activeCount > 0
    ? `<span class="pm-alarm-group-count ${level}">${activeCount}</span>`
    : resolvedCount > 0
      ? `<span class="pm-alarm-group-count resolved">${resolvedCount} 해소됨</span>`
      : `<span class="pm-alarm-group-count neutral">0</span>`;
  const cards = hasContent
    ? items.map(_renderAlarmCard).join("")
    : `<div class="pm-alarm-group-empty">표시할 알람이 없습니다.</div>`;

  return `
    <div class="pm-alarm-group">
      <button class="pm-alarm-group-header" onclick="window._toggleSection('${section.key}')">
        <span class="pm-alarm-group-left">
          <span class="pm-alarm-group-arrow ${isOpen ? "open" : ""}">›</span>
          <span class="pm-alarm-group-title">${section.label}</span>
        </span>
        <span class="pm-alarm-group-right">${countText}<span class="pm-alarm-group-caret">⌄</span></span>
      </button>
      <div class="pm-alarm-group-body${isOpen ? " open" : ""}">${cards}</div>
    </div>
  `;
}

// ── 알람 인디케이터 업데이트 ──────────────────────────────────────────────────
function updateAlarmIndicators(data) {
  _activeAlarms = data.alarms ?? [];
  _badgeAlarms = _activeAlarms.filter((a) => !a.seen && !a.dismissed);

  _ALARM_SECTIONS.forEach(({ key }) => {
    const el = document.getElementById(`alarm-ind-${key}`);
    if (el) el.style.display = "none";
  });

  const byKey = {};
  _activeAlarms.forEach((a) => {
    if (!byKey[a.key]) byKey[a.key] = { msgs: [], level: "warning" };
    byKey[a.key].msgs.push(a.msg);
    if (a.level === "critical") byKey[a.key].level = "critical";
  });

  Object.entries(byKey).forEach(([key, { msgs, level }]) => {
    const el = document.getElementById(`alarm-ind-${key}`);
    if (el) {
      el.style.display = "flex";
      const dot = el.querySelector("[data-tip]");
      if (dot) {
        dot.setAttribute("data-tip", msgs.join("\n"));
        dot.style.background = level === "critical" ? "#e53935" : "#f59e0b";
      }
    }
  });

  _updateAlarmBadge();
  _prefetchHistory();
}

function setupAlarmHistoryCards() {
  _updateAlarmBadge();
}

// ── 알람 사이드바 ─────────────────────────────────────────────────────────────
function _renderAlarmSidebar(historyData) {
  const body = document.getElementById("pm-alarm-sidebar-body");
  if (!body) return;

  const filtered = _filterHistoryItems(historyData || []);
  const grouped = _groupHistoryItems(filtered);
  const sections = _activeFilter === "all"
    ? _ALARM_SECTIONS
    : _ALARM_SECTIONS.filter((section) => section.key === _activeFilter);
  const groupsHtml = sections.map((section) => _renderAlarmGroup(section, grouped.get(section.key) || [])).join("");
  const okBanner = _activeAlarms.length === 0 && _activeStatus !== "active"
    ? `<div class="pm-alarm-ok-banner"><span>✓</span>현재 진행 중인 알람이 없습니다.</div>`
    : "";
  const emptyHint = filtered.length === 0 && _activeStatus === "active"
    ? `<div class="pm-alarm-empty-state">조건에 맞는 진행 중 알람이 없습니다.</div>`
    : "";

  body.innerHTML = `
    ${_renderFilterChips()}
    ${okBanner}
    <div class="pm-alarm-groups">${groupsHtml}</div>
    ${emptyHint}
    <div class="pm-alarm-sidebar-note">사이드바를 닫으면 열람 처리됩니다.</div>
  `;
}

function _updateAlarmBadge() {
  const badge = document.getElementById("pm-alarm-badge");
  const btn = document.getElementById("pm-alarm-btn");
  if (!badge) return;
  const total = _badgeAlarms.length;
  badge.textContent = total > 99 ? "99+" : String(total);
  badge.style.display = total > 0 ? "flex" : "none";
  if (btn) btn.classList.toggle("active", total > 0);
}

// ── 이력 fetch & 렌더 ─────────────────────────────────────────────────────────
async function _fetchAndRenderHistory() {
  const body = document.getElementById("pm-alarm-sidebar-body");
  if (!body) return;

  if (_cachedHistory !== null) {
    _renderAlarmSidebar(_cachedHistory);
  } else {
    body.innerHTML = '<div class="pm-alarm-loading">불러오는 중...</div>';
  }

  try {
    const data = await API.get("/api/monitoring/alarms/history");
    _cachedHistory = data;
    _renderAlarmSidebar(data);
  } catch {
    if (_cachedHistory === null) {
      body.innerHTML = '<div class="pm-alarm-empty">이력을 불러오지 못했습니다.</div>';
    }
  }
}

async function _prefetchHistory() {
  try {
    _cachedHistory = await API.get("/api/monitoring/alarms/history");
    if (document.getElementById("pm-alarm-sidebar")?.classList.contains("open")) {
      _renderAlarmSidebar(_cachedHistory);
    }
  } catch {
    // 실패해도 기존 캐시 유지
  }
}

function _renderOrFetch() {
  if (_cachedHistory !== null) {
    _renderAlarmSidebar(_cachedHistory);
  } else {
    _fetchAndRenderHistory();
  }
}

async function _markActiveAlarmsSeen() {
  const ids = _badgeAlarms.map((a) => a.id).filter(Boolean);
  if (ids.length === 0) return;
  _badgeAlarms = [];
  _updateAlarmBadge();
  try {
    await API.post("/api/monitoring/alarms/state", {
      alarm_ids: ids,
      action: "seen",
    });
  } catch {
    // 상태 저장 실패 시 다음 summary refresh에서 다시 보일 수 있으나 화면 동작은 유지한다.
  }
}

// ── 전역 인터랙션 핸들러 ──────────────────────────────────────────────────────
window._openAlarmSidebar = function () {
  document.getElementById("pm-alarm-sidebar")?.classList.add("open");
  document.getElementById("pm-alarm-overlay")?.classList.add("open");
  const btn = document.getElementById("pm-alarm-btn");
  if (btn) {
    btn.style.right = "380px";
    btn.style.borderRadius = "14px 0 0 14px";
    btn.style.boxShadow = "0 2px 8px rgba(59,130,246,0.08)";
  }
  _fetchAndRenderHistory();
  _markActiveAlarmsSeen();
};

window._closeAlarmSidebar = function () {
  document.getElementById("pm-alarm-sidebar")?.classList.remove("open");
  document.getElementById("pm-alarm-overlay")?.classList.remove("open");
  const btn = document.getElementById("pm-alarm-btn");
  if (btn) {
    btn.style.right = "28px";
    btn.style.borderRadius = "14px";
    btn.style.boxShadow = "0 4px 10px rgba(59,130,246,0.15)";
  }
};

window._setAlarmFilter = function (key) {
  _activeFilter = key;
  _renderOrFetch();
};

window._setAlarmStatus = function (status) {
  _activeStatus = status;
  _renderOrFetch();
};

window._toggleSection = function (key) {
  if (_collapsedSections.has(key)) _collapsedSections.delete(key);
  else _collapsedSections.add(key);
  _renderOrFetch();
};

window._navToSection = function (sectionId) {
  window._closeAlarmSidebar();
  requestAnimationFrame(() => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    const headerEl = document.querySelector(".pm-navbar");
    const offset = headerEl ? headerEl.offsetHeight + 16 : 20;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  });
};
