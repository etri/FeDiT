(function() {
    'use strict'	
    $(document).ready(function() {
    	
        //attachFiles
       	$("#attachFilesCsv").on('change', function(e){
        	chgAddFilePc($(this),e);
        });
    	
       	function chgAddFilePc(obj, e){
       		
       		var fileValue = obj.val().split("\\");
       		var fileName = fileValue[fileValue.length-1]; // 파일명
       		var ext = fileName.substring(fileName.lastIndexOf('.') + 1, fileName.length);
       		ext = ext.toLowerCase();
       		
       		if( ext != 'csv'){
       			alert("확장자가 csv인  파일만 첨부가능합니다.");
       			window.location.reload();
       			/*
       			
       			obj.closest('div.attach-file').remove();
                //$(this).closest('div.attach-file').remove();
                if ($('.attach-file-group .attach-file').length === 0) {
                    addFileRow();
                }
                */
       		} else {
       			uploadFile();
       		}
       		
       		/*
       		if( ext == 'csv'){
       			$("#addfileViewPc").show(); 
       			$("#preViewImgRowPc").show(); 
       		 	//alert(e.target.result);
       		 	var bannerFiles = e.target.files;
       		 	console.log("bannerFiles",bannerFiles);
       		 	//이미지 미리보기
       		 	var reader = new FileReader();
       		 	reader.onload = function(e){
       	 	  		$("#addfileViewPc").attr("src", e.target.result);
       		 	}
       		 	reader.readAsDataURL(bannerFiles[0]);
       		 	$("#pcFileName").val(fileName);
       		}else{
       			alert("확장자가 csv인  파일만 첨부가능합니다.");
                $(this).closest('div.attach-file').remove();
                if ($('.attach-file-group .attach-file').length === 0) {
                    addFileRow();
                }
       		}
       		*/
       	}    	
     
        
        $(document).on('click', '.btn-delete-upload', function() {
            $(this).closest('div.attach-file').remove();
            if ($('.attach-file-group .attach-file').length === 0) {
            	addFileRow()
            }
        });

        $(document).on('click', '.next-preproc', function() {
        	var modelNm = $('#modelNm').val();
        	var fileCheck = document.getElementById("attachFilesCsv").value;
        	
	    	if (modelNm.length == 0) {
	    		alert('모델명을 입력하세요');
	    		return false;
	    	}
			
    	    if(!fileCheck){
    	        alert("파일을 업로드해 주세요");
    	        return false;
    	    }
	    	
    	    var con = confirm('데이터 전처리 페이지로 이동합니다.');
	    	if (con == true) {
	    		 insertModel();
	    	} else {
	    		return false;
	    	}	
    	   
    	    
           
        });
        
        
        $(document).on('change', '#chkAll', function() {
        //$('#chkAll').on('change', function(e) {
            $('input[name="columnArr"]').attr('checked', $(this).is(':checked'));
        });
        
        $(document).on('change', '#preproc_statistics', function() {
        	var preproc_statistics = $("#preproc_statistics option:selected").val();
        	
        	var encodedData = $("#jsonData").val();
        	var jsonString = decodeURIComponent(encodedData);
        	var jsonData = JSON.parse(jsonString);
        	
        	makePreprocStatisticsTable(jsonData, preproc_statistics);
            
        });
        
        $(document).on('change', '#preproc_histogram', function() {
        	var preproc_statistics = $("#preproc_histogram option:selected").val();
        	
        	var encodedData = $("#jsonData").val();
        	var jsonString = decodeURIComponent(encodedData);
        	var jsonData = JSON.parse(jsonString);
        	
        	makePreprocHistogramTable(jsonData, preproc_statistics);
        });
        
        
        $(document).on('click', '.make-model', function() {
        	var algorithm = $('#algorithm option:selected').val();
        	var window_size = $('#window_size').val();
	    	var batch_size = $('#batch_size').val();
	    	var epochs = $('#epochs').val();
	    	var valid_rate = $('#valid_rate').val();
	    	var loss = $('#loss option:selected').val();
	    	var meterics = $('#meterics option:selected').val();
	    	var optimizer = $('#optimizer option:selected').val();
	    	var file_list = $('#fileList').val();
	    	//var output_col = $('input:radio[name="outputCol"]:checked').val() 
	    	var output_col = $('input:radio[name="outputCol"]:checked').map(function() {return this.value;}).get();
	    	var feature_col = $('input[name="featureCol"]:checked').map(function() {return this.value;}).get();
	    	
	    	
	    	if (typeof output_col === 'undefined') {
	    		alert('종속변수를 선택하세요');
	    		return false;
	    	}
	    	
	    	if (window_size.length == 0) {
	    		alert('window_size를 입력하세요');
	    		return false;
	    	}
	    	if (batch_size.length == 0) {
	    		alert('batch_size를 입력하세요');
	    		return false;
	    	}
	    	if (epochs.length == 0) {
	    		alert('epochs를 입력하세요');
	    		return false;
	    	}
	    	if (valid_rate.length == 0) {
	    		alert('valid_rate를 입력하세요');
	    		return false;
	    	}
	    	if (file_list.length == 0) {
	    		alert('업로드된 파일이 없습니다.');
	    		return false;
	    	}
	    	
	    	if ($.inArray(output_col, feature_col) > -1) {
	    		alert('종속변수와 독립변수는 중복으로 선택 할 수 없습니다.');
	    		return false;
	    	}
	    	
	    	
	    	var confirm_comment;
	    	
	    	if (feature_col.length == 0) {
	    		confirm_comment = '독립변수를 체크 하지 않을 경우 종속변수만 적용되어 모델이 생성됩니다.등록 하시겠습니까?';
	    	} else {
	    		confirm_comment = '등록 하시겠습니까?';
	    	}
	    	
	    	var con = confirm(confirm_comment);
	    	if (con == true) {
	    		var data = {
	    				algorithm: algorithm,
		        		window_size: window_size,
		        		batch_size: batch_size,
		        		epochs: epochs,
		        		valid_rate: valid_rate,
		        		loss: loss,
		        		meterics: meterics,
		        		optimizer: optimizer,
		        		file_list: file_list,
		        		output_col: output_col,
		        		feature_col: feature_col
		        }
		    	$.ajax({
					type: "POST",
					url: ' /augment/model/make/model_set',
		            data: JSON.stringify(data),
		            contentType: "application/json; charset=utf-8;",
		            dataType: "json",	
		    		success : function(result)
		    		{									
		                if (result.result_code == 200) {
		                	alert(result.result_code)
		                }
		    		},
		            error: function(xhr, status, error) {
		                console.error('error : ', error);
		                alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
		            }
		        });
	    	} else {
	    		return false;
	    	}	
	    	
	        
        	
        });
        
        
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
    });

})();


