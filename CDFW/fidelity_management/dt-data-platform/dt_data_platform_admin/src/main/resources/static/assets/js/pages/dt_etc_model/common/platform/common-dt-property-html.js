'use strict'
$(document).ready(function () {

    $(document).on("click", ".btn-property-file-view", function () {
        var form_type = $('#formType').val();
        var file_name = $(this).data("trgt-file-nm");
        var set_order = $(this).data('set-order');

        var jsonData = JSON.parse($('#preprocProPerty').val());

        var file_path;
        if (form_type == 'I') {
            file_path = jsonData.preproc_property_info[0].base_dir;
        } else {
            file_path = $('#lastFilePath').val();
        }

        if (form_type == 'I') {
            viewPreprocFile(form_type, file_name, file_path, 'preprocTableRange', 'fileViewDataTableRange');
        } else {
            viewPreprocFile(form_type, file_name, file_path, 'preprocTableRangeView', 'fileViewDataTableRange2');
        }

    });


    $(document).on("click", ".btn-property-delete", function () {

        var con = confirm('삭제 지점 기준으로 이후 작업한 모든 데이터가 사라집니다. 진행 하시겠습니까?');
        if (con == true) {

            var jsonData = JSON.parse($('#preprocProPerty').val());
            var file_path = jsonData.preproc_property_info[0].base_dir

            var preprocOrder = $(this).data("preproc-order");
            var setOrder = $(this).data("set-order");
            var propertyInfo = jsonData.preproc_property_info[0];
            var preprocProperty = propertyInfo.preproc_property;

            var filesToRemove = [];

            //전체 단계 삭제시
            for (var j = preprocProperty.length - 1; j >= 0; j--) {
                var property = preprocProperty[j];
                if (property.preproc_order >= preprocOrder) {
                    var setsToRemove = [];
                    for (var k = 0; k < property.preproc_set.length; k++) {
                        if (property.preproc_order == preprocOrder && property.preproc_set[k].set_order >= setOrder) {
                            filesToRemove.push(property.preproc_set[k].trgt_file_nm);
                            setsToRemove.push(k);
                        } else if (property.preproc_order > preprocOrder) {
                            filesToRemove.push(property.preproc_set[k].trgt_file_nm);
                            setsToRemove.push(k);
                        }
                    }
                    // 삭제할 요소들을 역순으로 순회하여 삭제
                    for (var l = setsToRemove.length - 1; l >= 0; l--) {
                        property.preproc_set.splice(setsToRemove[l], 1);
                    }
                }
            }

            deletePreprocFiles(filesToRemove, file_path);

            /*
            //단계별
            for (var j = 0; j < preprocProperty.length; j++) {
                var property = preprocProperty[j];
                if (property.preproc_order == preprocOrder) {
                    var setsToRemove = [];
                    for (var k = 0; k < property.preproc_set.length; k++) {
                        if (property.preproc_set[k].set_order >= setOrder) {
                        	filesToRemove.push(property.preproc_set[k].trgt_file_nm);
                        	setsToRemove.push(k);
                        }
                    }
                    // 삭제할 요소들을 역순으로 순회하여 삭제
                    for (var l = setsToRemove.length - 1; l >= 0; l--) {
                        property.preproc_set.splice(setsToRemove[l], 1);
                    }            	
                }
            }
            */

            // 업데이트된 JSON 데이터 hidden 요소에 넣기
            $('#preprocProPerty').val(JSON.stringify(jsonData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(jsonData)));

            getTotalLastFile();
            makePropertyListHtml();

            //체크된 파일 삭제
            console.log(filesToRemove);
            $('#preprocTableRange').empty();

        } else {
            return false;
        }

    });

    /*
    $(document).on("click", ".btn-property-delete", function() {
    	var jsonData = JSON.parse($('#preprocProPerty').val());
    	
        var preprocOrder = $(this).data("preproc-order");
        var setOrder = $(this).data("set-order");
        
        // preproc_order와 set_order를 사용하여 조건을 만족하는 요소를 찾기
        var updatedPreProcData = jsonData.preproc_property_info.map(function(propertyInfo) {
            var updatedProperty = propertyInfo.preproc_property.map(function(property) {
                if (property.preproc_order === preprocOrder) {
                    // set_order가 클릭된 버튼의 set_order보다 큰 경우 추출
                    property.preproc_set = property.preproc_set.filter(function(set) {
                        return set.set_order <= setOrder;
                    }).map(function(filteredSet) {
                        return filteredSet.trgt_file_nm;
                    });
                }
                return property;
            });

            propertyInfo.preproc_property = updatedProperty;
            return propertyInfo;
        });

        // 업데이트된 JSON 데이터 hidden 요소에 넣기
        console.log(JSON.stringify(updatedPreProcData));
        //$('#hiddenJsonData').val(JSON.stringify(updatedPreProcData));

        
        // 예시로 콘솔에 출력하여 확인
        console.log("Updated PreProcData:", updatedPreProcData);
        
    });    
    */

});

