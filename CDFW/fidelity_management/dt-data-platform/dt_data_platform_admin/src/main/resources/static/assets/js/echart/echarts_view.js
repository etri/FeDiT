//echart start ------------------
//컬럼
var valColors = ['#5571C3', '#93CC79', '#F9C761', '#EC6468', '#76C0DD', '#40A273', '#FA8258', '#9960B2', '#E87BCB', '#5596C3', '#BBCC79', '#F9A561', '#EC64A4', '#76D9DD', '#40A245', '#FA6758', '#7F60B2', '#D77BE8'];
//챠트표시
var viewContainer;
var view;

function chartImage() {
    if (view == null)
        return;

    //view 리사이즈 처리후 저장 (630*600)
    var img = new Image();
    var width = view.getWidth();
    var height = view.getHeight();
    var option = view.getOption();
    var yAxis = option.yAxis;

    if (option.series[0].type != 'wordCloud') {
        //option.yAxis = [{show: false},{show: false},{show: false},{show: false}];

        //view.setOption(option);
        view.resize({width: 470, height: 440});

        img.src = view.getDataURL({pixelRatio: 2, backgroundColor: '#fff'});
        //console.log(img.src)

        //option.yAxis = [{show: true},{show: true},{show: true},{show: true}];
        //view.setOption(option);
        view.resize({width: width, height: height});
    } else {
        img.src = view.getDataURL({pixelRatio: 2, backgroundColor: '#fff'});
    }

    return img;
}

//뷰유형선택
function viewTypeMap(chartType, val, index, map, isComma) {
    viewType(chartType, val, index, map, true);
}

//뷰스타일 설정 (챠트, 데이터, 뷰인덱스, x,y줌, 콤마여부)
function viewTypeDefault(chartType, val, index, isZoom, isComma, isTool) {
    viewType(chartType, val, index, null, isZoom, isComma, isTool);
}

//cvu 차트 들어오는곳
//20210901 viewMap setToolBoxOption 주석
function viewType(chartType, val, index, map, isZoom, isComma, isTool) {
    map = typeof map !== 'undefined' ? map : null;
    isComma = typeof isComma !== 'undefined' ? isComma : true;
    isTool = typeof isTool !== 'undefined' ? isTool : false;

    //alert(chartType);
    switch (chartType) {
        case 'bar':
            viewBar(val, index, isZoom);
            break;
        case 'barld':
            viewBarld(val, index, isZoom);
            break;
        case 'line':
            viewLine(val, index, isZoom, isComma, isTool);
            break;
        case 'pie':
            viewPie(val, index);
            break;
        case 'piedn':
            viewPiedn(val, index);
            break;
        case 'map':
            viewMap(map, val, index);
            break;
        case 'wordcloud':
            viewWordcloud(val, index);
            break;
        case 'heatmap':
            viewHeatmap(val, index);
            break;
        case 'scatter':
            viewScatter(val, index);
            break;
        case 'radar':
            viewRadar(val, index);
            break;
        case 'treemap':
            viewTreemap(val, index);
            break;
        case 'barstack':
            viewBarStack(val, index, isZoom);
            break;
        case 'barldstack':
            viewBarldStack(val, index, isZoom);
            break;
        case 'linesmooth':
            viewLineSmooth(val, index, isZoom);
            break;
        case 'area':
            viewArea(val, index, isZoom);
            break;
        case 'areastack':
            viewAreaStack(val, index, isZoom);
            break;
        case 'scatterplot':
            viewScatterPlot(val, index);
            break;
    }
}

//막대
function viewBar(val, index, isZoom) {
    var seriesData = [];
    var legend = [];
    var label = [];
    var value = [];
    var visualOption = [];
    var xAxis = [];
    var yAxis = [];
    var yAxisTemp = [];

    //alert('ddddddd')

    //데이터
    var series = val.series;

    //console.log(series)

    /*
	area
	areastack
	bar
	barstack
	line
	linesmooth
	*/

    //범례
    series.forEach(function (data) {
        legend.push(data.name);
    });

    //시리즈
    var offsetX = 0;
    var offsetY = 0;

    series.forEach(function (data, i) {
        var color = valColors[i]; //randomColor();
        //var color = randomColor();

        //x축 레이블
        data.data.forEach(function (data) {
            label.push(data.name);
        });

        //y축 설정
        if (data.key == "0") {
            let y = yAxis.some(function (y) {
                y.key === data.key
            });
            if (!y) {
                yAxis.push(setyAxis(data.key, data.yname, 'value', 'left', 0, color, true, label));
            }
        } else {
            let y = yAxis.some(function (y) {
                y.key === data.key
            });
            if (!y) {
                yAxis.push(setyAxis(data.key, data.yname, 'value', 'right', offsetY, color, true, label))
                offsetY = offsetY + 50;
            }
        }

        //x축 설정
        if (data.key == "0") {
            let x = xAxis.some(function (x) {
                x.key === data.key
            });
            if (!x) {
                xAxis.push(setxAxis(data.key, data.yname, 'category', 'bottom', 0, color, true, label));
            }
        } else {
            let x = xAxis.some(function (x) {
                x.key === data.key
            });
            if (!x) {
                xAxis.push(setxAxis(data.key, data.yname, 'category', 'bottom', offsetX, color, false, label))
                offsetX = offsetX + 5;
            }
        }

        /*
		//작은값
		var min = data.data.reduce(function (previous, current) {
			return previous.value < current.value ? previous:current;
		});
		//큰값
		var max = data.data.reduce(function (previous, current) {
			return previous.value > current.value ? previous:current;
		});
		*/
        //비쥬얼맵 설정
        //visualOption.push(setVisualMapOption([i],false,min.value,max.value,'right','bottom',null,color));
        //console.log(data.chart)
        //시리즈 설정
        switch (data.chart) {
            case 'bar':
                if (data.isComma !== null && data.isComma !== undefined) {
                    var ser = setBar(data, color, data.isComma);
                } else {
                    var ser = setBar(data, color);
                }
                break;
            case 'barld':
                break;
            case 'line':
                var ser = setLine(data, color);
                break;
            case 'pie':
                //var ser = setPie(data, color);
                break;
            case 'piedn':
                break;
            case 'map':
                break;
            case 'wordcloud':
                break;
            case 'heatmap':
                break;
            case 'scatter':
                var ser = setScatter(data, color, max.value)
                break;
            case 'radar':
                break;
            case 'treemap':
                break;
            case 'barstack':
                var ser = setBar(data, color);
                //스택여부
                ser.stack = "STK";
                break;
            case 'barldstack':
                break;
            case 'linesmooth':
                var ser = setLine(data, color);
                //곡선여부
                ser.smooth = true;
                break;
            case 'area':
                var ser = setLine(data, color);
                //스타일
                ser.areaStyle = {};
                break;
            case 'areastack':
                var ser = setLine(data, color);
                //스택설정
                ser.stack = "STK";
                //스타일
                ser.areaStyle = {};
                break;
        }

        //y축 지정
        //ser.yAxisIndex = yAxis.findIndex(y => y.key==data.key);

        //y축 중복 제거
        yAxis = yAxis.filter((arr, index, callback) => index === callback.findIndex(t => t.key === arr.key && t.name === arr.name));
        var pos = 0;
        for (var i = 0; i < yAxis.length; i++) {
            if (yAxis[i].position == 'right') {
                yAxis[i].offset = pos;
                pos = pos + 50;
            }
        }

        //y축 시리즈 지정
        for (var i = 0; i < yAxis.length; i++) {
            if (yAxis[i].key == data.key) {
                ser.yAxisIndex = i;
                break;
            }
        }

        //x축 지정
        //ser.xAxisIndex = xAxis.findIndex(x => x.key==data.key);

        //시리즈 설정
        seriesData.push(ser);
    });


    //전체 옵션 적용
    var option = {
        grid: {
            //y: '15%',
            //x: '5%',
            left: '3%',
            right: '5%',
            //bottom: '20%',
            containLabel: true
        },
        title: {
            text: val.title,
            subtext: val.subtitle,
            x: 'center',
            //top: '5%',
            //left: '2%',
        },
        legend: {
            //orient: 'vertical',
            //left: 'left',
            //top: 'center',
            top: '5%',
            //left: '2%',
            data: legend
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                label: {
                    show: true
                }
            }
        },
        toolbox: setToolBoxOption(false, false, false, false, false, true, String(50 + val.subtitle.length) + '%', '1%', false),
        series: seriesData,
        visualMap: visualOption,
        xAxis: [{
            type: 'category',
            axisLabel: {
                rotate: 50,
                margin: 5,
                //fontSize: 10,
                //padding: -10,
                //margin: -3
            },
            data: label.filter(function (x, i, a) {
                return a.indexOf(x) == i;
            })
            //data: Array.from(new Set(label))
        }],

        //xAxis: xAxis,
        yAxis: yAxis,
        /*
		yAxis: [{
			type: 'value',
			axisLabel: {
				rotate: 50,
				margin: 5,
				//fontSize: 10
			},
		}],
		*/

        dataZoom: setZoom(isZoom),
    };

    //챠트표시
    viewContainer = document.getElementById('view' + index);
    view = echarts.init(viewContainer);
    view.setOption(option);

    //console.log(option);

    //리사이즈 이벤트
    eventResize(view);

    //이미지 다운로드 이벤트
    chartImageDownload(view);
}

