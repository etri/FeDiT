//echart option start --------------------

//visualMap Option
//setVisualMapOption([0],true,min,max,'left','bottom','blue',['blue'])
function setVisualMapOption(seriesIndex, isShow, min, max, left, top, textColor, rangeColor, align, orient) {
	seriesIndex = typeof seriesIndex !== 'undefined' ? seriesIndex : [];
	isShow = typeof isShow !== 'undefined' ? isShow : true;
	min = typeof min !== 'undefined' ? min : 0;
	max = typeof max !== 'undefined' ? max : 100;
	left = typeof left !== 'undefined' ? left : 'left';
	top = typeof top !== 'undefined' ? top : 'bottom';
	align = typeof align !== 'undefined' ? align : 'auto';
	orient = typeof orient !== 'undefined' ? orient : 'vertical';
		
	//
	var textStyle;
	if (typeof textColor !== 'undefined' && textColor !== '' && textColor !== null) {
		textStyle = {
			color: textColor
		};  		
	} else {
		textStyle = {
		};  
	}
	
	//
	if (typeof rangeColor !== 'undefined' && rangeColor !== '' && rangeColor !== null) {
		rangeColor = {    			    
			color: rangeColor
		};
	} else {
		rangeColor = null;
	}
	
	//
	var visualMap =  {
		show: isShow,
		min: min,
		max: max,
		left: left,
		top: top,
		text: ['높음','낮음'],
		textStyle: textStyle,
		align: align,
		seriesIndex: seriesIndex,		
		inRange: rangeColor,		
		calculable: true,
		orient: orient
	};    
	
	return visualMap;	
}

//dataRange Option
//setDataRangeOption(true,min,max,'left','bottom','blue',['blue'])
function setDataRangeOption(isShow, min, max, left, top, textColor, rangeColor) {	
	isShow = typeof isShow !== 'undefined' ? isShow : true;
	min = typeof min !== 'undefined' ? min : 0;
	max = typeof max !== 'undefined' ? max : 100;
	left = typeof left !== 'undefined' ? left : 'left';
	top = typeof top !== 'undefined' ? top : 'bottom';
	
	//
	var textStyle;
	if (typeof textColor !== 'undefined' && textColor !== '' && textColor !== null) {
		textStyle = {
			color: textColor
		};  		
	} else {
		textStyle = {
		};  
	}
	
	//
	if (typeof rangeColor !== 'undefined' && rangeColor !== '' && rangeColor !== null) {
		rangeColor = rangeColor;
	} else {
		rangeColor = null;
	}
	
	var dataRange = {
		show: isShow,
		min: min,
		max: max,
		left: left,
		top: top,
		text: ['높음', '낮음'],
		realtime: false,
		precision: 1,
		padding: 10,
		calculable: true,			
		textStyle: textStyle,
		color: rangeColor		
	};
	
	return dataRange; 
}

//toolBox Option
//setToolBoxOption(true, false, false, false, true, true),
function setToolBoxOption(isShow, isData, isZoom, isMagic, isRestore, isSave, x, y, isHistory) {
	isShow = typeof isShow !== 'undefined' ? isShow : true;	
	isData = typeof isData !== 'undefined' ? isData : false;
	isZoom = typeof isZoom !== 'undefined' ? isZoom : false;
	isMagic = typeof isMagic !== 'undefined' ? isMagic : false;
	isRestore = typeof isRestore !== 'undefined' ? isRestore : false;
	isSave = typeof isSave !== 'undefined' ? isSave : false;
	x = typeof x !== 'undefined' ? x : 'right';
	y = typeof y !== 'undefined' ? y : 'top';
	isHistory = typeof isHistory !== 'undefined' ? isHistory : true;
	
	var toolBox = {
		show: isShow,
		orient: 'horizontal', //horizontal, vertical		
		x: x,
		y: y,
		//itemSize: 20,
		feature: {				
			dataView: {
				show: isData,
				readOnly: false,
				title: '데이터 보기',
				lang: ['보기', '종료', '새로고침']
			},			
			dataZoom: {
				show: isZoom,
				title: {
					zoom: '확대',
					back: '취소'
				}
			},			
			magicType: {
				show: isMagic,
				title: {
					line: 'line',
					bar: 'bar',
					stack: 'statck',
					tiled: 'tiled',
					force: 'force',
					chord: 'chord',
					pie: 'pie',
					funnel: 'funnel'
				},				
				type: ['line','bar','statck','tiled','force','chord','pie','funnel']
			},			
			restore: {
				show: isRestore,
				title: '새로고침'
			},						
			myBack: {
				show: isHistory,
                title: '이전',
                icon: 'path://M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z',
                onclick: function (){
                    history.go(-1)
                }
			},
			myNext: {
				show: isHistory,
                title: '다음',
                icon: 'path://M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
                onclick: function (){
                    history.go(+1)                	
                }
			},
			saveAsImage: {
				show: isSave,
				type: 'png',
				title: '이미지 저장',
				lang: ['저장']
			},
		}
	};
	
	return toolBox;
}

