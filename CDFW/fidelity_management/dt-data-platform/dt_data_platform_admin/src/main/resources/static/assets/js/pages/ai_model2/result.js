$(document).ready(function(){
	var params = { "modelSeq":9999 }
	var loss = getLoss(params);			
	var fid = getFID(params);
	
	var data_params = { "modelSeq":9999, "count":100 }
	var testData = getTestData(data_params); 
	
	//console.log(loss);
	//console.log(fid);
	console.log(testData);
	
	changeSelection=function() {
		var optionVal = $("#select_epoch option:selected").val();
	    
	    $("#real_img").attr("src", optionVal);
	    $("#fake_img").attr("src", optionVal.replace('real', 'fake'));
	}
	
	changeDataSelection=function() {
		var optionVal = $("#select_data option:selected").val();
		data_params = { "modelSeq":9999, "count":optionVal }
		testData = getTestData(data_params); 
		
		console.log(data_params);
		console.log(testData);
		
		viewTypeDefault(chart_type, testData, 2, true, false, isTool=true);
		getDataView(testData["data_test"], testData["data_test_header"], "data_test");	
		getDataView(testData["data_pred"], testData["data_pred_header"], "data_pred");
	}
	
	chart_type = 'line';
	viewTypeDefault(chart_type, testData, 2, true, false, isTool=true);
	viewTypeDefault(chart_type, loss, 0, false, false);			
	viewTypeDefault(chart_type, fid, 1, false, false);
	
	getDataView(testData["data_test"], testData["data_test_header"], "data_test");	
	getDataView(testData["data_pred"], testData["data_pred_header"], "data_pred");
}); 	
 
//loss 
function getLoss(params) {
	var result;
	
	$.ajax({
		type: "POST",
		async: false,
		url: "/ai/model/loss",						
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify(params),
		success: function(data){
			//console.log(data);
			if(data != null){					
				//console.log(data.cultureart);
				result = data.loss;
			}else{					
			}
		},
		error: function (e) {
			console.log(e);
        }
	});	 					
	
	return result;
}

//fid 
function getFID(params) {
	var result;
	
	$.ajax({
		type: "POST",
		async: false,
		url: "/ai/model/fid",						
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify(params),
		success: function(data){
			//console.log(data);
			if(data != null){					
				//console.log(data.cultureart);
				result = data.fid;
			}else{					
			}
		},
		error: function (e) {
			console.log(e);
        }
	});	 					
	
	return result;
}

//테스트데이터
function getTestData(params) {
	var result;
	
	$.ajax({
		type: "POST",
		async: false,
		url: "/ai/model/testdata",						
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify(params),
		success: function(data){
			//console.log(data);
			if(data != null){					
				//console.log(data.cultureart);
				result = data.test;
			}else{					
			}
		},
		error: function (e) {
			console.log(e);
        }
	});	 					
	
	return result;
}

//
function getDataView(data, data_header, divID) {
	var strHTML = '';
	strHTML += '';
	strHTML += '<div class="table-responsive">';
	strHTML += '<table id="' + divID + '_table" class="table table-hover scrolltable">';
	strHTML += '	<colgroup>';
	$.each(data_header, function(i) {
		strHTML += '		<col style="width: ' + (100/data_header.length) + '%;">';		
	});	
	strHTML += '	</colgroup>';
	strHTML += '    <thead>';
	strHTML += '        <tr>';
	strHTML += '			<td>No</td>';
	$.each(data_header, function(i) {
		strHTML += '			<td>' + data_header[i].replace(/\"/gi, "") + '</td>';
	});	
	strHTML += '        </tr>';
	strHTML += '    </thead>';
	strHTML += '    <tbody>';
	
	for (var i = 0; i < data.length; i++) {
		strHTML += '   	<tr>';
		strHTML += '           <td>' + (i+1) + '</td>';
		
		var obj = data[i];
		$.each(data_header, function(j) {					
			for (var key in obj) {
				var value = obj[key];
				if (data_header[j] == key) {
					strHTML += '           <td>' + value.replace(/\"/gi, "") + '</td>';
				}
				//console.log(key + ': ' + value);
			}
		});			
		strHTML += '    </tr>';
	}
	
	strHTML += '   </tbody>';
	strHTML += '</table>';
	strHTML += '</div>'; 
	
	$('#'+divID).html(strHTML);
	 
	//console.log(strHTML);
}