//누적막대
function viewBarStack(val, index, isZoom) {
    var seriesData = [];
    var legend = [];
    var label = [];
    var value = [];
    var visualOption = [];
    var xAxis = [];
    var yAxis = [];

    //데이터
    var series = val.series;

    //범례
    series.forEach(function (data) {
        legend.push(data.name);
    });

    //시리즈
    var offsetX = 0;
    var offsetY = 0;
    series.forEach(function (data, i) {
        var color = valColors[i]; //randomColor();

        //x축 레이블
        data.data.forEach(function (data) {
            label.push(data.name);
        });

        //y축 설정
        if (data.key == "0") {
            let y = yAxis.some(function (y) {
                y.key === data.key
            });
            if (!y) {
                yAxis.push(setyAxis(data.key, data.yname, 'value', 'left', 0, color, true, label));
            }
        } else {
            let y = yAxis.some(function (y) {
                y.key === data.key
            });
            if (!y) {
                yAxis.push(setyAxis(data.key, data.yname, 'value', 'right', offsetY, color, true, label))
                offsetY = offsetY + 50;
            }
        }

        //x축 설정
        if (data.key == "0") {
            let x = xAxis.some(function (x) {
                x.key === data.key
            });
            if (!x) {
                xAxis.push(setxAxis(data.key, data.yname, 'category', 'bottom', 0, color, true, label));
            }
        } else {
            let x = xAxis.some(function (x) {
                x.key === data.key
            });
            if (!x) {
                xAxis.push(setxAxis(data.key, data.yname, 'category', 'bottom', offsetX, color, false, label))
                offsetX = offsetX + 5;
            }
        }

        /*
		//작은값
		var min = data.data.reduce(function (previous, current) {
			return previous.value < current.value ? previous:current;
		});
		//큰값
		var max = data.data.reduce(function (previous, current) {
			return previous.value > current.value ? previous:current;
		});
		*/

        //비쥬얼맵 설정
        //visualOption.push(setVisualMapOption([i],false,min.value,max.value,'right','bottom',null,color));

        //시리즈 설정
        switch (data.chart) {
            case 'bar':
                var ser = setBar(data, color);
                break;
            case 'barld':
                break;
            case 'line':
                var ser = setLine(data, color);
                break;
            case 'pie':
                //var ser = setPie(data, color);
                break;
            case 'piedn':
                break;
            case 'map':
                break;
            case 'wordcloud':
                break;
            case 'heatmap':
                break;
            case 'scatter':
                break;
            case 'radar':
                break;
            case 'treemap':
                break;
            case 'barstack':
                var ser = setBar(data, color);
                //스택여부
                ser.stack = "STK";
                //레이블 표시여부
                ser.label.show = false;
                break;
            case 'barldstack':
                break;
            case 'linesmooth':
                var ser = setLine(data, color);
                //곡선여부
                ser.smooth = true;
                break;
            case 'area':
                var ser = setLine(data, color);
                //스타일
                ser.areaStyle = {};
                break;
            case 'areastack':
                var ser = setLine(data, color);
                //스택설정
                ser.stack = "STK";
                //스타일
                ser.areaStyle = {};
                break;
        }

        //y축 지정
        //ser.yAxisIndex = yAxis.findIndex(y => y.key==data.key);

        //y축 중복 제거
        yAxis = yAxis.filter((arr, index, callback) => index === callback.findIndex(t => t.key === arr.key && t.name === arr.name));
        var pos = 0;
        for (var i = 0; i < yAxis.length; i++) {
            if (yAxis[i].position == 'right') {
                yAxis[i].offset = pos;
                pos = pos + 50;
            }
        }

        for (var i = 0; i < yAxis.length; i++) {
            if (yAxis[i].key == data.key) {
                ser.yAxisIndex = i;
                break;
            }
        }

        //x축 지정
        //ser.xAxisIndex = xAxis.findIndex(x => x.key==data.key);

        //시리즈 설정
        seriesData.push(ser);
    });

    //전체 옵션 적용
    var option = {
        grid: {
            left: '3%',
            right: '5%',
            //bottom: '20%',
            containLabel: true
        },
        title: {
            //text: val.title,
            //subtext: val.subtitle,
            x: 'center',
            //top: '5%',
            //left: '2%',
        },
        legend: {
            //orient: 'vertical',
            //left: 'left',
            //top: 'center',
            top: '5%',
            //left: '2%',
            data: legend
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                label: {
                    show: true
                }
            }
        },
        toolbox: setToolBoxOption(false, false, false, false, false, true, String(50 + val.subtitle.length) + '%', '1%', false),
        series: seriesData,
        visualMap: visualOption,
        xAxis: [{
            type: 'category',
            axisLabel: {
                rotate: 50,
                margin: 5,
                //fontSize: 10
                axisLabel: {
                    rotate: 50,
                    margin: 5,
                    //fontSize: 10
                },
            },
            data: label.filter(function (x, i, a) {
                return a.indexOf(x) == i;
            })
            //data: Array.from(new Set(label))
        }],

        //xAxis: xAxis,
        yAxis: yAxis,
        /*
		yAxis: [{
			type: 'value',
			axisLabel: {
				rotate: 50,
				margin: 5,
				//fontSize: 10
			},
		}],
		*/

        dataZoom: setZoom(isZoom),
    };

    //챠트표시
    viewContainer = document.getElementById('view' + index);
    view = echarts.init(viewContainer);
    view.setOption(option);

    //리사이즈 이벤트
    eventResize(view);

    //이미지 다운로드 이벤트
    chartImageDownload(view);
}

//꺾은선
function viewLine(val, index, isZoom, isComma, isTool) {
    var seriesData = [];
    var legend = [];
    var label = [];
    var value = [];
    var visualOption = [];
    var xAxis = [];
    var yAxis = [];

    //데이터
    var series = val.series;

    //범례
    series.forEach(function (data) {
        legend.push(data.name);
    });

    //시리즈
    var offsetX = 0;
    var offsetY = 0;
    series.forEach(function (data, i) {
        var color = valColors[i]; //randomColor();

        //x축 레이블
        data.data.forEach(function (data) {
            label.push(data.name);
        });

        //y축 설정
        if (data.key == "0") {
            let y = yAxis.some(function (y) {
                y.key === data.key
            });
            if (!y) {
                yAxis.push(setyAxis(data.key, data.yname, 'value', 'left', 0, color, true, label));
            }
        } else {
            let y = yAxis.some(function (y) {
                y.key === data.key
            });
            if (!y) {
                yAxis.push(setyAxis(data.key, data.yname, 'value', 'right', offsetY, color, true, label))
                offsetY = offsetY + 50;
            }
        }

        //x축 설정
        if (data.key == "0") {
            let x = xAxis.some(function (x) {
                x.key === data.key
            });
            if (!x) {
                xAxis.push(setxAxis(data.key, data.yname, 'category', 'bottom', 0, color, true, label));
            }
        } else {
            let x = xAxis.some(function (x) {
                x.key === data.key
            });
            if (!x) {
                xAxis.push(setxAxis(data.key, data.yname, 'category', 'bottom', offsetX, color, false, label))
                offsetX = offsetX + 5;
            }
        }

        /*
		//작은값
		var min = data.data.reduce(function (previous, current) {
			return previous.value < current.value ? previous:current;
		});
		//큰값
		var max = data.data.reduce(function (previous, current) {
			return previous.value > current.value ? previous:current;
		});
		*/

        //비쥬얼맵 설정
        //visualOption.push(setVisualMapOption([i],false,min.value,max.value,'right','bottom',null,color));

        //시리즈 설정
        switch (data.chart) {
            case 'bar':
                var ser = setBar(data, color, isComma);
                break;
            case 'barld':
                break;
            case 'line':
                var ser = setLine(data, color, isComma);
                break;
            case 'pie':
                //var ser = setPie(data, color);
                break;
            case 'piedn':
                break;
            case 'map':
                break;
            case 'wordcloud':
                break;
            case 'heatmap':
                break;
            case 'scatter':
                break;
            case 'radar':
                break;
            case 'treemap':
                break;
            case 'barstack':
                var ser = setBar(data, color);
                //스택여부
                ser.stack = "STK";
                break;
            case 'barldstack':
                break;
            case 'linesmooth':
                var ser = setLine(data, color);
                //곡선여부
                ser.smooth = true;
                break;
            case 'area':
                var ser = setLine(data, color);
                //스타일
                ser.areaStyle = {};
                break;
            case 'areastack':
                var ser = setLine(data, color);
                //스택설정
                ser.stack = "STK";
                //스타일
                ser.areaStyle = {};
                break;
        }

        //y축 지정
        //ser.yAxisIndex = yAxis.findIndex(y => y.key==data.key);

        //y축 중복 제거
        yAxis = yAxis.filter((arr, index, callback) => index === callback.findIndex(t => t.key === arr.key && t.name === arr.name));
        var pos = 0;
        for (var i = 0; i < yAxis.length; i++) {
            if (yAxis[i].position == 'right') {
                yAxis[i].offset = pos;
                pos = pos + 50;
            }
        }

        for (var i = 0; i < yAxis.length; i++) {
            if (yAxis[i].key == data.key) {
                ser.yAxisIndex = i;
                break;
            }
        }

        //x축 지정
        //ser.xAxisIndex = xAxis.findIndex(x => x.key==data.key);

        //시리즈 설정
        seriesData.push(ser);
    });

    //전체 옵션 적용
    var option = {
        grid: {
            left: '3%',
            right: '5%',
            bottom: (isZoom == true) ? '15%' : '5%',
            containLabel: true
        },
        title: {
            //text: val.title,
            //subtext: val.subtitle,
            x: 'center',
            //top: '5%',
            //left: '2%',
        },
        legend: {
            //orient: 'vertical',
            //left: 'left',
            //top: 'center',
            top: '5%',
            //left: '2%',
            data: legend
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                label: {
                    show: true
                }
            }
        },
        //toolbox: setToolBoxOption(isTool, false, false, true, false, false, String(50 + val.subtitle.length) + '%', '1%', false),
        toolbox: setToolBoxOption(isTool, false, false, true, false, false, 'right', '1%', false),
        series: seriesData,
        visualMap: visualOption,
        xAxis: [{
            type: 'category',
            axisLabel: {
                rotate: 50,
                margin: 5,
                //fontSize: 10
            },
            data: label.filter(function (x, i, a) {
                return a.indexOf(x) == i;
            })
            //data: Array.from(new Set(label))
        }],

        //xAxis: xAxis,
        yAxis: yAxis,
        /*
		yAxis: [{
			type: 'value',
			axisLabel: {
				rotate: 50,
				margin: 5,
				//fontSize: 10
			},
		}],
		*/

        dataZoom: setZoom(isZoom),
    };

    //챠트표시
    viewContainer = document.getElementById('view' + index);
    //console.log(viewContainer)
    view = echarts.init(viewContainer);
    view.setOption(option);

    //리사이즈 이벤트
    eventResize(view);

    //이미지 다운로드 이벤트
    chartImageDownload(view);
}