//Tooltip Option
function setToolTipOption() {
	//툴팁옵션
	var toolTip = {
		trigger: 'item',
		showDelay: 0,
		transitionDuration: 0.2,		
		formatter: function (params) {
			var lines = ["<b>" + params.seriesName + "</b>"];
			
			switch(params.seriesType) {
			case "map":
				lines.push(formatTooltipLine("red", params.name));
				lines.push(formatTooltipLine("orange", numberWithCommas(params.value) + " 명"));
				if (params.data != null) {
					if (params.data.count != null) {
						lines.push(formatTooltipLine("blue", "가맹점 " + numberWithCommas(params.data.count) + " 개"));
					}				
				}				
				break;
			case "scatter":
				lines.push(formatTooltipLine("red", params.name));
				lines.push(formatTooltipLine("orange", numberWithCommas(params.value[2]) + " 명"));
				break;
			case "bar":
				break;
			}			
			return lines.join("<br>");			
		}
	};
	
	return toolTip;
}

//툴팁 라인 포멧
var formatTooltipLine = function(color, value){
    return "<span style='display:inline-block;width:10px;height:10px;border-radius:50%;background-color:"+color+";margin-right:5px;'></span><span>"+ value + "</span>"
}

//geoJson Map 옵션    	
var geoMapOption = {
	map: 'baseMap',
	name: 'geo',
	zoom: 1,
	scaleLimit: {
		min: 0.7,
		max: 5,
	},
	roam: true,			
	label: {
		normal: {
			show: true, 
			textStyle: {
				color: 'rgba(0,0,0,0.3)'
			}
		},
		emphasis:{
			color: 'red',				
		}
	},
	itemStyle: {
		normal:{
			borderColor: 'rgba(9, 9, 9, 0.2)',
			borderWidth: 0.5	
		},
		emphasis:{
			color: null,
			areaColor: null,
			shadowOffsetX: 0,
			shadowOffsetY: 0,
			shadowBlur: 20,
			borderWidth: 0,
			shadowColor: 'rgba(0, 0, 0, 0.5)'			
		}
	}
};

//로딩표시
function isShowLoading(chart, option, isShow) {
	if (isShow) {
		chart.showLoading({
			text: 'loading',    		
			color: '#c23531',
			textColor: '#000',
			maskColor: 'rgba(255, 255, 255, 0.5)',
			zlevel: 0,    		 
		});;
		/*
		setTimeout(() => {
			chart.hideLoading();
			chart.setOption(option);
		}, 1000);
		*/	
	} else {
		chart.hideLoading();
	}
}

//yAxis (y축 설정)
function setyAxis(key, name, type, pos, offset, color, isLine, label) {
	var y = {
		key: key,
		name: name,
	  	type: type,
	  	position: pos,
	  	offset: offset,
	  	axisLabel: {
	  		//fontSize: 11,	  		
	  		rotate: 20,
	  		//formatter: function (value, index) {    			
	  	    //	return kFormatter(value);
	  		//},	      
	    },
	    
	    axisLine: {
	  		lineStyle: {
				color: color
			}
		},
		
	  	splitLine: {
			show: isLine,
			lineStyle: {
				color: color,
				type: 'dotted',	
			},			
		},
		
		data: (label == null) ? null : label.filter(function(x,i,a) { return a.indexOf(x) == i; })
	  }
	
	return y;	
}

