//import $ from 'jquery';

class Avatar {
    constructor(view, VIZCore) {
        let scope = this;

        // Avatar Object List
        let CustomObjects = []; //CustomObjectData
        let CustomObjectsUpdateLength = 0;
        let id_current = 1; //Avatar Object ID 관리


        let AvatarUserIndex = -1; //플레이어 아바타 인덱스
        this.AvatarUserType = -1; //플레이어 아바타 모델 타입

        this.ShowAvatar = true; //플레이어 아바타 사용여부
        this.AvatarCurrentTime = 0; //사용자 아바타 Animation Update CurrentTime

        this.AvatarZoom = 5000.0; //3000
        this.ZoomRate = 300.0;

        this.AvatarZoomMax = 5000.0;
        this.AvatarZoomMin = 500.0;

        let fixUpVectorMinAngle = -60; //-90 ~ 90
        let fixUpVectorMaxAngle = 90; //-90 ~ 90

        this.ShowPosition = view.Configuration.Walkthrough.Position === undefined? false : view.Configuration.Walkthrough.Position.Visible; // 아바타 위치 정보 표시 여부
        this.PosInfo = {
            Pos : undefined,
            Dir : undefined
        };

        /**
         * CustomObject Key
         * @returns {String}
         */
        this.GetKey = function() {
            return "softhills_AvatarObject";
        };


        init();
        function init() {
        }

        this.Clear = function () {

            for (let i = CustomObjectsUpdateLength - 1; i >= 0; i--) {
                scope.DeleteObject(CustomObjects[i].uuid);
            }

            CustomObjects = [];
            CustomObjectsUpdateLength = 0;
            AvatarUserIndex = -1;

        };

        this.Visible = function(show) {

            if(scope.ShowAvatar === show) return;

            scope.ShowAvatar = show;
            if(show) {
                let controlMode = view.Control.GetMode();
                if (controlMode !== VIZCore.Enum.CONTROL_STATE.WALKTHROUGH)
                    return;

                 //초기위치 설정
                scope.InitPosAndDirection();
            }

            
        };

        // 개체 추가
        this.AddObject = function (customObject) {
            //customObject (Data.CustomObjectData())
            CustomObjects.push(customObject);

            for (let i = 0; i < customObject.object.length; i++) {
                customObject.object[i].id_file = scope.GetKey(); //파일 등록
``
                for(let j = 0 ; j < customObject.object[i].tag.length ; j++) {
                    let body = customObject.object[i].tag[j];
                    body.partId = id_current; id_current++;
                    body.bodyId = id_current; id_current++;
                    body.origin_id = body.bodyId;
                
                    let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);
                        
                    //Action 데이터 설정
                    {
                        if(action === undefined) {
                            action = view.Data.ActionItem();
                            action.material = body.material;
                        }

                        //파일 읽는 부분에서 material 등록이 있기때문에 등록 필요
                        view.Data.ShapeAction.SetAction(body.object.id_file, body.origin_id, action);
                    }
                }

                view.RenderWGL.SetDataByObject(customObject.object[i]);
                customObject.enableSelection = false;
            }
            CustomObjectsUpdateLength++;

            //기본 자동 설정
            if (AvatarUserIndex < 0)
                AvatarUserIndex = 0;

            //scope.SetPosAndDirection(customObject.uuid,
            //    new VIZCore.Vector3(),
            //    new VIZCore.Vector3(1, 0 ,0),
            //    new VIZCore.Vector3(0, 0, 1)
            //);
            scope.SetAnimationByIndex(customObject.uuid, 0, 0);
        };

        ///**
        // * 개체 반환
        // * @param {Data.UUIDv4()} customID : (undefined === AvatarUserIndex)
        // */
        this.GetObject = function (customID) {

            //플레이어 object 정보 반환
            if (customID === undefined) {
                if (AvatarUserIndex >= 0) {
                    return CustomObjects[AvatarUserIndex];
                }
            }

            for (let i = 0; i < CustomObjects.length; i++) {
                if (CustomObjects[i].uuid !== customID)
                    continue;

                return CustomObjects[i];
            }

            return undefined;
        };

        // 플레이어 아바타 설정
        this.SetUserAvatar = function (customID) {
            for (let i = 0; i < CustomObjects.length; i++) {
                if (CustomObjects[i].uuid !== customID)
                    continue;

                AvatarUserIndex = i;
                break;
            }

        };


        ///**
        // * 해당 개체의 애니메이션 추가
        // * @param {Data.UUIDv4()} customID
        // * @param {Number} animation index
        // * @param {Number} aniLayerIdx (-1 === 맨 뒤에 추가)
        // * @param {Data.CustomObjectAnimation()} animationData
        // */
        this.AddAnimationData = function (customID, aniIndex, aniLayerIdx, animationData) {
            let obj = scope.GetObject(customID);
            if (obj === undefined)
                return; //해당 개체 없음

            if (aniIndex < 0)
                aniIndex = 0;

            if (obj.animation[aniIndex] === undefined) {
                obj.animation[aniIndex] = animationData;
            }
            else {
                //obj.animation[aniIndex].layer[aniLayerIdx] = animationData.layer[0];
                if (aniLayerIdx >= 0) {
                    for (let i = 0; i < animationData.layer.length; i++) {
                        obj.animation[aniIndex].layer[aniLayerIdx + i] = animationData.layer[i];
                    }
                }
                else {
                    for (let i = 0; i < animationData.layer.length; i++) {
                        obj.animation[aniIndex].layer.push(animationData.layer[i]);
                    }
                }
            }
        };