//곡선
function viewLineSmooth(val, index, isZoom) {
    var seriesData = [];
    var legend = [];
    var label = [];
    var value = [];
    var visualOption = [];
    var xAxis = [];
    var yAxis = [];

    //데이터
    var series = val.series;

    //범례
    series.forEach(function (data) {
        legend.push(data.name);
    });

    //시리즈
    var offsetX = 0;
    var offsetY = 0;
    series.forEach(function (data, i) {
        var color = valColors[i]; //randomColor();

        //x축 레이블
        data.data.forEach(function (data) {
            label.push(data.name);
        });

        //y축 설정
        if (data.key == "0") {
            let y = yAxis.some(function (y) {
                y.key === data.key
            });
            if (!y) {
                yAxis.push(setyAxis(data.key, data.yname, 'value', 'left', 0, color, true, label));
            }
        } else {
            let y = yAxis.some(function (y) {
                y.key === data.key
            });
            if (!y) {
                yAxis.push(setyAxis(data.key, data.yname, 'value', 'right', offsetY, color, true, label))
                offsetY = offsetY + 50;
            }
        }

        //x축 설정
        if (data.key == "0") {
            let x = xAxis.some(function (x) {
                x.key === data.key
            });
            if (!x) {
                xAxis.push(setxAxis(data.key, data.yname, 'category', 'bottom', 0, color, true, label));
            }
        } else {
            let x = xAxis.some(function (x) {
                x.key === data.key
            });
            if (!x) {
                xAxis.push(setxAxis(data.key, data.yname, 'category', 'bottom', offsetX, color, false, label))
                offsetX = offsetX + 5;
            }
        }

        /*
		//작은값
		var min = data.data.reduce(function (previous, current) {
			return previous.value < current.value ? previous:current;
		});
		//큰값
		var max = data.data.reduce(function (previous, current) {
			return previous.value > current.value ? previous:current;
		});
		*/

        //비쥬얼맵 설정
        //visualOption.push(setVisualMapOption([i],false,min.value,max.value,'right','bottom',null,color));

        //시리즈 설정
        switch (data.chart) {
            case 'bar':
                var ser = setBar(data, color);
                break;
            case 'barld':
                break;
            case 'line':
                var ser = setLine(data, color);
                break;
            case 'pie':
                //var ser = setPie(data, color);
                break;
            case 'piedn':
                break;
            case 'map':
                break;
            case 'wordcloud':
                break;
            case 'heatmap':
                break;
            case 'scatter':
                break;
            case 'radar':
                break;
            case 'treemap':
                break;
            case 'barstack':
                var ser = setBar(data, color);
                //스택여부
                ser.stack = "STK";
                break;
            case 'barldstack':
                break;
            case 'linesmooth':
                var ser = setLine(data, color);
                //곡선여부
                ser.smooth = true;
                break;
            case 'area':
                var ser = setLine(data, color);
                //스타일
                ser.areaStyle = {};
                break;
            case 'areastack':
                var ser = setLine(data, color);
                //스택설정
                ser.stack = "STK";
                //스타일
                ser.areaStyle = {};
                break;
        }

        //y축 지정
        //ser.yAxisIndex = yAxis.findIndex(y => y.key==data.key);

        //y축 중복 제거
        yAxis = yAxis.filter((arr, index, callback) => index === callback.findIndex(t => t.key === arr.key && t.name === arr.name));
        var pos = 0;
        for (var i = 0; i < yAxis.length; i++) {
            if (yAxis[i].position == 'right') {
                yAxis[i].offset = pos;
                pos = pos + 50;
            }
        }

        for (var i = 0; i < yAxis.length; i++) {
            if (yAxis[i].key == data.key) {
                ser.yAxisIndex = i;
                break;
            }
        }

        //x축 지정
        //ser.xAxisIndex = xAxis.findIndex(x => x.key==data.key);

        //시리즈 설정
        seriesData.push(ser);
    });

    //전체 옵션 적용
    var option = {
        grid: {
            left: '3%',
            right: '5%',
            //bottom: '20%',
            containLabel: true
        },
        title: {
            //text: val.title,
            //subtext: val.subtitle,
            x: 'center',
            //top: '5%',
            //left: '2%',
        },
        legend: {
            //orient: 'vertical',
            //left: 'left',
            //top: 'center',
            top: '5%',
            //left: '2%',
            data: legend
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                label: {
                    show: true
                }
            }
        },
        toolbox: setToolBoxOption(false, false, false, false, false, true, String(50 + val.subtitle.length) + '%', '1%', false),
        series: seriesData,
        visualMap: visualOption,
        xAxis: [{
            type: 'category',
            axisLabel: {
                rotate: 50,
                margin: 5,
                //fontSize: 10
            },
            data: label.filter(function (x, i, a) {
                return a.indexOf(x) == i;
            })
            //data: Array.from(new Set(label))
        }],

        //xAxis: xAxis,
        yAxis: yAxis,
        /*
		yAxis: [{
			type: 'value',
			axisLabel: {
				rotate: 50,
				margin: 5,
				//fontSize: 10
			},
		}],
		*/

        dataZoom: setZoom(isZoom),
    };

    //챠트표시
    viewContainer = document.getElementById('view' + index);
    view = echarts.init(viewContainer);
    view.setOption(option);

    //리사이즈 이벤트
    eventResize(view);

    //이미지 다운로드 이벤트
    chartImageDownload(view);
}

//가로막대
function viewBarld(val, index, isZoom) {
    var seriesData = [];
    var legend = [];
    var label = [];
    var value = [];
    var visualOption = [];
    var xAxis = [];
    var yAxis = [];

    //데이터
    var series = val.series;

    //범례
    series.forEach(function (data) {
        legend.push(data.name);
    });

    //시리즈
    var offsetX = 0;
    var offsetY = 0;
    series.forEach(function (data, i) {
        var color = valColors[i]; //randomColor();

        //x축 레이블
        data.data.forEach(function (data) {
            label.push(data.name);
        });

        //y축 설정
        if (data.key == "0") {
            let y = yAxis.some(function (y) {
                y.key === data.key
            });
            if (!y) {
                yAxis.push(setyAxis(data.key, data.yname, 'category', 'left', 0, color, true, label));
            }
        } else {
            let y = yAxis.some(function (y) {
                y.key === data.key
            });
            if (!y) {
                yAxis.push(setyAxis(data.key, data.yname, 'category', 'right', offsetY, color, true, label))
                offsetY = offsetY + 50;
            }
        }

        //x축 설정
        if (data.key == "0") {
            let x = xAxis.some(function (x) {
                x.key === data.key
            });
            if (!x) {
                xAxis.push(setxAxis(data.key, data.yname, 'value', 'bottom', 0, color, true, null));
            }
        } else {
            let x = xAxis.some(function (x) {
                x.key === data.key
            });
            if (!x) {
                xAxis.push(setxAxis(data.key, data.yname, 'value', 'bottom', offsetX, color, false, null))
                offsetX = offsetX + 5;
            }
        }

        //작은값
        var min = data.data.reduce(function (previous, current) {
            return previous.value < current.value ? previous : current;
        });
        //큰값
        var max = data.data.reduce(function (previous, current) {
            return previous.value > current.value ? previous : current;
        });

        //비쥬얼맵 설정
        //visualOption.push(setVisualMapOption([i],false,min.value,max.value,'right','bottom',null,color));

        //시리즈 설정
        switch (data.chart) {
            case 'bar':
                //var ser = setBar(data, color);
                break;
            case 'barld':
                var ser = setBar(data, color);
                //레이블 위치
                ser.label.position = 'right';
                break;
            case 'line':
                //var ser = setLine(data, color);
                break;
            case 'pie':
                //var ser = setPie(data, color);
                break;
            case 'piedn':
                break;
            case 'map':
                break;
            case 'wordcloud':
                break;
            case 'heatmap':
                break;
            case 'scatter':
                //var ser = setScatter(data, color, max.value)
                break;
            case 'radar':
                break;
            case 'treemap':
                break;
            case 'barstack':
                //var ser = setBar(data, color);
                //스택여부
                //ser.stack = "STK";
                break;
            case 'barldstack':
                break;
            case 'linesmooth':
                break;
            case 'area':
                //var ser = setLine(data, color);
                //스타일
                //ser.areaStyle = {};
                break;
            case 'areastack':
                break;
        }

        //y축 지정
        //ser.yAxisIndex = yAxis.findIndex(y => y.key==data.key);
        //x축 지정

        //ser.xAxisIndex = xAxis.findIndex(x => x.key==data.key);

        //y축 중복 제거
        yAxis = yAxis.filter((arr, index, callback) => index === callback.findIndex(t => t.key === arr.key && t.name === arr.name));
        var pos = 0;
        for (var i = 0; i < yAxis.length; i++) {
            if (yAxis[i].position == 'right') {
                yAxis[i].offset = pos;
                pos = pos + 50;
            }
        }

        for (var i = 0; i < xAxis.length; i++) {
            if (xAxis[i].key == data.key) {
                ser.xAxisIndex = i;
                break;
            }
        }

        //시리즈 설정
        seriesData.push(ser);
    });

    //전체 옵션 적용
    var option = {
        grid: {
            left: '3%',
            right: '5%',
            //bottom: '20%',
            containLabel: true
        },
        title: {
            //text: val.title,
            //subtext: val.subtitle,
            x: 'center',
            //top: '5%',
            //left: '2%',
        },
        legend: {
            //orient: 'vertical',
            //left: 'left',
            //top: 'center',
            top: '5%',
            //left: '2%',
            data: legend
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                label: {
                    show: true
                }
            }
        },
        toolbox: setToolBoxOption(false, false, false, false, false, true, String(50 + val.subtitle.length) + '%', '1%', false),
        series: seriesData,
        visualMap: visualOption,
        xAxis: xAxis,
        /*
		xAxis: [{
			type: 'value',
			axisLabel: {
				rotate: 50,
				margin: 5,
				//fontSize: 10
			},
		}],
		*/

        yAxis: [{
            type: 'category',
            axisLabel: {
                rotate: 50,
                margin: 5,
                //fontSize: 10
            },
            data: label.filter(function (x, i, a) {
                return a.indexOf(x) == i;
            })
            //data: Array.from(new Set(label))
        }],
        dataZoom: setZoom(isZoom),
    };

    //챠트표시
    viewContainer = document.getElementById('view' + index);
    view = echarts.init(viewContainer);
    view.setOption(option);

    //console.log(option);

    //리사이즈 이벤트
    eventResize(view);

    //이미지 다운로드 이벤트
    chartImageDownload(view);
}

