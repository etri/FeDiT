function prettyJson(jsonString) {
    try {
        return JSON.stringify(JSON.parse(jsonString), true, 4);
    } catch (e) {
        console.error(e);
    }
}

function jsonTemplateArrayNumbering(preproc_order) {
    let maxSetOrder = 0;

    let jsonData = JSON.parse($('#preprocProPerty').val());
    let preprocProperty = jsonData.preproc_property_info[0].preproc_property.find(prop => prop.preproc_order === preproc_order);
    if (preprocProperty) {
        maxSetOrder = preprocProperty.preproc_set.reduce((max, item) => {
            return item.set_order > max ? item.set_order : max;
        }, 0);
    }

    return maxSetOrder;
}

function validTemplate() {
    return {
        set_order: null,
        trgt_file_nm: null,
        trgt_col: null,
        vrfc_tp: null,
        vrfc_tp_nm: null,
        vrfc_sub_tp: null,
        vrfc_sub_tp_nm: null,
        vrfc_clear_tp: null,
        vrfc_clear_tp_nm: null,
        rule1: null,
        rule2: null,
        rule3: null,
        rule4: null
    };
}

function interpolateTemplate() {
    return {
        set_order: null, trgt_file_nm: null, trgt_col: null
    };
}

function resampleTemplate() {
    return {
        set_order: null,
        trgt_file_nm: null,
        trgt_col: null,
        resmpl_tp: null,
        resmpl_tp_nm: null,
        resmpl_intvl_value: null
    };
}

function unitTemplate() {
    return {
        set_order: null,
        trgt_file_nm: null,
        trgt_col: null,
        unit_tp: null,
        unit_tp_nm: null,
        unit_cd_1: null,
        unit_cd_1_nm: null,
        unit_cd_2: null,
        unit_cd_2_nm: null
    };
}

function modelAlgorithmTemplate() {
    return {
        "dependent": [], "independent": [], "algorithm": null, "algorithm_seq": null, "hyperparam": {
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
            "data_size": null,
            "num_segments": null,
            "segment_len": null
        }
    };
}

function modelEtcAlgorithmTemplate() {
    return {
        "output_col": null, "algorithm": null, "algorithm_seq": null, "hyperparam": {
            "window_size": null, "batch_size": null, "epochs": null, "test_size": null, "units": null, "patience": null
        }
    };
}

function preProcTemplate() {
    return {
        "preproc_property_info": [{
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
            "preproc_property": [{
                "preproc_order": 1, "preproc_type": "validate", "preproc_set": []
            }, {
                "preproc_order": 2, "preproc_type": "outlier", "preproc_set": []
            }, {
                "preproc_order": 3, "preproc_type": "missing", "preproc_set": []
            }, {
                "preproc_order": 4, "preproc_type": "interval", "preproc_set": []
            }, {
                "preproc_order": 5, "preproc_type": "unit", "preproc_set": []
            }],
            "model_property": []
        }]
    };
}

function oulierTemplate(option) {
    return option === 'standard'
        ? {
            "set_order": null,
            "trgt_file_nm": null,
            "trgt_col": null,
            "outlier_tp": option,
            "freq": null,
            "p_value": null,
        }
        : option === 'kmean'
            ? {
                "set_order": null,
                "trgt_file_nm": null,
                "trgt_col": null,
                "outlier_tp": option,
                "freq": null,
                "n_clusters": null,
                "clusters_group": null,
            }
            : {
                "set_order": null,
                "trgt_file_nm": null,
                "trgt_col": null,
                "outlier_tp": option,
                "freq": null,
                "eps": null,
                "min_samples": null,
            };
}