        // 애니메이션 변경
        this.SetAnimationByIndex = function (customID, aniIndex, aniLayerIdx) {
            //Custom Object Animation 설정
            let obj = scope.GetObject(customID);
            if (obj === undefined)
                return; //해당 개체 없음

            if (aniLayerIdx < obj.animation[aniIndex].layer.length)
                scope.SetAnimation(obj.uuid, aniIndex, obj.animation[aniIndex].layer[aniLayerIdx].ID);
        };

        // 애니메이션 변경
        this.SetAnimation = function (customID, aniIndex, aniLayerID) {
            //Custom Object Animation 설정
            let obj = scope.GetObject(customID);
            if (obj === undefined)
                return; //해당 개체 없음

            let animationKindChanged = false;
            if (obj.currentAnimationNum !== aniIndex) {
                animationKindChanged = true;
                //obj.animation[aniIndex].playAnimation = -1;
                //obj.animation[aniIndex].lastAnimation = -1;
            }


            let playIdx = -1;
            for (let j = 0; j < obj.animation[aniIndex].layer.length; j++) {

                if (obj.animation[aniIndex].layer[j].ID !== aniLayerID)
                    continue;

                playIdx = j;
                break;
            }

            //동일애니메이션
            if (!animationKindChanged && obj.animation[aniIndex].playAnimation === playIdx)
                return;

            obj.currentAnimationNum = aniIndex;

            obj.animation[aniIndex].lastAnimation = obj.animation[aniIndex].playAnimation;
            obj.animation[aniIndex].lastAnimationSecond = obj.animation[aniIndex].animationSecond;

            obj.animation[aniIndex].playAnimation = -1;
            if (playIdx >= 0) {
                obj.animation[aniIndex].playAnimation = playIdx;
                obj.animation[aniIndex].animationSecond = 0;
            }

            //for (let j = 0; j < obj.animation[aniIndex].layer.length; j++) {
            //
            //    if (obj.animation[aniIndex].layer[j].ID !== aniLayerID) continue;
            //
            //    obj.animation[aniIndex].playAnimation = j;
            //    obj.animation[aniIndex].animationSecond = 0;
            //    break;
            //}
            if (animationKindChanged) //group 단위 변경
                obj.animation[aniIndex].lastAnimation = -1;

        };

        // 개체 위치 변경
        this.SetPosAndDirection = function (customID, vPos, vDir, vUp) {
            let obj = scope.GetObject(customID);
            if (obj === undefined)
                return; //해당 개체 없음


            //Custom Object 위치 생성
            if (vPos != undefined)
                obj.position.copy(vPos);
            if (vDir != undefined)
                obj.direction.copy(vDir);
            if (vUp != undefined)
                obj.up.copy(vUp);

            let vXAxis = new VIZCore.Vector3().copy(obj.direction);
            let vObjUp = new VIZCore.Vector3().copy(obj.up);
            let vYAxis = new VIZCore.Vector3().crossVectors(vObjUp, vXAxis);

            let vZAxis = new VIZCore.Vector3().copy(vXAxis);
            vZAxis.cross(vYAxis);
            vZAxis.normalize();

            let matAxis = new VIZCore.Matrix4().makeBasis(vXAxis, vYAxis, vZAxis);
            let matTranslate = new VIZCore.Matrix4().setPosition(obj.position);
            let matObjTrans = new VIZCore.Matrix4().multiplyMatrices(matTranslate, matAxis);

            for (let k = 0; k < obj.object.length; k++) {

                for (let m = 0; m < obj.object[k].tag.length; m++) {
                    let body = obj.object[k].tag[m];
                    let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                    action.transform.copy(matObjTrans);
                }
                obj.object[k].flag.updateProcess = true;
            }

            view.Renderer.Render();
        };


