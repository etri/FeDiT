'use strict'

$(document).ready(function () {
    /**
     * KMEAN GRAPH TEST
     * */
    //환경 설정
    /*$('#tab_preproc_range').show();
    $('#tab_preproc_bottom_range').show();
    $('#inc_tab_outlier').show();
    $('#outlier_dbscan_chart_range_form_group').show();
    $('#outlier_dbscan_chart_range').show();
    let view = document.getElementById('view7');
    initializeViewGroup(view);
    let datas = {
        "group-1": [{"RAIN5": 9659.0, "rowtime": "2024-08-02T00:00:06"}, {
            "RAIN5": 0.0, "rowtime": "2024-08-02T00:05:07"
        }, {"RAIN5": 0.0, "rowtime": "2024-08-02T00:10:39"}, {
            "RAIN5": 0.0, "rowtime": "2024-08-02T00:15:50"
        }, {"RAIN5": 20.0, "rowtime": "2024-08-02T00:20:54"}, {
            "RAIN5": 0.0, "rowtime": "2024-08-02T00:26:19"
        }, {"RAIN5": 0.0, "rowtime": "2024-08-02T00:31:47"}, {
            "RAIN5": 0.0, "rowtime": "2024-08-02T00:37:07"
        }, {"RAIN5": 0.0, "rowtime": "2024-08-02T00:42:12"}, {
            "RAIN5": 0.0, "rowtime": "2024-08-02T00:47:06"
        }, {"RAIN5": 0.0, "rowtime": "2024-08-02T00:52:37"}, {
            "RAIN5": 0.0, "rowtime": "2024-08-02T00:58:10"
        }, {"RAIN5": 0.0, "rowtime": "2024-08-02T01:02:50"}, {
            "RAIN5": 0.0, "rowtime": "2024-08-02T01:08:42"
        }, {"RAIN5": 0.0, "rowtime": "2024-08-02T01:13:47"}, {
            "RAIN5": 0.0, "rowtime": "2024-08-02T01:18:58"
        }, {"RAIN5": 0.0, "rowtime": "2024-08-02T01:24:13"}],
        "group-2": [{"RAIN5": 9659.0, "rowtime": "2024-08-02T00:00:06"}, {
            "RAIN5": 0.0, "rowtime": "2024-08-02T00:05:07"
        }, {"RAIN5": 0.0, "rowtime": "2024-08-02T00:10:39"}, {
            "RAIN5": 0.0, "rowtime": "2024-08-02T00:15:50"
        }, {"RAIN5": 20.0, "rowtime": "2024-08-02T00:20:54"}, {
            "RAIN5": 0.0, "rowtime": "2024-08-02T00:26:19"
        }, {"RAIN5": 0.0, "rowtime": "2024-08-02T00:31:47"}, {
            "RAIN5": 0.0, "rowtime": "2024-08-02T00:37:07"
        }, {"RAIN5": 0.0, "rowtime": "2024-08-02T00:42:12"}, {
            "RAIN5": 0.0, "rowtime": "2024-08-02T00:47:06"
        }, {"RAIN5": 0.0, "rowtime": "2024-08-02T00:52:37"}, {
            "RAIN5": 0.0, "rowtime": "2024-08-02T00:58:10"
        }, {"RAIN5": 0.0, "rowtime": "2024-08-02T01:02:50"}, {
            "RAIN5": 0.0, "rowtime": "2024-08-02T01:08:42"
        }, {"RAIN5": 0.0, "rowtime": "2024-08-02T01:13:47"}, {
            "RAIN5": 0.0, "rowtime": "2024-08-02T01:18:58"
        }, {"RAIN5": 0.0, "rowtime": "2024-08-02T01:24:13"}],
        "group-0": [{"RAIN5": 9659.0, "rowtime": "2024-08-02T00:00:06"}, {
            "RAIN5": 0.0, "rowtime": "2024-08-02T00:05:07"
        }, {"RAIN5": 0.0, "rowtime": "2024-08-02T00:10:39"}, {
            "RAIN5": 0.0, "rowtime": "2024-08-02T00:15:50"
        }, {"RAIN5": 20.0, "rowtime": "2024-08-02T00:20:54"}, {
            "RAIN5": 0.0, "rowtime": "2024-08-02T00:26:19"
        }, {"RAIN5": 0.0, "rowtime": "2024-08-02T00:31:47"}, {
            "RAIN5": 0.0, "rowtime": "2024-08-02T00:37:07"
        }, {"RAIN5": 0.0, "rowtime": "2024-08-02T00:42:12"}, {
            "RAIN5": 0.0, "rowtime": "2024-08-02T00:47:06"
        }, {"RAIN5": 0.0, "rowtime": "2024-08-02T00:52:37"}, {
            "RAIN5": 0.0, "rowtime": "2024-08-02T00:58:10"
        }, {"RAIN5": 0.0, "rowtime": "2024-08-02T01:02:50"}, {
            "RAIN5": 0.0, "rowtime": "2024-08-02T01:08:42"
        }, {"RAIN5": 0.0, "rowtime": "2024-08-02T01:13:47"}, {
            "RAIN5": 0.0, "rowtime": "2024-08-02T01:18:58"
        }, {"RAIN5": 0.0, "rowtime": "2024-08-02T01:24:13"}]
    }
    viewTypeDefault("scatter", scatterChartDataInitialize('title', 'subtitle', datas), 7, false, false);*/
    //VIEW 초기화
    /*let view = document.getElementById('view6');
    initializeViewGroup(view);
    let datas = {
        "group37": [{
            "rowtime": "2024-08-02T00:14:06", "RAIN5": 6149
        }, {
            "rowtime": "2024-08-02T00:16:16", "RAIN5": 6821
        }, {
            "rowtime": "2024-08-02T00:30:50", "RAIN5": 5024
        }, {
            "rowtime": "2024-08-02T00:49:36", "RAIN5": 7714
        }, {
            "rowtime": "2024-08-02T00:49:46", "RAIN5": 8100
        }, {
            "rowtime": "2024-08-02T00:55:39", "RAIN5": 7536
        }, {
            "rowtime": "2024-08-02T00:56:56", "RAIN5": 5522
        }, {
            "rowtime": "2024-08-02T01:12:14", "RAIN5": 7056
        }, {
            "rowtime": "2024-08-02T01:19:45", "RAIN5": 7031
        }], "group26": [{
            "rowtime": "2024-08-02T00:16:00", "RAIN5": 8888
        }, {
            "rowtime": "2024-08-02T00:18:46", "RAIN5": 8249
        }, {
            "rowtime": "2024-08-02T00:21:20", "RAIN5": 9634
        }, {
            "rowtime": "2024-08-02T00:29:46", "RAIN5": 9388
        }, {
            "rowtime": "2024-08-02T00:35:29", "RAIN5": 9231
        }, {
            "rowtime": "2024-08-02T00:38:09", "RAIN5": 6645
        }, {
            "rowtime": "2024-08-02T00:49:31", "RAIN5": 9714
        }, {
            "rowtime": "2024-08-02T00:57:49", "RAIN5": 8287
        }, {
            "rowtime": "2024-08-02T01:21:28", "RAIN5": 6797
        }], "group25": [{
            "rowtime": "2024-08-02T00:05:13", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:05:54", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:21:05", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:29:35", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:35:24", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:49:56", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:55:18", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T01:03:31", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T01:19:50", "RAIN5": 0
        }], "group34": [{
            "rowtime": "2024-08-02T00:04:21", "RAIN5": 9890
        }, {
            "rowtime": "2024-08-02T00:11:56", "RAIN5": 9034
        }, {
            "rowtime": "2024-08-02T00:27:16", "RAIN5": 8641
        }, {
            "rowtime": "2024-08-02T00:45:38", "RAIN5": 9281
        }, {
            "rowtime": "2024-08-02T01:01:43", "RAIN5": 9419
        }, {
            "rowtime": "2024-08-02T01:07:29", "RAIN5": 8499
        }, {
            "rowtime": "2024-08-02T01:20:42", "RAIN5": 9339
        }, {
            "rowtime": "2024-08-02T01:24:03", "RAIN5": 9217
        }], "max": [{
            "rowtime": "2024-08-02T00:01:50", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:02:05", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:02:16", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:02:21", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:02:41", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:10:28", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:12:28", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:12:38", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:12:43", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:19:32", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:19:37", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:19:58", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:20:13", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:25:59", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:27:47", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:30:23", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:33:10", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:33:20", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:33:25", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:38:56", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:42:27", "RAIN5": 10
        }, {
            "rowtime": "2024-08-02T00:43:14", "RAIN5": 20
        }, {
            "rowtime": "2024-08-02T00:44:21", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:44:31", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:44:36", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:46:45", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:52:05", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:52:16", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:52:21", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:52:42", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:56:25", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:58:21", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:58:26", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:58:47", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:59:02", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T00:59:13", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T01:01:02", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T01:02:19", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T01:02:40", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T01:02:45", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T01:10:51", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T01:11:07", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T01:11:17", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T01:11:22", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T01:13:52", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T01:13:58", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T01:14:18", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T01:16:18", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T01:16:28", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T01:16:34", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T01:16:59", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T01:22:04", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T01:22:20", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T01:22:30", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T01:22:35", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T01:23:01", "RAIN5": 0
        }, {
            "rowtime": "2024-08-02T01:24:40", "RAIN5": 50
        }, {
            "rowtime": "2024-08-02T01:25:00", "RAIN5": 230
        }, {
            "rowtime": "2024-08-02T01:25:05", "RAIN5": 180
        }, {
            "rowtime": "2024-08-02T01:25:11", "RAIN5": 80
        }, {
            "rowtime": "2024-08-02T01:25:36", "RAIN5": 10
        }]
    }
    viewTypeDefault("scatter", scatterChartDataInitialize('title', 'subtitle', datas), 6, false, false);*/
});

