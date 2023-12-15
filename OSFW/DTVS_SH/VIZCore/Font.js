/**
 * @author ssjo@softhills.net
 */

class Font {
    constructor(view, VIZCore) {

        let scope = this;

        //폰트 텍스처를 생성하기 위한 캔버스
        let ctxFontCanvas = undefined;

        // 폰트 텍스처 관리 정보
        let listFontTexture = [];

        let fontTextureMaxID = 1;
        let fontTextureSize = 1024;
        let fontTextureUVOffset = 4 / fontTextureSize;  //font 단위 간격

        /**
         * font style
         */
        this.FontStyleItem = function () {
            let style =
            {
                font: {
                    face: "Arial",
                    size: 30,
                    color: new VIZCore.Color(0, 0, 0, 255)
                },
                border: {
                    enable: true,
                    color: new VIZCore.Color(0, 0, 0, 255),
                    thickness: 1,
                    type: 0, // 0 : rect, 1 : roundrect
                    round: 5,
                    offset: 5
                },
                background: {
                    enable: true,
                    color: new VIZCore.Color(255, 255, 255, 255)
                }
            };
            return style;
        };

        /**
         * 반환
         * @param {number} idx1 listFontTexture idx
         * @param {number} idx2 fontInfo idx 
         * @returns 
         */
        let ResultDrawTextureItem = function (idx1, idx2) {
            let item = {
                id: listFontTexture[idx1].id,

                //gl texture
                targetTexture: listFontTexture[idx1].targetTexture,

                //texture 크기
                width: listFontTexture[idx1].width,
                height: listFontTexture[idx1].height,

                fontInfo: listFontTexture[idx1].fontInfo[idx2]
            };

            item.fontInfo.useCache = true;
            return item;
        };

        /**
         * 폰트 텍스처 관리
         * @returns 
         */
        let FontTextureItem = function () {
            let item = {
                id: 0,

                //gl texture
                targetTexture: 0,

                //texture 크기
                width: 1024,
                height: 1024,

                //texture 에 그려진 font 정보
                fontInfo: [] //FontInfoItem
            };
            return item;
        };

        /**
         * 텍스처 폰트정보
         */
        let FontInfoItem = function () {
            let item = {

                //그리기 위치 정보
                x: 0,
                y: 0,
                //그리기 범위 정보
                u: 0,
                v: 0,

                //텍스트 
                text: [], //Array<string>

                style: scope.FontStyleItem(),

                useCache: true, //제거 여부 확인용

            };
            return item;
        };

        //#region Function
        init();
        /**
        * 코드 초기화
        */
        function init() {

            if (ctxFontCanvas === undefined) {
                let canvas = document.createElement('canvas');
                canvas.id = view.GetViewID() + "FontCanvas";

                ctxFontCanvas = canvas.getContext("2d");
                ctxFontCanvas.imageSmoothingEnabled = false;
                ctxFontCanvas.textAlign = "center";

                ctxFontCanvas.canvas.width = fontTextureSize;
                ctxFontCanvas.canvas.height = fontTextureSize;

                //테스트용
                view.Container.appendChild(canvas);
            }

            fontTextureMaxID = 1;
        }


        /**
         * Texture 정보 개체 반환
         * @param {number} id 
         * @returns FontTextureItem
         */
        this.GetFontTextureItem = function (id) {
            for (let i = listFontTexture.length - 1; i >= 0; i--) {
                if (listFontTexture[i].id !== id) continue;

                return listFontTexture[i];
            }

            return undefined;
        };

        /**
         * 모든 폰트 제거
         */
        this.Clear = function () {
            for (let i = listFontTexture.length - 1; i >= 0; i--) {
                if (listFontTexture[i].texture !== 0)
                    view.gl.deleteTexture(listFontTexture[i].texture);

                listFontTexture.splice(i, 1);
            }

            fontTextureMaxID = 1;
        };

        /**
         * 폰트 사용하지 않는 경우 제거 대기
         */
        this.BeginFontCache = function () {

            for (let i = listFontTexture.length - 1; i >= 0; i--) {
                for (let j = listFontTexture[i].fontInfo.length - 1; j >= 0; j--) {
                    listFontTexture[i].fontInfo[j].useCache = false;
                }
            }

        };

        /** 
         * 폰트 사용하지 않는 경우 제거
        */
        this.EndFontCache = function () {

            for (let i = listFontTexture.length - 1; i >= 0; i--) {

                let bDeleteFont = false;
                for (let j = listFontTexture[i].fontInfo.length - 1; j >= 0; j--) {
                    if (listFontTexture[i].fontInfo[j].useCache) continue;

                    bDeleteFont = true;
                    listFontTexture[i].fontInfo.splice(j, 1);
                }

                if (listFontTexture[i].fontInfo.length === 0) {
                    if (listFontTexture[i].texture !== 0)
                        view.gl.deleteTexture(listFontTexture[i].texture);

                    listFontTexture.splice(i, 1);
                }
                else if (bDeleteFont) {
                    updateFontTexture(i, true);
                }
            }

        };

        //예제코드
        function generateFaceText(ctx, width, height, faceColor, textColor, text) {

            //예제
            // Upload the canvas to the cubemap face.
            //var texture = gl.createTexture();
            //gl.bindTexture(target, texture);
            //scope.GenerateFaceText(ctx, 128, 128, "#000000", "#FFFFFFF", "Test");
            //const level = 0;
            //const internalFormat = gl.RGBA;
            //const format = gl.RGBA;
            //const type = gl.UNSIGNED_BYTE;
            //gl.texImage2D(target, level, internalFormat, format, type, ctx.canvas);//
            //gl.generateMipmap(target); //gl.TEXTURE_CUBE_MAP
            //gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

            //texture size
            ctx.canvas.width = 128;
            ctx.canvas.height = 128;

            //const {width, height} = ctx.canvas;
            ctx.fillStyle = faceColor;
            ctx.fillRect(0, 0, width, height);
            //ctx.font = `${width * 0.7}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = textColor;
            ctx.fillText(text, width / 2, height / 2);
        }

        /**
         * 
         * @param {Array<string>} arrText 
         * @param {*} styleFont  { face, size, color, bold }
         * @param {*} styleBorder  { enable, color, thickness, type, round, offset }
         * @param {*} styleBg  { enable, color }
         * 
         * FontStyleItem() 참고
            font: {
                    face: "Arial",
                    size: 12,
                    color: new VIZCore.Color()
                },
            border: {
                    enable: true,
                    color: new VIZCore.Color(),
                    thickness: 1,
                    type: 0, // 0 : rect, 1 : roundrect
                    round: 5,
                    offset: 5
                },
            background: {
                enable: true,
                color: new VIZCore.Color()
            },
         */
        function generateFaceTextByStyle(arrText, styleFont, styleBorder, styleBg) {

            //그리기 위치 및 영역
            let x = 0;
            let y = 0;

            let u = 0;
            let v = 0;

            ctxFontCanvas.font = view.Renderer.Util.GetFontString(styleFont);
            const metrics = view.Renderer.Util.GetTextMetricsByFont(ctxFontCanvas, arrText, styleFont);

            let srcWidth = metrics.width + styleBorder.offset * 2;
            let srcHeight = metrics.height * arrText.length + styleBorder.offset * 2;

            //texture size
            //ctxFontCanvas.canvas.width = srcWidth;
            //ctxFontCanvas.canvas.height = srcHeight;

            let srcU = srcWidth / fontTextureSize;
            let srcV = srcHeight / fontTextureSize;

            //texture 사이즈
            let texWidth = fontTextureSize;
            let texHeight = fontTextureSize;

            //기존 데이터에서 영역 확인
            let idx1 = -1;
            let idx2 = -1;

            //찾은 그리기 영역
            let xFind = fontTextureUVOffset;
            let yFind = fontTextureUVOffset;

            let xMax = 0;
            let yMax = 0;

            let yLast = 0;

            let bFindTexture = false;
            if (srcU < 1 && srcV < 1) {
                for (let i = 0; i < listFontTexture.length; i++) {
                    xFind = fontTextureUVOffset;
                    yFind = fontTextureUVOffset;

                    xMax = 0;
                    yMax = 0;

                    yLast = fontTextureUVOffset;

                    for (let j = 0; j < listFontTexture[i].fontInfo.length; j++) {
                        let fontInfo = listFontTexture[i].fontInfo[j];

                        xFind = fontInfo.x + fontInfo.u;
                        yFind = fontInfo.y + fontInfo.v;

                        xMax = Math.max(xFind, xMax);
                        yMax = Math.max(yFind, yMax);

                        if (yMax + srcV > 1.0) {
                            //해당 이미지영역에서는 더 이상 그릴 영역이 없음
                            break;
                        }

                        // width 범위 벗어남.
                        // 다음 이미지 범위 찾기
                        if (xMax + srcU > 1.0) {
                            //신규 위치 기준
                            xMax = 0;
                            yLast = yMax + fontTextureUVOffset;
                            continue;
                        }
                        else if (fontInfo.y !== yLast) {
                            //넘어가는 개체 기준
                            xMax = 0;
                            yLast = yMax;
                            continue;
                        }

                        yLast = fontInfo.y;

                        //idx1 = i;
                        //idx2 = j;
                    }

                    //이미지 영역 안에 있으므로 가능
                    if (xMax + fontTextureUVOffset + srcU <= 1.0 && yMax + fontTextureUVOffset + srcV <= 1.0) {
                        idx1 = i;
                        idx2 = -1;
                        bFindTexture = true;

                        xFind = xMax + fontTextureUVOffset;
                        yFind = yLast;

                        //추가하는 영역 위치 재설정
                        //가로 먼저 확인하여 넘어가는 경우 다음 줄에 추가
                        if (xFind + srcU > 1.0) {
                            xFind = fontTextureUVOffset;
                            yFind = yMax + fontTextureUVOffset;   //다음줄
                        }

                        break;
                    }

                    //if(idx1 >= 0 && idx2 >= 0) break;
                }
            }
            else {
                // 크기가 큰 폰트이므로 따로 생성
                //1024를 벗어나 갱신
                xFind = 4 / srcWidth;
                yFind = 4 / srcHeight;


                texWidth = srcWidth + 4 * 4;
                texHeight = srcHeight + 4 * 4;

                srcU = (srcWidth / texWidth) + (1 / texWidth);
                srcV = srcHeight / texHeight;
            }

            if (!bFindTexture) {
                //신규 생성
                xFind = fontTextureUVOffset;
                yFind = fontTextureUVOffset;

                let fontItem = FontTextureItem();
                fontItem.id = fontTextureMaxID; fontTextureMaxID++;
                fontItem.width = texWidth;
                fontItem.height = texHeight;

                listFontTexture.push(fontItem);

                idx1 = listFontTexture.length - 1;
            }

            // 간격
            x = xFind; //uv x offset
            y = yFind; //uv y offset
            u = srcU;  //uv u
            v = srcV;  //uv v

            //1024 보다 작으면 다른 텍스처와 함께 저장
            //기존 폰트 텍스쳐 정보 관리

            //그리기           
            if (idx2 < 0) {
                // 신규 텍스트 영역추가
                let fontInfo = FontInfoItem();

                fontInfo.x = x;
                fontInfo.y = y;

                fontInfo.u = u;
                fontInfo.v = v;

                fontInfo.text.push(...arrText);

                //fontInfo.style 정보 등록

                //Font
                fontInfo.style.font.face = styleFont.face;
                fontInfo.style.font.size = styleFont.size;
                fontInfo.style.font.color.copy(styleFont.color);

                //border
                fontInfo.style.border.enable = styleBorder.enable;
                fontInfo.style.border.thickness = styleBorder.thickness;
                fontInfo.style.border.color.copy(styleBorder.color);
                fontInfo.style.border.type = styleBorder.type;
                fontInfo.style.border.round = styleBorder.round;
                fontInfo.style.border.offset = styleBorder.offset;

                //background
                fontInfo.style.background.enable = styleBg.enable;
                fontInfo.style.background.round = styleBg.round;
                fontInfo.style.background.color.copy(styleBg.color);

                listFontTexture[idx1].fontInfo.push(fontInfo);
                idx2 = listFontTexture[idx1].fontInfo.length - 1;
            }

            updateFontTexture(idx1, false);

            return ResultDrawTextureItem(idx1, idx2);
        }

        /**
         * texture 업데이트
         * @param {Number} idx1 listFontTexture idx
         * @param {boolean} posAlign texture pos, uv 업데이트 여부
         */
        function updateFontTexture(idx1, posAlign) {

            if (listFontTexture[idx1].width === ctxFontCanvas.canvas.width &&
                listFontTexture[idx1].height === ctxFontCanvas.canvas.height) {
                ctxFontCanvas.clearRect(0, 0, ctxFontCanvas.canvas.width, ctxFontCanvas.canvas.height);
            }
            else {
                ctxFontCanvas.canvas.width = listFontTexture[idx1].width;
                ctxFontCanvas.canvas.height = listFontTexture[idx1].height;
                ctxFontCanvas.clearRect(0, 0, ctxFontCanvas.canvas.width, ctxFontCanvas.canvas.height);
            }

            if (listFontTexture[idx1].targetTexture !== 0) {
                view.gl.deleteTexture(listFontTexture[idx1].targetTexture);
            }

            //texture 새로 추가
            let targetTexture = view.gl.createTexture();
            view.gl.bindTexture(view.gl.TEXTURE_2D, targetTexture);

            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_MIN_FILTER, view.gl.NEAREST); //view.gl.LINEAR NEAREST
            //view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_MIN_FILTER, view.gl.LINEAR); //view.gl.LINEAR NEAREST
            //view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_MAG_FILTER, view.gl.NEAREST);
            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_MAG_FILTER, view.gl.LINEAR);
            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_WRAP_S, view.gl.CLAMP_TO_EDGE); //CLAMP REPEAT
            view.gl.texParameteri(view.gl.TEXTURE_2D, view.gl.TEXTURE_WRAP_T, view.gl.CLAMP_TO_EDGE); //CLAMP REPEAT
            //view.gl.generateMipmap(view.gl.TEXTURE_2D);

            listFontTexture[idx1].targetTexture = targetTexture;

            //찾은 그리기 영역
            let xFind = 0;
            let yFind = 0;

            let yMax = 0;

            let xLast = 0;
            let yLast = fontTextureUVOffset;

            //신규 texture 영역에 폰트 그리기
            for (let fi = 0; fi < listFontTexture[idx1].fontInfo.length; fi++) {
                let fontInfo = listFontTexture[idx1].fontInfo[fi];
                fontInfo.useCache = true;

                const metrics = view.Renderer.Util.GetTextMetricsByFont(ctxFontCanvas, fontInfo.text, fontInfo.style.font);

                let txtWidth = metrics.width + fontInfo.style.border.offset * 2;
                let txtHeight = metrics.height * fontInfo.text.length + fontInfo.style.border.offset * 2;

                //위치 재정렬
                if (posAlign) {
                    //UV 변경사항 없음
                    let srcU = fontInfo.u;
                    let srcV = fontInfo.v;

                    if (xLast + srcU + fontTextureUVOffset > 1.0) {
                        // width 범위 벗어남.

                        xFind = fontTextureUVOffset;
                        yFind = yMax + fontTextureUVOffset;

                        xLast = xFind;
                        yLast = yFind;
                    }
                    else {
                        xFind = xLast + fontTextureUVOffset;
                        yFind = yLast;
                    }

                    fontInfo.x = xFind;
                    fontInfo.y = yFind;

                    xLast = xFind + srcU;
                    yLast = yFind;

                    //다음 위치에 대한 max값 계산
                    yMax = Math.max(yFind + srcV, yMax);

                }

                let xDraw = fontInfo.x * listFontTexture[idx1].width;
                let yDraw = fontInfo.y * listFontTexture[idx1].height;

                //background 여부
                if (fontInfo.style.background.enable) {
                    // background color
                    ctxFontCanvas.fillStyle = "rgba(" + fontInfo.style.background.color.r + "," + fontInfo.style.background.color.g + ","
                        + fontInfo.style.background.color.b + "," + fontInfo.style.background.color.glAlpha() + ")";
                }
                else {
                    ctxFontCanvas.fillStyle = "rgba(" + fontInfo.style.background.color.r + "," + fontInfo.style.background.color.g + ","
                        + fontInfo.style.background.color.b + ", 0)";
                }

                if (fontInfo.style.border.enable) {
                    // border color
                    ctxFontCanvas.strokeStyle = "rgba(" + fontInfo.style.border.color.r + "," + fontInfo.style.border.color.g + ","
                        + fontInfo.style.border.color.b + "," + fontInfo.style.border.color.glAlpha() + ")";
                    ctxFontCanvas.lineWidth = fontInfo.style.border.thickness;
                }
                else {
                    // border color
                    ctxFontCanvas.strokeStyle = "rgba(" + fontInfo.style.border.color.r + "," + fontInfo.style.border.color.g + ","
                        + fontInfo.style.border.color.b + "," + 0 + ")";
                    ctxFontCanvas.lineWidth = fontInfo.style.border.thickness;
                }

                // 박스 그리기
                {
                    if (fontInfo.style.border.type === 0)
                        view.Renderer.Util.DrawRect(ctxFontCanvas, xDraw, yDraw, txtWidth, txtHeight, fontInfo.style.background.enable, fontInfo.style.border.enable);
                    else if (fontInfo.style.border.type === 1)
                        view.Renderer.Util.DrawRoundRect(ctxFontCanvas, xDraw, yDraw, txtWidth, txtHeight, fontInfo.style.border.round, fontInfo.style.background.enable, fontInfo.style.border.enable);
                }

                //text center offset
                xDraw += fontInfo.style.border.offset;
                yDraw += fontInfo.style.border.offset;

                ctxFontCanvas.font = view.Renderer.Util.GetFontString(fontInfo.style.font);
                ctxFontCanvas.fillStyle = "rgba(" + fontInfo.style.font.color.r + "," + fontInfo.style.font.color.g + ","
                    + fontInfo.style.font.color.b + "," + fontInfo.style.font.color.glAlpha() + ")";

                //그리기
                for (let i = 0; i < fontInfo.text.length; i++) {
                    ctxFontCanvas.fillText(fontInfo.text[i], xDraw, yDraw + (metrics.ascent * i + metrics.ascent + fontInfo.style.border.offset * i));
                }
            }

            //Texture 등록
            view.gl.bindTexture(view.gl.TEXTURE_2D, targetTexture);
            view.gl.texImage2D(view.gl.TEXTURE_2D, 0, view.gl.RGBA, view.gl.RGBA, view.gl.UNSIGNED_BYTE, ctxFontCanvas.canvas);

            view.gl.bindTexture(view.gl.TEXTURE_2D, null);

            //view.gl.disable(view.gl.BLEND);
        }

        /**
         * 텍스트를 그리기 위한 GL Texture 반환
         * @param {*} arrText 
         * @param {*} styleFont 
         * @param {*} styleBorder 
         * @param {*} styleBg 
         * @returns ResultDrawTextureItem
         */
        this.GetFontData = function (arrText, styleFont, styleBorder, styleBg) {
            //기존 데이터에서 영역 확인
            for (let i = 0; i < listFontTexture.length; i++) {
                for (let j = 0; j < listFontTexture[i].fontInfo.length; j++) {
                    let fontInfo = listFontTexture[i].fontInfo[j];

                    //text 비교
                    if (fontInfo.text.length !== arrText.length) continue;

                    let bCompare = true;
                    for (let k = 0; k < fontInfo.text.length; k++) {
                        if (fontInfo.text[k].localeCompare(arrText[k]) === 0) continue;

                        bCompare = false;
                        break;
                    }
                    if (!bCompare) continue;

                    //style 비교
                    if (fontInfo.style.font.size !== styleFont.size) continue;
                    if (fontInfo.style.font.face.localeCompare(styleFont.face) !== 0) continue;

                    if (styleBorder !== undefined) {
                        if (fontInfo.style.border.enable !== styleBorder.enable) continue;
                        if (fontInfo.style.border.thickness !== styleBorder.thickness) continue;
                        if (fontInfo.style.border.type !== styleBorder.type) continue;
                        if (fontInfo.style.border.round !== styleBorder.round) continue;
                        if (!fontInfo.style.border.color.equals(styleBorder.color)) continue;
                    }
                    else {
                        if (fontInfo.style.border.enable) continue;
                    }

                    if (styleBg !== undefined) {
                        if (fontInfo.style.background.enable !== styleBg.enable) continue;
                        if (!fontInfo.style.background.color.equals(styleBg.color)) continue;
                    }
                    else {
                        if (fontInfo.style.background.enable) continue;
                    }

                    return ResultDrawTextureItem(i, j);
                }
            }


            return generateFaceTextByStyle(arrText, styleFont, styleBorder, styleBg)
        };


        /**
         * toycar 위치 폰트 그리기 테스트
         */
        this.DEBUG_RenderFont = function () {
            let szText = [];
            let styleItem = view.Font.FontStyleItem();
            let fontItem = undefined;

            for (let i = 0; i < 20; i++) {
                szText = [];
                fontItem = undefined;

                szText.push("TEST_" + i);
                fontItem = view.Font.GetFontData(szText, styleItem.font, styleItem.border, styleItem.background);
                //fontItem = undefined;
                if (fontItem !== undefined) {
                    view.gl.enable(view.gl.BLEND);
                    view.gl.blendFunc(view.gl.SRC_ALPHA, view.gl.ONE_MINUS_SRC_ALPHA);

                    view.gl.enable(view.gl.DEPTH_TEST);

                    view.Shader.BeginShader(VIZCore.Enum.SHADER_TYPES.TEXTURE2D);

                    const matMVMatrix = new VIZCore.Matrix4().copy(view.Camera.matMV);
                    const matMVP = new VIZCore.Matrix4().copy(view.Camera.matMVP);

                    //view.Shader.SetGLLight();
                    view.Shader.SetClipping(undefined); //단면처리 제외

                    view.Shader.SetMatrix(matMVP, matMVMatrix);
                    view.Shader.SetGLColor(1.0, 1.0, 1.0, 1.0);

                    view.Shader.SetCurrentTexture("u_Texture", view.gl.TEXTURE_2D, fontItem.targetTexture);

                    let position = [
                        -25.0 + i * 2, -23.0, 5.0,
                        -23.0 + i * 2, -23.0, 5.0,
                        -25.0 + i * 2, -25.0, 5.0,
                        -23.0 + i * 2, -25.0, 5.0
                    ];

                    let uv = [
                        fontItem.fontInfo.x, fontItem.fontInfo.y,
                        fontItem.fontInfo.x + fontItem.fontInfo.u, fontItem.fontInfo.y,
                        fontItem.fontInfo.x, fontItem.fontInfo.y + fontItem.fontInfo.v,
                        fontItem.fontInfo.x + fontItem.fontInfo.u, fontItem.fontInfo.y + fontItem.fontInfo.v
                    ];

                    let positionBuffer = view.gl.createBuffer();
                    view.gl.bindBuffer(view.gl.ARRAY_BUFFER, positionBuffer);
                    view.gl.bufferData(view.gl.ARRAY_BUFFER, new Float32Array(position), view.gl.STATIC_DRAW);
                    view.gl.vertexAttribPointer(view.Shader.positionAttributeLocation, 3, view.gl.FLOAT, false, 0, 0);

                    let textureCoordBuffer = view.gl.createBuffer();
                    view.gl.bindBuffer(view.gl.ARRAY_BUFFER, textureCoordBuffer);
                    view.gl.bufferData(view.gl.ARRAY_BUFFER, new Float32Array(uv), view.gl.STATIC_DRAW);
                    view.gl.vertexAttribPointer(view.Shader.uvAttributeLocation, 2, view.gl.FLOAT, false, 0, 0);

                    view.gl.drawArrays(view.gl.TRIANGLE_STRIP, 0, 4);

                    view.Shader.EndShader();

                    view.gl.disable(view.gl.BLEND);
                    //gl.enable(gl.DEPTH_TEST);
                    //gl.depthMask(true);

                    view.gl.bindTexture(view.gl.TEXTURE_2D, null);
                    view.gl.deleteBuffer(positionBuffer);
                    view.gl.deleteBuffer(textureCoordBuffer);
                }
            }
        };

        this.listPMIFont = [];
        this.RenderPMIFont = function () {
            if(view.BMFont !== undefined)
            {
                view.BMFont.Render();
                return;
            }

            let szText = [];
            let styleItem = view.Font.FontStyleItem();
            styleItem.background.enable = false;
            styleItem.border.enable = false;
            let fontItem = undefined;

            for (let i = 0; i < scope.listPMIFont.length; i++) {
                let pmi = scope.listPMIFont[i];
                fontItem = undefined;
                szText = [];
                szText.push(pmi.m_apcText);
                // font 설정
                //styleItem.font.face = pmi.m_pcFontTypeFace[0];
                styleItem.font.color = new VIZCore.Color(pmi.m_adRGB[0][0] * 255, pmi.m_adRGB[0][1] * 255, pmi.m_adRGB[0][2] * 255, pmi.m_adRGB[0][3] * 255);
                //styleItem.font.color = new VIZCore.Color(255,0,0,255);
                styleItem.font.size = pmi.m_dFontHeight[0] * 5;

                fontItem = view.Font.GetFontData(szText, styleItem.font, styleItem.border, styleItem.background);
                //fontItem = undefined;
                if (fontItem !== undefined) {
                    view.gl.enable(view.gl.BLEND);
                    view.gl.blendFunc(view.gl.SRC_ALPHA, view.gl.ONE_MINUS_SRC_ALPHA);

                    view.gl.enable(view.gl.DEPTH_TEST);

                    view.Shader.BeginShader(VIZCore.Enum.SHADER_TYPES.TEXTURE2D);

                    const matMVMatrix = new VIZCore.Matrix4().copy(view.Camera.matMV);
                    const matMVP = new VIZCore.Matrix4().copy(view.Camera.matMVP);

                    //view.Shader.SetGLLight();
                    view.Shader.SetClipping(undefined); //단면처리 제외

                    view.Shader.SetMatrix(matMVP, matMVMatrix);
                    view.Shader.SetGLColor(1.0, 1.0, 1.0, 1.0);

                    view.Shader.SetCurrentTexture("u_Texture", view.gl.TEXTURE_2D, fontItem.targetTexture);

                    let posMin = new VIZCore.Vector3(
                        pmi.m_dLeftPoints[0][0] * 1000,
                        pmi.m_dLeftPoints[0][1] * 1000,
                        pmi.m_dLeftPoints[0][2] * 1000);
                    let posMax = new VIZCore.Vector3(
                        pmi.m_dRightPoints[0][0] * 1000,
                        pmi.m_dRightPoints[0][1] * 1000,
                        pmi.m_dRightPoints[0][2] * 1000
                    );

                    let transform = new VIZCore.Matrix4().set(
                        pmi.m_WorldMatrix[0][0],
                        pmi.m_WorldMatrix[0][1],
                        pmi.m_WorldMatrix[0][2],
                        pmi.m_WorldMatrix[0][3] * 1000,
                        pmi.m_WorldMatrix[0][4],
                        pmi.m_WorldMatrix[0][5],
                        pmi.m_WorldMatrix[0][6],
                        pmi.m_WorldMatrix[0][7] * 1000,
                        pmi.m_WorldMatrix[0][8],
                        pmi.m_WorldMatrix[0][9],
                        pmi.m_WorldMatrix[0][10],
                        pmi.m_WorldMatrix[0][11] * 1000,
                        pmi.m_WorldMatrix[0][12],
                        pmi.m_WorldMatrix[0][13] ,
                        pmi.m_WorldMatrix[0][14] ,
                        pmi.m_WorldMatrix[0][15],
                        pmi.m_WorldMatrix[0][16],
                    );
                    posMin = posMin.applyMatrix4(transform);
                    posMax = posMax.applyMatrix4(transform);

                    let bbox = new VIZCore.BBox().set(posMin, posMax);

                    // let position = [
                    //     -25.0 + i * 2, -23.0, 5.0,
                    //     -23.0 + i * 2, -23.0, 5.0,
                    //     -25.0 + i * 2, -25.0, 5.0,
                    //     -23.0 + i * 2, -25.0, 5.0
                    // ];
                    let position = [
                        bbox.min.x, bbox.max.y, bbox.min.z,
                        bbox.max.x, bbox.max.y, bbox.max.z,
                        bbox.min.x, bbox.min.y, bbox.max.z,
                        bbox.max.x, bbox.min.y, bbox.max.z
                    ];

                    let uv = [
                        fontItem.fontInfo.x, fontItem.fontInfo.y,
                        fontItem.fontInfo.x + fontItem.fontInfo.u, fontItem.fontInfo.y,
                        fontItem.fontInfo.x, fontItem.fontInfo.y + fontItem.fontInfo.v,
                        fontItem.fontInfo.x + fontItem.fontInfo.u, fontItem.fontInfo.y + fontItem.fontInfo.v
                    ];

                    let positionBuffer = view.gl.createBuffer();
                    view.gl.bindBuffer(view.gl.ARRAY_BUFFER, positionBuffer);
                    view.gl.bufferData(view.gl.ARRAY_BUFFER, new Float32Array(position), view.gl.STATIC_DRAW);
                    view.gl.vertexAttribPointer(view.Shader.positionAttributeLocation, 3, view.gl.FLOAT, false, 0, 0);

                    let textureCoordBuffer = view.gl.createBuffer();
                    view.gl.bindBuffer(view.gl.ARRAY_BUFFER, textureCoordBuffer);
                    view.gl.bufferData(view.gl.ARRAY_BUFFER, new Float32Array(uv), view.gl.STATIC_DRAW);
                    view.gl.vertexAttribPointer(view.Shader.uvAttributeLocation, 2, view.gl.FLOAT, false, 0, 0);

                    view.gl.drawArrays(view.gl.TRIANGLE_STRIP, 0, 4);

                    view.Shader.EndShader();

                    view.gl.disable(view.gl.BLEND);
                    //gl.enable(gl.DEPTH_TEST);
                    //gl.depthMask(true);

                    view.gl.bindTexture(view.gl.TEXTURE_2D, null);
                    view.gl.deleteBuffer(positionBuffer);
                    view.gl.deleteBuffer(textureCoordBuffer);
                }
            }
        };
        this.listEdge = [];
        //this.bInit = false;
        this.bInitPositionBuffer = [];
        this.bInitPosOffset = [];
        this.bInitPosColor = [];
        this.RenderEdge = function () {

            if(scope.listEdge.length === 0) return;

            //view.Shader.BeginShader(VIZCore.Enum.SHADER_TYPES.BASICLINES2D);
            view.Shader.BeginShader(VIZCore.Enum.SHADER_TYPES.BASIC3D);

            view.Shader.SetLineThickness(10);

            //Line
            //view.RenderWGL.SetGLDrawMode(view.gl.LINES);
            view.Shader.SetResolutionData();

            //Line
            //view.RenderWGL.SetGLDrawMode(view.gl.LINES);
            //view.Shader.SetLineThickness(10); //renderLineWidth
            //view.Shader.SetResolutionData();
            view.Shader.SetGLCameraData();

            //let testMVP = new VIZCore.Matrix4();
            let testMVP = new VIZCore.Matrix4().copy(view.Camera.matMVP);
            let testMV = new VIZCore.Matrix4().copy(view.Camera.matMV);
            view.Shader.SetMatrix(testMVP, testMV);

            
            if (scope.bInitPositionBuffer.length === 0) {

                let position = [];
                let positionBuffer = undefined;
                let offset = 0;
                

                let lastColor = undefined;
                for (let k = 0; k < scope.listEdge.length; k++) {
                    //if(k < 10 || k > 20)
                    //    continue;
                    //if(k > 1) continue; 

                    let edge = scope.listEdge[k];
                    let currentColor = new VIZCore.Color(edge.color[0] * 255, edge.color[1] * 255, edge.color[2] * 255, edge.color[3] * 255);
                    //let currentColor = new VIZCore.Color(0,0,0,255);
                   
                    if(lastColor === undefined) 
                    {
                        lastColor = currentColor;
                    }
                    
                    //이전의 색상과 다르므로 추가
                    if(offset > 0 && !currentColor.equals(lastColor) ) {
                        positionBuffer = view.gl.createBuffer();
                        view.gl.bindBuffer(view.gl.ARRAY_BUFFER, positionBuffer);
                        view.gl.bufferData(view.gl.ARRAY_BUFFER, new Float32Array(position), view.gl.STATIC_DRAW);
                        view.gl.bindBuffer(view.gl.ARRAY_BUFFER, null);

                        scope.bInitPositionBuffer.push(positionBuffer);                       
                        scope.bInitPosOffset.push(offset);
                        scope.bInitPosColor.push(new VIZCore.Color().copy(lastColor));

                        position = [];
                        offset = 0;
                        lastColor.copy(currentColor);
                    }

                    //let size = edge.nPts / 3;   
                    if(false)                 
                    for (let j = 0; j < edge.nPts - 3; j += 3) {
                        let pos1 = new VIZCore.Vector3(edge.vPts[j + 0], edge.vPts[j + 1], edge.vPts[j + 2]);
                        let pos2 = new VIZCore.Vector3(edge.vPts[j + 3], edge.vPts[j + 4], edge.vPts[j + 5]);
                        let mesh = view.MeshProcess.GetLine(pos1, pos2, 500);
                        //let mesh = view.MeshProcess.GetLine(new VIZCore.Vector3(edge.vPts[0] -bbox.min.x, edge.vPts[1]-bbox.min.y, edge.vPts[2]-bbox.min.z), new VIZCore.Vector3(edge.vPts[3] - bbox.min.x, edge.vPts[4]-bbox.min.y, edge.vPts[5]-bbox.min.z), 10);
                        //let mesh = view.MeshProcess.GetLine2(pos1, pos2);
                        for (let i = 0; i < mesh.vertices.length; i++) {
                            position[offset + i * 3 + 0] = mesh.vertices[i].x;
                            position[offset + i * 3 + 1] = mesh.vertices[i].y;
                            position[offset + i * 3 + 2] = mesh.vertices[i].z;

                            //normal[offset + i * 3 + 0] = mesh.normals[i].x;
                            //normal[offset + i * 3 + 1] = mesh.normals[i].y;
                            //normal[offset + i * 3 + 2] = mesh.normals[i].z;
                        }
                        offset += mesh.vertices.length * 3;
                    }

                    for (let j = 3; j < edge.nPts; j += 3) {
                        let pos1 = new VIZCore.Vector3(edge.vPts[j - 3 + 0], edge.vPts[j - 3 + 1], edge.vPts[j - 3 + 2]);
                        let pos2 = new VIZCore.Vector3(edge.vPts[j - 3 + 3], edge.vPts[j- 3 + 4], edge.vPts[j - 3 + 5]);
                        position[offset + 0] = pos1.x;
                        position[offset + 1] = pos1.y;
                        position[offset + 2] = pos1.z;

                        position[offset + 3] = pos2.x;
                        position[offset + 4] = pos2.y;
                        position[offset + 5] = pos2.z;

                        offset += 6;
                    }
                }

                //이전의 색상과 다르므로 추가
                if(offset > 0) {
                    positionBuffer = view.gl.createBuffer();
                    view.gl.bindBuffer(view.gl.ARRAY_BUFFER, positionBuffer);
                    view.gl.bufferData(view.gl.ARRAY_BUFFER, new Float32Array(position), view.gl.STATIC_DRAW);
                    view.gl.bindBuffer(view.gl.ARRAY_BUFFER, null);

                    scope.bInitPositionBuffer.push(positionBuffer);                       
                    scope.bInitPosOffset.push(offset);
                    scope.bInitPosColor.push(lastColor);

                    position = [];
                    offset = 0;
                }
            }

            for(let i = 0 ; i < scope.bInitPositionBuffer.length ; i++) {
                let currentColor = new VIZCore.Color().copy(scope.bInitPosColor[i]);
                let currentGLColor = currentColor.glColor();

                view.Shader.SetGLColor(currentGLColor.r, currentGLColor.g, currentGLColor.b, currentGLColor.a);
                
                view.gl.bindBuffer(view.gl.ARRAY_BUFFER, scope.bInitPositionBuffer[i]);    
                view.gl.vertexAttribPointer(view.Shader.positionAttributeLocation, 3, view.gl.FLOAT, false, 0, 0);

                view.gl.drawArrays(view.gl.LINES, 0,  scope.bInitPosOffset[i] / 3);
            }

            //view.gl.drawElements(view.gl.LINES, 1, view.gl.UNSIGNED_SHORT, 0);
            //view.gl.drawArrays(view.gl.TRIANGLES, 0, 6);
            //view.gl.drawArrays(view.gl.TRIANGLES, 0, offset / 3);
            //view.gl.drawArrays(view.gl.LINES, 0, offset / 3);
            //view.gl.drawArrays(view.gl.TRIANGLES, 0, verticesNum);

            //view.gl.drawArrays(view.gl.TRIANGLES, 0, position.length / 3);
            //view.gl.drawArrays(view.gl.LINES, 0, 4);
            //view.gl.deleteBuffer(positionBuffer);

            //view.gl.deleteBuffer(normalBuffer);
            view.Shader.EndShader();
        };


        this.RenderEdgeTest = function (ctx) {
            return;
            for (let k = 0; k < scope.listEdge.length; k++) {
                //ctx.beginPath();
                // if(k > 1000)
                //     break;

                let edge = scope.listEdge[k];
                let currentColor = new VIZCore.Color(edge.color[0] * 255, edge.color[1] * 255, edge.color[2] * 255, edge.color[3] * 255);
                let currentGLColor = currentColor.glColor();
                let size = edge.nPts / 3;
                let offset = 12800000;
                //let offset = 15800000;
                //let offset = 0;

                for (let j = 0; j < edge.nPts - 3; j += 3) {
                    let pos1 = new VIZCore.Vector3(edge.vPts[j + 0], edge.vPts[j + 1], edge.vPts[j + 2]);
                    let pos2 = new VIZCore.Vector3(edge.vPts[j + 3], edge.vPts[j + 4], edge.vPts[j + 5]);

                    pos1.x -= offset;
                    pos1.y -= offset;
                    pos2.x -= offset;
                    pos2.y -= offset;

                    let scale = 0.001;

                    pos1 = pos1.multiplyScalar(scale);
                    pos2 = pos2.multiplyScalar(scale);

                    view.Renderer.Util.DrawLine(ctx, pos1.x, pos1.y, pos2.x, pos2.y);
                    //ctx.moveTo(pos1.x, pos1.y);
                    //ctx.lineTo(pos2.x, pos2.y);

                }
                //ctx.stroke();        
            }

        };

    }


}

export default Font;