import Brush from './Brush.js'
import Line from './Line.js'
import Square from './Square.js'
import Circle from './Circle.js'
import Text from './Text.js'
import ImageControl from './Image.js'
import Configuration from './Configuration.js'
import Navigator from './Navigator.js'

class Sketch {
    constructor(canvas) {
        let scope = this;
        this.Interface = undefined;
        this.ID = undefined;
        this.canvas = canvas;

        const ctx = canvas.getContext("2d");
        let parentName = document.querySelector(`.${canvas.className}`).parentElement.className;

        this.SketchItems = [];

        this.Scales = [];

        this.setting = {
            size : 2.5,
            color : "#000000"
        };
        
        this.pointX = 0;
        this.pointY = 0;
        this._Scale = 1;
        this.PanMode = false;

        this.oldMode = undefined;

        this.Brush  = new Brush(this, this.setting);
        this.Line   = new Line(this, this.setting);
        this.Square = new Square(this, this.setting);
        this.Circle = new Circle(this, this.setting);
        this.Text   = new Text(this)
        this.Image  = new ImageControl(this);
        this.Configuration = new Configuration();
        this.Navigator = new Navigator(this);

        let isJsonDataLoad = false;

        let TRIAL = false;
        let version = "2.0.22.1128";
        let keycode = '?flag=4&id=2&msg=53@127.0.0.1@00-00-00-00-00-00@N/A@N/A@N/A@N/A@' + version;  //VIZWEB3D
        this.SeccionID = "";
        let ParseType = -1;
        this.AliveTimer = null;
        this.AliveTime = 10 * 60 * 1000;

        this.Elements = new Map();

        // 이미지 관리용 맵
        this.Images = new Map();

        this.Enum = {
            Mode : {
                Pan : 0,
                Select : 1,
                Brush : 2,
                Line : 3,
                Square : 4,
                Circle : 5,
                Text : 6,
            },
            Image : {
                SelectOn : this.Configuration.Default.Path + 'VIZCore/Resource/icon/VIZWeb3D_FDMS_Select_2.png',
                SelectOff : this.Configuration.Default.Path + 'VIZCore/Resource/icon/VIZWeb3D_FDMS_Select.png',
                PanOn : this.Configuration.Default.Path + 'VIZCore/Resource/icon/VIZWeb3D_FDMS_Pan_2.png',
                PanOff : this.Configuration.Default.Path + 'VIZCore/Resource/icon/VIZWeb3D_FDMS_Pan.png',
                BrushOn : this.Configuration.Default.Path + 'VIZCore/Resource/icon/VIZWeb3D_FDMS_DrawFree_2.png',
                BrushOff : this.Configuration.Default.Path + 'VIZCore/Resource/icon/VIZWeb3D_FDMS_DrawFree.png',
                LineOn : this.Configuration.Default.Path + 'VIZCore/Resource/icon/VIZWeb3D_FDMS_DrawLine_2.png',
                LineOff : this.Configuration.Default.Path + 'VIZCore/Resource/icon/VIZWeb3D_FDMS_DrawLine.png',
                SquareOn : this.Configuration.Default.Path + 'VIZCore/Resource/icon/VIZWeb3D_FDMS_DrawSquare_2.png',
                SquareOff : this.Configuration.Default.Path + 'VIZCore/Resource/icon/VIZWeb3D_FDMS_DrawSquare.png',
                CircleOn : this.Configuration.Default.Path + 'VIZCore/Resource/icon/VIZWeb3D_FDMS_DrawCircle_2.png',
                CircleOff : this.Configuration.Default.Path + 'VIZCore/Resource/icon/VIZWeb3D_FDMS_DrawCircle.png',
                TextOn : this.Configuration.Default.Path + 'VIZCore/Resource/icon/VIZWeb3D_FDMS_AddText_2.png',
                TextOff : this.Configuration.Default.Path + 'VIZCore/Resource/icon/VIZWeb3D_FDMS_AddText.png',
            }
        };


        this.GetContext = function(){
            return ctx;
        };


        this.Size = function(size) {
            scope.setting.size = size;
        }

        this.Color = function(color) {
            scope.setting.color = color;
        }

        this.SketchItem = function () {
            let item = {
                id: 0,
                visible: true,
                selection: false,
                src : undefined,

                text: {
                    value: undefined,
                    x: 0,
                    y: 0,
                    pX: 0,
                    pY: 0,
                    setting: [],
					selected : false,
                    min : {
                        x : 0,
                        y : 0
                    },
                    max : {
                        x : 0,
                        y : 0
                    }
                },
                drawitem: {
                    x: 0,
                    y: 0,

                    zoom: false
                },
                image: {
                    item: undefined,
                    src: undefined,
                    width: 0,
                    height: 0,
                    canvasHeight: 0
                },
                brush: {
                    color: undefined,
                    size: 0,
                    pXY: [],
                    position: [],
					selected : false,
                    min : {
                        x : 0,
                        y : 0
                    },
                    max : {
                        x : 0,
                        y : 0
                    }
                },
                line: {
                    color: undefined,
                    size: 0,
                    pXY: [],
                    position: [],
					selected : false,
                    min : {
                        x : 0,
                        y : 0
                    },
                    max : {
                        x : 0,
                        y : 0
                    }
                },
                square: {
                    name: 'square',
                    color: undefined,
                    size: 0,
                    pXY: [],
                    position: [],
					selected : false,
                    min : {
                        x : 0,
                        y : 0
                    },
                    max : {
                        x : 0,
                        y : 0
                    }
                },
                circle: {
                    color: undefined,
                    size: 0,
                    pXY: [],
                    position: [],
					selected : false,
                    min : {
                        x : 0,
                        y : 0
                    },
                    max : {
                        x : 0,
                        y : 0
                    }
                }
           };
           return item;
        };

        this.Scale = function() {
            let item = {
                scaleWidth: 0,
                scaleHeight: 0
            }
            return item;
        };

        this.ResetScale = function(){
            scope.pointX = 0;
            scope.pointY = 0;
            scope._Scale = 1;
        };

        function DrawImage(){
            let item = undefined;
            for(let i = 0 ;i < scope.SketchItems.length ; i++ ) {
                let drawItem = scope.SketchItems[i];
				if (drawItem === undefined) continue;
                if(drawItem.image.item !== undefined) {

                    if(drawItem.image.item.src.localeCompare(scope.Navigator.currentSrc) !== 0)
                        continue;
                        item = drawItem;
                }
            }

            if(item === undefined)
                return;

            let image = scope.Navigator.currentImage;

            if(image === undefined)
                return;

            let x = item.drawitem.x;
            let y = item.drawitem.y;

            let width = item.image.canvasWidth;
            let height = item.image.canvasHeight;

            x += scope.pointX;
            y += scope.pointY;

            if(item.drawitem.zoom) 
            {
                width *= scope._Scale;
                height *= scope._Scale;
            }
            
            ctx.drawImage(item.image.item, x, y, width, height);
        };

        this.DrawSketch = function() {
            if(ParseType !== 0)
            return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = scope.setting.color;
            ctx.lineWidth = scope.setting.size;

            DrawImage();

            for(let i = 0 ;i < scope.SketchItems.length ; i++ ) {
                let item = scope.SketchItems[i];
				if (item === undefined) continue;
                ctx.lineWidth = item.brush.size;

                // ctx.lineWidth = scope.setting.size;

                if(!item.visible) continue;

                // 이미지 그리기
                if(item.image.item !== undefined) {
                    // if(item.image.item.src.localeCompare(scope.Navigator.currentSrc) !== 0)
                    //     continue;

                    // let x = item.drawitem.x;
                    // let y = item.drawitem.y;

                    // let width = item.image.canvasWidth;
                    // let height = item.image.canvasHeight;

                    // x += scope.pointX;
                    // y += scope.pointY;


                    // let ratioX = width / canvas.width;
                    // let ratioy = height / canvas.height;

                    // //scope._Scale /= ratioX;

                    // if(item.drawitem.zoom) 
                    // {
                    //     width *= scope._Scale;
                    //     height *= scope._Scale;
                    // }

                    // //  let ratioX = width / canvas.width;
                    // // let ratioy = height / canvas.height;

                    // //  width = width * ratioX;
                    // //  height = height *ratioy;
                    // ctx.drawImage(item.image.item, x, y, width, height);

                    continue;
                }

                if(item.src !== undefined && item.src.localeCompare(scope.Navigator.currentSrc) !== 0)
                    continue;

                // 스케치 부분 추가
                // 브러시
                if (item.brush.position.length > 0) {
                    ctx.beginPath();
                    
                    ctx.strokeStyle = item.brush.color;
                    ctx.lineWidth = item.brush.size;

					if (item.brush.selected) {
                        ctx.strokeStyle = 'red'
                    }
                    let first = true;
                    for (let i = 0; i < item.brush.position.length; i++) {
                        const brushPosition = item.brush.position[i];
						let minmax = MinMaxCalc(brushPosition);
                        AddMinMax(item.brush, minmax);
                        
                        for (let j = 0; j < brushPosition.length - 1; j++) {
                            let brushPos = brushPosition[j];
                            let brushNextPos = brushPosition[j+1];
                            
                            // scope._Scale = 현재 스케일, pointXY = Panning
                            // 내보내기 할 때 에는 스케일 값, Panning 값 빼야한다.
                            // 그래야 다시 그릴때 그려짐
                            // 나중에 처음부터 그릴 때 계산해서 그리는 방식으로 변경 해보자..
                            if(first) {
                                ctx.moveTo((brushPos.x * scope._Scale + scope.pointX), (brushPos.y * scope._Scale + scope.pointY));
                                first = false;
                            }
                            else {
                                ctx.lineTo((brushPos.x * scope._Scale + scope.pointX), (brushPos.y * scope._Scale + scope.pointY));
                            }
                            ctx.lineTo((brushNextPos.x * scope._Scale + scope.pointX), (brushNextPos.y * scope._Scale + scope.pointY));
                        }
                        if (item.brush.selected) {
                            SelectedRect(item.brush);
                        }
                    }
                    ctx.stroke();
                }

                // 브러시 캔버스 비대 그리기 ( JSON Data Load )
                if (item.brush.pXY.length > 0 && isJsonDataLoad) {
                    ctx.beginPath();

                    let first = true;
                    for (let i = 0; i < item.brush.pXY.length; i++) {
                        const pXY = item.brush.pXY[i];
                        for (let j = 0; j < pXY[0].length - 1; j++) {
                            let brushPos = pXY[0][j];
                            let brushNextPos = pXY[0][j + 1];

                            // scope._Scale = 현재 스케일, pointXY = Panning
                            // 내보내기 할 때 에는 스케일 값, Panning 값 빼야한다.
                            // 그래야 다시 그릴때 그려짐
                            // 나중에 처음부터 그릴 때 계산해서 그리는 방식으로 변경 해보자..
                            if (first) {
                                ctx.moveTo(brushPos.x * canvas.width, brushPos.y * canvas.height);
                                first = false;
                            }
                            else {
                                ctx.lineTo(brushPos.x * canvas.width, brushPos.y * canvas.height);
                            }
                            ctx.lineTo(brushNextPos.x * canvas.width, brushNextPos.y * canvas.height);
                        }
                        if (item.brush.selected) {
                            SelectedRect(item.brush);
                        }
                    }
                    ctx.stroke();
                }

                // 선 
                if (item.line.position.length > 0) {
                    ctx.beginPath();
					if (item.line.selected) {
                        ctx.strokeStyle = 'red'
                    }
                    for (let i = 0; i < item.line.position.length; i++) {
                        const linePosition = item.line.position[i];

                        let minmax = MinMaxCalc(linePosition);
                        AddMinMax(item.line, minmax)
                        let start = linePosition[0];
                        let end = linePosition[linePosition.length - 1];

                        ctx.moveTo((start.x * scope._Scale + scope.pointX), (start.y * scope._Scale + scope.pointY));
                        ctx.lineTo((end.x * scope._Scale + scope.pointX), (end.y * scope._Scale + scope.pointY));
                    }
                    if (item.line.selected) {
                        SelectedRect(item.line);
                    }
                    ctx.stroke();
                    
                }

                // 선 캔버스 비대 그리기 ( JSON Data Load )
                if (item.line.pXY.length > 0 && isJsonDataLoad) {
                    ctx.beginPath();
                    for (let i = 0; i < item.line.pXY.length; i++) {
                        const pXY = item.line.pXY[i];
                        for (let j = 0; j < pXY[0].length; j++) {
                            let start = pXY[0][0];
                            let end = pXY[0][pXY.length - 1];

                            ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
                            ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
                        }
                    }
                    if (item.line.selected) {
                        SelectedRect(item.line);
                    }
                    ctx.stroke();
                }
                
                // 사각형
                if (item.square.position.length > 0) {
                    ctx.beginPath();

					if (item.circle.selected) {
                        ctx.strokeStyle = 'red'
                    }
                    for (let i = 0; i < item.square.position.length; i++) {
                        const squarePosition = item.square.position[i];
						let minmax = MinMaxCalc(squarePosition);
                        AddMinMax(item.square, minmax);
                        let start = squarePosition[0];

                        let startX;
                        let startY;

                        if (scope.Scales[0] === undefined) {
                            startX = (start.x * scope._Scale + scope.pointX);
                            startY = (start.y * scope._Scale + scope.pointY);
                        } else {
                            startX = (start.x * scope.Scales[0].scaleWidth * scope._Scale + scope.pointX);
                            startY = (start.y * scope.Scales[0].scaleHeight * scope._Scale + scope.pointY);
                        }

                        let squarePosX = 0;
                        let squarePosY = 0;

                        for (let j = 0; j < squarePosition.length; j++) {
                            // mouseMove Position
                            if(scope.Scales[0] === undefined){
                                squarePosX = (squarePosition[j].x * scope._Scale + scope.pointX);
                                squarePosY = (squarePosition[j].y * scope._Scale + scope.pointY);
                            } else {
                                squarePosX = (squarePosition[j].x  * scope.Scales[0].scaleWidth * scope._Scale + scope.pointX);
                                squarePosY = (squarePosition[j].y * scope.Scales[0].scaleHeight * scope._Scale + scope.pointY);
                            }
                        }
                        ctx.strokeRect(startX , startY, squarePosX - startX, squarePosY - startY);
                    }
                    if (item.square.selected) {
                        SelectedRect(item.square);
                    }
                }

                // 사각형 캔버스 비대 그리기 ( JSON Data Load )
                if (item.square.pXY.length > 0 && isJsonDataLoad) {
                    ctx.beginPath();
                    for (let i = 0; i < item.square.pXY.length; i++) {
                        const pXY = item.square.pXY[i];
                        for (let j = 0; j < pXY[0].length; j++) {
                            let start = pXY[0][0];

                            let startX = (start.x * canvas.width);
                            let startY = (start.y * canvas.height);

                            let squarePosX = 0;
                            let squarePosY = 0;

                            // mouseMove Position
                            squarePosX = (pXY[0][j].x * canvas.width);
                            squarePosY = (pXY[0][j].y * canvas.height);

                            ctx.strokeRect(startX, startY, squarePosX - startX, squarePosY - startY);
                        }
                    }
                    if (item.square.selected) {
                        SelectedRect(item.square);
                    }
                }

                // 원형
                if (item.circle.position.length > 0) {
                    ctx.beginPath();
					if (item.circle.selected) {
                        ctx.strokeStyle = 'red'
                    }
                    for (let i = 0; i < item.circle.position.length; i++) {
                        const circlePosition = item.circle.position[i];
                        let start = circlePosition[0];

                        let startX = (start.x * scope._Scale + scope.pointX);
                        let startY = (start.y * scope._Scale + scope.pointY);

                        let circlePosX = 0
                        let circlePosY = 0
                        
                        for (let j = 0; j < circlePosition.length; j++) {
                            // mouseMove Position
                            circlePosX = (circlePosition[j].x * scope._Scale + scope.pointX);
                            circlePosY = (circlePosition[j].y * scope._Scale + scope.pointY);
                        }
                        
                        let radiusX = (circlePosX - startX) * 0.65;
                        let radiusY = (circlePosY - startY) * 0.65;
                        let centerX = startX + radiusX;
                        let centerY = startY + radiusY;
                        // step 보정 
                        let step = 0.01;
                        let pi2 = 2 * Math.PI + step;

                        let arcPos = []
                        ctx.moveTo(centerX + radiusX * Math.cos(0), centerY + radiusY * Math.sin(0));
                        arcPos.push({x : centerX + radiusX * Math.cos(0), y : centerY + radiusY * Math.sin(0)});
                        for (let a = step; a < pi2; a += step) {
                            ctx.lineTo(centerX + radiusX * Math.cos(a), centerY + radiusY * Math.sin(a));
                            arcPos.push({x : centerX + radiusX * Math.cos(a), y : centerY + radiusY * Math.sin(a)});
                        }
                       
                        let minmax = MinMaxCalc(arcPos);
                        AddMinMax(item.circle, minmax);		   
                    }
                    if (item.circle.selected) {
                        SelectedRect(item.circle);
                    }
                    ctx.stroke();
                }

                // 원형 캔버스 비대 그리기 ( JSON Data Load )
                if (item.circle.pXY.length > 0 && isJsonDataLoad) {
                    ctx.beginPath();
                    for (let i = 0; i < item.circle.pXY.length; i++) {
                        const pXY = item.circle.pXY[i];
                        for (let j = 0; j < pXY[0].length; j++) {
                            let start = pXY[0][0];

                            let startX = (start.x * canvas.width);
                            let startY = (start.y * canvas.height);

                            let circlePosX = 0
                            let circlePosY = 0

                            // mouseMove Position
                            circlePosX = (pXY[0][j].x * canvas.width);
                            circlePosY = (pXY[0][j].y * canvas.height);
                            let radiusX = (circlePosX - startX) * 0.65;
                            let radiusY = (circlePosY - startY) * 0.65;
                            let centerX = startX + radiusX;
                            let centerY = startY + radiusY;
                            let step = 0.01;
                            let pi2 = 2 * Math.PI + step;

                            ctx.moveTo(centerX + radiusX * Math.cos(0), centerY + radiusY * Math.sin(0));
                            for (let a = step; a < pi2; a += step) ctx.lineTo(centerX + radiusX * Math.cos(a), centerY + radiusY * Math.sin(a));
                        }
                    }
                    if (item.circle.selected) {
                        SelectedRect(item.circle);
                    }
                    ctx.stroke();
                }

                // 텍스트
                if (item.text.value !== undefined) {

                    let pos = []
                    let line = '';
                    let fieldWidth;
                    let text = item.text.value;
                    let start = PointCalc(item.text);
                    pos.push({x : start.x, y : start.y})

                    for (let i = 0; i < item.text.setting.length; i++) {
                        const settings = item.text.setting[i];
															 
                        let spacing = settings.spacing;
                        let scaleValue = settings.fontSize * scope._Scale;
                        ctx.textBaseline = settings.textBaseline;
                        ctx.textAlign = settings.textAlign;
                        ctx.fillStyle = (!item.text.selected) ? settings.color : 'red';
                        ctx.font = (!settings.style) ? `${scaleValue}pt ${settings.face}` : `${settings.style} ${scaleValue}pt ${settings.face}`;
                        fieldWidth = settings.fieldWidth;
                        // 텍스트 줄바꿈
                        for (let j = 0; j < text.length; j++) {
                            const tempLine = line + text[j];
                            ctx.fillText(tempLine, start.x, start.y);
                            line = "";
                            start.y += scaleValue * spacing;
                            pos.push({x : start.x, y : start.y})
                        }
                        
                    }
                    let width = fieldWidth * scope._Scale;
                    let minmax = MinMaxCalc(pos);
                    minmax.max.x += width;
                    AddMinMax(item.text, minmax);
                    
                    ctx.fillText(line, start.x, start.y);

                    if (item.text.selected) {
                        SelectedRect(item.text);
                    }
                }

            }

            if(scope.Interface.WaterMark !== undefined)
                scope.Interface.WaterMark.Render();
        };

        function PointCalc(point) {
            let pointcalc = { x : 0, y : 0 };
            if (isJsonDataLoad) {
                pointcalc = { x : (point.pX * canvas.width), y : (point.pY * canvas.height) };
            } else {
                pointcalc = { x : (point.x * scope._Scale + scope.pointX), y : (point.y * scope._Scale + scope.pointY) };
            }
            return pointcalc;
        }


        /**
         * Json 파일 저장
         * 파일명이 없으면 Json 형태로 반환
         * @param {string} fileName 저장 할 파일이름
         * @returns Json 형태로 반환
         */
        this.ExportJson = function(fileName) {
            // Json 저장 할 때는 확대가 되던 축소가 되던 
            // 백분율 하여 저장하면 무조건 0 ~ 1 사이 값이 나오므로 관리가 용이함.
            // pX,pY / Width,Height(canvas)로 저장

            // Json 파일 조회 할 때는 반대로 조회
            // pX,pY * Width,Height(canvas)로 조회
            if (fileName == undefined) return JSON.stringify(scope.SketchItems);

            // 링크 클릭 방법으로 다운로드
            let element = document.createElement('a');
            element.setAttribute('href', 'data:application/json;charset=utf-8,' +
             encodeURIComponent(JSON.stringify(scope.SketchItems)));
            element.setAttribute('download', fileName)
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        };

        /**
         * Json 데이터 랜더링
         * @param {string} JsonData 
         */
        this.LoadJson = function(JsonData) {
            
            if (JsonData == undefined) {
                let input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';

                input.onchange = _=> {
                    let files = Array.from(input.files);

                    let readFile = new FileReader();
                    readFile.onload = (e) => {
                        let contents = e.target.result;
                        let json = JSON.parse(contents);
                        const img = new Image();
                        img.src = json[0].image.src; 
                        json[0].image.item = img;
                        
                        scope.Image.SetImage(json[0].image.src, json);
										   
											   
                    };
                    readFile.readAsText(files[0]);
                };
                input.click();
            } else {
                scope.SketchItems = JSON.parse(JsonData);
            }
        };

        this.GetImageData = function(){
            return canvas.toDataURL();
        };

        /*
         * png 다운로드 
         * @param {String} fileName 파일 이름
         */
        this.ExportPNG = function(fileName) {
            if (fileName == undefined) fileName = 'Image.png'
            // 링크 클릭 방법으로 다운로드
            let element = document.createElement('a');
            element.setAttribute('href', canvas.toDataURL());
            element.setAttribute('download', fileName)
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }

        /**
         * 이미지 지정
         * @param {String} src 이미지 경로
         */
        this.SetImage = function(src){
            if(typeof src === "string")
            {
                scope.Image.SetImage(src);    
                scope.Images.set(src, undefined);
            }
            else if (Array.isArray(src)) {
                for(let i = 0; i < src.length; i++)
                    scope.Images.set(src[i], undefined);

                scope.Image.SetImage(src[0]);
            }

            scope.Navigator.Init();
            scope.Navigator.Refresh();

            scope.DrawSketch();
        };

        this.SetImageData = function(src, img)
        {
            scope.Images.set(src, img);
        };
									   
		this.Select = function() {
            if (scope.PanMode) {
                scope.PanMode = false;
                // document.getElementById('btnPanModeImg').src = './VIZCore/Resource/icon/VIZWeb3D_FDMS_Pan.png';
                // document.getElementById('btnPanMode').classList.remove('btnImgSelect');
            }
		   

            this.Mode = 'SelectMode'
           
            if (scope.oldMode !== undefined && scope.oldMode.Mode !== this.Mode) {
                scope.oldMode.DrawEnd();
            }					 
			
            scope.oldMode = scope;
           
            // document.getElementById('btnSketchSelect').classList.remove('btnImgSelect');
            // document.getElementById('btnSketchSelectImg').src = './VIZCore/Resource/icon/VIZWeb3D_FDMS_Select_2.png';
            // document.getElementById('btnSketchSelect').classList.add('btnImgSelect');
            canvas.addEventListener('click', onMouseClick);
            canvas.addEventListener('mousemove', onMouseMove);							 

            scope.SetMode(scope.Enum.Mode.Select)
		}											

													  
		function onMouseMove(e) {
            let pointX = e.offsetX;
            let pointY = e.offsetY;

            scope.SketchItems.forEach((val) => {
                let brush = val.brush;
                let circle = val.circle;
                let line = val.line;
                let square = val.square;
                let text = val.text

                // 브러쉬 
                if (brush.position.length > 0) {
                    if (between(brush, pointX, pointY)) {
                        canvas.style.cursor = 'pointer'
                    } else {
                        canvas.style.cursor = 'default'
                    }
				  
                }

                // 선
                if (line.position.length > 0) {
                    if (between(line, pointX, pointY)) {
                        canvas.style.cursor = 'pointer'
                    } else {
                        canvas.style.cursor = 'default'
                    }
                }

                // 원형
                if (circle.position.length > 0) {
                    if (between(circle, pointX, pointY)) {
                        canvas.style.cursor = 'pointer'
                    } else {
                        canvas.style.cursor = 'default'
                    }
                }

                // 사각형
                if (square.position.length > 0) {
                    if (between(square, pointX, pointY)) {
                        canvas.style.cursor = 'pointer'
                    } else {
                        canvas.style.cursor = 'default'
                    }
                }

                // 텍스트
                if (text.value !== undefined) {
                    if (between(text, pointX, pointY)) {
                        canvas.style.cursor = 'pointer'
                    } else {
                        canvas.style.cursor = 'default'
                    }
                }
                
            });
         }

         function onMouseClickKeyDown(e) {
            if (e.keyCode === 46) {
                for (let i = scope.SketchItems.length - 1; i >= 0; i--) {
                    const item = scope.SketchItems[i];
                    if (item === undefined) continue
                    
                    let brush = item.brush;
                    let circle = item.circle;
                    let line = item.line;
                    let square = item.square;
                    let text = item.text;

                    if (brush.selected) {
                        //delete scope.SketchItems[i];
                        scope.SketchItems.splice(i, 1);
                    }

                    if (circle.selected) {
                        //delete scope.SketchItems[i];
                        scope.SketchItems.splice(i, 1);
                    }

                    if (line.selected) {
                        //delete scope.SketchItems[i];
                        scope.SketchItems.splice(i, 1);
                    }

                    if (square.selected) {
                        //delete scope.SketchItems[i];
                        scope.SketchItems.splice(i, 1);
                    }

                    if (text.selected) {
                        //delete scope.SketchItems[i];
                        scope.SketchItems.splice(i, 1);
                    }

                    scope.DrawSketch();
                }
                
            }
         }

         function onMouseClick(e) {
            window.addEventListener('keydown', onMouseClickKeyDown)
            
            let pointX = e.offsetX;
            let pointY = e.offsetY;

            // for (let i = scope.SketchItems.length; i > 0; i--) {

            //     const item = scope.SketchItems[i];
            //     if (item === undefined) continue; 
            //     let brush = item.brush;
            //     let circle = item.circle;
            //     let line = item.line;
            //     let square = item.square;
            //     let text = item.text

            //     // 브러쉬 
            //     if (brush.position.length > 0) {
            //         if (between(brush, pointX, pointY)) {
            //             brush.selected = true;
            //         } else {
            //             brush.selected = false;		
            //         }
            //     }

            //     // 선
            //     if (line.position.length > 0) {
            //         if (between(line, pointX, pointY)) {
            //             line.selected = true;
            //         } else {
            //             line.selected = false;
            //         }
	
            //     }

            //     // 원형
            //     if (circle.position.length > 0) {
            //         if (between(circle, pointX, pointY)) {
            //             circle.selected = true;
            //             scope.DrawSketch();
            //             break;
            //         } else {
            //             circle.selected = false;
            //             scope.DrawSketch();
            //         }
                    
            //         // return;
            //     }

            //     // 사각형
            //     if (square.position.length > 0) {
            //         if (between(square, pointX, pointY)) {
            //             square.selected = true;
            //         } else {
            //             square.selected = false;
            //         }
            //     }

            //     // 텍스트
            //     if (text.value !== undefined) {
            //         if (between(text, pointX, pointY)) {
            //             text.selected = true;
            //         } else {
            //             text.selected = false;
            //         }
            //     }
            // }
            let selected = false;
            unSelectedAll();
            for (let i = scope.SketchItems.length - 1; i >= 0; i--) {
                let val = scope.SketchItems[i];
                if(selected === true)
                    break;

                let brush = val.brush;
                let circle = val.circle;
                let line = val.line;
                let square = val.square;
                let text = val.text

                // 브러쉬 
                if (brush.position.length > 0) {
                    brush.selected = false;
                    if (between(brush, pointX, pointY)) {
                        selected = true;
                        brush.selected = true;
                    } else {
                        brush.selected = false;
                    }
                }

                // 선
                if (line.position.length > 0) {
                    line.selected = false;
                    if (between(line, pointX, pointY)) {
                        selected = true;
                        line.selected = true;
                    } else {
                        line.selected = false;
                    }
	
                }

                // 원형
                if (circle.position.length > 0) {
                    if (between(circle, pointX, pointY)) {
                        selected = true;
                        circle.selected = true;
                    } else {
                        circle.selected = false;
                    }
                    
                    
                }

                // 사각형
                if (square.position.length > 0) {
                    square.selected = false;
                    if (between(square, pointX, pointY)) {
                        selected = true;
                        square.selected = true;
                    } else {
                        square.selected = false;
                    }
                }

                // 텍스트
                if (text.value !== undefined) {
                    text.selected = false;
                    if (between(text, pointX, pointY)) {
                        selected = true;
                        text.selected = true;
                    } else {
                        text.selected = false;
                    }
                }
                
            };
            scope.DrawSketch();
            
         };

         window.addEventListener('keydown', onKeyDown);

         function unSelectedAll() {
            scope.SketchItems.forEach((val, index) => {
                let circle = val.circle;
                circle.selected = false;

                let brush = val.brush;
                brush.selected = false;

                let line = val.line;
                line.selected = false;

                let square = val.square;
                square.selected = false;

                let text = val.text;
                text.selected = false;


            })
         }

         /**
          * X Y 최대 최소 값 비교
          * @param {*} sketch 
          * @param {*} X 
          * @param {*} Y 
          * @returns 
          */
         function between(sketch, X, Y) {
            let offset = 20;
            let minX = (sketch.min.x * scope._Scale + scope.pointX);
            let maxX = (sketch.max.x * scope._Scale + scope.pointX);

            let minY = (sketch.min.y * scope._Scale + scope.pointY);
            let maxY = (sketch.max.y * scope._Scale + scope.pointY);

            if (sketch.name === 'square') {
                minX -= offset
                maxX += offset
                minY -= offset
                maxY += offset
            }
            return ((minX <= X && maxX >= X) && (minY <= Y && maxY >= Y));
         }

         function getRectDashes(width, height) {
            let w_Array = getLineDashes(width, 0, 0, 0);
            let h_Array = getLineDashes(0, height, 0, 0);

            let dashArray = [].concat.apply([], [w_Array, 0, h_Array, 0, w_Array, 0, h_Array]);
            return dashArray;
         }

         /**
          * 대쉬 선 값 구하기
          * @param {*} x1 
          * @param {*} y1 
          * @param {*} x2 
          * @param {*} y2 
          * @returns 
          */
         function getLineDashes(x1, y1, x2, y2) {
            // 빗변 계산
            let length = Math.hypot((x2 - x1), (y2 - x2))
            // dash 8 등분
            let dash_length = length / 16;
            let nb_of_dashes = length / dash_length;
            let dash_gap = dash_length * 0.66666;
            dash_length -= dash_gap * 0.8888;

            let total_length = 0;
            let dashArray = [];
            let next;
            while (total_length < length) {
                next = dashArray.length % 2 ? dash_gap : dash_length;
                total_length += next;
                dashArray.push(next);
            }
		  

								 
            return dashArray;
         }

         function onKeyDown(e) {
            if (e.key === 'Escape') {
                if (scope.PanMode) {
                    scope.Image.PanMode();
                }

                if (scope.oldMode == undefined) return
                scope.oldMode.DrawEnd();
                scope.oldMode = undefined;
            }
         };

         this.DrawEnd = () =>  {
            scope.SketchItems.forEach(val => {
                if (val.brush.selected) {
                    val.brush.selected = false;
                }

                if (val.circle.selected) {
                    val.circle.selected = false;
                }

                if (val.line.selected) {
                    val.line.selected = false;
                }

                if (val.square.selected) {
                    val.square.selected = false;
                }

                if (val.text.selected) {
                    val.text.selected = false;
                }
            })
            scope.DrawSketch();

            document.getElementById('btnSketchSelectImg').src = './VIZCore/Resource/icon/VIZWeb3D_FDMS_Select.png';
            document.getElementById('btnSketchSelect').classList.remove('btnImgSelect');
            canvas.removeEventListener('click', onMouseClick);
            canvas.removeEventListener('mousemove', onMouseMove);
            canvas.style.cursor = 'default'
         }

         function SelectedRect(sketchType) {
            let min = sketchType.min;
            let max = sketchType.max;

            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;

            let offset = (sketchType.name === 'square') ? 20 : scope.setting.size;
            let minX = (min.x * scope._Scale + scope.pointX) - offset;
            let maxX = (max.x * scope._Scale + scope.pointX) + offset;

            let minY = (min.y * scope._Scale + scope.pointY) - offset;
            let maxY = (max.y * scope._Scale + scope.pointY) + offset;

            let width = maxX - minX;
            let height = minY - maxY; 

            // ctx.setLineDash(getRectDashes(width, height))
            ctx.strokeRect(minX, maxY, width, height);

            ctx.strokeStyle = scope.setting.color;
            ctx.lineWidth = scope.setting.size;
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
         * SketchType Min Max Add
         * 추후 Sketch로 빼기
         * @param {*} sketchType 
         * @param {*} minmax 
         */
        function AddMinMax(sketchType, minmax) {
            sketchType.min = minmax.min;
            sketchType.max = minmax.max;
        }																												  

        // check
        function request(url, async){
             // Check
            let xhr = new XMLHttpRequest();
            let method = "GET";
            if(async === undefined)
            {
                // 요청을 초기화 합니다.
                xhr.open(method, url, false);
            }
            else
            {
                xhr.open(method, url, true);
                            // onreadystatechange 이벤트를 이용해 요청에 대한 응답 결과를 처리합니다.
                xhr.onreadystatechange = function (event) {
                    const { target } = event;

                    if (target.readyState === XMLHttpRequest.DONE) {
                        const { status } = target;

                        if (status === 0 || (status >= 200 && status < 400)) {
                            // 요청이 정상적으로 처리 된 경우
                            console.log("HTTP Request Success ::", event);
                        } else {
                            // 에러가 발생한 경우
                            console.log("HTTP Request Error", event);
                        }
                    }
                };
            }



            // 서버에 요청을 보냅니다.
            xhr.send();

            let result = xhr.responseText; // 결과 데이타 받음
            return result;
        }

        function init(){
            initControl();

            check(scope.Configuration.AUTHORITY_PARAMS.Data + keycode);

            window.onbeforeunload = function () {
                scope.Disconnect();
            };

            if(ParseType === 0)
                return true;
            else
                return false;
        }

        function initControl()
        {
            scope.ID = scope.UUIDv4();

            let divCtrl = document.createElement('div');
            divCtrl.id =  "VIZWeb3D_Buttons" +"_"+scope.ID;
            divCtrl.className = "VIZWeb3D_Buttons";

            let createButton = function(name, src, alt, click){
                let btn = document.createElement('button');
                btn.id = name + "_"+ scope.ID;
                btn.addEventListener('click', click);
                
                let btnImg = document.createElement('img');
                btnImg.id = name + "Img"+ "_"+ scope.ID ;
                btnImg.src = src;
                btnImg.alt = alt;


                btn.appendChild(btnImg);
                divCtrl.appendChild(btn);

                scope.Elements.set(btn.id, btn);
                scope.Elements.set(btnImg.id, btnImg);
            };

            createButton("btnSketchSelect", scope.Enum.Image.SelectOff, "Text icon", scope.Select);
            createButton("btnPanMode", scope.Enum.Image.PanOff, "Pan icon", scope.Image.PanMode);
            createButton("btnBrushMode", scope.Enum.Image.BrushOff, "Brush icon", scope.Brush.Draw);
            createButton("btnLineMode", scope.Enum.Image.LineOff, "Line icon", scope.Line.Draw);
            createButton("btnSquareMode", scope.Enum.Image.SquareOff, "Square icon", scope.Square.Draw);
            createButton("btnCircleMode", scope.Enum.Image.CircleOff, "Circle icon", scope.Circle.Draw);
            createButton("btnTextMode", scope.Enum.Image.TextOff, "Text icon", scope.Text.Draw);
            //createButton("btnImageDown", "VIZCore/Resource/icon/VIZWeb3D_FDMS_ExportImage.png", "Text icon", scope.ExportPNG);
            //createButton("btnExportMode", "VIZCore/Resource/icon/VIZWeb3D_FDMS_ExportJson.png", "Export icon", scope.ExportJson);
            //createButton("btnLoadMode", "VIZCore/Resource/icon/VIZWeb3D_FDMS_LoadJson.png", "Load icon", scope.LoadJson);
            document.body.appendChild(divCtrl);
        }

        function check(url) {
            if (TRIAL) {            
                let date = new Date(1688050800000); //230630
                let currentDate = new Date();
                if ((date.getTime() - currentDate.getTime()) > 0) {
                    ParseType = 0;
                }
                else {
                    ParseType = 1;
                }
            }
            else {
                let check = {
                    parse: function (url) {
                        let result = request(url);
                        return result;
                    }
                };
    
                /*
                 * 5 === 성공 -
                 * 7 === 오류 -
                 */
    
                let result = check.parse(url);
                if (result) {
                    let resultTmp = result.split('@');
                    if (resultTmp[0].localeCompare('5') === 0) {
                        ParseType = 0;
                        scope.SessionID = resultTmp[1];
                        scope.AliveTimer = setInterval(function () {
                            scope.Alive();
                        }, scope.AliveTime);
                    }
                    else {
                        scope.ParseType = 1;
                    }
    
                }
                else {
                    scope.ParseType = 1;
                }
            }
        };

        this.GetElementById = function(id){
            let id_element = id + "_"+ scope.ID;
            return scope.Elements.get(id_element);
        };

        this.SetMode = function(mode){
            let imgPan = scope.GetElementById('btnPanModeImg');
            let btnPan = scope.GetElementById('btnPanMode');

            let imgSelect = scope.GetElementById('btnSketchSelectImg');
            let btnSelect = scope.GetElementById('btnSketchSelect');

            let imgBrush = scope.GetElementById('btnBrushModeImg');
            let btnBrush = scope.GetElementById('btnBrushMode');

            let imgLine = scope.GetElementById('btnLineModeImg');
            let btnLine = scope.GetElementById('btnLineMode');

            let imgSquare = scope.GetElementById('btnSquareModeImg');
            let btnSquare = scope.GetElementById('btnSquareMode');

            let imgCircle = scope.GetElementById('btnCircleModeImg');
            let btnCircle = scope.GetElementById('btnCircleMode');

            let imgText = scope.GetElementById('btnTextModeImg');
            let btnText = scope.GetElementById('btnTextMode');

            let setPan = function(set)
            {
                if(set)
                {
                    imgPan.src = scope.Enum.Image.PanOn;
                    btnPan.classList.add('btnImgSelect');
                }
                else
                {
                    imgPan.src = scope.Enum.Image.PanOff;
                    btnPan.classList.remove('btnImgSelect');
                }
            };

            let setSelect = function(set){
                if(set)
                {
                    imgSelect.src = scope.Enum.Image.SelectOn;
                    btnSelect.classList.add('btnImgSelect');
                }
                else
                {
                    imgSelect.src = scope.Enum.Image.SelectOff;
                    btnSelect.classList.remove('btnImgSelect');
                }
            };

            let setBrush = function(set){
                if(set)
                {
                    imgBrush.src = scope.Enum.Image.BrushOn;
                    btnBrush.classList.add('btnImgSelect');
                }
                else
                {
                    imgBrush.src = scope.Enum.Image.BrushOff;
                    btnBrush.classList.remove('btnImgSelect');
                }
            };

            let setLine = function(set){
                if(set)
                {
                    imgLine.src = scope.Enum.Image.LineOn;
                    btnLine.classList.add('btnImgSelect');
                }
                else
                {
                    imgLine.src = scope.Enum.Image.LineOff;
                    btnLine.classList.remove('btnImgSelect');
                }
            };

            let setSquare = function(set){
                if(set)
                {
                    imgSquare.src = scope.Enum.Image.SquareOn;
                    btnSquare.classList.add('btnImgSelect');
                }
                else
                {
                    imgSquare.src = scope.Enum.Image.SquareOff;
                    btnSquare.classList.remove('btnImgSelect');
                }
            };

            let setCircle = function(set){
                if(set)
                {
                    imgCircle.src = scope.Enum.Image.CircleOn;
                    btnCircle.classList.add('btnImgSelect');
                }
                else
                {
                    imgCircle.src = scope.Enum.Image.CircleOff;
                    btnCircle.classList.remove('btnImgSelect');
                }
            };

            let setText = function(set){
                if(set)
                {
                    imgText.src = scope.Enum.Image.TextOn;
                    btnText.classList.add('btnImgSelect');
                }
                else
                {
                    imgText.src = scope.Enum.Image.TextOff;
                    btnText.classList.remove('btnImgSelect');
                }
            };

            // 전체 끄기
            setPan(false);
            setSelect(false);
            setBrush(false);
            setLine(false);
            setSquare(false);
            setCircle(false);
            setText(false);

            switch(mode)
            {
                case scope.Enum.Mode.Pan : {
                    setPan(true);
                }break;
                case scope.Enum.Mode.Select : {
                    setSelect(true);
                }break;
                case scope.Enum.Mode.Brush : {
                    setBrush(true);
                }break;
                case scope.Enum.Mode.Line : {
                    setLine(true);
                }break;
                case scope.Enum.Mode.Square : {
                    setSquare(true);
                }break;
                case scope.Enum.Mode.Circle : {
                    setCircle(true);
                }break;
                case scope.Enum.Mode.Text : {
                    setText(true);
                }break;
            }
        };
    
        this.Alive = function () {
            let check = {
                parse: function (url) {
                    let result = request(url);
                    return result;
                }
            };
            let strAlive = scope.Configuration.AUTHORITY_PARAMS.Data + '/?flag=4&id=5&msg=' + scope.SessionID;
            check.parse(strAlive);
        };
    
        this.Disconnect = function () {
            if (!TRIAL) {
                let check = {
                    parse: function (url) {
                        let result = request(url, true);
                        return result;
                    }
                };
                let strDisconnect = scope.Configuration.AUTHORITY_PARAMS.Data + '/?flag=4&id=3&msg=' + scope.SessionID;
                check.parse(strDisconnect);
            }
        };

        this.Init = function () {
            return init();
        };

        this.UUIDv4 = function b(
            a // placeholder
        ) {
            return a // if the placeholder was passed, return
                ? ( // a random number from 0 to 15
                    a ^ // unless b is 8,
                    Math.random() // in which case
                    * 16 // a random number from
                    >> a / 4 // 8 to 11
                ).toString(16) // in hexadecimal
                : ( // or otherwise a concatenated string:
                    [1e7] + // 10000000 +
                    -1e3 + // -1000 +
                    -4e3 + // -4000 +
                    -8e3 + // -80000000 +
                    -1e11 // -100000000000,
                ).replace( // replacing
                    /[018]/g, // zeroes, ones, and eights with
                    b // random hex digits
                );
        };
    }
}

export default Sketch