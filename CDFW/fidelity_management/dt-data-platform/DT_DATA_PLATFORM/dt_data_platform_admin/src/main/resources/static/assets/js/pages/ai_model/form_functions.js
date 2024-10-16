function addFileRow() {
    var strHTML = '';
    strHTML += '<div class="pt-2 attach-file">';
    strHTML += '  <input type="file" name="attachFiles" class="file-upload-default">';
    strHTML += '  <div class="input-group col-xs-12">';
    strHTML += '    <input type="text" class="form-control file-upload-title" disabled="disabled" placeholder="">';
    strHTML += '    <span class="input-group-append">';
    strHTML += '      <button type="button" class="file-upload-browse btn btn-primary">파일선택</button>';
    strHTML += '      <button type="button" class="btn btn-danger btn-delete-upload ml-3">삭제</button>';
    strHTML += '    </span>';
    strHTML += '  </div>';
    strHTML += '</div>';

    $('div.attach-file-group:last').append(strHTML);
}

function chgAddFilePc(obj, e){
	
	var fileValue = obj.val().split("\\");
	var fileName = fileValue[fileValue.length-1]; // 파일명
	var ext = fileName.substring(fileName.lastIndexOf('.') + 1, fileName.length);
	ext = ext.toLowerCase();
	
	if( ext != 'csv'){
		alert("확장자가 csv인  파일만 첨부가능합니다.");
		window.location.reload();

	} else {
		uploadFile();
	}
}    	

