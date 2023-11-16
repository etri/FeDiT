(function() {
    'use strict'	
    $(document).ready(function() {
    	
    	var formType = $('#formType').val();
    	$('#tab_result_model_range').hide();
    	
    	if (formType == 'I') {
    		$('#tab_result_simulation').hide();
    	}
    	
    	if (formType == 'U') {
    		$('#tab_result_model_range').show();
    		var augmentSeq = $('#augmentSeq').val();
			var result_data = insertSimulationViewResult(augmentSeq);

			//알고리즘설정
			var result_algm = makeAlgorithmMetaItemList($('#set_model_algrm_seq').val(), $('#set_model_seq').val())
			getMdelParameter(result_algm);
			
			try {
				//상관분석
				$('#tab_getalgo_range_top').show();
				var result_correlation = getCorrelation($('#set_model_seq').val());
				getCorrelationInfo(result_correlation);
			} catch(error) {
			    // catch구문은 에러가 발생시 해당 내용을 실행함
				$('#tab_getalgo_range_top').hide();
				console.error("chart error");
			}			
			
			//결과차트
			makeResultDataChart(result_data);

			$('#download_file').attr('href', '/file/download/dt/augment/' + result_data.augmentFileSeq);
			
			makeAugmentDataHtml(result_data);
            $('#augmentDataRangeDataTable').DataTable( {
            	//"order": [[ 0, "asc" ]]
            	 destroy: true,
	   	    	 autoWidth: false,
	   	    	 bLengthChange: false,
	   	         pageLength: 5
            });

            
    	}
    	
    	$('#datatableModelList').DataTable({
	       	 //destroy: true,
	    	 autoWidth: false,
	    	 //bFilter: false,
	    	 //bInfo: false,
	    	 bLengthChange: false,
	         pageLength: 5
       });      	
    	
    	$(document).on('click', '.btn-pop-select-model', function() {
            $('#modalModelList').modal('show');
        });    	


        $(document).on('click', '.btn-select-modal-model', function() {
        	$('#tab_result_model_range').show();
        	
            var modelSeq = $(this).data('model-seq');
            var modelNm = $(this).data('model-nm');
            var modelAlgrmSeq = $(this).data('model-algrm-seq');
            var resmplIntvlTp = $(this).data('resmpl-intvl-tp');
            var resmplIntvlValue = $(this).data('resmpl-intvl-value');
            
            $('#set_model_seq').val(modelSeq);
            $('#set_model_name').val(modelNm);
            $('#set_model_algrm_seq').val(modelAlgrmSeq);
            $('#get_resmpl_intvl_tp').val(resmplIntvlTp);
            $('#get_resmpl_intvl_value').val(resmplIntvlValue);
            
            $('#modalModelList').modal('hide');

            if (resmplIntvlTp == 'D') {
                //hideOptionByValue('data_crt_intvl_tp', valuesToHide);
                $('#data_crt_intvl_tp').find('[value=S]').hide();
                $('#data_crt_intvl_tp').find('[value=T]').hide();
                $('#data_crt_intvl_tp').find('[value=H]').hide();
                $('#data_crt_intvl_tp').find('[value=D]').show();
            } else if (resmplIntvlTp == 'H') {
                $('#data_crt_intvl_tp').find('[value=S]').hide();
                $('#data_crt_intvl_tp').find('[value=T]').hide();
                $('#data_crt_intvl_tp').find('[value=H]').show();
                $('#data_crt_intvl_tp').find('[value=D]').show();
            } else if (resmplIntvlTp == 'T') {
                $('#data_crt_intvl_tp').find('[value=S]').hide();
                $('#data_crt_intvl_tp').find('[value=T]').show();
                $('#data_crt_intvl_tp').find('[value=H]').show();
                $('#data_crt_intvl_tp').find('[value=D]').show();
            } else {
                $('#data_crt_intvl_tp').find('[value=S]').show();
                $('#data_crt_intvl_tp').find('[value=T]').show();
                $('#data_crt_intvl_tp').find('[value=H]').show();
                $('#data_crt_intvl_tp').find('[value=D]').show();
            }
            
            $("#data_crt_intvl_tp").val(resmplIntvlTp).prop("selected", true);
            $('#data_crt_intvl_value').val(resmplIntvlValue);
            
            $('.reset-cal-term').trigger("click");
            
			//알고리즘설정
			var result_algm = makeAlgorithmMetaItemList($('#set_model_algrm_seq').val(), $('#set_model_seq').val())
			getMdelParameter(result_algm);
			
			try {
				//상관분석
				$('#tab_getalgo_range_top').show();
				var result_correlation = getCorrelation($('#set_model_seq').val())
				getCorrelationInfo(result_correlation);      
			} catch(error) {
			    // catch구문은 에러가 발생시 해당 내용을 실행함
				$('#tab_getalgo_range_top').hide();
				console.error("chart error");
			}						
			
        });
    	
        
        $(document).on('click', '.btn-pop-cancel-model', function() {
            $('#set_model_seq').val('');
            $('#set_model_name').val('');
        });        
        
        $(document).on('click', '.btn-delete', function() {
            if (confirm('삭제하시겠습니까?')) {
                var augmentSeq = $(this).data('augment-seq');
                var form = document.forms.deleteForm;
                form.augmentSeq.value = augmentSeq;
                form.submit();
            }
        });        
        
        $(document).on('click', '.next-simualtion', function() {
        	var title = $('#title').val();
        	var model_name = $('#set_model_name').val();
        	var model_seq = $('#set_model_seq').val();
        	var data_crt_intvl_tp = $("#data_crt_intvl_tp option:selected").val();
        	var data_crt_intvl_value = $('#data_crt_intvl_value').val();
        	
        	var target_start_date = $('#target_start_date').val();
        	var target_last_date = $('#target_last_date').val();

        	
	    	if (title.length == 0) {
	    		alert('제목을 입력하세요');
	    		return false;
	    	}
        	
	    	if (model_name.length == 0) {
	    		alert('모델을 선택하세요');
	    		$('#data_crt_intvl_value').val(1);
	    		return false;
	    	}
	    	
	    	if (data_crt_intvl_tp == '') {
	    		alert('자료생성범위를  선택하세요');
	    		return false;
	    	}

	    	if (target_start_date.length == 0 || target_last_date == 0) {
	    		alert('날짜값이 없습니다.갱신버튼을 눌러주세요.');
	    		return false;
	    	}	    	
	    	
	    	
    	    var confirm_comment = '';
    	    if (formType == 'I') {
    	    	confirm_comment = '추론 데이터를 생성하시겠습니까?';
    	    } else {
    	    	confirm_comment = '추론 데이터를 수정하시겠습니까?';
    	    }
    	    
    	    var con = confirm(confirm_comment);
	    	if (con == true) {
	    		
	    		if (formType == 'I') {
	    			var form = $('#editForm')[0];
		    		makeSimulation(form, formType)	
	    		} else {
		    		var form = document.forms.editForm;
		         	form.submit();	 
	    		}
	    		
	    	} else {
	    		return false;
	    	}		    	
	    	
        	
        });    	
        
        function makeSimulation(form, formType) {
        	$('#loading').show();
        	
    	//데이터로드
    	//$.when.apply($, null).then(function () {    		
    		setTimeout(() => {
	    		if (formType == 'I') {
	    			var data = insertSimulation(form);
		   			if (typeof data !== 'undefined') {
		   				$('#tab_result_simulation').show();
		   				$('#tab_result_simulation').trigger("click");
		   				
		   				$('#tab_input_simulation').hide();
		   				$('#tab_input_simulation_range').hide();
		   				
		   				var result_data = insertSimulationViewResult(data);
		   				
		   				$('#download_file').attr('href', '/file/download/dt/augment/' + result_data.augmentFileSeq);
		   				
		   				makeAugmentDataHtml(result_data);
		   	            $('#augmentDataRangeDataTable').DataTable( {
		   	            	//"order": [[ 0, "asc" ]]
		   	            	 destroy: true,
		   		   	    	 autoWidth: false,
		   		   	    	 bLengthChange: false,
		   		   	         pageLength: 5
		   	            });

		   	            $('#tab_result_simulation').show();
		   				//알고리즘설정
		   				var result_algm = makeAlgorithmMetaItemList($('#set_model_algrm_seq').val(), $('#set_model_seq').val())
		   				getMdelParameter(result_algm);
		   				
		   				try {
		   					//상관분석
		   					$('#tab_getalgo_range_top').show();
			   				var result_correlation = getCorrelation($('#set_model_seq').val())
			   				getCorrelationInfo(result_correlation);         
		   				} catch(error) {
		   				    // catch구문은 에러가 발생시 해당 내용을 실행함
		   					$('#tab_getalgo_range_top').hide();
		   					console.error("chart error");
		   				}					   				
		   				
		   				//결과차트
		   				makeResultDataChart(result_data);		
		   				
		        	}
	    			
	    			
	    		} else {
	    			var data = updateSimulation(form);
	    		}
	    		$('#loading').hide();
    		}, 0);
    	//});        	    
	        	
        }
        
    	//$('#data_crt_intvl_value').keyup(function() {
    	$(document).on('keyup', '#data_crt_intvl_value', function() {
    		//var value = parseInt($('#data_crt_intvl_value').val());
    		var data_crt_intvl_tp = $("#data_crt_intvl_tp option:selected").val();
    		var data_crt_intvl_value = $("#data_crt_intvl_value").val();
    		var model_name = $('#set_model_name').val();
    		
    		var get_resmpl_intvl_tp = $("#get_resmpl_intvl_tp").val();
    		var get_resmpl_intvl_value = $("#get_resmpl_intvl_value").val();
    		
    		
	    	if (model_name.length == 0) {
	    		alert('모델을 선택하세요');
	    		$('#data_crt_intvl_value').val(1);
	    		return false;
	    	}    		
    		
    		if (data_crt_intvl_tp.length == 0) {
    			alert('자료생성간격범위를 지정해주세요')
    			return false;
    		}

    		if (data_crt_intvl_tp == get_resmpl_intvl_tp) {
    			if (parseInt(data_crt_intvl_value) < parseInt(get_resmpl_intvl_value)) {
    				alert('모델과 같은 단위를 선택시 최소값보다 작습니다.');
    				$('#data_crt_intvl_value').val(get_resmpl_intvl_value);
    				return false;
    			}
    		}
    		
    		/*
    		if (isNaN(value)) {
    			alert('숫자값 필수입니다')
		    	$('#data_crt_intvl_value').val(1);
    		}
    		*/
    		
    		if (data_crt_intvl_value > 100) {
		    	alert('100이하로 설정해주세요')
		    	$('#data_crt_intvl_value').val(1);
		    	return false;
		    }	    	
    		
    		
    		
    		if (data_crt_intvl_value.length > 0) {
    			var data = calDateTerm(data_crt_intvl_tp, data_crt_intvl_value);
    			//console.log('----result----')
    			//console.log(data['target_start_date']);
    			$('#target_start_date').val(data['target_start_date']);
    			$('#target_last_date').val(data['target_last_date']);
    		}
    		
    		
    	});	         

    	
    	
    	$(document).on('change', '#data_crt_intvl_tp', function() {
    		var model_name = $('#set_model_name').val();
    		
	    	if (model_name.length == 0) {
	    		alert('모델을 선택하세요');
	    		$("#data_crt_intvl_tp").val('').prop("selected", true);
	    		$('#data_crt_intvl_value').val(1);
	    		return false;
	    	} else {
	    		$('.reset-cal-term').trigger("click");	
	    	}
    		
    	});
    	
    	
        $(document).on('click', '.reset-cal-term', function() {
    		var data_crt_intvl_tp = $("#data_crt_intvl_tp option:selected").val();
    		var data_crt_intvl_value = $("#data_crt_intvl_value").val();
    		var model_name = $('#set_model_name').val();
    		
    		var get_resmpl_intvl_tp = $("#get_resmpl_intvl_tp").val();
    		var get_resmpl_intvl_value = $("#get_resmpl_intvl_value").val();    		
    		
	    	if (model_name.length == 0) {
	    		alert('모델을 선택하세요');
	    		$('#data_crt_intvl_value').val(1);
	    		return false;
	    	}    	
	    	
    		if (data_crt_intvl_tp.length == 0) {
    			alert('자료생성간격범위를 지정해주세요');
    			return false;
    		}
    		
    		if (data_crt_intvl_tp == get_resmpl_intvl_tp) {
    			if (parseInt(data_crt_intvl_value) < parseInt(get_resmpl_intvl_value)) {
    				alert('모델과 같은 단위를 선택시 최소값보다 작습니다.');
    				$('#data_crt_intvl_value').val(get_resmpl_intvl_value);
    				return false;
    			}
    		}    		
    		
    		/*
    		if (isNaN(value)) {
    			alert('숫자값 필수입니다')
		    	$('#data_crt_intvl_value').val(1);
    		}
    		*/
    		
    		if (data_crt_intvl_value > 100) {
		    	alert('100이하로 설정해주세요')
		    	$('#data_crt_intvl_value').val(1);
		    	return false;
		    }	    	
	    	
    		if (data_crt_intvl_value.length > 0) {
    			var data = calDateTerm(data_crt_intvl_tp, data_crt_intvl_value);
    			//console.log('----result----')
    			//console.log(data['target_start_date']);
    			$('#target_start_date').val(data['target_start_date']);
    			$('#target_last_date').val(data['target_last_date']);
    		}
        });                
            	
    	
    	
    	
    	
    	
    	
    	
    	
    	
    });

})();

