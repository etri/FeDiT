'use strict'

$(document).ready(function () {


    $(document).on('click', '.test_j', function () {
        var jsonTemplate = preProcTemplate2();
        var lastPreprocOrder = null;
        var lastPreprocSet = null;
        var lastTargetFileName = null;
        var lastSetOrder = null;

        $.each(jsonTemplate.preproc_property_info, function (index, preprocPropertyInfo) {
            // preproc_property 배열 반복
            $.each(preprocPropertyInfo.preproc_property, function (index, preprocProperty) {
                if (preprocProperty.preproc_order !== null) {
                    // 마지막 preproc_order 업데이트

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

        // 결과 반환
        var result = {
            "lastPreprocOrder": lastPreprocOrder,
            "lastPreprocSet": lastPreprocSet,
            "lastTargetFileName": lastTargetFileName,
            "lastSetOrder": lastSetOrder
        };
        console.log(result)

        /*
        var lastPreprocOrder = null;
        var lastSetOrder = null;
        var lastFileName = null;
        var preprocInfo = jsonTemplate.preproc_property_info[0];

        if (preprocInfo && preprocInfo.preproc_property) {
            var lastPreprocProperty = preprocInfo.preproc_property.slice(-1)[0];
            if (lastPreprocProperty && lastPreprocProperty.preproc_set && lastPreprocProperty.preproc_set.length > 0) {
                var lastPreprocSet = lastPreprocProperty.preproc_set.slice(-1)[0];
                lastPreprocOrder = lastPreprocProperty.preproc_order;
                lastSetOrder = lastPreprocSet.set_order;
                lastFileName = lastPreprocSet.trgt_file_nm;
            }
        }

        // 만약 가장 마지막 파일이 없을 경우 base_file_nm_set_range_col의 값 사용
        if (lastFileName == null) {
            if (preprocInfo.base_file_nm_set_range_col != null) {
                lastFileName = preprocInfo.base_file_nm_set_range_col;
            } else if (preprocInfo.base_file_nm_set_range_row != null) {
                lastFileName = preprocInfo.base_file_nm_set_range_row;
            } else {
                lastFileName = preprocInfo.base_file_nm;
            }

        }


        // 결과 출력
        console.log("가장 마지막에 작업한 파일의 preproc_order: " + lastPreprocOrder);
        console.log("가장 마지막에 작업한 파일의 set_order: " + lastSetOrder);
        console.log("가장 마지막에 작업한 파일의 파일명: " + lastFileName);
        */

    });


    $('#addTemplateBtn').click(function () {
        // 새로운 템플릿 생성
        var newTemplate = intervalTemplate(); // 예시로 intervalTemplate 사용

        // preProcTemplate에 새로운 템플릿 추가
        preProcData.preproc_property_info[0].preproc_property.push(newTemplate);

        // 추가된 템플릿을 출력 또는 다른 작업 수행
        console.log("New template added:", newTemplate);
    });


    $('#updateTemplateBtn').click(function () {
        // 버튼 이벤트를 통해 가져온 데이터
        var eventData = {
            "file_path": "Z:/DT/files/storage/tmp/admin1708486696808",
            "target_end_date": "20210105",
            "file_name": "admin1708486696808_origin.csv",
            "target_start_date": "20210101",
            "index_trgt_col": "data.values.female.w30",
            "base_dir": "admin1708486696808"
        };

        // 가져온 데이터에서 필요한 값을 추출하여 전역 변수 업데이트
        var baseDir = eventData.base_dir;
        var fileName = eventData.file_name;

        // preProcTemplate의 base_dir과 base_file_nm 업데이트
        preProcData.preproc_property_info[0].base_dir = baseDir;
        preProcData.preproc_property_info[0].base_file_nm = fileName;

        // 업데이트된 템플릿을 출력 또는 다른 작업 수행
        console.log("Updated preProcData:", preProcData);
    });


});

function prettyJson(jsonString) {
    //JSON.stringify(JSON.parse($('#textarea').val()), null, 4);
    var result = JSON.stringify(JSON.parse(jsonString), true, 4);
    return result;
}

function jsonTemplateArrayNumbering(preproc_order) {
    var maxSetOrder = 0;

    var jsonData = JSON.parse($('#preprocProPerty').val());
    var preprocProperty = jsonData.preproc_property_info[0].preproc_property.find(prop => prop.preproc_order === preproc_order);
    if (preprocProperty) {
        maxSetOrder = preprocProperty.preproc_set.reduce((max, item) => {
            return item.set_order > max ? item.set_order : max;
        }, 0);
    }

    return maxSetOrder;
}


function validTemplate() {
    var jsonTemplate = {
        "set_order": null,
        "trgt_file_nm": null,
        "trgt_col": null,
        "vrfc_tp": null,
        "vrfc_tp_nm": null,
        "vrfc_sub_tp": null,
        "vrfc_sub_tp_nm": null,
        "vrfc_clear_tp": null,
        "vrfc_clear_tp_nm": null,
        "rule1": null,
        "rule2": null,
        "rule3": null,
        "rule4": null
    };

    return jsonTemplate;
}

function interpolateTemplate() {
    var jsonTemplate = {
        "set_order": null,
        "trgt_file_nm": null,
        "interpl_tp": null
    };

    return jsonTemplate;
}


function resampleTemplate() {
    var jsonTemplate = {
        "set_order": null,
        "trgt_file_nm": null,
        "trgt_col": null,
        "resmpl_tp": null,
        "resmpl_tp_nm": null,
        "resmpl_intvl_value": null
    };

    return jsonTemplate;
}


function unitTemplate() {
    var jsonTemplate = {
        "set_order": null,
        "trgt_file_nm": null,
        "trgt_col": null,
        "unit_tp": null,
        "unit_tp_nm": null,
        "unit_cd_1": null,
        "unit_cd_1_nm": null,
        "unit_cd_2": null,
        "unit_cd_2_nm": null
    };

    return jsonTemplate;
}


function modelAlgorithmTemplate() {
    var jsonTemplate = {
        "dependent": [],
        "independent": [],
        "algorithm": null,
        "algorithm_seq": null,
        "hyperparam": {
            "window_size": null,
            "batch_size": null,
            "epochs": null,
            "loss": null,
            "loss_nm": null,
            "meterics": null,
            "meterics_nm": null,
            "optimizer": null,
            "optimizer_nm": null,
            "optimizer_lr": null,
            "test_size": null,
            "data_size": null
        }
    };

    return jsonTemplate;
}


function preProcTemplate() {
    var jsonTemplate = {
        "preproc_property_info": [
            {
                "twin_id": null,
                "twin_obj_id": null,
                "data_use_tp": null,
                "base_dir": null,
                "base_file_nm": null,
                "base_file_nm_set_range_row": null,
                "base_file_nm_set_range_col": null,
                "index_trgt_col": null,
                "target_start_date": null,
                "target_end_date": null,
                "target_row_count": null,
                "model_nm": null,
                "model_derpn": null,
                "rls_yn": null,
                "preproc_trgt_col": [],
                "last_step_preproc_order": null,
                "last_step_preproc_file_nm": null,
                "model_create": "N",
                "preproc_property": [
                    {
                        "preproc_order": 1,
                        "preproc_type": "validate",
                        "preproc_set": []
                    },
                    {
                        "preproc_order": 2,
                        "preproc_type": "outlier",
                        "preproc_set": []
                    },
                    {
                        "preproc_order": 3,
                        "preproc_type": "missing",
                        "preproc_set": []
                    },
                    {
                        "preproc_order": 4,
                        "preproc_type": "interval",
                        "preproc_set": []
                    },
                    {
                        "preproc_order": 5,
                        "preproc_type": "unit",
                        "preproc_set": []
                    }
                ],
                "model_property": []
            }
        ]
    };

    return jsonTemplate;

}

function preProcTemplateTestSample() {
    var jsonTemplate = {
        "preproc_property_info": [
            {
                "twin_id": null,
                "twin_obj_id": null,
                "data_use_tp": "F",
                "base_dir": "admin1718163621274",
                "base_file_nm": "201901_201912유동인구.csv",
                "base_file_nm_set_range_row": "201901_201912유동인구_set_row.csv",
                "base_file_nm_set_range_col": "201901_201912유동인구_set_col.csv",
                "index_trgt_col": "date",
                "target_start_date": null,
                "target_end_date": null,
                "target_row_count": "500",
                "model_nm": "test44444",
                "rls_yn": "N",
                "preproc_trgt_col": [
                    "m00",
                    "m10",
                    "m20",
                    "m30",
                    "m40",
                    "m50",
                    "m60"
                ],
                "last_step_preproc_order": null,
                "last_step_preproc_file_nm": null,
                "model_create": "N",
                "preproc_property": [
                    {
                        "preproc_order": 1,
                        "preproc_type": "validate",
                        "preproc_set": []
                    },
                    {
                        "preproc_order": 2,
                        "preproc_type": "outlier",
                        "preproc_set": []
                    },
                    {
                        "preproc_order": 3,
                        "preproc_type": "missing",
                        "preproc_set": []
                    },
                    {
                        "preproc_order": 4,
                        "preproc_type": "interval",
                        "preproc_set": []
                    },
                    {
                        "preproc_order": 5,
                        "preproc_type": "unit",
                        "preproc_set": []
                    }
                ],
                "model_property": []
            }
        ]
    };

    return jsonTemplate;

}

function preProcTemplateTestSample2() {
    var jsonTemplate = {
        "preproc_property_info": [
            {
                "twin_id": null,
                "base_dir": "admin1711347660188",
                "base_file_nm": "201901_201902유동인구_보간_원본.csv",
                "base_file_nm_set_range_row": "201901_201902유동인구_보간_원본_set_row.csv",
                "base_file_nm_set_range_col": "201901_201902유동인구_보간_원본_set_col.csv",
                "index_trgt_col": "date",
                "target_start_date": null,
                "target_end_date": null,
                "target_row_count": "500",
                "model_nm": "test",
                "preproc_trgt_col": [
                    "m00",
                    "m10",
                    "m20",
                    "m30",
                    "m40"
                ],
                "last_step_preproc_order": 4,
                "last_step_preproc_file_nm": "admin1711347660188_1711347823542.csv",
                "preproc_property": [
                    {
                        "preproc_order": 1,
                        "preproc_type": "validate",
                        "preproc_set": [
                            {
                                "set_order": 1,
                                "trgt_file_nm": "admin1711347660188_1711347689271.csv",
                                "trgt_col": "m00",
                                "vrfc_tp": "DT",
                                "vrfc_tp_nm": "데이터 타입",
                                "vrfc_sub_tp": "1",
                                "vrfc_sub_tp_nm": "정수형 검증",
                                "vrfc_clear_tp": "O",
                                "vrfc_clear_tp_nm": "지정외값",
                                "rule1": "int",
                                "rule2": null,
                                "rule3": null,
                                "rule4": null
                            },
                            {
                                "set_order": 2,
                                "trgt_file_nm": "admin1711347660188_1711347691442.csv",
                                "trgt_col": "m00",
                                "vrfc_tp": "DT",
                                "vrfc_tp_nm": "데이터 타입",
                                "vrfc_sub_tp": "1",
                                "vrfc_sub_tp_nm": "정수형 검증",
                                "vrfc_clear_tp": "O",
                                "vrfc_clear_tp_nm": "지정외값",
                                "rule1": "int",
                                "rule2": null,
                                "rule3": null,
                                "rule4": null
                            },
                            {
                                "set_order": 3,
                                "trgt_file_nm": "admin1711347660188_1711347698748.csv",
                                "trgt_col": "m10",
                                "vrfc_tp": "DT",
                                "vrfc_tp_nm": "데이터 타입",
                                "vrfc_sub_tp": "1",
                                "vrfc_sub_tp_nm": "정수형 검증",
                                "vrfc_clear_tp": "O",
                                "vrfc_clear_tp_nm": "지정외값",
                                "rule1": "int",
                                "rule2": null,
                                "rule3": null,
                                "rule4": null
                            }
                        ]
                    },
                    {
                        "preproc_order": 2,
                        "preproc_type": "outlier",
                        "preproc_set": [
                            {
                                "set_order": 1,
                                "trgt_file_nm": "admin1711347660188_1711347768046.csv",
                                "trgt_col": "m10",
                                "outlier_tp": "kmean",
                                "freq": "10",
                                "n_clusters": "10",
                                "clusters_group": null,
                                "eps": "0.1",
                                "p_value": "0.02",
                                "min_samples": "2",
                                "n_clusters_lable": "1"
                            }
                        ]
                    },
                    {
                        "preproc_order": 3,
                        "preproc_type": "missing",
                        "preproc_set": [
                            {
                                "set_order": 1,
                                "trgt_file_nm": "admin1711347660188_1711347785317.csv",
                                "interpl_tp": "linear"
                            }
                        ]
                    },
                    {
                        "preproc_order": 4,
                        "preproc_type": "interval",
                        "preproc_set": [
                            {
                                "set_order": 1,
                                "trgt_file_nm": "admin1711347660188_1711347798658.csv",
                                "trgt_col": null,
                                "resmpl_tp": "H",
                                "resmpl_tp_nm": "시",
                                "resmpl_intvl_value": "3"
                            }
                        ]
                    },
                    {
                        "preproc_order": 5,
                        "preproc_type": "unit",
                        "preproc_set": [
                            {
                                "set_order": 1,
                                "trgt_file_nm": "admin1711347660188_1711347815271.csv",
                                "trgt_col": "m00",
                                "unit_tp": "UNIT_TMPT",
                                "unit_tp_nm": "온도",
                                "unit_cd_1": "1",
                                "unit_cd_1_nm": "화씨온도",
                                "unit_cd_2": "1",
                                "unit_cd_2_nm": "섭씨온도"
                            },
                            {
                                "set_order": 2,
                                "trgt_file_nm": "admin1711347660188_1711347823542.csv",
                                "trgt_col": "m10",
                                "unit_tp": "UNIT_TMPT",
                                "unit_tp_nm": "온도",
                                "unit_cd_1": "1",
                                "unit_cd_1_nm": "화씨온도",
                                "unit_cd_2": "1",
                                "unit_cd_2_nm": "섭씨온도"
                            }
                        ]
                    }
                ]
            }
        ]
    };

    return jsonTemplate;

}

function oulierTemplate(option) {
    var jsonTemplate;

    if (option == 'standard') {
        jsonTemplate = {
            "set_order": null,
            "trgt_file_nm": null,
            "trgt_col": null,
            "outlier_tp": option,
            "freq": null,
            "p_value": null
        };
    } else if (option == 'kmean') {
        jsonTemplate = {
            "set_order": null,
            "trgt_file_nm": null,
            "trgt_col": null,
            "outlier_tp": option,
            "freq": null,
            "n_clusters": null,
            "clusters_group": null
        };
    } else if (option == 'dbscan') {
        jsonTemplate = {
            "set_order": null,
            "trgt_file_nm": null,
            "trgt_col": null,
            "outlier_tp": option,
            "freq": null,
            "eps": null,
            "min_samples": null
        };
    } else if (option == 'autoencoder') {
        jsonTemplate = {
            "set_order": null,
            "trgt_file_nm": null,
            "trgt_col": null,
            "outlier_tp": option,
            "window_size": null,
            "threshold": null,
            "etc_model_seq": null
        };
    } else {
        jsonTemplate = {
            "set_order": null,
            "trgt_file_nm": null,
            "trgt_col": null,
            "outlier_tp": option,
            "freq": null,
            "eps": null,
            "min_samples": null
        };
    }
    return jsonTemplate;
}
