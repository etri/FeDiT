
class TransformPanel {
    constructor(view, vizwide3d, VIZCore) {
        let scope = this;

        this.TransformPanel = undefined;

        function initElement() {
            const color = { r: 255, g: 255, b: 255, a: 255 };
            // 패널 설정
            let panel = new vizwide3d.Panel(view);
            panel.id = vizwide3d.Main.GetViewID() + "Transform_Panel";
            panel.SetTitleText('Transform');
            panel.SetContentBackgroundColor(color);
            panel.SetSize(270, 400);
            panel.SetLocationLeft(400);
            panel.SetLocationTop(50);
            panel.Show(false);

            scope.TransformPanel = panel;

            const element = document.createElement('div');

            let div_contents = document.createElement('div');
            div_contents.id = vizwide3d.Main.GetViewID() + "_div_transform_input_contents";
            div_contents.className = "div_transform_content";
            div_contents.innerHTML = "";
            element.appendChild(div_contents);

            //개체 이동
            let div_content_box_1 = document.createElement('div');
            div_content_box_1.id = vizwide3d.Main.GetViewID() + "div_content_box_1";
            div_content_box_1.className = "div_transform_input_content";
            div_contents.appendChild(div_content_box_1);

            let div_content_name_1 = document.createElement('div');
            div_content_name_1.id = vizwide3d.Main.GetViewID() + "div_content_name_1";
            div_content_name_1.className = "div_transform_input_content_name";
            div_content_name_1.innerHTML = "move";
            div_content_box_1.appendChild(div_content_name_1);

            // X, Y, Z
            for (let axis = 1; axis <= 3; axis++) {
                // div_content_box_i_container
                let container = document.createElement('div');
                container.id = vizwide3d.Main.GetViewID() + `div_content_box_1_container_${axis}`;
                container.className = "div_transform_container";
                div_content_box_1.appendChild(container);

                // div_content_box_i_label
                let label = document.createElement('label');
                label.id = vizwide3d.Main.GetViewID() + `div_content_box_1_label_${axis}`;
                label.className = "div_transform_input_content_label";
                label.innerHTML = `<label>${axis === 1 ? 'X' : axis === 2 ? 'Y' : 'Z'} :</label>`;
                container.appendChild(label);

                // div_content_box_i_inputElement
                let inputElement = document.createElement('input');
                inputElement.id = vizwide3d.Main.GetViewID() + `div_content_box_1_inputElement_${axis}`;
                inputElement.className = "div_transform_input_content_input";
                inputElement.value = "0";
                inputElement.setAttribute("autocomplete", "off");
                inputElement.setAttribute("type", "number");
                container.appendChild(inputElement);
            }

            //개체 회전 
            let div_content_box_2 = document.createElement('div');
            div_content_box_2.id = vizwide3d.Main.GetViewID() + "div_content_box_2";
            div_content_box_2.className = "div_transform_input_content";
            div_contents.appendChild(div_content_box_2);

            let div_content_name_2 = document.createElement('div');
            div_content_name_2.id = vizwide3d.Main.GetViewID() + "div_content_name_2";
            div_content_name_2.className = "div_transform_input_content_name";
            div_content_name_2.innerHTML = "Rotate";
            div_content_box_2.appendChild(div_content_name_2);


            // X, Y, Z
            for (let axis = 1; axis <= 3; axis++) {
                // div_content_box_i_container
                let container = document.createElement('div');
                container.id = vizwide3d.Main.GetViewID() + `div_content_box_2_container_${axis}`;
                container.className = "div_transform_container";
                div_content_box_2.appendChild(container);

                // div_content_box_i_label
                let label = document.createElement('label');
                label.id = vizwide3d.Main.GetViewID() + `div_content_box_2_label_${axis}`;
                label.className = "div_transform_input_content_label";
                label.innerHTML = `<label>${axis === 1 ? 'X' : axis === 2 ? 'Y' : 'Z'} :</label>`;
                container.appendChild(label);

                // div_content_box_i_inputElement
                let inputElement = document.createElement('input');
                inputElement.id = vizwide3d.Main.GetViewID() + `div_content_box_2_inputElement_${axis}`;
                inputElement.className = "div_transform_input_content_input";
                inputElement.value = "0";
                inputElement.setAttribute("autocomplete", "off");
                inputElement.setAttribute("type", "number");
                container.appendChild(inputElement);
            }

            ///버튼 그룹
            let div_content_box_3 = document.createElement('div');
            div_content_box_3.id = vizwide3d.Main.GetViewID() + "div_content_box_3";
            div_content_box_3.className = "div_transform_input_content";
            div_content_box_3.style.border = 'none';
            div_content_box_3.style.height = '30px';
            div_content_box_3.style.marginTop = '7px';
            div_contents.appendChild(div_content_box_3);

            // 초기화 버튼
            let bt_ModelReset = document.createElement('div');
            bt_ModelReset.className = "ui_button_small";
            bt_ModelReset.id = panel.id + "bt_Reset";
            bt_ModelReset.innerHTML = "Reset";
            bt_ModelReset.style.width = "20%";
            bt_ModelReset.style.height = "23px";
            bt_ModelReset.style.float = 'right';
            div_content_box_3.appendChild(bt_ModelReset);

            // 초기화 버튼 이벤트
            bt_ModelReset.addEventListener("click", function () {
                let selectBodies = vizwide3d.Main.Data.GetSelection();
                let selectIds = [];

                for (let i = 0; i < selectBodies.length; i++) {
                    selectIds.push(selectBodies[i]);
                }

                //GetInputElement( 1 : move, 2: rotate , axis 1 : X, 2: Y, 3: Z)
                for (let i = 1; i < 3; i++) {
                    for (let j = 1; j < 4; j++)
                        GetInputElement(i, j).value = 0;
                }

                let move = new VIZCore.Vector3();
                move.x = parseFloat(GetInputElement(1, 1).value);
                move.y = parseFloat(GetInputElement(1, 2).value);
                move.z = parseFloat(GetInputElement(1, 3).value);

                let rotate = new VIZCore.Vector3();
                rotate.x = parseFloat(GetInputElement(2, 1).value);
                rotate.y = parseFloat(GetInputElement(2, 2).value);
                rotate.z = parseFloat(GetInputElement(2, 3).value);

                SetTransformObject(selectIds, move, rotate);
            });

            // 적용 버튼
            let bt_ModelApply = document.createElement('div');
            bt_ModelApply.className = "ui_button_small";
            bt_ModelApply.id = panel.id + "bt_Apply";
            bt_ModelApply.innerHTML = "OK";
            bt_ModelApply.style.width = "15%";
            bt_ModelApply.style.height = "23px";
            bt_ModelApply.style.float = 'right';
            bt_ModelApply.style.marginRight = '5px';
            div_content_box_3.appendChild(bt_ModelApply);

            // 적용 버튼 이벤트
            bt_ModelApply.addEventListener("click", function () {
                let selectBodies = vizwide3d.Main.Data.GetSelection();
                let selectIds = [];

                for (let i = 0; i < selectBodies.length; i++) {
                    selectIds.push(selectBodies[i]);
                }

                let move = new VIZCore.Vector3();
                move.x = parseFloat(GetInputElement(1, 1).value);
                move.y = parseFloat(GetInputElement(1, 2).value);
                move.z = parseFloat(GetInputElement(1, 3).value);

                let rotate = new VIZCore.Vector3();
                rotate.x = parseFloat(GetInputElement(2, 1).value);
                rotate.y = parseFloat(GetInputElement(2, 2).value);
                rotate.z = parseFloat(GetInputElement(2, 3).value);

                SetTransformObject(selectIds, move, rotate);
            });

            scope.TransformPanel.SetContent(element);

        }

        //// Object Transform 설정
        function SetTransformObject(selectIds, move, rotate) {

            vizwide3d.Object3D.Transform.SetMoveRotate(selectIds, move, rotate);
            vizwide3d.Main.ViewRefresh();
            vizwide3d.Main.Renderer.Render();
        }


        /// Panel UI 값 셋팅
        let SetTransformPanelUI = function () {

            let selectBodies = vizwide3d.Main.Data.GetSelection();
            let selectIds = [];

            if (selectBodies.length === 0) {
                SetInputEnable(false);
                SetButtonEnable(false);
                return;
            }

            for (let i = 0; i < selectBodies.length; i++) {
                selectIds.push(selectBodies[i]);
            }

            SetInputEnable(true);
            SetButtonEnable(true);
            let transform = vizwide3d.Object3D.Transform.GetObjectTransform(selectIds);
            let move = new VIZCore.Vector3();
            let rotate = new VIZCore.Vector3();

            if (transform !== undefined && transform.length > 0) {
                // 기준 transform
                move.x = transform[0].move.x;
                move.y = transform[0].move.y;
                move.z = transform[0].move.z;
                rotate.x = transform[0].rotate.x;
                rotate.y = transform[0].rotate.y;
                rotate.z = transform[0].rotate.z;

                if (transform.length > 1) {
                    //비교 - 선택된 model들이 모두 동일한 move, rotate값을 가지고 있는지
                    let result = transform.every(item => item.move.x === move.x && item.move.y === move.y && item.move.z === move.z
                        && item.rotate.x === rotate.x && item.rotate.y === rotate.y && item.rotate.z === rotate.z);

                    // 동일하지 않을 경우 0으로 값 셋팅
                    if (!result) {
                        move = new VIZCore.Vector3();
                        rotate = new VIZCore.Vector3();
                    }
                }
            }

            let transformCnt = 2; //move, rotate
            let axis = 3; // x,y,z

            GetInputElement(1, 1).value = move.x;
            GetInputElement(1, 2).value = move.y;
            GetInputElement(1, 3).value = move.z;
            GetInputElement(2, 1).value = rotate.x;
            GetInputElement(2, 2).value = rotate.y;
            GetInputElement(2, 3).value = rotate.z;
        }

        /// InputElement 반환
        let GetInputElement = function (type, axis) {
            // type 1 : move, 2: rotate
            // axis 1 : X, 2: Y, 3: Z
            return document.getElementById(`${vizwide3d.Main.GetViewID()}div_content_box_${type}_inputElement_${axis}`);
        }


        /// 버튼 활성화/비활성화
        let SetButtonEnable = function (enable) {

            let opacity = undefined;

            if (enable === true) {
                opacity = "1";  // 투명도를 원래대로 돌리기
            }
            else {
                opacity = "0.5";  // 투명도를 줄어 시각적으로 비활성화된 상태를 나타냄
            }

            let btReset = document.getElementById(scope.TransformPanel.id + "bt_Reset");
            let btApply = document.getElementById(scope.TransformPanel.id + "bt_Apply");

            btReset.disabled = !enable;
            btReset.style.opacity = opacity;

            btApply.disabled = !enable;
            btApply.style.opacity = opacity;

        }

        /// 입력창 UI 활성화/비활성화
        let SetInputEnable = function (enable) {
            let bgColor = undefined;

            if (enable === true)
                bgColor = "#FFF";
            else
                bgColor = "#ddd";

            let transformCnt = 2; //move, rotate
            let axis = 3; // x,y,z

            for (let i = 1; i < transformCnt + 1; i++) {
                for (let j = 1; j < axis + 1; j++) {
                    let intputElement = document.getElementById(`${vizwide3d.Main.GetViewID()}div_content_box_${i}_inputElement_${j}`);
                    intputElement.disabled = !enable;
                    intputElement.style.backgroundColor = bgColor;
                }
            }
        }

        let OnTransformChanged = function (e) {
            if (scope.GetShow() === true)
                SetTransformPanelUI();
        };

        this.Show = function (bool) {
            if (bool === true) {
                SetTransformPanelUI();
                scope.TransformPanel.Show(true);
            } else {
                scope.TransformPanel.Show(false);
            }
        };

        this.GetShow = function () {
            return scope.TransformPanel.GetShow();
        };

        // X 버튼 
        this.OnCloseButtonEvent = function (event) {
            scope.TransformPanel.OnCloseButtonEvent(event);
        };

        // 모델 선택 시 Transform 변경 이벤트(선택된 모델의 이동,회전)
        vizwide3d.Object3D.Transform.OnTransformChangedEvent(OnTransformChanged);

        let init = function () {
            initElement();
        };

        init();
    }
}
export default TransformPanel;