function uploadFile(){
	var form = $('#editForm')[0];
    var indexTrgtCol = $('#indexTrgtCol').val();
    var form = $('#editForm')[0];
    //console.log(form)
    var formData = new FormData(form);
    //formData.append('file', $('#attachFiles')[0].files[0]);
    $('#loading').show();
    $.ajax({
    	type: 'POST',
        //enctype: 'multipart/form-data',
        url: '/ai/model/csvFileUpload',
        data: formData,
        processData: false,
        contentType: false,    	
		success : function(result)
		{									
            if (result.result_code == 200) {
            	//console.log(result.header_data)
            	//console.log(result.data)
            	
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
											strHTML += '<option value=' + result.header_data[i].replace(/\"/gi, "") + '>' + result.header_data[i].replace(/\"/gi, "") + '</option>';	
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
	             
	            var uploadJsonString = JSON.stringify(result.data);
	            var uploadEncodedData = encodeURIComponent(uploadJsonString);
	            $("#uploadData").val(uploadEncodedData);
	            
	            
	            //$('#modal_keyword').modal('show');				
	            $('#loading').hide();
            }
		},
        error: function(xhr, status, error) {
            console.error('error : ', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}

function insertModel(){
	var form = $('#editForm')[0];
    var indexTrgtCol = $('#indexTrgtCol').val();
    var form = $('#editForm')[0];
    //console.log(form)
    var formData = new FormData(form);
    //formData.append('file', $('#attachFiles')[0].files[0]);
    //$('#loading').show();
    $.ajax({
    	type: 'POST',
        //enctype: 'multipart/form-data',
        url: '/ai/model/insertModel',
        data: formData,
        processData: false,
        contentType: false,    	
		success : function(result)
		{									
            if (result.result_code == 200) {
				var strHTML = '';
            	strHTML += '';
				strHTML += '<div class="table-responsive">';
				strHTML += '<table id="csvUpRangeDataTable" class="table table-hover">';
				strHTML += '    <thead>';
				strHTML += '        <tr>';

				
				$.each(result.header_data, function(i) {
        			strHTML += '	<td>' + result.header_data[i].replace(/\"/gi, "") + '</td>';
				});	
				
				strHTML += '        </tr>';
				strHTML += '    </thead>';
				strHTML += '    <tbody>';
				
				
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
				
				strHTML += '   </tbody>';
				strHTML += '</table>';
				strHTML += '</div>';            	
				
				$('#csvUpRange').html(strHTML);
				
	            $('#csvUpRangeDataTable').DataTable( {
	            	"order": [[ 0, "asc" ]]
	            });
	             
	            //$('#modal_keyword').modal('show');				
	            //$('#loading').hide();
	            
	            $("#fileList").val(result.file_list);
	            $("#originFilePath").val(result.originFilePath);
	            
	            
	            //alert(checkCsvIndexColumnTerm(result.data));
	            
	            //$("#select_origin_term").text(checkCsvIndexColumnTerm(result.data,indexTrgtCol));
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
	            //console.log(result.missingValueNode);
	            
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
	            
	            //전처리 중간 statics
	            $('#preProcStatisticsRange').html(makePreprocStatistics(result.statisticsNode, result.header_data));
	            $("#preProcStatisticsRange option:eq(1)").prop("selected", true).trigger("change");
	            
	            //전처리  중간 histogrma
	            $('#preProcHistogramRange').html(makePreprocHistogram(result.rangeNode, result.header_data));
	            $("#preProcHistogramRange option:eq(1)").prop("selected", true).trigger("change");
	            
	            //전처리 하단 탭처리
	            $('#tab_missing_table_range').html(makePreprocMissingValue(result.missingValueNode, result.infoHeaderList));
	            
	            //valid전처리 하단 탭처리
	            $('#tab_missing_table_range_valid').html(makePreprocMissingValueValid(result.dtypeValueNode, result.infoHeaderList));
	            $('#tab_missing_table_range_valid_object').html(makePreprocMissingValueValidObject(result.dtypeValueNode, result.infoHeaderList));
	            
	            var missingCnt = makePreprocNanDataCnt(result.missingValueNode, result.infoHeaderList);
	            if (missingCnt == 0) {
	            	$('#interpolateFilePath').val($('#originFilePath').val())
	            	$('#tab_interval_file_range').html(makePreprocInterpolateTable(result.data, result.header_data));
	            	$('#tab_unit_file_range').html(makePreprocResampleTable(result.data, result.header_data));
	            } 
	            
	            //$('#tab_nan_table_range').html(makePreprocNanData(result.nanData, result.header_data));
	            $('#tab_nan_table_range').html(makePreprocNanData(result.missingValueNode, result.infoHeaderList));
	            $('#tab_missing_select_range').show();
	            
	            //알고리즘 선택
	            //$('#algorithmOutputRange').html(makeAlgorithmOutput(result.data, result.header_data));
	            //$('#algorithmFeatureRange').html(makeAlgorithmFeature(result.data, result.header_data));
	            
	            //valid 지정 컬럼
	            $('#preProcValidTargetCol').html(makePreprocValidHeader(result.header_data));
	            //단위 지정 컬럼
	            $('#preProcUnitTargetCol').html(makePreprocUnitHeader(result.header_data));
	            
	            $('#preProcOutlierTargetCol').html(makePreprocOutlierHeader(result.header_data));
	            

	    		$('#tab_getdata_range').hide();
	    		$('#tab_preproc_range').show();
	    		
	    		$('#tab_getalgo_range').hide();
	    		$('#tab_getalgo_range_top').hide();
	    		$('#tab_getalgo_range_bottom').hide();
	    		
	    		$('#tab_excmodel_range').hide();
	    		$('#tab_savemodel_range').hide();
	    		$('#tab_interval_range').hide();
	    		$('#tab_unit_range').hide();
	    		
	    		$('#tab_getdata').attr('class','nav-link');
	    		$('#tab_preproc').attr('class','nav-link active');
	    		$('#tab_getalgo').attr('class','nav-link');
	    		$('#tab_excmodel').attr('class','nav-link');
	    		$('#tab_savemodel').attr('class','nav-link');
            }
		},
        error: function(xhr, status, error) {
            console.error('error : ', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}

function updateModel(){
    
    var form = $('#editForm')[0];
    //console.log(form)
    var formData = new FormData(form);
    //formData.append('file', $('#attachFiles')[0].files[0]);
    //$('#loading').show();
    $.ajax({
    	type: 'POST',
        //enctype: 'multipart/form-data',
        url: '/ai/model/updateModel',
        data: formData,
        processData: false,
        contentType: false,    	
		success : function(result)
		{									
            if (result.result_code == 200) {
				var strHTML = '';
            	strHTML += '';
				strHTML += '<div class="table-responsive">';
				strHTML += '<table id="csvUpRangeDataTable" class="table table-hover">';
				strHTML += '    <thead>';
				strHTML += '        <tr>';

				
				$.each(result.header_data, function(i) {
        			strHTML += '	<td>' + result.header_data[i].replace(/\"/gi, "") + '</td>';
				});	
				
				strHTML += '        </tr>';
				strHTML += '    </thead>';
				strHTML += '    <tbody>';
				
				
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
				
				strHTML += '   </tbody>';
				strHTML += '</table>';
				strHTML += '</div>';            	
				
				$('#csvUpRange').html(strHTML);
				
	            $('#csvUpRangeDataTable').DataTable( {
	            	"order": [[ 0, "asc" ]]
	            });
	             
	            //$('#modal_keyword').modal('show');				
	            //$('#loading').hide();
	            
	            $("#fileList").val(result.file_list);
	            
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
	            
	            //전처리 중간 statics
	            $('#preProcStatisticsRange').html(makePreprocStatistics(result.statisticsNode, result.header_data));
	            $("#preProcStatisticsRange option:eq(1)").prop("selected", true).trigger("change");
	            //전처리  중간 histogrma
	            $('#preProcHistogramRange').html(makePreprocHistogram(result.rangeNode, result.header_data));
	            $("#preProcHistogramRange option:eq(1)").prop("selected", true).trigger("change");
	            
	            //전처리 하단 탭처리
	            
	            $('#tab_missing_table_range').html(makePreprocMissingValue(result.missingValueNode, result.infoHeaderList));
	            //valid전처리 하단 탭처리
	            $('#tab_missing_table_range_valid').html(makePreprocMissingValueValid(result.dtypeValueNode, result.infoHeaderList));
	            $('#tab_missing_table_range_valid_object').html(makePreprocMissingValueValidObject(result.dtypeValueNode, result.infoHeaderList));
	            
	            $('#tab_nan_table_range').html(makePreprocNanData(result.missingValueNode, result.infoHeaderList));
	           
	            var missingCnt = makePreprocNanDataCnt(result.missingValueNode, result.infoHeaderList);
	            if (missingCnt == 0) {
	            	$('#interpolateFilePath').val($('#originFilePath').val())
	            	$('#tab_interval_file_range').html(makePreprocInterpolateTable(result.data, result.header_data));
	            	$('#tab_unit_file_range').html(makePreprocResampleTable(result.data, result.header_data));
	            }
	            
	            $('#tab_missing_select_range').show();
	            
	            //valid 지정 컬럼
	            $('#preProcValidTargetCol').html(makePreprocValidHeader(result.header_data));
	            //단위 지정 컬럼
	            $('#preProcUnitTargetCol').html(makePreprocUnitHeader(result.header_data));
	            
	            //$("#select_origin_term").text(checkCsvIndexColumnTerm(result.data,indexTrgtCol));
	            $("#select_origin_term").text(getCsvIndexColumnTerm(result.dataTimeCheckAll, indexTrgtCol));
	            
	    		$('#tab_getdata_range').hide();
	    		$('#tab_preproc_range').show();
	    		
	    		$('#tab_getalgo_range').hide();
	    		$('#tab_getalgo_range_top').hide();
	    		$('#tab_getalgo_range_bottom').hide();
	    		
	    		$('#tab_excmodel_range').hide();
	    		$('#tab_savemodel_range').hide();
	    		$('#tab_interval_range').hide();
	    		$('#tab_unit_range').hide();
	    		
	    		$('#tab_getdata').attr('class','nav-link');
	    		$('#tab_preproc').attr('class','nav-link active');
	    		$('#tab_getalgo').attr('class','nav-link');
	    		$('#tab_excmodel').attr('class','nav-link');
	    		$('#tab_savemodel').attr('class','nav-link');
            }
		},
        error: function(xhr, status, error) {
            console.error('error : ', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}


function outlierInfoResult(params) {
	//console.log(params)
    var get_data;
	var data = {
			outlier_type: params.outlier_type,
			model_seq: params.model_seq,
			file_path: params.file_path,
			index_target_col: params.index_target_col,
			outlier_target_col: params.outlier_target_col,
			freq: params.freq,
			p_value: params.p_value,
			eps: params.eps,
			min_samples: params.min_samples,
			n_clusters: params.n_clusters,
			n_clusters_lable: params.select_clusters_group
    }    
    $.ajax({
    	type: 'POST',
    	async: false,
        url: '/ai/model/get/outlier_info',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",	
		success : function(result)
		{						
        	get_data = result
            /*
			if (result.result_code == 200) {
            	console.log(result)
            	get_data = result
            } else {
            	console.log(result)
            }
            */
		},
        error: function(xhr, status, error) {
            console.error('error : ', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
    
    return get_data;	

}


function makePreprocData(data, header_data) {
	var objCnt = 0;
	
	var strHTML = '';
		strHTML += '						<h6 class="card-title">컬럼 정보 : 알고리즘 선택 시 작업할 컬럼을 필수로 지정해야 합니다.</h6>';
			strHTML += '						<div class="table-responsive">';
			strHTML += '							<table class="table" id="preProcDatatable">';
			strHTML += '								<thead>';
			strHTML += '									<tr>';
				strHTML += '        <th><input type="checkbox" class="preprocCheck" id="chkAll"></th>';
				$.each(header_data, function(i) {
					strHTML += '	<td>' + header_data[i].replace(/\"/gi, "") + '</td>';
				});	
			strHTML += '									</tr>';
			strHTML += '								</thead>';
			strHTML += '								<tbody>';
				for (var i = 0; i < data.length; i++) {
					strHTML += '   	<tr>';
					var obj = data[i];
					
					strHTML += '           <th><input type="checkbox" class="preprocCheck" name="columnArr" id="preprocCheck' +  i + '" value="' + i + '"></th>';
					$.each(header_data, function(j) {					
						for (var key in obj) {
							var value = obj[key];
	
								if (header_data[j] == key) {
									if (key == 'dtype' && value=='object') {
										strHTML += '           <td style="color: red;">' + value.replace(/\"/gi, "") + '</td>';	
										objCnt++;
									} else {
										strHTML += '           <td>' + value.replace(/\"/gi, "") + '</td>';	
									}
									
								}
						    //console.log(key + ': ' + value);
						}
					});	
					strHTML += '    </tr>';
				}
			strHTML += '								</tbody>';
			strHTML += '							</table>';
			strHTML += '						</div>';      	
	
			if (objCnt > 0) {
				strHTML += '						<br/><h6 class="card-title" style="color: red;">원본 파일에는 ' + objCnt + '개의 컬럼에 문자열 혹은 다른 형식의 값이 존재 하여 결측치 보간 및 모델 생성시 문제가 발생합니다. valdate를 통해 알맞는 값으로 변환해 주세요.</h6>';
				$('#validCompleteYn').val('N');
			} else {
				$('#validCompleteYn').val('Y');
			}
			
			//alert(objCnt);
	return strHTML;
}


function makePreprocStatistics(data, header_data) {
	var indexTrgtCol = $('#indexTrgtCol').val();
	
	var strHTML = '';
	strHTML += '			<label class="label-a">Statistics</label>';
		strHTML += '			<select class="w-40 select-a preproc_statistics"  id="preproc_statistics" style="display: inline-block;margin: auto;">';
		strHTML += '						<option value="0">선택</option>';
			for (var i = 0; i < header_data.length; i++) {
					if (header_data[i].replace(/\"/gi, "") != indexTrgtCol) {
						if (i == 1) {
							strHTML += '<option selected value=' + header_data[i].replace(/\"/gi, "") + '>' + header_data[i].replace(/\"/gi, "") + '</option>';	
						} else {
							strHTML += '<option value=' + header_data[i].replace(/\"/gi, "") + '>' + header_data[i].replace(/\"/gi, "") + '</option>';
						}
							
					}
						
		    }
		strHTML += '			</select>';
	return strHTML;
}

function makePreprocStatisticsTable(data, header_data) {
	var filteredData = data.filter(function(item) {
	    return item.col === header_data;
	});
	
	//console.log(filteredData);
	//console.log('-------bbbb--------');
	$('#StatisticsCount').html(filteredData[0].count);
	$('#StatisticsAverage').html(filteredData[0].mean);
	$('#StatisticsStandard').html(filteredData[0].std);
	$('#StatisticsMin').html(filteredData[0].min);
	$('#Statistics25').html(filteredData[0].per25);
	$('#Statistics50').html(filteredData[0].per50);
	$('#Statistics75').html(filteredData[0].per75);
	$('#StatisticsMax').html(filteredData[0].max);
}


function makePreprocHistogram(data, header_data) {
	var indexTrgtCol = $('#indexTrgtCol').val();
	var strHTML = '';
	strHTML += '		<label class="label-a">Histogram</label>';
	strHTML += '		<select class="w-40 select-a preproc_histogram" id="preproc_histogram">';
		strHTML += '						<option value="0">선택</option>';
	    //$.each(header_data, function(i, item) {
		for (var i = 0; i < header_data.length; i++) {
			if (header_data[i].replace(/\"/gi, "") != indexTrgtCol) {
				if (i == 1) {
					strHTML += '					<option selected value=' + header_data[i].replace(/\"/gi, "") + '>' + header_data[i].replace(/\"/gi, "") + '</option>';	
				} else {
					strHTML += '					<option value=' + header_data[i].replace(/\"/gi, "") + '>' + header_data[i].replace(/\"/gi, "") + '</option>';
				}
				
			}
	    }
	strHTML += '		</select>';

	return strHTML;
}

function makePreprocHistogramTable(data, header_data) {
	//console.log('-----makePreprocHistogramTable--------')
	
	var inputArray = JSON.parse(data);
	var jsonArr = [];
	
	for (var i=0; i<inputArray.length; i++) {
		//console.log(JSON.parse(inputArray[i]))
		var jsonData = JSON.parse(inputArray[i]);
		
		$.each(jsonData, function(key, value) {
			if(key == header_data) {
				//console.log(key + ':');
				$.each(value, function(subKey, subValue) {
				    //console.log('  ' + subKey + ': ' + subValue);
					var obj = {};
				    obj[subKey]=subValue
				    jsonArr.push(JSON.stringify(obj));
				});
			}
		});		
		
	}
	//console.log(jsonArr)
	
	
	var strHTML = '';
	strHTML += '								<div class="table-responsive">';
	strHTML += '									<table class="table">';
	strHTML += '										<thead>';
	strHTML += '											<tr>';
	strHTML += '												<th>Range</th>';
	strHTML += '												<th>Count</th>';
	strHTML += '											</tr>';
	strHTML += '										</thead>';
	strHTML += '										<tbody>';
		for (var i = 0; i < jsonArr.length; i++) {
			
			var jsonObj = JSON.parse(jsonArr[i]);
			for (var key in jsonObj) {
				if (jsonObj.hasOwnProperty(key)) {
						strHTML += '   	<tr>';
						strHTML += '           <td>' + key + '</td>';
						strHTML += '           <td>' + jsonObj[key]; + '</td>';
						strHTML += '    </tr>';
				}
			}
			
		}
	strHTML += '										</tbody>';
	strHTML += '									</table>';
	strHTML += '								</div>';
	
	
	$('#preProcHistogramTableRange').html(strHTML);
}


function makePreprocMissingValue(data, header_data) {
	//console.log(data);
	
	var strHTML = '';
	strHTML += '				<h6 class="card-title">결측 정보</h6>';
	strHTML += '				<div class="table-responsive" style="max-height: 480px;overflow: auto;">';
	strHTML += '					<table class="table">';
	strHTML += '						<thead>';
	strHTML += '							<tr>';
	strHTML += '								<th>#</th>';
	strHTML += '								<th>Column</th>';
	strHTML += '								<th>Count</th>';
	strHTML += '							</tr>';
	strHTML += '						</thead>';
	strHTML += '						<tbody>';
		for (var i = 0; i < data.length; i++) {
			strHTML += '   	<tr>';
			var obj = data[i];
			strHTML += '<td>' + (i + 1) + '</td>';
			$.each(header_data, function(j) {					
				for (var key in obj) {
					var value = obj[key];

						if (header_data[j] == key) {
							strHTML += '           <td>' + value.replace(/\"/gi, "") + '</td>';
						}
				    //console.log(key + ': ' + value);
				}
			});	
			strHTML += '    </tr>';
		}
	strHTML += '						</tbody>';
	strHTML += '					</table>';
	strHTML += '				</div>';
	
	return strHTML;
}

function makePreprocMissingValueValid(data, header_data) {
	//console.log(data);
	//console.log(header_data);
	
	var strHTML = '';
	strHTML += '				<h6 class="card-title">검증 정보</h6>';
	strHTML += '				<div class="table-responsive" style="max-height: 480px;overflow: auto;">';
	strHTML += '					<table class="table">';
	strHTML += '						<thead>';
	strHTML += '							<tr>';
	strHTML += '								<th>#</th>';
	strHTML += '								<th>Column</th>';
	strHTML += '								<th>Type</th>';
	strHTML += '							</tr>';
	strHTML += '						</thead>';
	strHTML += '						<tbody>';
		for (var i = 0; i < data.length; i++) {
			strHTML += '   	<tr>';
			var obj = data[i];
			strHTML += '<td>' + (i + 1) + '</td>';
			$.each(header_data, function(j) {					
				for (var key in obj) {
					var value = obj[key];

						if (header_data[j] == key) {
							/*strHTML += '           <td>' + value.replace(/\"/gi, "") + '</td>';*/
							if (key == 'dtype' && value=='object') {
								strHTML += '           <td style="color: red;">' + value.replace(/\"/gi, "") + '</td>';	
							} else {
								strHTML += '           <td>' + value.replace(/\"/gi, "") + '</td>';	
							}
						}
				    //console.log(key + ': ' + value);
				}
			});	
			strHTML += '    </tr>';
		}
	strHTML += '						</tbody>';
	strHTML += '					</table>';
	strHTML += '				</div>';
	
	return strHTML;
}

function makePreprocMissingValueValidObject(data, header_data) {
	//console.log(data);
	
	var filteredData = $.grep(data, function(item) {
	    return item.dtype === "object";
	});
	
	//console.log('=======');
	//console.log(filteredData);
	//console.log(filteredData.length);
	
	if (filteredData.length == 0) {
		$('#validCompleteYn').val('Y');	
	} else {
		$('#validCompleteYn').val('N');
	}
	
	var strHTML = '';
	/*
	if (filteredData.length > 0) {
		strHTML += '				<h6 class="card-title">검증 대상</h6>';
		strHTML += '				<div class="table-responsive" style="max-height: 120px;overflow: auto;">';
		strHTML += '					<table class="table">';
		strHTML += '						<thead>';
		strHTML += '							<tr>';
		strHTML += '								<th>#</th>';
		strHTML += '								<th>Column</th>';
		strHTML += '								<th>Type</th>';
		strHTML += '							</tr>';
		strHTML += '						</thead>';
		strHTML += '						<tbody>';
			for (var i = 0; i < filteredData.length; i++) {
				strHTML += '   	<tr>';
				var obj = filteredData[i];
				strHTML += '<td>' + (i + 1) + '</td>';
				$.each(header_data, function(j) {					
					for (var key in obj) {
						
						var value = obj[key];
						if (key = 'dtype') {
							if (header_data[j] == key) {
								if (key == 'dtype' && value=='object') {
									strHTML += '           <td style="color: red;">' + value.replace(/\"/gi, "") + '</td>';	
								} else {
									strHTML += '           <td>' + value.replace(/\"/gi, "") + '</td>';	
								}
							}
						}

					    //console.log(key + ': ' + value);
					}
				});	
				strHTML += '    </tr>';
			}
		strHTML += '						</tbody>';
		strHTML += '					</table>';
		strHTML += '				</div>';
	} else {
		strHTML += '<span>검증 확인 필요 컬럼이 없습니다.</span>';
	}
	*/

	
	return strHTML;
}



function makePreprocNanDataCnt(tmp_data, header_data) {
	const data = tmp_data.filter(item => parseFloat(item.nan) > 0);
	
	return data.length;
}

function makePreprocNanData(tmp_data, header_data) {
	var strHTML = '';
	const data = tmp_data.filter(item => parseFloat(item.nan) > 0);
	
	if (data.length > 0) {
		var strHTML = '';
		strHTML += '				<h6 class="card-title">결측 정보</h6>';
		strHTML += '				<div class="table-responsive">';
		strHTML += '					<table class="table">';
		strHTML += '						<thead>';
		strHTML += '							<tr>';
		strHTML += '								<th>Column</th>';
		strHTML += '								<th>Count</th>';
		strHTML += '							</tr>';
		strHTML += '						</thead>';
		strHTML += '						<tbody>';
			for (var i = 0; i < data.length; i++) {
				strHTML += '   	<tr>';
				var obj = data[i];
				
				$.each(header_data, function(j) {					
					for (var key in obj) {
						var value = obj[key];

							if (header_data[j] == key) {
								strHTML += '           <td>' + value.replace(/\"/gi, "") + '</td>';
							}
					    //console.log(key + ': ' + value);
					}
				});	
				strHTML += '    </tr>';
			}
		strHTML += '						</tbody>';
		strHTML += '					</table>';
		strHTML += '				</div>';
		
		$('#missingValueCompleteYn').val('N');	
		
	} else {
		strHTML += '결측된 라인이 없습니다.';
		$('#missingValueCompleteYn').val('Y');	
	}
	
	return strHTML;
}

function makeAlgorithmOutput(data, header_data) {
	
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
				strHTML += '   <tr id="output_col_id_' +  header_data[i].replace(/\"/gi, "") + '">';
				strHTML += '           <th><input type="checkbox" name="outputCol" id="output_col_' + header_data[i].replace(/\"/gi, "") +'" value="' + header_data[i].replace(/\"/gi, "") + '"></th>';
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

function makeAlgorithmFeature(data, header_data) {
	var strHTML = '';
	var indexTrgtCol = $('#indexTrgtCol').val();
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
				strHTML += '           <th><input type="checkbox" name="featureCol" id="feature_col_' + header_data[i].replace(/\"/gi, "") +'" value="' + header_data[i].replace(/\"/gi, "") + '"></th>';
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

function useInterpolateNewJson(data, selectCol) {
	var indexTrgtCol = $('#indexTrgtCol').val();
	var newTargetJsonArr = [];
	
	for (var i = 0; i < data.length; i++) {
		var obj = data[i];
		//$.each(colArr, function(j) {
			var units = {};
			
			for (var key in obj) {
				//console.log('----jsonData for2 -----')
				var value = obj[key];
				$.each(selectCol, function(j) {
					if (key == selectCol[j]  ||  key == indexTrgtCol) {
						
						units[key]=value;
					}
				});	
			}
			newTargetJsonArr.push(JSON.stringify(units));
		//});	
	}    		
	
	return newTargetJsonArr;
}

function makePreprocNanFinishData(filepath, modelSeq, indexTrgtCol) {
	//console.log('----makeInterpolate-----');
	var data = {
			file_path: filepath,
			model_seq: modelSeq,
			index_trgt_col: indexTrgtCol,
    }
	$.ajax({
		type: "POST",
		url: ' /ai/model/make/data_set_info',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",	
		success : function(result)
		{									
            if (result.result_code == 200) {
	            //var missingJsonString = JSON.stringify(result.missingValueNode);
	            //var missingEncodedData = encodeURIComponent(missingJsonString);
	            //$("#missingValueNode").val(missingEncodedData);                	
            	
            	$('#tab_nan_table_complete_range').show();
            	$('#tab_nan_table_complete_range').html(makeInterpolateMissingValue(result.infoNode, result.infoHeaderList));
            	
            	
            } else {
            	alert('API 내 에러 발생')
            }
		},
        error: function(xhr, status, error) {
            console.error('error : ', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}

//check
function makePreprocNanFinishDataValid(filepath, modelSeq, indexTrgtCol) {
	//console.log('----makeInterpolate-----');
	var data = {
			file_path: filepath,
			model_seq: modelSeq,
			index_trgt_col: indexTrgtCol,
    }
	$.ajax({
		type: "POST",
		url: ' /ai/model/make/data_set_info',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",	
		success : function(result)
		{									
            if (result.result_code == 200) {
	            var missingJsonString = JSON.stringify(result.missingValueNode);
	            var missingEncodedData = encodeURIComponent(missingJsonString);
	            $("#missingValueNode").val(missingEncodedData);                 	

	            $('#preProcDataRange').html(makePreprocData(result.infoNode, result.infoTopHeaderList));
	            
            	//$('#tab_missing_table_range_valid_object').html(makePreprocMissingValueValidObject(result.dtypeValueNode, result.validHeaderList));
            	makePreprocMissingValueValidObject(result.dtypeValueNode, result.validHeaderList);
            	$('#tab_missing_table_range_valid').html(makePreprocMissingValueValid(result.dtypeValueNode, result.validHeaderList));
            	//console.log(result.missingValueNode);
            	$('#tab_missing_table_range').html(makePreprocMissingValue(result.missingValueNode, result.infoHeaderList));
            	$('#tab_nan_table_range').html(makePreprocNanData(result.missingValueNode, result.infoHeaderList));
            	$('#tab_nan_table_complete_range').html(makeInterpolateMissingValue(result.infoNode, result.infoHeaderList));
            	
            	
            } else {
            	alert('API 내 에러 발생')
            }
		},
        error: function(xhr, status, error) {
            console.error('error : ', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}

function makeInterpolateMissingValue(data, header_data) {
	//console.log(data);
	var encodedData = $("#missingValueNode").val();
	var jsonString = decodeURIComponent(encodedData);
	var jsonData = JSON.parse(jsonString);
	
	//결측값
	const tmp_data = jsonData.filter(item => parseFloat(item.nan) > 0);
	
	//console.log(tmp_data.length);
	
	var json1 = tmp_data;
	var json2 = data;


	//새로운 JSON 객체 생성
	var jsonResult = [];

	$.each(json1, function(index, item1) {
	    var col1 = item1.col;
	    $.each(json2, function(index, item2) {
	        var col2 = item2.col;
	        if (col1 === col2) {
	        	jsonResult.push(item2);
	            return false; // 내부 반복문 종료
	        }
	    });
	});

	//console.log(jsonResult);
	
	const tmp_data_result = jsonResult.filter(item => parseFloat(item.nan) > 0);
	
	//console.log(tmp_data_result.length);
	if (tmp_data_result.length == 0) {
		$('#missingValueCompleteYn').val('Y');	
	} else {
		$('#missingValueCompleteYn').val('N');
	}
	
	
	
	var strHTML = '';
	strHTML += '				<h6 class="card-title">결측 처리 결과</h6>';
	strHTML += '				<div class="table-responsive">';
	strHTML += '					<table class="table">';
	strHTML += '						<thead>';
	strHTML += '							<tr>';
	strHTML += '								<th>Column</th>';
	strHTML += '								<th>Count</th>';
	strHTML += '							</tr>';
	strHTML += '						</thead>';
	strHTML += '						<tbody>';
		for (var i = 0; i < jsonResult.length; i++) {
			strHTML += '   	<tr>';
			var obj = jsonResult[i];
			
			$.each(header_data, function(j) {					
				for (var key in obj) {
					var value = obj[key];

						if (header_data[j] == key) {
							strHTML += '           <td>' + value.replace(/\"/gi, "") + '</td>';
						}
				    //console.log(key + ': ' + value);
				}
			});	
			strHTML += '    </tr>';
		}
	strHTML += '						</tbody>';
	strHTML += '					</table>';
	strHTML += '				</div>';
	
	return strHTML;
}


function makePreprocInterpolate(data, interpolateOption, modelSeq) {
	//console.log('----makeInterpolate-----');
	var indexTrgtCol = $('#indexTrgtCol').val();

	var originFilePath = $('#originFilePath').val();
	var validateFilePath = $('#validateFilePath').val();
	var outLierFilePath = $('#outLierFilePath').val();
	
	var finalFilePath = '';
	
	if (outLierFilePath.length > 0) {
		finalFilePath = outLierFilePath;
	} else if (validateFilePath.length > 0) {
		finalFilePath = validateFilePath;
	} else {
		finalFilePath = originFilePath;
	}
	
	var data = {
			data: data,
			interpolate_option: interpolateOption,
			model_seq: modelSeq,
			index_trgt_col: indexTrgtCol,
			file_path: finalFilePath
    }
	$.ajax({
		type: "POST",
		url: ' /ai/model/make/interpolate_set',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",	
		success : function(result)
		{									
            if (result.result_code == 200) {
            	//alert(result.result_code)
            	//console.log(result.interpolate_file_path);
            	//console.log(result.data);
            	//console.log(result.header_data);
            	$('#interpolateFilePath').val(result.interpolate_file_path);
            	$('#interpolateOption').val(interpolateOption);
            	//$('#missingValueCompleteYn').val('Y');
            	$('#missingValueYn').val('N');
            	$('#prcsLevel').val('INTERPOLATE');
            	
            	
				$('#tab_interval_file_range').html(makePreprocInterpolateTable(result.data, result.header_data));
				$('#tab_unit_file_range').html(makePreprocInterpolateTable(result.data, result.header_data));
				
				/*
	            $('#preProcInterpolateDatatable').DataTable( {
	            	"order": [[ 0, "asc" ]]
	            });
            	
	            $('#preProcInterpolateDatatable').DataTable( {
		        	 destroy: true,
		        	 autoWidth: false,
		        	 columnDefs: [
		        		    //{ "width": "15%", "targets": 0 }
		        		 { "width": "20%"}
		        	 ],
		             order: [[0, 'asc']]
	            });
	            */
	            $('#preProcInterpolateDatatable').DataTable( {
	            	"order": [[ 0, "asc" ]],
	            	"searching": false,  "info": false,  "lengthChange": false,  "autoWidth": false
	            });
	            
				var interpolateFilePath = $('#interpolateFilePath').val();
				if (interpolateFilePath.length > 0) {
					$('#tab_nan_table_range').hide();
					$('#tab_nan_table_complete_range').html(makePreprocNanFinishData(interpolateFilePath, modelSeq, indexTrgtCol));
				}
	            
	            /*
	    		$('#tab_missing_range').hide();
	    		$('#tab_outlier_range').hide();
	    		$('#tab_validate_range').hide();
	    		$('#tab_interval_range').show();
	    		$('#tab_conversion_range').hide();
	    		
	    		$('#tab_missing').attr('class','nav-link');
	    		$('#tab_outlier').attr('class','nav-link');
	    		$('#tab_validate').attr('class','nav-link');
	    		$('#tab_interval').attr('class','nav-link active');
	    		$('#tab_conversion').attr('class','nav-link');
	    		*/
            } else {
            	alert('API 내 에러 발생')
            }
		},
        error: function(xhr, status, error) {
            console.error('error : ', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}

function makePreprocInterpolateTable(data, header_data) {
	//console.log('---makePreprocInterpolateTable---');
	//console.log(data);
	
	var strHTML = '';
	strHTML += '					<span style="color: red;">현재 파일은 Missing Value에서 보간 처리 된 파일입니다.</span>';
	strHTML += '					<div class="table-responsive">';
	strHTML += '						<table class="table" id="preProcInterpolateDatatable">';
	strHTML += '							<thead>';
	strHTML += '								<tr>';
		$.each(header_data, function(i) {
			strHTML += '	<td>' + header_data[i].replace(/\"/gi, "") + '</td>';
		});	
	strHTML += '								</tr>';
	strHTML += '							</thead>';
	strHTML += '							<tbody>';
		for (var i = 0; i < data.length; i++) {
			strHTML += '   	<tr>';
			var obj = data[i];
			
			$.each(header_data, function(j) {					
				for (var key in obj) {
					var value = obj[key];

						if (header_data[j] == key) {
							strHTML += '           <td>' + value.replace(/\"/gi, "") + '</td>';
						}
				    //console.log(key + ': ' + value);
				}
			});	
			strHTML += '    </tr>';
		}
	strHTML += '							</tbody>';
	strHTML += '						</table>';
	strHTML += '					</div>';        	
	
	return strHTML;
	
}

function makePreprocResampleTable(data, header_data) {
	//console.log('---makePreprocInterpolateTable---');
	//console.log(data);
	
	var strHTML = '';
	strHTML += '					<span style="color: red;">현재 파일은 Interval Conversion에서 리샘플링 처리 된 파일입니다.</span>';
	strHTML += '					<div class="table-responsive">';
	strHTML += '						<table class="table" id="preProcInterpolateDatatable">';
	strHTML += '							<thead>';
	strHTML += '								<tr>';
		$.each(header_data, function(i) {
			strHTML += '	<td>' + header_data[i].replace(/\"/gi, "") + '</td>';
		});	
	strHTML += '								</tr>';
	strHTML += '							</thead>';
	strHTML += '							<tbody>';
		for (var i = 0; i < data.length; i++) {
			strHTML += '   	<tr>';
			var obj = data[i];
			
			$.each(header_data, function(j) {					
				for (var key in obj) {
					var value = obj[key];

						if (header_data[j] == key) {
							strHTML += '           <td>' + value.replace(/\"/gi, "") + '</td>';
						}
				    //console.log(key + ': ' + value);
				}
			});	
			strHTML += '    </tr>';
		}
	strHTML += '							</tbody>';
	strHTML += '						</table>';
	strHTML += '					</div>';        	
	
	return strHTML;
	
}

function makePreprocResample(interpolate_file_path, interpolateOption, resampleOption, resmpl_intvl_value, modelSeq) {
	//console.log('----makePreprocResample-----');
	var indexTrgtCol = $('#indexTrgtCol').val();
	
	/*
	var checkHeader = $('input[name="columnArr"]:checked').map(function() {return this.value;}).get();
	console.log('----checkHeader----');
	console.log(checkHeader);
	*/
	
	var checkHeader = [];
	$('input[name="columnArr"]:checked').each(function() {
		//console.log($('#preprocCheck' + $(this).val()).closest('tr').find('td:eq(1)').text())
		checkHeader.push($('#preprocCheck' + $(this).val()).closest('tr').find('td:eq(0)').text());
	});	
	//console.log(checkHeader);
	//if (interpolateOption.length == 0) {
	//	interpolateOption = 'linear';
	//}
	
	var data = {
			file_path: interpolate_file_path,
			method: interpolateOption,
			timerule: resampleOption,
			model_seq: modelSeq,
			index_trgt_col: indexTrgtCol,
			checkHeader: checkHeader,
			resmpl_intvl_value: resmpl_intvl_value
    }
	$.ajax({
		type: "POST",
		url: ' /ai/model/make/resample_set',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",	
		success : function(result)
		{									
            if (result.result_code == 200) {
            	//alert(result.result_code)
            	//console.log(result.interpolate_file_path);
            	//console.log(result.data);
            	//console.log(result.header_data);
            	
            	$('#resampleFilePath').val(result.resample_file_path);
            	$('#resampleOption').val(resampleOption);
            	
            	$('#tab_interval_file_range').html('');
            	
            	$('#prcsLevel').val('RESAMPLE');
            	
            	if (result.header_data !== undefined && result.header_data != '') {
            		$('#tab_interval_file_range').html(makePreprocResampleTable(result.data, result.header_data));
            		$('#tab_unit_file_range').html(makePreprocResampleTable(result.data, result.header_data));
            		
            	}
            	
				
	            //알고리즘 선택
	            //$('#algorithmOutputRange').html(makeAlgorithmOutput(result.data, result.header_data));
	            //$('#algorithmFeatureRange').html(makeAlgorithmFeature(result.data, result.header_data));
	            
            	
            	//$('#algorithmOutputRange').html(makeAlgorithmOutput(result.data, result.check_header_data));
	            //$('#algorithmFeatureRange').html(makeAlgorithmFeature(result.data, result.check_header_data));
            	
	            
	            
				/*
	            $('#preProcInterpolateDatatable').DataTable( {
	            	"order": [[ 0, "asc" ]]
	            });
            	*/
	            /*
            	console.log(result.correlation_file_path);
            	console.log(result.correlation_file_nm);
	            
            	var correlation_img = '/files' + result.correlation_file_path + result.correlation_file_nm
            	$("#correlation_img").attr("src", correlation_img);
	            */
	            
	            $('#preProcInterpolateDatatable').DataTable( {
		        	 destroy: true,
		        	 autoWidth: false,
		        	 columnDefs: [
		        		    //{ "width": "15%", "targets": 0 }
		        		 { "width": "40%"}
		        	 ],
		             order: [[0, 'asc']],
		             "searching": false,  "info": false,  "lengthChange": false,  "autoWidth": false
	            });
	            
	            //correlationView(result.correlation_data['data'],result.correlation_data['xdata'],result.correlation_data['ydata']);
	            
            } else {
            	alert('API 내 에러 발생')
            }
		},
        error: function(xhr, status, error) {
            console.error('error : ', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}


function makePreprocUnitHeader(header_data) {
	var indexTrgtCol = $('#indexTrgtCol').val();
	
	var strHTML = '';
	strHTML += '						<label>컬럼선택</label>';
	strHTML += '						<select class="w-100  unit-select-box" id="select_unit_target_col">';
		strHTML += '<option value="0">선택</option>';
		for (var i = 0; i < header_data.length; i++) {
				if (header_data[i].replace(/\"/gi, "") != indexTrgtCol) {
					strHTML += '<option value=' + header_data[i].replace(/\"/gi, "") + '>' + header_data[i].replace(/\"/gi, "") + '</option>';
				}
					
	    }
	strHTML += '						</select>';
	return strHTML;
}

function makePreprocOutlierHeader(header_data) {
	var indexTrgtCol = $('#indexTrgtCol').val();
	
	var strHTML = '';
	strHTML += '						<label>컬럼선택</label>';
	strHTML += '						<select class="w-100  unit-select-box" id="select_outlier_target_col">';
		strHTML += '<option value="0">선택</option>';
		for (var i = 0; i < header_data.length; i++) {
				if (header_data[i].replace(/\"/gi, "") != indexTrgtCol) {
					strHTML += '<option value=' + header_data[i].replace(/\"/gi, "") + '>' + header_data[i].replace(/\"/gi, "") + '</option>';
				}
					
	    }
	strHTML += '						</select>';
	return strHTML;
}

function makePreprocValidHeader(header_data) {
	var indexTrgtCol = $('#indexTrgtCol').val();
	
	var strHTML = '';
	strHTML += '						<label>컬럼선택</label>';
	strHTML += '						<select class="w-100  unit-select-box" id="select_valid_target_col">';
		strHTML += '<option value="0">선택</option>';
		for (var i = 0; i < header_data.length; i++) {
				if (header_data[i].replace(/\"/gi, "") != indexTrgtCol) {
					strHTML += '<option value=' + header_data[i].replace(/\"/gi, "") + '>' + header_data[i].replace(/\"/gi, "") + '</option>';
				}
					
	    }
	strHTML += '						</select>';
	return strHTML;
}

function makePreprocUnit(file_path, origin_file_path, modelSeq, unit_target_col, unit_tp, unit_cd1, unit_cd2) {
	//console.log('----makePreprocResample-----');
	var indexTrgtCol = $('#indexTrgtCol').val();
	/*
	var checkHeader = $('input[name="columnArr"]:checked').map(function() {return this.value;}).get();
	console.log('----checkHeader----');
	console.log(checkHeader);
	*/
	
	var checkHeader = [];
	$('input[name="columnArr"]:checked').each(function() {
		//console.log($('#preprocCheck' + $(this).val()).closest('tr').find('td:eq(1)').text())
		checkHeader.push($('#preprocCheck' + $(this).val()).closest('tr').find('td:eq(0)').text());
	});	
	//console.log(checkHeader);
	//if (interpolateOption.length == 0) {
	//	interpolateOption = 'linear';
	//}
	
	var data = {
			file_path: file_path,
			origin_file_path: origin_file_path,
			model_seq: modelSeq,
			index_trgt_col: indexTrgtCol,
			checkHeader: checkHeader,
			unit_target_col: unit_target_col,
			unit_tp: unit_tp,
			unit_seq: unit_cd1
    }
	$.ajax({
		type: "POST",
		url: ' /ai/model/make/unit_set',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",	
		success : function(result)
		{									
            if (result.result_code == 200) {
            	$('#unitFilePath').val(result.unit_file_path);
            	
            	$('#tab_unit_file_range').html('');
            	
            	$('#prcsLevel').val('UNIT');
            	
            	if (result.header_data !== undefined && result.header_data != '') {
            		$('#tab_unit_file_range').html(makePreprocUnitTable(result.data, result.header_data));	
            	}
				
	            $('#preProcUnitDatatable').DataTable( {
		        	 destroy: true,
		        	 autoWidth: false,
		        	 columnDefs: [
		        		    //{ "width": "15%", "targets": 0 }
		        		 { "width": "20%"}
		        	 ],
		             order: [[0, 'asc']]
	            });
            } else {
            	alert('API 내 에러 발생')
            }
		},
        error: function(xhr, status, error) {
            console.error('error : ', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}



function makePreprocUnitTable(data, header_data) {
	//console.log('---makePreprocInterpolateTable---');
	//console.log(data);
	
	var strHTML = '';
	strHTML += '				<span style="color: red;">현재 파일은 Unit Conversion에서 단위 변환 된 파일입니다.</span>';
	strHTML += '				<div class="table-responsive">';
	strHTML += '					<table class="table" id="preProcUnitDatatable">';
	strHTML += '						<thead>';
	strHTML += '							<tr>';
		$.each(header_data, function(i) {
			strHTML += '	<td>' + header_data[i].replace(/\"/gi, "") + '</td>';
		});	
	strHTML += '							</tr>';
	strHTML += '						</thead>';
	strHTML += '						<tbody>';
		for (var i = 0; i < data.length; i++) {
			strHTML += '   	<tr>';
			var obj = data[i];
			
			$.each(header_data, function(j) {					
				for (var key in obj) {
					var value = obj[key];

						if (header_data[j] == key) {
							strHTML += '           <td>' + value.replace(/\"/gi, "") + '</td>';
						}
				    //console.log(key + ': ' + value);
				}
			});	
			strHTML += '    </tr>';
		}
	strHTML += '						</tbody>';
	strHTML += '					</table>';
	strHTML += '				</div>';  	
	
	return strHTML;
	
}

function makeAlgorithm(file_path, modelSeq) {
	//console.log('----makePreprocResample-----');
	var indexTrgtCol = $('#indexTrgtCol').val();
	
	var defaultResmplIntvlTp =  $('#defaultResmplIntvlTp').val();
	var defaultResmplIntvlValue =  $('#defaultResmplIntvlValue').val();

	/*
	var checkHeader = $('input[name="columnArr"]:checked').map(function() {return this.value;}).get();
	console.log('----checkHeader----');
	console.log(checkHeader);
	*/
	
	var checkHeader = [];
	$('input[name="columnArr"]:checked').each(function() {
		//console.log($('#preprocCheck' + $(this).val()).closest('tr').find('td:eq(1)').text())
		checkHeader.push($('#preprocCheck' + $(this).val()).closest('tr').find('td:eq(0)').text());
	});	
	//console.log(checkHeader);
	
	
	var data = {
			file_path: file_path,
			model_seq: modelSeq,
			index_trgt_col: indexTrgtCol,
			checkHeader: checkHeader,
			defaultResmplIntvlTp : defaultResmplIntvlTp,
			defaultResmplIntvlValue : defaultResmplIntvlValue
    }
	$.ajax({
		type: "POST",
		url: ' /ai/model/make/algorithm_set',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",	
		success : function(result)
		{									
            if (result.result_code == 200) {
	            //알고리즘 선택
	            //$('#algorithmOutputRange').html(makeAlgorithmOutput(result.data, result.header_data));
	            //$('#algorithmFeatureRange').html(makeAlgorithmFeature(result.data, result.header_data));
	            $('#algorithmOutputRange').html(makeAlgorithmOutput(result.data, result.check_header_data));
	            $('#algorithmFeatureRange').html(makeAlgorithmFeature(result.data, result.check_header_data));
           	
	            correlationView(result.correlation_data['data'],result.correlation_data['xdata'],result.correlation_data['ydata']);
	            
            } else {
            	alert('API 내 에러 발생')
            }
		},
        error: function(xhr, status, error) {
            console.error('error : ', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}


function makeAlgorithmMetaItemList(model_algrm_seq, model_seq) {
	//console.log('----makePreprocResample-----');
	$('#algorithm_meta_item_list').html('');
	var data = {
			model_algrm_seq: model_algrm_seq,
			model_seq: model_seq
    }
	$.ajax({
		type: "POST",
		url: ' /ai/model/make/algorithm_meta_set',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",	
		success : function(result)
		{									
            if (result.result_code == 200) {
            	$('#algorithm_meta_set').val(JSON.stringify(result.algorithm_meta_item_list))
            	
            	var strHTML = '';
            	var item_list = result.algorithm_meta_item_list;
            	var loss_list = result.meta_item_loss_list;
            	var meterics_list = result.meta_item_meterics_list;
            	var optimizer_list = result.meta_item_optimizer_list;
            	
            	
            	
            	strHTML += '					<h4 class="card-title">모델 파라미터</h4>';
            	
            	for (var i = 0; i < item_list.length; i++) {
            		
            		strHTML += '					<div class="form-group row">';
            		strHTML += '						<div class="col-lg-3">';
            		strHTML += '							<label class="col-form-label">' + item_list[i].model_params_item +'</label>';
            		strHTML += '						</div>';
            		
            		
            		
            		if (item_list[i].model_params_item_tp != 'string') {
            			//console.log(item_list[i].model_params_item);
            			
            					strHTML += '						<div class="col-lg-8">';
		                		if(item_list[i].model_params_item_value == null || item_list[i].model_params_item_value == '') {
		                			if (item_list[i].model_params_item == 'testSize') {
		                				strHTML += '			<input type="range" class="form-control" min="0.1" max="0.9"  step="0.1" id="customRange" value="0.2">';
		                				strHTML += '			<input type="number" id="' + item_list[i].model_params_item + '" class="form-control custom-number-range number_only" min="0.1" max="0.9" value="0.2" readonly="readonly" style="margin-left: 10px;">';			                				
		                				
		                				
		                			} else {
		                				if (item_list[i].model_params_item == 'windowSize') {
		                					strHTML += '			<input type="number" class="form-control number_only" id="' + item_list[i].model_params_item + '" placeholder="" value="10" required="required">';	
		                				}
		                				if (item_list[i].model_params_item == 'batchSize') {
		                					strHTML += '			<input type="number" class="form-control number_only" id="' + item_list[i].model_params_item + '" placeholder=""  value="16" required="required">';
		                				}
		                				if (item_list[i].model_params_item == 'epochs') {
		                					strHTML += '			<input type="number" class="form-control number_only" id="' + item_list[i].model_params_item + '" placeholder=""  value="50" required="required">';
		                				}
		                				if (item_list[i].model_params_item == 'dataSize') {
		                					strHTML += '			<input type="number" class="form-control number_only" id="' + item_list[i].model_params_item + '" placeholder=""  value="100" required="required">';
		                					strHTML += '			<br/><span  style="color: red;">' + item_list[i].model_params_derpn + '</span>';
		                				}
		                				if (item_list[i].model_params_item == 'optimizerLr') {
		                					strHTML += '			<input type="number" class="form-control optimizer-number-chk" id="' + item_list[i].model_params_item + '" placeholder=""  value="0.0005" required="required">';
		                					//strHTML += '			<br/><span  style="color: red;">' + item_list[i].model_params_derpn + '</span>';
		                				}
		                					
		                			}
		                				
		                		} else {
		                			if (item_list[i].model_params_item == 'testSize') {
		                				strHTML += '			<input type="range" class="form-control" min="0.1" max="0.9"  step="0.1" id="customRange" value="0.2">';
		                				strHTML += '			<input type="number" id="' + item_list[i].model_params_item + '" value= "' + item_list[i].model_params_item_value + '" class="form-control custom-number-range number_only" min="0.1" max="0.9" value="0.2" readonly="readonly" style="margin-left: 10px;">';		                				
		                				
		                			} else {
		                				strHTML += '			<input type="number" class="form-control number_only" id="' + item_list[i].model_params_item + '" value= "' + item_list[i].model_params_item_value + '" placeholder="" required="required">';	
		                			}
		                			
		                		} 
                				strHTML += '						</div>';
            		} 
            		else {
            			if (item_list[i].model_params_item == 'loss') {
            				strHTML += '						<div class="col-lg-8">';
                    		strHTML += '					<select class="select" id="' + item_list[i].model_params_item + '">';
	                    		for (var j = 0; j < loss_list.length; j++) {
	                    			if(item_list[i].model_params_item_value == null || item_list[i].model_params_item_value == '') {
	                    				strHTML += '<option value=' + loss_list[j].dtl_cd + '>' + loss_list[j].dtl_cd_nm + '</option>';	
	                    			} else {
	                    				if (item_list[i].model_params_item_value == loss_list[j].dtl_cd) {
	                    					strHTML += '<option selected value=' + loss_list[j].dtl_cd + '>' + loss_list[j].dtl_cd_nm + '</option>';	
	                    				} else {
	                    					strHTML += '<option value=' + loss_list[j].dtl_cd + '>' + loss_list[j].dtl_cd_nm + '</option>';
	                    				}
	                    			}
	                    				
	                    		}
                    		strHTML += '					</select>';
                    		strHTML += '						</div>';
            				
            			}

            			if (item_list[i].model_params_item == 'meterics') {
            				strHTML += '						<div class="col-lg-8">';
                    		strHTML += '					<select class="select" id="' + item_list[i].model_params_item + '">';
	                    		for (var k = 0; k < meterics_list.length; k++) {
	                    			if(item_list[i].model_params_item_value == null || item_list[i].model_params_item_value == '') {
	                    				strHTML += '<option value=' + meterics_list[k].dtl_cd + '>' + meterics_list[k].dtl_cd_nm + '</option>';	
	                    			} else {
	                    				if (item_list[i].model_params_item_value == meterics_list[k].dtl_cd) {
	                    					strHTML += '<option selected value=' + meterics_list[k].dtl_cd + '>' + meterics_list[k].dtl_cd_nm + '</option>';	
	                    				} else {
	                    					strHTML += '<option value=' + meterics_list[k].dtl_cd + '>' + meterics_list[k].dtl_cd_nm + '</option>';	
	                    				}
	                    			}
	                    				
	                    		}
                    		strHTML += '					</select>';
                    		strHTML += '						</div>';
            				
            			}
            			
            			if (item_list[i].model_params_item == 'optimizer') {
            				strHTML += '						<div class="col-lg-8">';
                    		strHTML += '					<select class="select" id="' + item_list[i].model_params_item + '">';
	                    		for (var l = 0; l < optimizer_list.length; l++) {
	                    			if(item_list[i].model_params_item_value == null || item_list[i].model_params_item_value == '') {
	                    				strHTML += '<option value=' + optimizer_list[l].dtl_cd + '>' + optimizer_list[l].dtl_cd_nm + '</option>';	
	                    			} else {
	                    				if (item_list[i].model_params_item_value == optimizer_list[l].dtl_cd) {
	                    					strHTML += '<option selected value=' + optimizer_list[l].dtl_cd + '>' + optimizer_list[l].dtl_cd_nm + '</option>';	
	                    				} else {
	                    					strHTML += '<option value=' + optimizer_list[l].dtl_cd + '>' + optimizer_list[l].dtl_cd_nm + '</option>';
	                    				}
	                    			}
	                    				
	                    		}
                    		strHTML += '					</select>';
                    		strHTML += '						</div>';
            				
            			}
            		}
            		
            		
            		strHTML += '					</div>';
            		
            		
            	}
            	
            	
				$('#algorithm_meta_item_list').html(strHTML);
	            
            	
            }
		},
        error: function(xhr, status, error) {
            console.error('error : ', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}


function resetProcTargetFileList(form_type, modelSeq, refTp) {
	var data = {
			modelSeq: modelSeq,
			refTp: refTp
    }
	$.ajax({
		type: "POST",
		url: ' /ai/model/make/reset_proc_target_file',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",	
		success : function(result)
		{									
            if (result.result_code == 200) {
	            if (refTp == 'RESAMPLE') {
	            	$('#resampleFilePath').val('');
	            	$('#unitFilePath').val('');
	            }
	            if (refTp == 'UNIT') {
	            	$('#unitFilePath').val('');
	            }
	            if (refTp == 'OUTLIER') {
	            	$('#outLierFilePath').val('');
	            	$('#interpolateFilePath').val('');
	            	$('#resampleFilePath').val('');
	            	$('#unitFilePath').val('');
	            }
	            if (refTp == 'VALIDATE') {
	            	$('#validateFilePath').val('');
	            	$('#outLierFilePath').val('');
	            	$('#interpolateFilePath').val('');
	            	$('#resampleFilePath').val('');
	            	$('#unitFilePath').val('');
	            }	            
	            
	            if (form_type == 'I') {
	            	var redirectUrl = contextPath + '/ai/model/'+ $('#modelSeq').val() +'?page=1&size=10&year=&field=&keyword=&sortName=&sortType=&menuCd=M0101';        	
	            	window.location.href = redirectUrl;
	            } else {
	            	window.location.reload();
	            }
                
	            
            } else {
            	alert('API 내 에러 발생')
            }
		},
        error: function(xhr, status, error) {
            console.error('error : ', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}

function getCsvIndexColumnTerm(dataString, index_col) {
	//console.log(dataString);
	const data = JSON.parse(dataString);
	
	const validation_count = data.data.validation_count;
	const deltaList = data.data.delta; // "delta"를 리스트로 추출
	const countList = data.data.count; // "count"를 리스트로 추출

	var resultType='';
	var resultTimeTerm=0;
	
	
    // "count" 배열에서 최대값과 해당 인덱스를 찾기
    var maxCount = Math.max.apply(null, data.data.count);
    var maxCountIndex = data.data.count.indexOf(maxCount);
    
    // 해당 인덱스를 사용하여 "delta" 배열에서 값을 가져오기
    var deltaValue = data.data.delta[maxCountIndex];

	var defaultResmplIntvlTp;
	var defaultResmplIntvlValue;
	
	
	if (deltaValue >= 1 && deltaValue < 60) {
		resultTimeTerm = Math.floor(deltaValue % 60);
		$('#defaultResmplIntvlTp').val('S');
		$('#defaultResmplIntvlValue').val(resultTimeTerm);
	}  else if (deltaValue >= 60 && deltaValue < 3600) {
		resultTimeTerm = Math.floor(deltaValue / 60);
		$('#defaultResmplIntvlTp').val('T');
		$('#defaultResmplIntvlValue').val(resultTimeTerm);
	}  else if (deltaValue >= 3600 && deltaValue < 86400) {
		resultTimeTerm = Math.floor(deltaValue / 3600);
		$('#defaultResmplIntvlTp').val('H');
		$('#defaultResmplIntvlValue').val(resultTimeTerm);
	}  else if (deltaValue >= 86400 && deltaValue < 2505600) {
		resultTimeTerm = Math.floor(deltaValue / 86400);
		$('#defaultResmplIntvlTp').val('D');
		$('#defaultResmplIntvlValue').val(resultTimeTerm);
	}  else if (deltaValue >= 2505600 && deltaValue < 31536000) {
		resultTimeTerm = Math.floor(deltaValue / 2592000);
		$('#defaultResmplIntvlTp').val('M');
		$('#defaultResmplIntvlValue').val(resultTimeTerm);
	}  else if (deltaValue >= 31536000 && deltaValue < 31536000) {
		//console.log('-------31536000-------')
		$('#defaultResmplIntvlTp').val('Y');
		$('#defaultResmplIntvlValue').val(resultTimeTerm);
	} else {
		$('#defaultResmplIntvlTp').val('D');
		$('#defaultResmplIntvlValue').val(resultTimeTerm);
	}	
	
	//Y:년도, Q:분기, M:월, D:일, H:시
	//resmpl_intvl_tp
	//resmpl_intvl_value
	
	//alert(Number(validation_count))
	if (Number(validation_count) > 1) {
		resultType='불분명';
	} else {
		//console.log(deltaList[1]);
		
		if (deltaList[1] >= 1 && deltaList[1] < 60) {
			resultTimeTerm = Math.floor(deltaList[1] % 60);
			resultType= resultTimeTerm + '초 단위';
		}  else if (deltaList[1] >= 60 && deltaList[1] < 3600) {
			resultTimeTerm = Math.floor(deltaList[1] / 60);
			resultType= resultTimeTerm + '분 단위';
		}  else if (deltaList[1] >= 3600 && deltaList[1] < 86400) {
			resultTimeTerm = Math.floor(deltaList[1] / 3600);
			resultType=resultTimeTerm + '시간 단위';
		}  else if (deltaList[1] >= 86400 && deltaList[1] < 2505600) {
			resultTimeTerm = Math.floor(deltaList[1] / 86400);
			resultType=resultTimeTerm + '일 단위';
		}  else if (deltaList[1] >= 2505600 && deltaList[1] < 31536000) {
			resultTimeTerm = Math.floor(deltaList[1] / 2592000);
			resultType=resultTimeTerm + '개월 단위';
		}  else if (deltaList[1] >= 31536000 && deltaList[1] < 31536000) {
			//console.log('-------31536000-------')
			resultTimeTerm = Math.floor(deltaList[1] / 31536000);
			resultType=resultTimeTerm + '년 단위';
		} else {
			resultType='불분명';
		}

	}
	
	return resultType
}

function checkCsvIndexColumnTerm(data, index_col) {
	//console.log(data)
	var randomDates = [];
	var randomIndex = 1;
	
	//console.log(data.length);
	for (var i = 0; i < 3; i++) {
		randomIndex = Math.floor(Math.random() * data.length - 1) + 1;
		//console.log(randomIndex);
		
		if (randomIndex < data.length - 1) {
			var date1 = data[randomIndex][index_col];
		    var date2 = data[randomIndex + 1][index_col];
		    
		    randomDates.push(date1);
		    randomDates.push(date2);
		}
	}
	
	//console.log(randomDates)
	
	var start_date1 = new Date(randomDates[0]);
	var end_date1 = new Date(randomDates[1]);
	
	var start_date2 = new Date(randomDates[2]);
	var end_date2 = new Date(randomDates[3]);
	
	var start_date3 = new Date(randomDates[4]);
	var end_date3 = new Date(randomDates[5]);
	
	/*
	console.log('-------start_date1-------')
	console.log(start_date1)
	console.log(end_date1)
	
	console.log('-------start_date2-------')
	console.log(start_date2)
	console.log(end_date2)
	
	console.log('-------start_date3-------')
	console.log(start_date3)
	console.log(end_date3)
	*/
	//var time_difference_minutes = (end_date - start_date) / (1000 * 60);
	
	var time_difference_second1 = (end_date1 - start_date1) / (1000);
	var time_difference_second2 = (end_date2 - start_date2) / (1000);
	var time_difference_second3 = (end_date3 - start_date3) / (1000);
	
	//console.log("date 간격 단위: " + time_difference_minutes + "분");    
	
	var time_arr = [];
	time_arr.push(time_difference_second1);
	time_arr.push(time_difference_second2);
	time_arr.push(time_difference_second3);
	
	var uniqueArray = $.unique(time_arr);
	//console.log(uniqueArray);
	
	var resultType='';
	var resultTimeTerm=0;
	
	if (uniqueArray.length > 2) {
		resultType='불분명';
	} else {
		//console.log(uniqueArray[0]);
		
		if (uniqueArray[0] >= 1 && uniqueArray[0] < 60) {
			resultTimeTerm = Math.floor(uniqueArray[0] % 60);
			resultType= resultTimeTerm + '초 단위';
		}  else if (uniqueArray[0] >= 60 && uniqueArray[0] < 3600) {
			resultTimeTerm = Math.floor(uniqueArray[0] / 60);
			resultType= resultTimeTerm + '분 단위';
		}  else if (uniqueArray[0] >= 3600 && uniqueArray[0] < 86400) {
			resultTimeTerm = Math.floor(uniqueArray[0] / 3600);
			resultType=resultTimeTerm + '시간 단위';
		}  else if (uniqueArray[0] >= 86400 && uniqueArray[0] < 2505600) {
			resultTimeTerm = Math.floor(uniqueArray[0] / 86400);
			resultType=resultTimeTerm + '일 단위';
		}  else if (uniqueArray[0] >= 2505600 && uniqueArray[0] < 31536000) {
			resultTimeTerm = Math.floor(uniqueArray[0] / 2592000);
			resultType=resultTimeTerm + '개월 단위';
		}  else if (uniqueArray[0] >= 31536000 && uniqueArray[0] < 31536000) {
			//console.log('-------31536000-------')
			resultTimeTerm = Math.floor(uniqueArray[0] / 31536000);
			resultType=resultTimeTerm + '년 단위';
		} else {
			resultType='불분명';
		}
	}
	
	//console.log('-------resultType-------')
	//console.log(resultType);
	
	
	//1년 31536000
	//1월 2505600
	//1일 86400
	//1시 3600
	//1분 60
	//1초 1
	
	return resultType;
	
	
	
	
	


/*
console.log('==========================================');
var data = {
		  "dates": [
		    "2023-05-01 00:00",
		    "2023-05-01 01:00",
		    "2023-05-01 02:00",
		    "2023-05-01 04:00",
		    "2023-05-01 05:00",
		    "2023-05-01 07:00",
		    "2023-05-01 08:00",
		    "2023-05-01 09:00"
		    // ...
		  ]
};

// 인덱스 컬럼이 "dates"인 경우
var indexColumn = 'dates';

// 시간 간격 확인
var timeDiff = [];
for (var i = 1; i < data[indexColumn].length; i++) {
  if (data[indexColumn][i] !== '' && data[indexColumn][i - 1] !== '') {
    var currDate = new Date(data[indexColumn][i]);
    var prevDate = new Date(data[indexColumn][i - 1]);
    var diff = currDate.getTime() - prevDate.getTime();
    timeDiff.push(diff);
  }
}

console.log(timeDiff);
console.log('==========================================');
*/

		
	
}


function validationForm() {
    return true;
}

