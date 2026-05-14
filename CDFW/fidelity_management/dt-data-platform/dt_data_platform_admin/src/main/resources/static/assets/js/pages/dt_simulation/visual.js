(function () {
    'use strict'

    $(document).ready(function () {
        /**
         * Augment Visualization
         */
        let augmentTp = document.querySelector('#augmentTp').dataset.value;
        if (augmentTp !== 'F') { //전처리 및 증강 일회성 및 연속성 로직에서만 보여준다.
        }

        let augmentVisualSelectRange = document.querySelector('#augmentVisualSelectRange');
        let augmentFileContainer = augmentVisualSelectRange.querySelector('#augmentFileContainer');
        let augmentFileAs = augmentFileContainer.querySelectorAll('.augment-file-section > a');

        augmentFileAs.forEach(function (augmentFileA) {
            augmentFileA.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                let augmentSeq = this.dataset.augmentSeq;
                let fileSeq = this.dataset.fileSeq;
                console.log('augmentSeq', augmentSeq, 'fileSeq', fileSeq);

                // 클릭 직후 API 호출 전에 한 번
                clearAllVisualViews();

                // API 호출
                getVisualListOne(augmentSeq, fileSeq, function (res, error) {
                    if (!res) {
                        console.error('Error fetching visual data:', error);
                        alert(error);
                        return;
                    }

                    // 패널 열기
                    document.getElementById('augmentVisualRange').style.display = '';

                    const result = res; // 그대로 사용 (res.code 등 포함)
                    const DATE_KEY = result.date_key || 'date';   // <<<<<< x축 키 강제

                    // 데이터 정규화 (문자열 JSON 대비)
                    const originRaw = ensureArrayMaybeString(result.origin);
                    console.log('originRow', originRaw);
                    const augmentRaw = ensureArrayMaybeString(result.augment);
                    console.log('augmentRow', augmentRaw);
                    const validateRaw = ensureArrayMaybeString(result.validate);
                    console.log('validateRow', validateRaw);
                    const outlierRaw = ensureArrayMaybeString(result.outlier);
                    console.log('outlierRow', outlierRaw);

                    // 1) ORIGIN -> view3 (모든 수치 컬럼 시리즈로)
                    (function renderOrigin() {
                        let display = document.querySelector('#originVisualChart');
                        if (originRaw) {
                            display.style.display = 'block';
                            const rows = Array.isArray(originRaw) ? originRaw : [];
                            if (rows !== null && rows.length === 0) {
                                display.style.display = 'none';
                                return;
                            }
                            const s = rowsToSeries(rows, '', DATE_KEY);
                            viewTypeDefault('line', {
                                series: s.series,
                                title: '원본 데이터(Origin)',
                                subtitle: ''
                            }, 3, true, false, true);
                        } else {
                            display.style.display = 'none';
                        }
                    })();

                    // 2) AUGMENT -> view4 (모든 수치 컬럼 시리즈로)
                    (function renderAugment() {
                        let display = document.querySelector('#augmentVisualChart');
                        if (augmentRaw) {
                            display.style.display = 'block';
                            const rows = Array.isArray(augmentRaw) ? augmentRaw : [];
                            if (rows !== null && rows.length === 0) {
                                display.style.display = 'none';
                                return;
                            }
                            const s = rowsToSeries(rows, '', DATE_KEY);
                            viewTypeDefault('line', {
                                series: s.series,
                                title: '증강 데이터(Augment)',
                                subtitle: ''
                            }, 4, true, false, true);
                        } else {
                            display.style.display = 'none';
                        }
                    })();

                    // 3) VALIDATE -> view5 (특수 구조: [{ col, data, ... }] 의 col만 추출)
                    (function renderValidate() {
                        let display = document.querySelector('#validateVisualChart');
                        if (validateRaw) {
                            display.style.display = 'block';
                            if (validateRaw.length === 0) {
                                display.style.display = 'none';
                                return;
                            }
                            const series = seriesForColumns(validateRaw, '검증', DATE_KEY);
                            if (series && series.length > 0) {
                                viewTypeDefault('line', {
                                    series,
                                    title: '검증 데이터(Validate)',
                                    subtitle: ''
                                }, 5, true, false, true);
                            } else {
                                display.style.display = 'none';
                            }
                        } else {
                            display.style.display = 'none';
                        }
                    })();

                    // 4) OUTLIER -> view6 (특수 구조: [{ col, data, ... }] 의 col만 추출)
                    (function renderOutlier() {
                        let display = document.querySelector('#outlierVisualChart');
                        if (outlierRaw) {
                            display.style.display = 'block';
                            if (outlierRaw.length === 0) {
                                display.style.display = 'none';
                                return;
                            }
                            const series = seriesForColumns(outlierRaw, '이상치', DATE_KEY);
                            if (series && series.length > 0) {
                                viewTypeDefault('line', {
                                    series,
                                    title: '이상치 데이터(Outlier)',
                                    subtitle: ''
                                }, 6, true, false, true);
                            } else {
                                display.style.display = 'none';
                            }
                        } else {
                            display.style.display = 'none';
                        }
                    })();
                });
            });
        });
    });

    // /dt/simulation/get/visual/list/{augment_seq}/{augment_file_seq}
    function getVisualListOne(augment_seq, augment_file_seq, callback) {
        $.ajax({
            type: 'POST',
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
                console.error('error : ', error);
                alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                callback(null, error);
            }
        });
    }

    // ===================== 공통 유틸 =====================
    function ensureArrayMaybeString(v) {
        if (typeof v === 'string') {
            try {
                return JSON.parse(v);
            } catch (e) { /* 무시 */
            }
        }
        return v;
    }

    function isRow(obj) {
        return obj && typeof obj === 'object' && !Array.isArray(obj);
    }

    function isArrayOfRows(arr) {
        return Array.isArray(arr) && arr.length && isRow(arr[0]);
    }

    // DATE_KEY 제외한 수치 컬럼(y) 자동 탐색 → viewTypeDefault용 series 포맷으로 변환
    function rowsToSeries(rows, prefix, DATE_KEY) {
        rows = Array.isArray(rows) ? rows : [];
        if (!rows.length) return {series: []};

        const yKeys = Object.keys(rows[0]).filter(k => k !== DATE_KEY);
        const seriesArr = yKeys.map(yKey => ({
            name: prefix ? `${prefix}:${yKey}` : yKey,
            chart: 'line',
            unit: '',
            data: []
        }));
        const byName = new Map(seriesArr.map(s => [s.name, s]));

        rows.forEach(r => {
            const xVal = r[DATE_KEY];
            yKeys.forEach(yKey => {
                const num = Number(r[yKey]);
                if (!Number.isNaN(num)) {
                    const n = prefix ? `${prefix}:${yKey}` : yKey;
                    byName.get(n).data.push({name: xVal, value: num});
                }
            });
        });
        return {series: Array.from(byName.values())};
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
            if (!item || !item.col || !Array.isArray(item.data) || item.data.length === 0) return;

            // 데이터에 들어있는 컬럼 키는 소문자(m60 등)인 경우가 많으므로 정규화
            const colKey = String(item.col).trim();
            const keyLower = colKey.toLowerCase();
            const keyUpper = colKey.toUpperCase();

            // 실제 rows의 키셋에서 정확한 키를 찾아본다 (대소문자 혼용 대비)
            const firstRow = item.data[0] || {};
            const actualKey = Object.keys(firstRow).find(k => k.toLowerCase() === keyLower) || keyLower;

            // 시리즈 구성
            const seriesName = `${defaultPrefix}:${keyUpper}`;
            const s = {
                name: seriesName,
                chart: 'line',
                unit: '',
                data: []
            };

            item.data.forEach(r => {
                const x = r[DATE_KEY];
                const y = Number(r[actualKey]);
                if (x != null && !Number.isNaN(y)) {
                    s.data.push({name: x, value: y});
                }
            });

            // 값이 하나도 없으면 스킵
            if (s.data.length) out.push(s);
        });

        return out;
    }

    // 기존 인스턴스가 있으면 clear만 하고 재사용, 없으면 새로 생성
    function getOrCreateChartByIndex(index) {
        const el = document.getElementById('view' + index);
        if (!el) return null;
        let inst = echarts.getInstanceByDom(el);
        if (inst) {
            inst.clear();              // <-- 옵션만 초기화 (리스너/인스턴스 유지)
            return inst;
        }
        return echarts.init(el);
    }

    function clearAllVisualViews() {
        ['view3', 'view4', 'view5', 'view6'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            const inst = echarts.getInstanceByDom(el);
            if (inst) inst.clear();     // 필요하면 inst.dispose()로 완전 파기도 가능
        });
    }
})();