//누적가로막대
function viewBarldStack(val, index, isZoom) {
    var seriesData = [];
    var legend = [];
    var label = [];
    var value = [];
    var visualOption = [];
    var xAxis = [];
    var yAxis = [];

    //데이터
    var series = val.series;

    //범례
    series.forEach(function (data) {
        legend.push(data.name);
    });

    //시리즈
    var offsetX = 0;
    var offsetY = 0;
    series.forEach(function (data, i) {
        var color = valColors[i]; //randomColor();

        //x축 레이블
        data.data.forEach(function (data) {
            label.push(data.name);
        });

        //y축 설정
        if (data.key == "0") {
            let y = yAxis.some(function (y) {
                y.key === data.key
            });
            if (!y) {
                yAxis.push(setyAxis(data.key, data.yname, 'category', 'left', 0, color, true, label));
            }
        } else {
            let y = yAxis.some(function (y) {
                y.key === data.key
            });
            if (!y) {
                yAxis.push(setyAxis(data.key, data.yname, 'category', 'right', offsetY, color, true, label))
                offsetY = offsetY + 50;
            }
        }

        //x축 설정
        if (data.key == "0") {
            let x = xAxis.some(function (x) {
                x.key === data.key
            });
            if (!x) {
                xAxis.push(setxAxis(data.key, data.yname, 'value', 'bottom', 0, color, true, null));
            }
        } else {
            let x = xAxis.some(function (x) {
                x.key === data.key
            });
            if (!x) {
                xAxis.push(setxAxis(data.key, data.yname, 'value', 'bottom', offsetX, color, false, null))
                offsetX = offsetX + 5;
            }
        }

        //작은값
        var min = data.data.reduce(function (previous, current) {
            return previous.value < current.value ? previous : current;
        });
        //큰값
        var max = data.data.reduce(function (previous, current) {
            return previous.value > current.value ? previous : current;
        });

        //비쥬얼맵 설정
        //visualOption.push(setVisualMapOption([i],false,min.value,max.value,'right','bottom',null,color));

        //시리즈 설정
        switch (data.chart) {
            case 'bar':
                //var ser = setBar(data, color);
                break;
            case 'barld':
                //var ser = setBar(data, color);
                //레이블 위치
                //ser.label.position = 'right';
                break;
            case 'line':
                //var ser = setLine(data, color);
                break;
            case 'pie':
                //var ser = setPie(data, color);
                break;
            case 'piedn':
                break;
            case 'map':
                break;
            case 'wordcloud':
                break;
            case 'heatmap':
                break;
            case 'scatter':
                //var ser = setScatter(data, color, max.value)
                break;
            case 'radar':
                break;
            case 'treemap':
                break;
            case 'barstack':
                //var ser = setBar(data, color);
                //스택여부
                //ser.stack = "STK";
                break;
            case 'barldstack':
                var ser = setBar(data, color);
                //스택여부
                ser.stack = "STK";
                //레이블 표시여부
                ser.label.show = false;
                //레이블 위치
                ser.label.position = 'right';
                break;
            case 'linesmooth':
                break;
            case 'area':
                //var ser = setLine(data, color);
                //스타일
                //ser.areaStyle = {};
                break;
            case 'areastack':
                break;
        }

        //y축 지정
        //ser.yAxisIndex = yAxis.findIndex(y => y.key==data.key);
        //x축 지정
        //ser.xAxisIndex = xAxis.findIndex(x => x.key==data.key);

        //y축 중복 제거
        yAxis = yAxis.filter((arr, index, callback) => index === callback.findIndex(t => t.key === arr.key && t.name === arr.name));
        var pos = 0;
        for (var i = 0; i < yAxis.length; i++) {
            if (yAxis[i].position == 'right') {
                yAxis[i].offset = pos;
                pos = pos + 50;
            }
        }

        for (var i = 0; i < xAxis.length; i++) {
            if (xAxis[i].key == data.key) {
                ser.xAxisIndex = i;
                break;
            }
        }

        //시리즈 설정
        seriesData.push(ser);
    });

    //전체 옵션 적용
    var option = {
        grid: {
            left: '3%',
            right: '5%',
            //bottom: '20%',
            containLabel: true
        },
        title: {
            //text: val.title,
            //subtext: val.subtitle,
            x: 'center',
            //top: '5%',
            //left: '2%',
        },
        legend: {
            //orient: 'vertical',
            //left: 'left',
            //top: 'center',
            top: '5%',
            //left: '2%',
            data: legend
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                label: {
                    show: true
                }
            }
        },
        toolbox: setToolBoxOption(false, false, false, false, false, true, String(50 + val.subtitle.length) + '%', '1%', false),
        series: seriesData,
        visualMap: visualOption,
        xAxis: xAxis,
        /*
		xAxis: [{
			type: 'value',
			axisLabel: {
				rotate: 50,
				margin: 5,
				//fontSize: 10
			},
		}],
		*/

        yAxis: [{
            type: 'category',
            axisLabel: {
                rotate: 50,
                margin: 5,
                //fontSize: 10
            },
            data: label.filter(function (x, i, a) {
                return a.indexOf(x) == i;
            })
            //data: Array.from(new Set(label))
        }],
        dataZoom: setZoom(isZoom),
    };

    //챠트표시
    viewContainer = document.getElementById('view' + index);
    view = echarts.init(viewContainer);
    view.setOption(option);

    //리사이즈 이벤트
    eventResize(view);

    //이미지 다운로드 이벤트
    chartImageDownload(view);
}

//파이
function viewPie(val, index) {
    var seriesData = [];
    var legend = [];
    var label = [];
    var value = [];
    //var visualOption = [];

    //데이터
    var series = val.series;

    //범례
    series.forEach(function (data) {
        legend.push(data.name);
    });

    //레이블
    /*
	series[0].data.forEach(function(data) {
		label.push(data.name);
	});
	*/

    //시리즈
    //var i=0;
    series.forEach(function (data) {
        var color = randomColor();
        var ser = setPie(data, color);

        //레이블
        data.data.forEach(function (data) {
            label.push(data.name);
        });

        //시리즈 설정
        seriesData.push(ser);

        //작은값
        var min = data.data.reduce(function (previous, current) {
            return previous.value < current.value ? previous : current;
        });
        //큰값
        var max = data.data.reduce(function (previous, current) {
            return previous.value > current.value ? previous : current;
        });

        //비쥬얼맵 설정
        //visualOption.push(setVisualMapOption([i],false,min.value,max.value,'right','bottom',null,color));
    });

    //전체 옵션 적용
    var option = {
        grid: {
            left: '3%',
            right: '5%',
            //bottom: '20%',
            containLabel: true
        },
        title: {
            //text: val.title,
            //subtext: val.subtitle,
            x: 'center',
            //top: '5%',
            //left: '2%',
        },

        legend: {
            //orient: 'vertical',
            //left: 'left',
            //top: 'center',
            top: '5%',
            //left: '2%',
            data: label.filter(function (x, i, a) {
                return a.indexOf(x) == i;
            })
            //data: Array.from(new Set(label))
        },
        tooltip: {},
        toolbox: setToolBoxOption(false, false, false, false, false, true, String(50 + val.subtitle.length) + '%', '1%', false),
        series: seriesData,
        //visualMap: visualOption
    };

    //챠트표시
    viewContainer = document.getElementById('view' + index);
    view = echarts.init(viewContainer);
    view.setOption(option);

    //리사이즈 이벤트
    eventResize(view);

    //이미지 다운로드 이벤트
    chartImageDownload(view);
}