        // 카메라 정보에 의한 아바타 위치 초기화
        this.InitPosAndDirection = function (vPos, vDir) {
            //scope.UpdateCamera();
            //return;

            let obj = scope.GetObject();
            if (obj === undefined)
                return; //해당 개체 없음

            let currentPos = new VIZCore.Vector3().copy(obj.position);
            let currentDir = new VIZCore.Vector3().copy(obj.direction);
            //let currentUp = new VIZCore.Vector3().copy(obj.up);
            let currentUp = new VIZCore.Vector3(0, 0, 1);

            let matMV = new VIZCore.Matrix4().copy(view.Camera.matMV);
            let matMVP = new VIZCore.Matrix4().copy(view.Camera.matMVP);

            let matMVinv = new VIZCore.Matrix4().getInverse(matMV);
            let cameraViewPos = matMVinv.multiplyVector(view.Camera.cameraPosition);

            const viewWidth = view.Renderer.GetSizeWidth();
            const viewHeight = view.Renderer.GetSizeHeight();

            let viewZero = new VIZCore.Vector3(viewWidth / 2, viewHeight / 2, 0);
            let viewDir = new VIZCore.Vector3(viewWidth / 2, viewHeight / 2, 0.5);

            let viewWorldZero = view.Camera.screen2WorldWithMatrix(matMVP, viewZero);
            let viewWorldDir = view.Camera.screen2WorldWithMatrix(matMVP, viewDir);

            let worldDir = new VIZCore.Vector3().subVectors(viewWorldDir, viewWorldZero);
            worldDir.normalize();

            let zoom = scope.AvatarZoom;
            zoom = Math.max(scope.AvatarZoomMin, zoom);
            zoom = Math.min(scope.AvatarZoomMax, zoom);

            //currentPos = new VIZCore.Vector3().addVectors(cameraViewPos, worldDir.multiplyScalar(1500));// 해당 거리만큼 위치이동
            currentPos = new VIZCore.Vector3().addVectors(cameraViewPos, worldDir.multiplyScalar(zoom)); // 해당 거리만큼 위치이동

            //currentPos.z -= 1800.0;
            currentPos.z -= 1680.0;

            worldDir.z = 0;
            worldDir.normalize();

            //AvatarAngle
            currentDir.copy(worldDir);

            //Avatar 바라보는 설정과 바라보는 방향이 다름..
            // 모델의 경우 Y-
            // direction 설정은 X+
            let modelRotate = new VIZCore.Matrix4().makeRotationZ(90.0 * Math.PI / 180.0);
            currentDir.applyMatrix4(modelRotate);

            //let avatarAngle = worldDir.get2DAngle();
            //초기 설정값이 존재함.
            if (vPos !== undefined)
                currentPos.copy(vPos);
            if (vDir !== undefined)
                currentDir.copy(vDir);

            //obj.position.copy(currentPos);
            //obj.direction.copy(currentDir);
            scope.SetPosAndDirection(obj.uuid, currentPos, currentDir, currentUp);
        };


        // 아바타 위치에 따른 카메라 조절
        this.UpdateCamera = function () {
            let obj = scope.GetObject();
            if (obj === undefined)
                return; //해당 개체 없음

            let currentPos = new VIZCore.Vector3().copy(obj.position);
            let currentDir = new VIZCore.Vector3().copy(obj.direction);
            let currentUp = new VIZCore.Vector3().copy(obj.up);
            //let currentUp = new VIZCore.Vector3(0, 0, 1);
            let matMV = new VIZCore.Matrix4().copy(view.Camera.matMV);
            let matMVP = new VIZCore.Matrix4().copy(view.Camera.matMVP);

            let matMVinv = new VIZCore.Matrix4().getInverse(matMV);
            let cameraViewPos = matMVinv.multiplyVector(view.Camera.cameraPosition);

            //let pivotWithModelCenterOffset = new VIZCore.Vector3().copy(cameraViewPos);
            let vZeroOffset = matMV.multiplyVector(new VIZCore.Vector3());
            //let currentOffset = new VIZCore.Vector3().sub(cameraViewPos, vOffset);
            //let currentOffset = new VIZCore.Vector3().sub(cameraViewPos, vOffset);
            //let currentOffset = vOffset;
            //pivotWithModelCenterOffset.applyMatrix4(matMV);
            //currentPos.z += 1800.0; //눈 높이
            currentPos.z += 1680.0;
            //let updateCurrentPos = matMV.multiplyVector(currentPos);
            //let updateCurrentPos = currentPos;
            let zoom = scope.AvatarZoom;
            zoom = Math.max(scope.AvatarZoomMin, zoom);
            zoom = Math.min(scope.AvatarZoomMax, zoom);


            let cameraTranslate = new VIZCore.Vector3().subVectors(currentPos, cameraViewPos);
            let cameraUpdateTranslate = matMV.multiplyVector(cameraTranslate);
            cameraUpdateTranslate = new VIZCore.Vector3().subVectors(cameraUpdateTranslate, vZeroOffset);

            let worldDir = new VIZCore.Vector3(0, 0, 1);
            worldDir.normalize();

            //기존 위치
            //let cameraViewPrevPos = matMV.multiplyVector(new VIZCore.Vector3());
            cameraUpdateTranslate = new VIZCore.Vector3().addVectors(cameraUpdateTranslate, worldDir.multiplyScalar(zoom)); // 해당 거리만큼 위치이동
            view.Camera.cameraMatrix.translate(-cameraUpdateTranslate.x, -cameraUpdateTranslate.y, -cameraUpdateTranslate.z);


            view.Camera.ResizeGLWindow();

            //Avatar 바라보는 설정과 바라보는 방향이 다름..
            // 모델의 경우 Y-
            // direction 설정은 X+
            //let modelRotate = new VIZCore.Matrix4().makeRotationZ(90.0 * Math.PI / 180.0);
            //currentDir.applyMatrix4(modelRotate);
            //let avatarAngle = worldDir.get2DAngle();
            if(this.ShowAvatar && this.ShowPosition){
                this.PosInfo.Pos = new VIZCore.Vector3().copy(obj.position);
                this.PosInfo.Dir = new VIZCore.Vector3(0, 0, -1);//new VIZCore.Vector3().copy(worldDir);
            }
        };

