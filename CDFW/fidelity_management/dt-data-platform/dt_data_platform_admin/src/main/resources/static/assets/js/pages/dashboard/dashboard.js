var etcHistoryChart;
var etcHistoryChartOption;
var metaHistoryChart;
var metaHistoryChartOption;
$(document).ready(function () {
    console.log('Dashboard Ready');

    let etcHistoryGraphRange = document.querySelector('#etc-history-graph-range');
    if (etcHistoryGraphRange) {
        /**
         * 그래프 날짜 선택 이벤트
         * */
        let etcDateContainer = document.querySelector('#etc-date-container');
        let viewButton = etcDateContainer.querySelector('button');
        viewButton.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            let etcDateContainer = event.target.closest('#etc-date-container');
            let etcDateSelect = etcDateContainer.querySelector('#etc_date_select');
            let params = {
                date: etcDateSelect.value
            };
            initializeEtcHistoryInfo(params, etcHistoryInfoCallback);
        });

        /**
         * Echart 설정
         * */
        let etcGraphContainer = document.querySelector('#etc-graph-container');
        let etcGraphContainerInner = document.createElement('div');
        etcGraphContainerInner.style.position = 'absolute';
        etcGraphContainerInner.style.top = 0;
        etcGraphContainerInner.style.left = 0;
        etcGraphContainerInner.style.width = `100%`;
        etcGraphContainerInner.style.height = `100%`;
        etcGraphContainerInner.id = 'etc-graph-container-inner';
        etcGraphContainer.appendChild(etcGraphContainerInner);

        let params = {
            date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
        };
        initializeEtcHistoryInfo(params, etcHistoryInfoCallback);
    }
    let metaHistoryGraphRange = document.querySelector('#meta-history-graph-range');
    if (metaHistoryGraphRange) {
        /**
         * 그래프 날짜 선택 이벤트
         * */
        let metaDateContainer = document.querySelector('#meta-date-container');
        let viewButton = metaDateContainer.querySelector('button');
        viewButton.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            let metaDateContainer = event.target.closest('#meta-date-container');
            let metaDateSelect = metaDateContainer.querySelector('#meta_date_select');
            let params = {
                date: metaDateSelect.value
            };
            initializeMetaHistoryInfo(params, metaHistoryInfoCallback);
        });

        /**
         * Echart 설정
         * */
        let metaGraphContainer = document.querySelector('#meta-graph-container');
        let metaGraphContainerInner = document.createElement('div');
        metaGraphContainerInner.style.position = 'absolute';
        metaGraphContainerInner.style.top = 0;
        metaGraphContainerInner.style.left = 0;
        metaGraphContainerInner.style.width = `100%`;
        metaGraphContainerInner.style.height = `100%`;
        metaGraphContainerInner.id = 'meta-graph-container-inner';
        metaGraphContainer.appendChild(metaGraphContainerInner);

        let params = {
            date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
        };
        initializeMetaHistoryInfo(params, metaHistoryInfoCallback);
    }
});

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

function etcHistoryInfoCallback(result) {
    console.log('result', result);

    let etcDateContainer = document.querySelector('#etc-date-container');

    let xAxisLabels = Object.keys(result.historyMap);

    let downloadsSeriesData = xAxisLabels.map(label => result.historyMap[label].downloads);
    console.log('downloadsSeriesData', downloadsSeriesData);

    let referencesSeriesData = xAxisLabels.map(label => result.historyMap[label].references);
    console.log('referencesSeriesData', referencesSeriesData);

    /**
     * Year 및 Month Setting
     * */
    let datesSelect = etcDateContainer.querySelector('#etc_date_select');
    initializeHistoryDateInfo(datesSelect, {dates: result.dates, date: result.date});

    let series = [{
        name: '데이터 이력',
        type: 'line',
        data: downloadsSeriesData
    }, {
        name: '모델 이력',
        type: 'line',
        data: referencesSeriesData
    }];
    let legends = ['데이터 이력', '모델 이력']

    /**
     * 모델 별 그래프 추가
     * */
    let algorithmKeys = Object.keys(result.historyAlgorithmMaps);
    algorithmKeys.forEach(function (algorithmKey) {
        let dateKeys = Object.keys(result.historyAlgorithmMaps[algorithmKey]);
        let algorithmSeriesData = dateKeys.map(dateKey => result.historyAlgorithmMaps[algorithmKey][dateKey].references);
        let algorithmSeries = {
            name: algorithmKey,
            type: 'line',
            data: algorithmSeriesData
        }

        legends.push(algorithmKey);
        series.push(algorithmSeries);
    });

    /**
     * History Chart Option Setting
     * */
    etcHistoryChartOption = {
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: legends
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
        series: series
    };
    refreshEtcHistoryChart(etcHistoryChartOption);
}