function uploadFile(){
    
    var form = $('#editForm')[0];
    //console.log(form)
    var formData = new FormData(form);
    //formData.append('file', $('#attachFiles')[0].files[0]);
    $('#loading').show();
    $.ajax({
    	type: 'POST',
        //enctype: 'multipart/form-data',
        url: '/augment/model/csvFileUpload',
        data: formData,
        processData: false,
        contentType: false,    	
		success : function(result)
		{									
            if (result.result_code == 200) {
            	//console.log(result.header_data)
            	//console.log(result.data)
            	
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
    //console.log(form)
    var formData = new FormData(form);
    //formData.append('file', $('#attachFiles')[0].files[0]);
    //$('#loading').show();
    $.ajax({
    	type: 'POST',
        //enctype: 'multipart/form-data',
        url: '/augment/model/insertModel',
        data: formData,
        processData: false,
        contentType: false,    	
		success : function(result)
		{									
            if (result.result_code == 200) {
            	//console.log(result.header_data)
            	//console.log(result.data)
            	console.log('-------header_data---------')
            	console.log(result.header_data)
            	console.log('-------data---------')
            	console.log(result.data)
            	console.log('--------columnsNode--------')
            	console.log(result.columnsNode)
            	console.log('--------infosNode---------')
            	var infoNode = JSON.parse(result.infoNode);
            	console.log(infoNode)
            	console.log('--------rangeNode---------')
            	var rangeNode = JSON.parse(result.rangeNode);
            	console.log(rangeNode)
            	console.log('--------histImg---------')
            	console.log(result.histImg)
            	
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
	            
	            
	            
	            //변경 전 임시
	            //전처리 상단 데이터
				$('#preProcDataRange').html(makePreprocData(result.data, result.header_data));
	            $('#preProcDatatable').DataTable( {
		        	 destroy: true,
		        	 autoWidth: false,
		        	 columnDefs: [
		        		    //{ "width": "15%", "targets": 0 }
		        		 { "width": "20%"}
		        	 ],
		             order: [[0, 'asc']]
	            });
	            
	            
	            //전처리 중간 statics
	            $('#preProcStatisticsRange').html(makePreprocStatistics(result.data, result.header_data));
	            
	            //전처리  중간 histogrma
	            $('#preProcHistogramRange').html(makePreprocHistogram(result.data, result.header_data));
	            
	            //전처리 하단 탭처리
	            $('#tab_missing_range').html(makePreprocMissingValue(result.data, result.header_data));
				
	            
	            //알고리즘 선택
	            $('#algorithmOutputRange').html(makeAlgorithmOutput(result.data, result.header_data));
	            $('#algorithmFeatureRange').html(makeAlgorithmFeature(result.data, result.header_data));
	            
	            
	            var jsonString = JSON.stringify(result.data);
	            var encodedData = encodeURIComponent(jsonString);
	            $("#jsonData").val(encodedData);
	            
	            
	            
	    		$('#tab_getdata_range').hide();
	    		$('#tab_preproc_range').show();
	    		
	    		$('#tab_getalgo_range').hide();
	    		$('#tab_getalgo_range_top').hide();
	    		$('#tab_getalgo_range_bottom').hide();
	    		
	    		$('#tab_excmodel_range').hide();
	    		$('#tab_savemodel_range').hide();
	    		
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




function uploadFileBak(){
    
    var form = $('#editForm')[0];
    //console.log(form)
    var formData = new FormData(form);
    //formData.append('file', $('#attachFiles')[0].files[0]);
    $('#loading').show();
    $.ajax({
    	type: 'POST',
        //enctype: 'multipart/form-data',
        url: '/augment/model/csvFileUpload',
        data: formData,
        processData: false,
        contentType: false,    	
		success : function(result)
		{									
            if (result.result_code == 200) {
            	console.log(result.header_data)
            	console.log(result.data)
            	
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
	            $('#loading').hide();
				
				//전처리 상단 데이터
	            $('#preProcDataRange').html(makePreprocData(result.data, result.header_data));
				
				
				
				
				
	            $('#preProcDatatable').DataTable( {
		        	 destroy: true,
		        	 autoWidth: false,
		        	 columnDefs: [
		        		    //{ "width": "15%", "targets": 0 }
		        		 { "width": "20%"}
		        	 ],
		             order: [[0, 'asc']]
	            });
	            
	            
	            //전처리 중간 statics
	            $('#preProcStatisticsRange').html(makePreprocStatistics(result.data, result.header_data));
	            
	            //전처리  중간 histogrma
	            $('#preProcHistogramRange').html(makePreprocHistogram(result.data, result.header_data));
	            
	            //전처리 하단 탭처리
	            $('#tab_missing_range').html(makePreprocMissingValue(result.data, result.header_data));
				
	            
	            //알고리즘 선택
	            $('#algorithmOutputRange').html(makeAlgorithmOutput(result.data, result.header_data));
	            $('#algorithmFeatureRange').html(makeAlgorithmFeature(result.data, result.header_data));
	            
	            
	            var jsonString = JSON.stringify(result.data);
	            var encodedData = encodeURIComponent(jsonString);
	            $("#jsonData").val(encodedData);
	            $("#fileList").val(result.file_list);
	            
	            
            }
		},
        error: function(xhr, status, error) {
            console.error('error : ', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}

function minValue(data, col) {
	//console.log(data)
	var result;
	var targetKey = col;
	const datas = data.map((node) => node[targetKey]).filter((value) => !isNaN(value));
	//console.log(datas)
	//console.log(Math.max.apply(null, datas))
	
	return Math.min.apply(null, datas)
	
	/*
	return {
		min: Math.min(...datas),
		max: Math.max(...datas)
	}
	*/
	
}

function countValue(data, col) {
	//var jsonString = JSON.stringify(data);
	//var jsonParse = JSON.parse(jsonString);
	var targetKey = col;
	const datas = data.map((node) => node[targetKey]);
	//console.log(datas);
	return datas.length
}

function maxValue(data, col) {
	//var jsonString = JSON.stringify(data);
	//var jsonParse = JSON.parse(jsonString);
	
	var result;
	var targetKey = col;
	const datas = data.map((node) => node[targetKey]).filter((value) => !isNaN(value));
	//console.log(datas);
	return Math.max.apply(null, datas)
}

function onlyValue(data, col) {
	var targetKey = col;
	const datas = data.map((node) => node[targetKey]).filter((value) => !isNaN(value));
	
	const duplicates = datas.filter((value, index) => datas.indexOf(value) !== index);;
	const result = datas.filter(value => !duplicates.includes(value));
	
	return result.length
	
}

function dupValue(data, col) {
	var targetKey = col;
	const datas = data.map((node) => node[targetKey]).filter((value) => !isNaN(value));
	
	const uniqueDatas = new Set(datas);
	const result = datas.length - uniqueDatas.size;
	
	return result
	
}

function nanValue(data, col) {
	var result;
	var targetKey = col;
	const datas = data.map((node) => node[targetKey]);
	return datas.filter(value => isNaN(value)).length;
	
}

function groupByValue(data, col) {
	var targetKey = col;
	const datas = data.map((node) => node[targetKey]);
	const count = {};
	datas.forEach(function(i) {
	  count[i] = (count[i] || 0) + 1;
	});
	
	return count
	
}

function meanValue(data, col) {
	var targetKey = col;
	const datas = data.map((node) => node[targetKey]).filter((value) => !isNaN(value));
	const sum = datas.reduce((acc, curr) => acc +  parseFloat(curr.replace(/'/g, '')), 0);
	
	//console.log(datas.length)
	//console.log(datas)
	//console.log(sum)
	const result = sum / datas.length;
	
	return result
}

function stdValue(data, col) {
	var targetKey = col;
	const datas = data.map((node) => node[targetKey]).filter((value) => !isNaN(value));
	
	const mean = datas.reduce((acc, curr) => acc + parseFloat(curr.replace(/'/g, '')), 0) / datas.length;
	const variance = datas.reduce((acc, curr) => acc + (parseFloat(curr.replace(/'/g, '')) - mean) ** 2, 0) / datas.length;
	const std = Math.sqrt(variance).toFixed(10);
	const result = parseFloat(std);
	
	return result
}


function makePreprocData(data, header_data) {
	var strHTML = '';
	strHTML += '';
	strHTML += '<div class="table-responsive">';
	strHTML += '<table id="preProcDatatable" class="table table-hover">';
	
	/*
	strHTML += '    <colgroup>';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    </colgroup>';
	*/
	
	
	strHTML += '    <thead>';
	strHTML += '        <tr>';
	strHTML += '        <th><input type="checkbox" class="" id="chkAll"></th>';
	strHTML += '			<td>컬럼명</td>';
	strHTML += '			<td>유형</td>';
	strHTML += '			<td>최소값</td>';
	strHTML += '			<td>최대값</td>';
	strHTML += '			<td>유일값</td>';
	strHTML += '			<td>중복값</td>';
	strHTML += '			<td>결측값</td>';
	strHTML += '			<td>평균</td>';
	strHTML += '			<td>표준편차</td>';
	strHTML += '        </tr>';
	strHTML += '    </thead>';
	strHTML += '    <tbody>';
	
	
	for (var i = 0; i < header_data.length; i++) {
			strHTML += '   <tr>';
			strHTML += '           <th><input type="checkbox" class="" name="columnArr" value="' + header_data[i].replace(/\"/gi, "") + '"></th>';
			strHTML += '           <td>' + header_data[i].replace(/\"/gi, "") + '</td>';
			strHTML += '           <td>' + '-' + '</td>';
			strHTML += '           <td>' + minValue(data, header_data[i].replace(/\"/gi, "")) + '</td>';
			strHTML += '           <td>' + maxValue(data, header_data[i].replace(/\"/gi, "")) + '</td>';
			strHTML += '           <td>' + onlyValue(data, header_data[i].replace(/\"/gi, "")) + '</td>';
			strHTML += '           <td>' + dupValue(data, header_data[i].replace(/\"/gi, "")) + '</td>';
			strHTML += '           <td>' + nanValue(data, header_data[i].replace(/\"/gi, "")) + '</td>';
			strHTML += '           <td>' + meanValue(data, header_data[i].replace(/\"/gi, "")) + '</td>';
			strHTML += '           <td>' + stdValue(data, header_data[i].replace(/\"/gi, "")) + '</td>';
			strHTML += '    </tr>';
	}
	
	strHTML += '   </tbody>';
	strHTML += '</table>';
	strHTML += '</div>';  
	
	return strHTML;
}

function makePreprocStatistics(data, header_data) {
	var strHTML = '';
	//strHTML += '<div class="topic-desc">';
	//strHTML += '<div style="border: 1px solid; border-color: #ccc;">';
	strHTML += '	<div class="input-group flex_group">';
	strHTML += '	 	<div class="col-sm-8">';
	strHTML += '		Statistics	<select class="select preproc_statistics" id="preproc_statistics">';
    //$.each(header_data, function(i, item) {
	strHTML += '<option value="">선택</option>';
	for (var i = 0; i < header_data.length; i++) {
			strHTML += '<option value=' + header_data[i].replace(/\"/gi, "") + '>' + header_data[i].replace(/\"/gi, "") + '</option>';	
    }
	strHTML += '			</select>';
	strHTML += '		</div>';
	//strHTML += '</div>';
	//strHTML += '</div>';
	//strHTML += makePreporcStatisticsTable(data, header_data)
	
	return strHTML;
}

function makePreprocStatisticsTable(data, header_data) {
	//console.log(maxValue(data, header_data.replace(/\"/gi, "")))
	//var strHTML = '';
	$('#StatisticsCount').html(countValue(data, header_data.replace(/\"/gi, "")));
	$('#StatisticsAverage').html(meanValue(data, header_data.replace(/\"/gi, "")));
	$('#StatisticsStandard').html(stdValue(data, header_data.replace(/\"/gi, "")));
	$('#StatisticsMin').html(minValue(data, header_data.replace(/\"/gi, "")));
	$('#StatisticsMax').html(maxValue(data, header_data.replace(/\"/gi, "")));
}


function makePreprocHistogram(data, header_data) {
	var strHTML = '';
	//strHTML += '<div class="topic-desc">';
	//strHTML += '<div style="border: 1px solid; border-color: #ccc;">';
	strHTML += '	<div class="input-group flex_group">';
		strHTML += '	 	<div class="col-sm-8">';
		strHTML += '		Histogram	<select class="select preproc_histogram" id="preproc_histogram">';
		strHTML += '						<option value="">선택</option>';
	    //$.each(header_data, function(i, item) {
		for (var i = 0; i < header_data.length; i++) {
				strHTML += '					<option value=' + header_data[i].replace(/\"/gi, "") + '>' + header_data[i].replace(/\"/gi, "") + '</option>';	
	    }
		strHTML += '					</select>';
	strHTML += '	</div>';
	//strHTML += '</div>';
	//strHTML += '</div>';

	return strHTML;
}

function makePreprocHistogramTable(data, header_data) {
	//console.log(data)
	console.log(groupByValue(data, header_data))
	
	var strHTML = '';
	strHTML += '<div class="table-responsive" style="width:65%;max-height: 390px;overflow: auto;">';
	strHTML += '<table id="preProcDatatable" class="table table-hover" style="width: 60%">';
	
	strHTML += '    <colgroup>';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    </colgroup>';
	strHTML += '    <thead>';
	strHTML += '        <tr>';
	strHTML += '			<td>Range</td>';
	strHTML += '			<td>Count</td>';
	strHTML += '        </tr>';
	strHTML += '    </thead>';
	
	strHTML += '    <tbody>';
	
	var result_data = groupByValue(data, header_data);
	
	//var jsonString = JSON.stringify(result_data);
	//var jsonParse = JSON.parse(jsonString);
	
	for (const [key, value] of Object.entries(result_data)) {
		strHTML += '   <tr>';
		strHTML += '           <td>' + key + '</td>';
		strHTML += '           <td>' + value + '</td>';
		strHTML += '    </tr>';
	}		
		
	strHTML += '   </tbody>';
	
	
	strHTML += '</table>';
	strHTML += '</div>';
	
	strHTML += '</div>';
	
	
	$('#preProcHistogramTableRange').html(strHTML);
}


function makePreprocMissingValue(data, header_data) {
	var strHTML = '';
	strHTML += '';
	strHTML += '<div class="table-responsive" style="width: 40%">';
	strHTML += '<table id="preProcDatatable" class="table table-hover">';
	
	strHTML += '    <thead>';
	strHTML += '        <tr>';
	strHTML += '			<td>Column</td>';
	strHTML += '			<td>Count</td>';
	strHTML += '        </tr>';
	strHTML += '    </thead>';
	strHTML += '    <tbody>';
	
	for (var i = 0; i < header_data.length; i++) {
			strHTML += '   <tr>';
			strHTML += '           <td>' + header_data[i].replace(/\"/gi, "") + '</td>';
			strHTML += '           <td>' + nanValue(data, header_data[i].replace(/\"/gi, "")) + '</td>';
			strHTML += '    </tr>';
	}
	
	strHTML += '   </tbody>';
	strHTML += '</table>';
	strHTML += '</div>';  
	
	return strHTML;
}

function makePreprocInterval(data, header_data) {
	
}

function makeAlgorithmOutput(data, header_data) {
	var strHTML = '';
	strHTML += '';
	strHTML += '<div class="table-responsive" style="max-height: 390px;overflow: auto;">';
	strHTML += '<table id="preProcDatatable" class="table table-hover">';
	
	/*
	strHTML += '    <colgroup>';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    </colgroup>';
	*/
	
	
	strHTML += '    <thead>';
	strHTML += '        <tr>';
	strHTML += '        <th></th>';
	strHTML += '			<td>컬럼명</td>';
	strHTML += '			<td>중요도</td>';
	strHTML += '        </tr>';
	strHTML += '    </thead>';
	strHTML += '    <tbody>';
	
	
	for (var i = 0; i < header_data.length; i++) {
			strHTML += '   <tr>';
			strHTML += '           <th><input type="radio" class="" name="outputCol" value="' + header_data[i].replace(/\"/gi, "") + '"></th>';
			strHTML += '           <td>' + header_data[i].replace(/\"/gi, "") + '</td>';
			strHTML += '           <td>' + '-' + '</td>';
			strHTML += '    </tr>';
	}
	
	strHTML += '   </tbody>';
	strHTML += '</table>';
	strHTML += '</div>';  
	
	return strHTML;
}

function makeAlgorithmFeature(data, header_data) {
	var strHTML = '';
	strHTML += '';
	strHTML += '<div class="table-responsive" style="max-height: 390px;overflow: auto;">';
	strHTML += '<table id="preProcDatatable" class="table table-hover">';
	
	/*
	strHTML += '    <colgroup>';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    <col style="width: 15%;">';
	strHTML += '    </colgroup>';
	*/
	
	
	strHTML += '    <thead>';
	strHTML += '        <tr>';
	//strHTML += '        <th><input type="checkbox" class="" id="chkAll"></th>';
	strHTML += '			<td>컬럼명</td>';
	strHTML += '			<td>중요도</td>';
	strHTML += '        </tr>';
	strHTML += '    </thead>';
	strHTML += '    <tbody>';
	
	
	for (var i = 0; i < header_data.length; i++) {
			strHTML += '   <tr>';
			strHTML += '           <th><input type="checkbox" class="" name="featureCol" value="' + header_data[i].replace(/\"/gi, "") + '"></th>';
			strHTML += '           <td>' + header_data[i].replace(/\"/gi, "") + '</td>';
			strHTML += '           <td>' + '-' + '</td>';
			strHTML += '    </tr>';
	}
	
	strHTML += '   </tbody>';
	strHTML += '</table>';
	strHTML += '</div>';  
	
	return strHTML;
}


function validationForm() {
    return true;
}