        function renderText(context, pos, dir, text, offset) {
            
            let matMVP = new VIZCore.Matrix4().copy(view.Camera.matMVP);
    
            // 폰트 설정
            let textFontSize = 8;
            let textBorder = 2;
            context.font = textFontSize + "pt Arial";
            context.fillStyle = "rgba(0, 0, 0, 1.0)";

            //원근뷰에서 가시화 여부 확인
            let pixel = 30;
            if(offset !== undefined)
                pixel = offset;
            let len = view.Camera.GetScreen1PixelLength(pos);

            // 2D 좌표 변환
            let textPos = new VIZCore.Vector3().addVectors(pos, new VIZCore.Vector3().copy(dir).multiplyScalar(len*pixel));
            let text2DPos = view.Camera.world2ScreenWithMatrix(matMVP, textPos);
            
            //텍스트
            //const metrics = view.Renderer.Util.GetTextMetricsByText(context, text, textFontSize);//getTextMetricsByText(text, textFontSize);
            let metrics = context.measureText(text);
    
            let w = metrics.width + textBorder * 2;
            let h = metrics.height + textBorder * 2;

            context.fillText(text,
                text2DPos.x - w / 2,
                text2DPos.y);
        }

        this.Render2D = function(){
            let mode = view.Control.GetMode();// view.Control.SetMode(VIZCore.Enum.CONTROL_STATE.WALKTHROUGH);
            if(VIZCore.Enum.CONTROL_STATE.WALKTHROUGH !== mode)
                return;

            if(this.PosInfo.Pos === undefined)
            {
                scope.UpdateCamera();
            }

            if(this.ShowAvatar && this.ShowPosition && this.PosInfo.Pos !== undefined){
                let text = "X:" + this.PosInfo.Pos.x.toFixed(2) + ", Y:" + this.PosInfo.Pos.y.toFixed(2) + ", Z:" + this.PosInfo.Pos.z.toFixed(2);
                renderText(view.ctx_review, this.PosInfo.Pos, this.PosInfo.Dir, text, 30);
            }
        };
        this.SetZoom = function (zoom) {

            zoom = Math.max(scope.AvatarZoomMin, zoom);
            zoom = Math.min(scope.AvatarZoomMax, zoom);

            scope.AvatarZoom = zoom;
            scope.UpdateCamera();
        };


        ///**
        //* Camera 회전
        //* @param {VIZCore.Vector3()} angle : 회전 angle x, y, z
        //* @param {VIZCore.Vector3()} pivot : 피봇
        //* */
        this.CameraRotate = function (angle, pivot) {

            let matX = new VIZCore.Matrix4().makeRotationX(angle.x);
            let matY = new VIZCore.Matrix4().makeRotationY(angle.y);
            let matZ = new VIZCore.Matrix4().makeRotationZ(angle.z);

            {
                let matMVMatrix = new VIZCore.Matrix4().copy(view.Camera.matMV);

                {
                    let matMVRotateMatrix = new VIZCore.Matrix4().copy(matMVMatrix);
                    matMVRotateMatrix.setPosition(new VIZCore.Vector3(0, 0, 0));

                    let vUpPos = new VIZCore.Vector3(0, 0, 1);
                    let vZeroPos = new VIZCore.Vector3(0, 0, 0);
                    vUpPos.applyMatrix4(matMVRotateMatrix);
                    vZeroPos.applyMatrix4(matMVRotateMatrix);

                    if (vUpPos.y < vZeroPos.y)
                        matZ = new VIZCore.Matrix4().makeRotationZ(-angle.z);
                }
                // rotate by pivot
                let rotateByPivotMatrix = new VIZCore.Matrix4();
                let rotateZByPivotMatrix = new VIZCore.Matrix4();
                {
                    let pivotWithModelCenterOffset = new VIZCore.Vector3().copy(pivot);
                    pivotWithModelCenterOffset.applyMatrix4(matMVMatrix);

                    let translatePivotToZeroMatrix = new VIZCore.Matrix4();
                    let pivotZero = new VIZCore.Vector3().copy(pivotWithModelCenterOffset).multiplyScalar(-1);
                    translatePivotToZeroMatrix.setPosition(pivotZero);

                    let rotateMatrix = new VIZCore.Matrix4().copy(matX);

                    let translateZeroToPivotMatrix = new VIZCore.Matrix4().setPosition(pivotWithModelCenterOffset);

                    let tmpMatrix = new VIZCore.Matrix4().multiplyMatrices(rotateMatrix, translatePivotToZeroMatrix);
                    rotateByPivotMatrix = new VIZCore.Matrix4().multiplyMatrices(translateZeroToPivotMatrix, tmpMatrix);
                }

                {
                    let pivotWithModelCenterOffset = new VIZCore.Vector3().copy(pivot);

                    let translatePivotToZeroMatrix = new VIZCore.Matrix4();
                    let pivotZero = new VIZCore.Vector3().copy(pivotWithModelCenterOffset).multiplyScalar(-1);
                    translatePivotToZeroMatrix.setPosition(pivotZero);

                    let rotateMatrix = new VIZCore.Matrix4().copy(matZ);

                    let translateZeroToPivotMatrix = new VIZCore.Matrix4().setPosition(pivotWithModelCenterOffset);

                    let tmpMatrix = new VIZCore.Matrix4().multiplyMatrices(rotateMatrix, translatePivotToZeroMatrix);
                    rotateZByPivotMatrix = new VIZCore.Matrix4().multiplyMatrices(translateZeroToPivotMatrix, tmpMatrix);
                }

                //if (scope.useUpVectorFixRotateVAngleRange) {
                {
                    let tmp2Matrix = new VIZCore.Matrix4().multiplyMatrices(matMVMatrix, rotateZByPivotMatrix);
                    let matUpdateMVMatrix = new VIZCore.Matrix4().multiplyMatrices(rotateByPivotMatrix, tmp2Matrix);

                    let vUpdateUpPos = new VIZCore.Vector3(0, 0, 1);
                    let matMVRotateMatrix = new VIZCore.Matrix4().copy(matUpdateMVMatrix);
                    matMVRotateMatrix.setPosition(new VIZCore.Vector3(0, 0, 0));

                    //vUpdateUpPos.applyMatrix4(matMVMatrix);
                    vUpdateUpPos.applyMatrix4(matMVRotateMatrix);
                    let fAngle = Math.acos(vUpdateUpPos.y);

                    let minAngle = fixUpVectorMinAngle * Math.PI / 180.0;
                    let maxAngle = fixUpVectorMaxAngle * Math.PI / 180.0;

                    if (vUpdateUpPos.z < 0)
                        fAngle *= -1.0;

                    //복귀 코드
                    if (fAngle < minAngle) {
                        //angle.x = fAngle;
                        //angle.x = minAngle - fAngle + angle.x; //팅겨지는 상태
                        angle.x = minAngle - fAngle + angle.x;
                        scope.CameraRotate(angle, pivot);
                        return;
                    }

                    if (fAngle > maxAngle) {
                        //angle.x = fAngle - Math.PI / 2.0;
                        //angle.x = maxAngle - fAngle + angle.x;
                        angle.x = maxAngle - fAngle + angle.x;
                        scope.CameraRotate(angle, pivot);
                        return;
                    }
                }



                let tmp2Matrix = new VIZCore.Matrix4().multiplyMatrices(view.Camera.cameraMatrix, rotateZByPivotMatrix);
                view.Camera.cameraMatrix = new VIZCore.Matrix4().multiplyMatrices(rotateByPivotMatrix, tmp2Matrix);

                //view.Camera.UpdateGLWindow(undefined);
                view.Camera.ResizeGLWindow();
                view.Avatar.UpdateCamera();
            }

        };