//도넛
function viewPiedn(val, index) {
    var seriesData = [];
    var legend = [];
    var label = [];
    var value = [];

    //데이터
    var series = val.series;

    //범례
    series.forEach(function (data) {
        legend.push(data.name);
    });

    //레이블
    /*
	series[0].data.forEach(function(data) {
		label.push(data.name);
	});
	*/

    //시리즈
    //var i=0;
    series.forEach(function (data) {
        var color = randomColor();
        var ser = setPie(data, color);

        //레이블
        data.data.forEach(function (data) {
            label.push(data.name);
        });

        //도넛
        ser.radius = ['50%', '80%'];

        //시리즈 설정
        seriesData.push(ser);

        //작은값
        var min = data.data.reduce(function (previous, current) {
            return previous.value < current.value ? previous : current;
        });
        //큰값
        var max = data.data.reduce(function (previous, current) {
            return previous.value > current.value ? previous : current;
        });

        //비쥬얼맵 설정
        //visualOption.push(setVisualMapOption([i],false,min.value,max.value,'right','bottom',null,color));
    });

    //전체 옵션 적용
    var option = {
        grid: {
            left: '3%',
            right: '5%',
            //bottom: '20%',
            containLabel: true
        },
        title: {
            //text: val.title,
            //subtext: val.subtitle,
            x: 'center',
            //top: '5%',
            //left: '2%',
        },

        legend: {
            //orient: 'vertical',
            //left: 'left',
            //top: 'center',
            top: '5%',
            //left: '2%',
            data: label.filter(function (x, i, a) {
                return a.indexOf(x) == i;
            })
            //data: Array.from(new Set(label))
        },
        tooltip: {},
        toolbox: setToolBoxOption(false, false, false, false, false, true, String(50 + val.subtitle.length) + '%', '1%', false),
        series: seriesData,
        //visualMap: visualOption
    };

    //챠트표시
    viewContainer = document.getElementById('view' + index);
    view = echarts.init(viewContainer);
    view.setOption(option);

    //리사이즈 이벤트
    eventResize(view);

    //이미지 다운로드 이벤트
    chartImageDownload(view);
}

//영역
function viewArea(val, index, isZoom) {
    var seriesData = [];
    var legend = [];
    var label = [];
    var value = [];
    var visualOption = [];
    var xAxis = [];
    var yAxis = [];

    //데이터
    var series = val.series;

    //범례
    series.forEach(function (data) {
        legend.push(data.name);
    });

    //시리즈
    var offsetX = 0;
    var offsetY = 0;
    series.forEach(function (data, i) {
        var color = valColors[i]; //randomColor();

        //x축 레이블
        data.data.forEach(function (data) {
            label.push(data.name);
        });

        //y축 설정
        if (data.key == "0") {
            let y = yAxis.some(function (y) {
                y.key === data.key
            });
            if (!y) {
                yAxis.push(setyAxis(data.key, data.yname, 'value', 'left', 0, color, true, label));
            }
        } else {
            let y = yAxis.some(function (y) {
                y.key === data.key
            });
            if (!y) {
                yAxis.push(setyAxis(data.key, data.yname, 'value', 'right', offsetY, color, true, label))
                offsetY = offsetY + 50;
            }
        }

        //x축 설정
        if (data.key == "0") {
            let x = xAxis.some(function (x) {
                x.key === data.key
            });
            if (!x) {
                xAxis.push(setxAxis(data.key, data.yname, 'category', 'bottom', 0, color, true, label));
            }
        } else {
            let x = xAxis.some(function (x) {
                x.key === data.key
            });
            if (!x) {
                xAxis.push(setxAxis(data.key, data.yname, 'category', 'bottom', offsetX, color, false, label))
                offsetX = offsetX + 5;
            }
        }

        /*
		//작은값
		var min = data.data.reduce(function (previous, current) {
			return previous.value < current.value ? previous:current;
		});
		//큰값
		var max = data.data.reduce(function (previous, current) {
			return previous.value > current.value ? previous:current;
		});
		*/

        //비쥬얼맵 설정
        //visualOption.push(setVisualMapOption([i],false,min.value,max.value,'right','bottom',null,color));

        //시리즈 설정
        switch (data.chart) {
            case 'bar':
                var ser = setBar(data, color);
                break;
            case 'barld':
                break;
            case 'line':
                var ser = setLine(data, color);
                break;
            case 'pie':
                //var ser = setPie(data, color);
                break;
            case 'piedn':
                break;
            case 'map':
                break;
            case 'wordcloud':
                break;
            case 'heatmap':
                break;
            case 'scatter':
                break;
            case 'radar':
                break;
            case 'treemap':
                break;
            case 'barstack':
                var ser = setBar(data, color);
                //스택여부
                ser.stack = "STK";
                break;
            case 'barldstack':
                break;
            case 'linesmooth':
                var ser = setLine(data, color);
                //곡선여부
                ser.smooth = true;
                break;
            case 'area':
                var ser = setLine(data, color);
                //스타일
                ser.areaStyle = {};
                ser.emphasis = {focus: 'series'};
                break;
            case 'areastack':
                var ser = setLine(data, color);
                //스택설정
                ser.stack = "STK";
                //스타일
                ser.areaStyle = {};
                ser.emphasis = {focus: 'series'};
                break;
        }

        //y축 지정
        //ser.yAxisIndex = yAxis.findIndex(y => y.key==data.key);

        //y축 중복 제거
        yAxis = yAxis.filter((arr, index, callback) => index === callback.findIndex(t => t.key === arr.key && t.name === arr.name));
        var pos = 0;
        for (var i = 0; i < yAxis.length; i++) {
            if (yAxis[i].position == 'right') {
                yAxis[i].offset = pos;
                pos = pos + 50;
            }
        }

        for (var i = 0; i < yAxis.length; i++) {
            if (yAxis[i].key == data.key) {
                ser.yAxisIndex = i;
                break;
            }
        }

        //x축 지정
        //ser.xAxisIndex = xAxis.findIndex(x => x.key==data.key);

        //시리즈 설정
        seriesData.push(ser);
    });

    //전체 옵션 적용
    var option = {
        grid: {
            left: '3%',
            right: '5%',
            //bottom: '20%',
            containLabel: true
        },
        title: {
            //text: val.title,
            //subtext: val.subtitle,
            x: 'center',
            //top: '5%',
            //left: '2%',
        },
        legend: {
            //orient: 'vertical',
            //left: 'left',
            //top: 'center',
            top: '5%',
            //left: '2%',
            data: legend
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                label: {
                    show: true
                }
            }
        },
        toolbox: setToolBoxOption(false, false, false, false, false, true, String(50 + val.subtitle.length) + '%', '1%', false),
        series: seriesData,
        visualMap: visualOption,
        xAxis: [{
            type: 'category',
            axisLabel: {
                rotate: 50,
                margin: 5,
                //fontSize: 10
            },
            data: label.filter(function (x, i, a) {
                return a.indexOf(x) == i;
            })
            //data: Array.from(new Set(label))
        }],

        //xAxis: xAxis,
        yAxis: yAxis,
        /*
		yAxis: [{
			type: 'value',
			axisLabel: {
				rotate: 50,
				margin: 5,
				//fontSize: 10
			},
		}],
		*/

        dataZoom: setZoom(isZoom),
    };

    //챠트표시
    viewContainer = document.getElementById('view' + index);
    view = echarts.init(viewContainer);
    view.setOption(option);

    //리사이즈 이벤트
    eventResize(view);

    //이미지 다운로드 이벤트
    chartImageDownload(view);
}

