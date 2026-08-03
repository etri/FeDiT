document.addEventListener("DOMContentLoaded", () => {
  let selectAlgorithm = document.querySelector("#select_algorithm");
  observeDataValueChange(selectAlgorithm, function (targetElement, newValue) {
    console.log("observeDataValueChange Callback", targetElement, newValue);
    if (
      !newValue ||
      newValue === "선택 없음" ||
      newValue === "0" ||
      newValue === ""
    ) {
      return;
    }
    let dropdownBox = targetElement.closest(".dropdown-box");
    if (dropdownBox) {
      const _this = targetElement;
      const model_algrm_seq = _this.dataset.value;
      const model_seq = $("#etcModelSeq").val();
      const select_index_col = _this.textContent;
      const algorithm_img =
        "/assets/images/algorithm/" + select_index_col + ".png";
      document.querySelector("#algorithm_img_box").style.backgroundImage =
        `url("${algorithm_img}")`;
      makeAlgorithmMetaItemList(model_algrm_seq, model_seq, function (result) {
        let output_range = document.querySelector('[data-id="output_range"]');
        let output_types = output_range.dataset.type
          .split(",")
          .map((type) => type.trim());
        let feature_range = document.querySelector('[data-id="feature_range"]');
        let feature_types = feature_range.dataset.type
          .split(",")
          .map((type) => type.trim());

        let correlation_range = document.querySelector(
          '[data-id="correlation_range"]',
        );

        let selectedText = _this.textContent; // 선택된 <option>의 텍스트
        if (output_types.includes(selectedText)) {
          console.log(`${selectedText} is included in output_types.`);
          output_range.style.display = "block";
        } else {
          console.log(`${selectedText} is not included in output_types.`);
          output_range.style.display = "none";
        }
        if (feature_types.includes(selectedText)) {
          console.log(`${selectedText} is included in output_types.`);
          feature_range.style.display = "block";
        } else {
          console.log(`${selectedText} is not included in output_types.`);
          feature_range.style.display = "none";
        }
        if (feature_range.style.display === "none") {
          output_range.classList.remove("col-md-4");
          output_range.classList.add("col-md-6");
          correlation_range.classList.remove("col-md-4");
          correlation_range.classList.add("col-md-6");
        } else {
          output_range.classList.add("col-md-4");
          output_range.classList.remove("col-md-6");
          correlation_range.classList.add("col-md-4");
          correlation_range.classList.remove("col-md-6");
        }

        /**
         * output_range와 feature_range 초기화
         * */
        output_range
          .querySelectorAll('input[name="outputCol"]')
          .forEach((radio) => {
            radio.checked = false;
          });
        feature_range
          .querySelectorAll('input[name="featureCol"]')
          .forEach((checkbox) => {
            checkbox.checked = false;
          });

        let preProcData = JSON.parse($("#preprocProPerty").val());
        if (
          preProcData.preproc_property_info.length !== 0 &&
          preProcData.preproc_property_info[0].model_property.length !== 0 &&
          preProcData.preproc_property_info[0].model_property[0].algorithm_seq
        ) {
          console.log("preProcData", preProcData);
          let outputRows = document.querySelectorAll(
            "#outputCheckTable tbody tr",
          );
          outputRows.forEach((outputRow) => {
            let checkboxes = outputRow.querySelectorAll('input[type="radio"]');
            checkboxes.forEach((checkbox) => {
              let value = checkbox.value;
              if (
                preProcData.preproc_property_info.length !== 0 &&
                preProcData.preproc_property_info[0].model_property.length !==
                  0 &&
                preProcData.preproc_property_info[0].model_property[0]
                  .output_col
              ) {
                if (
                  preProcData.preproc_property_info[0].model_property[0].output_col.includes(
                    value,
                  )
                ) {
                  checkbox.checked = true;
                }
              }
            });
          });
          if (
            preProcData.preproc_property_info[0].model_property[0]
              .algorithm_seq === "2" ||
            preProcData.preproc_property_info[0].model_property[0]
              .algorithm_seq === "Random Forest"
          ) {
            let featureRows = document.querySelectorAll(
              "#featureCheckTable tbody tr",
            );
            featureRows.forEach((featureRow) => {
              let checkboxes = featureRow.querySelectorAll(
                'input[type="checkbox"]',
              );
              checkboxes.forEach((checkbox) => {
                let value = checkbox.value;
                if (
                  preProcData.preproc_property_info.length !== 0 &&
                  preProcData.preproc_property_info[0].model_property.length !==
                    0 &&
                  preProcData.preproc_property_info[0].model_property[0]
                    .feature_cols
                ) {
                  if (
                    preProcData.preproc_property_info[0].model_property[0].feature_cols.includes(
                      value,
                    )
                  ) {
                    checkbox.checked = true;
                  }
                }
              });
            });
          }

          /**
           * 컬럼 선택 및 독립변수 Disabled
           * */
          let inputs = document.querySelectorAll(
            "#algorithmOutputRange input.ui-check, #algorithmFeatureRange input.ui-check",
          );
          inputs.forEach(function (input) {
            input.disabled = true;
          });

          /**
           * 모델 파라미터 Input Disabled
           * */
          let parameterInputs = document.querySelectorAll(
            "#algorithm_meta_item_list input",
          );
          parameterInputs.forEach(function (input) {
            input.disabled = true;
          });

          /**
           * 모델 파라미터 Select Disabled
           * */
          let parameterSelects = document.querySelectorAll(
            "#algorithm_meta_item_list select",
          );
          parameterSelects.forEach(function (select) {
            select.disabled = true;
          });
        }
      });
    }
  });

  /**
   * 2025-03-20, 상관관계 분석 로직 추가
   * 상관관계 드랍다운 리스트 이벤트 추가
   * */
  let correlationRange = document.querySelector(
    '[data-id="correlation_range"]',
  );
  let correlationOption = correlationRange.querySelector(
    ".filter-layer .option-list",
  );
  let correlationOptionListInputs = correlationOption.querySelectorAll(
    'li input[type="radio"]',
  );
  correlationOptionListInputs.forEach(function (input) {
    input.addEventListener("change", function (event) {
      const preProcData = JSON.parse($("#preprocProPerty").val());

      let data = {};
      data.type = this.dataset.type;
      if (this.dataset.method) {
        data.method = this.dataset.method;
      }
      if (this.dataset.maxlag) {
        data.maxlag = this.dataset.maxlag;
      }

      data.model_seq = $("#etcModelSeq").val();
      data.file_name =
        preProcData.preproc_property_info[0].last_step_preproc_file_nm;
      data.index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col;
      data.checkHeader =
        preProcData.preproc_property_info[0].preproc_trgt_col.slice();
      showProgressBar({ element: null, process_id: "correlation-1" });
      getCorrelation(data.type, data, function (result) {
        try {
          let correlationViewContainer = document.querySelector("#view4");
          if (correlationViewContainer) {
            let parent = correlationViewContainer.parentElement;
            correlationViewContainer.remove();
            correlationViewContainer = document.createElement("div");
            correlationViewContainer.id = "view4";
            correlationViewContainer.style.display = "block";
            correlationViewContainer.style.width = "100%";
            correlationViewContainer.style.height = "400px";
            correlationViewContainer.style.borderStyle = "solid";
            correlationViewContainer.style.borderStyle = "solid";
            correlationViewContainer.style.borderColor = "#EEE";
            parent.appendChild(correlationViewContainer);
            if (result.correlation_data["data"].length !== 0) {
              correlationHeatMapView(
                result.correlation_data["data"],
                result.correlation_data["xdata"],
                result.correlation_data["ydata"],
              );
            } else {
              let textDiv = document.createElement("div");
              textDiv.style.display = "flex";
              textDiv.style.width = "100%";
              textDiv.style.height = "100%";
              textDiv.style.justifyContent = "center";
              textDiv.style.alignItems = "center";
              textDiv.style.textAlign = "center";
              textDiv.style.padding = "0 16px";
              textDiv.innerHTML = `상관관계를 분석할 수 없는 데이터입니다.`;
              correlationViewContainer.appendChild(textDiv);
            }
          } else {
            console.warn("correlationViewContainer is not found");
          }
        } catch (e) {
          console.error(e);
        } finally {
          closeProgressBar({ element: null, process_id: "correlation-1" });
        }
      });
    });
  });

  $(document).on("change", ".custom-range-obj", function (event) {
    let _this = this;
    let parent = _this.parentElement;
    let rangeElement = parent.querySelector(".custom-number-range");
    rangeElement.value = this.value;
  });

  $(document).on("click", ".make-model", function () {
    let algorithm = `${document.querySelector("#select_algorithm").textContent}`;
    let algorithm_seq = `${document.querySelector("#select_algorithm").dataset.value}`;
    if (algorithm_seq === "0" || algorithm_seq === 0) {
      alert("알고리즘을 선택하세요.");
      return false;
    }
    let menuCd = $("#menuCd").val();

    let outputCol = $('input[name="outputCol"]:checked').val();
    if (typeof outputCol == "undefined") {
      alert("알고리즘에 사용할 컬럼을 선택하세요.");
      return false;
    }
    if (outputCol === "" || outputCol.length === 0) {
      alert("알고리즘에 사용할 컬럼을 선택하세요.");
      return false;
    }
    let algorithmMetaItemList = JSON.parse($("#algorithm_meta_set").val());
    let model_seq = $("#etcModelSeq").val();
    let valid_arr = [];
    let nan_arr = [];
    for (var i = 0; i < algorithmMetaItemList.length; i++) {
      var metaItem = algorithmMetaItemList[i];
      //사용자 노출용 라벨(한글 항목명 우선, 없으면 내부 키)
      var itemLabel =
        metaItem.model_params_item_nm || metaItem.model_params_item;

      var inputValue = $("#" + metaItem.model_params_item).val();
      //console.log(inputValue.length);
      if (inputValue.length == 0) {
        valid_arr.push(itemLabel);
      } else if (
        metaItem.model_params_item_tp &&
        metaItem.model_params_item_tp !== "string" &&
        isNaN(inputValue)
      ) {
        //숫자형 파라미터에 숫자가 아닌 값이 입력된 경우
        nan_arr.push(itemLabel);
      }

      metaItem.model_params_item_value = inputValue;

      if (model_seq > 0) {
        metaItem.model_seq = model_seq;
      }
    }
    let preProcData = JSON.parse($("#preprocProPerty").val());
    let file_name =
      preProcData.preproc_property_info[0].last_step_preproc_file_nm;
    let file_path = $("#lastFilePath").val();

    let alert_string = "";
    if (valid_arr.length > 0) {
      for (var va = 0; va < valid_arr.length; va++) {
        if (va == 0) {
          alert_string += valid_arr[va];
        } else {
          alert_string += ", " + valid_arr[va];
        }
      }
      alert(alert_string + " 필수 입력입니다.");
      return false;
    }
    if (nan_arr.length > 0) {
      alert(nan_arr.join(", ") + " 은(는) 숫자만 입력 가능합니다.");
      return false;
    }
    if (algorithm_seq === "2" || algorithm === "Random Forest") {
      let featureCols = document.querySelectorAll(
        'input[name="featureCol"]:checked',
      );
      if (featureCols.length === 0) {
        alert("알고리즘에 사용할 독립 변수를 선택하세요.");
        return false;
      }
      let features = [];
      let isDuplicateColumnCheck = false;
      featureCols.forEach(function (featureCol) {
        features.push(featureCol.value);
        if (outputCol.trim() === featureCol.value.trim()) {
          isDuplicateColumnCheck = true;
        }
      });
      if (isDuplicateColumnCheck) {
        alert(
          "컬럼 선택과 독립변수들 중 같은 컬럼을 선택하고 있습니다.\n 독립변수 또는 컬럼 선택 부분을 조정해주세요.",
        );
        return false;
      }
      var modelTemplate = modelEtcAlgorithmTemplate();
      modelTemplate.output_col = outputCol;
      console.log("features", features);
      modelTemplate.feature_cols = features;
      modelTemplate.algorithm = algorithm;
      modelTemplate.algorithm_seq = algorithm_seq;
      modelTemplate.hyperparam.test_size = $("#test_size").val();
      modelTemplate.hyperparam.n_estimator = $("#n_estimator").val();
      modelTemplate.hyperparam.min_samples_leaf = $("#min_samples_leaf").val();
      modelTemplate.hyperparam.min_samples_split =
        $("#min_samples_split").val();
      modelTemplate.hyperparam.max_features = $("#max_features").val();
      modelTemplate.hyperparam.max_depth = $("#max_depth").val();

      preProcData.preproc_property_info[0].model_create = "Y";
      preProcData.preproc_property_info[0].model_property[0] = modelTemplate;

      $("#preprocProPerty").val(JSON.stringify(preProcData));
      $(".preprocProPerty").val(prettyJson(JSON.stringify(preProcData)));
      var full_text = $("#preprocProPerty").val();
      let confirm_comment = "등록 이후 수정이 불가합니다.\n등록 하시겠습니까?";

      var con = confirm(confirm_comment);
      if (con === true) {
        var data = {
          model_seq: model_seq,
          algorithm: algorithm,
          algorithm_seq: algorithm_seq,
          algorithm_meta_item_list: algorithmMetaItemList,
          file_path: file_path,
          file_name: file_name,
          output_col: outputCol, //feature_col: feature_col,
          feature_cols: features,
          full_text: full_text,
        };
        showProgressBar({ element: null, process_id: "process-17" });
        $.ajax({
          type: "POST",
          url: "/dt/etc/model/make/model_set",
          data: JSON.stringify(data),
          contentType: "application/json; charset=utf-8;",
          dataType: "json",
          success: function (result) {
            closeProgressBar({ element: null, process_id: "process-17" });
            if (result.result_code === 200) {
              //alert(result.result_code);
              //console.log(result.item_list);
              window.location.href =
                contextPath + "/dt/etc/model/rf/list?menuCd=" + menuCd;
            }
          },
          error: function (xhr, status, error) {
            console.error("error : ", error);
            closeProgressBar({ element: null, process_id: "process-17" });
            alert("에러가 발생하였습니다. 관리자에게 문의하십시오.");
          },
        });
      } else {
        return false;
      }
    } else if (algorithm_seq === "3" || algorithm === "Brits") {
      var optimizer_number_chk = $(".optimizer-number-chk").val();

      if (typeof optimizer_number_chk != "undefined") {
        if (
          isNaN(optimizer_number_chk) ||
          optimizer_number_chk <= 0 ||
          optimizer_number_chk >= 1
        ) {
          alert("optimizerLr은   0보다 크고 1보다 작은 값만 가능합니다.");
          $(".optimizer-number-chk").val("0.0005"); // 기본값으로 조정
          return false;
        }
      }

      //console.log(jsonTemplateArrayNumbering());
      var modelTemplate = modelEtcAlgorithmTemplate();
      modelTemplate.output_col = outputCol;
      modelTemplate.algorithm = algorithm;
      modelTemplate.algorithm_seq = algorithm_seq;
      modelTemplate.hyperparam.window_size = $("#window_size").val();
      modelTemplate.hyperparam.batch_size = $("#batch_size").val();
      modelTemplate.hyperparam.test_size = $("#test_size").val();
      modelTemplate.hyperparam.epochs = $("#epochs").val();
      modelTemplate.hyperparam.data_size = $("#data_size").val();
      modelTemplate.hyperparam.time_steps = $("#time_steps").val();
      modelTemplate.hyperparam.loss = $("#loss option:selected").val();
      modelTemplate.hyperparam.loss_nm = $("#loss option:selected").text();
      modelTemplate.hyperparam.optimizer = $(
        "#optimizer option:selected",
      ).val();
      modelTemplate.hyperparam.optimizer_nm = $(
        "#optimizer option:selected",
      ).text();
      modelTemplate.hyperparam.optimizer_lr = $("#optimizerLr").val();

      preProcData.preproc_property_info[0].model_create = "Y";
      preProcData.preproc_property_info[0].model_property[0] = modelTemplate;

      $("#preprocProPerty").val(JSON.stringify(preProcData));
      $(".preprocProPerty").val(prettyJson(JSON.stringify(preProcData)));
      var full_text = $("#preprocProPerty").val();

      var confirm_comment;
      confirm_comment = "등록 이후 수정이 불가합니다.\n등록 하시겠습니까?";

      /*
            if (feature_col.length == 0) {
                confirm_comment = '독립변수를 체크 하지 않을 경우 종속변수만 적용되어 모델이 생성됩니다.\n등록 이후 수정이 불가합니다.\n등록 하시겠습니까?';
            } else {
                confirm_comment = '등록 이후 수정이 불가합니다.\n등록 하시겠습니까?';
            }

            if (feature_col.length == 0) {
                feature_col = null;
            }
            */

      var con = confirm(confirm_comment);
      if (con === true) {
        var data = {
          model_seq: model_seq,
          algorithm: algorithm,
          algorithm_seq: algorithm_seq,
          algorithm_meta_item_list: algorithmMetaItemList,
          file_path: file_path,
          file_name: file_name,
          output_col: outputCol, //feature_col: feature_col,
          full_text: full_text,
        };
        showProgressBar({ element: null, process_id: "process-18" });
        $.ajax({
          type: "POST",
          url: "/dt/etc/model/make/model_set",
          data: JSON.stringify(data),
          contentType: "application/json; charset=utf-8;",
          dataType: "json",
          success: function (result) {
            console.log("result", result);
            closeProgressBar({ element: null, process_id: "process-18" });
            if (result.result_code === 200) {
              window.location.href =
                contextPath + "/dt/etc/model/brits/list?menuCd=" + menuCd;
            }
          },
          error: function (xhr, status, error) {
            console.error("error : ", error);
            closeProgressBar({ element: null, process_id: "process-18" });
            alert("에러가 발생하였습니다. 관리자에게 문의하십시오.");
          },
        });
      } else {
        return false;
      }
    } else if (algorithm_seq === "4" || algorithm === "Naomi") {
      var optimizer_number_chk = $(".optimizer-number-chk").val();

      if (typeof optimizer_number_chk != "undefined") {
        if (
          isNaN(optimizer_number_chk) ||
          optimizer_number_chk <= 0 ||
          optimizer_number_chk >= 1
        ) {
          alert("optimizerLr은   0보다 크고 1보다 작은 값만 가능합니다.");
          $(".optimizer-number-chk").val("0.005"); // 기본값으로 조정
          return false;
        }
      }

      console.log("algorithmMetaItemList", algorithmMetaItemList);

      //console.log(jsonTemplateArrayNumbering());
      var modelTemplate = modelEtcAlgorithmTemplate();
      modelTemplate.output_col = outputCol;
      modelTemplate.algorithm = algorithm;
      modelTemplate.algorithm_seq = algorithm_seq;
      modelTemplate.hyperparam.window_size = $("#window_size").val();
      modelTemplate.hyperparam.batch_size = $("#batch_size").val();
      modelTemplate.hyperparam.test_size = $("#testSize").val();
      modelTemplate.hyperparam.epochs = $("#epochs").val();
      modelTemplate.hyperparam.optimizer_lr = $("#optimizerLr").val();
      modelTemplate.hyperparam.gradientClipping = $("#gradientClipping").val();
      modelTemplate.hyperparam.testSizePerDataLength = $(
        "#testSizePerDataLength",
      ).val();

      preProcData.preproc_property_info[0].model_create = "Y";
      preProcData.preproc_property_info[0].model_property[0] = modelTemplate;

      $("#preprocProPerty").val(JSON.stringify(preProcData));
      $(".preprocProPerty").val(prettyJson(JSON.stringify(preProcData)));
      var full_text = $("#preprocProPerty").val();

      let confirm_comment = "등록 이후 수정이 불가합니다.\n등록 하시겠습니까?";

      let con = confirm(confirm_comment);
      if (con === true) {
        var data = {
          model_seq: model_seq,
          algorithm: algorithm,
          algorithm_seq: algorithm_seq,
          algorithm_meta_item_list: algorithmMetaItemList,
          file_path: file_path,
          file_name: file_name,
          output_col: outputCol, //feature_col: feature_col,
          full_text: full_text,
        };
        showProgressBar({ element: null, process_id: "process-18" });
        $.ajax({
          type: "POST",
          url: "/dt/etc/model/make/model_set",
          data: JSON.stringify(data),
          contentType: "application/json; charset=utf-8;",
          dataType: "json",
          success: function (result) {
            console.log("result", result);
            closeProgressBar({ element: null, process_id: "process-18" });
            if (result.result_code === 200) {
              window.location.href =
                contextPath + "/dt/etc/model/naomi/list?menuCd=" + menuCd;
            }
          },
          error: function (xhr, status, error) {
            console.error("error : ", error);
            closeProgressBar({ element: null, process_id: "process-18" });
            alert("에러가 발생하였습니다. 관리자에게 문의하십시오.");
          },
        });
      } else {
        return false;
      }
    } else {
      var optimizer_number_chk = $(".optimizer-number-chk").val();

      if (typeof optimizer_number_chk != "undefined") {
        if (
          isNaN(optimizer_number_chk) ||
          optimizer_number_chk <= 0 ||
          optimizer_number_chk >= 1
        ) {
          alert("optimizerLr은   0보다 크고 1보다 작은 값만 가능합니다.");
          $(".optimizer-number-chk").val("0.0005"); // 기본값으로 조정
          return false;
        }
      }

      //console.log(jsonTemplateArrayNumbering());
      var modelTemplate = modelEtcAlgorithmTemplate();
      modelTemplate.output_col = outputCol;
      modelTemplate.algorithm = algorithm;
      modelTemplate.algorithm_seq = algorithm_seq;
      modelTemplate.hyperparam.window_size = $("#window_size").val();
      modelTemplate.hyperparam.batch_size = $("#batch_size").val();
      modelTemplate.hyperparam.epochs = $("#epochs").val();
      modelTemplate.hyperparam.units = $("#units").val();
      modelTemplate.hyperparam.test_size = $("#test_size").val();
      modelTemplate.hyperparam.patience = $("#patience").val();

      preProcData.preproc_property_info[0].model_create = "Y";
      preProcData.preproc_property_info[0].model_property[0] = modelTemplate;

      $("#preprocProPerty").val(JSON.stringify(preProcData));
      $(".preprocProPerty").val(prettyJson(JSON.stringify(preProcData)));
      var full_text = $("#preprocProPerty").val();

      var confirm_comment;
      confirm_comment = "등록 이후 수정이 불가합니다.\n등록 하시겠습니까?";

      /*
            if (feature_col.length == 0) {
                confirm_comment = '독립변수를 체크 하지 않을 경우 종속변수만 적용되어 모델이 생성됩니다.\n등록 이후 수정이 불가합니다.\n등록 하시겠습니까?';
            } else {
                confirm_comment = '등록 이후 수정이 불가합니다.\n등록 하시겠습니까?';
            }

            if (feature_col.length == 0) {
                feature_col = null;
            }
            */

      var con = confirm(confirm_comment);
      if (con === true) {
        var data = {
          model_seq: model_seq,
          algorithm: algorithm,
          algorithm_seq: algorithm_seq,
          algorithm_meta_item_list: algorithmMetaItemList,
          file_path: file_path,
          file_name: file_name,
          output_col: outputCol, //feature_col: feature_col,
          full_text: full_text,
        };
        showProgressBar({ element: null, process_id: "process-18" });
        $.ajax({
          type: "POST",
          url: "/dt/etc/model/make/model_set",
          data: JSON.stringify(data),
          contentType: "application/json; charset=utf-8;",
          dataType: "json",
          success: function (result) {
            console.log("result", result);
            closeProgressBar({ element: null, process_id: "process-18" });
            if (result.result_code === 200) {
              window.location.href =
                contextPath + "/dt/etc/model/ae/list?menuCd=" + menuCd;
            }
          },
          error: function (xhr, status, error) {
            console.error("error : ", error);
            closeProgressBar({ element: null, process_id: "process-18" });
            alert("에러가 발생하였습니다. 관리자에게 문의하십시오.");
          },
        });
      } else {
        return false;
      }
    }
  });
});