        function initRenderProcess() {

            for (let i = 0; i < CustomObjectsUpdateLength; i++) {

                for (let k = 0; k < CustomObjects[i].object.length; k++) {
                    //let pipeline = view.RenderWGL.InitRenderPipeline(CustomObjects[i].object[k]);
                    //mapPipeline.set(CustomObjects[i].object[k].uuid, pipeline);
                    view.RenderWGL.InitRenderPipeline(CustomObjects[i].object[k]);
                }
            }


            if (AvatarUserIndex >= 0)
                view.SHWebSocket.UpdatePlayerChatBoxPos(CustomObjects[AvatarUserIndex].position);
        }

        /**
         * Avatar timer Preprocessing
         * @returns 
         */
        this.RenderPreprocessing = function () {
            if(view.IsVIZWide3DProduct() === false) return;

            if (scope.ShowAvatar === false)
                return;
            let controlMode = view.Control.GetMode();
            if (controlMode !== VIZCore.Enum.CONTROL_STATE.WALKTHROUGH)
                return;
            if (AvatarUserIndex < 0)
                return;

            //Animation Redner
            initRenderProcess();

            let timeCurrent = scope.AvatarCurrentTime;

            if(AvatarUserIndex >= 0 && AvatarUserIndex < CustomObjects.length)
            {
                let i = AvatarUserIndex;

                if (CustomObjects[i].visible) {

                    //Animation Biped 관리 생성
                    if (CustomObjects[i].currentAnimationNum >= 0) {
                       let animation = CustomObjects[i].animation[CustomObjects[i].currentAnimationNum];

                       let aniIdx = animation.playAnimation;
                       let lastAniIdx = animation.lastAnimation;

                       if (aniIdx >= 0)
                           animation.animationSecond += timeCurrent;
                       if (lastAniIdx >= 0)
                           animation.lastAnimationSecond += timeCurrent;
                    }
                }
            }

        };