//xAxis (x축 설정)
function setxAxis(key, name, type, pos, offset, color, isLine, label) {
	var x = {
		key: key,
		//name: name,
		type: type,		
	  	position: pos,
	  	offset: offset,
	  	axisLabel: {
	  		//fontSize: 11,
	  		rotate: 20,	  		
	  		//formatter: function (value, index) {    			
	  	    //	return kFormatter(value);
	  		//},	      
	    },	    
	  	/*
	    axisLine: {
	  		lineStyle: {
	  			color: color
	  		}
      	},	
      	*/
	    splitLine: {
			show: isLine,
			/*
			lineStyle: {
				type: 'dotted',	
			},
			*/
		},
		data:  (label == null) ? null : label.filter(function(x,i,a) { return a.indexOf(x) == i; }) 
	}
	
	return x;	
}

//zoom (x,y 줌 설정)
function setZoom(isShow, isX, isY) {	
	isShow = typeof isShow !== 'undefined' ? isShow : false;
	isX = typeof isX !== 'undefined' ? isX : isShow;
	isY = typeof isY !== 'undefined' ? isY : isShow;
	
	if (!isShow) return null;
	
	var zoom = [
		{
			show: isX,
			start: 0,
			end: 100
		},
		{
			type: 'inside', //'slider',
			start: 0,
			end: 100
		},
		{
			show: isY,
			yAxisIndex: 0,
			filterMode: 'empty',
			width: 30,
			height: '70%',
			showDataShadow: true,
			left: '93%'
		}
	]
	
	return zoom;
}
//echart option end ------------------


//echart series start ------------------ 
//바 시리즈
function setBar(data, color, isComma) {
	isComma = typeof isComma !== 'undefined' ? isComma : true;
	var series = {
		name: data.name,
		type: 'bar',
		tooltip: {
			trigger: 'item',			
			formatter: function (params) {
				var lines = ["<b>" + params.seriesName + "</b>"];
				if (isComma) {
					lines.push(formatTooltipLine(params.color, params.name) + " : " + numberWithCommas(params.value) + data.unit);
				} else {
					lines.push(formatTooltipLine(params.color, params.name) + " : " + params.value + data.unit);
				}							
				return lines.join("<br>");    				
			},
		},
		symbolSize: 10,
		smooth: false,	 
		label : {
			show: false,
			position: 'top',
			color: '#999',
			formatter: function(params) {				
				return numberWithCommas(params.value) + data.unit;
			},
			rotate: 60,			   
		},
		itemStyle: {
	    	color: color			
		},
		data: data.data
	}
	
	return series;	
}

//라인 시리즈
function setLine(data, color, isComma) {
	isComma = typeof isComma !== 'undefined' ? isComma : true;
	var series = {
		name: data.name,
		type: 'line',
		tooltip: {
			trigger: 'item',    			
			formatter: function (params) {
				var lines = ["<b>" + params.seriesName + "</b>"];
				if (isComma) {
					lines.push(formatTooltipLine(params.color, params.name) + " : " + numberWithCommas(params.value) + data.unit);
				} else {
					lines.push(formatTooltipLine(params.color, params.name) + " : " + params.value + data.unit);
				}				
				return lines.join("<br>");    				
			},
		},
		symbolSize: 7,
		//smooth: false,	    				
		itemStyle: {
	    	color: color			
		},
		data: data.data
	};
	
	return series;
}

//파이 시리즈
function setPie(data, color) {
	var series = {
		name: data.name,
		type: 'pie',
		clockwise: true,
		tooltip: {
			trigger: 'item',  
			//position: 'bottom',
            /*
            position: function (point, params, dom, rect, size) {
            	console.log(size);
            	
            	if (size.viewSize[0] < 500)
            		return [point[0]-(rect.width/2), point[1]+30];
            	
            	//return point + 30;
                return [point[0]+20 , point[1]+20];
            },
            */
			formatter: function (params) {    				
				var lines = ["<b>" + params.seriesName + "</b>"];
				lines.push(formatTooltipLine(params.color, params.name) + " : " + numberWithCommas(params.value) + data.unit + " (" + params.percent + "%)");
				return lines.join("<br>");    				
			},
		},
		top: '10%', 
		center: ['50%','50%'],
		selectedMode: 'single',   			
		minShowLabelAngle: '0%',		
		itemStyle: {
			color: '#fff',
			normal: {
				label: {
					color: '#000',
					formatter: function (params){
						return params.name + '(' + params.percent + '%)'
					},					
					rotate: 0,
					position: 'outer',
					alignTo: 'none', //'edge',
				},
				labelLine: {
					show: true
				}
			}	
		},
		data: data.data
	};
	
	return series;
}

