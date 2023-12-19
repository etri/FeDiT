//import $ from 'jquery';

class MiniView {
    constructor(view, VIZCore) {
        let scope = this;
        this.ctx_miniview = undefined;
        this.canvas_miniview = undefined;
        this.div_miniview = undefined;
        this.viewFactor = 1;
        this.img_miniview = undefined;
        this.CameraIndex = -1;
        //this.Visible = true;
        let mouseDownState = false; // 마우스 이벤트 관리

        this.resize = true; // 화면 크기 변경 관리
        this.Option = {
            Visible : false
        };
        this.Element = {
            Panel : undefined,
        };

        let refreshTimer = undefined;

        let cbClose = undefined;

        // 초기화
        let initMiniView = ()=>{
            setTimeout(() => {
                let div_miniview = document.createElement('div');
                div_miniview.id = "VIZCore_MiniView";
                div_miniview.className = "div_miniview_container";

                let canvas = document.createElement('canvas');
                canvas.id = "canvas_miniview";
                canvas.className = "canvas_miniview";
                // canvas.style.width = 100;
                // canvas.style.height = 100;
                div_miniview.appendChild(canvas);
                div_miniview.addEventListener('click', click, false);
                scope.ctx_miniview = canvas.getContext("2d");
                scope.canvas_miniview = canvas;
                scope.div_miniview = div_miniview;
                

                let panel = new view.Interface.Panel(view.Container);
                panel.SetContent(div_miniview);
            
                //panel.SetBorderColorFromRGBA(255, 255, 255, 255);
                panel.SetContentBackgroundColor(new VIZCore.Color(240, 240, 240, 255));
                panel.SetTitleText("Minimap");
                let width = view.Container.clientWidth;
                let height = view.Container.clientHeight;

                let size = width / 4; //400
                let rw = width / size;
                //let rh = height / size;
                let ratioH = width / height;

                panel.SetLocationLeft(width - size - 50);
                panel.SetSize(size, size / ratioH);
                let rect = panel.Element.Panel.getBoundingClientRect();
                panel.SetLocationTop(height - rect.height - 150);
                //panel.Show(true);
                function PanelClose() {
                    if(cbClose !== undefined)
                        cbClose();
                };
                panel.OnCloseButtonEvent(PanelClose);
                let resize = ()=>{
                    //getImage();
                    scope.Resize();
                };
                panel.OnResizeEvent(resize);
                scope.Element.Panel = panel;

                // MultiView
                let cameraId = view.Mode.AddCamera(scope.canvas_miniview);
                
                let idx = view.Mode.GetCameraIndex(cameraId);
                if(idx < 0) return;

                scope.CameraIndex = idx;

                
                //view.MultiView[idx].ViewEntityInfo.isFramebufferClear = false;

                view.MultiView[idx].ViewEntityInfo.ShowReview = false;
                view.MultiView[idx].ViewEntityInfo.ShowViewCube = false;
                view.MultiView[idx].ViewEntityInfo.UseControlState.Rotate = false;
                view.MultiView[idx].ViewEntityInfo.UseControlState.Touch_Rotate = false;
                view.MultiView[idx].ViewEntityInfo.DelayTime = 3000;

                view.Mode.Camera(scope.CameraIndex);
                view.Camera.SetPerspectiveView(false);
                view.Camera.FitAll();
                view.Mode.Camera(0);
                view.MultiView[idx].Show(false);
                panel.Show(false);
            }, 100);
        }
        
        this.Init = function () {
            if (!view.useMiniView)
                return;

            initMiniView();
        };

        function click(event){
            // 카메라 위치 이동

            // 현재 스크린 위치 확인
            console.log("Click : " , event);

            let backupCameraIndex = view.Camera.CameraIndex;
            view.Mode.Camera(scope.CameraIndex);
            let matMVP = new VIZCore.Matrix4().copy(view.Camera.matMVP);
            let screen = new VIZCore.Vector3(event.offsetX, event.offsetY, 0);
            
            let posWorld =  view.Camera.screen2WorldWithMatrix(matMVP, screen);
            let bbox = view.Data.GetBBox();
            posWorld.z = bbox.center.z;
            // 주 카메라 포지션 변경
            view.Mode.Camera(0);
            view.Camera.FocusPivot(posWorld);
            
            view.Mode.Camera(backupCameraIndex);
        };

        function screenPosToMiniViewPos(screen) {
            let tw = scope.canvas_miniview.width;
            let th = scope.canvas_miniview.height;

            // sw : tw = screen.x : ?
            let x = screen.x;
            let y = screen.y;

            //y = th - y;
            let offset = 10;

            // 좌표 보정
            if (x > tw - offset)
                x = tw - offset;
            if (y > th - offset)
                y = th - offset;

            if (x < offset)
                x = offset;
            if (y < offset)
                y = offset;

            return new VIZCore.Vector2(x, y);
        }

        function getMainViewDir(){
            let backupCameraIndex = view.Camera.CameraIndex;
            view.Mode.Camera(0);
            let viewDir = view.Camera.GetViewDirection();
            view.Mode.Camera(backupCameraIndex);
            return viewDir;
        };


        function getMainCameraViewMatrix(){
            let backupCameraIndex = view.Camera.CameraIndex;
            view.Mode.Camera(0);
            let matMV = new VIZCore.Matrix4().copy(view.Camera.matMV);
            view.Mode.Camera(backupCameraIndex);
            return matMV;
        };

        function getMainViewMatrix(){
            let backupCameraIndex = view.Camera.CameraIndex;
            view.Mode.Camera(0);
            let matMVP = new VIZCore.Matrix4().copy(view.Camera.matMVP);
            view.Mode.Camera(backupCameraIndex);
            return matMVP;
        };

        function getMainPivotPos(){
            let backupCameraIndex = view.Camera.CameraIndex;
            view.Mode.Camera(0);
            let posCamera = undefined;
            posCamera = new VIZCore.Vector3().copy(view.Camera.pivot);
            view.Mode.Camera(backupCameraIndex);
            return posCamera;
        };

        function getMainCameraPos(){
            let backupCameraIndex = view.Camera.CameraIndex;
            view.Mode.Camera(0);
            //let posCamera = view.Camera.GetCameraPos();
            let posCamera = undefined;
            if(view.Camera.perspectiveView)
                posCamera = view.Camera.GetPerspectiveEyePos(); //원근
            else
            {
                posCamera = view.Camera.GetCameraPos(); //평행
                // let ratio = view.Camera.cameraZoom;
                // posCamera.multiplyScalar(ratio);
            }
                
            
            view.Mode.Camera(backupCameraIndex);
            return posCamera;
        };

        let bInit = false;
        let image = undefined;
        

        this.Render = function () {
            // Camera, Pivot 위치 정보 그리기
            let drawItem = (ctx) => {
                let matMVP = new VIZCore.Matrix4().copy(view.Camera.matMVP);
                // 주 카메라의 위치 반환
                let posCamera = getMainCameraPos(); //world
                let posCameraTmp = new VIZCore.Vector3().copy(posCamera);
                // let strCamera = "X : " + posCamera.x.toFixed(0) + " " + "Y : " + posCamera.y.toFixed(0) + " " + "Z : " + posCamera.z.toFixed(0);
                // ctx.fillStyle = "rgba(0, 0, 0, 200)"; //채울 색상
                // ctx.fillText(strCamera, 100, 100);
                let screenCamera = view.Camera.world2ScreenWithMatrix(matMVP, posCamera);
                let bbox = view.Data.GetBBox();
                let screen = new VIZCore.Vector3(scope.canvas_miniview.clientWidth/2, scope.canvas_miniview.clientHeight/2, bbox.center.z);
                // screen * main MVP > World
                // World * mini MVP > Screen 
                // Screen * mini MVP Inv > World
                // let posTmp = view.Camera.screen2WorldWithMatrix(view.Camera.matMVP, screen);
                // posTmp.z = posCamera.z;
                

                let pos = screenPosToMiniViewPos(screenCamera);
                ctx.shadowColor = "rgba(0,0,0,1)";
                ctx.shadowBlur = 1;
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 1;
                
                let fontsize = 9;
                ctx.font = fontsize + "pt " + "arial";
                ctx.fillStyle = "rgba(0, 0, 0, 200)"; //채울 색상
                //let string = "X : " + posCameraTmp.x.toFixed(0) + " " + "Y : " + posCameraTmp.y.toFixed(0) + " " + "Z : " + posCameraTmp.z.toFixed(0);
                //ctx.fillText(string, 20, 20);
                let x = 20;
                let y = 20;
                let string = undefined;
                ctx.fillStyle = "rgba(255, 0, 0, 1)"; //채울 색상
                string = "X : ";
                ctx.fillText(string, x, y);
                string = posCameraTmp.x.toFixed(0);
                ctx.fillText(string, x + 15, y);

                ctx.fillStyle = "rgba(0, 255, 0, 1)"; //채울 색상
                string = "Y : ";
                ctx.fillText(string, x, y + 15);
                string = posCameraTmp.y.toFixed(0);
                ctx.fillText(string, x + 15, y + 15);

                ctx.fillStyle = "rgba(100, 100, 255, 1)"; //채울 색상
                ctx.strokeStyle = "rgba(100, 100, 255, 1)"; //채울 색상
                string = "Z : ";
                ctx.fillText(string, x, y + 30);
                string = posCameraTmp.z.toFixed(0);
                ctx.fillText(string, x + 15, y + 30);
                

                

                ctx.shadowColor = "rgba(0,0,0,0.5)";
                ctx.shadowBlur = 3;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;

                //let viewDir = view.Camera.GetViewDirection();

                let viewDir = getMainViewDir();

                let fovSize = 65;
                let vCross = new VIZCore.Vector3(0, 0, 1);
                vCross.cross(viewDir);
                vCross.normalize();
    
                let xFOV = pos.x + vCross.x * fovSize;
                let yFOV = pos.y + vCross.y * fovSize;
    
                let v2FOV = new VIZCore.Vector2(xFOV, yFOV);
    
                function getAngle(x1, y1, x2, y2) {
                    let rad = Math.atan2(y2 - y1, x2 - x1);
                    return (rad * 180) / Math.PI;
                }
                let angle = getAngle(pos.x, pos.y, v2FOV.x, v2FOV.y);
    
    
                ctx.strokeStyle = "rgba(0, 255, 0, 1)"; //채울 색상
                //ctx.beginPath();
                //ctx.moveTo(pos.x, pos.y);
                //ctx.lineTo(xFOV + viewDir.x * fovSize / 2.0, yFOV + viewDir.y * fovSize / 2.0);
                //ctx.moveTo(pos.x, pos.y);
                //ctx.lineTo(xFOV - viewDir.x * fovSize / 2.0, yFOV - viewDir.y * fovSize / 2.0);
                //ctx.stroke();
                //ctx.closePath();
                // Camera View 방향
                ctx.beginPath();
                ctx.strokeStyle = "rgba(255, 0, 0, 1)"; //채울 색상
                ctx.moveTo(pos.x, pos.y);
                //ctx.lineTo(xFOV, yFOV); // 방향 지시선
                {
    
                    let viewPos = new VIZCore.Vector3().addVectors(new VIZCore.Vector3().copy(posCamera), new VIZCore.Vector3().copy(viewDir).multiplyScalar(100));
                    let screenViewPos = view.Renderer.Util.GetScreenPositionByMatrix(matMVP, viewPos);
                    angle = getAngle(screenCamera.x, screenCamera.y, screenViewPos.x, screenViewPos.y);
                }
                ctx.stroke();
                
                if (true) {
                    ctx.fillStyle = "rgba(255, 255, 255, 1)"; //채울 색상
    
                    //원 그리기~
                    ctx.beginPath();
                    //ctx.arc(100, 100, 50, 0, (Math.PI / 180) * 360, false);
                    //ctx.arc(x,y, 반지름, 시작각도, 종료각도, 그리는 방향);
                    //그리는 방향 : true 이면 시계 반대방향 / false 이면 시계 방향
                    //ctx.fillStyle = "rgba(220, 220, 220, 255)"; //채울 색상
                    //ctx.fillStyle = "rgba(180, 180, 180, 100)"; //채울 색상
                    //ctx.fillStyle = "rgba(255, 255, 255, 80)"; //채울 색상
                    ctx.fillStyle = "rgba(0, 255, 0, 1)"; //채울 색상
                    ctx.fill(); //채우기
    
                    //원호 그리기
                    ctx.globalAlpha = 0.1;

                    let angleOfView = 70 / 2;
    
                    // 반투명한 원을 그린다
                    for (let i = 0; i < 7; i++) {
                        ctx.beginPath();
                        ctx.moveTo(pos.x, pos.y);
                        ctx.arc(pos.x, pos.y, 10 + 4 * i, (Math.PI / 180) * (angle - angleOfView), (Math.PI / 180) * (angle + angleOfView), false);
                        ctx.fill();
                    }
    
                    //ctx.arc(50, 50, 50, (Math.PI / 180) * -30, (Math.PI / 180) * 30, false); // 0도 우 기준
                    ctx.closePath();
                    ctx.fill(); //채우기
                }
    
                // 카메라 시야 그리기
                ctx.fillStyle = "rgba(0, 255, 0, 1)";
                ctx.globalAlpha = 1.0;
                //ctx.globalAlpha = 0.8;
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    ctx.arc(pos.x, pos.y, i, 0, Math.PI * 2);
                }
                ctx.fill();
                ctx.globalAlpha = 1.0;
                // 월드 좌표 원점 그리기
                //let screenZero = view.Renderer.Util.GetScreenPositionByMatrix(matMVP, new VIZCore.Vector3());
                //let posZero = screenPosToMiniViewPos(screenZero);
                //ctx.fillStyle = "rgba(255, 0, 0, 0.9)";
                //ctx.beginPath();
                //ctx.arc(posZero.x, posZero.y, 5, 0, Math.PI * 2);
                //ctx.fill();
                // Pivot 좌표 원점 그리기
                //let screenPivot = view.Renderer.Util.GetScreenPositionByMatrix(matMVP, view.Camera.pivot);

                let posMainPivot = getMainPivotPos();
                let screenPivot = view.Camera.world2ScreenWithMatrix(matMVP, posMainPivot);
                let posPivot = screenPosToMiniViewPos(screenPivot);
                ctx.fillStyle = "rgba(255, 0, 0, 0.9)";
                ctx.beginPath();
                ctx.arc(posPivot.x, posPivot.y, 5, 0, Math.PI * 2);
                ctx.fill();
                //ctx.fillStyle = "rgba(0, 0, 255, 0.9)";
                //ctx.globalAlpha = 1.0;
                //ctx.beginPath();
                //ctx.arc(v2FOV.x, v2FOV.y, 5, 0, Math.PI * 2);
                //ctx.fill();

                ctx.shadowColor = "rgba(0,0,0,0)";
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            };
            


           
            if(view.Camera.CameraIndex === scope.CameraIndex)
                drawItem(scope.ctx_miniview);
            
            
                
        };


        this.Resize = function () {
            if (scope.Option.Visible) {
                view.Mode.Camera(scope.CameraIndex);
                view.Resize();
                view.MultiView[scope.CameraIndex].ClearDrawTime();
                view.Mode.Camera(0);
                view.ViewRefresh();
            }
        };

        this.Show = function (show) {
            scope.Option.Visible = show;
            if(show)
                scope.Resize();

            scope.Element.Panel.Show(show);
            view.MultiView[scope.CameraIndex].Show(show);
            
        };

        this.OnCloseButtonEvent = function(callback) {
            cbClose = callback;
        };
    }
}

export default MiniView;