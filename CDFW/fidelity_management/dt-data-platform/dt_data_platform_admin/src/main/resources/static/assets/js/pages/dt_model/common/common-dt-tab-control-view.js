'use strict'

$(document).ready(function () {
    ////////////////////////뷰화면 탭클릭 처리 시작//////////////////////////////
    $(document).on('click', '#tab_info', function () {
        //탭
        $('#tab_getdata').attr('class', 'nav-link');
        $('#tab_info').attr('class', 'nav-link active');
        $('#tab_column_info').attr('class', 'nav-link');
        $('#tab_preproc').attr('class', 'nav-link');
        $('#tab_getalgo').attr('class', 'nav-link');
        $('#tab_savemodel').attr('class', 'nav-link');

        //본문
        $('#tab_getdata_range').hide();
        $('#tab_info_range').show();
        $('#tab_column_info_range').hide();
        $('#tab_preproc_range').hide();
        $('#tab_getalgo_range').hide();
        $('#tab_savemodel_range').hide();
        $('#tab_preview_range').hide();

        //버튼
        $('#next_button_info_range').hide();
        $('#next_button_column_info_range').hide();
        $('#next_button_valiate_range').hide();

        var preProcData = JSON.parse($('#preprocProPerty').val());

        var base_file_nm = preProcData.preproc_property_info[0].base_file_nm;
        var base_file_nm_set_range_row = preProcData.preproc_property_info[0].base_file_nm_set_range_row;
        var base_file_nm_set_range_col = preProcData.preproc_property_info[0].base_file_nm_set_range_col;
        viewPreprocFile($('#formType').val(), base_file_nm, $('#lastFilePath').val(), 'csvUpRange', 'fileViewDataTableRange', '');
    });
    $(document).on('click', '#tab_column_info', function () {
        /*
        //타겟 파일로 컬럼 정보 보여주는 api로 넘김
        var preProcData = JSON.parse($('#preprocProPerty').val());
        var index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col;
        var base_file_path = $('#lastFilePath').val();
        var base_file_nm = preProcData.preproc_property_info[0].base_file_nm_set_range_row;

        //실제 작업할 필터 건 파일을 만듬
        getTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, 'Y', '')
        //$('.btn-column-set-part').show();
        //$('#next_button_column_info_range').show();
        */

        //정보입력탭 안보이게
        //데이터현황 보이게 안보이게
        $('#tab_getdata_range').hide();
        $('#tab_info_range').hide();
        $('#tab_column_info_range').show();
        $('#tab_preproc_range').hide();
        $('#tab_getalgo_range').hide();
        $('#tab_savemodel_range').hide();
        $('#tab_preview_range').hide();


        $('#tab_getdata').attr('class', 'nav-link');
        $('#tab_info').attr('class', 'nav-link');
        $('#tab_column_info').attr('class', 'nav-link active');
        $('#tab_preproc').attr('class', 'nav-link');
        $('#tab_getalgo').attr('class', 'nav-link');
        $('#tab_savemodel').attr('class', 'nav-link');

    });
    $(document).on('click', '#tab_preproc', function () {
        //탭
        $('#tab_getdata').attr('class', 'nav-link');
        $('#tab_info').attr('class', 'nav-link');
        $('#tab_column_info').attr('class', 'nav-link');
        $('#tab_preproc').attr('class', 'nav-link active');
        $('#tab_getalgo').attr('class', 'nav-link');
        $('#tab_savemodel').attr('class', 'nav-link');

        //본문
        $('#tab_getdata_range').hide();
        $('#tab_info_range').hide();
        $('#tab_column_info_range').hide();
        $('#tab_preproc_range').show();
        $('#tab_getalgo_range').hide();
        $('#tab_savemodel_range').hide();
        $('#tab_preview_range').hide();
        //var preproc_order = 1;
        //var lastPreprocSet = getLastPreprocSet(preproc_order);

        //$('#tab_preproc_range').show();
        //$('#tab_validate_range').show();
        $("#tab_validate1").trigger("click");
        makePropertyListHtml();
    });

    $(document).on('click', '#tab_getalgo', function () {
        $('#tab_getdata').attr('class', 'nav-link');
        $('#tab_info').attr('class', 'nav-link');
        $('#tab_column_info').attr('class', 'nav-link');
        $('#tab_preproc').attr('class', 'nav-link');
        $('#tab_getalgo').attr('class', 'nav-link active');
        $('#tab_savemodel').attr('class', 'nav-link');

        //본문
        $('#tab_getdata_range').hide();
        $('#tab_info_range').hide();
        $('#tab_column_info_range').hide();
        $('#tab_preproc_range').hide();
        $('#tab_getalgo_range').show();
        $('#tab_savemodel_range').hide();
        $('#tab_preview_range').hide();
        goModelAlgo($('#modelSeq').val());
    });

    $(document).on('click', '#tab_savemodel', function () {
        var model_status = $('#model_status').val();
        if (model_status === 'DOING') {
            alert('모델 생성 중입니다.');
            return false;
        }

        if (model_status === 'FAIL') {
            alert('모델 생성에 실패 하였습니다.');
            let errorFrame = document.querySelector('#error_frame');
            if (errorFrame) {
                let err_type = errorFrame.querySelector('#err_type');
                let errCd = errorFrame.querySelector('#errCd');
                let errNm = errorFrame.querySelector('#errNm');
                let errLct = errorFrame.querySelector('#errLct');
                let errCn = errorFrame.querySelector('#errCn');
                let errRegDt = errorFrame.querySelector('#errRegDt');

                let errorModal = document.querySelector('#errorModal');
                let errTpElement = errorModal.querySelector('#errTp');
                let errCdElement = errorModal.querySelector('#errCd');
                let errNmElement = errorModal.querySelector('#errNm');
                let errLctElement = errorModal.querySelector('#errLct');
                let errCnElement = errorModal.querySelector('#errCn');
                let errRegDtElement = errorModal.querySelector('#errRegDt');

                errTpElement.innerHTML = `${err_type.dataset.value}`;
                errCdElement.innerHTML = `${errCd.dataset.value}`;
                errNmElement.innerHTML = `${errNm.dataset.value}`;
                errLctElement.innerHTML = `${errLct.dataset.value}`;
                errCnElement.innerHTML = `${errCn.dataset.value}`;
                errRegDtElement.innerHTML = `${errRegDt.dataset.value}`;

                console.log('errorModal', errorModal);
                $(errorModal).modal('show');
            }
            return false;
        }

        $('#tab_getdata').attr('class', 'nav-link');
        $('#tab_info').attr('class', 'nav-link');
        $('#tab_column_info').attr('class', 'nav-link');
        $('#tab_preproc').attr('class', 'nav-link');
        $('#tab_getalgo').attr('class', 'nav-link');
        $('#tab_savemodel').attr('class', 'nav-link active');

        //본문
        $('#tab_getdata_range').hide();
        $('#tab_info_range').hide();
        $('#tab_column_info_range').hide();
        $('#tab_preproc_range').hide();
        $('#tab_getalgo_range').hide();
        $('#tab_savemodel_range').show();
        $('#tab_preview_range').hide();

        if (model_status == 'DONE') {
            if ($("#predictionFileListCount").val() > 0) {
                var params = {"modelSeq": $("#modelSeq").val()}
                var loss = getLoss(params);
                var fid = getFID(params);

                var data_params = {"modelSeq": $("#modelSeq").val(), "count": 100}
                var testData = getTestData(data_params);

                //console.log(loss);
                //console.log(fid);
                //console.log(testData);


                var chart_type = 'line';
                var isTool;

                $(document).on('change', '#select_epoch', function () {
                    var optionVal = $("#select_epoch option:selected").val();

                    $("#real_img").attr("src", optionVal);
                    $("#fake_img").attr("src", optionVal.replace('real', 'fake'));
                });

                $(document).on('change', '#select_data', function () {
                    var optionVal = $("#select_data option:selected").val();
                    data_params = {"modelSeq": $("#modelSeq").val(), "count": optionVal}
                    testData = getTestData(data_params);

                    //console.log(data_params);
                    //console.log(testData);

                    viewTypeDefault(chart_type, testData, 2, true, false, isTool = true);
                    getDataView(testData["data_test"], testData["data_test_header"], "data_test");
                    getDataView(testData["data_pred"], testData["data_pred_header"], "data_pred");
                });

                viewTypeDefault(chart_type, testData, 2, true, false, isTool = true);
                viewTypeDefault(chart_type, loss, 0, false, false);
                viewTypeDefault(chart_type, fid, 1, false, false);

                getDataView(testData["data_test"], testData["data_test_header"], "data_test");
                getDataView(testData["data_pred"], testData["data_pred_header"], "data_pred");
            }
        }


    });

    $(document).on('click', '#tab_validate1', function () {
        $('#property_option').empty();
        $('#property_option_reset').show();

        $('#preprocTableRangeView').empty();
        var preprocCurrent = $('#preprocCurrent').val('validate');
        $('#tab_preproc_bottom_range').show();

        $('#tab_validate1').attr('class', 'nav-link active');
        $('#tab_outlier1').attr('class', 'nav-link');
        $('#tab_missing1').attr('class', 'nav-link');
        $('#tab_interval1').attr('class', 'nav-link');
        $('#tab_unit1').attr('class', 'nav-link');
        $('#btn-preproc-part').show();
        $('#tab_preproc_bottom_range').show();
        $('#inc_tab_validate').show();
        $('#tab_getdata_range').hide();
        $('#tab_info_range').hide();
        $('#tab_column_info_range').hide();
        $('#tab_preview_range').hide();
        $('#tab_preproc_range').show();
        //여기 클릭 트리거 발동 해야됨
        makePropertyListHtml();
        preprocessAutomaticOptionView(document.querySelector('#property_range .validate-section'), 1);
    });

    $(document).on('click', '#tab_outlier1', function () {
        $('#property_option').empty();
        $('#property_option_reset').show();
        $('#preprocTableRangeView').empty();
        var preprocCurrent = $('#preprocCurrent').val('outlier');

        $('#tab_preproc_bottom_range').show();

        $('#tab_validate1').attr('class', 'nav-link');
        $('#tab_outlier1').attr('class', 'nav-link active');
        $('#tab_missing1').attr('class', 'nav-link');
        $('#tab_interval1').attr('class', 'nav-link');
        $('#tab_unit1').attr('class', 'nav-link');
        makePropertyListHtml();
        preprocessAutomaticOptionView(document.querySelector('#property_range .outlier-section'), 1);
    });

    $(document).on('click', '#tab_missing1', function () {
        $('#property_option').empty();
        $('#property_option_reset').show();
        $('#preprocTableRangeView').empty();
        var preprocCurrent = $('#preprocCurrent').val('interpolate');

        $('#tab_preproc_bottom_range').show();

        $('#tab_validate1').attr('class', 'nav-link');
        $('#tab_outlier1').attr('class', 'nav-link');
        $('#tab_missing1').attr('class', 'nav-link active');
        $('#tab_interval1').attr('class', 'nav-link');
        $('#tab_unit1').attr('class', 'nav-link');
        makePropertyListHtml();
        preprocessAutomaticOptionView(document.querySelector('#property_range .interpolate-section'), 1);
    });

    $(document).on('click', '#tab_interval1', function () {
        $('#property_option').empty();
        $('#property_option_reset').show();
        $('#preprocTableRangeView').empty();
        var preprocCurrent = $('#preprocCurrent').val('resample');

        $('#tab_preproc_bottom_range').show();

        $('#tab_validate1').attr('class', 'nav-link');
        $('#tab_outlier1').attr('class', 'nav-link');
        $('#tab_missing1').attr('class', 'nav-link');
        $('#tab_interval1').attr('class', 'nav-link active');
        $('#tab_unit1').attr('class', 'nav-link');
        makePropertyListHtml();
        preprocessAutomaticOptionView(document.querySelector('#property_range .resample-section'), 1);
    });

    $(document).on('click', '#tab_unit1', function () {
        $('#property_option').empty();
        $('#property_option_reset').show();
        $('#preprocTableRangeView').empty();
        var preprocCurrent = $('#preprocCurrent').val('unit');

        $('#tab_preproc_bottom_range').show();

        $('#tab_validate1').attr('class', 'nav-link');
        $('#tab_outlier1').attr('class', 'nav-link');
        $('#tab_missing1').attr('class', 'nav-link');
        $('#tab_interval1').attr('class', 'nav-link');
        $('#tab_unit1').attr('class', 'nav-link active');
        makePropertyListHtml();
        preprocessAutomaticOptionView(document.querySelector('#property_range .unit-section'), 1);
    });

    function preprocessAutomaticOptionView(container, order) {
        console.log('preprocessAutomaticOptionView', container, order);
        if (container) {
            let options = container.querySelectorAll('a[data-set-order]');
            let firstOption = true;
            options.forEach(function (option) {
                console.log('option', option);
                if (option.dataset.setOrder === order || option.dataset.setOrder === (order + '')) {
                    $(option).trigger('click');
                    firstOption = false;
                }
            });
            if (firstOption) {
                options.forEach(function (option, index) {
                    console.log('option', option, 'index', index);
                    if (index === 0) {
                        $(option).trigger('click');
                    }
                });
            }
        } else {
            console.warn(`preprocessAutoViewOption 함수의 container 변수가 존재하지 않습니다.`);
        }
    }

    //////////////////////////////뷰화면 탭클릭 처리 끝////////////////////////////////////////////
});

