(function () {
    'use strict'
    $(document).ready(function () {
        //초기 설정 및 초기화 구간
        if ($('#formType').val() !== 'U') {
            var preProcData = preProcTemplate();
            $('#preprocProPerty').val(JSON.stringify(preProcData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));
            $('#metaListDataTable').DataTable({
                destroy: true,
                autoWidth: false,
                pageLength: 4, //scrollX: true, // 수평 스크롤 활성화
                //scrollCollapse: true, // 스크롤이 축소될 때 테이블 크기 축소
                //autoWidth: true, // 테이블 너비 자동 조정
                columnDefs: [{"width": "15%", "targets": 0}],
                order: [[0, 'asc']],
                searching: true,
                info: false,
                lengthChange: false
            });
        }
        let selectedValue = $('input[name="dataUseTp"]:checked').val();
        $('#base_file_nm_set_range_row_check').val('N');
        if (selectedValue === 'F') {
            $('.file-upload-data').show();
            $('.meta-data').hide();
        } else if (selectedValue === 'M') {
            $('.file-upload-data').hide();
            $('.meta-data').show();
        } else {
            $('.file-upload-data').hide();
            $('.meta-data').hide();
        }

        //데이터 유형 선택 이벤트
        $('input[name="dataUseTp"]').change(function () {
            let selectedValue = $('input[name="dataUseTp"]:checked').val();
            if (selectedValue === 'F') {
                $('.file-upload-data').show();
                $('.meta-data').hide();
            }
            if (selectedValue === 'M') {
                $('.file-upload-data').hide();
                $('.meta-data').show();
            }
        });

        //데이터 유형 선택 파일 업로드
        let selectDataContainer = document.querySelector('[data-action-container="select_data"]');
        const fileInput = selectDataContainer?.querySelector('#attachFilesCsv');
        const fileLabel = selectDataContainer?.querySelector('#attachFilesCsv_input');

        // Event listener for file selection
        fileInput?.addEventListener('change', (e) => {
            let file;
            let fileName;
            if (e.target.files.length !== 0) {
                file = e.target.files[0];
                fileName = file.name;
            } else {
                fileName = '클릭하여 파일을 업로드 해주세요.';
            }
            fileLabel.value = fileName;
            if (file) {
                let ext = file.name.substring(file.name.lastIndexOf('.') + 1, file.name.length);
                ext = ext.toLowerCase();
                if (ext !== 'csv') {
                    alert('확장자가 csv인  파일만 첨부가능합니다.');
                    window.location.reload();
                } else {
                    uploadFile(function () {
                        $('#tab_getdata_range').hide();
                        $('#tab_info_range').show();
                        $('#tab_preview_range').show();

                        $('#tab_getdata').attr('class', 'nav-link');
                        $('#tab_info').attr('class', 'nav-link active');
                        $('#tab_column_info').attr('class', 'nav-link');
                        $('#tab_preproc').attr('class', 'nav-link');
                        $('#tab_getalgo').attr('class', 'nav-link');
                        $('#tab_savemodel').attr('class', 'nav-link');
                        $('#tab_history').attr('class', 'nav-link');
                        $('#next_button_info_range').show();
                    });
                }
            }
        });

        const resetButton = selectDataContainer?.querySelector('#clearButton');
        // Event listener for reset button
        resetButton?.addEventListener('click', () => {
            fileInput.value = '';  // Clear the file input
            fileLabel.value = '클릭하여 파일을 업로드 해주세요.';  // Reset the label text
        });

        //트윈 검색 이벤트
        $(document).on('click', '.btn-meta-search', function () {
            let meta_model_name = $('#meta_model_name').val();

            if (meta_model_name.lenth < 0) {
                alert('트윈명을 입력하세요.');
                return false;
            }

            let data = {
                srchText: meta_model_name
            }
            showProgressBar({element: null, process_id: 'process-8'});
            $.ajax({
                type: "POST", //async: false,
                url: '/dt/meta/api/v1/resource/dts',
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                success: function (result) {
                    if (result.code === 200) {
                        let apiListContainer = document.querySelector('.api-list');
                        if (apiListContainer.style.display !== 'flex') {
                            apiListContainer.style.display = 'flex';
                        }
                        let listTableContainer = document.querySelector('#search_meta_api_list_table');
                        makeMetaApiListTable(result.data, listTableContainer, 'metaApiListDataTable');
                        listTableContainer.style.display = 'block';
                        $('#metaApiListDataTable').DataTable({
                            order: [[0, 'asc']],
                            searching: true,
                            info: false,
                            lengthChange: false,
                            autoWidth: false,
                            lengthMenu: [[5], [5]],
                            destroy: true
                        });
                        closeProgressBar({element: null, process_id: 'process-8'});
                    } else {
                        closeProgressBar({element: null, process_id: 'process-8'});
                        alert('API 내 에러 발생');
                    }
                },
                error: function (xhr, status, error) {
                    closeProgressBar({element: null, process_id: 'process-8'});
                    console.error('error : ', error);
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            });
        });

        //트윈 목록 선택 이벤트
        $(document).on('click', '.btn-object-list', function () {
            var twinId = $(this).data('twin-id');

            var data = {
                //curPage: 1,
                //pageListSize: 10,
                digitalTwinId: twinId
                //srchText: '유동인구'
            }
            showProgressBar({element: null, process_id: 'process-9'});
            $.ajax({
                type: "POST", //async: false,
                url: '/dt/meta/api/v1/resource/objects',
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                success: function (result) {
                    if (result.code === 200) {
                        let apiListContainer = document.querySelector('.api-list');
                        if (apiListContainer.style.display !== 'flex') {
                            apiListContainer.style.display = 'flex';
                        }
                        let listTableContainer = document.querySelector('#search_meta_api_list_table_obj');
                        makeMetaApiObjectListTable(result.data, listTableContainer, 'metaApiListDataTableObj');
                        listTableContainer.style.display = 'block';
                        $('#metaApiListDataTableObj').DataTable({
                            order: [[0, "asc"]],
                            searching: true,
                            info: false,
                            lengthChange: false,
                            autoWidth: false,
                            lengthMenu: [[5], [5]],
                            destroy: true
                        });
                        $('html, body').animate({scrollTop: $(document).height()}, 'slow');
                        closeProgressBar({element: null, process_id: 'process-9'});
                    } else {
                        closeProgressBar({element: null, process_id: 'process-9'});
                        alert('API 내 에러 발생');
                    }
                },
                error: function (xhr, status, error) {
                    console.error('error : ', error);
                    closeProgressBar({element: null, process_id: 'process-9'});
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            });
        });

        //오브젝트 선택 이벤트
        $(document).on('click', '.btn-pop-api-view', function () {
            let $this = $(this);
            let objectId = $this.data('object-id');
            let twinId = $this.data('twin-id');
            displayMetaInfoModal(twinId, objectId, function (data) {
                if (data) {
                    try {
                        $('#metaModel').val(data.metaModel || '');
                        $('#digitalObjectName').val(data.digitalObjectName || '');
                        $('#digitalObjectDataSourceUrl').val(data.digitalObjectDataSourceUrl || '없음');
                        $('#description').val(data.description || '');

                        $('#digitalObjectId').val(data.digitalObjectId || '');
                        $('#digitalTwinId').val(twinId);

                        $('#digitalObjectDataModel').val(prettyJson(data.digitalTwinObjectData.digitalObjectDataModel));
                        $('#digitalObjectDataSample').val(prettyJson(data.digitalTwinObjectData.digitalObjectDataSample));

                        console.log('digitalObjectDataModel', JSON.parse(data.digitalTwinObjectData.digitalObjectDataModel));
                        console.log('digitalObjectDataSample', JSON.parse(data.digitalTwinObjectData.digitalObjectDataSample));

                        //모달 오픈
                        const modalPopupId = $this.data('popup-id');
                        console.log('modalPopupId', modalPopupId);
                        document.getElementById(modalPopupId).classList.add('is-open');
                    } catch (e) {
                        console.error('Error parsing data:', e);
                        alert('데이터를 불러오는데 실패했습니다. 데이터 형식을 확인해주세요.');
                    }
                } else {
                    alert('데이터를 불러오는데 실패했습니다.');
                }
            });
        });

        //오브젝트 선택하고 팝업에서 가져오기 했을 때, 메타 정보 긁어서 파일로 만들기
        $(document).on('click', '.btn-get-meta-all-info', function () {
            var digitalTwinId = $('#digitalTwinId').val();
            var digitalObjectId = $('#digitalObjectId').val();

            var digitalObjectName = $('#digitalObjectName').val();
            var digitalObjectDataSourceUrl = $('#digitalObjectDataSourceUrl').val();
            var description = $('#description').val();
            var digitalObjectDataModel = $('#digitalObjectDataModel').val();
            var digitalObjectDataSample = $('#digitalObjectDataSample').val();

            getBaseDataCallback(digitalTwinId, digitalObjectId, digitalObjectName, digitalObjectDataSourceUrl, description, digitalObjectDataModel, function (result) {
                if (result.header_list.length === 0 || result.data_list.length === 0) {
                    alert('선택하신 오브젝트에 가져올 데이터가 없습니다.');
                } else {
                    $('#tab_getdata_range').hide();
                    $('#tab_info_range').show();
                    $('#tab_preview_range').show();
                    $('#tab_getdata').attr('class', 'nav-link');
                    $('#tab_info').attr('class', 'nav-link active');
                    $('#tab_column_info').attr('class', 'nav-link');
                    $('#tab_preproc').attr('class', 'nav-link');
                    $('#tab_getalgo').attr('class', 'nav-link');
                    $('#tab_savemodel').attr('class', 'nav-link');
                    $('#tab_history').attr('class', 'nav-link');
                    $('#next_button_info_range').show();
                }
            });
        });
    });
})();

// 메타 정보를 가져오고 표시하는 함수 (콜백 방식)
function displayMetaInfoModal(twinId, objectId, callback) {
    showProgressBar({element: null, process_id: 'process-10'});
    fetchMetaInfo(twinId, objectId, function (data) {
        closeProgressBar({element: null, process_id: 'process-10'});
        if (data) {
            callback(data);
        } else {
            callback();
        }
    });
}

// 메타 정보 API 요청 함수 (콜백 방식)
function fetchMetaInfo(twinId, objectId, callback) {
    let data = {
        twin_id: twinId, object_id: objectId, row_count: 2
    };

    $.ajax({
        type: 'POST',
        url: '/dt/meta/api/v1/resource/objects/detail',
        data: JSON.stringify(data),
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: function (response) {
            console.log('fetchMetaInfo result', response);
            if (response.code === 200) {
                callback(response.data);
            } else {
                alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                callback(null);
            }
        },
        error: function (xhr, status, error) {
            console.error('AJAX error:', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
            callback(null);
        }
    });
}

function uploadFile(callback) {
    let form = $('#editForm')[0];
    let formData = new FormData(form);
    showProgressBar({element: null, process_id: 'process-7'});
    $.ajax({
        type: 'POST', //enctype: 'multipart/form-data',
        url: '/dt/dataset/csvFileUpload/META_ETC_MODEL',
        data: formData,
        processData: false,
        contentType: false,
        success: function (result) {
            try {
                if (result.code === 200) {
                    let header_list = result.header_list;
                    let data_list = result.data_list;

                    if (header_list.length === 0 || data_list.length === 0) {
                        alert('선택하신 파일에 가져올 데이터가 없습니다.');
                        closeProgressBar({element: null, process_id: 'process-7'});
                        return;
                    }

                    let preProcData = preProcTemplate();
                    preProcData.preproc_property_info[0].twin_id = null;
                    preProcData.preproc_property_info[0].twin_obj_id = null;
                    preProcData.preproc_property_info[0].base_dir = result.base_dir;
                    preProcData.preproc_property_info[0].base_file_nm = result.file_name;
                    preProcData.preproc_property_info[0].target_row_count = result.limit;
                    preProcData.preproc_property_info[0].data_use_tp = 'F';

                    $('#preprocProPerty').val(JSON.stringify(preProcData));
                    $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

                    //결과값으로 테이블 만들기
                    let csvUpRange = document.querySelector('#csvUpRange');
                    csvUpRange.innerHTML = ``;
                    makeFilterHTML(header_list, csvUpRange, result.limit, null, null, null);
                    let csvUpRangeTableContainer = csvUpRange.querySelector('.table-scroll-parent');
                    data_list = [];
                    makeDataTableHTML(header_list, data_list, csvUpRangeTableContainer, 'csvUpRangeDataTable', function (table) {
                        callback();
                        $(table).DataTable({
                            columnDefs: [{
                                targets: '_all', className: 'text-nowrap', searchable: false
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
                                    data.target_row_count = parseInt(result.target_row_count);
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
                    closeProgressBar({element: null, process_id: 'process-7'});
                } else {
                    console.error('uploadFile', result);
                    closeProgressBar({element: null, process_id: 'process-7'});
                    alert('API 에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            } catch (error) {
                console.error('uploadFile', error);
                closeProgressBar({element: null, process_id: 'process-7'});
                alert('API 에러가 발생하였습니다. 관리자에게 문의하십시오.');
            }
        }
    });
}

//가져오기 클릭 시  초기 설정 없이 갯수제한만 걸고 가져올 메타에 대한 원본 데이터
function getBaseDataCallback(twin_id, object_id, sdt_nm, sdt_data_url, sdt_derpn, sdt_full_text, callback) {
    var data = {
        digital_twins: twin_id, digital_objects: object_id
    }
    showProgressBar({element: null, process_id: 'process-11'});
    ajaxPost('/dt/meta/api/v1/resource/objects/detail/set/file/META_ETC_MODEL', data, function (result) {
        if (result.code === 200) {
            if (result.header_list.length === 0 || result.data_list.length === 0) {
                closeProgressBar({element: null, process_id: 'process-11'});
                callback(result);
                return;
            }
            let header_list = result.header_list;
            let data_list = result.data_list;
            let preProcData = preProcTemplate();
            preProcData.preproc_property_info[0].twin_id = twin_id;
            preProcData.preproc_property_info[0].twin_obj_id = object_id;
            preProcData.preproc_property_info[0].base_dir = result.base_dir;
            preProcData.preproc_property_info[0].base_file_nm = result.file_name;
            preProcData.preproc_property_info[0].target_row_count = result.limit;
            preProcData.preproc_property_info[0].data_use_tp = 'M';

            $('#preprocProPerty').val(JSON.stringify(preProcData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

            //결과값으로 테이블 만들기
            let csvUpRange = document.querySelector('#csvUpRange');
            csvUpRange.innerHTML = ``;
            makeFilterHTML(header_list, csvUpRange, result.limit, null, null, null);
            let csvUpRangeTableContainer = csvUpRange.querySelector('.table-scroll-parent');
            data_list = [];
            makeDataTableHTML(header_list, data_list, csvUpRangeTableContainer, 'csvUpRangeDataTable', function (table) {
                callback(result);
                $(table).DataTable({
                    columnDefs: [{
                        targets: '_all',
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
                            data.target_row_count = parseInt(result.target_row_count);
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
            closeProgressBar({element: null, process_id: 'process-11'});
        } else {
            console.error('error : ', result);
            closeProgressBar({element: null, process_id: 'process-11'});
            alert('API 에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}