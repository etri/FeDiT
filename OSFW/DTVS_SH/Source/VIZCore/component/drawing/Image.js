//import Tiff from "../Resource/lib/tif/tiff.min.js";

class ImageControl {
    constructor(sketch) {
        let scope = this

        let _Image = undefined;
        let start = { x: 0, y: 0};
        //let _ScaleValue = 0.08;
        let _ScaleValue = 0.1;
        let isPanning = false;

        let lastPointX = 0;
        let lastPointY = 0;
        let canvas = sketch.canvas


        let imgScale = 1;
        let canvasScale = 1;
        let lastWidth = 0;
        let lastHeight = 0;

        let lastVlaueFlag = true;

        this.scale = {
            width: 1,
            height: 1
        };

        function onMouseDown(e) {
            e.preventDefault();
            if (!sketch.PanMode) return;

            canvas.style.cursor = 'grabbing';

            const { left, top } = canvas.getBoundingClientRect(); 

            start = { x: e.clientX - left, y: e.clientY - top};
            isPanning = true;

            lastPointX = start.x;
            lastPointY = start.y;
        }

        function onMouseUp() {
            if (!sketch.PanMode) return;
            canvas.style.cursor = 'grab';

            isPanning = false;
        }

        function onMouseMove(e) {
            const { left, top } = canvas.getBoundingClientRect(); 
            e.preventDefault();
            if (!sketch.PanMode) return;

            if (!isPanning) {
                return;
            }

            let x = e.clientX - left;
            let y = e.clientY - top;

            let dx = x - lastPointX;
            let dy = y - lastPointY;

            // 1:1 캔버스 구함
            // let diffX = (canvas.width * sketch._Scale - _Image.width);
            // let diffY = (canvas.height * sketch._Scale - _Image.height);

            // if (sketch.pointX + dx < -diffX || sketch.pointX + dx + _Image.width > canvas.width * sketch._Scale - diffX) dx = 0;
            // if (sketch.pointY + dy < -diffY || sketch.pointY + dy + _Image.height > canvas.height * sketch._Scale - diffY) dy = 0;

            // 캔버스와 이미지 사이즈 다름
            let diffX = (canvas.width * sketch._Scale - canvas.width);
            let diffY = (canvas.height * sketch._Scale - canvas.height);

            if (sketch.pointX + dx < -diffX || sketch.pointX + dx + canvas.width > canvas.width * sketch._Scale - diffX) dx = 0;
            if (sketch.pointY + dy < -diffY || sketch.pointY + dy + canvas.height > canvas.height * sketch._Scale - diffY) dy = 0;

            sketch.pointX += dx;
            sketch.pointY += dy;
            
            lastPointX = x;
            lastPointY = y;

            sketch.DrawSketch();
            
        }

        function onMouseWheel(e) {
            e.preventDefault();
            //_ScaleValue = sketch._Scale * 0.1;
            let fScaleValue = sketch._Scale * _ScaleValue;
            const { left, top } = canvas.getBoundingClientRect(); 

            let x = e.clientX - left;
            let y = e.clientY - top;

            let oldScale = sketch._Scale;

            x = (x - sketch.pointX) / oldScale;
            y = (y - sketch.pointY) / oldScale;

            if(e.deltaY > 0) {
                sketch._Scale = sketch._Scale - fScaleValue;
            } else {
                sketch._Scale = sketch._Scale + fScaleValue;
            }
            sketch._Scale = Math.min(Math.max(1, sketch._Scale));

            let offsetX = (x * oldScale) - (x * sketch._Scale);
            let offsetY = (y * oldScale) - (y * sketch._Scale);
            
            if(sketch.SketchItems.length > 0 )
            {
                // Image 만 ?..
                let item = sketch.SketchItems[0];

                let xItem = item.drawitem.x;
                let yItem = item.drawitem.y;
                
                let width = item.image.canvasWidth;
                let height = item.image.canvasHeight;

                let canvasWidth = item.image.canvasWidth;
                let canvasHeight = item.image.canvasHeight;

                if(item.drawitem.zoom) 
                {
                    width *= sketch._Scale;
                    height *= sketch._Scale;
                }

                //x 최소
                if(xItem + sketch.pointX + offsetX > 0) {

                    sketch.pointX = 0;
                    offsetX = 0;
                }
                //x 최대 ( 현재 확대 이동 된 크기 )
                else if(width + sketch.pointX + offsetX < canvasWidth) {
                    let subOffsetX = canvasWidth - (width + sketch.pointX + offsetX);

                    //pointX = 0;
                    offsetX += subOffsetX;
                }
                // else if(width + sketch.pointX + offsetX < canvas.width) {
                //     let subOffsetX = canvas.width - (width + sketch.pointX + offsetX);

                //     //pointX = 0;
                //     offsetX += subOffsetX;
                // }

                //y 최소
                if(yItem + sketch.pointY + offsetY > 0) {
                    sketch.pointY = 0;
                    offsetY = 0;
                }
                //y 최대 
                else if (height + sketch.pointY + offsetY < canvasHeight) {
                    let subOffsetY = canvasHeight - (height + sketch.pointY + offsetY);
                    offsetY += subOffsetY;
                }
                // else if (height + sketch.pointY + offsetY < canvas.height) {
                //     let subOffsetY = canvas.height - (height + sketch.pointY + offsetY);
                //     offsetY += subOffsetY;
                // }
            }

            sketch.pointX += offsetX;
            sketch.pointY += offsetY;

            sketch.Scales = [];

            sketch.DrawSketch();
        }

        canvas.addEventListener('wheel' , onMouseWheel);
        canvas.addEventListener('mousedown' , onMouseDown);
        canvas.addEventListener('mouseup' , onMouseUp);
        canvas.addEventListener('mousemove' , onMouseMove);

        /**
         * 이미지 지정
         * @param {String} src 이미지 경로
         */
        this.SetImage = function(src, jsonData){

            // if (src.includes('.tif') || src.includes('.tiff')){
            //     const xhr = new XMLHttpRequest();
            //     xhr.open('GET', src);
            //     xhr.responseType = 'arraybuffer';

            //     xhr.onload = function() {
            //         const buffer = xhr.response;

            //         //let byteArray = new Uint8Array(buffer);
            //         //let blob = new Blob([byteArray], {type: "image/png"});    
            //         //;

            //         const tiff = new Tiff({ buffer : buffer });
            //         let tiffCanvas = tiff.toCanvas();

            //         let imgWidth = tiff.width();
            //         let imgHeight = tiff.height();

            //         const png = tiffCanvas.toDataURL('image/png');
            //         const img = new Image();
            //         let item = sketch.SketchItem();

            //         let buttonsHeight = document.getElementsByClassName('VIZWeb3D_Buttons')[0].clientHeight;

            //         let loaded = false;
            //         let setCanvas = function () {
                        

            //             if (tiffCanvas) {
                            
            //                 let imageObj = undefined;

            //                 if(loaded !== true)
            //                     img.src = png;
            //                 else
            //                     calc(imageObj);

            //                 _Image = img;
    
            //                 img.onload = function () {
            //                     loaded = true;
            //                     imageObj = this;
            //                     calc(imageObj);
            //                 };
            //             }
            //         };

            //         setCanvas();
            //         // lastWidth = canvas.width;
            //         // lastHeight = canvas.height;

            //         sketch.SketchItems.push(item);
            //         sketch.DrawSketch();

            //         window.addEventListener("resize", function () {
                        
            //             setCanvas();
            //             setSketchScale(canvas.width / lastWidth, canvas.height / lastHeight);

            //             lastWidth = canvas.width;
            //             lastHeight = canvas.height;
            //             sketch.DrawSketch();

            //             // 저장할때 canvs * lastwidth 
            //         });

            //         let calc = function() {
            //             let width = window.innerWidth;
            //             let height = window.innerHeight - 60;

            //             imgScale = 1;
            //             canvasScale = 1;

            //             if (imgWidth > imgHeight) {
            //                 imgScale = imgHeight / imgWidth;
            //                 if(window.innerWidth > window.innerHeight){
            //                     canvasScale = window.innerWidth / imgWidth;
            //                     width = imgWidth * imgScale * canvasScale;
            //                 } else {
            //                     canvasScale = (window.innerHeight - buttonsHeight) / imgHeight;
            //                     height = imgHeight * imgScale * canvasScale;
            //                 }
            //             } else {
            //                 imgScale = imgWidth / imgHeight;
            //                 if(window.innerWidth > window.innerHeight){
            //                     canvasScale = window.innerWidth / imgWidth;
            //                     width = imgWidth * imgScale * canvasScale;
            //                 } else {
            //                     canvasScale = (window.innerHeight - buttonsHeight) / imgHeight;
            //                     height = imgHeight * imgScale * canvasScale;
            //                 }
            //             }

            //             // console.log('LoadImag', width, height)

            //             if (lastVlaueFlag) {
            //                 lastWidth = width;
            //                 lastHeight = height;
            //                 lastVlaueFlag = false;
            //             }

            //             canvas.width = width;
            //             canvas.height = height;

            //             //캔버스 중앙 정렬
            //             canvas.style.left = (window.innerWidth - width)/2  + "px";
            //             canvas.style.top = (window.innerHeight - height + buttonsHeight)/2  + "px";

            //             item.image.item = _Image;
            //             item.image.src = png;
            //             item.image.width = imgWidth;
            //             item.image.height = imgHeight;
            //             item.image.canvasWidth = canvas.width;
            //             item.image.canvasHeight = canvas.height;
            //             item.drawitem.zoom = true;
            //             sketch.DrawSketch();
            //         };
            //     }
            //     xhr.send();
            // } else 
            {
                const img = new Image();
                    // let imgWidth = this.naturalWidth;
                    // let imgHeight = this.naturalHeight;
                let item = sketch.SketchItem();
                //console.log(jsonData)
                let buttonsHeight = document.getElementsByClassName('VIZWeb3D_Buttons')[0].clientHeight;
                
                let loaded = false;
                let imageObj = undefined;
                let setCanvas = function () {

                    
                    // let viewWidth = window.innerWidth;
                    // let viewHeight =window.innerHeight - buttonsHeight;
                    
                    // let width = window.innerWidth;
                    // let height = window.innerHeight - buttonsHeight;

                    let view = sketch.canvas.parentNode;

                    let viewWidth = view.clientWidth;
                    let viewHeight = view.clientHeight - buttonsHeight;
                    
                    let width = view.clientWidth;
                    let height = view.clientHeight - buttonsHeight;

                    imgScale = 1;
                    canvasScale = 1;

                    let calc = function(image) {
                        let imgWidth = image.naturalWidth;
                        let imgHeight = image.naturalHeight;


                        let ratWidth = width / imgWidth;
                        let ratHeight = height / imgHeight;

                        if(ratWidth > ratHeight) {
                            // 세로 기준으로 
                            width = imgWidth * ratHeight;
                            height = imgHeight * ratHeight;
                        }
                        else {
                            width = imgWidth * ratWidth;
                            height = imgHeight * ratWidth;
                        }
 
                        item.image.item = _Image;
                        item.image.src = src;
                        item.image.width = imgWidth;
                        item.image.height = imgHeight;
                        item.image.canvasWidth = width;
                        item.image.canvasHeight = height;
                        item.drawitem.zoom = true;

                        
                        canvas.width = width;
                        canvas.height = height;


                        canvas.style.left = ((viewWidth - canvas.width) / 2) + "px";
                        canvas.style.top = ((viewHeight - canvas.height) / 2) + buttonsHeight + "px";


                        //

                        // if (imgWidth > imgHeight) {
                        //     imgScale = imgHeight / imgWidth;
                        //     if (window.innerWidth > window.innerHeight) {
                        //         canvasScale = window.innerWidth / imgWidth;
                        //         width = imgWidth * imgScale * canvasScale;
                        //     } else {
                        //         canvasScale = (window.innerHeight - buttonsHeight) / imgHeight;
                        //         height = imgHeight * imgScale * canvasScale;
                        //     }
                        // } 
                        // else {
                        //     imgScale = imgWidth / imgHeight;
                        //     if (window.innerWidth > window.innerHeight) {
                        //         canvasScale = window.innerWidth / imgWidth;
                        //         width = imgWidth * imgScale * canvasScale;
                        //     } else {
                        //         canvasScale = (window.innerHeight - buttonsHeight) / imgHeight;
                        //         height = imgHeight * imgScale * canvasScale;
                        //     }
                        // }

                        // console.log('LoadImag', width, height)

                        // canvas.width = width;
                        // canvas.height = height;
                        
                        if (lastVlaueFlag) {
                            lastWidth = canvas.width;
                            lastHeight = canvas.height;
                            lastVlaueFlag = false;
                        }
                        
                        // item.image.item = _Image;
                        // item.image.src = src;
                        // item.image.width = imgWidth;
                        // item.image.height = imgHeight;
                        // item.image.canvasWidth = canvas.width;
                        // item.image.canvasHeight = canvas.height;
                        // item.drawitem.zoom = true;
                        sketch.DrawSketch();

                        //캔버스 중앙 정렬
                        //canvas.style.left = (window.innerWidth - width) / 2 + "px";
                        //canvas.style.top = (window.innerHeight - height + buttonsHeight) / 2 + "px";
                    }
                    
                    if(loaded !== true)
                        img.src = src;
                    else
                        calc(imageObj);

                    _Image = img;

                    img.onload = function () {
                        loaded = true;
                        imageObj = this;
                        calc(imageObj);
                    }
                };

                setCanvas();

                // lastWidth = canvas.width;
                // lastHeight = canvas.height;

                //console.log('last', lastWidth, lastHeight)

                sketch.SketchItems.push(item);
                
                if (jsonData) {
                    for (let i = 1; i < jsonData.length; i++) {
                        const Data = jsonData[i];
                        sketch.SketchItems.push(Data);
                        //console.log(Data);
                    }
                }

                sketch.DrawSketch();

                window.addEventListener("resize", function () {
                    // 리사이즈 할때 크기 새로 계산해서 그리기
                    setCanvas();
                    // 리사이즈 할때 크기 만큼 계산 해서 스케치 다시 그리기
                    setSketchScale(canvas.width / lastWidth, canvas.height / lastHeight);

                    lastWidth = canvas.width;
                    lastHeight = canvas.height;
                    sketch.DrawSketch();
                });

                

                // const img = new Image();
    
                // img.src = src;
                // _Image = img;

                // img.onload = function () {
                //     canvas.width = this.naturalWidth;
                //     canvas.height = this.naturalHeight;
                //     let item = sketch.SketchItem();
                //     item.image.item = _Image;
                //     item.image.src = src;
                //     item.image.width = img.naturalWidth;
                //     item.image.height = img.naturalHeight;
                //     item.drawitem.zoom = true;
                //     sketch.SketchItems.push(item);
                //     sketch.DrawSketch();
                // }
            }
        };

        function setSketchScale(xScale, yScale) {
            // 그린거에 대한 좌표 값에 스케일 값을 곱해줘서 리사이즈된 만큼 좌표를 수정해준다.

            // console.log("X : " + xScale + ", Y : " + yScale);

            sketch.pointX *= xScale;
            sketch.pointY *= yScale;

            for(let i = 0 ;i < sketch.SketchItems.length ; i++ ) {
                let item = sketch.SketchItems[i];
                if(!item.visible) continue;

                // 이미지 그리기
                if(item.image.item !== undefined) {
                    //item.image.pointX = item.image.pointX * xScale;
                    //item.image.pointY = item.image.pointY * yScale;

                    continue;
                }

                // 브러쉬
                if (item.brush.position.length > 0) {
                    for (let i = 0; i < item.brush.position.length; i++) {
                        const brushPosition = item.brush.position[i];

                        for (let j = 0; j < brushPosition.length; j++) {
                            // mouseMove Position
                            let brushPosX = brushPosition[j].x * xScale;
                            let brushPosY = brushPosition[j].y * yScale;

                            brushPosition[j].x = brushPosX;
                            brushPosition[j].y = brushPosY;
                        }
                    }
                }

                // 선
                if (item.line.position.length > 0) {

                    for (let i = 0; i < item.line.position.length; i++) {
                        const linePosition = item.line.position[i];
                        const linePositionend = item.line.position[i];

                        // linePosition[0].x *= xScale;
                        // linePosition[0].y *= yScale;

                        // linePositionend[linePosition.length - 1].x *= xScale;
                        // linePositionend[linePosition.length - 1].y *= yScale;

                        let startX = linePosition[0].x * xScale;
                        let startY = linePosition[0].y * yScale;

                        //console.log("itemPos :: ", startX, startY, xScale, yScale);

                        linePosition[0].x = startX;
                        linePosition[0].y = startY;

                        let endX = linePositionend[linePosition.length - 1].x * xScale;
                        let endY = linePositionend[linePosition.length - 1].y * yScale;

                        linePositionend[linePosition.length - 1].x = endX;
                        linePositionend[linePosition.length - 1].y = endY;
                    }

                }

                // 사각형
                if (item.square.position.length > 0) {
                    
                    for (let k = 0; k < item.square.position.length; k++) {
                        let squarePosition = item.square.position[k];

                        for (let j = 0; j < squarePosition.length; j++) {
                            let squarePosX = squarePosition[j].x * xScale;
                            let squarePosY = squarePosition[j].y * yScale;

                            squarePosition[j].x = squarePosX;
                            squarePosition[j].y = squarePosY;
                        }

                    }
                }

                // 원
                if (item.circle.position.length > 0) {
                    for (let i = 0; i < item.circle.position.length; i++) {
                        const circlePosition = item.circle.position[i];

                        for (let j = 0; j < circlePosition.length; j++) {
                            // mouseMove Position
                            let circlePosX = circlePosition[j].x * xScale;
                            let circlePosY = circlePosition[j].y * yScale;

                            circlePosition[j].x = circlePosX;
                            circlePosition[j].y = circlePosY;
                        }
                       
                    }
                }

                // 텍스트
                if (item.text.value != undefined) {
                    item.text.x *= xScale;
                    item.text.y *= yScale;
                }
            }


            // scope.scale.width = xScale;
            // scope.scale.height = yScale;
        };

        this.PanMode = function() {
            if (sketch.PanMode) {
                sketch.PanMode = false;
                canvas.style.cursor = 'default'
                // document.getElementById('btnPanModeImg').src = './VIZCore/Resource/icon/VIZWeb3D_FDMS_Pan.png';
                // document.getElementById('btnPanMode').classList.remove('btnImgSelect');
                sketch.SetMode();
            } else {
                sketch.PanMode = true;
                canvas.style.cursor = 'grab';
                // document.getElementById('btnPanModeImg').src = './VIZCore/Resource/icon/VIZWeb3D_FDMS_Pan_2.png';
                // document.getElementById('btnPanMode').classList.add('btnImgSelect');
                sketch.SetMode(sketch.Enum.Mode.Pan);
            }

            if (sketch.oldMode !== undefined && sketch.oldMode.Mode !== this.Mode) {
                sketch.oldMode.DrawEnd();
            }
        }

        function LoadTiff(src) {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', src);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function() {
                const buffer = xhr.response;
                const tiff = new Tiff({ buffer : buffer });
                let canvas = tiff.toCanvas();
                if (canvas) {
                    const imageURL = canvas.toDataURL();
                    const blobData = dataURLtoBlob(imageURL);
                    url = URL.createObjectURL(blobData);
                    _Image = url;
                }
            }
            xhr.send();
        }

        let tiffURLConvert = (src) => {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', src);
                xhr.responseType = 'arraybuffer';
                xhr.onload = function() {
                const buffer = xhr.response;
                const tiff = new Tiff({ buffer : buffer });
                let canvas = tiff.toCanvas();
                    if (canvas) {
                        const imageURL = canvas.toDataURL();
                        const blobData = dataURLtoBlob(imageURL);
                        const url = URL.createObjectURL(blobData);
                        resolve(url);
                    }
                }
                xhr.send();
            });
        };


        function dataURLtoBlob(dataurl) {
            let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1], bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new Blob([u8arr], {
                type: mime
            });
        };

    }
};

export default ImageControl;
