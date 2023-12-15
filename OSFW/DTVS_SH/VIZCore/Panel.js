class Panel {
    /**
     * Panel 생성
     * @param {Object} element HTML Element
     * @example
     * let view = document.getElementById("view");
     * let panel = new vizwide3d.Panel(view);
     */
    constructor(rootPanel, defaultColor) {
        let scope = this;
        // UI Element 관리
        this.Element = {
            Panel: undefined,
            Title: {
                Text: undefined
            },
            CloseButton: undefined,
            Content: {
                Element: undefined
            }
        };

        function show(visible)
        {
            if (visible == true) {
                scope.Element.Panel.style.display = "block";

                // 위치 보정
                calcPanelPos();
            }
            else {
                scope.Element.Panel.style.display = "none";
            }
        }
        
        // Init
        // this.Init = function () {
        //     makeDiv();
        //     closeBtnClick();
        //     movePanel();
        // };

        // GUID 생성
        function guid() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        // element id 생성
        function shguid(){  
            return "vizwide3D_" + guid();
        }

        // 앨리먼트 생성
        function makeDiv() {
            let panel = document.createElement('div');
            panel.id = shguid();
            panel.className = "vizwide3D_Panel";
            rootPanel.appendChild(panel);
    
            scope.Element.Panel = panel;
    
            let title = document.createElement('div');
            title.id = shguid();
            title.className = "vizwide3D_Panel_Title";
            scope.Element.Panel.appendChild(title);
    
            scope.Element.Title = title;

            let moveDiv = document.createElement('div');
            moveDiv.id = shguid();
            moveDiv.className = "vizwide3D_Panel_Move";
            scope.Element.Move = moveDiv;
    
            let titleText = document.createElement('div');
            titleText.id = shguid();
            titleText.className = "vizwide3D_Panel_Title_Text";
            scope.Element.Title.appendChild(titleText);
    
            scope.Element.Title.Text = titleText;
    
            let closeBtn = document.createElement('div');
            closeBtn.id = shguid();
            closeBtn.className = "vizwide3D_Panel_Close_button vizwide3D_Panel_Close_button_Icon";
            scope.Element.Title.appendChild(closeBtn);
    
            scope.Element.CloseButton = closeBtn;
    
            let content = document.createElement('div');
            content.id = shguid();
            content.className = "vizwide3D_Panel_Content";
            
            
            scope.Element.Panel.appendChild(content);
    
            scope.Element.Content = content;
        }

        window.addEventListener('resize', function () {
            if(scope.Element.Panel.style.display !== "block") {
                return;
            }
            calcPanelPos();
        });

        const viewResize = new ResizeObserver(entries => {
            if(scope.Element.Panel.style.display !== "block") {
                return;
            }
            calcPanelPos();
        });
        viewResize.observe(rootPanel);

        // X버튼 클릭 시 패널 display:none
        function closeBtnClick() {
            scope.Element.CloseButton.addEventListener("click", function () {
                scope.Element.Panel.style.display = "none";
            });
        }

        //위치 보정
        function calcPanelPos()
        {
            //return;
            let view = rootPanel.getBoundingClientRect();
            let panel = scope.Element.Panel;

            // 현재위치
            let x = panel.offsetLeft;
            let y = panel.offsetTop;

            //Right
            if(x + panel.offsetWidth > view.width) {
                x  = view.width - panel.offsetWidth;
            }
            //Left
            if(x < 0) {
                x = 0;
            }

            //Bottom
            if( y + panel.offsetHeight  > view.height) {
                y = view.height - panel.offsetHeight;
            }
            //Top
            if(y < 0) {
                y = 0;
            }

            panel.style.left = x + "px";
            panel.style.top = y + "px";
        }
        // 패널 Move
        function movePanel() {
            
            scope.Element.Title.addEventListener("mousedown", panelMouseDown);
            
            function panelMouseDown(e) {

                if(scope.Element.Title.Child !== undefined)
                {
                    // if(e.path != undefined)
                    // for(let i = 0; i < e.path.length; i++)
                    // {
                    //     if(e.path[i] === scope.Element.Title.Child)                        
                    //         return;
                    // }
                    for(let i = 0; i < e.composedPath().length; i++)
                    {
                        if(e.composedPath()[i] === scope.Element.Title.Child)                        
                            return;
                    }
                }
                
                e = e || window.event;
                e.preventDefault(); 
               
               if(e.currentTarget !== scope.Element.Title)
                  return;
                   
                  scope.Element.Panel.classList.add("vizcore_draggable");        
                // mousemove, mouseup 이벤트 추가    
                let view = rootPanel.getBoundingClientRect();

                let prevX = e.offsetX;
                let prevY = e.offsetY;

                window.addEventListener("mousemove", panelMouseMove);
                window.addEventListener("mouseup", panelMouseUp);
              
                let prevPaneloffsetTop = scope.Element.Panel.offsetTop;
                let prevPaneloffsetLeft = scope.Element.Panel.offsetLeft;
                
               
                prevX = e.pageX - view.left;
                prevY = e.pageY - view.top;

                let panelMove = false;

                function panelMouseMove(e) {
                    view = rootPanel.getBoundingClientRect();

                    let panel = scope.Element.Panel;
                    
                    let x = e.pageX - view.left;
                    let y = e.pageY - view.top;

                    let moveX = x - prevX;
                    let moveY = y - prevY;
                    
                    let nextX = prevPaneloffsetLeft + moveX;
                    let nextY = prevPaneloffsetTop + moveY;

                    if(!panelMove && (moveX != 0 || moveY != 0))
                    {
                        rootPanel.append(scope.Element.Panel);
                        panelMove = true;
                    }
                    
                    //console.log(x + ", " + y);

                    //Right
                    if(nextX + panel.offsetWidth > view.width) {
                        nextX = view.width - panel.offsetWidth;
                        if(x + moveX > view.width)
                        {
                            x = view.width - 1;
                            prevX = x;
                        }
                    }
                    //Left
                    if(nextX < 0) {
                        nextX = 0;

                        if(x + moveX < 0)
                        {
                            x = 1;
                            prevX = x;
                        }
                    }

                    //Bottom
                    if(nextY + panel.offsetHeight > view.height) {
                        nextY = view.height - panel.offsetHeight;

                        if(y + moveY > view.height)
                        {
                            y = view.height - 1;
                            prevY = y;
                        }
                    }
                    //Top
                    if(nextY < 0) {
                        nextY = 0;
                        if(y + moveY < 0)
                        {
                            y = 1;
                            prevY = y;
                        }
                    }

                    panel.style.left = nextX + "px";
                    panel.style.top = nextY + "px";

                    prevPaneloffsetLeft = nextX;
                    prevPaneloffsetTop = nextY;

                    prevX = x;
                    prevY = y;
                };

                function panelMouseUp(e) {
                    window.removeEventListener("mousemove", panelMouseMove);
                    window.removeEventListener("mouseup", panelMouseUp);

                    scope.Element.Panel.classList.remove("vizcore_draggable");
                };

            }
        }

        // ----- Method

        /**
         * Panel 사이즈 조절 활성화
         * @param {Boolean} bool 활성화/비활성화
         * @example
         * let view = document.getElementById("view");
         * let panel = new vizwide3d.Panel(view);
         * panel.EnableResize(false);
         */
         this.EnableResize = function (bool) {
            if(bool){
                scope.Element.Panel.style.resize = 'both';
            } else {
                scope.Element.Panel.style.resize = 'none';
            }
        };

        /**
         * Panel 보이기/숨기기
         * @param {Boolean} visible 보이기/숨기기
         * @example
         * let view = document.getElementById("view");
         * let panel = new vizwide3d.Panel(view);
         * panel.Show();
         */
        this.Show = function (visible) {
            show(visible);
        };

        /**
        * Panel 보이기/숨기기 반환
        * @returns {Boolean} visible 보이기/숨기기
        * @example
        * let view = document.getElementById("view");
        * let panel = new vizwide3d.Panel(view);
        * let show = panel.GetShow();
        */
        this.GetShow = function () {
            if (scope.Element.Panel.style.display === "block")
                return true;
            else
                return false;
        };
        
        /**
        /**
         * Panel 크기 설정
         * @param {Number} width 넓이
         * @param {Number} height 높이
         * @example
         * let view = document.getElementById("view");
         * let panel = new vizwide3d.Panel(view);
         * panel.SetSize(200, 300);
         */
        this.SetSize = function (width, height) {
            scope.Element.Panel.style.width = width + "px";
            scope.Element.Panel.style.height = height + "px";
        };

        /**
         * Panel 배경 색상 설정
         * @param {Object} color { r : 255, g : 255, b : 255, a : 255}
         * @example
         * let view = document.getElementById("view");
         * let panel = new vizwide3d.Panel(view);
         * panel.SetBorderColor({ r : 255, g : 255, b : 255, a : 255});
         */
        this.SetBorderColor = function (color) {
            scope.Element.Panel.style.borderColor = "rgba(" + color.r + "," + color.g + "," + color.b + "," + color.a / 255  + ")";
        };

        /**
         * Panel 배경 색상 설정
         * @param {Number} R Red(0~255)
         * @param {Number} G Green(0~255)
         * @param {Number} B Blue(0~255)
         * @param {Number} A Alpha(0~255)
         * @example
         * let view = document.getElementById("view");
         * let panel = new vizwide3d.Panel(view);
         * panel.SetBorderColorFromRGBA(255, 255, 255, 255);
         */
        this.SetBorderColorFromRGBA = function (R, G, B, A) {
            if (R === undefined || G === undefined || B == undefined || A == undefined) {
                scope.Element.Panel.style.borderColor = "rgba(" + defaultColor.r + "," + defaultColor.g + "," + defaultColor.b + "," +  defaultColor.a  / 255 + ")";
            }
            else {
                scope.Element.Panel.style.borderColor = "rgba(" + R + "," + G + "," + B + "," +  A / 255  + ")";
            }
        };

        /**
         * Panel 위치 설정(Top)
         * @param {Number} offset Top Offset
         * @example
         * let view = document.getElementById("view");
         * let panel = new vizwide3d.Panel(view);
         * panel.SetLocationTop(10);
         */
        this.SetLocationTop = function (top) {
            scope.Element.Panel.style.top = top + "px";
            // console.log(scope.Element.Panel.getBoundingClientRect().width)
            let panel = scope.Element.Panel.getBoundingClientRect();
            let view = rootPanel.getBoundingClientRect();

            if(view.bottom - panel.bottom < 0){
                scope.Element.Panel.style.top = view.height - panel.height +"px";
            }
        };

        /**
         * Panel 위치 설정(Left)
         * @param {Number} offset Left Offset
         * @example
         * let view = document.getElementById("view");
         * let panel = new vizwide3d.Panel(view);
         * panel.SetLocationLeft(10);
         */
        this.SetLocationLeft = function (left) {
            scope.Element.Panel.style.left = left + "px";

            let panel = scope.Element.Panel.getBoundingClientRect();
            let view = rootPanel.getBoundingClientRect();

            if(view.right - panel.right < 0){
                scope.Element.Panel.style.left = view.width - panel.width +"px";
            }
        };

        this.SetLocationCenter = function(){
            let width = rootPanel.clientWidth;
            let panelWidth = scope.Element.Panel.clientWidth;
            // 중심점
            let leftPos = width / 2 - panelWidth / 2;
            scope.Element.Panel.style.left = leftPos + "px";
        };

        /**
         * Panel 크기 변경 이벤트
         * @param {Object} cbresize callback Function
         * @example
         * let cbresize = function(){
         *      console.log('resize');
         * };
         * panel.OnResizeEvent(cbresize);
         */
        this.OnResizeEvent = function(cbresize) {
            const ro = new ResizeObserver(entries => {
                cbresize();
            });
            ro.observe(scope.Element.Panel);
        };

        /**
         * Panel X 버튼 이벤트
         * @param {Object} cbclclick callback Function
         * @example
         * let cbclose = function(){
         *      console.log('close');
         * };
         * panel.OnCloseButtonEvent(cbclose);
         */
        this.OnCloseButtonEvent = function(cbclclick) {
            scope.Element.CloseButton.addEventListener("click", function () {
                cbclclick();
            }); 
        };

        /**
         * Panel Title 설정
         * @param {String} text Title
         * @example
         * let view = document.getElementById("view");
         * let panel = new vizwide3d.Panel(view);
         * panel.SetTitleText("Title");
         */
        this.SetTitleText = function (text) {
            scope.Element.Title.Text.textContent = text;
        };

        /**
         * Panel Title 색상 설정
         * @param {Object} color { r : 255, g : 255, b : 255, a : 255}
         * @example
         * let view = document.getElementById("view");
         * let panel = new vizwide3d.Panel(view);
         * panel.SetTitleTextColor({ r : 255, g : 255, b : 255, a : 255});
         */
        this.SetTitleTextColor = function (color) {
            scope.Element.Title.Text.style.color = "rgba(" + color.r + "," + color.g + "," + color.b + "," +  color.a / 255 + ")";
        };

        /**
         * Panel Title 색상 설정
         * @param {Number} R Red(0~255)
         * @param {Number} G Green(0~255)
         * @param {Number} B Blue(0~255)
         * @param {Number} A Alpha(0~255)
         * @example
         * let view = document.getElementById("view");
         * let panel = new vizwide3d.Panel(view);
         * panel.SetTitleTextColorFormRGBA(255,255,255,255);
         */
        this.SetTitleTextColorFormRGBA = function (R, G, B, A) {
            if (R === undefined || G === undefined || B == undefined || A == undefined) {
                scope.Element.Title.Text.style.color = "rgba(" + defaultColor.r + "," + defaultColor.g + "," + defaultColor.b + "," +  defaultColor.a  / 255 + ")";
            }
            else {
                scope.Element.Title.Text.style.color = "rgba(" + R + "," + G + "," + B + "," +  A / 255  + ")";
            }
        };

        /**
         * Panel Title 배경 색상 설정
         * @param {Object} color { r : 255, g : 255, b : 255, a : 255}
         * @example
         * let view = document.getElementById("view");
         * let panel = new vizwide3d.Panel(view);
         * panel.SetTitleBackgroundColor({ r : 255, g : 255, b : 255, a : 255});
         */
        this.SetTitleBackgroundColor = function (color) {
            scope.Element.Title.style.backgroundColor = "rgba(" + color.r + "," + color.g + "," + color.b + "," +  color.a / 255  + ")";
        };

        /**
         * Panel Title 색상 설정
         * @param {Number} R Red(0~255)
         * @param {Number} G Green(0~255)
         * @param {Number} B Blue(0~255)
         * @param {Number} A Alpha(0~255)
         * @example
         * let view = document.getElementById("view");
         * let panel = new vizwide3d.Panel(view);
         * panel.SetTitleBackgroundColorFormRGBA(255,255,255,255);
         */
        this.SetTitleBackgroundColorFormRGBA = function (R, G, B, A) {
            if (R === undefined || G === undefined || B == undefined || A == undefined) {
                scope.Element.Title.style.backgroundColor = "rgba(" + defaultColor.r + "," + defaultColor.g + "," + defaultColor.b + "," + defaultColor.a / 255  + ")";
            }
            else {
                scope.Element.Title.style.backgroundColor = "rgba(" + R + "," + G + "," + B + "," +  A / 255  + ")";
            }
        };

        /**
         * Panel Content 설정
         * @param {Object} element HTML Element
         * @example
         * let view = document.getElementById("view");
         * let element = document.createElement('input');
         * element.style.width = "150px";
         * element.style.height = "50px";
         * 
         * let panel = new vizwide3d.Panel(view);
         * panel.SetContent(element);
         */
        this.SetContent = function (element) {
            if (element !== undefined) {
                scope.Element.Content.appendChild(element);
            }
        };

        /**
         * Panel Header Content 설정
         * @param {Object} element HTML Element
         * @example
         * let view = document.getElementById("view");
         * let element = document.createElement('input');
         * element.style.width = "150px";
         * element.style.height = "50px";
         * 
         * let panel = new vizwide3d.Panel(view);
         * panel.SetHeaderContent(element);
         */
         this.SetHeaderContent = function (element) {
            if (element !== undefined) {
                scope.Element.Title.appendChild(element);
                scope.Element.Title.Child = element;
            }
        };

        /**
         * Panel Content 배경 색상 설정
         * @param {Object} color { r : 255, g : 255, b : 255, a : 255}
         * @example
         * panel.SetContentBackgroundColor({ r : 255, g : 255, b : 255, a : 255});
         */
        this.SetContentBackgroundColor = function (color) {
            scope.Element.Content.style.backgroundColor = "rgba(" + color.r + "," + color.g + "," + color.b + "," +  color.a / 255  + ")";;
        };

        /**
         * Panel Content 색상 설정
         * @param {Number} R Red(0~255)
         * @param {Number} G Green(0~255)
         * @param {Number} B Blue(0~255)
         * @param {Number} A Alpha(0~255)
         * @example
         * panel.SetContentBackgroundColorFormRGBA(255,255,255,255);
         */
        this.SetContentBackgroundColorFormRGBA = function (R, G, B, A) {
            if (R === undefined || G === undefined || B == undefined || A == undefined) {
                scope.Element.Content.style.backgroundColor = "rgba(" + defaultColor.r + "," + defaultColor.g + "," + defaultColor.b + "," + defaultColor.a / 255 + ")";
            }
            else {
                scope.Element.Content.style.backgroundColor = "rgba(" + R + "," + G + "," + B + "," +  A / 255 + ")";
            }
        };

        this.SetElementOverflow = function(enable){
            if(enable)
            {
                scope.Element.Panel.style.overflow = "auto";
                scope.Element.Content.style.overflow = "auto";
            }
            else{
                scope.Element.Panel.style.overflow = "hidden";
                scope.Element.Content.style.overflow = "hidden";
            }
            
        }

        let init = function (){
            makeDiv();
            closeBtnClick();
            movePanel();

            // Visible 설정
            show(true);
        };
        init();
    }
};

export default Panel;
