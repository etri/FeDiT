class Square {
    constructor(sketch, setting) {
        let scope = this;
        let paintItem = undefined;
        let position = [];
        let pXY = [];
        let canvas = sketch.canvas;
        this.Mode = 'Square';

        /**
         * 그리기 플래그
         */
        let isPainting = false;

        /**
         * 선 색상 값
         */
        let _Color = undefined;

        /**
         * 선 굵기 값
         */
        let _Size = undefined;

        let start = { x : 0, y : 0 };

        /** 
         * 선 크기 지정
         * @param {number} size 선 크기
         */
        this.Size = function(size) {
            _Size = size;
        }

        /**
         * 선 색상 지정
         * @param {String} color 색상코드 ex) #000000
         */
        this.Color = function(color) {
            _Color = color;
        }

        function getCanvasPosition(e){
            start = { x: e.offsetX , y: e.offsetY }
            
            start.x = (start.x - sketch.pointX) / sketch._Scale;
            start.y = (start.y - sketch.pointY) / sketch._Scale;

            return start;
        }

        /**
         * 그리기 정지
         */
        function onMouseUp(e) {
            isPainting = false;
            if (sketch.PanMode) return;

            position.push(getCanvasPosition(e));
            pXY.push({ x :start.x / canvas.width, y : start.y / canvas.height });
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
                start = { x : (e.offsetX / sketch._Scale - sketch.pointX), y : (e.offsetY / sketch._Scale - sketch.pointY) };
            } else {
                start = { x : e.offsetX, y : e.offsetY };
            }

            pXY.push({ x :start.x / canvas.width, y : start.y / canvas.height });

            position.push(getCanvasPosition(e));
            position.push(getCanvasPosition(e));

            paintItem = sketch.SketchItem();
            paintItem.src = sketch.Navigator.currentSrc;
            paintItem.brush.color = (_Color) ? _Color : sketch.setting.color;
            paintItem.brush.size = (_Size) ? _Size : sketch.setting.size;
            // paintItem.brush.size = (_Size) ? _Size : sketch.setting.size / sketch._Scale;
            paintItem.square.position[0] = position;
            paintItem.square.pXY[0] = pXY;
            sketch.SketchItems.push(paintItem);
            paintItem.id = sketch.SketchItems.length - 1;
        }

        function onMouseMove(e) {
            if (sketch.PanMode) return;
            if(!isPainting) return;
            
            if (sketch._Scale !== 1) {
                start = { x : (e.offsetX / sketch._Scale - sketch.pointX), y : (e.offsetY / sketch._Scale - sketch.pointY) };
            } else {
                start = { x : e.offsetX, y : e.offsetY };
            }

            // 무브 할 때 라인 그려주는 포인트는 최대 길이의 - 1
            // 시작점, 이동 시 좌표, 끝점 이렇게 이해 한다.
            position[position.length - 1] = getCanvasPosition(e);

            sketch.DrawSketch();
        }

        this.Draw = function() {

            if (sketch.PanMode) {
                sketch.PanMode = false;
                // document.getElementById('btnPanModeImg').src = './VIZCore/Resource/icon/VIZWeb3D_FDMS_Pan.png';
                // document.getElementById('btnPanMode').classList.remove('btnImgSelect');
            }
            
            if (sketch.oldMode !== undefined && sketch.oldMode.Mode !== this.Mode) {
                sketch.oldMode.DrawEnd();
            }

            sketch.oldMode = scope;

            if (canvas) {
                canvas.style.cursor = 'crosshair';
                // document.getElementById('btnSquareModeImg').src = './VIZCore/Resource/icon/VIZWeb3D_FDMS_DrawSquare_2.png';
                // document.getElementById('btnSquareMode').classList.add('btnImgSelect');
                canvas.addEventListener("mousemove", onMouseMove);
                canvas.addEventListener("mousedown", onMouseDown);
                canvas.addEventListener("mouseup", onMouseUp);
                canvas.addEventListener("mouseout", onMouseUp);
            }
            sketch.SetMode(sketch.Enum.Mode.Square);
        }

        this.DrawEnd = function() {
            canvas.style.cursor = 'default';
            // document.getElementById('btnSquareModeImg').src = './VIZCore/Resource/icon/VIZWeb3D_FDMS_DrawSquare.png';
            // document.getElementById('btnSquareMode').classList.remove('btnImgSelect');
            canvas.removeEventListener("mousemove", onMouseMove);
            canvas.removeEventListener("mousedown", onMouseDown);
            canvas.removeEventListener("mouseup", onMouseUp);
            canvas.removeEventListener("mouseout", onMouseUp);
        }

    }
};

export default Square;