function deletePreprocFiles(filesToRemove, file_path) {
    var data = {
        file_path: file_path, files: filesToRemove
    }

    $.ajax({
        type: 'POST', //async: false,
        //enctype: 'multipart/form-data',
        url: '/dt/dataset/delete/files/META_ETC_MODEL',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            if (result.result_code == 200) {
                console.log('Files deleted successfully:');
            }
        },
        error: function (xhr, status, error) {
            console.error('error : ', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });


}

function makePropertyListHtml() {
    var preprocCurrent = $('#preprocCurrent').val();

    //validate, outlier, interpolate, resample, unit

    $('#property_range').empty();
    var form_type = $('#formType').val();
    var jsonData = JSON.parse($('#preprocProPerty').val());
    var propertyRangeDiv = $('#property_range');
    var preprocProperty = jsonData.preproc_property_info[0].preproc_property;

    var strHTML = '';

    preprocProperty.forEach(function (property) {
        var preprocOrder = property.preproc_order;
        var preprocType = property.preproc_type;
        var preprocSet = property.preproc_set;

        if (preprocCurrent == 'validate') {
            if (preprocOrder == 1) {
                strHTML += '<div><h6>설정 목록 : 유효성</h6></div><hr/>'
            }
        }
        if (preprocCurrent == 'outlier') {
            if (preprocOrder == 2) {
                strHTML += '<div><h6>설정 목록 : 이상치</h6></div><hr/>'
            }
        }
        if (preprocCurrent == 'interpolate') {
            if (preprocOrder == 3) {
                strHTML += '<div><h6>설정 목록 : 결측치</h6></div><hr/>'
            }
        }
        if (preprocCurrent == 'resample') {
            if (preprocOrder == 4) {
                strHTML += '<div><h6>설정 목록 : 리샘플링</h6></div><hr/>'
            }
        }
        if (preprocCurrent == 'unit') {
            if (preprocOrder == 5) {
                strHTML += '<div><h6>설정 목록 : 단위변환</h6></div><hr/>'
            }
        }


        if (preprocSet.length > 0) {
            preprocSet.forEach(function (set) {
                if (preprocCurrent == 'validate') {
                    if (preprocOrder == 1) {
                        strHTML += '<div>';

                        //strHTML += '#' + set.set_order + ': ';
                        strHTML += '<a href="#none" class="btn-property-file-view" data-set-order="' + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">';
                        strHTML += set.trgt_col + ' | ';
                        strHTML += set.vrfc_tp_nm + ' | ';
                        strHTML += set.vrfc_sub_tp_nm + ' | ';
                        strHTML += set.vrfc_clear_tp_nm + '  ';
                        strHTML += '</a>';

                        if (form_type == 'I') {
                            strHTML += '<div class="btn-group mr-2" role="group">'
                            strHTML += '<button type="button" class="btn-sm btn-danger btn-property-delete" data-set-order="' + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">X</button><br>';
                            strHTML += '</div>';

                        }

                        /*
                        strHTML += '컬럼:' + set.trgt_col + '<br/>';
                        strHTML += '검증방법:' + set.vrfc_tp_nm + '<br/>';
                        strHTML += '검증형식:' + set.vrfc_sub_tp_nm + '<br/>';
                        strHTML += '지정여부:' + set.vrfc_clear_tp_nm + '<br/>';
                        */
                        strHTML += '</div>';
                        strHTML += '<hr>';
                    }
                }

                if (preprocCurrent == 'outlier') {
                    if (preprocOrder == 2) {
                        strHTML += '<div>';

                        strHTML += '<a href="#none" class="btn-property-file-view" data-set-order="' + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">';
                        strHTML += set.trgt_col + ' | ';
                        strHTML += set.outlier_tp + ' | ';
                        if (set.outlier_tp == 'standard') {
                            strHTML += 'fq:' + set.freq + ' | ';
                            strHTML += 'pv:' + set.p_value + '  ';
                        } else if (set.outlier_tp == 'keman') {
                            strHTML += 'fq:' + set.freq + ' | ';
                            strHTML += 'cc:' + set.n_clusters + ' | ';
                            strHTML += 'cg:' + set.clusters_group + '  ';
                        } else {
                            strHTML += 'fq:' + set.freq + ' | ';
                            strHTML += 'eps:' + set.eps + ' | ';
                            strHTML += 'ms:' + set.min_samples + '  ';
                        }
                        strHTML += '</a>';


                        if (form_type == 'I') {
                            strHTML += '<div class="btn-group mr-2" role="group">'
                            strHTML += '<button type="button" class="btn-sm btn-danger btn-property-delete" data-set-order="' + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">X</button><br>';
                            strHTML += '</div>';

                        }

                        /*
                        strHTML += '컬럼:' + set.trgt_col + '<br/>';
                        strHTML += '이상치옵션:' + set.outlier_tp + '<br/>';
                        if (set.outlier_tp == 'standard') {
                            strHTML += '샘플링:' + set.freq + '<br/>';
                            strHTML += '정규분포 경계:' + set.p_value + '<br/>';
                        } else if (set.outlier_tp == 'keman') {
                            strHTML += '샘플링:' + set.freq + '<br/>';
                            strHTML += 'clusters 수:' + set.n_clusters + '<br/>';
                            strHTML += 'clusters 그룹:' + set.clusters_group + '<br/>';
                        } else {
                            strHTML += '샘플링:' + set.freq + '<br/>';
                            strHTML += 'eps:' + set.eps + '<br/>';
                            strHTML += 'min_samples:' + set.min_samples + '<br/>';
                        }
                        */
                        strHTML += '</div>';
                        strHTML += '<hr>';
                    }
                }
                if (preprocCurrent == 'interpolate') {
                    if (preprocOrder == 3) {
                        strHTML += '<div>';

                        strHTML += '<a href="#none" class="btn-property-file-view" data-set-order="' + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">';
                        strHTML += '보간 옵션: ' + set.interpl_tp + '  ';
                        strHTML += '</a>';

                        if (form_type == 'I') {
                            strHTML += '<div class="btn-group mr-2" role="group">'
                            strHTML += '<button type="button" class="btn-sm btn-danger btn-property-delete" data-set-order="' + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">X</button><br>';
                            strHTML += '</div>';

                        }

                        strHTML += '</div>';
                        strHTML += '<hr>';
                    }
                }
                if (preprocCurrent == 'resample') {
                    if (preprocOrder == 4) {
                        strHTML += '<div>';

                        strHTML += '<a href="#none" class="btn-property-file-view" data-set-order="' + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">';
                        strHTML += '간격 유형: ' + set.resmpl_tp_nm + ' | ';
                        strHTML += '간격 수치: ' + set.resmpl_intvl_value + '  ';
                        strHTML += '</a>';

                        if (form_type == 'I') {
                            strHTML += '<div class="btn-group mr-2" role="group">'
                            strHTML += '<button type="button" class="btn-sm btn-danger btn-property-delete" data-set-order="' + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">X</button><br>';
                            strHTML += '</div>';

                        }

                        strHTML += '</div>';
                        strHTML += '<hr>';

                    }
                }
                if (preprocCurrent == 'unit') {
                    if (preprocOrder == 5) {
                        strHTML += '<div>';

                        strHTML += '<a href="#none" class="btn-property-file-view" data-set-order="' + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">';
                        strHTML += set.trgt_col + ' | ';
                        strHTML += set.unit_tp_nm + ' | ';
                        strHTML += set.unit_cd_1_nm + ' | ';
                        strHTML += set.unit_cd_2_nm + '  ';
                        strHTML += '</a>';

                        if (form_type == 'I') {
                            strHTML += '<div class="btn-group mr-2" role="group">'
                            strHTML += '<button type="button" class="btn-sm btn-danger btn-property-delete" data-set-order="' + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">X</button><br>';
                            strHTML += '</div>';

                        }

                        /*
                        else {
                                strHTML += '<button type="button" class="btn-sm btn-success btn-property-file-view" data-set-order="' + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">보기</button><br>';
                        }
                        */
                        /*
                        strHTML += '컬럼:' + set.trgt_col + '<br/>';
                        strHTML += '변환유형:' + set.unit_tp_nm + '<br/>';
                        strHTML += '현재단위:' + set.unit_cd_1_nm + '<br/>';
                        strHTML += '변환단위:' + set.unit_cd_2_nm + '<br/>';
                        */
                        strHTML += '</div>';
                        strHTML += '<hr>';
                    }
                }
            });
        }
        //propertyRangeDiv.append('<div><h6>Preprocess Order: ' + preprocOrder + ' - Type: ' + preprocType + '</h6>' + buttonHtml + '</div>');
    });


    $('#property_range').html(strHTML);

}

function viewPreprocFile(form_type, file_name, file_path, position_id, datatable_id) {
    let data = {
        form_type: form_type, file_path: file_path, file_name: file_name
    }
    showProgressBar({element: null, process_id: 'process-2'});
    $.ajax({
        type: "POST",
        url: '/dt/dataset/load/preprocFile/META_ETC_MODEL',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            try {
                if (result.code === 200) {
                    closeProgressBar({element: null, process_id: 'process-2'});
                    let header_list = result.header_list;
                    let data_list = result.data_list;
                    let csvUpRange = document.querySelector(`#${position_id}`);
                    csvUpRange.innerHTML = ``;
                    data_list = [];
                    makeDataTableHTML(header_list, data_list, csvUpRange, datatable_id, function (table) {
                        $(table).DataTable({
                            columnDefs: [{
                                targets: '_all', className: 'text-nowrap',
                                searchable: false
                            }],
                            order: [[0, "asc"]],
                            searching: false,
                            info: false,
                            bServerSide: true,
                            ajax: {
                                url: "/datatable/server/render",
                                type: "POST",
                                dataType: "json",
                                data: function (data) {
                                    data.file_name = result.file_name;
                                    data.file_path = result.file_path;
                                    data.target_row_count = 0;
                                    return JSON.stringify(data);
                                }
                            },
                            lengthChange: false,
                            autoWidth: true,
                            lengthMenu: [[10], [10]],
                            scrollX: true,
                            deferRender: true,
                            destroy: true
                        });
                    });
                } else {
                    closeProgressBar({element: null, process_id: 'process-2'});
                    alert('API 내 에러 발생');
                }
            } catch (error) {
                console.error('viewPreprocFile', error);
                closeProgressBar({element: null, process_id: 'process-2'});
            }
        },
        error: function (xhr, status, error) {
            console.error('viewPreprocFile', error);
            closeProgressBar({element: null, process_id: 'process-2'});
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });

}
