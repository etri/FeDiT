class Text {
    constructor(sketch) {
        let scope = this;
        let paintItem = undefined;
        let canvas = sketch.canvas;
        this.Mode = 'Text';
        let start = { x: 0, y: 0};

        let _FontSize = 20;
        let face = 'Arial';
        let _Style = '';
        let hasInput = false;

        /**
         * 색상 값
         */
        let _Color = undefined;
        
        this.Color = function (color) {
            _Color = color;
        }

        this.FontSize = function(font) {
            _FontSize = font;
        }

        this.Bold = function() {
            _Style = 'Bold';
        }

        this.Italic = function() {
            _Style = 'italic';
        }

        function getCanvasPosition(e){
            start = { x: e.offsetX , y: e.offsetY }
            
            start.x = (start.x - sketch.pointX) / sketch._Scale;
            start.y = (start.y - sketch.pointY) / sketch._Scale;

            return start;
        }

        function onMouseDown(e) {
            if (sketch.PanMode) return;
            if (hasInput) return;

            if (sketch._Scale !== 1) {
                start = { x : (e.offsetX / sketch._Scale - sketch.pointX), y : (e.offsetY / sketch._Scale - sketch.pointY) };
            } else {
                start = { x : e.offsetX, y : e.offsetY };
            }
            start = getCanvasPosition(e);

            addInput(e.clientX, e.clientY);
        }


        function addInput(x, y) {
            var input = document.createElement('textarea');
            const { left } = canvas.getBoundingClientRect();

            input.id = "input";
            input.autocomplete = "off";
            input.style.position = 'fixed';
            input.style.left = (x - 4) + 'px';
            input.style.top = (y - 4) + 'px';
            input.style.fontSize = `${_FontSize * sketch._Scale}pt`;
            // input.style.fontSize = `${_FontSize}pt`;
            // input.style.width = '150px';
            // input.style.height = '100px';
            input.style.width = 150 * sketch._Scale + "px";
            input.style.height = 100 * sketch._Scale + "px";

            canvas.addEventListener('click', function(e){
                if (sketch.PanMode) return;
                if(e.target === canvas){
                    canvas.onclick = handleClick;
                }
            });

            document.body.appendChild(input);

            input.focus();

            hasInput = true;
        }

        function handleClick(e) {
            let inputElement = document.getElementById('input');
            const { left, top } = canvas.getBoundingClientRect();
            if(inputElement !== null){
                let text = inputElement.value.replace(/(.{11})/g,"$1\n").split("\n");

                paintItem = sketch.SketchItem();
                paintItem.src = sketch.Navigator.currentSrc;
                paintItem.text.value = text;
                // paintItem.text.value = inputElement.value;
                paintItem.text.setting.push({
                    fontSize: _FontSize,
                    face: face,
                    textBaseline: 'top',
                    textAlign: 'left',
                    color: (_Color) ? _Color : sketch.setting.color,
                    style: _Style,
                    fieldWidth: parseInt(inputElement.style.width),
                    spacing: 1.2
                });
                paintItem.text.x = start.x;
                paintItem.text.y = start.y;
                paintItem.text.pX = start.x / canvas.width;
                paintItem.text.pY = start.y / canvas.height;

                sketch.SketchItems.push(paintItem);
                paintItem.id = sketch.SketchItems.length - 1;
                sketch.DrawSketch();
                
                document.body.removeChild(inputElement);
                hasInput = false;
            }
        }

        this.Draw = function () {
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
                canvas.style.cursor = 'text';
                // document.getElementById('btnTextModeImg').src = './VIZCore/Resource/icon/VIZWeb3D_FDMS_AddText_2.png';
                // document.getElementById('btnTextMode').classList.add('btnImgSelect');
                canvas.addEventListener("mousedown", onMouseDown);
            }

            sketch.SetMode(sketch.Enum.Mode.Text);
        };

        this.DrawEnd = function() {
            canvas.style.cursor = 'default';
            // document.getElementById('btnTextModeImg').src = './VIZCore/Resource/icon/VIZWeb3D_FDMS_AddText.png';
            // document.getElementById('btnTextMode').classList.remove('btnImgSelect');
            canvas.removeEventListener("mousedown", onMouseDown);
        }

    }
};

export default Text;