//누적영역
function viewAreaStack(val, index, isZoom) {
    var seriesData = [];
    var legend = [];
    var label = [];
    var value = [];
    var visualOption = [];
    var xAxis = [];
    var yAxis = [];

    //데이터
    var series = val.series;

    //범례
    series.forEach(function (data) {
        legend.push(data.name);
    });

    //시리즈
    var i = 0;
    var offsetX = 0;
    var offsetY = 0;
    series.forEach(function (data, i) {
        var color = valColors[i]; //randomColor();

        //x축 레이블
        data.data.forEach(function (data) {
            label.push(data.name);
        });

        //y축 설정
        if (data.key == "0") {
            let y = yAxis.some(function (y) {
                y.key === data.key
            });
            if (!y) {
                yAxis.push(setyAxis(data.key, data.yname, 'value', 'left', 0, color, true, label));
            }
        } else {
            let y = yAxis.some(function (y) {
                y.key === data.key
            });
            if (!y) {
                yAxis.push(setyAxis(data.key, data.yname, 'value', 'right', offsetY, color, true, label))
                offsetY = offsetY + 50;
            }
        }

        //x축 설정
        if (data.key == "0") {
            let x = xAxis.some(function (x) {
                x.key === data.key
            });
            if (!x) {
                xAxis.push(setxAxis(data.key, data.yname, 'category', 'bottom', 0, color, true, label));
            }
        } else {
            let x = xAxis.some(function (x) {
                x.key === data.key
            });
            if (!x) {
                xAxis.push(setxAxis(data.key, data.yname, 'category', 'bottom', offsetX, color, false, label))
                offsetX = offsetX + 5;
            }
        }

        /*
		//작은값
		var min = data.data.reduce(function (previous, current) {
			return previous.value < current.value ? previous:current;
		});
		//큰값
		var max = data.data.reduce(function (previous, current) {
			return previous.value > current.value ? previous:current;
		});
		*/

        //비쥬얼맵 설정
        //visualOption.push(setVisualMapOption([i],false,min.value,max.value,'right','bottom',null,color));

        //시리즈 설정
        switch (data.chart) {
            case 'bar':
                var ser = setBar(data, color);
                break;
            case 'barld':
                break;
            case 'line':
                var ser = setLine(data, color);
                break;
            case 'pie':
                //var ser = setPie(data, color);
                break;
            case 'piedn':
                break;
            case 'map':
                break;
            case 'wordcloud':
                break;
            case 'heatmap':
                break;
            case 'scatter':
                break;
            case 'radar':
                break;
            case 'treemap':
                break;
            case 'barstack':
                var ser = setBar(data, color);
                //스택여부
                ser.stack = "STK";
                break;
            case 'barldstack':
                break;
            case 'linesmooth':
                var ser = setLine(data, color);
                //곡선여부
                ser.smooth = true;
                break;
                break;
            case 'area':
                var ser = setLine(data, color);
                //스타일
                ser.areaStyle = {};
                ser.emphasis = {focus: 'series'};
                break;
            case 'areastack':
                var ser = setLine(data, color);
                //스택설정
                ser.stack = "STK";
                //스타일
                ser.areaStyle = {};
                ser.emphasis = {focus: 'series'};
                break;
        }

        //y축 지정
        //ser.yAxisIndex = yAxis.findIndex(y => y.key==data.key);

        //y축 중복 제거
        yAxis = yAxis.filter((arr, index, callback) => index === callback.findIndex(t => t.key === arr.key && t.name === arr.name));
        var pos = 0;
        for (var i = 0; i < yAxis.length; i++) {
            if (yAxis[i].position == 'right') {
                yAxis[i].offset = pos;
                pos = pos + 50;
            }
        }

        for (var i = 0; i < yAxis.length; i++) {
            if (yAxis[i].key == data.key) {
                ser.yAxisIndex = i;
                break;
            }
        }

        //x축 지정
        //ser.xAxisIndex = xAxis.findIndex(x => x.key==data.key);

        //시리즈 설정
        seriesData.push(ser);
    });

    //전체 옵션 적용
    var option = {
        grid: {
            left: '3%',
            right: '5%',
            //bottom: '20%',
            containLabel: true
        },
        title: {
            //text: val.title,
            //subtext: val.subtitle,
            x: 'center',
            //top: '5%',
            //left: '2%',
        },
        legend: {
            //orient: 'vertical',
            //left: 'left',
            //top: 'center',
            top: '5%',
            //left: '2%',
            data: legend
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                label: {
                    show: true
                }
            }
        },
        toolbox: setToolBoxOption(false, false, false, false, false, true, String(50 + val.subtitle.length) + '%', '1%', false),
        series: seriesData,
        visualMap: visualOption,
        xAxis: [{
            type: 'category',
            axisLabel: {
                rotate: 50,
                margin: 5,
                //fontSize: 10
            },
            data: label.filter(function (x, i, a) {
                return a.indexOf(x) == i;
            })
            //data: Array.from(new Set(label))
        }],

        //xAxis: xAxis,
        yAxis: yAxis,

        /*
		yAxis: [{
			type: 'value',
				axisLabel: {
   				rotate: 50,
   				margin: 5,
   				//fontSize: 10
   			},
		}],
		*/

        dataZoom: setZoom(isZoom),
    };

    //챠트표시
    viewContainer = document.getElementById('view' + index);
    view = echarts.init(viewContainer);
    view.setOption(option);

    //리사이즈 이벤트
    eventResize(view);

    //이미지 다운로드 이벤트
    chartImageDownload(view);
}

//스케터
function viewScatter(val, index) {
    var seriesData = [];
    var legend = [];
    var label = [];
    var visualOption = [];
    var xAxis = [];
    var yAxis = [];

    //데이터
    var series = val.series;

    //범례
    series.forEach(function (data) {
        legend.push(data.name);
    });

    //시리즈
    var offsetX = 0;
    var offsetY = 0;
    series.forEach(function (data, i) {
        var color = valColors[i]; //randomColor();

        //x축 레이블
        data.data.forEach(function (data) {
            label.push(data.name);
        });

        //y축 설정
        if (data.key == "0") {
            let y = yAxis.some(function (y) {
                y.key === data.key
            });
            if (!y) {
                yAxis.push(setyAxis(data.key, data.yname, 'value', 'left', 0, color, true, label));
            }
        } else {
            let y = yAxis.some(function (y) {
                y.key === data.key
            });
            if (!y) {
                yAxis.push(setyAxis(data.key, data.yname, 'value', 'right', offsetY, color, true, label))
                offsetY = offsetY + 50;
            }
        }

        //x축 설정
        if (data.key == "0") {
            let x = xAxis.some(function (x) {
                x.key === data.key
            });
            if (!x) {
                xAxis.push(setxAxis(data.key, data.yname, 'category', 'bottom', 0, color, true, label));
            }
        } else {
            let x = xAxis.some(function (x) {
                x.key === data.key
            });
            if (!x) {
                xAxis.push(setxAxis(data.key, data.yname, 'category', 'bottom', offsetX, color, false, label))
                offsetX = offsetX + 5;
            }
        }

        //작은값
        var min = data.data.reduce(function (previous, current) {
            return previous.value < current.value ? previous : current;
        });
        //큰값
        var max = data.data.reduce(function (previous, current) {
            return previous.value > current.value ? previous : current;
        });

        //비쥬얼맵 설정
        //visualOption.push(setVisualMapOption([i],false,min.value,max.value,'right','bottom',null,color));

        //시리즈 설정
        switch (data.chart) {
            case 'bar':
                var ser = setBar(data, color);
                break;
            case 'barld':
                break;
            case 'line':
                var ser = setLine(data, color);
                break;
            case 'pie':
                //var ser = setPie(data, color);
                break;
            case 'piedn':
                break;
            case 'map':
                break;
            case 'wordcloud':
                break;
            case 'heatmap':
                break;
            case 'scatter':
                var ser = setScatter(data, color, max.value)
                break;
            case 'radar':
                break;
            case 'treemap':
                break;
            case 'barstack':
                var ser = setBar(data, color);
                //스택여부
                ser.stack = "STK";
                break;
            case 'barldstack':
                break;
            case 'linesmooth':
                break;
            case 'area':
                var ser = setLine(data, color);
                //스타일
                ser.areaStyle = {};
                break;
            case 'areastack':
                break;
        }

        //y축 지정
        //ser.yAxisIndex = yAxis.findIndex(y => y.key==data.key);

        //y축 중복 제거
        yAxis = yAxis.filter((arr, index, callback) => index === callback.findIndex(t => t.key === arr.key && t.name === arr.name));
        var pos = 0;
        for (var i = 0; i < yAxis.length; i++) {
            if (yAxis[i].position == 'right') {
                yAxis[i].offset = pos;
                pos = pos + 50;
            }
        }

        for (var i = 0; i < yAxis.length; i++) {
            if (yAxis[i].key == data.key) {
                ser.yAxisIndex = i;
                break;
            }
        }

        //x축 지정
        //ser.xAxisIndex = xAxis.findIndex(x => x.key==data.key);

        //시리즈 설정
        seriesData.push(ser);
    });

    //전체 옵션 적용
    var option = {
        grid: {
            left: '3%',
            right: '5%',
            //bottom: '20%',
            containLabel: true
        },
        title: {
            //text: val.title,
            //subtext: val.subtitle,
            x: 'center',
            //top: '5%',
            //left: '2%',
        },

        legend: {
            //orient: 'vertical',
            //left: 'left',
            //top: 'center',
            top: '5%',
            //left: '2%',
            data: legend
        },
        tooltip: {},
        toolbox: setToolBoxOption(false, false, false, false, false, true, String(50 + val.subtitle.length) + '%', '1%', false),
        series: seriesData,
        visualMap: visualOption,
        xAxis: [{
            type: 'category',
            axisLabel: {
                rotate: 50,
                margin: 5,
                //fontSize: 10
            },
            data: label.filter(function (x, i, a) {
                return a.indexOf(x) == i;
            })
            //data: Array.from(new Set(label))
        }],

        //xAxis: xAxis,
        yAxis: yAxis,
        /*
		yAxis: [{
			type: 'value',
			axisLabel: {
				rotate: 50,
				margin: 5,
				//fontSize: 10
			},
		}],
		*/

        dataZoom: setZoom(false),
    };

    //챠트표시
    viewContainer = document.getElementById('view' + index);
    view = echarts.init(viewContainer);
    view.setOption(option);

    //리사이즈 이벤트
    eventResize(view);

    //이미지 다운로드 이벤트
    chartImageDownload(view);
}