function calDateTerm(data_crt_intvl_tp, data_crt_intvl_value) {
	var now = new Date();
    //console.log(now);
    //console.log(dateFormat(now));
    var last_date;
    
	if (data_crt_intvl_tp == 'S') {
	    //초단위
	    //var sec = new Date(now.setSeconds(now.getSeconds() - 20));
	    var sec = new Date(now.setSeconds(now.getSeconds() + parseInt(data_crt_intvl_value)));
	    now = new Date();
	    last_date = sec;
	}
    
	if (data_crt_intvl_tp == 'T') {
	    //분단위
	    var min = new Date(now.setMinutes(now.getMinutes() + parseInt(data_crt_intvl_value)));
	    now = new Date();
	    last_date = min;
	}
	
	if (data_crt_intvl_tp == 'H') {
	    //시간단위
	    var hour = new Date(now.setHours(now.getHours() + parseInt(data_crt_intvl_value)));
	    now = new Date();
	    last_date = hour;
	}
	
	if (data_crt_intvl_tp == 'D') {
	    //일단위
	    var day = new Date(now.setDate(now.getDate() + parseInt(data_crt_intvl_value)));
	    now = new Date();
	    last_date = day;
	}
	
	
	return {
		"target_start_date": dateFormat(now),
		"target_last_date": dateFormat(last_date)
	};

	/*
    //월단위
    //var month = new Date(now.setMonth(now.getMonth() - 1));
    var month = new Date(now.setMonth(now.getMonth() + data_crt_intvl_value));
    console.log("월: " + month);
    now = new Date();
    //년단위
    //var year = new Date(now.setFullYear(now.getFullYear() - 1));
    var year = new Date(now.setFullYear(now.getFullYear() + data_crt_intvl_value));
    console.log("년: " + year);ㅍㅍ
    */
    
}

