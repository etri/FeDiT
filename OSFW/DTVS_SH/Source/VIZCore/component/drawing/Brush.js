class Brush {
    constructor(sketch, setting) {
        let scope = this;
        this.Mode = 'Brush';
        let paintItem = undefined;
        let position = [];
        let pXY = [];

        let canvas = sketch.canvas;

        let start = { x: 0, y: 0};

        /**
         * 그리기 플래그
         */
        let isPainting = false;

        /**
         * 펜 색상 값
         */
        let _Color = undefined;

        /**
         * 펜 굵기 값
         */
        let _Size = undefined;

        /** 
         * 펜 크기 지정
         * @param {number} size 선 크기
         */
        this.Size = function(size) {
            _Size = size;
        }

        /**
         * 펜 색상 지정
         * @param {String} color 색상코드 ex) #000000
         */
        this.Color = function(color) {
            _Color = color;
        }


        // 스케일 축소 할 때 보정
        function getCanvasPosition(e){
            start = { x: e.offsetX , y: e.offsetY };
            
            start.x = (start.x - sketch.pointX) / sketch._Scale;
            start.y = (start.y - sketch.pointY) / sketch._Scale;

            return start;
        }
        /**
         * 그리기 정지
         */
        function onMouseUp() {
            isPainting = false;
            if (sketch.PanMode) return;

            paintItem = undefined;
            pXY = [];
            position = [];
        }

        /**
         * 그리기 시작
         */
        function onMouseDown(e) {
            if(isPainting) return;

            isPainting = true;
            position = [];

            if (sketch._Scale !== 1) {
                start = { x: (e.offsetX / sketch._Scale - sketch.pointX), y : (e.offsetY / sketch._Scale - sketch.pointY)}
            } else {
                start = { x: e.offsetX , y: e.offsetY };
            }
            pXY.push({ x : start.x / canvas.width, y : start.y / canvas.height });

            position.push(getCanvasPosition(e));

            paintItem = sketch.SketchItem();
            paintItem.src = sketch.Navigator.currentSrc;
            paintItem.brush.color = (_Color) ? _Color : sketch.setting.color;
            paintItem.brush.size = (_Size) ? _Size : sketch.setting.size;
            //paintItem.brush.size = (_Size) ? _Size : sketch.setting.size / sketch._Scale;
            paintItem.brush.position[0] = position;
            paintItem.brush.pXY[0] = pXY;
            sketch.SketchItems.push(paintItem);
            paintItem.id = sketch.SketchItems.length - 1;
        }

        function onMouseMove(e) {
            if (sketch.PanMode) return;
            if(!isPainting) return;

            if (sketch._Scale !== 1) {
                start = { x: (e.offsetX / sketch._Scale - sketch.pointX), y : (e.offsetY / sketch._Scale - sketch.pointY)}
                
            } else {
                start = { x: e.offsetX , y: e.offsetY };
            }
            pXY.push({ x : start.x / canvas.width, y : start.y / canvas.height });
            position.push(getCanvasPosition(e));

            // 그리기
            sketch.DrawSketch();
        }


        this.Draw = function() {
            if (sketch.PanMode) {
                sketch.PanMode = false;
                
                //document.getElementById('btnPanModeImg').src = './VIZCore/Resource/icon/VIZWeb3D_FDMS_Pan.png';
                //document.getElementById('btnPanMode').classList.remove('btnImgSelect');
            }

            if (sketch.oldMode !== undefined && sketch.oldMode.Mode !== this.Mode) {
                sketch.oldMode.DrawEnd();
            }
            
            sketch.oldMode = scope;
            if (canvas) {
                canvas.style.cursor = 'crosshair';
                //document.getElementById('btnBrushMode').classList.remove('btnImgSelect');
                //document.getElementById('btnBrushModeImg').src = './VIZCore/Resource/icon/VIZWeb3D_FDMS_DrawFree_2.png';
                //document.getElementById('btnBrushMode').classList.add('btnImgSelect');
                canvas.addEventListener("mousemove", onMouseMove);
                canvas.addEventListener("mousedown", onMouseDown);
                canvas.addEventListener("mouseup", onMouseUp);
                canvas.addEventListener("mouseout", onMouseUp);
            }
            
            sketch.SetMode(sketch.Enum.Mode.Brush);
        }

        this.DrawEnd = function() {
            canvas.style.cursor = 'default';
            //document.getElementById('btnBrushModeImg').src = './VIZCore/Resource/icon/VIZWeb3D_FDMS_DrawFree.png';
            //document.getElementById('btnBrushMode').classList.remove('btnImgSelect');
            canvas.removeEventListener("mousemove", onMouseMove);
            canvas.removeEventListener("mousedown", onMouseDown);
            canvas.removeEventListener("mouseup", onMouseUp);
            canvas.removeEventListener("mouseout", onMouseUp);
        }
        
    }
};

export default Brush;