//스케터회귀
function viewScatterPlot(val, index) {
    var seriesData = [];
    var legend = [];
    var label = [];
    var visualOption = [];
    var xAxis = [];
    var yAxis = [];

    //데이터
    var series = val.series;

    //범례
    series.forEach(function (data) {
        legend.push(data.name);
    });

    //시리즈
    var offsetX = 0;
    var offsetY = 0;
    series.forEach(function (data, i) {
        var color = valColors[i]; //randomColor();
        var reg = [];

        //x축 레이블
        data.data.forEach(function (data) {
            label.push(data.name);
        });

        //y축 설정
        if (data.key == "0") {
            let y = yAxis.some(function (y) {
                y.key === data.key
            });
            if (!y) {
                yAxis.push(setyAxis(data.key, data.yname, 'value', 'left', 0, color, true, label));
            }
        } else {
            let y = yAxis.some(function (y) {
                y.key === data.key
            });
            if (!y) {
                yAxis.push(setyAxis(data.key, data.yname, 'value', 'right', offsetY, color, true, label))
                offsetY = offsetY + 50;
            }
        }

        //x축 설정
        if (data.key == "0") {
            let x = xAxis.some(function (x) {
                x.key === data.key
            });
            if (!x) {
                xAxis.push(setxAxis(data.key, data.yname, 'category', 'bottom', 0, color, true, label));
            }
        } else {
            let x = xAxis.some(function (x) {
                x.key === data.key
            });
            if (!x) {
                xAxis.push(setxAxis(data.key, data.yname, 'category', 'bottom', offsetX, color, false, label))
                offsetX = offsetX + 5;
            }
        }

        //작은값
        var min = data.data.reduce(function (previous, current) {
            return previous.value < current.value ? previous : current;
        });
        //큰값
        var max = data.data.reduce(function (previous, current) {
            return previous.value > current.value ? previous : current;
        });

        //비쥬얼맵 설정
        //visualOption.push(setVisualMapOption([i],false,min.value,max.value,'right','bottom',null,color));

        //시리즈 설정
        switch (data.chart) {
            case 'bar':
                //var ser = setBar(data, color);
                break;
            case 'barld':
                break;
            case 'line':
                //var ser = setLine(data, color);
                break;
            case 'pie':
                //var ser = setPie(data, color);
                break;
            case 'piedn':
                break;
            case 'map':
                break;
            case 'wordcloud':
                break;
            case 'heatmap':
                break;
            case 'scatter':
                break;
            case 'scatterplot':
                var ser = setScatter(data, color, max.value)
                //평균
                data.data.forEach(function (data) {
                    reg.push(data.value);
                });
                //회귀값 설정
                var myRegression = ecStat.regression('polynomial', reg, 3); //polynomial  exponential
                myRegression.points.sort(function (a, b) {
                    return a - b;
                });
                //라인챠트
                seriesData.push({
                    name: '선형',
                    type: 'line',
                    showSymbol: false,
                    smooth: true,
                    data: myRegression.points,
                    itemStyle: {
                        color: '#0080ff',
                    },
                    markPoint: {
                        itemStyle: {
                            color: 'transparent'
                        },
                        label: {
                            show: true,
                            position: 'left',
                            formatter: myRegression.expression,
                            color: '#333',
                            fontSize: 14
                        },
                        data: [{
                            coord: myRegression.points[myRegression.points.length - 1]
                        }]
                    }
                });
                //범례 추가
                legend.push('선형');
                break;
            case 'radar':
                break;
            case 'treemap':
                break;
            case 'barstack':
                //var ser = setBar(data, color);
                //스택여부
                //ser.stack = "STK";
                break;
            case 'barldstack':
                break;
            case 'linesmooth':
                break;
            case 'area':
                //var ser = setLine(data, color);
                //스타일
                //ser.areaStyle = {};
                break;
            case 'areastack':
                break;
        }

        //y축 지정
        //ser.yAxisIndex = yAxis.findIndex(y => y.key==data.key);

        //y축 중복 제거
        yAxis = yAxis.filter((arr, index, callback) => index === callback.findIndex(t => t.key === arr.key && t.name === arr.name));
        var pos = 0;
        for (var i = 0; i < yAxis.length; i++) {
            if (yAxis[i].position == 'right') {
                yAxis[i].offset = pos;
                pos = pos + 50;
            }
        }

        for (var i = 0; i < yAxis.length; i++) {
            if (yAxis[i].key == data.key) {
                ser.yAxisIndex = i;
                break;
            }
        }

        //x축 지정
        //ser.xAxisIndex = xAxis.findIndex(x => x.key==data.key);

        //시리즈 설정
        seriesData.push(ser);
    });

    //전체 옵션 적용
    var option = {
        grid: {
            left: '3%',
            right: '5%',
            //bottom: '20%',
            containLabel: true
        },
        title: {
            //text: val.title,
            //subtext: val.subtitle,
            x: 'center',
            //top: '5%',
            //left: '2%',
        },

        legend: {
            //orient: 'vertical',
            //left: 'left',
            //top: 'center',
            top: '5%',
            //left: '2%',
            data: legend
        },
        tooltip: {},
        toolbox: setToolBoxOption(false, false, false, false, false, true, String(50 + val.subtitle.length) + '%', '1%', false),
        series: seriesData,
        visualMap: visualOption,
        xAxis: [{
            type: 'category',
            axisLabel: {
                rotate: 50,
                margin: 5,
                //fontSize: 10
            },
            data: label.filter(function (x, i, a) {
                return a.indexOf(x) == i;
            })
            //data: Array.from(new Set(label))
        }],

        //xAxis: xAxis,
        yAxis: yAxis,
        /*
		yAxis: [{
			type: 'value',
			axisLabel: {
				rotate: 50,
				margin: 5,
				//fontSize: 10
			},
		}],
		*/

        dataZoom: setZoom(false),
    };

    //챠트표시
    viewContainer = document.getElementById('view' + index);
    view = echarts.init(viewContainer);
    view.setOption(option);

    //리사이즈 이벤트
    eventResize(view);

    //이미지 다운로드 이벤트
    chartImageDownload(view);
}

//히트맵
function viewHeatmap(val, index) {
    var seriesData = [];
    var legend = [];
    var label = [];
    var visualOption = [];

    //데이터
    var series = val.series;
    var xdata = val.xdata;
    var ydata = val.ydata;

    //범례
    series.forEach(function (data) {
        legend.push(data.name);
    });

    //레이블
    /*
	series[0].data.forEach(function(data) {
		label.push(data.name);
	});
	*/

    //시리즈
    series.forEach(function (data, i) {
        var color = valColors[i]; //randomColor();

        //레이블
        data.data.forEach(function (data) {
            label.push(data.name);
        });

        //작은값
        var min = data.data.reduce(function (previous, current) {
            return previous.value[2] < current.value[2] ? previous : current;
        });

        //큰값
        var max = data.data.reduce(function (previous, current) {
            return previous.value[2] > current.value[2] ? previous : current;
        });

        //시리즈 설정
        seriesData.push(setHeatmap(data, color));

        //비쥬얼맵 설정
        visualOption.push(setVisualMapOption([i], true, min.value[2], max.value[2], 'center', 'bottom', null, [color, '#fafafa', valColors[3]], 'left', 'horizontal'));
    });

    //비쥬얼맵 설정
    //visualOption.push(setVisualMapOption([0,1,2,3,4],true,0,1000,'center','bottom',null,['#fafafa',valColors[0]],'left','horizontal'));

    //전체 옵션 적용
    var option = {
        grid: {
            left: '3%',
            right: '5%',
            //bottom: '20%',
            containLabel: true
        },
        title: {
            //text: val.title,
            //subtext: val.subtitle,
            x: 'center',
            //top: '5%',
            //left: '2%',
        },
        legend: {
            //orient: 'vertical',
            //left: 'left',
            //top: 'center',
            top: '5%',
            //left: '2%',
            data: legend
        },
        tooltip: {},
        toolbox: setToolBoxOption(false, false, false, false, false, true, String(50 + val.subtitle.length) + '%', '1%', false),
        series: seriesData,
        visualMap: visualOption,
        xAxis: [{
            type: 'category',
            splitArea: {
                show: true
            },
            axisLabel: {
                rotate: 50,
                margin: 5,
                //fontSize: 10
            },
            //data: label.filter(function(x,i,a) { return a.indexOf(x) == i; })
            //data: Array.from(new Set(label))
            data: xdata
        }],
        yAxis: [{
            type: 'category',
            splitArea: {
                show: true
            },
            axisLabel: {
                rotate: 50,
                margin: 5,
                //fontSize: 10
            },
            data: ydata
        }],
    };

    //챠트표시
    viewContainer = document.getElementById('view' + index);
    view = echarts.init(viewContainer);
    view.setOption(option);

    //리사이즈 이벤트
    eventResize(view);

    //이미지 다운로드 이벤트
    chartImageDownload(view);
}

//레이더
function viewRadar(val, index) {
    var seriesData = [];
    var legend = [];
    var label = [];
    var label1 = [];
    var labelVal = [];
    var visualOption = [];

    //데이터
    var series = val.series;

    //범례
    series.forEach(function (data) {
        legend.push(data.name);
    });

    //레이블
    /*
	label = series[0].data.map(function (item) {
		return {text: item.name};
	});
	*/

    //시리즈
    series.forEach(function (data, i) {
        var color = valColors[i]; //randomColor();

        //작은값
        var min = data.data.reduce(function (previous, current) {
            return previous.value < current.value ? previous : current;
        });
        //큰값
        var max = data.data.reduce(function (previous, current) {
            return previous.value > current.value ? previous : current;
        });

        labelVal.push({min: min.value, max: max.value});

        //레이블
        label1 = data.data.map(function (item) {
            return {name: item.name};
        });

        //시리즈 설정
        seriesData.push(setRadar(data, color));

        //비쥬얼맵 설정
        visualOption.push(setVisualMapOption([i], false, min.value, max.value, 'right', 'bottom', null, color));
    });

    //시리즈 통합값 설정
    //작은값
    var min = labelVal.reduce(function (previous, current) {
        return previous.min < current.min ? previous : current;
    });
    //큰값
    var max = labelVal.reduce(function (previous, current) {
        return previous.max > current.max ? previous : current;
    });

    //시리즈 통합 최소/최대 설정
    label = label1.map(function (item) {
        return {name: item.name, min: 0, max: max.max};
    });


    //전체 옵션 적용
    var option = {
        grid: {
            left: '3%',
            right: '5%',
            //bottom: '20%',
            containLabel: true
        },
        title: {
            //text: val.title,
            //subtext: val.subtitle,
            x: 'center',
            //top: '5%',
            //left: '2%',
        },
        legend: {
            //orient: 'vertical',
            //left: 'left',
            //top: 'center',
            top: '5%',
            //left: '2%',
            data: legend
        },
        tooltip: {},
        toolbox: setToolBoxOption(false, false, false, false, false, true, String(50 + val.subtitle.length) + '%', '1%', false),
        series: seriesData,
        visualMap: visualOption,
        radar: {
            center: ['50%', '50%'],
            radius: '55%',
            startAngle: 120,
            shape: 'circle',
            /*
            name: {
				textStyle: {
					color: '#fff',
					backgroundColor: '#999',
	                borderRadius: 3,
	                padding: [3, 5]
	            }
	        },
	        */
            indicator: label.filter(function (x, i, a) {
                return a.indexOf(x) == i;
            })
            //indicator: Array.from(new Set(label))
        }
    };

    //console.log(option.radar.indicator);

    //챠트표시
    viewContainer = document.getElementById('view' + index);
    view = echarts.init(viewContainer);
    view.setOption(option);

    //리사이즈 이벤트
    eventResize(view);

    //이미지 다운로드 이벤트
    chartImageDownload(view);
}

