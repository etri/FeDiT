(function () {
    'use strict'
    $(document).ready(function () {
        $(document).on('click', '.next-dataset-info-step', function () {
            var model_nm = $('#etcModelNm').val();
            let model_derpn = $('textarea[name="etcModelDerpn"]').val();
            var rls_yn = $('input[name="rlsYn"]:checked').val();

            var input_info_check = $('#input_info_check').val();


            if (model_nm.length == 0) {
                alert('모델명을 입력하세요.');
                return false;
            }

            if (input_info_check == 'N') {
                alert('조회 후  다른 이벤트가 발생 했거나 조회 버튼을 클릭하지 않았습니다.');
                return false;
            }

            //타겟 파일로 컬럼 정보 보여주는 api로 넘김
            var preProcData = JSON.parse($('#preprocProPerty').val());
            // base_dir 및 사용자가 로우 갯수와 인덱스를 지정한 파일 가져와서 정보 보여줌

            preProcData.preproc_property_info[0].model_nm = model_nm;
            preProcData.preproc_property_info[0].model_derpn = model_derpn;
            preProcData.preproc_property_info[0].rls_yn = rls_yn;
            console.log('preProcData', preProcData);
            $('#preprocProPerty').val(JSON.stringify(preProcData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

            var index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col;
            var base_file_path = preProcData.preproc_property_info[0].base_dir;
            var base_file_nm = preProcData.preproc_property_info[0].base_file_nm_set_range_row;

            //$('.btn-column-set-part').show();
            $('#next_button_column_info_range').show();


            //정보입력탭 안보이게
            //데이터현황 보이게 안보이게
            $('#tab_getdata_range').hide();
            $('#tab_info_range').hide();
            $('#tab_preview_range').hide();

            //먼저 show를 해야 차트 사이즈가 잡히고 시작
            $('#tab_column_info_range').show();

            //실제 작업할 필터 건 파일을 만듬
            getTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, 'Y', '')

            $('#tab_getdata').attr('class', 'nav-link');
            $('#tab_info').attr('class', 'nav-link');
            $('#tab_column_info').attr('class', 'nav-link active');
            //$('#tab_preproc').attr('class','nav-link');
            $('#tab_getalgo').attr('class', 'nav-link');
            $('#tab_savemodel').attr('class', 'nav-link');


        });

        $(document).on('change', '#preproc_statistics', function () {
            var data = uriDecodingParameter('dataList');
            //uriDecodingParameter('hederList')
            var statistics_select = $('#preproc_statistics option:selected').val();

            makeDataSetStatisticsHeader(data, 'dataSetStatisticsRange', statistics_select);
        });

        $(document).on('change', '#preproc_histogram', function () {
            var data = uriDecodingParameter('dataList');
            //uriDecodingParameter('hederList')
            var histogram_select = $('#preproc_histogram option:selected').val();

            makeDataSetHistogramHeader(data, 'dataSetHistogramRange', histogram_select);

            histogramChartView(histogram_select, data);
        });


        $(document).on('click', '.btn-set-column-select-view', function () {
            if ($('input[name="dataSetColumnArr"]:checked').length === 0) {
                alert('사용할 컬럼을 선택하세요');
                return false;
            }

            $('#csvUpRange3').empty();


            var dataSetColumnArr = [];
            var preProcData = JSON.parse($('#preprocProPerty').val());

            // 'columnArr'라는 이름의 체크된 input 요소를 선택합니다.
            $('input[name="dataSetColumnArr"]:checked').each(function () {
                // 각 체크된 요소의 값을 배열에 추가합니다.
                dataSetColumnArr.push($(this).val());
            });

            preProcData.preproc_property_info[0].preproc_trgt_col = dataSetColumnArr;
            $('#preprocProPerty').val(JSON.stringify(preProcData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));


            // hidden 요소에서 JSON 데이터 가져오기
            var jsonData = JSON.parse($('#preprocProPerty').val());

            // base_dir 및 base_file_nm 값 가져오기
            var base_file_path = jsonData.preproc_property_info[0].base_dir;
            var base_file_nm = jsonData.preproc_property_info[0].base_file_nm;

            //실제 작업할 필터 건 파일을 만듬

            //makeHtmlTable(resultData.header_list, resultData.data_list, 'metaJsonSampleDataTable', 'N', 'csvUpRangeDataTable');

            getBaseDataSetRangeCol(preProcData);

            $('#tab_validate_range').hide();
            $('#next_button_column_info_range').show();
            $('#column_info_next').show();

            makePropertyListHtml();
            $('html, body').animate({scrollTop: $(document).height()}, 'slow');
            /*
            //전처리 다음페이지 넘김

            $('#btn-preproc-part').show();
            $('#tab_preproc_bottom_range').show();
            $('#inc_tab_validate').show();
            */

        });


        $(document).on('click', '.next-preproc-validate-step', function () {
            var preprocCurrent = $('#preprocCurrent').val('validate');


            if ($('input[name="dataSetColumnArr"]:checked').length === 0) {
                alert('사용할 컬럼을 선택하세요');
                return false;
            }
            $('#tab_validate_range').show();

            var dataSetColumnArr = [];
            var preProcData = JSON.parse($('#preprocProPerty').val());

            // 'columnArr'라는 이름의 체크된 input 요소를 선택합니다.
            $('input[name="dataSetColumnArr"]:checked').each(function () {
                // 각 체크된 요소의 값을 배열에 추가합니다.
                dataSetColumnArr.push($(this).val());
            });

            preProcData.preproc_property_info[0].preproc_trgt_col = dataSetColumnArr;
            $('#preprocProPerty').val(JSON.stringify(preProcData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

            getBaseDataSetRangeCol(preProcData);
            $('#btn-preproc-part').show();
            $('#tab_preproc_bottom_range').show();
            $('#inc_tab_validate').show();


            $('#tab_getdata_range').hide();
            $('#tab_info_range').hide();
            $('#tab_column_info_range').hide();
            $('#tab_preview_range').hide();
            $('#tab_preproc_range').show();

            $('#tab_getdata').attr('class', 'nav-link');
            $('#tab_info').attr('class', 'nav-link');
            $('#tab_column_info').attr('class', 'nav-link');
            $('#tab_preproc').attr('class', 'nav-link active');
            $('#tab_getalgo').attr('class', 'nav-link');
            $('#tab_savemodel').attr('class', 'nav-link');


            var base_file_path = preProcData.preproc_property_info[0].base_dir;
            var base_file_nm = preProcData.preproc_property_info[0].base_file_nm_set_range_col;
            var index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col;

            getTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, 'N', 'validate');
            makePropertyListHtml();
            $('#next_button_valiate_range').show();
        });


    });
})();


//가져온 메타에 대한 원본 데이터에서 필터를 지정해서 실제 작업에 사용할 데이터
function getBaseDataSetRangeCol(param) {
    let form_type = $('#formType').val();
    let last_file_path = $('#lastFilePath').val();

    let data = {
        param: JSON.stringify(param),
        form_type: form_type,
        last_file_path: last_file_path
    }
    showProgressBar({element: null, process_id: 'process-16'});
    $.ajax({
        type: "POST",
        url: '/dt/etc/model/getBaseDataSetRangeCol',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            if (result.code === 200) {
                var preProcData = JSON.parse($('#preprocProPerty').val());

                preProcData.preproc_property_info[0].base_file_nm_set_range_col = result.base_file_nm_set_range_col;
                $('#preprocProPerty').val(JSON.stringify(preProcData));
                $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

                //결과값으로  테이블 만들기
                var header_list = result.header_list;
                var data_list = result.data_list;
                makeHtmlTable(header_list, data_list, 'csvUpRange3', 'N', 'csvUpRangeDataTable3');
                $('#csvUpRangeDataTable3').DataTable({
                    columnDefs: [{
                        targets: '_all',
                        className: 'text-nowrap'
                    }],
                    "order": [[0, "asc"]],
                    "searching": false,
                    "info": false,
                    "lengthChange": false,
                    "autoWidth": true,
                    "lengthMenu": [[10], [10]],
                    scrollX: true
                });
                closeProgressBar({element: null, process_id: 'process-16'});
            } else {
                closeProgressBar({element: null, process_id: 'process-16'});
                alert('API 내 에러 발생');
            }
        },
        error: function (xhr, status, error) {
            console.error('error : ', error);
            closeProgressBar({element: null, process_id: 'process-16'});
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}