//지도 스케터 시리즈
function setMapScatter(data, color, max) {
	var series = {
		name: data.name,
		type: 'scatter',
		coordinateSystem: 'geo',
		data: data.data,
		tooltip: {
			trigger: 'item',
			showDelay: 0,
			transitionDuration: 0.2,
			formatter: function (params) {
				var lines = ["<b>" + params.seriesName + "</b>"];
				lines.push(formatTooltipLine(params.color, params.name) + " : " + numberWithCommas(params.value[2]) + data.unit);
				return lines.join("<br>");        				
			}
		},
		symbolSize: function (val) {	
			val = (val[2] / max) * 50;
			return val < 10 ? 10 : val;							
		},
		itemStyle: {
			color: color
		},
		label: {
			normal: {
				formatter: '{b}',
				position: 'right',
				show: false
			},
			emphasis: {
				show: true,
				textStyle: {
					color:'black'
				},  
			}
		},				
	};
	
	return series;
}

//지도 시리즈
function setMap(data) {
	var series = {
		name: data.name,
		type: 'map',
		roam: true,
		mapType: 'korea',
		geoIndex: 0,
		//zLevel: index,
		//z: index,
		tooltip: {
			trigger: 'item',
			showDelay: 0,
			transitionDuration: 0.2,
			formatter: function (params) {
				var lines = ["<b>" + params.seriesName + "</b>"];				
				lines.push(formatTooltipLine(params.color, params.name + " : " + numberWithCommas(parseInt(params.value) ? params.value : 0) + data.unit));
				
				var ddata = params.data;				
				if (typeof ddata !=='undefined') {
					//console.log(ddata.dname1);
					if (typeof ddata.dname1 !=='undefined') {
						lines.push(formatTooltipLine('yellow', ddata.dname1 + " : " + numberWithCommas(parseInt(ddata.dvalue1) ? ddata.dvalue1 : 0) + data.unit));
					}
					
					if (typeof ddata.dname2 !=='undefined') {
						lines.push(formatTooltipLine('green', ddata.dname2 + " : " + numberWithCommas(parseInt(ddata.dvalue2) ? ddata.dvalue2 : 0) + data.unit));
					}
					
					if (typeof ddata.dname3 !=='undefined') {
						lines.push(formatTooltipLine('blue', ddata.dname3 + " : " + numberWithCommas(parseInt(ddata.dvalue3) ? ddata.dvalue3 : 0) + data.unit));
					}
				}
				return lines.join("<br>");        				
			}
		},
		itemStyle: {
			normal: {
				label: {show: true},
				//borderColor: 'rgba(0, 0, 0, 0.2)',
				borderWidth: 0.25,
				borderColor: '#FFFFFF'
			},
			emphasis: {
				//label: {show: true},
				borderWidth: 0,
				shadowBlur: 10,
				shadowColor: 'rgba(0, 0, 0, 0.5)'
			}
		},			
		data: data.data  							
	};	
	
	return series;
}

//스케터 시리즈
function setScatter(data, color, max) {	
	var itemStyle = {
		color: color,
	    opacity: 0.8,
	    shadowBlur: 0,
	    shadowOffsetX: 0,
	    shadowOffsetY: 0,
	    shadowColor: 'rgba(0, 0, 0, 0.3)'	    
	};
	
	var series = {
		name: data.name,
		type: 'scatter',		
		tooltip: {
			trigger: 'item',
			showDelay: 0,
			transitionDuration: 0.2,
			formatter: function (params) {								
				var lines = ["<b>" + params.seriesName + "</b>"];
				lines.push(formatTooltipLine(params.color, params.name) + " : " + numberWithCommas(params.value) + data.unit);
				return lines.join("<br>");        				
			}
		},
		symbolSize: 10,
		/*
		symbolSize: function (val) {				
			val = (val / max) * 50;			
			return val < 10 ? 10 : val;							
		},
		*/		
		label: {
			normal: {
				formatter: '{b}',
				position: 'right',
				show: false
			},
			emphasis: {
				show: true,
				textStyle: {
					color:'black'
				},  
			}
		},
		itemStyle: itemStyle,
		data: data.data
	};
	
	return series;
}

