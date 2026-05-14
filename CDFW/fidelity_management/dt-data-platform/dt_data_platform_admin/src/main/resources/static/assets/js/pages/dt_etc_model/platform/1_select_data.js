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
            let dTw_attr_name = $('#meta_model_name').val();

            // 1. 프로그레스 바 시작
            showProgressBar({element: null, process_id: 'process-8'});

            // 2. 비동기 데이터 수집 함수 실행
            fetchDigitalTwins(dTw_attr_name)
                .then(allDataList => {
                    if (allDataList.length === 0) {
                        alert('조회된 데이터가 없습니다.');
                        return;
                    }

                    // 3. UI 처리 (컨테이너 표시)
                    const apiListContainer = document.querySelector('.api-list');
                    if (apiListContainer.style.display !== 'flex') {
                        apiListContainer.style.display = 'flex';
                    }

                    // 4. 테이블 생성 및 DataTable 초기화
                    const listTableContainer = document.querySelector('#search_meta_api_list_table');
                    makeMetaApiListTable(allDataList, listTableContainer, 'metaApiListDataTable');

                    listTableContainer.style.display = 'block';
                    $('#metaApiListDataTable').DataTable({
                        order: [[0, 'asc']],
                        searching: true,
                        info: false,            // 하단 "Showing 1 to 10..." 정보 표시 여부
                        lengthChange: false,   // ★ 이 설정이 "Show entries" 드롭다운을 제거합니다.
                        pageLength: 5,        // 한 페이지에 보여줄 기본 행 개수
                        autoWidth: false,
                        destroy: true,         // 재조회 시 기존 테이블 객체 파기
                        language: {            // (선택) 검색창이나 공백 시 메시지 한글화
                            search: "검색 : ",
                            emptyTable: "데이터가 없습니다.",
                            paginate: {
                                next: "다음",
                                previous: "이전"
                            }
                        }
                    });
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('데이터 로드 중 에러가 발생했습니다.');
                })
                .finally(() => {
                    // 5. 프로그레스 바 종료
                    closeProgressBar({element: null, process_id: 'process-8'});
                });
        });

        // 오브젝트 리스트 조회 이벤트
        $(document).on('click', '.btn-object-list', function () {
            const digital_twin_id = $(this).data('twin-id');

            // 1. 프로그레스 바 시작
            showProgressBar({element: null, process_id: 'process-9'});

            // 2. 비동기 데이터 수집 함수 실행
            fetchDigitalObjects(digital_twin_id)
                .then(dataList => {
                    if (!dataList || dataList.length === 0) {
                        alert('조회된 데이터가 없습니다.');
                        return;
                    }

                    // 3. UI 처리 (컨테이너 표시)
                    const apiListContainer = document.querySelector('.api-list');
                    if (apiListContainer.style.display !== 'flex') {
                        apiListContainer.style.display = 'flex';
                    }

                    // 4. 테이블 생성 및 DataTable 초기화
                    const listTableContainer = document.querySelector('#search_meta_api_list_table_obj');
                    makeMetaApiObjectListTable(dataList, listTableContainer, 'metaApiListDataTableObj');

                    listTableContainer.style.display = 'block';
                    $('#metaApiListDataTableObj').DataTable({
                        order: [[0, "asc"]],
                        searching: false,
                        info: false,
                        lengthChange: false,
                        pageLength: 5,
                        autoWidth: false,
                        destroy: true,
                        language: {
                            search: "검색 : ",
                            emptyTable: "데이터가 없습니다.",
                            paginate: {
                                next: "다음",
                                previous: "이전"
                            }
                        }
                    });

                    // 5. 하단으로 스크롤 이동
                    $('html, body').animate({scrollTop: $(document).height()}, 'slow');
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('데이터 로드 중 에러가 발생했습니다. 관리자에게 문의하십시오.');
                })
                .finally(() => {
                    // 6. 프로그레스 바 종료
                    closeProgressBar({element: null, process_id: 'process-9'});
                });
        });

        //오브젝트 선택 이벤트
        $(document).on('click', '.btn-pop-api-view', function () {
            const $this = $(this);
            const digital_twin_object_id = $this.data('object-id');
            const digital_twin_id = $this.data('twin-id');

            // 1. 프로그레스 바 시작
            showProgressBar({element: null, process_id: 'process-10'});

            // 2. 비동기 데이터 수집 함수 실행
            fetchDigitalObject(digital_twin_id, digital_twin_object_id)
                .then(data => {
                    if (!data || data.length === 0) {
                        alert('조회된 데이터가 없습니다.');
                        return;
                    }

                    const modalPopupId = $this.data('popup-id');
                    const modal = document.getElementById(modalPopupId);

                    if (modalPopupId && modal) {
                        // 모달 UI 표시
                        console.log('UI Data', data);
                        let modalContent = modal.querySelector('.modal-popup-body');
                        $('#digitalTwinId').val(data.dtid);
                        $('#digitalObjectId').val(data.dtoid);
                        $('#digitalObjectName').val(data.name);
                        if (data.digitalTwinObjectData) {
                            if (data.digitalTwinObjectData.dataAccessURL) {
                                $('#digitalObjectDataSourceUrl').val(data.digitalTwinObjectData.dataAccessURL);
                            }
                            if (data.digitalTwinObjectData.schemaInformation) {
                                $('#digitalObjectDataModel').val(prettyJson(data.digitalTwinObjectData.schemaInformation));
                                $('#digitalObjectDataSample').val(prettyJson(generateSampleFromSchema(data.digitalTwinObjectData.schemaInformation)));
                                if (data.digitalTwinObjectData.schemaInformation.required && data.digitalTwinObjectData.schemaInformation.required.length > 0) {
                                    const schemaType = checkSchemaType(data.digitalTwinObjectData.schemaInformation)
                                    if (schemaType === "DATA") {
                                        $('#digitalObjectDataPath').val(`data.{key}`);
                                        $('#digitalObjectDataTime').val(`rowtime`);
                                    } else if (schemaType === "NGSI_LD") {
                                        $('#digitalObjectDataPath').val(`data.{key}.value`);
                                        $('#digitalObjectDataTime').val(`rowtime`);
                                    }
                                }
                            }
                        }
                        $('#description').val(data.description);
                        modal.classList.add('is-open');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('데이터 로드 중 에러가 발생했습니다. 관리자에게 문의하십시오.');
                })
                .finally(() => {
                    closeProgressBar({element: null, process_id: 'process-10'});
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

/**
 * 모든 페이지를 순차적으로 호출하여 데이터를 수집하는 비동기 함수
 */
async function fetchDigitalTwins(name) {
    let allData = [];
    let currentPage = 1;
    let totalPage = 1;

    // 페이지별 호출 로직
    while (currentPage <= totalPage) {
        try {
            const result = await $.ajax({
                type: "GET",
                url: "/dt/meta/digital-twins",
                data: {
                    curPage: currentPage,
                    pageListSize: 5, // 한 번 호출 시 많이 가져오는 것이 유리 (서버 허용치 확인)
                    arrayDataLimit: 200,
                    dTw_objs_attr: 'digitalTwinObjects',
                    objectRefFormat: 'object',
                    dTw_attr_name: name
                },
                dataType: "json"
            });

            if (result.status === 200) {
                const response = result.data;

                // 테이블 함수(makeMetaApiListTable)에서 사용하는 필드명으로 매핑
                const mappedList = response.data.map(item => ({
                    type: item.type,
                    dtid: item.dtid,
                    name: item.name,
                    description: item.description,
                    creationTime: formatKstDate(item.creationTime),
                    modificationTime: formatKstDate(item.modificationTime),
                }));

                allData = allData.concat(mappedList);

                // 첫 호출 시 전체 페이지 수 업데이트
                totalPage = response.totalPage;
                currentPage++;
            } else {
                throw new Error("API Status not 200");
            }
        } catch (err) {
            console.error(`Page ${currentPage} fetch failed:`, err);
            break; // 에러 발생 시 루프 중단
        }
    }
    return allData;
}

/**
 * 디지털 트윈 ID를 기반으로 오브젝트 리스트를 가져오는 비동기 함수
 */
async function fetchDigitalObjects(digital_twin_id) {
    try {
        const result = await $.ajax({
            type: "GET",
            url: `/dt/meta/digital-twins/${digital_twin_id}/digital-objects`,
            contentType: "application/json; charset=utf-8;",
            dataType: "json"
        });

        if (result.status === 200) {
            const response = result.data;
            return response ? response.map(item => ({
                subjects: item.subjects,
                dtid: digital_twin_id,
                dtoid: item.dtoid,
                name: item.name,
                description: item.description,
                creationTime: formatKstDate(item.creationTime),
                modificationTime: formatKstDate(item.modificationTime),
            })) : [];
        } else {
            throw new Error("API Status not 200");
        }
    } catch (err) {
        throw err;
    }
}


/**
 * 디지털 트윈 ID와 디지털 트윈 오브젝트 ID로 디지털 트윈 오브젝트 정보 가져오는 비동기 함수
 */
async function fetchDigitalObject(digital_twin_id, digital_twin_object_id) {
    // 1. 요청 파라미터 구성 (매개변수 명칭 일치 확인)
    try {
        // 2. 비동기 POST 요청
        const result = await $.ajax({
            type: 'GET',
            url: `/dt/meta/digital-twins/${digital_twin_id}/digital-objects/${digital_twin_object_id}`,
            contentType: 'application/json; charset=utf-8',
            dataType: 'json'
        });

        // 3. 응답 처리
        if (result.status === 200) {
            let response = result.data;
            response.dtid = digital_twin_id;
            return response;
        } else {
            throw new Error("API Status not 200");
        }
    } catch (err) {
        throw err;
    }
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
function getBaseDataCallback(digital_twin_id, digital_twin_object_id, sdt_nm, sdt_data_url, sdt_derpn, sdt_full_text, callback) {
    let data = {
        digital_twin_id: digital_twin_id, digital_twin_object_id: digital_twin_object_id
    }
    showProgressBar({element: null, process_id: 'process-11'});
    ajaxPost('/dt/meta/base/file/set/META_ETC_MODEL', data, function (result) {
        if (result.status === 200) {
            if (result.header_list.length === 0 || result.data_list.length === 0) {
                closeProgressBar({element: null, process_id: 'process-11'});
                callback(result);
                return;
            }
            let header_list = result.header_list;
            let data_list = result.data_list;
            let preProcData = preProcTemplate();
            preProcData.preproc_property_info[0].twin_id = digital_twin_id;
            preProcData.preproc_property_info[0].twin_obj_id = digital_twin_object_id;
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

/**
 * 값이 순수 JSON 객체(Java의 Map 역할)인지 확인하는 유틸리티 함수
 * (null이나 배열을 걸러냅니다)
 */
function isPlainObject(obj) {
    return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
}

/**
 * 1. Target Properties 찾기
 */
function findInnerProperties(schemaInfo) {
    if (!schemaInfo || !('properties' in schemaInfo)) return null;

    const rootProperties = schemaInfo.properties;

    // Type 2: properties 안에 "data"가 있는 경우 -> data.items.properties 안으로 진입
    if ('data' in rootProperties && isPlainObject(rootProperties.data)) {
        const dataObj = rootProperties.data;

        if ('items' in dataObj && isPlainObject(dataObj.items)) {
            const itemsObj = dataObj.items;

            if ('properties' in itemsObj && isPlainObject(itemsObj.properties)) {
                return itemsObj.properties;
            }
        }
    }

    // Type 1: properties 안에 "data"가 없는 경우 -> 현재 properties 반환
    return rootProperties;
}

/**
 * 2. Target Required 찾기
 */
function findInnerRequired(schemaInfo) {
    if (!schemaInfo || !('properties' in schemaInfo)) return null;

    const rootProperties = schemaInfo.properties;

    // Type 2: properties 안에 "data"가 있는 경우 -> data.items.required 반환
    if ('data' in rootProperties && isPlainObject(rootProperties.data)) {
        const dataObj = rootProperties.data;

        if ('items' in dataObj && isPlainObject(dataObj.items)) {
            const itemsObj = dataObj.items;

            if ('required' in itemsObj && Array.isArray(itemsObj.required)) {
                return itemsObj.required;
            }
        }
    }

    // Type 1: properties 안에 "data"가 없는 경우 -> 루트 레벨의 required 반환
    if ('required' in schemaInfo && Array.isArray(schemaInfo.required)) {
        return schemaInfo.required;
    }

    return null;
}

/**
 * 3. JSON 스키마의 타입을 식별합니다.
 * 실제 데이터 필드(co, temp 등) 정의 내부에 "value" 속성이 있다면 NGSI-LD로 간주합니다.
 *
 * @param {Object} schemaInfo - 최상위 스키마 객체 (schemaInformation 전체)
 * @returns {string|null} 스키마 타입 문자열 ("NGSI_LD" 또는 "DATA")
 */
function checkSchemaType(schemaInfo) {
    if (!schemaInfo) return null;

    // 1. 실제 데이터 필드들이 모여있는 타겟 Properties 맵을 가져옵니다.
    const targetProps = findInnerProperties(schemaInfo);

    if (!targetProps || Object.keys(targetProps).length === 0) {
        return null; // 유효한 데이터 속성을 찾을 수 없음
    }

    // 2. 타겟 Properties 내부의 속성(co, temp 등)들을 순회하며 검사합니다.
    for (const fieldDef of Object.values(targetProps)) {
        if (isPlainObject(fieldDef)) {
            // NGSI-LD의 특징: 필드 정의 자체가 "object"이고, 내부에 "properties"를 가지며,
            // 그 하위에 "value", "type", "observedAt" 등을 가집니다.
            if ('properties' in fieldDef) {
                const innerProps = fieldDef.properties;

                if (isPlainObject(innerProps) && 'value' in innerProps) {
                    return "NGSI_LD"; // "value" 속성이 발견되면 즉시 NGSI-LD로 확정
                }
            }
        }
    }

    // 위 조건을 만족하는 필드가 하나도 없다면, 일반적인 DATA 형태로 간주합니다.
    return "DATA";
}