function makeInfoHtmlJsonProperty(set_order) {
    var preprocCurrent = $('#preprocCurrent').val();

    var strHTML;

    var strHTML = '';
    strHTML += '				<div class="col-md-12 grid-margin  stretch-card">';
    strHTML += '				<div class="card">';
    strHTML += '					<div class="card-body">';
    strHTML += '						<div class="form-group">';
    strHTML += '						    <div class="row">';
    strHTML += '				        		<div class="col" id="property_option_reset" style="display: none;">';
    strHTML += '우측의 설정 목록에서 옵션을 선택하세요.';
    strHTML += '				        		</div>';
    strHTML += '				        	</div>';
    strHTML += '						    <div class="row">';
    strHTML += '				        		<div class="col" id="property_option">';
    strHTML += makePropertyView(preprocCurrent, set_order);
    strHTML += '				        		</div>';
    strHTML += '				        	</div>';
    strHTML += '				        </div>';
    strHTML += '				    </div>';
    strHTML += '				</div>';
    strHTML += '				</div>';

    $('#preprocOptionRangeView').html(strHTML);

}

function makePropertyView(preprocCurrent, set_order_param) {

    var form_type = $('#formType').val();
    var jsonData = JSON.parse($('#preprocProPerty').val());
    var propertyRangeDiv = $('#property_range');
    var preprocProperty = jsonData.preproc_property_info[0].preproc_property;

    var strHTML = '';

    preprocProperty.forEach(function (property) {
        var preprocOrder = property.preproc_order;
        var preprocType = property.preproc_type;
        var preprocSet = property.preproc_set;

        if (preprocSet.length > 0) {
            preprocSet.forEach(function (set) {
                if (preprocCurrent == 'validate') {
                    if (preprocOrder == 1) {

                        if (set.set_order == set_order_param) {
                            strHTML += '<div>';
                            strHTML += '<font color="red"><B>컬럼</B></font>: ' + set.trgt_col + ',&nbsp;&nbsp;&nbsp;';
                            strHTML += '<font color="red"><B>검증 방법</B></font>: ' + set.vrfc_tp_nm + ',&nbsp;&nbsp;&nbsp;';
                            strHTML += '<font color="red"><B>검증 형식</B></font>: ' + set.vrfc_sub_tp_nm + ',&nbsp;&nbsp;&nbsp;';
                            strHTML += '<font color="red"><B>지정 여부</B></font>: ' + set.vrfc_clear_tp_nm;
                            strHTML += '</div>';
                        }
                    }
                }

                if (preprocCurrent == 'outlier') {
                    if (preprocOrder == 2) {
                        if (set.set_order == set_order_param) {
                            strHTML += '<div>';
                            strHTML += '<font color="red"><B>대상 컬럼</B></font>: ' + set.trgt_col + ',&nbsp;&nbsp;&nbsp;';
                            strHTML += '<font color="red"><B>이상치 옵션</B></font>: ' + set.outlier_tp + ',&nbsp;&nbsp;&nbsp;';
                            if (set.outlier_tp == 'standard') {
                                strHTML += '<font color="red"><B>샘플링 길이</B></font>: ' + set.freq + ',&nbsp;&nbsp;&nbsp;';
                                strHTML += '<font color="red"><B>정규분포 경계</B></font>: ' + set.p_value;
                            } else if (set.outlier_tp == 'keman') {
                                strHTML += '<font color="red"><B>샘플링 길이</B></font>: ' + set.freq + ',&nbsp;&nbsp;&nbsp;';
                                strHTML += '<font color="red"><B>clusters 수</B></font>: ' + set.n_clusters + ',&nbsp;&nbsp;&nbsp;';
                                strHTML += '<font color="red"><B>clusters 그룹</B></font>: ' + set.clusters_group;
                            } else {
                                strHTML += '<font color="red"><B>샘플링 길이</B></font>: ' + set.freq + ',&nbsp;&nbsp;&nbsp;';
                                strHTML += '<font color="red"><B>eps</B></font>: ' + set.eps + ',&nbsp;&nbsp;&nbsp;';
                                strHTML += '<font color="red"><B>min_samples</B></font>: ' + set.min_samples;
                            }
                            strHTML += '</div>';
                        }
                    }
                }
                if (preprocCurrent == 'interpolate') {
                    if (preprocOrder == 3) {

                        if (set.set_order == set_order_param) {
                            strHTML += '<div>';
                            strHTML += '<font color="red"><B>보간 옵션</B></font>: ' + set.interpl_tp;
                            strHTML += '</div>';
                        }

                    }
                }
                if (preprocCurrent == 'resample') {
                    if (preprocOrder == 4) {
                        if (set.set_order == set_order_param) {
                            strHTML += '<div>';
                            strHTML += '<font color="red"><B>데이터 간격</B></font>: ' + set.resmpl_tp_nm + ',&nbsp;&nbsp;&nbsp;';
                            strHTML += '<font color="red"><B>데이터 간격 변환</B></font>: ' + set.resmpl_intvl_value;

                            strHTML += '</div>';
                        }
                    }
                }
                if (preprocCurrent == 'unit') {
                    if (preprocOrder == 5) {
                        if (set.set_order == set_order_param) {
                            strHTML += '<div>';
                            strHTML += '<font color="red"><B>컬럼</font>: ' + set.trgt_col + ',&nbsp;&nbsp;&nbsp;';
                            strHTML += '<font color="red"><B>변환유형</B></font>: ' + set.unit_tp_nm + ',&nbsp;&nbsp;&nbsp;';
                            strHTML += '<font color="red"><B>현재단위</B></font>: ' + set.unit_cd_1_nm + ',&nbsp;&nbsp;&nbsp;';
                            strHTML += '<font color="red"><B>변환단위</B></font>: ' + set.unit_cd_2_nm;
                            strHTML += '</div>';
                        }
                    }
                }
            });
        }
    });


    return strHTML;

}