function makeAlgorithmOutputTable(
  container,
  headers,
  index_column,
  isCheckbox,
) {
  if (isCheckbox === null || isCheckbox === undefined || isCheckbox === "") {
    isCheckbox = false;
  }
  let tableContainer = document.createElement("div");
  ["table-responsive"].forEach(function (className) {
    tableContainer.classList.add(className);
  });

  let table = document.createElement("table");
  ["data-table"].forEach(function (className) {
    table.classList.add(className);
  });
  table.id = "outputCheckTable";
  table.style.width = "100%";
  let thead = document.createElement("thead");
  let tr = document.createElement("tr");
  ["선택", "COLUMN"].forEach(function (column) {
    let th = document.createElement("th");
    th.innerHTML = `${column}`;
    tr.appendChild(th);
  });
  thead.appendChild(tr);
  table.appendChild(thead);

  let tbody = document.createElement("tbody");
  headers = headers.map((item) => item.replace(/\"/g, ""));
  headers.forEach(function (header, index) {
    let tr = document.createElement("tr");
    let inputTd = document.createElement("td");

    let inputContainer = document.createElement("div");
    ["form-checkbox"].forEach(function (className) {
      inputContainer.classList.add(className);
    });
    inputContainer.style.display = "inline-block";

    let input = document.createElement("input");
    input.type = isCheckbox ? "checkbox" : "radio";

    ["ui-check"].forEach(function (className) {
      input.classList.add(className);
    });

    input.setAttribute("aria-labelledby", `output_col_${header}_label`);
    input.id = `output_col_${header}`;
    input.name = "outputCol";
    input.value = `${header}`;

    let label = document.createElement("label");
    ["form-label"].forEach(function (className) {
      label.classList.add(className);
    });
    label.setAttribute("for", `output_col_${header}`);
    label.id = `output_col_${header}_label`;
    label.style.margin = "0";
    inputContainer.appendChild(input);
    inputContainer.appendChild(label);
    inputTd.appendChild(inputContainer);

    tr.appendChild(inputTd);
    let columnTd = document.createElement("td");
    columnTd.innerHTML = `${header}`;
    tr.appendChild(columnTd);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  tableContainer.appendChild(table);
  container.appendChild(tableContainer);
}

function makeAlgorithmFeatureTable(
  container,
  headers,
  index_column,
  isCheckbox,
) {
  if (isCheckbox === null || isCheckbox === undefined || isCheckbox === "") {
    isCheckbox = false;
  }
  let tableContainer = document.createElement("div");
  ["table-responsive"].forEach(function (className) {
    tableContainer.classList.add(className);
  });

  let table = document.createElement("table");
  ["data-table"].forEach(function (className) {
    table.classList.add(className);
  });
  table.id = "featureCheckTable";
  table.style.width = "100%";
  let thead = document.createElement("thead");
  let tr = document.createElement("tr");
  ["선택", "COLUMN"].forEach(function (column) {
    let th = document.createElement("th");
    th.innerHTML = `${column}`;
    tr.appendChild(th);
  });
  thead.appendChild(tr);
  table.appendChild(thead);

  let tbody = document.createElement("tbody");
  headers = headers.map((item) => item.replace(/\"/g, ""));
  headers.forEach(function (header, index) {
    let tr = document.createElement("tr");
    let inputTd = document.createElement("td");

    let inputContainer = document.createElement("div");
    ["form-checkbox"].forEach(function (className) {
      inputContainer.classList.add(className);
    });
    inputContainer.style.display = "inline-block";

    let input = document.createElement("input");
    input.type = isCheckbox ? "checkbox" : "radio";

    ["ui-check"].forEach(function (className) {
      input.classList.add(className);
    });

    input.setAttribute("aria-labelledby", `feature_col_${header}_label`);
    input.id = `feature_col_${header}`;
    input.name = "featureCol";
    input.value = `${header}`;

    let label = document.createElement("label");
    ["form-label"].forEach(function (className) {
      label.classList.add(className);
    });
    label.setAttribute("for", `feature_col_${header}`);
    label.id = `feature_col_${header}_label`;
    label.style.margin = "0";
    inputContainer.appendChild(input);
    inputContainer.appendChild(label);
    inputTd.appendChild(inputContainer);

    tr.appendChild(inputTd);
    let columnTd = document.createElement("td");
    columnTd.innerHTML = `${header}`;
    tr.appendChild(columnTd);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  tableContainer.appendChild(table);
  container.appendChild(tableContainer);
}

/**
 * Declared 2025-03-24
 * DTW를 D-DTW로 변경하면서 사용하지 않는 함수
 * */
function correlationBarView(data, xdata) {
  let option = {
    series: [
      {
        header_name: [],
        sort: "1",
        unit_type: "P",
        type: "D",
        name: "Correlation",
        key: 0,
        isComma: false,
        chart: "bar",
        unit: "",
        yname: "",
        data: data,
      },
    ],
    subtitle: "",
    title: "",
    xdata: xdata,
  };
  viewTypeDefault("bar", option, 4, true);
}

function correlationHeatMapView(data, xdata, ydata) {
  let option = {
    series: [
      {
        header_name: [],
        sort: "1",
        unit_type: "P",
        type: "D",
        name: "Correlation",
        key: 0,
        chart: "bar",
        unit: "",
        yname: "",
        data: data,
      },
    ],
    subtitle: "",
    title: "",
    xdata: xdata,
    ydata: ydata,
  };
  viewTypeDefault("heatmap", option, 4, true);
}

function makeAlgorithmMetaItemList(model_algrm_seq, model_seq, callback) {
  showProgressBar({ element: null, process_id: "process-4" });
  let data = {
    model_algrm_seq: model_algrm_seq,
    model_seq: model_seq,
  };
  $.ajax({
    type: "POST",
    url: "/dt/etc/model/make/algorithm_meta_set",
    data: JSON.stringify(data),
    contentType: "application/json; charset=utf-8;",
    dataType: "json",
    success: function (result) {
      try {
        if (result.result_code === 200) {
          console.log("result", result);
          $("#algorithm_meta_set").val(
            JSON.stringify(result.algorithm_meta_item_list),
          );
          $("#algorithm_param_template_set").val(
            JSON.stringify(result.algorithm_param_template_set),
          );
          let parameterListContainer = document.querySelector(
            "#algorithm_meta_item_list",
          );
          parameterListContainer.innerHTML = ``;
          makeModelParameterList(
            parameterListContainer,
            result.algorithm_meta_item_list,
            result.meta_item_loss_list,
            result.meta_item_meterics_list,
            result.meta_item_optimizer_list,
          );
          closeProgressBar({ element: null, process_id: "process-4" });
          callback(result);
        } else {
          closeProgressBar({ element: null, process_id: "process-4" });
          alert("에러가 발생하였습니다. 관리자에게 문의하십시오.");
        }
      } catch (error) {
        closeProgressBar({ element: null, process_id: "process-4" });
        console.error("makeAlgorithmMetaItemList", error);
      }
    },
    error: function (xhr, status, error) {
      closeProgressBar({ element: null, process_id: "process-4" });
      console.error("makeAlgorithmMetaItemList", error);
      alert("에러가 발생하였습니다. 관리자에게 문의하십시오.");
    },
  });
}

function getCorrelation(type, data, callback) {
  $.ajax({
    type: "POST",
    url: `/dt/dataset/correlation/${type}/META_ETC_MODEL`,
    data: JSON.stringify(data),
    contentType: "application/json; charset=utf-8;",
    dataType: "json",
    success: function (result) {
      try {
        if (result.result_code === 200) {
          result.type = type;
          console.log("getCorrelation", result);
          callback(result);
        } else {
          console.error("에러가 발생하였습니다. 관리자에게 문의하십시오.");
          closeProgressBar({ element: null, process_id: "correlation-1" });
        }
      } catch (error) {
        console.error("getCorrelation", error);
        closeProgressBar({ element: null, process_id: "correlation-1" });
      }
    },
    error: function (xhr, status, error) {
      console.error("getCorrelation", error);
      alert("에러가 발생하였습니다. 관리자에게 문의하십시오.");
      closeProgressBar({ element: null, process_id: "correlation-1" });
    },
  });
}
