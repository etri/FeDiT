//import Camera from "./Camera.js";

class Dual {
    constructor(view, VIZCore) {
        let scope = this;
        this.enabled = false;
        this.domElement = undefined;

        let canvas_single = undefined;
        let canvas_dual = undefined;
        let visible = false;

        //this.Camera = undefined;


        /**
       * 컨트롤 이벤트 잠금
       */
        function eventLock() {
            if (!scope.enabled)
                return;
            scope.enabled = false;

            scope.domElement.removeEventListener('contextmenu', function (event) { event.preventDefault(); }, false);
            scope.domElement.removeEventListener('mousedown', mousedown, false);
            scope.domElement.removeEventListener('mousewheel', mousewheel, false);
            scope.domElement.removeEventListener('DOMMouseScroll', mousewheel, false); // firefox

            scope.domElement.removeEventListener('touchstart', touchstart, false);
            scope.domElement.removeEventListener('touchend', touchend, false);
            scope.domElement.removeEventListener('touchmove', touchmove, false);

            scope.domElement.removeEventListener('mousemove', mousemove, false);
            scope.domElement.removeEventListener('mouseup', mouseup, false);

            scope.domElement.removeEventListener('mouseover', mouseover, false);
            scope.domElement.removeEventListener('mouseout', mouseout, false);



            window.removeEventListener('keyup', keyup, false);
            window.removeEventListener('keypress', keypress, false);
        }

        /**
        * 컨트롤 이벤트 잠금해제
        */
        function eventUnlock() {
            if (scope.enabled)
                return;
            scope.enabled = true;

            // modeList 생성 완료
            scope.domElement.addEventListener('contextmenu', function (event) { event.preventDefault(); }, false);
            scope.domElement.addEventListener('mousedown', mousedown, false);
            scope.domElement.addEventListener('mousewheel', mousewheel, false);
            scope.domElement.addEventListener("dblclick", dbclick, false);
            scope.domElement.addEventListener('DOMMouseScroll', mousewheel, false); // firefox

            scope.domElement.addEventListener('touchstart', touchstart, false);
            scope.domElement.addEventListener('touchend', touchend, false);
            scope.domElement.addEventListener('touchmove', touchmove, false);

            scope.domElement.addEventListener('mousemove', mousemove, false);
            scope.domElement.addEventListener('mouseup', mouseup, false);

            scope.domElement.addEventListener('mouseover', mouseover, false);
            scope.domElement.addEventListener('mouseout', mouseout, false);



            //window.addEventListener('keydown', keydown, false);
            window.addEventListener('keyup', keyup, false);
            window.addEventListener('keypress', keypress, false);
        }

        function mouseout(event) {
            view.Control.MouseOut(event);
        }

        function mouseover(event) {
            view.Control.MouseOver(event);
        }

        function mousedown(event) {
            view.Mode.Camera(1);

            view.Control.MouseDown(event);

            view.Mode.Camera(0);

        }

        function mousemove(event) {
            view.Mode.Camera(1);

            view.Control.MouseMove(event);

            view.Mode.Camera(0);
        }

        function mouseup(event) {
            view.Mode.Camera(1);

            view.Control.MouseUp(event);

            view.Mode.Camera(0);
        }

        function mousewheel(event) {
            view.Mode.Camera(1);
            view.Control.MouseWheel(event);
            view.Mode.Camera(0);
        }

        function dbclick(event) {
            view.Mode.Camera(1);
            view.Control.DoubleClick(event);
            view.Mode.Camera(0);
        }

        function touchstart(event) {
            view.Mode.Camera(1);
            view.Control.TouchStart(event);
            view.Mode.Camera(0);
        }

        function touchmove(event) {
            view.Mode.Camera(1);
            view.Control.TouchMove(event);
            view.Mode.Camera(0);
        }

        function touchend(event) {
            view.Mode.Camera(1);
            view.Control.TouchEnd(event);
            view.Mode.Camera(0);
        }

        function keydown(event) {
        }

        function keypress(event) {
        }

        function keyup(event) {
        }

        function draw() {
            let canvas_snapshot = view.Canvas_Dual; //document.getElementById("canvas_snapshot");
            
            let context_review = view.ctx_review;

            //view.CameraIndex = 1; 
            let imgObj = view.Renderer.GetImageDataFromBuffer(VIZCore.Enum.FB_RENDER_TYPES.END);
            //let imgObj = view.Renderer.GetImageDataFromBuffer(VIZCore.Enum.FB_RENDER_TYPES.MAIN);
            //let imgAfter = view.Renderer.GetImageDataFromBuffer(VIZCore.Enum.FB_RENDER_TYPES.AFTEREFFECT);
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
            let canvas_review = document.getElementById("viewcanvas_review");

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
            
            //context_snapshot.drawImage(canv, 0, 0, widthBase, heightBase);
            //context_snapshot.drawImage(canvas_review, 0, 0, widthBase, heightBase);
            
        }

        this.Init = function (single, dual) {
            canvas_single = single;
            scope.domElement = canvas_dual = dual;

            //마우스 Event 강제 추가
            scope.enabled = false;
            eventUnlock();
        };

        this.Visible = function () {
            return visible;
        };

        this.Show = function (show) {
            visible = show;
            let gl = $("#" + view.gl.canvas.id);
            let single = $("#" + canvas_single.id);
            let dual = $("#" + canvas_dual.id);

            //  화면 분할
            if (show) {
                gl.css('width', '50%');
                single.css('width', '50%');
                dual.css('display', '');
                dual.css('width', '50%');
                dual.css('border-left', 'solid');
                // dual.css('background-color', 'rgba(255, 255, 255, 0)');
                // background-color: rgba(255, 255, 255, 0.3);
            }
            else {
                gl.css('width', '100%');
                single.css('width', '100%');
                dual.css('display', 'none');
                dual.css('width', '0');
                dual.css('border-left', '');
            }

            view.Resize();
        };

        this.Draw = function () {
            if (visible)
                draw();
        };
    }
}
export default Dual;