//히트맵 시리즈
function setHeatmap(data, color) {
	var data1 = data.data.map(function (item) {
		return [item.value[0], item.value[1], item.value[2]];
	});
	
	var series = {
		name: data.name,
		type: 'heatmap',		
		tooltip: {
			trigger: 'item',
			showDelay: 0,
			transitionDuration: 0.2,
			formatter: function (params) {	
				var lines = ["<b>" + params.seriesName + "</b>"];
				lines.push(formatTooltipLine(params.color, params.name) + " : " + numberWithCommas(params.value[2]) + data.unit);
				return lines.join("<br>");        				
			}
		},
		label: {
	        show: true,
	        textStyle: {
				color: 'rgba(0, 0, 0, 0.5)'
			},  
	    },
	    itemStyle: {
	    	color: color			
		},		
	    emphasis: {
	        itemStyle: {
	            shadowBlur: 10,
	            shadowColor: 'rgba(0, 0, 0, 0.5)'
	        }
	    },
	  //data: [['강원도',500, 500]],	
		data: data1,
	};
	
	return series;
}

//워드클라우드 시리즈
function setWordCloud(data) {
	var series = {
		name: data.name,
		type: 'wordCloud',
        gridSize: 8,
        sizeRange: [12, 50],
        rotationRange: [-90, 90],
        //rotationStep : 45,
        shape: 'circle', //'pentagon',
        //maskImage: maskImage,
        left: 'center',
        top: 'center',
        width: '80%',
        height: '80%',
        right: null,
        bottom: null,	                        
        drawOutOfBound: false,
        layoutAnimation: true,
        tooltip: {
			trigger: 'item',    			
			formatter: function (params) {    				
				var lines = ["<b>" + params.seriesName + "</b>"];
				lines.push(formatTooltipLine(params.color, params.name) + " : " + numberWithCommas(params.value) + data.unit);
				return lines.join("<br>");    				
			},
		},
		textStyle: {
            //fontFamily: 'sans-serif',
            //fontWeight: 'bold',
            color: function () {
                return 'rgb(' + [
                    Math.round(Math.random() * 160),
                    Math.round(Math.random() * 160),
                    Math.round(Math.random() * 160)
                ].join(',') + ')';
            },          
        },
        emphasis: {
            focus: 'self',
            textStyle: {
                shadowBlur: 10,
                shadowColor: '#333'
            }
        },
        /*
		textStyle: {
            normal: {
                color: function () {
                    return 'rgb(' + [
                        Math.round(Math.random() * 160),
                        Math.round(Math.random() * 160),
                        Math.round(Math.random() * 160)
                    ].join(',') + ')';
                }
            },
            emphasis: {
                shadowBlur: 10,
                shadowColor: '#333'
            }
        },
        */  
        data: data.data, 			
	};
	
	return series;
}

//레이더 시리즈
function setRadar(data, color) {
	var value = [];
	
	data.data.forEach(function(data) {
		value.push(data.value);					
	});	
	
	var series = {
		name: data.name,
		type: 'radar',
		itemStyle: {
	    	color: color			
		},
		/*
		areaStyle: {
            color: 'rgba(255, 255, 255, 0.5)'
        },
        */
		data:[{
			value: value,
			name: data.name
		}]
	};
	
	return series;
}

//트리맵 시리즈
function setTreeMap(data, color) {
	var series = {
		name: data.name,
		type: 'treemap',
		tooltip: {
			trigger: 'item',    			
			formatter: function (params) {    				
				var lines = ["<b>" + params.seriesName + "</b>"];
				lines.push(formatTooltipLine(params.color, params.name) + " : " + numberWithCommas(params.value) + data.unit);
				return lines.join("<br>");    				
			},
		},
		itemStyle: {
	    	color: color			
		},		
		data:data.data
	};
	
	return series;
}
//echart series end ------------------


//기본 함수 start ------------------
//값 설정 천명당 k
function kFormatter(num) {
	return Math.abs(num) > 999 ? Math.sign(num)*((Math.abs(num)/1000).toFixed(1)) + 'k' : Math.sign(num)*Math.abs(num)
}

