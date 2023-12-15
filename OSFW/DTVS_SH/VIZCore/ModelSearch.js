class ModelSearch {

    constructor(view, vizwide3d) {
        let scope = this;

        let cbClose = undefined;
        let panel = new vizwide3d.Panel(view);
        panel.id = "Model_Search_Panel";
        panel.SetLocationCenter();
        // 조회할 모델 입력 박스
        let inputElement = document.createElement('input');
        inputElement.id = "inputElement"
        inputElement.style = "width: 75%; height: 25px ; margin-right: 0.5em; margin-top:0.5em; margin-left:0.5em; font-weight: bold; color: #000000; background: #FFF; border: solid 0.5px #000000; border-radius: 5px;";

        // 조회버튼
        let bt_ModelSearch = document.createElement('button');
        bt_ModelSearch.className = "search_btn green rounded";
        bt_ModelSearch.id = panel.id + "bt_ModelSearch";
        bt_ModelSearch.innerHTML = "조회";
        bt_ModelSearch.style.fontSize = "13px"
        bt_ModelSearch.style.width = "15%";
        bt_ModelSearch.style.height = "27px";
        //조회 조건
        let SearchCondition = document.createElement('label');
        SearchCondition.textContent = "조회 조건 : ";
        SearchCondition.style = "font-size: 12px; position: relative; top: 4px; left: 9px";
        // 속성포함 체크박스
        let cb_IncludeAtt = document.createElement('input');
        cb_IncludeAtt.setAttribute("type", "checkbox");
        cb_IncludeAtt.setAttribute("id", "cb_IncludeAtt");
        cb_IncludeAtt.style.width = "17px";
        cb_IncludeAtt.style.height = "17px";
        let label_IncludeAtt = document.createElement('label');
        label_IncludeAtt.textContent = "속성 포함";
        label_IncludeAtt.setAttribute("for", "cb_IncludeAtt");
        label_IncludeAtt.style = "position: relative; top: -4.5px; font-size:11px;"   // 체크박스와 높이 맞춤

        // 검색어 일치 체크박스
        let cb_SimilarSearch = document.createElement('input');
        cb_SimilarSearch.setAttribute("type", "checkbox");
        cb_SimilarSearch.setAttribute("id", "cb_SimilarSearch");
        cb_SimilarSearch.style.width = "17px";
        cb_SimilarSearch.style.height = "17px";
        let label_SimilarSearch = document.createElement('label');
        label_SimilarSearch.textContent = "검색어 일치";
        label_SimilarSearch.setAttribute("for", "cb_SimilarSearch");
        label_SimilarSearch.style = "position: relative; top: -4.5px; font-size:11px;"
        // 결과 내 재검색 체크박스
        let cb_Re_Seach = document.createElement('input');
        cb_Re_Seach.setAttribute("type", "checkbox");
        cb_Re_Seach.setAttribute("id", "cb_Re_Seach");
        cb_Re_Seach.style.width = "17px";
        cb_Re_Seach.style.height = "17px";
        let label_Re_Seach = document.createElement('label');
        label_Re_Seach.textContent = "결과 내 재검색"
        label_Re_Seach.setAttribute("for", "cb_Re_Seach");
        label_Re_Seach.style = "position: relative; top: -4.5px; font-size:11px;"

        // 결과 테이블
        let table = document.createElement('table');
        table.className = "search_result_table";
        table.id = "ResultTable";
        table.style.marginTop = "4px";
        let FirstRow = table.insertRow();
        let col1 = FirstRow.insertCell(0);
        col1.className = "search_result_table_th";
        col1.outerHTML = "<th>No.</th>";
        col1.style.width = "10px";
        let col2 = FirstRow.insertCell(1);
        col2.className = "search_result_table_th";
        col2.outerHTML = "<th>Name</th>";
        let loadingSpinner = document.createElement('div');
        loadingSpinner.id = "loading";
        loadingSpinner.style = "position:absolute; height : 300px";
        let spinner = document.createElement('div');
        spinner.className = "spinner";
        loadingSpinner.appendChild(spinner);
        table.appendChild(loadingSpinner);

        let loadingSpinnerShow = function(visible){
            if (visible == true) {
                loadingSpinner.style.display = "block";
            }
            else {
                loadingSpinner.style.display = "none";
            }
        };

        // 데이터 개수
        let DataNumber = document.createElement('label');
        DataNumber.textContent = "조회 데이터 개수 : 0";
        DataNumber.style = "font-size: 11px; position: relative; top: -5px; left : 75%";

        // 전체 선택/해제 
        let cb_AllCheckData = document.createElement('input');
        cb_AllCheckData.setAttribute("type", "checkbox");
        cb_AllCheckData.setAttribute("id", "cb_AllCheckData");
        cb_AllCheckData.style = "position: absolute; margin-top: 0px; left: 0px; width:17px; height:17px;";
        let label_AllCheckData = document.createElement('label');
        label_AllCheckData.textContent = "전체 선택";
        label_AllCheckData.setAttribute("for", "cb_AllCheckData");
        label_AllCheckData.style = "position: absolute; margin-top: 0px; left: 24px; font-size:11px;";

        cb_AllCheckData.addEventListener('change', function(){
            if(cb_AllCheckData.checked){
                scope.SelectAll(table);
            } else {
                scope.UnselectAll(table);
            }
        });

        // panel 색상 설정
        panel.SetContentBackgroundColorFormRGBA(240, 240, 240, 255);        // Panel Content 배경 색상 설정
        //panel.SetBorderColorFromRGBA(240, 240, 240, 255);                   // Panel 배경 색상 설정
        //panel.style="background-color: rgb(240, 240, 240, 0.5);"        // Panel 배경 색상 설정 -> api 적용이 안되서 직접 넣어줌
        //panel.SetTitleBackgroundColorFormRGBA(204, 204, 204, 204);          // Panel Title 배경 색상 설정
        //panel.SetTitleTextColorFormRGBA(1, 1, 1, 1);                        // Panel Title 색상 설정
        // panel에 element 추가
        panel.SetContent(inputElement);
        panel.SetContent(bt_ModelSearch);
        panel.SetContent(document.createElement('br'));
        panel.SetContent(SearchCondition);
        panel.SetContent(document.createElement('hr'));
        panel.SetContent(cb_IncludeAtt);
        panel.SetContent(label_IncludeAtt);
        panel.SetContent(cb_SimilarSearch);
        panel.SetContent(label_SimilarSearch);
        panel.SetContent(cb_Re_Seach);
        panel.SetContent(label_Re_Seach);
        panel.SetContent(document.createElement('hr'));
        panel.SetContent(DataNumber);
        panel.SetContent(cb_AllCheckData);
        panel.SetContent(label_AllCheckData);
        panel.SetContent(table);
        panel.SetContent(document.createElement('br'));
        //panel.SetContent(loadingSpinner);
        panel.OnCloseButtonEvent(PanelClose);
        panel.SetTitleText("모델 조회");
        panel.Show(false);

        let isPanelShow = 0;
        
        inputElement.addEventListener('keydown', function (event) {
            // Enter key
            if (event.key === 'Enter') {
                SearchEvent();
            }
        });

        bt_ModelSearch.addEventListener("click", function () {
            SearchEvent();
        });

        let SearchEvent = function(){
            cb_AllCheckData.checked = false;
            loadingSpinnerShow(true);
            console.log("마우스 클릭");
            setTimeout(() => {
                SearchModel(inputElement.value, cb_IncludeAtt.checked, cb_SimilarSearch.checked, cb_Re_Seach.checked, table, vizwide3d);
                loadingSpinnerShow(false);    
            }, 50);
        }

        // $("#" + panel.id + "bt_ModelSearch").on('mousedown', function () {
        //     console.log("마우스 다운");
        //     $('#loading').show();
        // });

        // $("#" + panel.id + "bt_ModelSearch").on('click', function () {
        //     console.log("마우스 클릭");
        //     SearchModel(inputElement.value, cb_IncludeAtt.checked, cb_SimilarSearch.checked, cb_Re_Seach.checked, table, vizwide3d);
        //     $('#loading').hide();
        // });

        function onRowClick(event) {
            var tr = this;
            var td = tr.cells[1];
            let id = parseInt(td.getAttribute("value"));
            // 색 변경 - 컨트롤 눌렀을때
            if (event.ctrlKey) {
                if (tr.classList.contains("search_result_table_tr_click")) {
                    tr.classList.remove("search_result_table_tr_click");
                } else {
                    tr.classList.add("search_result_table_tr_click");
                }

                var tableTr = document.getElementsByClassName("search_result_table_tr_click");
                var selectIDsWithCtrl = [];
                for (var i = 0; i < tableTr.length; i++) {
                    selectIDsWithCtrl.push(parseInt(tableTr[i].cells[1].getAttribute("value")))
                }
                vizwide3d.Object3D.SelectByNodeID(selectIDsWithCtrl, true, false);

                // 테이블 길이가 0이상인 경우 - 컨트롤로 전체 선택 시 전체 선택 콤보박스 체크
                if(table.rows.length > 0){
                    if(selectIDsWithCtrl.length === table.rows.length - 1){
                        cb_AllCheckData.checked = true;
                    } else {
                        cb_AllCheckData.checked = false;
                    }
                }
            }
            else {
                // 색 변경 - 컨트롤 안눌렀을때
                var tableTr = document.getElementsByClassName("search_result_table_tr_click");

                // 전체 선택 콤보박스 해제
                cb_AllCheckData.checked = false;

                for (var i = tableTr.length - 1; i >= 0; i--) {
                    tableTr[i].classList.remove("search_result_table_tr_click");
                }
                tr.classList.add("search_result_table_tr_click");
                let ids = [];
                ids.push(id);
                vizwide3d.Object3D.SelectByNodeID(ids, true, false);
            }
        }
        // 더블클릭
        function onRowdblClick(event) {
            vizwide3d.View.ZoomSelectedObject();  // 선택 모델 박스 줌
        }
        function PanelClose() {
            isPanelShow = 0;
            if(cbClose !== undefined)
                cbClose();
        };

        function SearchModel(SearchString, isIncludeAtt, isMatching, isResearch, Table) {
            if (SearchString == "") {
                console.log("검색어를 입력해주세요.")
                return;
            }

            let deleteTableRow = function(table){
                for (let index = table.rows.length - 1 ; index > 0 ; index--) {  
                    table.deleteRow(-1);
                }
            }

            let keys = [];
            if(isIncludeAtt)
                keys = vizwide3d.Object3D.UDA.GetKeys();
            // 결과 내 재검색
            if (isResearch) {
                SearchCondition.textContent += " + " + SearchString;   // 조회 조건 초기화
                var id_arr = new Array();
                var name_arr = new Array();
                for (let i = 0; i < Table.rows.length; i++) {       // 검색 리스트
                    if (i == 0) continue;
                    let NodeName = Table.rows[i].cells[1].textContent;
                    let id = parseInt(Table.rows[i].cells[1].getAttribute("value"));
                    if (NodeName == null || NodeName == "") continue;
                    if (isMatching) {                                    // 검색어 일치
                        if (SearchString == NodeName) {
                            if (!(id_arr.includes(id))) {
                                id_arr.push(parseInt(id));
                                name_arr.push(NodeName);
                            }
                        }
                    }
                    else {                                              // 검색어 포함
                        if (NodeName.includes(SearchString)) {
                            if (!(id_arr.includes(id))) {
                                id_arr.push(parseInt(id));
                                name_arr.push(NodeName);
                            }
                        }
                    }
                }

                // 속성 포함 검색
                if (isIncludeAtt) {
                    let nodes = vizwide3d.Object3D.UDA.GetNodeIDsByValue(SearchString, isMatching);
                    for (let index = 0; index < nodes.length; index++) {
                        let node = vizwide3d.Object3D.FromID(nodes[index]);
                        for (let i = 0; i < Table.rows.length; i++) {
                            let ResultTableId = parseInt(Table.rows[i].cells[1].getAttribute("value"));
                            if (node.id == ResultTableId) {
                                if (!(id_arr.includes(ResultTableId))) {
                                    id_arr.push(ResultTableId);
                                    name_arr.push(Table.rows[i].cells[1].textContent);
                                }
                            }
                        }
                    }
                }
                //$('#' + Table.id + ' tr:not(:first)').remove(); // 첫번째 행 빼고 초기화
                deleteTableRow(Table);
                
                let columnCnt = 2;

                for (let i = 0; i < id_arr.length; i++) {
                    let tr_02 = Table.insertRow();
                    tr_02.className = "search_result_table_tr";
                    tr_02.onclick = onRowClick;
                    tr_02.ondblclick = onRowdblClick;
                    for (let j = 0; j < columnCnt; j++) {
                        if (j == 0) {
                            let td_03 = tr_02.insertCell(0);
                            td_03.className = "search_result_table_td";
                            td_03.textContent = i + 1;
                            td_03.setAttribute("value", id_arr[i]);
                        }
                        else {
                            let td_04 = tr_02.insertCell(1);
                            td_04.className = "search_result_table_td";
                            td_04.textContent = name_arr[i];
                            td_04.setAttribute("value", id_arr[i]);
                        }
                    }
                }
            }
            // 그냥 검색
            else {
                let finalNodes = [];                // 마지막에 결과리스트에 넣을 노드들
                //$('#' + Table.id + ' tr:not(:first)').remove(); // 첫번째 행 빼고 초기화
                deleteTableRow(Table);
                
                SearchCondition.textContent = "조회 조건 : " + SearchString;   // 조회 조건 초기화
                // 검색어 일치 여부 - True(일치), False(포함)
                finalNodes = vizwide3d.Object3D.Find.QuickSearch(SearchString, isMatching);
                // 속성 포함 검색
                if (isIncludeAtt) {
                    let nodes = vizwide3d.Object3D.UDA.GetNodeIDsByValue(SearchString, isMatching);
                    for (let index = 0; index < nodes.length; index++) {
                        let node = vizwide3d.Object3D.FromID(nodes[index]);
                        if (!(finalNodes.find(x => x.id == node.id))) {
                            finalNodes.push(node);
                        }
                    }
                }
                let columnCnt = 2;
                for (let i = 0; i < finalNodes.length; i++) {
                    let tr_02 = Table.insertRow();
                    tr_02.className = "search_result_table_tr";
                    tr_02.onclick = onRowClick;
                    tr_02.ondblclick = onRowdblClick;
                    for (let j = 0; j < columnCnt; j++) {
                        if (j == 0) {
                            let td_03 = tr_02.insertCell(0);
                            td_03.className = "search_result_table_td";
                            td_03.textContent = i + 1;
                            td_03.setAttribute("value", finalNodes[i].id);
                        }
                        else {
                            let td_04 = tr_02.insertCell(1);
                            td_04.className = "search_result_table_td";
                            td_04.textContent = finalNodes[i].name;
                            td_04.setAttribute("value", finalNodes[i].id);
                        }
                    }
                }
            }
            DataNumber.textContent = "조회 데이터 개수 : " + (Table.rows.length - 1);
        }

        this.UnselectAll = function (Table) {
            var selectIDs = [];
            for (var i = 0; i < Table.rows.length; i++) {
                var selectID = parseInt(Table.rows[i].cells[1].getAttribute("value"));
                selectIDs.push(selectID);

                Table.rows[i].classList = [];
                if (!(Table.rows[i].classList.contains("search_result_table_tr"))) {
                    Table.rows[i].classList.add("search_result_table_tr");
                }
            }
            vizwide3d.Object3D.SelectByNodeID(selectIDs, false, false);
        }

        this.SelectAll = function (Table) {
            var selectIDs = [];
            for (var i = 0; i < Table.rows.length; i++) {
                var selectID = parseInt(Table.rows[i].cells[1].getAttribute("value"));
                selectIDs.push(selectID);

                if (!(Table.rows[i].classList.contains("search_result_table_tr_click"))) {
                    Table.rows[i].classList.add("search_result_table_tr_click");
                }
            }
            vizwide3d.Object3D.SelectByNodeID(selectIDs, true, false);
        }

        // ----- Method
        this.ShowPanel = function () {
            if (isPanelShow == 0) {
                panel.Show(true);
                isPanelShow = 1;
            }
            else {
                panel.Show(false);
                isPanelShow = 0;
            }
        };

        this.OnCloseButtonEvent = function(cbclclick) {
            cbClose = cbclclick;
        };
    }
}

export default ModelSearch

 