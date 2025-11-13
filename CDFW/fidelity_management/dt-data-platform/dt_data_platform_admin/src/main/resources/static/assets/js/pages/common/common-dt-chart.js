'use strict'
//스케터 차트
function scatterChartDataInitialize(title, subtitle, datas, column) {
    let scatterSetting = {
        title: title, subtitle: subtitle, series: []
    };
    for (const group in datas) {
        let count = 1;
        if (datas.hasOwnProperty(group)) {
            let seriesData = datas[group].map(item => {
                let keyNames = Object.keys(item); // rowtime이 아닌 키를 찾음
                let _data = {name: '', value: ''};
                keyNames.forEach(function (keyName, index) {
                    if (index !== 0 && keyName === column) {
                        _data.value = item[keyName];
                    } else {
                        _data.name = count;
                    }
                });
                count++;
                return _data;
            });
            console.log('seriesData', seriesData);
            if (seriesData && seriesData.length !== 0) {
                scatterSetting.series.push({
                    name: group, key: scatterSetting.series.length, // 필요에 따라 수정
                    chart: 'scatter', // 차트 유형
                    data: seriesData, unit: ''
                });
            }
        }
    }
    console.log('scatterSetting', scatterSetting);
    scatterSetting.series.length !== 0 ? scatterSetting.isDraw = true : scatterSetting.isDraw = false;
    return scatterSetting;
}

//히스토그램 차트
function histogramChartView(ds, itemName) {
    $('#view3').show();
    var data = JSON.stringify(ds.data.range);

    var histogramChart = {
        "title": "", "subtitle": "", "series": [{
            "chart": "bar", "name": itemName, "unit": "", "data": []
        },]
    };

    //json 변환 컬럼 데이터 추출
    var jsonVal = JSON.parse(data);
    var itemVal = jsonVal.filter(function (obj) {
        var item = JSON.parse(obj);
        if (typeof item[itemName] !== undefined) {
            return item[itemName];
        }
    });

    var jsonItem = JSON.parse(itemVal);

    var histogramData = [];
    let array = Object.keys(jsonItem[itemName]);
    for (let i of array) {
        var v = {
            "name": i, "value": jsonItem[itemName][i]
        }
        histogramData.push(v);
    }

    histogramChart.series[0].data = histogramData;
    viewTypeDefault('bar', histogramChart, 3, true, false);
}

//이상치 히스토그램 차트
function outLierHistogramView(itemName, data) {
    var histogramChart = {
        "title": "", "subtitle": "", "series": [{
            "chart": "bar", "name": itemName, "unit": "", "data": []
        },]
    };

    //json 변환 컬럼 데이터 추출
    var jsonVal = JSON.parse(data);
    var itemVal = jsonVal.filter(function (obj) {
        var item = JSON.parse(obj);
        if (typeof item[itemName] !== undefined) {
            return item[itemName];
        }
    });
    //console.log(itemVal);

    var jsonItem = JSON.parse(itemVal);
    //console.log(jsonItem);

    var histogramData = [];
    let array = Object.keys(jsonItem[itemName]);
    for (let i of array) {
        var v = {
            "name": i, "value": jsonItem[itemName][i]
        }
        histogramData.push(v);
    }
    //console.log(histogramData);

    histogramChart.series[0].data = histogramData;
    viewTypeDefault("bar", histogramChart, 5, false, false);
}