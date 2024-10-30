(function () {
    'use strict'
    $(document).ready(function () {
        $(document).on('click', '.next-model-step', function () {
            /*
            var con = confirm('모델을 생성 하시겠습니까?');
            if (con == true) {
                var preProcData = JSON.parse($('#preprocProPerty').val());
                //var preProcData = $('#preprocProPerty').val();
                savePreproc(preProcData);
            } else {
                return false;
            }

            */
            getTotalLastFile();

            var con = confirm('모델을 생성 단계로 이동  하시겠습니까?');
            if (con == true) {
                var preProcData = JSON.parse($('#preprocProPerty').val());
                //var preProcData = $('#preprocProPerty').val();
                goModelProperty(preProcData);
            }
        });

    });
})();

function goModelProperty(param) {
    $.ajax({
        type: "POST",
        async: false,
        url: '/dt/etc/model/savePreproc',
        data: JSON.stringify(param),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            if (result.result_code === 200) {
                $('#etcModelSeq').val(result.model_seq);
                goModelAlgo(result.model_seq);
            } else {
                alert('API 내 에러 발생')
            }
        },
        error: function (xhr, status, error) {
            console.error('error : ', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });

}


function getPreprocLevelLastTargetFileName(preproc_order) {
    var file_nm;
    var preProcData = JSON.parse($('#preprocProPerty').val());


    var maxOrder = jsonTemplateArrayNumbering(preproc_order);

    if (maxOrder > 0) {
        file_nm = preProcData.preproc_property_info[0].preproc_property[preproc_order - 1].preproc_set[maxOrder - 1].trgt_file_nm
    } else {
        var base_file_nm = preProcData.preproc_property_info[0].base_file_nm;
        var base_file_nm_set_range_row = preProcData.preproc_property_info[0].base_file_nm_set_range_row;
        var base_file_nm_set_range_col = preProcData.preproc_property_info[0].base_file_nm_set_range_col;

        if (base_file_nm_set_range_col != null && base_file_nm_set_range_col != '') {
            file_nm = base_file_nm_set_range_col;
        } else if (base_file_nm_set_range_row != null && base_file_nm_set_range_row != '') {
            file_nm = base_file_nm_set_range_row;
        } else {
            file_nm = base_file_nm;
        }
    }

    return file_nm;
}


function getTotalLastFile() {
    var jsonTemplate = JSON.parse($('#preprocProPerty').val());
    var lastPreprocOrder = null;
    var lastPreprocSet = null;
    var lastTargetFileName = null;
    var lastSetOrder = null;

    $.each(jsonTemplate.preproc_property_info, function (index, preprocPropertyInfo) {
        // preproc_property 배열 반복
        $.each(preprocPropertyInfo.preproc_property, function (index, preprocProperty) {
            if (preprocProperty.preproc_order !== null) {
                // 마지막 preproc_order의 preproc_set 배열 업데이트
                lastPreprocSet = preprocProperty.preproc_set;
                // preproc_set 배열 반복
                $.each(preprocProperty.preproc_set, function (index, preprocSet) {
                    // trgt_file_nm이 존재하는 경우에만 업데이트
                    if (preprocSet.trgt_file_nm !== null) {
                        lastTargetFileName = preprocSet.trgt_file_nm;
                        lastSetOrder = preprocSet.set_order;
                        lastPreprocOrder = preprocProperty.preproc_order;
                    }
                });
            }
        });
    });

    if (lastTargetFileName == null) {
        var base_file_nm = jsonTemplate.preproc_property_info[0].base_file_nm;
        var base_file_nm_set_range_row = jsonTemplate.preproc_property_info[0].base_file_nm_set_range_row;
        var base_file_nm_set_range_col = jsonTemplate.preproc_property_info[0].base_file_nm_set_range_col;

        lastPreprocOrder = null;
        if (base_file_nm_set_range_col != null && base_file_nm_set_range_col != '') {
            lastTargetFileName = base_file_nm_set_range_col;
        } else if (base_file_nm_set_range_row != null && base_file_nm_set_range_row != '') {
            lastTargetFileName = base_file_nm_set_range_row;
        } else {
            lastTargetFileName = base_file_nm;
        }
    }

    jsonTemplate.preproc_property_info[0].last_step_preproc_order = lastPreprocOrder;
    jsonTemplate.preproc_property_info[0].last_step_preproc_file_nm = lastTargetFileName;

    $('#preprocProPerty').val(JSON.stringify(jsonTemplate));
    $('.preprocProPerty').val(prettyJson(JSON.stringify(jsonTemplate)));

    /*
    var result = {
            "lastPreprocOrder": lastPreprocOrder,
            "lastPreprocSet": lastPreprocSet,
            "lastTargetFileName": lastTargetFileName,
            "lastSetOrder": lastSetOrder
    };

    return result;
    */

}