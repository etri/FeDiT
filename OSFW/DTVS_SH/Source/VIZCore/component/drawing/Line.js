class Line {
    constructor(sketch) {
        let scope = this;
        let paintItem = undefined;
        let position = [];
        let pXY = [];
        let canvas = sketch.canvas;
        this.Mode = 'Line';
        let start = { x : 0, y : 0 };

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
            // const X = e.offsetX - (canvas.clientWidth - canvas.width);
            start = { x: e.offsetX , y: e.offsetY}
            
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

            // const MinMax = MinMaxCalc(position);
            // AddMinMax(sketch.SketchItems, MinMax);

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
            const X = e.offsetX - (canvas.clientWidth - canvas.width);
            if (sketch._Scale !== 1) {
                start = { x : (X / sketch._Scale - sketch.pointX), y : (e.offsetY / sketch._Scale - sketch.pointY) };
            } else {
                start = { x : X, y : e.offsetY };
            }

            pXY.push({ x :start.x / canvas.width, y : start.y / canvas.height });

            position.push(getCanvasPosition(e));
            position.push(getCanvasPosition(e));

            paintItem = sketch.SketchItem();
            paintItem.src = sketch.Navigator.currentSrc;
            paintItem.brush.color = (_Color) ? _Color : sketch.setting.color;
            paintItem.brush.size = (_Size) ? _Size : sketch.setting.size;
            //paintItem.brush.size = (_Size) ? _Size : sketch.setting.size / sketch._Scale;
            paintItem.line.position[0] = position;
            paintItem.line.pXY[0] = pXY;
            sketch.SketchItems.push(paintItem);
            paintItem.id = sketch.SketchItems.length - 1;
        }

        function onMouseMove(e) {
            if (sketch.PanMode) return;
            if(!isPainting) return;
            const X = e.offsetX - (canvas.clientWidth - canvas.width);
            if (sketch._Scale !== 1) {
                start = { x : (X / sketch._Scale - sketch.pointX), y : (e.offsetY / sketch._Scale - sketch.pointY) };
            } else {
                start = { x : X, y : e.offsetY };
            }

            position[position.length - 1] = getCanvasPosition(e);
            sketch.DrawSketch();
        }

        /**
         * Xy Min Max Calculator
         * 추후 Sketch로 빼기
         * @param {*} pos 
         */
        function MinMaxCalc(pos) {
            let xArr = [];
            let yArr = [];
            
            pos.forEach(v => {
                xArr.push(v.x);
                yArr.push(v.y);
            });

            let xMin = Math.min(...xArr);
            let xMax = Math.max(...xArr);

            let yMin = Math.min(...yArr);
            let yMax = Math.max(...yArr);

            const MinMax = { min : { x : xMin, y : yMin }, max : { x : xMax, y : yMax } };
            return MinMax;
        }

        /**
         * SketchItems line Min Max Add
         * 추후 Sketch로 빼기
         * @param {*} items 
         * @param {*} minmax 
         */
        function AddMinMax(items, minmax) {
            for (let i = 1; i < items.length; i++) {
                const item = items[i];
                item.line.min = minmax.min;
                item.line.max = minmax.max;
            }
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
                // document.getElementById('btnLineModeImg').src = './VIZCore/Resource/icon/VIZWeb3D_FDMS_DrawLine_2.png';
                // document.getElementById('btnLineMode').classList.add('btnImgSelect');
                canvas.addEventListener("mousemove", onMouseMove);
                canvas.addEventListener("mousedown", onMouseDown);
                canvas.addEventListener("mouseup", onMouseUp);
                // canvas.addEventListener("mouseout", onMouseUp);
            }
            sketch.SetMode(sketch.Enum.Mode.Line);
        }

        this.DrawEnd = function() {
            canvas.style.cursor = 'default';
            // document.getElementById('btnLineModeImg').src = './VIZCore/Resource/icon/VIZWeb3D_FDMS_DrawLine.png';
            // document.getElementById('btnLineMode').classList.remove('btnImgSelect');
            canvas.removeEventListener("mousemove", onMouseMove);
            canvas.removeEventListener("mousedown", onMouseDown);
            canvas.removeEventListener("mouseup", onMouseUp);
            // canvas.removeEventListener("mouseout", onMouseUp);
        }

    }
};

export default Line;