//Scatter Chart
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
                console.log('keyNames', keyNames);
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
function histogramChartView(itemName, ds) {
    $('#view3').show();
    //var chartDiv = document.getElementById('view3');
    //var chart = echarts.init(chartDiv);
    //chart.clear();   

    /*
    var viewId3 = document.getElementById('view3');
    var eChart3 = null;
    if (viewId3 != null && viewId3 != '') {
        eChart3 = echarts.init(document.getElementById('view3'));
    }
    */
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
    viewTypeDefault("bar", histogramChart, 3, false, false);

    /*
    for (var i = 0; i < data.length; i++) {

        var jsonVal = data[i];
        if (JSON.parse(data[i]).hasOwnProperty(itemName)) {

            console.log(itemName);
            console.log(jsonVal);

            var histogramChart = {
                    "title": "",
                    "subtitle": "",
                    "series": [
                        {
                            "chart": "bar",
                            "name": itemName,
                            "unit": "",
                            "data": []
                        },
                    ]
                };

            //json 변환 컬럼 데이터 추출
            //jsonVal = JSON.parse(data);
            var itemVal = jsonVal.filter(function (obj) {
                item = JSON.parse(obj);
                if (typeof item[itemName] !== undefined) {
                    return item[itemName];
                }
            });
            //console.log(itemVal);

            jsonItem = JSON.parse(itemVal);
            //console.log(jsonItem);

            var histogramData = [];
            let array = Object.keys(jsonItem[itemName]);
            for(let i of array){
                var v = {
                    "name": i,
                    "value": jsonItem[itemName][i]
                }
                histogramData.push(v);
            }
            //console.log(histogramData);

            histogramChart.series[0].data = histogramData;
            viewTypeDefault("bar", histogramChart, 3, false, false);




        }
    }
    */

}


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