//3자리 콤마
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

//지도UI 리사이즈
function resizeMapContainer(mapContainer) {
	//mapContainer.style.width = window.innerWidth*0.82+'px';
	//mapContainer.style.height = window.innerHeight*0.83+'px';
	mapContainer.style.width = window.innerWidth - 20 +'px';
	mapContainer.style.height = window.innerHeight - 20 + 'px';
}

//리사이즈 이벤트
function eventResize(view) {
	$(window).on('resize',function(){    		    		
		view.resize();
	}); 
}
 
//url 키값 가져오기
function getUrlKey(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

//랜덤 색상
function randomColor() {
	return "#"+(((1+Math.random())*(1<<24)|0).toString(16)).substr(-6);
}

//챠트 이미지 다운로드
function chartImageDownload(view) {
	$("#img_download").click(function(){
		if (browser == 'Mozilla') {
			var imageSrc = view.getDataURL({backgroundColor: '#fff'});
        	var imgData = atob(imageSrc.split(',')[1]);
        	
        	var len = imgData.length;
        	var buf = new ArrayBuffer(len); // 비트를 담을 버퍼를 만든다.
        	var bufView = new Uint8Array(buf);
        	var blob, i;
        	
        	for (i = 0; i < len; i++) {
        		bufView[i] = imgData.charCodeAt(i) & 0xff; // 비트 마스킹을 통해 msb를 보호한다.
          	}    	
        	
        	// Blob 객체를 image/png 타입으로 생성한다. (application/octet-stream도 가능)
        	blob = new Blob([bufView], { type: 'image/png' });
        	
        	navigator.msSaveBlob(blob, 'download.png');
    	} else {
    		/* 이미지 다운로드 테스트
    		var img = new Image();
    		var width = view.getWidth();
    		var height = view.getHeight();
    		var option = view.getOption();
    		var yAxis = option.yAxis;
    		
    		option.yAxis = [{show: false, offset:0},{show: false, offset:0},{show: false, offset:0},{show: false, offset:0}];
    		
    		view.setOption(option);
    		view.resize({width: 630, height: 600});
    		console.log(option.yAxis);
        	*/
    		
    		var img = new Image();
        	img.src = view.getDataURL({pixelRatio: 2, backgroundColor: '#fff'});
        	
        	/* 이미지 다운로드 테스트
        	option.yAxis = [{show: true},{show: true},{show: true},{show: true}];        	
        	view.setOption(option);
        	view.resize({width: width, height: height});
        	console.log(option.yAxis);
        	*/
        	
        	
        	this.download = "download.png";
        	//this.href = view.getDataURL({backgroundColor: '#fff'});
        	this.href = img.src;
        	
    	}
	
    }) 
}

function isBrowserCheck(){ 
	const agt = navigator.userAgent.toLowerCase(); 
	if (agt.indexOf("chrome") != -1) return 'Chrome'; 
	if (agt.indexOf("opera") != -1) return 'Opera'; 
	if (agt.indexOf("staroffice") != -1) return 'Star Office'; 
	if (agt.indexOf("webtv") != -1) return 'WebTV'; 
	if (agt.indexOf("beonex") != -1) return 'Beonex'; 
	if (agt.indexOf("chimera") != -1) return 'Chimera'; 
	if (agt.indexOf("netpositive") != -1) return 'NetPositive'; 
	if (agt.indexOf("phoenix") != -1) return 'Phoenix'; 
	if (agt.indexOf("firefox") != -1) return 'Firefox'; 
	if (agt.indexOf("safari") != -1) return 'Safari'; 
	if (agt.indexOf("skipstone") != -1) return 'SkipStone'; 
	if (agt.indexOf("netscape") != -1) return 'Netscape'; 
	if (agt.indexOf("mozilla/5.0") != -1) return 'Mozilla'; 
	if (agt.indexOf("msie") != -1) { 
    	let rv = -1; 
		if (navigator.appName == 'Microsoft Internet Explorer') { 
			let ua = navigator.userAgent; var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})"); 
		if (re.exec(ua) != null) 
			rv = parseFloat(RegExp.$1); 
		} 
		return 'Internet Explorer '+rv; 
	} 
}

const browser = isBrowserCheck();
//기본 함수 end ------------------