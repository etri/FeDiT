function viewModel(filePath, model_seq){
	var indexTrgtCol = $('#indexTrgtCol').val();
	
	var data = {
			file_path: filePath,
			model_seq: model_seq,
			index_trgt_col: indexTrgtCol
    }
    $.ajax({
    	type: 'POST',
        url: '/ai/model/viewModel',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",	
        success : function(result)
		{									
            if (result.result_code == 200) {
				var strHTML = '';
				strHTML += '				<div class="col-md-12 grid-margin  stretch-card">';
				strHTML += '				<div class="card">';
				strHTML += '					<div class="card-body">';
				strHTML += '						<h6 class="card-title">미리보기로 1000개 이하만 보입니다.</h6>';
				strHTML += '';						
				strHTML += '						<div class="form-group">';
				strHTML += '							<label class="label-a">날짜컬럼선택</label>';
				strHTML += '								<select class="w-40 select-a" id="select_index_col">';
				strHTML += '									<option value="0">선택</option>';
				for (var i = 0; i < result.header_data.length; i++) {
					if (indexTrgtCol == result.header_data[i].replace(/\"/gi, "")) {
						strHTML += '<option selected value=' + result.header_data[i].replace(/\"/gi, "") + '>' + result.header_data[i].replace(/\"/gi, "") + '</option>';	
					} else {
						strHTML += '<option value=' + result.header_data[i].replace(/\"/gi, "") + '>' + result.header_data[i].replace(/\"/gi, "") + '</option>';
					}
						
				}	
				strHTML += '								</select>';
				strHTML += '						</div>';
				strHTML += '						<div class="table-responsive2">';
				strHTML += '							<table class="table" id="csvUpRangeDataTable">';
				strHTML += '								<thead>';
				strHTML += '									<tr>';
								$.each(result.header_data, function(i) {
				        			strHTML += '	<td>' + result.header_data[i].replace(/\"/gi, "") + '</td>';
								});	
				strHTML += '									</tr>';
				strHTML += '								</thead>';
				strHTML += '								<tbody>';
								for (var i = 0; i < result.data.length; i++) {
									strHTML += '   	<tr>';
									var obj = result.data[i];
									$.each(result.header_data, function(j) {					
										for (var key in obj) {
											var value = obj[key];
					
												if (result.header_data[j] == key) {
													strHTML += '           <td>' + value.replace(/\"/gi, "") + '</td>';
												}
										    //console.log(key + ': ' + value);
										}
									});	
									strHTML += '    </tr>';
								}
				strHTML += '								</tbody>';
				strHTML += '							</table>';
				strHTML += '						</div>';
				strHTML += '	      			</div>';
				strHTML += '            	</div>';
				strHTML += '			</div>';	     	
				
				
				$('#csvUpRange').html(strHTML);
				
	            $('#csvUpRangeDataTable').DataTable( {
	            	"order": [[ 0, "asc" ]],
	            	"searching": false,  "info": false,  "lengthChange": false,  "autoWidth": false
	            });
	             
	            //$('#modal_keyword').modal('show');				
	            //$('#loading').hide();
	            
	            $("#fileList").val(result.file_list);
	            
	            //$("#select_origin_term").text(checkCsvIndexColumnTerm(result.data, indexTrgtCol));
	            $("#select_origin_term").text(getCsvIndexColumnTerm(result.dataTimeCheckAll, indexTrgtCol));
	            
	            var originJsonString = JSON.stringify(result.data);
	            var originEncodedData = encodeURIComponent(originJsonString);
	            $("#originData").val(originEncodedData);
	            
	            var infoJsonString = JSON.stringify(result.infoNode);
	            var infoEncodedData = encodeURIComponent(infoJsonString);
	            $("#infoNode").val(infoEncodedData);
	            
	            var statisticsJsonString = JSON.stringify(result.statisticsNode);
	            var statisticsEncodedData = encodeURIComponent(statisticsJsonString);
	            $("#statisticsNode").val(statisticsEncodedData);
	            
	            var missingJsonString = JSON.stringify(result.missingValueNode);
	            var missingEncodedData = encodeURIComponent(missingJsonString);
	            $("#missingValueNode").val(missingEncodedData);
	            
	            var rangeJsonString = JSON.stringify(result.rangeNode);
	            var rangeEncodedData = encodeURIComponent(rangeJsonString);
	            $("#rangeValueNode").val(rangeEncodedData);
	            
	            var nanJsonString = JSON.stringify(result.nanData);
	            var nanEncodedData = encodeURIComponent(nanJsonString);
	            $("#nanValueNode").val(nanEncodedData);
	            
	            
	            
	            $("#modelSeq").val(result.modelSeq);
	            
	            //console.log('-------result.nanLineArr-------'); 
	            //console.log(result.nanLineArr);
	            
	            //변경 전 임시
	            //전처리 상단 데이터
				$('#preProcDataRange').html(makePreprocData(result.infoNode, result.infoHeaderList));
	            
				/*
				$('#preProcDatatable').DataTable( {
		        	 destroy: true,
		        	 autoWidth: false,
		        	 columnDefs: [
		        		    //{ "width": "15%", "targets": 0 }
		        		 { "width": "20%"}
		        	 ],
		             order: [[0, 'asc']]
	            });
	            */
	            
	            //전처리 지정 컬럼 체크
	            for (var i=0; i<$('input[name="columnArr"]').length;i++) {
	            	for (var j=0; j<result.interpolateHeaderList.length;j++) {
	            		//console.log(result.interpolateHeaderList[j])
	            		if ($('#preprocCheck' + i).closest('tr').find('td:eq(0)').text() == result.interpolateHeaderList[j]) {
	            			$('input:checkbox[id="preprocCheck' + i +'"]').prop('checked', true); 
	            		}
	            	}
	            }

	            //console.log('----console.log(result.missingValueNode)----')
	            //console.log(result.missingValueNode)
	            
	            let hasValueGreaterThanZero = false;

				$.each(result.missingValueNode, function(index, value) {
				    if (parseFloat(value.nan) > 0) {
				        hasValueGreaterThanZero = true;
				        return false; // break the loop since we found a value greater than 0
				    }
				});
				
				if (hasValueGreaterThanZero) {
				    //console.log("There is at least one value greater than 0.");
					$('#missingValueYn').val('Y');
					$('#missingValueCompleteYn').val('N');
					//$('.btn-make-interpolate').show();
					
				} else {
				    //console.log("All values are 0 or less.");
					$('#missingValueYn').val('N');
					$('#missingValueCompleteYn').val('Y');
					//$('.btn-make-interpolate').hide();
				}
				
				
				
				var interpolateFilePath = $('#interpolateFilePath').val();
				
				if (interpolateFilePath.length > 0) {
					//console.log(result)
					$('#tab_nan_table_range').hide();
					$('#tab_nan_table_complete_range').html(makePreprocNanFinishData(interpolateFilePath, model_seq, indexTrgtCol));
					$('#missingValueCompleteYn').val('Y');
				}
				
				/*
	            $('#tab_nan_table_range').hide();
	            $('#tab_nan_table_complete_range').text('변환이 완료 되었습니다.');				
				*/
				
	            //전처리 중간 statics
	            $('#preProcStatisticsRange').html(makePreprocStatistics(result.statisticsNode, result.header_data));
	            $("#preProcStatisticsRange option:eq(1)").prop("selected", true).trigger("change");
	            
	            //전처리  중간 histogrma
	            histom = makePreprocHistogram(result.rangeNode, result.header_data)
	            $('#preProcHistogramRange').html(histom);
	            //$('#preProcHistogramRange').html(makePreprocHistogram(result.rangeNode, result.header_data));
	            $("#preProcHistogramRange option:eq(1)").prop("selected", true).trigger("change");
	            
	            //전처리 하단 탭처리
	            //$('#tab_missing_table_range').html(makePreprocMissingValue(result.missingValueNode, result.infoHeaderList));
	            //$('#tab_nan_table_range').html(makePreprocNanData(result.nanData, result.header_data));
	            
	            $('#tab_missing_table_range').html(makePreprocMissingValue(result.missingValueNode, result.infoHeaderList));
	            //$('#tab_nan_table_range').html(makePreprocNanData(result.nanData, result.header_data));
	            $('#tab_nan_table_range').html(makePreprocNanData(result.missingValueNode, result.infoHeaderList));
	            
	            //valid전처리 하단 탭처리
	            $('#tab_missing_table_range_valid').html(makePreprocMissingValueValid(result.dtypeValueNode, result.infoHeaderList));
	            $('#tab_missing_table_range_valid_object').html(makePreprocMissingValueValidObject(result.dtypeValueNode, result.infoHeaderList));
	            
	            $('#tab_missing_select_range').show();
	            
	            //valid 지정 컬럼
	            $('#preProcValidTargetCol').html(makePreprocValidHeader(result.header_data));
	            //단위 지정 컬럼
	            $('#preProcUnitTargetCol').html(makePreprocUnitHeader(result.header_data));
	            
	            $('#preProcOutlierTargetCol').html(makePreprocOutlierHeader(result.header_data));
	            
	            //알고리즘 선택
	            //$('#algorithmOutputRange').html(makeAlgorithmOutput(result.data, result.interpolateHeaderList));
	            //$('#algorithmFeatureRange').html(makeAlgorithmFeature(result.data, result.interpolateHeaderList));
	   
            	$('#tab_unit_file_range').html('');
            	if (result.unitHeaderList !== undefined && result.unitHeaderList != '') {
            		$('#tab_unit_file_range').html(makePreprocUnitTable(result.unitMapList, result.unitHeaderList));	
            	}	            
	            $('#preProcInterpolateDatatable').DataTable( {
	            	destroy: true,
	            	order: [[ 0, "asc" ]],
	            	autoWidth: false,
	                columnDefs: [{
	                    width: '40px',
	                    targets: 0
	                }],
	            	searching: false,
	            	info: false,
	            	lengthChange: false
	            });
	            
				$('#preProcUnitDatatable').DataTable( {
					destroy: true,
	            	"order": [[ 0, "asc" ]],
		        	 autoWidth: false,
		        	 columnDefs: [
		        		    //{ "width": "15%", "targets": 0 }
		        		 { "width": "20%"}
		        	 ],
	            	"searching": false,  "info": false,  "lengthChange": false
	            });
	            
	            
	            
	            
	            
	        	const urlParams = new URLSearchParams(window.location.search);
	        	const name = urlParams.get('tab');
	        	if (name =='model') {
	        		$('#tab_getdata_range').hide();
	        		$('#tab_preproc_range').hide();
	        		
	        		$('#tab_getalgo_range').hide();
	        		$('#tab_getalgo_range_top').hide();
	        		$('#tab_getalgo_range_bottom').hide();
	        		
	        		$('#tab_excmodel_range').hide();
	        		$('#tab_savemodel_range').show();
	        		$('#tab_interval_range').hide();
	        		$('#tab_unit_range').hide();
	        		
	        		$('#tab_getdata').attr('class','nav-link');
	        		$('#tab_preproc').attr('class','nav-link');
	        		$('#tab_getalgo').attr('class','nav-link');
	        		$('#tab_excmodel').attr('class','nav-link');
	        		$('#tab_savemodel').attr('class','nav-link active');	
	        	}
	            
	        	var main_tab = getCookie('main_tab');
	        	var sub_tab = getCookie('sub_tab');
	        	
	        	if (main_tab != '') {
	        		$("#" + main_tab).trigger("click");
	        		//$('#' + main_tab).trigger("click");
	            	//$('#' + sub_tab).trigger("click");	
	        	}
	        	
	        	if (sub_tab != '') {
	        		$("#" + sub_tab).trigger("click");
	        		var targetElement = $("#" + sub_tab);
	        		$('html, body').scrollTop(targetElement.offset().top);
	        	}
	            
	            
	            
            }
		},
        error: function(xhr, status, error) {
            console.error('error : ', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}

function viewModel2(filePath, model_seq){
	var indexTrgtCol = $('#indexTrgtCol').val();
	
	var data = {
			file_path: filePath,
			model_seq: model_seq,
			index_trgt_col: indexTrgtCol
    }
    $.ajax({
    	type: 'POST',
        url: '/ai/model/viewModel2',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",	
        success : function(result)
		{									
            if (result.result_code == 200) {
				
	            var missingJsonString = JSON.stringify(result.missingValueNode);
	            var missingEncodedData = encodeURIComponent(missingJsonString);
	            $("#missingValueNode").val(missingEncodedData);
	            
	            var rangeJsonString = JSON.stringify(result.rangeNode);
	            var rangeEncodedData = encodeURIComponent(rangeJsonString);
	            $("#rangeValueNode").val(rangeEncodedData);
	            
	            var nanJsonString = JSON.stringify(result.nanData);
	            var nanEncodedData = encodeURIComponent(nanJsonString);
	            $("#nanValueNode").val(nanEncodedData);
	            $("#modelSeq").val(result.modelSeq);
	            
	            let hasValueGreaterThanZero = false;

				$.each(result.missingValueNode, function(index, value) {
				    if (parseFloat(value.nan) > 0) {
				        hasValueGreaterThanZero = true;
				        return false; // break the loop since we found a value greater than 0
				    }
				});
				
				if (hasValueGreaterThanZero) {
				    //console.log("There is at least one value greater than 0.");
					$('#missingValueYn').val('Y');
					$('#missingValueCompleteYn').val('N');
					//$('.btn-make-interpolate').show();
					
				} else {
				    //console.log("All values are 0 or less.");
					$('#missingValueYn').val('N');
					$('#missingValueCompleteYn').val('Y');
					//$('.btn-make-interpolate').hide();
				}
				
				var interpolateFilePath = $('#interpolateFilePath').val();
				var validateFilePath = $('#validateFilePath').val();
				if (interpolateFilePath.length > 0) {
					//console.log(result)
					$('#tab_nan_table_range').hide();
					$('#tab_nan_table_complete_range').html(makePreprocNanFinishData(interpolateFilePath, model_seq, indexTrgtCol));
					$('#missingValueCompleteYn').val('Y');
					$('#validCompleteYn').val('Y');
				}
				
	            $('#tab_missing_table_range').html(makePreprocMissingValue(result.missingValueNode, result.infoHeaderList));
	            $('#tab_nan_table_range').html(makePreprocNanData(result.missingValueNode, result.infoHeaderList));
	            
	            
	            
	            //20230925 변경-처리된 파일 보기
	            //$('#tab_missing_table_range_valid').html(makePreprocMissingValueValid(result.dtypeValueNode, result.infoHeaderList));
	            if (interpolateFilePath.length > 0) {
	            	//alert(interpolateFilePath)
	            	makePreprocNanFinishDataValid(interpolateFilePath, model_seq, indexTrgtCol);	
	            } else {
	            	makePreprocNanFinishDataValid(validateFilePath, model_seq, indexTrgtCol);
	            }
	            
	            
	            $('#tab_missing_select_range').show();
	            
	            
            }
		},
        error: function(xhr, status, error) {
            console.error('error : ', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}


function preprocResampleView(resample_file_path, modelSeq) {
	//console.log('----makePreprocResampleview-----');
	var indexTrgtCol = $('#indexTrgtCol').val();
	var resampleFilePath = $('#resampleFilePath').val();
	var unitFilePath = $('#unitFilePath').val();
	
	var data = {
			file_path: resample_file_path,
			model_seq: modelSeq,
			index_trgt_col: indexTrgtCol
    }
	$.ajax({
		type: "POST",
		url: ' /ai/model/make/resample_set_view',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",	
		success : function(result)
		{									
            if (result.result_code == 200) {
            	//alert(result.result_code)
            	//console.log(result.interpolate_file_path);
            	//$('#resampleFilePath').val(result.resample_file_path);
            	//$('#resampleOption').val(resampleOption);
            	
            	
            	$('#tab_interval_file_range').html('');
            	$('#tab_unit_file_range').html('');
            	
				var interpolateFilePath = $('#interpolateFilePath').val();
				
				if (interpolateFilePath.length > 0) {
	            	if (result.header_data !== undefined && result.header_data != '') {
	            		if (resampleFilePath.length > 0) {
	            			$('#tab_interval_file_range').html(makePreprocResampleTable(result.data, result.header_data));	
	            		} else {
	            			$('#tab_interval_file_range').html(makePreprocInterpolateTable(result.data, result.header_data));
	            		}
	            		
	            		if (unitFilePath.length > 0) {
	            			$('#tab_unit_file_range').html(makePreprocUnitTable(result.data, result.header_data));
	            		} else if (resampleFilePath.length > 0) {
	            			$('#tab_unit_file_range').html(makePreprocResampleTable(result.data, result.header_data));
	            		} else {
	            			$('#tab_unit_file_range').html(makePreprocInterpolateTable(result.data, result.header_data));
	            		}
	            		
	            	}
				}
            	
            	
            	
            	if ($('#prcsLevel').val() != null && $('#prcsLevel').val() != '') {
            		//알고리즘 선택
    	            var outArr = [];
    	            var featureArr = [];
    	            
    	            for (i = 0; i < result.augment_column_list.length; i++) {
    	            	if (result.augment_column_list[i].model_col_tp == 'OC') {
    	            		//$('input:checkbox[id="output_col_' + result.augment_column_list[i].model_col_nm +'"]').prop('checked', true);
    	            		for (var hl=0; hl < result.header_data.length; hl++) {
    	            			if (result.header_data[hl].replace(/\"/gi, "") == result.augment_column_list[i].model_col_nm) {
    	            				//$('#output_col_id_' + result.header_data[hl]).closest('tr').remove();
    	            				outArr.push(result.header_data[hl].replace(/\"/gi, ""));
    	            			}
    	            		}	            		
    	            	}     	            	
    	            	if (result.augment_column_list[i].model_col_tp == 'FC') {
    	            		//$('input:checkbox[id="feature_col_' + result.augment_column_list[i].model_col_nm +'"]').prop('checked', true);
    	            		for (var hl=0; hl < result.header_data.length; hl++) {
    	            			if (result.header_data[hl].replace(/\"/gi, "") == result.augment_column_list[i].model_col_nm) {
    	            				//console.log(result.header_data[hl].replace(/\"/gi, ""));
    	    	            		//console.log(result.augment_column_list[i].model_col_nm);
    	            				//$('#feature_col_id_' + result.header_data[hl]).closest('tr').remove();	
    	            				featureArr.push(result.header_data[hl].replace(/\"/gi, ""));
    	            			}
    	            		}
    	            		
    	            	}
    	            }
    	            
    	            $('#algorithmOutputRange').html(makeAlgorithmOutputViewPage(outArr));
    	            $('#algorithmFeatureRange').html(makeAlgorithmFeatureViewPage(featureArr));
    	            
    	            correlationView(result.correlation_data['data'],result.correlation_data['xdata'],result.correlation_data['ydata']);
            	}
	            
	            
	            $('#preProcInterpolateDatatable').DataTable( {
		        	 destroy: true,
		        	 autoWidth: false,
		        	 columnDefs: [
		        		    //{ "width": "15%", "targets": 0 }
		        		 { "width": "20%"}
		        	 ],
		             order: [[0, 'asc']]
	            });
	            
	            $('#preProcUnitDatatable').DataTable( {
	            	"order": [[ 0, "asc" ]],
	            	"searching": false,  "info": false,  "lengthChange": false,  "autoWidth": false
	            });
	            
	           
            }
		},
        error: function(xhr, status, error) {
            console.error('error : ', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}

//히스토그램 차트
function histogramView(itemName, data) {
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
    jsonVal = JSON.parse(data);
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
    jsonVal = JSON.parse(data);
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
    viewTypeDefault("bar", histogramChart, 5, false, false);
} 

function correlationView(data,xdata,ydata) {
	var data = {
			"series": [
		        {
		            "header_name": [],
		            "sort": "1",
		            "unit_type": "P",
		            "type": "D",
		            "name": "Correlation",
		            "key": 0,
		            "chart": "bar",
		            "unit": "",
		            "yname": "",
		            "data": data
		        }
		    ],
		    "subtitle": "",
		    "title": "",
		    "xdata":xdata,
		    "ydata": ydata
	};

	viewTypeDefault("heatmap", data, 4, true)
}

function fileDirCheck(prcsLevel) {
	var file_path;
	
	if (prcsLevel.length > 0) {
		 if (prcsLevel == 'RESAMPLE') {
				file_path = $('#resampleFilePath').val();
			} else if (prcsLevel == 'OUTLIER') {
				file_path = $('#outLierFilePath').val();
			} else if (prcsLevel == 'INTERPOLATE') {
				file_path = $('#interpolateFilePath').val();
			} else if (prcsLevel == 'VALIDATE') {
				file_path = $('#validateFilePath').val();
			} else {
				file_path = $('#originFilePath').val();
			}
	} else {
		var originFilePath = $('#originFilePath').val();
    	var interpolateFilePath = $('#interpolateFilePath').val();
    	var outLierFilePath = $('#outLierFilePath').val();
    	var validateFilePath = $('#validateFilePath').val();
    	var resampleFilePath = $('#resampleFilePath').val();
    	var unitFilePath = $('#unitFilePath').val();
    	
    	//if (unitFilePath.length > 0) {
    	//	finalFilePath = unitFilePath;
    	//} else
    	if (resampleFilePath.length > 0) {
    		file_path = resampleFilePath;
    	} else if (outLierFilePath.length > 0) {
    		file_path = outLierFilePath;
    	} else if (interpolateFilePath.length > 0) {
    		file_path = interpolateFilePath;
    	} else if (validateFilePath.length > 0) {
    		file_path = validateFilePath;
    	} else  {
    		file_path = originFilePath;
    	} 
		
	}
	

	
	return file_path;
}


function makeAlgorithmOutputViewPage(header_data) {
	
	var indexTrgtCol = $('#indexTrgtCol').val();
	var strHTML = '';
	var strHTML = '';
	strHTML += '		<div class="table-responsive">';
	strHTML += '			<table class="table">';
	strHTML += '				<thead>';
	strHTML += '					<tr>';
	strHTML += '						<th>컬럼명</th>';
	strHTML += '					</tr>';
	strHTML += '				</thead>';
	strHTML += '				<tbody>';
	for (var i = 0; i < header_data.length; i++) {
		if (header_data[i].replace(/\"/gi, "") != indexTrgtCol) {
			strHTML += '   <tr id="output_col_id_' +  header_data[i].replace(/\"/gi, "") + '">';
			//strHTML += '           <th><input type="checkbox" name="outputCol" id="output_col_' + header_data[i].replace(/\"/gi, "") +'" value="' + header_data[i].replace(/\"/gi, "") + '"></th>';
			strHTML += '           <td>' + header_data[i].replace(/\"/gi, "") + '</td>';
			//strHTML += '           <td>' + '-' + '</td>';
			strHTML += '    </tr>';
		}
	}
	strHTML += '				</tbody>';
	strHTML += '			</table>';
	strHTML += '		</div>';
	
	return strHTML;
}

function makeAlgorithmFeatureViewPage(header_data) {
	var indexTrgtCol = $('#indexTrgtCol').val();
	var strHTML = '';
	strHTML += '		<div class="table-responsive">';
	strHTML += '			<table class="table">';
	strHTML += '				<thead>';
	strHTML += '					<tr>';
	strHTML += '						<th>컬럼명</th>';
	strHTML += '					</tr>';
	strHTML += '				</thead>';
	strHTML += '				<tbody>';
	
	for (var i = 0; i < header_data.length; i++) {
		if (header_data[i].replace(/\"/gi, "") != indexTrgtCol) {
			strHTML += '   <tr id="feature_col_id_' +  header_data[i].replace(/\"/gi, "") + '">';
			//strHTML += '           <th><input type="checkbox" name="featureCol" id="feature_col_' + header_data[i].replace(/\"/gi, "") +'" value="' + header_data[i].replace(/\"/gi, "") + '"></th>';
			strHTML += '           <td>' + header_data[i].replace(/\"/gi, "") + '</td>';
			//strHTML += '           <td>' + '-' + '</td>';
			strHTML += '    </tr>';
		}
	}
	strHTML += '				</tbody>';
	strHTML += '			</table>';
	strHTML += '		</div>';

	
	return strHTML;
}