        //Animation 개체 그리기
        this.Render = function () {
            if(view.IsVIZWide3DProduct() === false) return;

            if (scope.ShowAvatar === false)
                return;
            let controlMode = view.Control.GetMode();
            if (controlMode !== VIZCore.Enum.CONTROL_STATE.WALKTHROUGH)
                return;
            if (AvatarUserIndex < 0)
                return;

            //Animation Redner
            initRenderProcess();

            //let timeCurrent = (view.RenderProcessTime - view.LastRenderProcessTime) / 1000; // 초
            let timeCurrent = scope.AvatarCurrentTime;

            //항상 새로 그리기.
            //그리기
            //view.Shader.BeginShader(VIZCore.Enum.SHADER_TYPES.PBR);
            view.Shader.BeginShader(VIZCore.Enum.SHADER_TYPES.ANIMATIONPBR);

            view.Shader.SetGLCameraData();

            //기존 깊이 이미지 사용
            //let hUsePrevDpeth = view.gl.getUniformLocation(view.Shader.currentProgram, "ubUsePrevDpeth");
            //if (hUsePrevDpeth != null)
            //    view.gl.uniform1i(hUsePrevDpeth, 1);
            //
            //if (view.Shader.IsWebGLEXTDEPTH()) {
            //    let fbDepth = view.Shader.GetItemFramebuffer(VIZCore.Enum.FB_RENDER_TYPES.DEPTH);
            //    //view.Shader.SetCurrentTexture("u_PrevDpeth", view.gl.TEXTURE_2D, fbDepth.targetTexture);
            //    view.Shader.SetCurrentTexture("u_PrevDpeth", view.gl.TEXTURE_2D, fbDepth.targetDepthTexture);
            //}
            //else {
            //    let fbDepth = view.Shader.GetItemFramebuffer(VIZCore.Enum.FB_RENDER_TYPES.DEPTH);
            //    view.Shader.SetCurrentTexture("u_PrevDpeth", view.gl.TEXTURE_2D, fbDepth.targetTexture);
            //}
            view.Shader.SetGLLight();
            //view.gl.disable(view.gl.BLEND);
            view.gl.enable(view.gl.BLEND); //Custom은 한번에 그리기에 Blend 활성화

            view.gl.enable(view.gl.DEPTH_TEST);

            const matMVMatrix = new VIZCore.Matrix4().copy(view.Camera.matMV);
            const matMVP = new VIZCore.Matrix4().copy(view.Camera.matMVP);

            view.Shader.SetMatrix(matMVP, matMVMatrix);
            view.Shader.SetClipping(undefined); //해당 내용은 단면 처리 하지 않음.


            //for (let i = 0; i < CustomObjectsUpdateLength; i++) {
            if(AvatarUserIndex >= 0 && AvatarUserIndex < CustomObjects.length)
            {
                let i = AvatarUserIndex;

                view.Shader.SetUpdateCurrentMatrixData();

                if (CustomObjects[i].visible) {
                    //Animation Biped 관리 생성
                    if (CustomObjects[i].currentAnimationNum >= 0) {
                        let animation = CustomObjects[i].animation[CustomObjects[i].currentAnimationNum];

                        let aniIdx = animation.playAnimation;
                        let lastAniIdx = animation.lastAnimation;

                        // if (aniIdx >= 0)
                        //     animation.animationSecond += timeCurrent;
                        // if (lastAniIdx >= 0)
                        //     animation.lastAnimationSecond += timeCurrent;

                        if (aniIdx >= 0) {

                            // 시간 스텝 찾는다
                            let step = 0, lastStep = 0;
                            if (aniIdx >= 0)
                                step = animation.animationSecond / animation.layer[aniIdx].step;

                            if (lastAniIdx >= 0)
                                lastStep = animation.lastAnimationSecond / animation.layer[lastAniIdx].step;

                            // 바이패드 메트리스 정리
                            let matBiped = [];
                            for (let j = 0; j < animation.layer[aniIdx].data.length; j++) {
                                if (animation.layer[aniIdx].data[j].transform.length > 0) {
                                    let currentStep = Math.floor(step) % Math.floor(animation.layer[aniIdx].data[j].transform.length);
                                    matBiped.push(new VIZCore.Matrix4().copy(animation.layer[aniIdx].data[j].transform[currentStep]));
                                }
                                else {
                                    matBiped.push(new VIZCore.Matrix4());
                                }
                            }

                            // 블렌딩 해야할 상황이라면 섞는다
                            let fBlendSecondLen = 0.5;
                            if (animation.animationSecond < fBlendSecondLen && lastAniIdx >= 0) {
                                let fBlendRate = animation.animationSecond / fBlendSecondLen;

                                for (let j = 0; j < animation.layer[lastAniIdx].data.length; j++) {
                                    let matCurrent = new VIZCore.Matrix4();

                                    if (animation.layer[lastAniIdx].data[j].transform.length > 0) {
                                        let currentStep = Math.floor(lastStep) % Math.floor(animation.layer[lastAniIdx].data[j].transform.length);
                                        matCurrent.copy(animation.layer[lastAniIdx].data[j].transform[currentStep]);
                                    }

                                    //matBiped[j] = matBiped[j] * fBlendRate + matCurrent * (1.0f - fBlendRate);
                                    //matBiped[j] = matBiped[j].multiplyScalar(fBlendRate) + matCurrent.multiplyScalar((1.0 - fBlendRate));
                                    let bipedUpdate1 = new VIZCore.Matrix4().copy(matBiped[j]).multiplyScalar(fBlendRate);
                                    let bipedUpdate2 = matCurrent.multiplyScalar((1.0 - fBlendRate));

                                    for (let k = 0; k < 16; k++) {
                                        matBiped[j].elements[k] = bipedUpdate1.elements[k] + bipedUpdate2.elements[k];
                                    }

                                }

                                //console.log("aniIdx : " + aniIdx + ", last : " + lastAniIdx + ", Rate : " + fBlendRate);
                            }

                            view.Shader.SetUpdateCurrentMatrixData(matBiped);
                        }
                    }

                    //view.Shader.SetUpdateCurrentMatrixData();
                    for (let k = 0; k < CustomObjects[i].object.length; k++) {
                        view.RenderWGL.UpdateRenderProcessByAnimationObject_v2(CustomObjects[i].object[k]);
                    }
                }
            }

            view.gl.disable(view.gl.BLEND);
            //view.gl.enable(view.gl.DEPTH_TEST);
            view.gl.depthMask(true);

            view.gl.disable(view.gl.BLEND);
            view.gl.disable(view.gl.DEPTH_TEST);

            view.Shader.EndShader();

            scope.AvatarCurrentTime = 0;

        };

