function insertSimulation(form) {
    var formData = new FormData(form);
    var get_data;
    $.ajax({
    	type: 'POST',
    	async: false,
        //enctype: 'multipart/form-data',
        url: '/simulation/insertSimulationInfo',
        data: formData,
        processData: false,
        contentType: false,    	
		success : function(result)
		{									
            if (result.result_code == 200) {
            	get_data = result.augmentSeq
            }
		},
        error: function(xhr, status, error) {
            console.error('error : ', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
    
    return get_data;
}

function insertSimulationViewResult(seq) {
    var get_data;
	var data = {
			augmentSeq: seq
    }    
    $.ajax({
    	type: 'POST',
    	async: false,
        url: '/simulation/insertSimulationViewResult',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",	
		success : function(result)
		{									
            if (result.result_code == 200) {
            	get_data = result
            }
		},
        error: function(xhr, status, error) {
            console.error('error : ', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
    
    return get_data;
}


function makeAlgorithmMetaItemList(model_algrm_seq, model_seq) {
	var get_data;
	var data = {
			model_algrm_seq: model_algrm_seq,
			model_seq: model_seq
    }
	$.ajax({
		type: "POST",
		async: false,
		url: ' /ai/model/make/algorithm_meta_set',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",	
		success : function(result)
		{									
            if (result.result_code == 200) {
            	get_data = result
            }
		},
        error: function(xhr, status, error) {
            console.error('error : ', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
	
	return get_data;
}

function getCorrelation(modelSeq) {
	var get_data;
	
	var data = {
			model_seq: modelSeq
    }
	$.ajax({
		type: "POST",
		url: ' /simulation/make/correlation',
		async: false,
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",	
		success : function(result)
		{									
            if (result.result_code == 200) {
            	get_data = result
            }
		},
        error: function(xhr, status, error) {
            console.error('error : ', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
	
	return get_data;
}