//트리맵
function viewTreemap(val, index) {
    var seriesData = [];
    var legend = [];
    var label = [];
    var visualOption = [];

    //데이터
    var series = val.series;

    //범례
    /*
	series.forEach(function(data) {
		legend.push(data.name);
	});
	*/

    //레이블
    /*
	series[0].data.forEach(function(data) {
		label.push(data.name);
	});
	*/

    //시리즈
    series.forEach(function (data, i) {
        var color = valColors[i]; //randomColor();

        //레이블
        data.data.forEach(function (data) {
            label.push(data.name);
        });

        //작은값
        var min = data.data.reduce(function (previous, current) {
            return previous.value < current.value ? previous : current;
        });
        //큰값
        var max = data.data.reduce(function (previous, current) {
            return previous.value > current.value ? previous : current;
        });

        //시리즈 설정
        seriesData.push(setTreeMap(data, color, max.value));

        //비쥬얼맵 설정
        visualOption.push(setVisualMapOption([i], false, min.value, max.value, 'right', 'bottom', null, ['#eee', color]));
    });

    //전체 옵션 적용
    var option = {
        grid: {
            left: '3%',
            right: '5%',
            //bottom: '20%',
            containLabel: true
        },
        title: {
            //text: val.title,
            //subtext: val.subtitle,
            x: 'center',
            //top: '5%',
            //left: '2%',
        },
        /*
		legend: {
			//orient: 'vertical',
			//left: 'left',
			//top: 'center',
			top: '10%',
			//left: '2%',
			data: legend
		},
		*/
        tooltip: {},
        toolbox: setToolBoxOption(false, false, false, false, false, true, String(50 + val.subtitle.length) + '%', '1%', false),
        series: seriesData,
        visualMap: visualOption
    };

    //챠트표시
    viewContainer = document.getElementById('view' + index);
    view = echarts.init(viewContainer);
    view.setOption(option);

    //리사이즈 이벤트
    eventResize(view);

    //이미지 다운로드 이벤트
    chartImageDownload(view);
}

//워드클라우드
function viewWordcloud(val, index) {
    var seriesData = [];
    var legend = [];
    var label = [];
    var value = [];
    var visualOption = [];

    var maskImage = new Image();
    maskImage.src = '/assets/images/word.png';

    //데이터
    var series = val.series;

    //시리즈
    series.forEach(function (data, i) {
        //var color = valColors[i]; //randomColor();
        var color = ['#5571C3', '#93CC79', '#F9C761', '#EC6468'];
        //작은값
        var min = data.data.reduce(function (previous, current) {
            return previous.value < current.value ? previous : current;
        });
        //큰값
        var max = data.data.reduce(function (previous, current) {
            return previous.value > current.value ? previous : current;
        });

        //시리즈 설정
        seriesData.push(setWordCloud(data));

        //비쥬얼맵 설정
        //visualOption.push(setVisualMapOption([i],false,min.value,max.value,'right','bottom',null,color));

        visualOption.push(setVisualMapOption([i], true, min.value, max.value, 'left', 'bottom', null, color));
    });

    //전체 옵션 적용
    var option = {
        grid: {
            left: '3%',
            right: '5%',
            //bottom: '20%',
            containLabel: true
        },
        title: {
            //text: val.title,
            //subtext: val.subtitle,
            x: 'center',
            //top: '5%',
            //left: '2%',
        },
        tooltip: {},
        toolbox: setToolBoxOption(false, false, false, false, false, true, String(50 + val.subtitle.length) + '%', '1%', false),
        visualMap: visualOption,
        series: seriesData,
    };


    //챠트표시
    viewContainer = document.getElementById('view' + index);
    view = echarts.init(viewContainer);
    view.setOption(option);

    /*
	maskImage.onload = function () {
		//console.log(maskImage.src);
        option.series[0].maskImage;
        view.setOption(option);
    }
	*/

    //리사이즈 이벤트
    eventResize(view);

    //이미지 다운로드 이벤트
    chartImageDownload(view);
}

//지역별
function viewMap(map, val, index) {
    var seriesData = [];
    var legend = [];
    var visualOption = [];
    var isClick = "Y";

    //데이터
    var series = val.series;

    //범례
    series.forEach(function (data) {
        legend.push(data.name);
    });

    //시리즈
    series.forEach(function (data, i) {
        var ser;

        //시리즈 설정
        switch (data.chart) {
            case 'bar':
                //var ser = setBar(data, color);
                break;
            case 'barld':
                break;
            case 'line':
                //var ser = setLine(data, color);
                break;
            case 'pie':
                //var ser = setPie(data, color);
                break;
            case 'piedn':
                break;
            case 'map':
                //작은값
                var min = data.data.reduce(function (previous, current) {
                    return previous.value < current.value ? previous : current;
                });
                //큰값
                var max = data.data.reduce(function (previous, current) {
                    return previous.value > current.value ? previous : current;
                });
                //클릭여부
                isClick = data.isclick;
                //시리즈 설정
                seriesData.push(setMap(data));
                //비쥬얼맵 설정
                visualOption.push(setVisualMapOption([i], true, min.value, max.value, 'left', 'bottom', null, null));
                break;
            case 'wordcloud':
                break;
            case 'heatmap':
                break;
            case 'scatter':
                var color = valColors[i]; //randomColor();
                //작은값
                var min = data.data.reduce(function (previous, current) {
                    return previous.value[2] < current.value[2] ? previous : current;
                });
                //큰값
                var max = data.data.reduce(function (previous, current) {
                    return previous.value[2] > current.value[2] ? previous : current;
                });
                //시리즈 설정
                seriesData.push(setMapScatter(data, color, max.value[2]));
                //비쥬얼맵 설정
                visualOption.push(setVisualMapOption([i], true, min.value[2], max.value[2], 'right', 'bottom', null, ['#FAFAFA', color]));
                break;
            case 'radar':
                break;
            case 'treemap':
                break;
            case 'barstack':
                //var ser = setBar(data, color);
                //스택여부
                //ser.stack = "STK";
                break;
            case 'barldstack':
                break;
            case 'linesmooth':
                break;
            case 'area':
                //var ser = setLine(data, color);
                //스타일
                //ser.areaStyle = {};
                break;
            case 'areastack':
                break;
        }
    });

    //전체 옵션 적용
    var option = {
        //backgroundColor: '#FFFFFF',
        title: {
            //text: val.title,
            //subtext: val.subtitle,
            x: 'center',
        },
        legend: {
            top: '5%',
            orient: 'vertical',
            left: 'left',
            data: legend,
        },
        //toolbox: setToolBoxOption(true, false, false, false, false, false, String(50 + val.subtitle.length) + '%', '1%', true),
        //toolbox: setToolBoxOption(true, false, false, false, false, false, '50%', '1%', true),
        tooltip: {},
        series: seriesData,
        visualMap: visualOption,
        geo: {
            map: 'baseMap',
            name: 'geo',
            roam: true,
            zoom: 1.2,
            scaleLimit: {
                min: 0.7,
                max: 5,
            },
            label: {
                normal: {
                    show: true,
                    textStyle: {
                        color: '#756e6f',
                        fontSize: 12,
                        fontWeight: 'bold',
                    }
                },
                /*
				emphasis: {
					show: false,
					textStyle: {
						color: '#222',
						fontSize: 14,
					}
				}
				*/
            },
            itemStyle: {
                normal: {
                    borderWidth: 0.3,
                    borderColor: '#E9E9E9', //'#FFFFFF',
                    areaColor: '#EEEEEE',
                },
                emphasis: {
                    color: '#dbd9d9',
                    areaColor: null,
                    shadowOffsetX: 0,
                    shadowOffsetY: 0,
                    shadowBlur: 0,
                    borderWidth: 0,
                    shadowColor: 'rgba(0, 0, 0, 1)'
                }

                /*
				emphasis:{
					areaColor: new echarts.graphic.LinearGradient(0, 1, 0, 0, [{
                        offset: 0,
                        color: '#4A96EF'
                    }, {
                        offset: 1,
                        color: '#A4EAA1'
                    }]),
				}
				*/
            }
        }
    };

    //데이터 표시
    viewContainer = document.getElementById('view' + index);
    //resizeMapContainer(viewContainer);

    //지도데이터 설정
    echarts.registerMap('baseMap', map);
    view = echarts.init(viewContainer);
    view.setOption(option);

    eventResize(view);

    //이미지 다운로드 이벤트
    chartImageDownload(view);

    /*
	//리사이즈 이벤트
	$(window).on('resize',function(){
		resizeMapContainer(viewContainer);
		view.resize();
	});
	*/

    //이벤트
    /*
	if (isClick=="Y") {
		view.on('click', function (param) {
    		switch(param.seriesType) {
    		case 'map':
    			if (param.data.code.length < 6) {
    				window.location = "/cvz/map/" + param.data.code + "?data=" + getUrlKey('data') + "&chart=" + getUrlKey('chart');
    			}
    			break;
    		}
    	});
	}
	*/
}

//echart end ------------------