        this.PickRender = function () {

            if (scope.ShowAvatar === false)
                return;
            let controlMode = view.Control.GetMode();
            if (controlMode !== VIZCore.Enum.CONTROL_STATE.WALKTHROUGH)
                return;
            if (AvatarUserIndex < 0)
                return;

            //Animation Redner
            initRenderProcess();

            //let timeCurrent = (view.RenderProcessTime - view.LastRenderProcessTime) / 1000; // 초
            //let timeCurrent = scope.AvatarCurrentTime;

            //항상 새로 그리기.
            //그리기
            //view.Shader.BeginShader(VIZCore.Enum.SHADER_TYPES.PBR);
            view.Shader.BeginShader(VIZCore.Enum.SHADER_TYPES.PICK);

            view.Shader.SetGLCameraData();

            view.gl.enable(view.gl.BLEND); //Custom은 한번에 그리기에 Blend 활성화
            view.gl.enable(view.gl.DEPTH_TEST);

            const matMVMatrix = new VIZCore.Matrix4().copy(view.Camera.matMV);
            const matMVP = new VIZCore.Matrix4().copy(view.Camera.matMVP);

            view.Shader.SetMatrix(matMVP, matMVMatrix);
            view.Shader.SetClipping(undefined); //해당 내용은 단면 처리 하지 않음.


            //for (let i = 0; i < CustomObjectsUpdateLength; i++) {
            if(AvatarUserIndex >= 0 && AvatarUserIndex < CustomObjects.length)
            {
                let i = AvatarUserIndex;

                view.Shader.SetUpdateCurrentMatrixData();

                if (CustomObjects[i].visible) {
                    //Animation Biped 관리 생성
                    //view.Shader.SetUpdateCurrentMatrixData();
                    for (let k = 0; k < CustomObjects[i].object.length; k++) {
                        view.RenderWGL.UpdateRenderProcessByPickAnimationObject_v2(CustomObjects[i].object[k]);
                    }
                }
            }

            view.gl.disable(view.gl.BLEND);
            //view.gl.enable(view.gl.DEPTH_TEST);
            view.gl.depthMask(true);

            view.gl.disable(view.gl.BLEND);
            view.gl.disable(view.gl.DEPTH_TEST);

            view.Shader.EndShader();

        };