function metaHistoryInfoCallback(result) {
    console.log('result', result);

    let metaDateContainer = document.querySelector('#meta-date-container');

    let xAxisLabels = Object.keys(result.historyMap);

    let downloadsSeriesData = xAxisLabels.map(label => result.historyMap[label].downloads);
    console.log('downloadsSeriesData', downloadsSeriesData);

    let referencesSeriesData = xAxisLabels.map(label => result.historyMap[label].references);
    console.log('referencesSeriesData', referencesSeriesData);

    /**
     * Year 및 Month Setting
     * */
    let datesSelect = metaDateContainer.querySelector('#meta_date_select');
    initializeHistoryDateInfo(datesSelect, {dates: result.dates, date: result.date});

    let series = [{
        name: '데이터 이력',
        type: 'line',
        data: downloadsSeriesData
    }, {
        name: '모델 이력',
        type: 'line',
        data: referencesSeriesData
    }];
    let legends = ['데이터 이력', '모델 이력'];

    /**
     * 모델 별 그래프 추가
     * */
    let algorithmKeys = Object.keys(result.historyAlgorithmMaps);
    algorithmKeys.forEach(function (algorithmKey) {
        let dateKeys = Object.keys(result.historyAlgorithmMaps[algorithmKey]);
        let algorithmSeriesData = dateKeys.map(dateKey => result.historyAlgorithmMaps[algorithmKey][dateKey].references);
        let algorithmSeries = {
            name: algorithmKey,
            type: 'line',
            data: algorithmSeriesData
        }

        legends.push(algorithmKey);
        series.push(algorithmSeries);
    });

    /**
     * History Chart Option Setting
     * */
    metaHistoryChartOption = {
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: legends
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
        series: series
    };
    refreshMetaHistoryChart(metaHistoryChartOption);
}

function refreshEtcHistoryChart(option) {
    console.log('refreshHistoryChart');
    let graphContainer = document.querySelector('#etc-graph-container');
    let graphContainerInner = graphContainer.querySelector('#etc-graph-container-inner');

    try {
        if (etcHistoryChart) {
            etcHistoryChart.dispose();
        }
    } catch (e) {
        console.warn(e);
    }

    etcHistoryChart = echarts.init(graphContainerInner);
    if (option === null || option === undefined) {
        option = etcHistoryChartOption;
    }
    option && etcHistoryChart.setOption(option); // 현재 옵션으로 다시 그리기
}

function refreshMetaHistoryChart(option) {
    console.log('refreshHistoryChart');
    let graphContainer = document.querySelector('#meta-graph-container');
    let graphContainerInner = graphContainer.querySelector('#meta-graph-container-inner');

    try {
        if (metaHistoryChart) {
            metaHistoryChart.dispose();
        }
    } catch (e) {
        console.warn(e);
    }

    metaHistoryChart = echarts.init(graphContainerInner);
    if (option === null || option === undefined) {
        option = metaHistoryChartOption;
    }
    option && metaHistoryChart.setOption(option); // 현재 옵션으로 다시 그리기
}

function initializeEtcHistoryInfo(params, callback) {
    ajaxPost('/dt/history/META_ETC_MODEL/graph', params, function (result) {
        callback(result);
    });
}

function initializeMetaHistoryInfo(params, callback) {
    ajaxPost('/dt/history/META_MODEL/graph', params, function (result) {
        callback(result);
    });
}