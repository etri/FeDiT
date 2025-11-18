var historyChart;
var historyChartOption;
$(document).ready(function () {
    //업데이트 상태이고 공개 상태일때만 이력 공개
    if ($('#formType').val() === 'U') {
        let etcModelSeq = parseInt(document.querySelector('#etcModelSeq').value);
        let dataMetaInfoRange = document.querySelector('#data-meta-info-range');
        if (dataMetaInfoRange) {
            dataMetaInfoRange.style.display = 'block';
        }

        let dataMetaInfoHistoryRange = document.querySelector('#data-meta-info-history-range');
        if (dataMetaInfoHistoryRange) {
            dataMetaInfoHistoryRange.style.display = 'block';
            let params = {
                etcModelSeq
            }
            initializeDataMetaInfo(params, dataMetaInfoHistoryRange.querySelector('ul'));
        }

        let modelInfoHistoryRange = document.querySelector('#model-info-history-range');
        if (modelInfoHistoryRange) {
            modelInfoHistoryRange.style.display = 'block';
            let params = {
                etcModelSeq
            }
            initializeModelInfo(params, modelInfoHistoryRange.querySelector('ul'));
        }

        let historyGraphRange = document.querySelector('#history-graph-range');
        if (historyGraphRange) {
            /*historyGraphRange.style.display = 'block';*/

            /**
             * 그래프 날짜 선택 이벤트
             * */
            let dateContainer = document.querySelector('#date-container');
            let viewButton = dateContainer.querySelector('button');
            viewButton.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                let dateContainer = event.target.closest('#date-container');
                let dateSelect = dateContainer.querySelector('#date_select');
                let params = {
                    etcModelSeq,
                    date: dateSelect.value
                };
                initializeHistoryInfo(params, historyInfoCallback);
            });

            /**
             * Echart 설정
             * */
            let graphContainer = document.querySelector('#graph-container');
            let graphContainerInner = document.createElement('div');
            graphContainerInner.style.position = 'absolute';
            graphContainerInner.style.top = 0;
            graphContainerInner.style.left = 0;
            graphContainerInner.style.width = `100%`;
            graphContainerInner.style.height = `100%`;
            graphContainerInner.id = 'graph-container-inner';
            graphContainer.appendChild(graphContainerInner);

            let params = {
                etcModelSeq,
                date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
            };
            initializeHistoryInfo(params, historyInfoCallback);
        }
    }
});

function historyInfoCallback(result) {
    console.log('result', result);

    let dateContainer = document.querySelector('#date-container');

    let xAxisLabels = Object.keys(result.historyMap);

    let downloadsSeriesData = xAxisLabels.map(label => result.historyMap[label].downloads);
    console.log('downloadsSeriesData', downloadsSeriesData);

    let referencesSeriesData = xAxisLabels.map(label => result.historyMap[label].references);
    console.log('referencesSeriesData', referencesSeriesData);

    /**
     * Year 및 Month Setting
     * */
    let datesSelect = dateContainer.querySelector('#date_select');
    initializeHistoryDateInfo(datesSelect, {dates: result.dates, date: result.date});

    /**
     * History Chart Option Setting
     * */
    historyChartOption = {
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: ['데이터 이력', '모델 이력']
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        toolbox: {
            feature: {
                saveAsImage: {}
            }
        },
        xAxis: {
            type: 'category',
            data: xAxisLabels
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                name: '데이터 이력',
                type: 'line',
                data: downloadsSeriesData
            },
            {
                name: '모델 이력',
                type: 'line',
                data: referencesSeriesData
            },
        ]
    };
    refreshHistoryChart(historyChartOption);
}

function initializeDataMetaInfo(params, container) {
    ajaxPost('/dt/history/data/META_ETC_MODEL', params, function (result) {
        console.log('result', result);
        if (container) {
            container.innerHTML = ``;
            result.dataFileDownloadLogs.forEach(function (logData) {
                container.appendChild(createDataHistory(logData));
            });
            if (container.querySelectorAll('li').length === 0) {
                container.appendChild(createDataHistory());
            }
        }
    });
}

function initializeModelInfo(params, container) {
    ajaxPost('/dt/history/model/META_ETC_MODEL', params, function (result) {
        console.log('result', result);
        if (container) {
            container.innerHTML = ``;
            result.modelReferenceLogs.forEach(function (logModel) {
                container.appendChild(createModelHistory(logModel));
            });
            if (container.querySelectorAll('li').length === 0) {
                container.appendChild(createModelHistory());
            }
        }
    });
}

function createDataHistory(logData) {
    let li = document.createElement('li');

    let bgBox = document.createElement('div');
    let bgBox_classes = ['bg-box'];
    bgBox_classes.forEach(function (bgBox_class) {
        bgBox.classList.add(bgBox_class);
    });

    let bgBoxDescription = document.createElement('p');
    let bgBoxDescription_classes = ['dot-desc'];
    bgBoxDescription_classes.forEach(function (bgBoxDescription_class) {
        bgBoxDescription.classList.add(bgBoxDescription_class);
    });

    if (logData) {
        bgBoxDescription.innerHTML = `${logData.userNm}님께서 데이터 파일 다운로드 (${logData.regDt})`;
    } else {
        bgBoxDescription.innerHTML = `파일 다운로드 이력이 없습니다.`;
    }

    bgBox.appendChild(bgBoxDescription);
    li.appendChild(bgBox);
    return li;
}

function createModelHistory(logModel) {
    let li = document.createElement('li');

    let bgBox = document.createElement('div');
    let bgBox_classes = ['bg-box'];
    bgBox_classes.forEach(function (bgBox_class) {
        bgBox.classList.add(bgBox_class);
    });

    let bgBoxDescription = document.createElement('p');
    let bgBoxDescription_classes = ['dot-desc'];
    bgBoxDescription_classes.forEach(function (bgBoxDescription_class) {
        bgBoxDescription.classList.add(bgBoxDescription_class);
    });

    if (logModel) {
        bgBoxDescription.innerHTML = `${logModel.userNm}님께서 \'${logModel.modelNm}\' ${logModel.processTp}에서 사용 (${logModel.regDt})`;
    } else {
        bgBoxDescription.innerHTML = `모델 사용 이력이 없습니다.`;
    }

    bgBox.appendChild(bgBoxDescription);
    li.appendChild(bgBox);
    return li;
}

function initializeHistoryInfo(params, callback) {
    ajaxPost('/dt/history/graph/META_ETC_MODEL', params, function (result) {
        callback(result);
    });
}

function refreshHistoryChart(option) {
    console.log('refreshHistoryChart');
    let graphContainer = document.querySelector('#graph-container');
    let graphContainerInner = graphContainer.querySelector('#graph-container-inner');

    try {
        if (historyChart) {
            historyChart.dispose();
        }
    } catch (e) {
        console.warn(e);
    }

    historyChart = echarts.init(graphContainerInner);
    if (option === null || option === undefined) {
        option = historyChartOption;
    }
    option && historyChart.setOption(option); // 현재 옵션으로 다시 그리기
}

function initializeHistoryDateInfo(datesSelect, data) {
    const createHistoryDateOption = (date, selected) => {
        let option = document.createElement('option');
        option.value = date;
        option.selected = selected;
        option.innerHTML = `${date.substring(0, 4)}년 ${date.substring(5, 7)}월`;
        return option;
    }

    datesSelect.innerHTML = ``;
    data.dates.forEach(function (date) {
        datesSelect.appendChild(createHistoryDateOption(date, data.date === date));
    });
}