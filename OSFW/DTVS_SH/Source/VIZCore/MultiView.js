class MultiView {
    constructor(view, VIZCore) {
        let scope = this;

        this.eventEnabled = false;   //Event Enable
        this.Container = undefined;
        this.domElement = undefined;
        this.canvasElement = undefined;

        //Multi View 사용 여부 설정값
        let visible = false;

        this.Enable = false;

        let timeDraw = 0;

        let imgObj = undefined;
        let imageData = undefined;

        //현재 등록된 cameraIndex
        this.CameraIndex = 0;

        //생성시 고정할 ID
        this.CameraID = 0;

        //기본 화면 색상사용 여부        
        this.UseDefaultViewColor = true;
        this.MultiViewBGColor = new VIZCore.Color(255, 255, 255, 255);  //bgColor
        
        //화면 갱신 상태
        this.UpdateFramebuffer = true;

        let canv = undefined;
        let context = undefined;
        let context_snapshot = undefined;

        //해당 뷰에서 볼수 있는 개체 정보
        this.ViewEntityInfo = {
            //화면 신규 갱신 여부 설정
            isFramebufferClear : true,

            // 3D 개체 가시화 설정
            ShowObject : true,
            // 리뷰 가시화 설정
            ShowReview : true,
            // View Cube 가시화 설정
            ShowViewCube : true,
            // 좌표축 가시화 설정
            ShowCoordinateAxis : true,

            // 컨트롤 동작 여부 
            UseControlState: {
                //회전
                Rotate : true,
                //이동
                Pan : true,
                //확대 및 축소
                Zoom : true,
                
                //Touch 회전
                Touch_Rotate : true,
                //Touch 이동, 확대 및 축소
                Touch_ZoomPan : true,
            },
            // 그리기 반영 시간
            DelayTime : 0,
        };

        //view.Data.Objects 에 해당하는 목록
        this.ObjectRenderEnable = [];
       

        //정의된 개체를 그리기 (true : 정의된 개체 그리기, false : 메인과 동일한 개체 그리기)
        this.UseisolateView = false;
        this.ObjectIDs = [];  //정의된 개체
        this.ObjectIDsMap = new Map();

        // 그리기 시간 초기화
        function clearDrawTime(){
            timeDraw = 0;
        }

        this.Init = function (cameraIdx, cameraID, ViewElement) {
            scope.domElement = ViewElement;
            scope.canvasElement = ViewElement.getContext("2d");

            scope.CameraIndex = cameraIdx;
            scope.CameraID = cameraID;

            //마우스 Event 강제 추가
            scope.eventEnabled = false;

            let gl = undefined;
            if (view.useWebGL2) {
                //alpha를 끄지 않으면 투명도 처리시 color *= alpha 로 표현되는 현상이 있음
                gl = ViewElement.getContext("webgl2", { alpha: false }); //webgl2.0
            }

            if (!gl) {
                ViewElement.getContext("webgl", { alpha: false });
            }
        };

        this.Release = function(){
            eventLock();
        };

        /**
       * 컨트롤 이벤트 잠금
       */
        function eventLock() {
            if (!scope.eventEnabled)
                return;
            scope.eventEnabled = false;

            scope.domElement.removeEventListener('contextmenu', contextmenu,  false);
            scope.domElement.removeEventListener('mousedown', mousedown, false);
            scope.domElement.removeEventListener('mousewheel', mousewheel, false);
            scope.domElement.removeEventListener('DOMMouseScroll', mousewheel, false); // firefox
            scope.domElement.removeEventListener("dblclick", dbclick, false);

            scope.domElement.removeEventListener('touchstart', touchstart, false);
            scope.domElement.removeEventListener('touchend', touchend, false);
            scope.domElement.removeEventListener('touchmove', touchmove, false);

            scope.domElement.removeEventListener('mousemove', mousemove, false);
            scope.domElement.removeEventListener('mouseup', mouseup, false);

            scope.domElement.removeEventListener('mouseover', mouseover, false);
            scope.domElement.removeEventListener('mouseout', mouseout, false);
            scope.domElement.removeEventListener('mouseenter', mouseenter, false);

            window.removeEventListener('keyup', keyup, false);
            window.removeEventListener('keypress', keypress, false);
        }

        /**
        * 컨트롤 이벤트 잠금해제
        */
        function eventUnlock() {
            if (scope.eventEnabled)
                return;
            scope.eventEnabled = true;

            // modeList 생성 완료
            scope.domElement.addEventListener('contextmenu', contextmenu, false);
            scope.domElement.addEventListener('mousedown', mousedown, false);
            scope.domElement.addEventListener('mousewheel', mousewheel, false);
            scope.domElement.addEventListener('DOMMouseScroll', mousewheel, false); // firefox
            scope.domElement.addEventListener("dblclick", dbclick, false);

            scope.domElement.addEventListener('touchstart', touchstart, false);
            scope.domElement.addEventListener('touchend', touchend, false);
            scope.domElement.addEventListener('touchmove', touchmove, false);

            scope.domElement.addEventListener('mousemove', mousemove, false);
            scope.domElement.addEventListener('mouseup', mouseup, false);

            scope.domElement.addEventListener('mouseover', mouseover, false);
            scope.domElement.addEventListener('mouseout', mouseout, false);
            scope.domElement.addEventListener('mouseenter', mouseenter, false);

            //window.addEventListener('keydown', keydown, false);
            window.addEventListener('keyup', keyup, false);
            window.addEventListener('keypress', keypress, false);
        }

        function mouseenter(event)
        {
            if (scope.eventEnabled === false) return;

            //view.Control.MouseEnter(event);
            
        }
        
        function mouseout(event) {
            if (scope.eventEnabled === false) return;

            view.Control.MouseOut(event);
        }

        function mouseover(event) {            
            if (scope.eventEnabled === false) return;

            view.Control.MouseOver(event);
        }

        function mousedown(event) {            
            if (scope.eventEnabled === false) return;

            clearDrawTime();

            // view 포커스 설정
            if(document.activeElement !== undefined)
                document.activeElement.blur();
            view.Container.focus();

            view.Mode.Camera(scope.CameraIndex);
            view.Control.MouseDown(event);
            view.Mode.Camera(0);

        }

        function mousemove(event) {
            if (scope.eventEnabled === false) return;

            clearDrawTime();

            view.Mode.Camera(scope.CameraIndex);
            view.Control.MouseMove(event);
            view.Mode.Camera(0);
        }

        function mouseup(event) {
            if (scope.eventEnabled === false) return;


            clearDrawTime();

            view.Mode.Camera(scope.CameraIndex);

            view.Control.MouseUp(event);
            view.Mode.Camera(0);
        }

        function mousewheel(event) {
            if (scope.eventEnabled === false) return;

            clearDrawTime();

            view.Mode.Camera(scope.CameraIndex);
            view.Control.MouseWheel(event);
            view.Mode.Camera(0);
        }

        function dbclick(event) {
            if (scope.eventEnabled === false) return;

            clearDrawTime();

            view.Mode.Camera(scope.CameraIndex);
            view.Control.DoubleClick(event);
            view.Mode.Camera(0);
        }

        function touchstart(event) {
            if (scope.eventEnabled === false) return;

            clearDrawTime();

            view.Mode.Camera(scope.CameraIndex);
            view.Control.TouchStart(event);
            view.Mode.Camera(0);
        }

        function touchmove(event) {
            if (scope.eventEnabled === false) return;
            
            view.Mode.Camera(scope.CameraIndex);
            view.Control.TouchMove(event);
            view.Mode.Camera(0);
        }

        function touchend(event) {
            if (scope.eventEnabled === false) return;

            clearDrawTime();

            view.Mode.Camera(scope.CameraIndex);
            view.Control.TouchEnd(event);
            view.Mode.Camera(0);
        }

        function keydown(event) {
            if (scope.eventEnabled === false) return;

            view.Mode.Camera(scope.CameraIndex);
            view.Control.Keypress(event);
            view.Mode.Camera(0);
            
            // view.Mode.Camera(scope.CameraIndex);
            // view.Control.Keydown(event);
            // view.Mode.Camera(0);
        }

        function keypress(event) {
            if (scope.eventEnabled === false) return;

            view.Mode.Camera(scope.CameraIndex);
            view.Control.Keypress(event);
            view.Mode.Camera(0);
        }

        function keyup(event) {
            if (scope.eventEnabled === false) return;

            //console.log("MultiView KeyUp::", event);
            view.Mode.Camera(scope.CameraIndex);
            view.Control.Keyup(event);
            view.Mode.Camera(0);
        }

        function draw() {
            let canvas_snapshot = scope.domElement;
            
            let canvas_review = view.Canvas_Review;

            let isNew = false;
            if(timeDraw === 0){
                timeDraw = new Date().getTime();
                imgObj = view.Renderer.GetImageDataFromBuffer(VIZCore.Enum.FB_RENDER_TYPES.END);
                isNew = true;
                scope.Enable = true;
            }
            else{
                let ct = new Date().getTime();
                let ts = ct - timeDraw;
                if(ts > scope.ViewEntityInfo.DelayTime){
                    timeDraw = 0;
                    imgObj = view.Renderer.GetImageDataFromBuffer(VIZCore.Enum.FB_RENDER_TYPES.END);
                    isNew = true;
                    scope.Enable = true;
                }
                else{
                    scope.Enable = false;
                }
                
            }

            //view.CameraIndex = 1; 
            //imgObj = view.Renderer.GetImageDataFromBuffer(VIZCore.Enum.FB_RENDER_TYPES.END);
            //let imgObj = view.Renderer.GetImageDataFromBuffer(VIZCore.Enum.FB_RENDER_TYPES.MAIN);
            //let imgAfter = view.Renderer.GetImageDataFromBuffer(VIZCore.Enum.FB_RENDER_TYPES.AFTEREFFECT);
            
            if(false)
            {
                let canv = document.createElement('canvas');
                canv.id = view.Container.id + 'canvasbuffer'; // gives canvas id
                canv.width = imgObj.width;
                canv.height = imgObj.height;
                let context = canv.getContext('2d');
                context.imageSmoothingEnabled = false;
                //context.imageSmoothingQuality = 'high';
                //let widthBase = 2048;
                //let heightBase = 2048;
                let widthBase = canv.width;
                let heightBase = canv.height;
                canvas_snapshot.width = widthBase;
                canvas_snapshot.height = heightBase;
                let context_snapshot = canvas_snapshot.getContext('2d');
                //let canvas_review = document.getElementById("viewcanvas_review");
                

                context_snapshot.clearRect(0, 0, canvas_snapshot.width, canvas_snapshot.height);

                let imageData = context.createImageData(imgObj.width, imgObj.height);
                imageData.data.set(imgObj.data);
                context.putImageData(imageData, 0, 0);

                // scale
                let scale = Math.min(canvas_snapshot.width / imgObj.width, canvas_snapshot.height / imgObj.height);
                // get the top left position of the image
                let x = (canvas_snapshot.width / 2) - (imgObj.width / 2) * scale;
                let y = (canvas_snapshot.height / 2) - (imgObj.height / 2) * scale;
                let width = imgObj.width * scale;
                let height = imgObj.height * scale;
                context_snapshot.imageSmoothingEnabled = false;
                //context_snapshot.imageSmoothingQuality = 'high';
                context_snapshot.drawImage(canv, x, y, imgObj.width * scale, imgObj.height * scale);
                context_snapshot.drawImage(canvas_review, x, y, canvas_review.width * scale, canvas_review.height * scale);    
            }
            if(canv === undefined)
            {
                canv = document.createElement('canvas');
                canv.id = view.Container.id + 'canvasbuffer'; // gives canvas id
            }
            canv.width = imgObj.width;
            canv.height = imgObj.height;
            if(context === undefined)
            {
                context = canv.getContext('2d');
                context.imageSmoothingEnabled = false;
            }
            //context.imageSmoothingQuality = 'high';
            //let widthBase = 2048;
            //let heightBase = 2048;
            let widthBase = canv.width;
            let heightBase = canv.height;
            canvas_snapshot.width = widthBase;
            canvas_snapshot.height = heightBase;
            if(context_snapshot === undefined)
            {
                context_snapshot = canvas_snapshot.getContext('2d');
            }
            context_snapshot.clearRect(0, 0, canvas_snapshot.width, canvas_snapshot.height);

            if(isNew)
            {
                imageData = context.createImageData(imgObj.width, imgObj.height);
                imageData.data.set(imgObj.data);
            }
            
            context.putImageData(imageData, 0, 0);

            

            // scale
            let scale = Math.min(canvas_snapshot.width / imgObj.width, canvas_snapshot.height / imgObj.height);
            // get the top left position of the image
            let x = (canvas_snapshot.width / 2) - (imgObj.width / 2) * scale;
            let y = (canvas_snapshot.height / 2) - (imgObj.height / 2) * scale;
            let width = imgObj.width * scale;
            let height = imgObj.height * scale;
            context_snapshot.imageSmoothingEnabled = false;
            context_snapshot.drawImage(canv, x, y, imgObj.width * scale, imgObj.height * scale);
            context_snapshot.drawImage(canvas_review, x, y, canvas_review.width * scale, canvas_review.height * scale);    
        }

        function contextmenu(event){
            if (scope.enabled === false) return;

            if(view.Configuration.ContextMenu.Use === false) {
                event.preventDefault();
                return;
            }
            
            view.Mode.Camera(scope.CameraIndex);
            view.Control.Contextmenu(event);
            view.Mode.Camera(0);
        }
        
         /**
        * 컨트롤 잠금
        */
        this.Lock = function () {
            eventLock();
        };

        /**
        * 컨트롤 잠금해제
        */
        this.Unlock = function () {
            eventUnlock();
        };

        /**
         * MultiView 가시화 여부 반환
         * @returns 
         */
        this.Visible = function () {
            return visible;
        };

        /**
         * MultiView 가시화 설정
         * @param {boolean} show 
         */
        this.Show = function (show) {
            visible = show;

            if(visible)
            {
                eventUnlock();
            }
            else
                eventLock();

            if(scope.Container !== undefined)
            {
                if (show === true) {
                    scope.Container.style.display = 'block';
                }
                else {
                    scope.Container.style.display = 'none';
                }
            }

            if(visible)
            {
                if(view.Camera.CameraIndex !== scope.CameraIndex)
                {
                    let backupCameraIndex = view.Camera.CameraIndex;
                    view.Mode.Camera(scope.CameraIndex);

                    
                    view.Camera.clientWidth = scope.domElement.clientWidth;
                    view.Camera.clientHeight = scope.domElement.clientHeight;
                    view.Camera.ResizeGLWindow();
                    
                    view.Shader.Resize(true);
                    scope.ClearDrawTime();
                    //scope.Draw();
                    view.Renderer.Render();
                    view.Mode.Camera(backupCameraIndex);
                }
                else
                {
                    scope.ClearDrawTime();
                    scope.Draw();
                }
                    
            }
            
        };

        this.Draw = function () {
            if (visible)
            {
                if(view.Camera.CameraIndex === scope.CameraIndex)
                {
                    view.Grid.Render(view.gl, view.ctx_review, true);
                    draw();
                }
                if (view.useMiniView)
                    view.MiniView.Render();
            }
                
        };

        /**
         * 그리기 시간 초기화
         */
        this.ClearDrawTime = function(){
            clearDrawTime();
        };


        /**
         * ISOlateView 설정
         * @param {Boolean} bEnable : 사용 설정
         * @param {Array<Number>} ids : BodyIDs
         */
        this.SetISOlateView = function(bEnable, ids) {            
            scope.UseisolateView = bEnable;            

            if(bEnable) {
                scope.ObjectIDsMap.clear();
                scope.ObjectIDs = ids;
                scope.Enable = true;    //처음 Isolate View Load 안되는 이슈
                ids.forEach(element => {
                    scope.ObjectIDsMap.set(element, element);
                });
            }
            else{
                scope.ObjectIDs = [];
                scope.ObjectIDsMap.clear();
            }

            view.RenderWGL.listMultiviewObjectManager.splice(0, view.RenderWGL.listMultiviewObjectManager.length); //제거
            view.RenderWGL.listMultiviewObjectManager.push([0]); //메인뷰 추가

            //전체 개체에 대해 다시 업데이트 필요
            for(let i = 0 ; i < view.Data.Objects.length ; i++) {

                let object = view.Data.Objects[i];
                for(let j = 0 ; j < object.tag.length ; j++) {
                    let body = object.tag[j];
                    
                    //그려야하는 multi View index
                    let multiviewIdx = 0;

                    //multiview에서 그려야하는 개체 objectPipe Line action 분리
                    //main에서 숨겨진 개체는 multiview에서도 동일하게 숨김처리                                        

                    let findisoView = false;
                    let addMultiViewManagerIdx = -1;
                    let currentisovList = [ 0 ];
                    //0은 메인뷰
                    for(let mview = 1 ; mview < view.MultiView.length ; mview++) {
                        if(!view.MultiView[mview].Visible()) continue;  //멀티뷰 사용중이 아닌경우 제외
                        if(!view.MultiView[mview].UseisolateView) continue; //멀티뷰 isolate view 가 아닌 경우 제외

                        
                        // //해당 하는 view 그리기 존재여부 확인
                        // for(let mvo = 0 ; mvo < view.MultiView[mview].ObjectIDs.length ; mvo++) {
                        //     const isovObject = view.MultiView[mview].ObjectIDs.find(e => e === body.bodyId );
                        //     //const isovObject = view.MultiView[mview].ObjectIDs[body.bodyId];
                        //     if(isovObject === undefined) continue;

                        //     const currentView = currentisovList.findIndex(e => e === mview );
                        //     //const currentView = currentisovList[mview];
                        //     if(currentView >= 0) continue;
                        //     currentisovList.push(mview);
                        //     findisoView = true;
                        // }

                        let isovObject = view.MultiView[mview].ObjectIDsMap.get(body.bodyId);
                        if(isovObject === undefined) continue;
                        const currentView = currentisovList.findIndex(e => e === mview );
                        //const currentView = currentisovList[mview];
                        if(currentView >= 0) continue;
                        currentisovList.push(mview);
                        findisoView = true;
                    }
                    
                    //현재 등록된 MultiViewObjectManager 확인
                    if(findisoView) {
                        currentisovList.sort();

                        for(let mm = 0 ; mm < view.RenderWGL.listMultiviewObjectManager.length ; mm++)
                        {
                            let listViewidx =  view.RenderWGL.listMultiviewObjectManager[mm];

                            // 현재 등록된 multiview Idx여부 확인
                            if(listViewidx.length !== currentisovList.length) continue;

                            let equalNum = 0;
                            for(let nn = 0 ; nn < currentisovList.length ; nn++) {
                                let equalView = listViewidx.findIndex(e => e === currentisovList[nn]);
                                //let equalView = listViewidx[currentisovList[nn]];
                                if(equalView >= 0) continue;

                                equalNum++;
                            }

                            if(equalNum !== currentisovList.length) continue;

                            //등록된 View Index
                            addMultiViewManagerIdx = mm;
                            break;
                        }

                        //신규 multiView idx 등록
                        if(addMultiViewManagerIdx < 0) {
                            view.RenderWGL.listMultiviewObjectManager.push(currentisovList);
                            multiviewIdx =  view.RenderWGL.listMultiviewObjectManager.length - 1;
                        }
                        else
                        {
                            //기존 번호
                            multiviewIdx = addMultiViewManagerIdx;
                        }
                    }

                    //새로 등록
                    let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);
                    action.multiViewIdx = multiviewIdx;
                }
                object.flag.updateProcess = true;

            }

            view.ViewRefresh();
        };

        /**
         * 사용자 정의 배경색
         * @param {Boolean} bEnable : 사용여부 설정
         * @param {VIZCore.Color} color  : 색상
         */
        this.SetBGColor = function (bEnable, color) {
            scope.UseDefaultViewColor = !bEnable;
            scope.MultiViewBGColor = color;  //bgColor
        };

        /**
         * 마우스 컨트롤 동작 상태 가능 여부 확인
         * @param {VIZCore.Enum.MOUSE_STATE} state 
         */
        this.IsUseControlState = function (state) {
            
            switch(state) {
                case VIZCore.Enum.MOUSE_STATE.ROTATE: 
                    return scope.ViewEntityInfo.UseControlState.Rotate;
                case VIZCore.Enum.MOUSE_STATE.ZOOM:
                    return scope.ViewEntityInfo.UseControlState.Zoom;
                case VIZCore.Enum.MOUSE_STATE.PAN:
                    return scope.ViewEntityInfo.UseControlState.Pan;

                case VIZCore.Enum.MOUSE_STATE.TOUCH_ROTATE:
                    return scope.ViewEntityInfo.UseControlState.Touch_Rotate;
                case VIZCore.Enum.MOUSE_STATE.TOUCH_ZOOM_PAN:
                    return scope.ViewEntityInfo.UseControlState.Touch_ZoomPan;                
            }

            return true;
        };

        /**
         * 그려진 상태 등록
         */
        this.BeginUpdateFramebuffer = function () {
            scope.UpdateFramebuffer = true;
            
            // 그리기 개체 목록 초기화
            scope.ObjectRenderEnable = [];
            for(let i = 0, len = view.Data.ObjectsUpdateLength ; i < len ; i++) {
                scope.ObjectRenderEnable[i] = true;
            }
        };

        
        /**
         * 그려진 상태 완료
         */
        this.EndUpdateFramebuffer = function () {
            scope.UpdateFramebuffer = false;

            for(let i = 0, len = scope.ObjectRenderEnable.length ; i < len ; i++) {
                if (view.Data.Objects[i].attribs.a_index.buffer === null) continue;

                scope.ObjectRenderEnable[i] = false;
            }
        };
        
         

    }
}
export default MultiView;