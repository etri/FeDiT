(function () {
  "use strict";

  $(document).ready(function () {
    /**
     * Augment Visualization
     */
    let augmentTpEl = document.querySelector("#augmentTp");
    let augmentTp = augmentTpEl ? augmentTpEl.dataset.value : null;
    if (augmentTp !== "F") {
      //전처리 및 증강 일회성 및 연속성 로직에서만 보여준다.
    }

    // 증강 시각화 영역이 렌더되지 않은 화면에서는 초기화를 건너뜀(null 참조 방지)
    let augmentVisualSelectRange = document.querySelector(
      "#augmentVisualSelectRange",
    );
    if (!augmentVisualSelectRange) {
      return;
    }
    let augmentFileContainer = augmentVisualSelectRange.querySelector(
      "#augmentFileContainer",
    );
    if (!augmentFileContainer) {
      return;
    }
    let augmentFileAs = augmentFileContainer.querySelectorAll(
      ".augment-file-section > a",
    );

    augmentFileAs.forEach(function (augmentFileA) {
      augmentFileA.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        let augmentSeq = this.dataset.augmentSeq;
        let fileSeq = this.dataset.fileSeq;
        console.log("augmentSeq", augmentSeq, "fileSeq", fileSeq);

        // 클릭 직후 API 호출 전에 한 번
        clearAllVisualViews();

        // API 호출
        getVisualListOne(augmentSeq, fileSeq, function (res, error) {
          if (!res) {
            console.error("Error fetching visual data:", error);
            alert(error);
            return;
          }

          // 패널 열기
          document.getElementById("augmentVisualRange").style.display = "";

          const result = res; // 그대로 사용 (res.code 등 포함)
          const DATE_KEY = result.date_key || "date"; // <<<<<< x축 키 강제

          // 데이터 정규화 (문자열 JSON 대비)
          const originRaw = ensureArrayMaybeString(result.origin);
          console.log("originRow", originRaw);
          const augmentRaw = ensureArrayMaybeString(result.augment);
          console.log("augmentRow", augmentRaw);
          const validateRaw = ensureArrayMaybeString(result.validate);
          console.log("validateRow", validateRaw);
          const outlierRaw = ensureArrayMaybeString(result.outlier);
          console.log("outlierRow", outlierRaw);

          // 1) ORIGIN -> view3 (모든 수치 컬럼 시리즈로)
          (function renderOrigin() {
            let display = document.querySelector("#originVisualChart");
            if (originRaw) {
              display.style.display = "block";
              const rows = Array.isArray(originRaw) ? originRaw : [];
              if (rows !== null && rows.length === 0) {
                display.style.display = "none";
                return;
              }
              const s = rowsToSeries(rows, "", DATE_KEY);
              viewTypeDefault(
                "line",
                {
                  series: s.series,
                  title: "원본 데이터(Origin)",
                  subtitle: "",
                },
                3,
                true,
                false,
                true,
              );
              renderStatsInto("originStats", computeRowsStats(rows, DATE_KEY));
            } else {
              display.style.display = "none";
            }
          })();

          // 2) AUGMENT -> view4 (모든 수치 컬럼 시리즈로)
          (function renderAugment() {
            let display = document.querySelector("#augmentVisualChart");
            if (augmentRaw) {
              display.style.display = "block";
              const rows = Array.isArray(augmentRaw) ? augmentRaw : [];
              if (rows !== null && rows.length === 0) {
                display.style.display = "none";
                return;
              }
              const s = rowsToSeries(rows, "", DATE_KEY);
              viewTypeDefault(
                "line",
                {
                  series: s.series,
                  title: "증강 데이터(Augment)",
                  subtitle: "",
                },
                4,
                true,
                false,
                true,
              );
              renderStatsInto("augmentStats", computeRowsStats(rows, DATE_KEY));
            } else {
              display.style.display = "none";
            }
          })();

          // 3) VALIDATE -> view5 (특수 구조: [{ col, data, ... }] 의 col만 추출)
          (function renderValidate() {
            let display = document.querySelector("#validateVisualChart");
            if (validateRaw) {
              display.style.display = "block";
              if (validateRaw.length === 0) {
                display.style.display = "none";
                return;
              }
              const series = seriesForColumns(validateRaw, "검증", DATE_KEY);
              if (series && series.length > 0) {
                viewTypeDefault(
                  "line",
                  {
                    series,
                    title: "검증 데이터(Validate)",
                    subtitle: "",
                  },
                  5,
                  true,
                  false,
                  true,
                );
                renderStatsInto(
                  "validateStats",
                  computeColumnsStats(validateRaw, DATE_KEY),
                );
              } else {
                display.style.display = "none";
              }
            } else {
              display.style.display = "none";
            }
          })();

          // 4) OUTLIER -> view6 (특수 구조: [{ col, data, ... }] 의 col만 추출)
          (function renderOutlier() {
            let display = document.querySelector("#outlierVisualChart");
            if (outlierRaw) {
              display.style.display = "block";
              if (outlierRaw.length === 0) {
                display.style.display = "none";
                return;
              }
              const series = seriesForColumns(outlierRaw, "이상치", DATE_KEY);
              if (series && series.length > 0) {
                viewTypeDefault(
                  "line",
                  {
                    series,
                    title: "이상치 데이터(Outlier)",
                    subtitle: "",
                  },
                  6,
                  true,
                  false,
                  true,
                );
                renderStatsInto(
                  "outlierStats",
                  computeColumnsStats(outlierRaw, DATE_KEY),
                );
              } else {
                display.style.display = "none";
              }
            } else {
              display.style.display = "none";
            }
          })();
        });
      });
    });
  });

  // /dt/simulation/get/visual/list/{augment_seq}/{augment_file_seq}
  function getVisualListOne(augment_seq, augment_file_seq, callback) {
    $.ajax({
      type: "POST",
      async: false,
      url: `/dt/simulation/get/visual/list/${augment_seq}/${augment_file_seq}`,
      contentType: "application/json; charset=utf-8;",
      dataType: "json",
      success: function (result) {
        if (result.code === 200) {
          callback(result, null);
        } else {
          callback(null, result.message);
        }
      },
      error: function (xhr, status, error) {
        console.error("error : ", error);
        alert("에러가 발생하였습니다. 관리자에게 문의하십시오.");
        callback(null, error);
      },
    });
  }

  // ===================== 공통 유틸 =====================
  function ensureArrayMaybeString(v) {
    if (typeof v === "string") {
      try {
        return JSON.parse(v);
      } catch (e) {
        /* 무시 */
      }
    }
    return v;
  }

  function isRow(obj) {
    return obj && typeof obj === "object" && !Array.isArray(obj);
  }

  function isArrayOfRows(arr) {
    return Array.isArray(arr) && arr.length && isRow(arr[0]);
  }

  // DATE_KEY 제외한 수치 컬럼(y) 자동 탐색 → viewTypeDefault용 series 포맷으로 변환
  function rowsToSeries(rows, prefix, DATE_KEY) {
    rows = Array.isArray(rows) ? rows : [];
    if (!rows.length) return { series: [] };

    const yKeys = Object.keys(rows[0]).filter((k) => k !== DATE_KEY);
    const seriesArr = yKeys.map((yKey) => ({
      name: prefix ? `${prefix}:${yKey}` : yKey,
      chart: "line",
      unit: "",
      data: [],
    }));
    const byName = new Map(seriesArr.map((s) => [s.name, s]));

    rows.forEach((r) => {
      const xVal = r[DATE_KEY];
      yKeys.forEach((yKey) => {
        const num = Number(r[yKey]);
        if (!Number.isNaN(num)) {
          const n = prefix ? `${prefix}:${yKey}` : yKey;
          byName.get(n).data.push({ name: xVal, value: num });
        }
      });
    });
    return { series: Array.from(byName.values()) };
  }

  // ===== validate/outlier 전용: [{ col: "M60", data: [...] }, ...] ▷ col에 해당하는 컬럼만 그리기
  function seriesForColumns(raw, defaultPrefix, DATE_KEY) {
    if (!raw) return [];
    const arr = ensureArrayMaybeString(raw);
    const out = [];

    // 지원 케이스:
    //  - [{ col: "M60", data:[{date, m60, ...}, ...] }, { col:"M50", data:[...]}]
    //  - 단일 객체 { col, data, ... }
    //  - 잘못된/빈 값은 무시
    const items = Array.isArray(arr) ? arr : [arr];

    items.forEach((item, idx) => {
      if (
        !item ||
        !item.col ||
        !Array.isArray(item.data) ||
        item.data.length === 0
      )
        return;

      // 데이터에 들어있는 컬럼 키는 소문자(m60 등)인 경우가 많으므로 정규화
      const colKey = String(item.col).trim();
      const keyLower = colKey.toLowerCase();
      const keyUpper = colKey.toUpperCase();

      // 실제 rows의 키셋에서 정확한 키를 찾아본다 (대소문자 혼용 대비)
      const firstRow = item.data[0] || {};
      const actualKey =
        Object.keys(firstRow).find((k) => k.toLowerCase() === keyLower) ||
        keyLower;

      // 시리즈 구성
      const seriesName = `${defaultPrefix}:${keyUpper}`;
      const s = {
        name: seriesName,
        chart: "line",
        unit: "",
        data: [],
      };

      item.data.forEach((r) => {
        const x = r[DATE_KEY];
        const y = Number(r[actualKey]);
        if (x != null && !Number.isNaN(y)) {
          s.data.push({ name: x, value: y });
        }
      });

      // 값이 하나도 없으면 스킵
      if (s.data.length) out.push(s);
    });

    return out;
  }

  // 기존 인스턴스가 있으면 clear만 하고 재사용, 없으면 새로 생성
  function getOrCreateChartByIndex(index) {
    const el = document.getElementById("view" + index);
    if (!el) return null;
    let inst = echarts.getInstanceByDom(el);
    if (inst) {
      inst.clear(); // <-- 옵션만 초기화 (리스너/인스턴스 유지)
      return inst;
    }
    return echarts.init(el);
  }

  function clearAllVisualViews() {
    ["view3", "view4", "view5", "view6"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const inst = echarts.getInstanceByDom(el);
      if (inst) inst.clear(); // 필요하면 inst.dispose()로 완전 파기도 가능
    });
    // 통계 컨테이너도 함께 초기화
    ["originStats", "augmentStats", "validateStats", "outlierStats"].forEach(
      (id) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = "";
      },
    );
  }

  // ===== 통계 계산/표시 =====
  // 2026-06-29 값 배열로부터 기본 통계 계산(개수/최소/최대/평균, 숫자 변환 가능한 값만 집계)
  function computeColumnStats(values) {
    const arr = Array.isArray(values) ? values : [];
    const count = arr.length;
    const nums = [];
    arr.forEach((raw) => {
      const str = raw === null || raw === undefined ? "" : String(raw).trim();
      if (str === "") return;
      const num = Number(str);
      if (!Number.isNaN(num) && Number.isFinite(num)) nums.push(num);
    });
    let min = null,
      max = null,
      mean = null;
    if (nums.length > 0) {
      min = nums[0];
      max = nums[0];
      let sum = 0;
      nums.forEach((n) => {
        sum += n;
        if (n < min) min = n;
        if (n > max) max = n;
      });
      mean = sum / nums.length;
    }
    return { count: count, min: min, max: max, mean: mean };
  }

  // 통계 수치 포맷터(정수 그대로, 소수 최대 2자리, 집계 없으면 '-')
  function formatStatNumber(value) {
    if (value === null || value === undefined || Number.isNaN(value)) return "-";
    if (Number.isInteger(value)) return value.toString();
    return Number(value.toFixed(2)).toString();
  }

  // origin/augment(행 배열) → 컬럼별 통계
  function computeRowsStats(rows, DATE_KEY) {
    rows = Array.isArray(rows) ? rows : [];
    if (!rows.length) return [];
    const yKeys = Object.keys(rows[0]).filter((k) => k !== DATE_KEY);
    return yKeys.map((yKey) => ({
      label: yKey,
      stats: computeColumnStats(rows.map((r) => r[yKey])),
    }));
  }

  // validate/outlier(col 구조) → col별 통계
  function computeColumnsStats(raw, DATE_KEY) {
    const arr = ensureArrayMaybeString(raw);
    const items = Array.isArray(arr) ? arr : [arr];
    const out = [];
    items.forEach((item) => {
      if (!item || !item.col || !Array.isArray(item.data) || !item.data.length)
        return;
      const colKey = String(item.col).trim();
      const keyLower = colKey.toLowerCase();
      const firstRow = item.data[0] || {};
      const actualKey =
        Object.keys(firstRow).find((k) => k.toLowerCase() === keyLower) ||
        keyLower;
      out.push({
        label: colKey.toUpperCase(),
        stats: computeColumnStats(item.data.map((r) => r[actualKey])),
      });
    });
    return out;
  }

  // 통계 목록을 컨테이너에 렌더(컬럼 Select로 선택 → 해당 컬럼 통계만 표시)
  function renderStatsInto(containerId, statsList) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    if (!statsList || statsList.length === 0) return;

    const title = document.createElement("label");
    title.className = "col-form-label pt-2 pb-1";
    title.innerHTML = "통계 (컬럼 선택)";
    container.appendChild(title);

    // 컬럼 선택 박스
    const select = document.createElement("select");
    select.className = "form-select";
    select.style.maxWidth = "240px";
    select.style.marginBottom = "8px";
    select.style.fontSize = "13px";
    statsList.forEach((item, idx) => {
      const opt = document.createElement("option");
      opt.value = String(idx);
      opt.textContent = item.label;
      select.appendChild(opt);
    });
    container.appendChild(select);

    // 선택된 컬럼 통계 표시 행
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.flexWrap = "wrap";
    row.style.alignItems = "center";
    row.style.gap = "6px 16px";
    row.style.padding = "6px 12px";
    row.style.marginBottom = "6px";
    row.style.border = "1px solid #e3e6ef";
    row.style.borderRadius = "4px";
    row.style.fontSize = "13px";
    container.appendChild(row);

    function renderRow(idx) {
      const item = statsList[idx];
      if (!item) {
        row.innerHTML = "";
        return;
      }
      const s = item.stats;
      row.innerHTML =
        `<span style="font-weight:600;">컬럼: ${item.label}</span>` +
        `<span>개수 <strong>${s.count}</strong></span>` +
        `<span>최소 <strong>${formatStatNumber(s.min)}</strong></span>` +
        `<span>최대 <strong>${formatStatNumber(s.max)}</strong></span>` +
        `<span>평균 <strong>${formatStatNumber(s.mean)}</strong></span>`;
    }

    select.addEventListener("change", function () {
      renderRow(Number(this.value));
    });
    renderRow(0);
  }
})();