function dateFormat(date) {
	console.log(date)
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hour = date.getHours();
    let minute = date.getMinutes();
    let second = date.getSeconds();

    month = month >= 10 ? month : '0' + month;
    day = day >= 10 ? day : '0' + day;
    hour = hour >= 10 ? hour : '0' + hour;
    minute = minute >= 10 ? minute : '0' + minute;
    second = second >= 10 ? second : '0' + second;

    return date.getFullYear() + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
}

function makeAugmentDataHtml(result) {
	var strHTML = '';
	

	strHTML += '						<h6 class="card-title">미리보기로 1000개 이하만 보입니다.</h6>';
	strHTML += '';						
	strHTML += '						<div class="table-responsive2">';
	strHTML += '							<table class="table" id="augmentDataRangeDataTable">';
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

	
	$('#augmentDataRange').html(strHTML);
}



function getMdelParameter(result) {
	var strHTML = '';
	var item_list = result.algorithm_meta_item_list;
	var loss_list = result.meta_item_loss_list;
	var meterics_list = result.meta_item_meterics_list;
	var optimizer_list = result.meta_item_optimizer_list;
	
	
	strHTML += '					<h4 class="card-title">사용 알고리즘 : ' + item_list[0].model_algrm_nm + '</h4>';
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
            					strHTML += '			<input type="number" class="form-control number_only" id="' + item_list[i].model_params_item + '" placeholder="" value="10" required="required" readonly="readonly">';	
            				}
            				if (item_list[i].model_params_item == 'batchSize') {
            					strHTML += '			<input type="number" class="form-control number_only" id="' + item_list[i].model_params_item + '" placeholder=""  value="16" required="required" readonly="readonly">';
            				}
            				if (item_list[i].model_params_item == 'epochs') {
            					strHTML += '			<input type="number" class="form-control number_only" id="' + item_list[i].model_params_item + '" placeholder=""  value="50" required="required" readonly="readonly">';
            				}
            				if (item_list[i].model_params_item == 'dataSize') {
            					strHTML += '			<input type="number" class="form-control number_only" id="' + item_list[i].model_params_item + '" placeholder=""  value="100" required="required" readonly="readonly">';
            					strHTML += '			<br/><span  style="color: red;">' + item_list[i].model_params_derpn + '</span>';
            				}
            				if (item_list[i].model_params_item == 'optimizerLr') {
            					strHTML += '			<input type="number" class="form-control optimizer-number-chk" id="' + item_list[i].model_params_item + '" placeholder=""  value="0.0005" required="required" readonly="readonly">';
            					//strHTML += '			<br/><span  style="color: red;">' + item_list[i].model_params_derpn + '</span>';
            				}
            					
            			}
            				
            		} else {
            			if (item_list[i].model_params_item == 'testSize') {
            				//strHTML += '			<input type="range" class="form-control" min="0.1" max="0.9"  step="0.1" id="customRange" value="0.2">';
            				strHTML += '			<input type="number" id="' + item_list[i].model_params_item + '" value= "' + item_list[i].model_params_item_value + '" class="form-control custom-number-range number_only" min="0.1" max="0.9" value="0.2" readonly="readonly">';		                				
            				
            			} else {
            				strHTML += '			<input type="number" class="form-control number_only" id="' + item_list[i].model_params_item + '" value= "' + item_list[i].model_params_item_value + '" placeholder="" required="required" readonly="readonly">';	
            			}
            			
            		} 
    				strHTML += '						</div>';
		} 
		else {
			if (item_list[i].model_params_item == 'loss') {
				strHTML += '						<div class="col-lg-8">';
        		strHTML += '					<select  readonly="readonly" class="select" id="' + item_list[i].model_params_item + '">';
            		for (var j = 0; j < loss_list.length; j++) {
            			if(item_list[i].model_params_item_value == null || item_list[i].model_params_item_value == '') {
            				strHTML += '<option value=' + loss_list[j].dtl_cd + '>' + loss_list[j].dtl_cd_nm + '</option>';	
            			} else {
            				if (item_list[i].model_params_item_value == loss_list[j].dtl_cd) {
            					strHTML += '<option selected value=' + loss_list[j].dtl_cd + '>' + loss_list[j].dtl_cd_nm + '</option>';	
            				}
            				//else {
            				//	strHTML += '<option value=' + loss_list[j].dtl_cd + '>' + loss_list[j].dtl_cd_nm + '</option>';
            				//}
            			}
            				
            		}
        		strHTML += '					</select>';
        		strHTML += '						</div>';
				
			}

			if (item_list[i].model_params_item == 'meterics') {
				strHTML += '						<div class="col-lg-8">';
        		strHTML += '					<select  readonly="readonly" class="select" id="' + item_list[i].model_params_item + '">';
            		for (var k = 0; k < meterics_list.length; k++) {
            			if(item_list[i].model_params_item_value == null || item_list[i].model_params_item_value == '') {
            				strHTML += '<option value=' + meterics_list[k].dtl_cd + '>' + meterics_list[k].dtl_cd_nm + '</option>';	
            			} else {
            				if (item_list[i].model_params_item_value == meterics_list[k].dtl_cd) {
            					strHTML += '<option selected value=' + meterics_list[k].dtl_cd + '>' + meterics_list[k].dtl_cd_nm + '</option>';	
            				}
            				//else {
            				//	strHTML += '<option value=' + meterics_list[k].dtl_cd + '>' + meterics_list[k].dtl_cd_nm + '</option>';	
            				//}
            			}
            				
            		}
        		strHTML += '					</select>';
        		strHTML += '						</div>';
				
			}
			
			if (item_list[i].model_params_item == 'optimizer') {
				strHTML += '						<div class="col-lg-8">';
        		strHTML += '					<select  readonly="readonly" class="select" id="' + item_list[i].model_params_item + '">';
            		for (var l = 0; l < optimizer_list.length; l++) {
            			if(item_list[i].model_params_item_value == null || item_list[i].model_params_item_value == '') {
            				strHTML += '<option value=' + optimizer_list[l].dtl_cd + '>' + optimizer_list[l].dtl_cd_nm + '</option>';	
            			} else {
            				if (item_list[i].model_params_item_value == optimizer_list[l].dtl_cd) {
            					strHTML += '<option selected value=' + optimizer_list[l].dtl_cd + '>' + optimizer_list[l].dtl_cd_nm + '</option>';	
            				}
            				//else {
            				//	strHTML += '<option value=' + optimizer_list[l].dtl_cd + '>' + optimizer_list[l].dtl_cd_nm + '</option>';
            				//}
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



function getCorrelationInfo(result) {
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

	viewTypeDefault("heatmap", data, 4, true);
}


function makeResultDataChart(result) {
	data = result.data;
	
	const xData = [];
	const seriesData = [];

	data.forEach(item => {
		const keys = Object.keys(item);

		//첫 번째 항목을 x축 데이터로 사용
		if (keys.length > 0) {
			const xKey = keys[0];
			xData.push(item[xKey]);
			
		    // x축 데이터가 아닌 나머지 항목들을 시리즈로 추가
			for (let i = 1; i < keys.length; i++) {
				const yKey = keys[i];
				//if (yKey !== 'yyyymmdd') {
				if (yKey !== keys[0]) {
					const dataIndex = seriesData.findIndex(seriesItem => seriesItem.name === yKey);
					if (dataIndex === -1) {
						seriesData.push({
							name: yKey,
							//type: 'line',
							chart: 'line',
							data: [{name: item[xKey], value: parseFloat(item[yKey])}]
						});
					} else {
						seriesData[dataIndex].data.push({name: item[xKey], value: parseFloat(item[yKey])});
					}
				}
			}
			
		}
	});		
	
	const series = {
			  series: seriesData,
			  subtitle: "추론 데이터",
			  title: "추론 데이터"
	};	
	
	viewTypeDefault('line', series, 2, true, false, isTool=true);
}