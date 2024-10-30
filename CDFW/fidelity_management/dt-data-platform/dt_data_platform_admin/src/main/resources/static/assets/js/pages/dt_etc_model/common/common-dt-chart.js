'use strict'

$(document).ready(function() {
});

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
    for(let i of array){
    	var v = {
    		"name": i,
    		"value": jsonItem[itemName][i]
    	}
    	histogramData.push(v);
    }
    //console.log(histogramData);
    
    histogramChart.series[0].data = histogramData;    
    viewTypeDefault("bar", histogramChart, 5, false, false);
} 