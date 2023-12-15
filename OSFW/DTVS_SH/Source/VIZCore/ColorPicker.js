//import $ from 'jquery';

class ColorPicker {
    constructor(view, VIZCore) {
        let scope = this;

        this.colorpicker = undefined;
        this.closebtn = undefined;

        //전체 색상 
        this.ctx_color = undefined;
        this.canvas_color = undefined;

        //Pick한 디테일 색상
        this.ctx_detailColor = undefined;
        this.canvas_detailColor = undefined;

        const defaultColor = new VIZCore.Color(255, 0, 0);
        let pickColor = undefined;

        // Color Picker 보이기/숨기기
        this.visible = false;

        const CanvasType = {
            Color: 0,  // canvas_color
            DetailColor: 10, //canvas_detailColor
        };

        // Color Picker 보이기/숨기기
        this.Show = function (show) {

            colorpicekrShow(show);
        };

        function colorpicekrShow(show) {

            if (show === true) {
                scope.colorpicker.style.display = "block";
                scope.closebtn.style.display = "block";
                scope.visible = true;
            }
            else {
                scope.colorpicker.style.display = "none";
                scope.closebtn.style.display = "none";
                scope.visible = false;
            }
        };


        this.GetShow = function () {
            return scope.visible;
        }

        // Color Picker 표출될 위치 
        this.SetPosition = function (buttonTop, buttonLeft) {

            //클릭한 버튼을 기준으로 위치계산
            let colorpicker_top = buttonTop - scope.colorpicker.offsetHeight - 2;
            let colorpicker_left = buttonLeft;

            scope.colorpicker.style.top = colorpicker_top + 'px';
            scope.colorpicker.style.left = colorpicker_left + 'px';

            let closebtn_top = colorpicker_top - scope.closebtn.offsetHeight;
            let closebtn_left = (colorpicker_left + scope.colorpicker.offsetWidth) - scope.closebtn.offsetWidth;

            scope.closebtn.style.top = closebtn_top + 'px';
            scope.closebtn.style.left = closebtn_left + 'px';
        };


        /// Color 생성
        let initColorPicker = () => {

            let initUI = () => {
                ///Color & Alpha Container
                let div_color = document.createElement('div');
                div_color.style.display = "none";
                div_color.id = "VIZCore_ColorAlpha";
                div_color.className = "div_colorPickerPopup";
                scope.colorpicker = div_color;

                // 전체 색상 Canvas
                // Content1
                let div_color_content1 = document.createElement('div');
                div_color_content1.id = view.GetViewID() + "div_color_content1";
                div_color_content1.className = "colorPicker_content";
                div_color_content1.style.marginTop = '5px';
                div_color.appendChild(div_color_content1);

                // Canvas 
                let canvas = document.createElement('canvas');
                canvas.id = "canvas_colora";
                canvas.className = "div_colorPickerCanvas";
                canvas.width = 200;
                canvas.height = 130;
                canvas.style.border = "1px solid rgba(0, 0, 0, 0.2)";
                canvas.addEventListener('click', function (event) {
                    handleColorPick(event, CanvasType.Color)
                });
                div_color_content1.appendChild(canvas);

                scope.ctx_color = canvas.getContext("2d");
                scope.canvas_color = canvas;

                // Pick 한 색의 Detail Canvas
                // Content2
                let div_color_content2 = document.createElement('div');
                div_color_content2.id = view.GetViewID() + "div_color_content2";
                div_color_content2.className = "colorPicker_content";
                div_color.appendChild(div_color_content2);

                // Detail Canvas
                let detailCanvas = document.createElement('canvas');
                detailCanvas.id = view.GetViewID() + "canvas_detail_color";
                detailCanvas.className = "div_colorPickerCanvas";
                detailCanvas.width = 200;
                detailCanvas.height = 40;
                detailCanvas.style.border = "1px solid rgba(0, 0, 0, 0.2)";
                div_color_content2.appendChild(detailCanvas);

                detailCanvas.addEventListener('click', function (event) {
                    handleColorPick(event, CanvasType.DetailColor)
                });

                scope.ctx_detailColor = detailCanvas.getContext("2d");
                scope.canvas_detailColor = detailCanvas;

                /// 선택한 색상 미리보기 , 투명도 조절 Slider
                // Content
                let div_color_content3 = document.createElement('div');
                div_color_content3.id = view.GetViewID() + "div_color_content3";
                div_color_content3.className = "colorPicker_trans_content";
                div_color.appendChild(div_color_content3);

                // Color Preview
                let colorPreview = document.createElement('div');
                colorPreview.id = view.GetViewID() + 'colorPreview';
                colorPreview.className = "div_colorPreview";
                div_color_content3.appendChild(colorPreview);

                //Slider
                let div_range = document.createElement('div');
                div_range.id = view.GetViewID() + "div_range_transparency";
                div_range.className = "Transparency_input";
                div_range.style.width = "calc(100% - 8px)";
                div_range.style.height = "25px";
                div_range.style.top = "0px";
                div_range.style.marginLeft = "4px";
                div_range.style.borderRadius = "2px";

                let slider = document.createElement("input");
                slider.type = "range";
                slider.id = view.GetViewID() + "slider";
                slider.min = "0";
                slider.max = "100";
                slider.step = "0.01";
                slider.value = "100";
                div_range.appendChild(slider);
                div_color_content3.appendChild(div_range);

                div_range.addEventListener("change", function () {

                    let transparency = Math.round(slider.value * (255 / 100));
                    let pickedColor = new VIZCore.Color();
                    pickedColor = getPickColor();
                    let vizrgbColor = "rgba(" + pickedColor.r + "," + pickedColor.g + "," + pickedColor.b + "," + transparency / 255 + ")";

                    colorPreview.style.backgroundColor = vizrgbColor;
                    colorPreview.style.borderColor = vizrgbColor;

                    //투명도 지정된 컬러
                    setPickColor(new VIZCore.Color(pickedColor.r, pickedColor.g, pickedColor.b, transparency));
                });


                // X 버튼 생성
                let closeButton = document.createElement('div');
                closeButton.id = view.GetViewID() + "closebutton";
                closeButton.className = 'colorPicker_Close_button colorPicker_Close_button_Icon';
                view.Container.appendChild(closeButton);
                scope.closebtn = closeButton;

                // X 버튼 클릭 이벤트 핸들러

                closeButton.addEventListener('click', function () {
                    colorpicekrShow(false);
                });

                let div_color_content4 = document.createElement('div');
                div_color_content4.id = view.GetViewID() + "div_color_content4";
                div_color_content4.className = "colorPicker_trans_content";
                div_color_content4.style.display = 'inline-block';
                div_color.appendChild(div_color_content4);

                                
                let btn_Cancel = document.createElement('button');
                btn_Cancel.className = "colorPicker_button";
                btn_Cancel.id = view.GetViewID() + "btn_Cancel";
                btn_Cancel.style.float = 'right'; 
                btn_Cancel.style.backgroundImage = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABF0lEQVRYhe2X4Q2CMBCFT+MAjuIIDMAOdQQ2cAVHsDswACM4ChtgGjCi3NH3jhhM5H6QtKH3vnDt47rruk7WjP2q6n8P8BMAB3U2lIWIFMOolVhfXdlDWYnIcRg1EusGA+jFL6NEJ4n1mRS/pefH7AQALUEYEi4RV8MCaN0QtriWU2wjshNFsxyONXYJ+gVRk1G/hAc4uwdQCKd4CuxfMCfwBHKI4wDzEFpA4ilwJ7TLMXmT8QzOivMQlDgP8IXgAPL7gHNMCgDfhBQEBjB/DHGzcgHkTIZ1TAoAdbgFEDYAa69OCB2g72R4e52HqHCAVxuFi+chtJzwMeQcDrdtsycc926+pjRBhPL+1pQqsV3NNoB1AUTkAQMQi7emeV4TAAAAAElFTkSuQmCC')";
                div_color_content4.appendChild(btn_Cancel);
                btn_Cancel.addEventListener("click", function () {
                    colorpicekrShow(false);
                });

                let btn_Apply = document.createElement('button');
                btn_Apply.className = "colorPicker_button";
                btn_Apply.id = view.GetViewID() + "btn_Apply";
                btn_Apply.style.float = 'right'; 
                btn_Apply.style.marginRight = '5px';
                btn_Apply.style.backgroundImage =  "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsSAAALEgHS3X78AAABF0lEQVRYhe2XzQ2CMBiGP413HcGzXNhAR3ADnKBy6BZyUCaQTdxALr27ghNgaj6TBr7+QsVE3qQHC/V5eNsYmTVNA2NmPir97wUmgZ8QWMQGJEWZAsBZmcoFZ/VXBBB+A4ClMr1S74m2BRp4J1EaQPiduPQEgIc6MXgDypNT8J3gLJ6AofYPvG6v6WxBUpTyxKb4sRac5R5wXe0kXIZqQH7RFscxKcqrI9xUOwnXCbSTmSRCarcJUAtICaX2IDgpgHte2ST61K5G+48IYRlxqcKf1uDanQQsElS84TLGQyg4O2i2o50guFXAUSIY7iRgkegFdxbQSPSGy3i/F+DB3A8Bf0cK+I7N6bIOWUeN6c1oEvhzAQB4Aa+v5B29QLvsAAAAAElFTkSuQmCC')";
                div_color_content4.appendChild(btn_Apply);
                btn_Apply.addEventListener("click", function () {
                    applyColor();
                    colorpicekrShow(false);
                });

                
                view.Container.appendChild(div_color);
            }


            // Color Picekr UI
            initUI();

            let pickCanvasColor = new VIZCore.Color(); // detail color 선택 시 선택한 좌표를 기준으로 사각형을 그림, 선택을 할때마다 canvas를 clear해야한다. 따라서 선택된 색상을 알고있어야한다.

            /// type  : 0 = Color Canvas , 1 = Detail Color Canvas
            function handleColorPick(event, type) {
                let selectedColor = getColorAtCursor(event, type);
                let vizrgbColor = new VIZCore.Color(selectedColor.r, selectedColor.g, selectedColor.b);

                let colorPreview = document.getElementById(view.GetViewID() + 'colorPreview');
                colorPreview.style.backgroundColor = `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`;
                colorPreview.style.borderColor = `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`;

                if (type === CanvasType.Color) {

                    createColorToBlackGradient(vizrgbColor);
                    drawCircleAtCursor(event);
                    pickCanvasColor = vizrgbColor;
                }
                else {
                    drawRectangleAtCursor(event);
                }


                updateSliderBackground(vizrgbColor);
                setPickColor(vizrgbColor);
            };


            function getColorAtCursor(event, type) {

                let x = undefined;
                let y = undefined;
                let imageData = undefined;

                switch (type) {
                    case CanvasType.Color:
                        x = event.clientX - scope.canvas_color.getBoundingClientRect().left;
                        y = event.clientY - scope.canvas_color.getBoundingClientRect().top;
                        scope.ctx_color.imageSmoothingEnabled = true;
                        imageData = scope.ctx_color.getImageData(x, y, 1, 1).data;
                        break;
                    case CanvasType.DetailColor:
                        x = event.clientX - scope.canvas_detailColor.getBoundingClientRect().left;
                        y = event.clientY - scope.canvas_detailColor.getBoundingClientRect().top;
                        scope.ctx_detailColor.imageSmoothingEnabled = true;
                        imageData = scope.ctx_detailColor.getImageData(x, y, 1, 1).data;
                        break;
                    default:
                        break;
                }

                return {
                    r: imageData[0],
                    g: imageData[1],
                    b: imageData[2]
                };
            };


            function drawCircleAtCursor(event) {

                // 캔버스에서의 마우스 위치 가져오기
                let mouseX = event.clientX - scope.canvas_color.getBoundingClientRect().left;
                let mouseY = event.clientY - scope.canvas_color.getBoundingClientRect().top;

                //Canvas Clear - 이전에 그린 원을 지우기
                clearCanvas(CanvasType.Color);

                // 선택한 색상 주위에 원을 그리기
                let radius = 5; // 원의 반지름
                let outerStrokeColor = 'white'; // 외부 테두리 색상
                let innerStrokeColor = 'rgba(0, 0, 0, 1)'; // 내부 테두리 색상

                scope.ctx_color.beginPath();
                scope.ctx_color.arc(mouseX, mouseY, radius, 0, 2 * Math.PI);

                // 외부 흰색 테두리 그리기
                scope.ctx_color.strokeStyle = outerStrokeColor;
                scope.ctx_color.lineWidth = 4;
                scope.ctx_color.stroke();

                // 내부 검은색 테두리 그리기
                scope.ctx_color.strokeStyle = innerStrokeColor;
                scope.ctx_color.lineWidth = 2;
                scope.ctx_color.stroke();

                // 원 내부를 채우기 위한 코드 
                scope.ctx_color.fillStyle = 'rgba(0, 0, 0, 0)';
                scope.ctx_color.fill();

                scope.ctx_color.closePath();
            }

            function drawRectangleAtCursor(event) {


                // 캔버스에서의 마우스 위치 가져오기
                let mouseX = event.clientX - scope.canvas_detailColor.getBoundingClientRect().left;

                // Canvas Clear - 이전에 그린 도형들을 지우기
                clearCanvas(CanvasType.DetailColor);

                // 사각형 그리기
                const rectangleWidth = 10; // 사각형 가로 길이
                const rectangleHeight = 40; // 사각형 세로 길이

                const outerStrokeColor = 'rgba(255, 255, 255, 1)' // 외부 테두리 색상
                const innerStrokeColor = 'rgba(0, 0, 0, 0.9)'; // 내부 테두리 색상

                scope.ctx_detailColor.beginPath();
                scope.ctx_detailColor.rect(mouseX - rectangleWidth / 2, 0, rectangleWidth, rectangleHeight);

                // 외부 흰색 테두리 그리기
                scope.ctx_detailColor.strokeStyle = outerStrokeColor;
                scope.ctx_detailColor.lineWidth = 4;
                scope.ctx_detailColor.stroke();

                // 내부 검은색 테두리 그리기
                scope.ctx_detailColor.strokeStyle = innerStrokeColor;
                scope.ctx_detailColor.lineWidth = 2;
                scope.ctx_detailColor.stroke();

                scope.ctx_detailColor.stroke();
                scope.ctx_detailColor.closePath();
            }



            // 전체 Canvas Clear
            function clearCanvas(type) {
                switch (type) {
                    case CanvasType.Color:
                        scope.ctx_color.clearRect(0, 0, scope.canvas_color.width, scope.canvas_color.height);
                        createColorPicker();
                        break;
                    case CanvasType.DetailColor:
                        scope.ctx_detailColor.clearRect(0, 0, scope.canvas_detailColor.width, scope.canvas_detailColor.height);
                        createColorToBlackGradient(pickCanvasColor);
                        break;
                    default:
                        break;
                }

            }

            // 투명도 슬라이더 배경색 update
            function updateSliderBackground(value) {

                let vizrgbColor = "rgba(" + value.r + "," + value.g + "," + value.b + "," + 1 + ")";
                let div_range = document.getElementById(view.GetViewID() + "slider");
                if (div_range !== undefined && div_range !== null) {
                    div_range.style.background = vizrgbColor;
                    div_range.value = "100";
                }

            };

            // 초기화 함수 호출
            createColorPicker();
            createColorToBlackGradient(defaultColor);

            function createColorPicker() {
                // 그라데이션 생성
                const gradient = scope.ctx_color.createLinearGradient(0, 0, scope.canvas_color.width, 0);
                gradient.addColorStop(0, 'rgba(255, 0, 0, 1)');
                gradient.addColorStop(0.17, 'rgba(255, 255, 0, 1)');
                gradient.addColorStop(0.34, 'rgba(0, 255, 0, 1)');
                gradient.addColorStop(0.51, 'rgba(0, 255, 255, 1)');
                gradient.addColorStop(0.68, 'rgba(0, 0, 255, 1)');
                gradient.addColorStop(0.85, 'rgba(255, 0, 255, 1)');
                gradient.addColorStop(1, 'rgba(255, 0, 0, 1)');

                // 그라데이션을 화면에 그리기
                scope.ctx_color.fillStyle = gradient;
                scope.ctx_color.fillRect(0, 0, scope.canvas_color.width, scope.canvas_color.height);

                // 흰색 가로 그라데이션 추가
                const whiteGradient = scope.ctx_color.createLinearGradient(0, scope.canvas_color.height, 0, 0);
                whiteGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
                whiteGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                scope.ctx_color.fillStyle = whiteGradient;
                scope.ctx_color.fillRect(0, 0, scope.canvas_color.width, scope.canvas_color.height);
            };


            function createColorToBlackGradient(startColor) {

                // 특정 색상부터 검정색까지의 그라데이션 생성
                const gradient = scope.ctx_detailColor.createLinearGradient(0, 0, scope.canvas_detailColor.width, 0);
                gradient.addColorStop(0, `rgba(${startColor.r}, ${startColor.g}, ${startColor.b} , 1)`);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');

                // 그라데이션을 캔버스에 적용
                scope.ctx_detailColor.fillStyle = gradient;
                scope.ctx_detailColor.fillRect(0, 0, scope.canvas_detailColor.width, scope.canvas_detailColor.height);
            };

        };


        // 선택한 색상 설정하기
        function setPickColor(color) {
            pickColor = color;
        }

        // 선택한 색상 가져오기
        function getPickColor(color) {
            return pickColor;
        }

        // 선택 개체 색상 설정하기
        function applyColor() {
            if (pickColor !== undefined) {
                let selObjects = view.Interface.Object3D.GetSelectedObject3D();
                //action color
           
                let selectColor = new VIZCore.Color();
                selectColor = getPickColor();

                view.Interface.Object3D.Color.SetColorByNodeID(selObjects, selectColor);
            }
        };

        this.Init = function () {

            initColorPicker();
        };

    }
}

export default ColorPicker;