        this.OneColorRender = function (shaderTypes, color) {
            if (scope.ShowAvatar === false)
                return;
            let controlMode = view.Control.GetMode();
            if (controlMode !== VIZCore.Enum.CONTROL_STATE.WALKTHROUGH)
                return;
            if (AvatarUserIndex < 0)
                return;


            if (shaderTypes === undefined)
                shaderTypes = VIZCore.Enum.SHADER_TYPES.ANIMATIONBASIC2D;

            let matMVP = new VIZCore.Matrix4().copy(view.Camera.matMVP);
            let matMVMatrix = new VIZCore.Matrix4().copy(view.Camera.matMV);

            view.Shader.BeginShader(shaderTypes);
            view.Shader.SetGLCameraData();

            view.gl.enable(view.gl.BLEND); //Custom은 한번에 그리기에 Blend 활성화
            view.gl.enable(view.gl.DEPTH_TEST);
            
            view.Shader.SetMatrix(matMVP, matMVMatrix);
            view.Shader.SetClipping(undefined); //해당 내용은 단면 처리 하지 않음.
            
            if(AvatarUserIndex >= 0 && AvatarUserIndex < CustomObjects.length)
            {
                let i = AvatarUserIndex;

                view.Shader.SetUpdateCurrentMatrixData();

                if (CustomObjects[i].visible) {

                     //Animation Biped 관리 생성
                     if (CustomObjects[i].currentAnimationNum >= 0) {
                        let animation = CustomObjects[i].animation[CustomObjects[i].currentAnimationNum];

                        let aniIdx = animation.playAnimation;
                        let lastAniIdx = animation.lastAnimation;

                        // if (aniIdx >= 0)
                        //     animation.animationSecond += timeCurrent;
                        // if (lastAniIdx >= 0)
                        //     animation.lastAnimationSecond += timeCurrent;

                        if (aniIdx >= 0) {

                            // 시간 스텝 찾는다
                            let step = 0, lastStep = 0;
                            if (aniIdx >= 0)
                                step = animation.animationSecond / animation.layer[aniIdx].step;

                            if (lastAniIdx >= 0)
                                lastStep = animation.lastAnimationSecond / animation.layer[lastAniIdx].step;

                            // 바이패드 메트리스 정리
                            let matBiped = [];
                            for (let j = 0; j < animation.layer[aniIdx].data.length; j++) {
                                if (animation.layer[aniIdx].data[j].transform.length > 0) {
                                    let currentStep = Math.floor(step) % Math.floor(animation.layer[aniIdx].data[j].transform.length);
                                    matBiped.push(new VIZCore.Matrix4().copy(animation.layer[aniIdx].data[j].transform[currentStep]));
                                }
                                else {
                                    matBiped.push(new VIZCore.Matrix4());
                                }
                            }

                            // 블렌딩 해야할 상황이라면 섞는다
                            let fBlendSecondLen = 0.5;
                            if (animation.animationSecond < fBlendSecondLen && lastAniIdx >= 0) {
                                let fBlendRate = animation.animationSecond / fBlendSecondLen;

                                for (let j = 0; j < animation.layer[lastAniIdx].data.length; j++) {
                                    let matCurrent = new VIZCore.Matrix4();

                                    if (animation.layer[lastAniIdx].data[j].transform.length > 0) {
                                        let currentStep = Math.floor(lastStep) % Math.floor(animation.layer[lastAniIdx].data[j].transform.length);
                                        matCurrent.copy(animation.layer[lastAniIdx].data[j].transform[currentStep]);
                                    }

                                    //matBiped[j] = matBiped[j] * fBlendRate + matCurrent * (1.0f - fBlendRate);
                                    //matBiped[j] = matBiped[j].multiplyScalar(fBlendRate) + matCurrent.multiplyScalar((1.0 - fBlendRate));
                                    let bipedUpdate1 = new VIZCore.Matrix4().copy(matBiped[j]).multiplyScalar(fBlendRate);
                                    let bipedUpdate2 = matCurrent.multiplyScalar((1.0 - fBlendRate));

                                    for (let k = 0; k < 16; k++) {
                                        matBiped[j].elements[k] = bipedUpdate1.elements[k] + bipedUpdate2.elements[k];
                                    }

                                }

                                //console.log("aniIdx : " + aniIdx + ", last : " + lastAniIdx + ", Rate : " + fBlendRate);
                            }

                            view.Shader.SetUpdateCurrentMatrixData(matBiped);
                        }
                    }
                    
                    //Animation Biped 관리 생성
                    //view.Shader.SetUpdateCurrentMatrixData();
                    for (let k = 0; k < CustomObjects[i].object.length; k++) {
                        view.RenderWGL.UpdateRenderProcessByAnimationObjectOneColor_v2(CustomObjects[i].object[k], color);

                    }
                }
            }

            view.Shader.EndShader();

            view.gl.disable(view.gl.BLEND);
            //view.gl.enable(view.gl.DEPTH_TEST);
            view.gl.depthMask(true);

            view.gl.disable(view.gl.BLEND);
            view.gl.disable(view.gl.DEPTH_TEST);
        };

        /**
         * 아바타 그리기 GLSL 전처리
         * @param {Boolean} bufferClear 
         * @param {Number} objectsUpdateCnt 
         */
        this.GLSLPreprocessing = function(bufferClear, objectsUpdateCnt) 
        {
            if(view.IsVIZWide3DProduct() === false) return;

            if (scope.ShowAvatar === false) return;

            //AVATAR Color Buffer (EDGE)
            {
                view.Shader.BeginFramebuffer(VIZCore.Enum.FB_RENDER_TYPES.AVATAROBJECT);

                view.gl.disable(view.gl.BLEND);
                view.gl.enable(view.gl.DEPTH_TEST);

                if (bufferClear) {
                    view.gl.clearColor(0, 0, 0, 0);
                    view.gl.clear(view.gl.COLOR_BUFFER_BIT | view.gl.DEPTH_BUFFER_BIT);
                }

                let whiteColor = new VIZCore.Color(255, 255, 255, 255);
                
                let edgeType = view.Renderer.GetAvatarEdgeTypeEffect();
                if(edgeType == 0)
                {
                    //아바타 그리기
                    scope.OneColorRender(VIZCore.Enum.SHADER_TYPES.ANIMATIONBASIC2D, whiteColor);
                }
                if(edgeType == 1)
                {
                    view.gl.depthFunc(view.gl.LEQUAL);
                    let blackColor = new VIZCore.Color(0, 0, 0, 255);

                    //모델 그리기
                    {
                        view.Shader.BeginShader(VIZCore.Enum.SHADER_TYPES.BASIC2D);
                        for (let i = 0; i < objectsUpdateCnt; i++) {
                            view.RenderWGL.UpdateRenderProcessByObjectOneColor_v2(view.Data.Objects[i], blackColor);
                        }
                        view.Shader.EndShader();
                    }
                    //커스텀 그리기
                    {
                        view.CustomObject.OneColorRender(VIZCore.Enum.SHADER_TYPES.BASIC2D, blackColor);
                    }

                    view.gl.depthFunc(view.gl.GREATER);

                    //아바타 그리기
                    scope.OneColorRender(VIZCore.Enum.SHADER_TYPES.ANIMATIONBASIC2D, whiteColor);

                    view.gl.depthFunc(view.gl.LEQUAL);
                }

                view.Shader.EndFramebuffer();
            }
        };



    }
}

export default Avatar;