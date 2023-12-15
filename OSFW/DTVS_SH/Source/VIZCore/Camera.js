/**
 * VIZCore Camera 모듈
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @param {Object} view View.js Instance
 * @param {Object} VIZCore ValueObject.js Instance
 * @class
 */

 class Camera {
    constructor(view, VIZCore) {
//let Camera = function (view, VIZCore) {
        let scope = this;
        this.CameraIndex = 0;

        this.projectionMatrixSrc = undefined;
        this.projectionMatrix = undefined;
        this.viewMatrix = undefined;

        this.cameraMatrix = undefined;

        this.cameraPosition = undefined; // viewMatrix 계산
        this.cameraTarget = undefined;  // viewMatrix 계산
        this.cameraUp = undefined;  // viewMatrix 계산

        this.perspectiveView = true; //true:원근 , false: 평행

        this.cameraZoomRatio = undefined; //Configuration
        this.cameraZoom = undefined;

        this.fieldOfView = undefined;
        this.viewDistance = undefined;
        this.near = undefined;
        this.nearZoom = undefined;

        this.far = undefined;

        this.clientWidth = 0;
        this.clientHeight = 0;

        //View cone
        //사용자가 정의한 Near Far 적용여부 (true = Auto, false = 사용자 정의)
        this.AutoNearFarPlane = true;
        this.CustomNearPlaneDist = 10;
        this.CustomFarPlaneDist = 100000.0;

        //카메라 확대 제한
        this.AutoZoomNearPlane = false;  //카메라 확대 제한 여부 설정 (원근)
        this.ZoomNearPlaneDist = 10.0;           //BoundBox에서 제한 offset

        this.FixWorldAxis = false; //world 축 회전 고정
        this.WorldAxis = new VIZCore.Vector3(0.0, 0.0, 1.0);

        this.useYUp = false;
        this.useUpVectorFixRotateVAngleRange = true;   //Z축 고정 활성화시 Z축 회전 각도 제한여부
        let fixUpVectorMinAngle = 0.000001;      //-90 ~ 90
        //let fixUpVectorMinAngle = 0;      //-90 ~ 90
        let fixUpVectorMaxAngle = 90;        //-90 ~ 90

        this.useCameraUpVectorMinPosition = false;   //원근 - Z축 고정 활성화시 카메라 이동제한 Z축 이동 (Pan)
        let fixUpVectorMinPosition = 10.0;

        this.matModel = undefined; //update 받을때 얻은 Model Matrix

        this.matMV = undefined;
        this.matMVP = undefined;
        
        //Shadow 효과 Matrix
        this.matShadowMV = undefined;
        this.matShadowProjection = undefined;

        //this.viewDistanceFactor = 0.55;
        this.viewDistanceFactor = 1.0;
        this.pivot = undefined; // Pivot 위치
        this.lockPivot = false; // Pivot 설정 잠금
        this.RenderPivot = false;   //Pivot 그리기 여부 (View 별 설정)

        let mapBackup = new Map();

        let baseDirection = VIZCore.Enum.VIEW_MODES.PlusISO;
        let baseCustomDirectionMatrix = new VIZCore.Matrix4();

        this.screenProjectionMatrix = undefined; //UI

        let cameraFocusMargine = 0.1; // 화면 비율 여유 공간
        let cameraAnimationTime = 0.5;
        this.cameraAnimation = false; // 애니메이션 처리 (포커스)

        let useCameraFit = true; // 초기 형상 로딩시 FitAll 기능을 통한 원근뷰 포커스 이동

        this.LockCamera = false;

        init();
        function init() {
            //scope.perspectiveView = true;
            //scope.perspectiveView = false;
            scope.cameraZoom = 1.0;
            scope.near = 0.1;
            scope.nearZoom = 0.1;

            scope.far = 100.0;
            scope.cameraZoomRatio = 0.3; // 기본
            //scope.cameraZoomRatio = 0.15;

            scope.fieldOfView = 60;

            scope.cameraMatrix = new VIZCore.Matrix4();
            scope.viewMatrix = new VIZCore.Matrix4();
            scope.projectionMatrixSrc = new VIZCore.Matrix4();
            scope.projectionMatrix = new VIZCore.Matrix4();
            scope.screenProjectionMatrix = new VIZCore.Matrix4();

            scope.matModel = new VIZCore.Matrix4();
            scope.matMV = new VIZCore.Matrix4();
            scope.matMVP = new VIZCore.Matrix4();

            //ISO View
            baseCustomDirectionMatrix.set2(
                0.707106, 0.353553, -0.6123724, 0,
                -0.707106, 0.353553, -0.6123724, 0,
                0, 0.866025, 0.5, 0,
                0, 0, 0, 1);

            //resetGLWindow();
            //resizeGLWindow();
        }
        
        /**
         * 초기 값 설정
         */
        this.Init = function(cameraIdx) {
            scope.CameraIndex = cameraIdx;
        };

        function resetGLWindow() {
            let bbox = view.Data.GetBBox();

            let modelCenter = bbox.center;
            let radius = bbox.radius;

            scope.cameraMatrix = new VIZCore.Matrix4();
            let modelCenterZero = new VIZCore.Vector3().copy(modelCenter).multiplyScalar(-1.0);
            scope.cameraMatrix.setPosition(modelCenterZero);

            //scope.cameraPosition = new VIZCore.Vector3();
            scope.cameraPosition = new VIZCore.Vector3();
            scope.cameraTarget = new VIZCore.Vector3();
            scope.cameraUp = new VIZCore.Vector3();

            scope.viewDistance = radius * 1.5;
            //scope.viewDistance = radius * 1.5 * scope.viewDistanceFactor;
            //scope.viewDistance = radius;   
            scope.cameraTarget.set(0, 0, -1);
            scope.cameraUp.set(0, 1, 0);

            //scope.cameraPosition.set(0, 0, scope.viewDistance);
            scope.cameraPosition = new VIZCore.Vector3().copy(modelCenterZero);

            let viewNormal = new VIZCore.Vector3().copy(scope.cameraTarget);
            //        scope.cameraPosition.add(viewNormal.multiplyScalar(scope.viewDistance));
            scope.cameraPosition.add(viewNormal.multiplyScalar(radius));

            scope.cameraZoom = 1.0;

            //scope.pivot = modelCenterZero;
            if (!scope.lockPivot)
                scope.pivot = modelCenter;
            
            //scope.pivot = new VIZCore.Vector3();
            // if (view.Renderer !== undefined)
            //     view.ViewRefresh();
                //view.Renderer.MainFBClear();
        }

        /**
        * 초기 GL Windows View 설정
        */
        this.ResetGLWindow = function () {

            resetGLWindow();
        };
        
        /**
        * GL Windows View 초기화
        */
        this.ClearGLWindow = function () {
            init();
        };

        function resizeGLWindow(bboxInfo) {

            let changeGLWindow = true;
            let lastGLWindow = new VIZCore.Matrix4().copy(scope.projectionMatrixSrc);
            //let lastGLWindow = new VIZCore.Matrix4().copy(scope.matMVP);

            let bbox = view.Data.GetBBox();

            if(view.Grid.ShowCustomLevelGrid) {
                let bbox_frame = view.Grid.GetFrameBBox();

                if(bbox_frame !== undefined) {
                    bbox.min.min(bbox_frame.min);
                    bbox.max.max(bbox_frame.max);
                    bbox.update();
                }
            }


            if(bboxInfo !== undefined)
            {
                bbox = new VIZCore.BBox().copy(bboxInfo);
            }
                
            let modelCenter = bbox.center;
            let radius = bbox.radius;

            /*
            if (view.Renderer.GetGroundPlane()) {
                let bottomMin = new VIZCore.Vector3(view.Data.ObjectsBBox.min.x, view.Data.ObjectsBBox.min.y, view.Data.ObjectsBBox.min.z);
                let bottomMax = new VIZCore.Vector3(view.Data.ObjectsBBox.max.x, view.Data.ObjectsBBox.max.y, view.Data.ObjectsBBox.min.z);
                let bottomCenter = new VIZCore.Vector3((bottomMin.x + bottomMax.x) / 2, (bottomMin.y + bottomMax.y) / 2, (bottomMin.z + bottomMax.z) / 2)
                let groundRadius = new VIZCore.Vector3().copy(bottomCenter).sub(bottomMin).length();
                groundRadius *= 10.0;

                bbox.min.x -= groundRadius;
                bbox.min.y -= groundRadius;
                bbox.max.x += groundRadius;
                bbox.max.y += groundRadius;

                bbox.update();
            }
            */

            let nearFarRadius = bbox.radius;
            if(view.DemoType === 6)
            {
                nearFarRadius *= 5;
            }
            //scope.viewDistance = nearFarRadius * scope.viewDistanceFactor;


            if (radius <= 0) return false;

            const aspect = scope.clientWidth / scope.clientHeight;

            if (scope.perspectiveView) {
                //원근 카메라

                const fieldOfViewRadians = view.Util.DegToRad(scope.fieldOfView);
                scope.near = scope.CustomNearPlaneDist;
                scope.far = scope.CustomFarPlaneDist;

                scope.cameraPosition.set(0, 0, scope.viewDistance);

                //let eyePosition = new VIZCore.Vector3().copy(scope.cameraPosition);
                //scope.cameraPosition.set(0, 0, scope.viewDistance);
                //eyePosition.add(new VIZCore.Vector3(0, 0, scope.viewDistance));
                scope.cameraTarget.set(0, 0, 0);
                scope.cameraUp.set(0, 1, 0);

                let eyePosition = new VIZCore.Vector3();//new VIZCore.Vector3(0, 0, scope.viewDistance);
                eyePosition.copy(scope.cameraPosition);

                //array[8]
                let vBox = [
                    new VIZCore.Vector3(bbox.min.x, bbox.min.y, bbox.min.z),
                    new VIZCore.Vector3(bbox.min.x, bbox.min.y, bbox.max.z),
                    new VIZCore.Vector3(bbox.min.x, bbox.max.y, bbox.min.z),
                    new VIZCore.Vector3(bbox.min.x, bbox.max.y, bbox.max.z),
                    new VIZCore.Vector3(bbox.max.x, bbox.min.y, bbox.min.z),
                    new VIZCore.Vector3(bbox.max.x, bbox.min.y, bbox.max.z),
                    new VIZCore.Vector3(bbox.max.x, bbox.max.y, bbox.min.z),
                    new VIZCore.Vector3(bbox.max.x, bbox.max.y, bbox.max.z)
                ];

                if(scope.AutoZoomNearPlane) {
                    let controlMode = view.Control.GetMode();
                    if (controlMode !== VIZCore.Enum.CONTROL_STATE.WALKTHROUGH && 
                        controlMode !== VIZCore.Enum.CONTROL_STATE.FLY )
                   { // walkthrougth 모드와 Fly 모드는 동작하지 않음

                        //let center = new VIZCore.Vector3().copy(modelCenter);
                        //center.applyMatrix4(scope.cameraMatrix);

                        let vEyeCurrent = new VIZCore.Vector3().copy(eyePosition);

                        let v1 = new VIZCore.Vector3().subVectors(scope.cameraTarget, eyePosition);
                        v1.normalize();
                        
                        let firstZoomNear = true;
                        let zoomNear = 0;

                        let vRotateBox = [];

                        if(v1.x !== 0 || v1.y !== 0 || v1.z !== 0)
                        for (let i = 0; i < 8; ++i) {
                            vRotateBox[i] = new VIZCore.Vector3().copy(vBox[i]).applyMatrix4(scope.cameraMatrix);

                            let fCurrentDist = new VIZCore.Vector3().subVectors(vRotateBox[i], vEyeCurrent).length();

                            let v2 = new VIZCore.Vector3().subVectors(vRotateBox[i], vEyeCurrent);
                            v2.normalize();

                            let fCosine = v1.dot(v2);
                            fCurrentDist = fCurrentDist * fCosine;
                            //fCurrentDist = fCurrentDist * Math.abs(fCosine);                        

                            if(firstZoomNear) {
                                zoomNear = fCurrentDist;
                                firstZoomNear = false;
                            }
                            else {
                                zoomNear = Math.min(zoomNear, fCurrentDist);
                            }
                        }

                        if(!firstZoomNear) {
                            let zoomMinNear = scope.ZoomNearPlaneDist;                        
                            if(zoomNear < zoomMinNear) {

                                // 0.0001같은 오차 발생으로 offset 추가
                                let nearOffset = zoomMinNear * 0.01;

                                //위치 변경후 다시 재설정
                                scope.cameraMatrix.translate(0, 0, (zoomNear-(zoomMinNear + nearOffset)));
                                resizeGLWindow();
                                return;
                            }
                        }
                    }
                }

                //near
                //nearZoom = Math.min(Math.max(m_fViewDistanceCurrent / 1000, fCurrentModelRadius / 1000), 100);
                let viewDistNear = 0;
                {
                    let viewNearZoom = Math.min(Math.max(scope.viewDistance / view.Data.GetUnitValue(1000.0), radius / view.Data.GetUnitValue(1000.0)), view.Data.GetUnitValue(100));
                    scope.nearZoom = viewNearZoom;

                    //let viewNear = 1.0;
                    //let viewNear = Math.min(Math.max(scope.viewDistance / 1000.0, radius / 1000.0), 100);
                    let viewNear = Math.min(Math.max(scope.viewDistance / view.Data.GetUnitValue(1000.0), nearFarRadius / view.Data.GetUnitValue(1000.0)), view.Data.GetUnitValue(100));
                
                    //let viewNear = Math.max(Math.max(scope.viewDistance / view.Data.GetUnitValue(1000.0), nearFarRadius / view.Data.GetUnitValue(1000.0)), view.Data.GetUnitValue(100));
                    viewDistNear = viewNear;

                    let center = new VIZCore.Vector3().copy(modelCenter);
                    center.applyMatrix4(scope.cameraMatrix);

                    let v1 = new VIZCore.Vector3().subVectors(scope.cameraTarget, eyePosition);
                    v1.normalize();

                    let v2 = new VIZCore.Vector3().subVectors(center, eyePosition);
                    v2.normalize();

                    let fCurrentDist = new VIZCore.Vector3().subVectors(center, eyePosition).length();
                    let fCosine = v1.dot(v2);
                    fCurrentDist = fCurrentDist * fCosine;
                    viewNear = Math.max(viewNear, fCurrentDist - nearFarRadius);
                    
                    scope.near = viewNear;
                }

                //far
                {
                    let viewFar = nearFarRadius;

                    let vEyeCurrent = new VIZCore.Vector3().copy(eyePosition);
                    //vEyeCurrent.applyMatrix4(scope.cameraMatrix);

                    let v1 = new VIZCore.Vector3().subVectors(scope.cameraTarget, vEyeCurrent);
                    v1.normalize();

                    for (let i = 0; i < 8; ++i) {
                        vBox[i].applyMatrix4(scope.cameraMatrix);

                        let fCurrentDist = new VIZCore.Vector3().subVectors(vBox[i], vEyeCurrent).length();                   

                        //let v1 = new VIZCore.Vector3().subVectors(scope.cameraTarget, vEyeCurrent);
                        //v1.normalize();

                        let v2 = new VIZCore.Vector3().subVectors(vBox[i], vEyeCurrent);
                        v2.normalize();

                        let fCosine = v1.dot(v2);
                        fCurrentDist = fCurrentDist * Math.abs(fCosine);
                        viewFar = Math.max(viewFar, fCurrentDist);
                    }
                    scope.far = nearFarRadius / view.Data.GetUnitValue(1000.0) + viewFar;
                }

                
                if(!scope.AutoNearFarPlane) {
                    scope.near = scope.CustomNearPlaneDist;
                    scope.far = scope.CustomFarPlaneDist;
                }

                if (view.Avatar.ShowAvatar) {
                    let controlMode = view.Control.GetMode();
                    if (controlMode === VIZCore.Enum.CONTROL_STATE.WALKTHROUGH)
                    {
                        //아바타가 보이도록 수정
                        scope.near = Math.min(scope.near, viewDistNear);
                    }
                }
                
                let matrix = new VIZCore.Matrix4().perspective(fieldOfViewRadians, aspect, scope.near, scope.far);

                scope.projectionMatrixSrc = new VIZCore.Matrix4();
                scope.projectionMatrixSrc.elements = matrix;

                scope.projectionMatrix = new VIZCore.Matrix4();
                scope.projectionMatrix.copy(scope.projectionMatrixSrc);

                // scope.cameraMatrix = new VIZCore.Matrix4();
                //scope.cameraMatrix.setPosition(modelCenter.x, modelCenter.y, modelCenter.z);
                let modelCenterZero = new VIZCore.Vector3().copy(modelCenter).multiplyScalar(-1.0);

                //scope.cameraMatrix.setPosition(-modelCenter.x, -modelCenter.y, -modelCenter.z);
                //scope.cameraMatrix.setPosition(modelCenter);
                //scope.cameraMatrix.setPosition(modelCenterZero);

                //eyePosition = new VIZCore.Vector3();
                //scope.cameraTarget = new VIZCore.Vector3();
                //scope.cameraUp = new VIZCore.Vector3();
                //scope.cameraMatrix = new VIZCore.Matrix4();
                ////eyePosition.set(87614, 289, 50000); // H6501

                //const _cameraMatrix = m4.lookAt(eyePosition.toArray(), scope.cameraTarget.toArray(), scope.cameraUp.toArray());
                //let cameraMatrix = new VIZCore.Matrix4();
                //cameraMatrix.elements = _cameraMatrix;
                //let tmp = new VIZCore.Matrix4().lookAt(eyePosition, scope.cameraTarget, scope.cameraUp);
                let cameraMatrix = new VIZCore.Matrix4().lookAt(eyePosition, scope.cameraTarget, scope.cameraUp);

                scope.viewMatrix = new VIZCore.Matrix4().getInverse(cameraMatrix);

                scope.projectionMatrix.multiply(scope.viewMatrix);
            }
            else 
            {
                //평행 카메라

                let zoom = scope.cameraZoom;

                let width = radius * scope.viewDistanceFactor * zoom;
                let height = radius * scope.viewDistanceFactor * zoom;
                //let width = radius * zoom;
                //let height = radius * zoom;

                if (aspect > 1.0)
                {
                    width *= aspect;
                    //height /= aspect;
                }
                else
                {
                    //width *= aspect;
                    height /= aspect;
                }

                let screen_left = -width / 2.0;
                let screen_right = width / 2.0;
                let screen_top = -height / 2.0;
                let screen_bottom = height / 2.0;

                //scope.near = -radius * 5.0;
                //scope.far = radius * 5.0;

                scope.near = -nearFarRadius * 5.0;
                scope.far = nearFarRadius * 5.0;

                let matrix = new VIZCore.Matrix4().orthographic(screen_left, screen_right, screen_top, screen_bottom,
                    scope.near, scope.far);

                scope.projectionMatrixSrc = new VIZCore.Matrix4();
                scope.projectionMatrixSrc.elements = matrix;

                scope.projectionMatrix = new VIZCore.Matrix4();
                scope.projectionMatrix.copy(scope.projectionMatrixSrc);

                scope.viewMatrix = new VIZCore.Matrix4();
                scope.viewMatrix.copy(scope.cameraMatrix);

            }
       
            if (bbox.radius === 0)
                scope.cameraMatrix.identity(); //bbox 박스 생성 실패시 초기화.

            //const viewProjectionMatrix = new VIZCore.Matrix4().multiplyMatrices(scope.projectionMatrix, scope.viewMatrix);        
            scope.UpdateGLWindow(undefined);
            screenGLWindow();

            if (scope.projectionMatrixSrc.equals(lastGLWindow))
                changeGLWindow = false;

            return changeGLWindow;
        };

        /**
     * GL Windows View 재정렬
     * @return {FocusViewBoxZoomlean} 재정렬 상태
     */
        this.ResizeGLWindow = function (bbox) {
            return resizeGLWindow(bbox);
        };

        /**
        * matrix MV, matrix MVP Update 
        * @param {VIZCore.Matrix4} matrix Model matrix == undefined 인경우 초기값
        */
        this.UpdateGLWindow = function (matrix) {
            
            if (matrix === undefined) {
                matrix = new VIZCore.Matrix4().copy(scope.cameraMatrix);
            }

            scope.matModel = new VIZCore.Matrix4().copy(matrix);
            scope.matMV = new VIZCore.Matrix4().copy(matrix);
            scope.matMVP = new VIZCore.Matrix4().multiplyMatrices(scope.projectionMatrix, scope.matMV);
        };

        /**
         * Multi Camera 정보 복사
         * @param {Camera.js} camera 
         */
        this.CopyMultiCameraMatrix = function (camera) {
            scope.cameraMatrix.copy(camera.cameraMatrix);
            scope.viewMatrix.copy(camera.viewMatrix);
            scope.cameraZoom = camera.cameraZoom;
            
            scope.ResizeGLWindow();
        };

        function screenGLWindow() {

            let width = scope.clientWidth;
            let height = scope.clientHeight;

            let matrix = new VIZCore.Matrix4().orthographic(0, width, height, 0,
                -1000, 1000);

            scope.screenProjectionMatrix = new VIZCore.Matrix4();
            scope.screenProjectionMatrix.elements = matrix;
        }

        function mulViewDistance(mul) {

            //if (scope.cameraZoom * mul > 10E+4) return;

            let vPivotPos = new VIZCore.Vector3().copy(scope.pivot);
            //vPivotPos.applyMatrix4(scope.cameraMatrix);

            //이동전 screen 확인
            let lastPivot = new VIZCore.Vector3().copy(vPivotPos);
            let lastMVPmatrix = new VIZCore.Matrix4().copy(scope.matMVP);
            let vLastScreen = world2ScreenWithMatrix(lastMVPmatrix, lastPivot);

            const viewWidth = view.Renderer.GetSizeWidth();
            const viewHeight = view.Renderer.GetSizeHeight();

            // 피벗이 화면 밖에 있으면 강제로 가운데로 옮긴다
            if(!scope.lockPivot) {
                if (vLastScreen.x < 0 || vLastScreen.x > viewWidth || vLastScreen.y < 0 || vLastScreen.y > viewHeight) {
                    let tempScreenPivot = new VIZCore.Vector3(viewWidth / 2, viewHeight / 2, vLastScreen.z);
                    vLastScreen.copy(tempScreenPivot);

                    let tempWorldPivot = screen2WorldWithMatrix(lastMVPmatrix, tempScreenPivot);
                    //vPivotPos.copy(tempWorldPivot);
                    //scope.pivot.copy(tempWorldPivot);
                    scope.SetPivot(tempWorldPivot);

                    vPivotPos.copy(scope.pivot);
                }
            }

            scope.cameraZoom *= mul;        

            //zoom
            if (scope.perspectiveView) {
                scope.cameraMatrix.translate(0, 0, scope.viewDistance * (1.0 - mul) / 2.0);
            }

            //let translate = new VIZCore.Vector3().copy(scope.cameraTarget);
            //translate.multiplyScalar(mul);
            //scope.cameraPosition.add(translate);

            //Pivot 처리
            let vPivotTrans = new VIZCore.Vector3().copy(vPivotPos);
            if (vPivotTrans.z >= scope.viewDistance && scope.perspectiveView) return;

            resizeGLWindow();

            let pivot = new VIZCore.Vector3().copy(vPivotPos);
            let vCurrentScreen = world2ScreenWithMatrix(scope.matMVP, pivot);

            let vScreen1 = new VIZCore.Vector3(vLastScreen.x, vLastScreen.y, vCurrentScreen.z);
            let vScreen2 = new VIZCore.Vector3(vCurrentScreen.x, vCurrentScreen.y, vCurrentScreen.z);

            let world1 = screen2WorldWithMatrix(scope.projectionMatrix, vScreen1);
            let world2 = screen2WorldWithMatrix(scope.projectionMatrix, vScreen2);

            let vTrans = new VIZCore.Vector3().subVectors(world1, world2);

            scope.cameraMatrix.translate(vTrans.x, vTrans.y, vTrans.z);

            resizeGLWindow();
        }

        this.MulViewDistance = function (mul) {
            mulViewDistance(mul);
        };

        let world2ScreenWithMatrix = function (matrix, world) {
            let posWorld = new VIZCore.Vector3().copy(world);
            posWorld.applyMatrix4(matrix);
            let screen = new VIZCore.Vector3();
            screen.x = scope.clientWidth * (posWorld.x + 1.0) * 0.5;
            screen.y = scope.clientHeight * (1.0 - (posWorld.y + 1.0) * 0.5);
            screen.z = posWorld.z;
            return screen;
        };


        // World 2 Screen
        // @param {VIZCore.Matrix4} matrix matrix
        // @param {VIZCore.Vector3} world vector3
        // @returns {VIZCore.Vector3} screen
        this.world2ScreenWithMatrix = function (matrix, world) {
            return world2ScreenWithMatrix(matrix, world);
        };


        let screen2WorldWithMatrix = function (matrix, screen) {

            //screen.applyMatrix4(matrix);
            let world = new VIZCore.Vector3();
            world.x = (screen.x / scope.clientWidth) * 2.0 - 1.0;
            world.y = -(screen.y / scope.clientHeight * 2.0 - 1.0);
            world.z = screen.z;

            let matrixInv = new VIZCore.Matrix4().getInverse(matrix);
            world.applyMatrix4(matrixInv);
            return world;
        };

        // Screen 2 World
        // @param {VIZCore.Matrix4} matrix matrix
        // @param {VIZCore.Vector3} screen vector3
        // @returns {VIZCore.Vector3} world
        this.screen2WorldWithMatrix = function (matrix, screen) {
            return screen2WorldWithMatrix(matrix, screen);
        };

        //this.ResizeGLWindow = function () {
        //    resizeGLWindow();
        //};

        this.SetPerspectiveView = function (isPerspectiveView) {
            if (view.Camera.perspectiveView === isPerspectiveView) return;

            view.Camera.perspectiveView = isPerspectiveView;
            view.Camera.ResizeGLWindow();

            view.ViewRefresh();
        };

    /**
     * 원근 뷰 니어플랜 평면 반환
     * @returns Array<float> nearPlane값
     */
        this.GetPerspectiveNeaPlane = function() {
            let nearPlane = [1.0, 0.0, 0.0, 0.0];
            {
                let matMV = new VIZCore.Matrix4().copy(view.Camera.cameraMatrix);
                let matMVinv = new VIZCore.Matrix4().getInverse(matMV);

                let vCamWorldPosition = matMVinv.multiplyVector(view.Camera.cameraPosition);
                let vCamWorldTarget = matMVinv.multiplyVector(view.Camera.cameraTarget);

                let nearPlaneDist = view.Camera.near;
                let vCamDirection = new VIZCore.Vector3().subVectors(vCamWorldTarget, vCamWorldPosition);
                vCamDirection.normalize();

                // 니어플랜 평면 방정식 만든다
                nearPlane[0] = vCamDirection.x;
                nearPlane[1] = vCamDirection.y;
                nearPlane[2] = vCamDirection.z;

                let vNearPlanePos = new VIZCore.Vector3().addVectors(vCamWorldPosition, vCamDirection.multiplyScalar(nearPlaneDist));
                nearPlane[3] = -(nearPlane[0] * vNearPlanePos.x + nearPlane[1] * vNearPlanePos.y + nearPlane[2] * vNearPlanePos.z);
            }

            // {
            //     let matMV = new VIZCore.Matrix4().copy(view.Camera.cameraMatrix);
            //     let matMVinv = new VIZCore.Matrix4().getInverse(matMV);

            //     let vCamWorldPosition = scope.GetPerspectiveEyePos();
            //     let nearPlaneDist = view.Camera.near;
            //     let vCamDirection = scope.GetCameraDirVector();
            //     vCamDirection.multiplyScalar(-1);

            //     vCamDirection.normalize();

            //     // 니어플랜 평면 방정식 만든다
            //     nearPlane[0] = vCamDirection.x;
            //     nearPlane[1] = vCamDirection.y;
            //     nearPlane[2] = vCamDirection.z;

            //     let vNearPlanePos = new VIZCore.Vector3().addVectors(vCamWorldPosition, vCamDirection.multiplyScalar(nearPlaneDist));
            //     nearPlane[3] = -(nearPlane[0] * vNearPlanePos.x + nearPlane[1] * vNearPlanePos.y + nearPlane[2] * vNearPlanePos.z);
            // }


            return nearPlane;
        }

        //+Z
        this.ViewTopPlan = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
           
            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };
        //-Z
        this.ViewBottomPlan = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            let rotate = new VIZCore.Matrix4().makeRotationX(3.141592654);
            rotate.multiply(scope.cameraMatrix);
            scope.cameraMatrix.copy(rotate);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
            
            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };
        //-Y
        this.ViewFrontSection = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0, 0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();

            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };
        //+Y
        this.ViewBackSection = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0, 0);
            scope.cameraMatrix.rotate(0, 3.141592654, 0, 0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
            
            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };
        //+X
        this.ViewRightElevation = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0, 0);
            scope.cameraMatrix.rotate(0, -3.141592654 / 2.0, 0, 0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
            
            view.ViewRefresh();
            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };
        //-Y
        this.ViewLeftElevation = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0, 0);
            scope.cameraMatrix.rotate(0, 3.141592654 / 2.0, 0, 0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
            
            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };

        this.ViewISOPlus = function () {
            if(scope.LockCamera)
                return;
            //console.log("ViewISOPlus :: Call!!");
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            if (scope.useYUp) {
                scope.cameraMatrix.rotate(0.0, 3.141592654, 0.0);

                scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
                scope.cameraMatrix.rotate(0.0, 0.0, -3.141592654 / 2.0);
                scope.cameraMatrix.rotate(0.0, 0.0, -3.141592654 / 4.0);
                scope.cameraMatrix.rotate(+3.141592654 / 2.0, 0.0, 0.0);

                // ISO 30도
                scope.cameraMatrix.rotate(+3.141592654 / 180.0 * 30, 0.0, 0.0);
            }
            else {
                scope.cameraMatrix.rotate(0.0, 0.0, 3.141592654);
                scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
                scope.cameraMatrix.rotate(0.0, -3.141592654 / 2.0, 0.0);
                scope.cameraMatrix.rotate(0.0, -3.141592654 / 4.0, 0.0);
                scope.cameraMatrix.rotate(+3.141592654 / 4.0, 0.0, 0.0);

                // ISO 30도
                scope.cameraMatrix.rotate(-3.141592654 / 180.0 * 15, 0.0, 0.0);
            }

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
            
            view.ViewRefresh();
            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };

        this.ViewISOMinus = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
            scope.cameraMatrix.rotate(0.0, 3.141592654 / 2.0, 0.0);
            scope.cameraMatrix.rotate(0.0, -3.141592654 / 4.0, 0.0);
            scope.cameraMatrix.rotate(-3.141592654 / 4.0 * 5.0, 0.0, 0.0);
            scope.cameraMatrix.rotate(0.0, 3.141592654, 0.0);

            // ISO 30도
            scope.cameraMatrix.rotate(-3.141592654 / 180.0 * 15, 0.0, 0.0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
            
            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };

        this.ViewCustom = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            if(false)
            {
                //scope.viewDistanceFactor = 0.55;
                let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(scope.pivot);
                let fOldZoom = scope.cameraZoom;
                resetGLWindow();

                if (scope.useYUp) {
                    scope.cameraMatrix.rotate(0.0, 3.141592654, 0.0);

                    scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
                    scope.cameraMatrix.rotate(0.0, 0.0, -3.141592654 / 2.0);
                    scope.cameraMatrix.rotate(0.0, 0.0, -3.141592654 / 4.0);
                    scope.cameraMatrix.rotate(+3.141592654 / 2.0, 0.0, 0.0);

                    // ISO 30도
                    scope.cameraMatrix.rotate(+3.141592654 / 180.0 * 30, 0.0, 0.0);
                }
                else {
                    //scope.cameraMatrix.rotate(0.0, 0.0, 3.141592654);
                    //scope.cameraMatrix.rotate(0.0, 0.0, 3.141592654 / 2 * 2);
                    //scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
                    //scope.cameraMatrix.rotate(0.0, -3.141592654 / 2.0, 0.0);
                    //scope.cameraMatrix.rotate(0.0, -3.141592654 / 4.0, 0.0);
                    //scope.cameraMatrix.rotate(+3.141592654 / 4.0, 0.0, 0.0);

                    // ISO 30도
                    scope.cameraMatrix.rotate(-3.141592654 / 180.0 * 45, 0.0, 0.0);
                }

                let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(scope.pivot);
                scope.cameraZoom = fOldZoom;
                scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
                let vTrans = new VIZCore.Vector3(0, 1150000, 0);
                let matTranslation = new VIZCore.Matrix4();
                matTranslation.makeTranslation(vTrans.x, vTrans.y, vTrans.z);
                //view.Camera.cameraMatrix.multiply(matTranslation);
                let matModelMatrix = new VIZCore.Matrix4().copy(view.Camera.cameraMatrix);
                view.Camera.cameraMatrix.multiplyMatrices(matTranslation, matModelMatrix);
            }
            else if(view.DemoType === 6)            
            {
                let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(scope.pivot);
                let fOldZoom = scope.cameraZoom;
                //let fOldZoom = 0.5;
                resetGLWindow();

                scope.cameraMatrix.rotate(3.141592654 * 0.25, 0.0, 0.0);

                let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(scope.pivot);
                scope.cameraZoom = fOldZoom;
                scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            }
            else {
                let vSrcPivot = new VIZCore.Vector3();
                if(scope.pivot !== undefined)
                    vSrcPivot.copy(scope.pivot);
    
                let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
                let fOldZoom = scope.cameraZoom;
                resetGLWindow();

                scope.cameraMatrix.copy(baseCustomDirectionMatrix);
                let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));

                scope.cameraZoom = fOldZoom;
                scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
                scope.pivot = vSrcPivot;                
            }

            resizeGLWindow();
           
            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };

        this.ViewCustomMatrix = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }
            
            {
                //let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(scope.pivot);
                let fOldZoom = scope.cameraZoom;
                resetGLWindow();

                scope.cameraMatrix.copy(baseCustomDirectionMatrix);
                //let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(scope.pivot);
                
                //let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
                scope.cameraZoom = fOldZoom;
                //scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
                
            }

            resizeGLWindow();
           
            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };


        // -x -y -z
        this.ViewISOLeftFrontBottom = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(0.0, 0.0, 3.141592654);
            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
            scope.cameraMatrix.rotate(0.0, -3.141592654 / 2.0, 0.0);
            scope.cameraMatrix.rotate(0.0, -3.141592654 / 4.0, 0.0);

            // ISO 30도
            scope.cameraMatrix.rotate(-3.141592654 / 180.0 * 30, 0.0, 0.0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
            
            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };

        // -x -y +z
        this.ViewISOLeftFrontTop = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(0.0, 0.0, 3.141592654);
            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
            scope.cameraMatrix.rotate(0.0, -3.141592654 / 2.0, 0.0);
            scope.cameraMatrix.rotate(0.0, -3.141592654 / 4.0, 0.0);
            scope.cameraMatrix.rotate(+3.141592654 / 4.0, 0.0, 0.0);

            // ISO 30도
            scope.cameraMatrix.rotate(-3.141592654 / 180.0 * 15, 0.0, 0.0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
            
            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };

        // -x +y -z
        this.ViewISOLeftBackBottom = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(0.0, 0.0, 3.141592654);
            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
            scope.cameraMatrix.rotate(0.0, -3.141592654 / 2.0, 0.0);
            scope.cameraMatrix.rotate(0.0, 3.141592654 / 4.0, 0.0);

            // ISO 30도
            scope.cameraMatrix.rotate(-3.141592654 / 180.0 * 30, 0.0, 0.0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
          
            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };

        // -x +y +z
        this.ViewISOLeftBackTop = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(0.0, 0.0, 3.141592654);
            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
            scope.cameraMatrix.rotate(0.0, -3.141592654 / 2.0, 0.0);
            scope.cameraMatrix.rotate(0.0, 3.141592654 / 4.0, 0.0);
            scope.cameraMatrix.rotate(+3.141592654 / 4.0, 0.0, 0.0);

            // ISO 30도
            scope.cameraMatrix.rotate(-3.141592654 / 180.0 * 15, 0.0, 0.0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
           
            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };

        // +x -y -z
        this.ViewISORightFrontBottom = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(0.0, 0.0, 3.141592654);
            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
            scope.cameraMatrix.rotate(0.0, 3.141592654 / 2.0, 0.0);
            scope.cameraMatrix.rotate(0.0, 3.141592654 / 4.0, 0.0);        

            // ISO 30도
            scope.cameraMatrix.rotate(-3.141592654 / 180.0 * 30, 0.0, 0.0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
            
            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };

        // +x -y +z
        this.ViewISORightFrontTop = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(0.0, 0.0, 3.141592654);
            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
            scope.cameraMatrix.rotate(0.0, 3.141592654 / 2.0, 0.0);
            scope.cameraMatrix.rotate(0.0, 3.141592654 / 4.0, 0.0);
            scope.cameraMatrix.rotate(+3.141592654 / 4.0, 0.0, 0.0);

            // ISO 30도
            scope.cameraMatrix.rotate(-3.141592654 / 180.0 * 15, 0.0, 0.0);

            //scope.cameraMatrix.rotate(-3.141592654 / 180.0 * 35, 0.0, 0.0);
            //scope.cameraMatrix.rotate(0.0, -3.141592654 / 180.0 * 90, 0.0);
            //scope.cameraMatrix.rotate(3.141592654 / 180.0 * 30, 0.0, 0.0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            //scope.cameraMatrix.translate(vPivotNew.x - vPivotOld.x, vPivotNew.y - vPivotOld.y, vPivotNew.z - vPivotOld.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
           
            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };

        // +x +y -z
        this.ViewISORightBackBottom = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(0.0, 0.0, 3.141592654);
            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
            scope.cameraMatrix.rotate(0.0, 3.141592654 / 4.0, 0.0);

            // ISO 30도
            scope.cameraMatrix.rotate(-3.141592654 / 180.0 * 30, 0.0, 0.0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
            
            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        }; 

        // +x +y +z
        this.ViewISORightBackTop = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));

            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(0.0, 0.0, 3.141592654);
            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
            scope.cameraMatrix.rotate(0.0, 3.141592654 / 4.0, 0.0);
            scope.cameraMatrix.rotate(3.141592654 / 4.0, 0.0, 0.0);

            // ISO 30도
            scope.cameraMatrix.rotate(-3.141592654 / 180.0 * 15, 0.0, 0.0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
            
            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        }; 
        
        // -x -y
        this.ViewLeftFrontSide = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(0.0, 0.0, 3.141592654);
            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
            scope.cameraMatrix.rotate(0.0, -3.141592654, 0.0);
            scope.cameraMatrix.rotate(0.0, 3.141592654 / 4.0, 0.0);
            //scope.cameraMatrix.rotate(3.141592654 / 4.0, 0.0, 0.0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();

            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        }; 

        // -x +y
        this.ViewLeftBackSide = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(0.0, 0.0, 3.141592654);
            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
            scope.cameraMatrix.rotate(0.0, -3.141592654 / 4.0, 0.0);
            //scope.cameraMatrix.rotate(+3.141592654 / 4.0, 0.0, 0.0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
            
            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        }; 

        // -x -z
        this.ViewLeftBottomSide = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(0.0, 0.0, 3.141592654);
            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
            scope.cameraMatrix.rotate(0.0, -3.141592654 / 2.0, 0.0);
            scope.cameraMatrix.rotate(3.141592654 / 4.0, 0.0, 0.0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
           
            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        }; 

        // -x +z
        this.ViewLeftTopSide = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(0.0, 0.0, 3.141592654);
            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
            scope.cameraMatrix.rotate(0.0, -3.141592654 / 2.0, 0.0);
            scope.cameraMatrix.rotate(3.141592654 / 4.0, 0.0, 0.0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
            
            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        }; 

        // +x -y
        this.ViewRightFrontSide = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(0.0, 0.0, 3.141592654);
            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
            scope.cameraMatrix.rotate(0.0, -3.141592654, 0.0);
            scope.cameraMatrix.rotate(0.0, -3.141592654 / 4.0, 0.0);
            //scope.cameraMatrix.rotate(3.141592654 / 4.0, 0.0, 0.0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();

            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };

        // +x +y
        this.ViewRightBackSide = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(0.0, 0.0, 3.141592654);
            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
            scope.cameraMatrix.rotate(0.0, 3.141592654 / 4.0, 0.0);
            //scope.cameraMatrix.rotate(3.141592654 / 4.0, 0.0, 0.0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
           
            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };

        // +x -z
        this.ViewRightBottomSide = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(0.0, 0.0, 3.141592654);
            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
            scope.cameraMatrix.rotate(0.0, -3.141592654 / 2.0, 0.0);
            scope.cameraMatrix.rotate(-3.141592654 / 4.0, 0.0, 0.0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
            
            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };

        // +x +z
        this.ViewRightTopSide = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(0.0, 0.0, 3.141592654);
            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
            scope.cameraMatrix.rotate(0.0, 3.141592654 / 2.0, 0.0);
            scope.cameraMatrix.rotate(3.141592654 / 4.0, 0.0, 0.0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
           
            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };

        // -y -z
        this.ViewFrontBottomSide = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(0.0, 0.0, 3.141592654);
            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
            scope.cameraMatrix.rotate(0.0, -3.141592654, 0.0);
            scope.cameraMatrix.rotate(-3.141592654 / 4.0, 0.0, 0.0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
           
            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };

        // -y +z
        this.ViewFrontTopSide = function () {
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(0.0, 0.0, 3.141592654);
            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
            scope.cameraMatrix.rotate(0.0, -3.141592654, 0.0);
            scope.cameraMatrix.rotate(3.141592654 / 4.0, 0.0, 0.0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
            
            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };

        // +y -z
        this.ViewBackBottomSide = function () {

            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(0.0, 0.0, 3.141592654);
            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
            //scope.cameraMatrix.rotate(0.0, -3.141592654, 0.0);
            scope.cameraMatrix.rotate(-3.141592654 / 4.0, 0.0, 0.0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
            
            view.ViewRefresh();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };

        // +y +z
        this.ViewBackTopSide = function () {

            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let vSrcPivot = new VIZCore.Vector3();
            if(scope.pivot !== undefined)
                vSrcPivot.copy(scope.pivot);

            let vPivotOld = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            let fOldZoom = scope.cameraZoom;
            resetGLWindow();

            scope.cameraMatrix.rotate(0.0, 0.0, 3.141592654);
            scope.cameraMatrix.rotate(-3.141592654 / 2.0, 0.0, 0.0);
            scope.cameraMatrix.rotate(3.141592654 / 4.0, 0.0, 0.0);

            let vPivotNew = new VIZCore.Matrix4().copy(scope.cameraMatrix).multiplyVector(new VIZCore.Vector3().copy(vSrcPivot));
            scope.cameraZoom = fOldZoom;
            scope.cameraMatrix.translate(vPivotOld.x - vPivotNew.x, vPivotOld.y - vPivotNew.y, vPivotOld.z - vPivotNew.z);
            scope.pivot = vSrcPivot;

            resizeGLWindow();
          
            view.ViewRefresh();
            
            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };



        /**
        * Camera 회전
        * @param {VIZCore.Vector3} angle 회전 angle x, y, z
        * @param {VIZCore.Vector3} pivot 피벗 x, y, z
        */
        this.CameraRotate = function (angle, pivot) {
            
            let matX = new VIZCore.Matrix4().makeRotationX(angle.x);
            let matY = new VIZCore.Matrix4().makeRotationY(angle.y);
            let matZ = new VIZCore.Matrix4().makeRotationZ(angle.z);

            if(pivot === undefined)
                pivot = new VIZCore.Vector3().copy(scope.pivot);

            if (view.FixZAxis) {

                if(scope.useYUp)
                {
                    let matMVMatrix = new VIZCore.Matrix4().copy(scope.matMV);

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
        
                        let rotateMatrix = new VIZCore.Matrix4().copy(matY);
        
                        let translateZeroToPivotMatrix = new VIZCore.Matrix4().setPosition(pivotWithModelCenterOffset);
        
                        let tmpMatrix = new VIZCore.Matrix4().multiplyMatrices(rotateMatrix, translatePivotToZeroMatrix);
                        rotateZByPivotMatrix = new VIZCore.Matrix4().multiplyMatrices(translateZeroToPivotMatrix, tmpMatrix);
                    }
                    
                    if (scope.useUpVectorFixRotateVAngleRange) {
                        let tmp2Matrix = new VIZCore.Matrix4().multiplyMatrices(matMVMatrix, rotateZByPivotMatrix);
                        let matUpdateMVMatrix = new VIZCore.Matrix4().multiplyMatrices(rotateByPivotMatrix, tmp2Matrix);
        
                        let vUpdateUpPos = new VIZCore.Vector3(0, 1, 0);
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
                            angle.x = minAngle - fAngle + angle.x;
                            scope.CameraRotate(angle);
                            return;
                        }
        
                        if (fAngle > maxAngle) {
                            angle.x = maxAngle - fAngle + angle.x;
                            scope.CameraRotate(angle);
                            return;
                        }
        
                    }
        
                    let tmp2Matrix = new VIZCore.Matrix4().multiplyMatrices(scope.cameraMatrix, rotateZByPivotMatrix);
                    scope.cameraMatrix = new VIZCore.Matrix4().multiplyMatrices(rotateByPivotMatrix, tmp2Matrix);
                }
                else
                {
                    let matMVMatrix = new VIZCore.Matrix4().copy(scope.matMV);

                    {
                        let matMVRotateMatrix = new VIZCore.Matrix4().copy(matMVMatrix);
                        matMVRotateMatrix.setPosition(new VIZCore.Vector3(0, 0, 0));
        
                        let vUpPos = new VIZCore.Vector3(0, 0, 1);
                        let vZeroPos = new VIZCore.Vector3(0, 0, 0);
                        vUpPos.applyMatrix4(matMVRotateMatrix);
                        vZeroPos.applyMatrix4(matMVRotateMatrix);
        
                        if (vUpPos.y < vZeroPos.y)
                            matZ = new VIZCore.Matrix4().makeRotationZ(-angle.z);
        
                        if (scope.useUpVectorFixRotateVAngleRange) {
        
                            let fAngle = Math.acos(vUpPos.y);
        
                            let minAngle = fixUpVectorMinAngle * Math.PI / 180.0;
                            let maxAngle = fixUpVectorMaxAngle * Math.PI / 180.0;
        
                            if (vUpPos.z < 0)
                                fAngle *= -1.0;
        
                            //복귀 코드
                            if (fAngle - angle.x < minAngle) {
                                //angle.x = fAngle;
                                angle.x = minAngle + angle.x - fAngle;
                            }
        
                            if (fAngle - angle.x > maxAngle) {
                                //angle.x = fAngle - Math.PI / 2.0;
                                angle.x = maxAngle - fAngle + angle.x;
                            }
        
        
                            matX = new VIZCore.Matrix4().makeRotationX(angle.x);
                            //matY = new VIZCore.Matrix4().makeRotationAxis(new VIZCore.Vector3(0, 0, 1), angle.y);
                        }
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
        
                    if (scope.useUpVectorFixRotateVAngleRange) {
                        //if (false) {
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
                            scope.CameraRotate(angle);
                            return;
                        }
        
                        if (fAngle > maxAngle) {
                            //angle.x = fAngle - Math.PI / 2.0;
                            //angle.x = maxAngle - fAngle + angle.x;
                            angle.x = maxAngle - fAngle + angle.x;
                            scope.CameraRotate(angle);
                            return;
                        }
        
                        //matX = new VIZCore.Matrix4().makeRotationX(angle.x);
                        //matY = new VIZCore.Matrix4().makeRotationAxis(new VIZCore.Vector3(0, 0, 1), angle.y);
                    }
        
                    let tmp2Matrix = new VIZCore.Matrix4().multiplyMatrices(scope.cameraMatrix, rotateZByPivotMatrix);
                    scope.cameraMatrix = new VIZCore.Matrix4().multiplyMatrices(rotateByPivotMatrix, tmp2Matrix);
                }
            }
            else {
                if(scope.FixWorldAxis) {
                    scope.CameraRotateByWorldAxis(scope.WorldAxis, angle);
                    return;
                    //angle = new VIZCore.Vector3().copy(vFixDirection).multiplyScalar(fDot);
                    //console.log("angle : " + angle.x + ", " + angle.y  + ", " + angle.z );
                }
                else
                {
                    let rotateMatrix = new VIZCore.Matrix4().multiplyMatrices(new VIZCore.Matrix4().multiplyMatrices(matX, matY), matZ);
                    scope.CameraRotateByMatrix(rotateMatrix, pivot);
                }
            }

        };

        /**
        * Camera 회전
        * @param {VIZCore.Vector3} axis 고정축
        * @param {VIZCore.Vector3} angle 회전 angle x, y, z
        */
        this.CameraRotateByWorldAxis = function (axis, angle) {
            
            let matMVRotateMatrix = new VIZCore.Matrix4().copy(scope.matMV);
            matMVRotateMatrix.setPosition(new VIZCore.Vector3(0, 0, 0));

            //let vFixPos = new VIZCore.Vector3().copy(scope.WorldAxis);
            
            if(axis === undefined) {
                axis = scope.WorldAxis;
            }

            let vFixPos = new VIZCore.Vector3().copy(axis);
            let vZeroPos = new VIZCore.Vector3(0, 0, 0);
            vFixPos.applyMatrix4(matMVRotateMatrix);
            vZeroPos.applyMatrix4(matMVRotateMatrix);

            let vFixDirection = new VIZCore.Vector3().subVectors(vFixPos, vZeroPos);
            vFixDirection.normalize();
            let fDot = vFixDirection.dot(angle);
                                    
            let fixRotateMatrix = new VIZCore.Matrix4().makeRotationAxis(vFixDirection, fDot);
            scope.CameraRotateByMatrix(fixRotateMatrix);
        };


        /**
        * Camera 회전
        * @param {VIZCore.Matrix4} rotateMatrix 회전 matrix
        * @param {VIZCore.Vector3} pivot 회전 pivot
        * */
        this.CameraRotateByMatrix = function (rotateMatrix, pivot) {

            if (pivot === undefined)
                pivot = view.Camera.pivot;

            let pivotWithModelCenterOffset = new VIZCore.Vector3().copy(pivot);
            pivotWithModelCenterOffset.applyMatrix4(scope.matMV);

            let translateZeroToPivotMatrix = new VIZCore.Matrix4().setPosition(pivotWithModelCenterOffset);

            let pivotZero = new VIZCore.Vector3().copy(pivotWithModelCenterOffset).multiplyScalar(-1);
            let translatePivotToZeroMatrix = new VIZCore.Matrix4().setPosition(pivotZero);

            let tmpMatrix = new VIZCore.Matrix4().multiplyMatrices(rotateMatrix, translatePivotToZeroMatrix);
            let rotateByPivotMatrix = new VIZCore.Matrix4().multiplyMatrices(translateZeroToPivotMatrix, tmpMatrix);

            scope.cameraPosition.applyMatrix4(rotateByPivotMatrix);

            scope.cameraTarget.applyMatrix4(rotateMatrix);
            scope.cameraTarget.normalize();

            scope.cameraUp.applyMatrix4(rotateMatrix);
            scope.cameraUp.normalize();

            scope.cameraMatrix = new VIZCore.Matrix4().multiplyMatrices(rotateByPivotMatrix, view.Camera.cameraMatrix);
        };

        /**
        * Camera 회전
        * @param {VIZCore.Matrix4} rotateMatrix 회전 matrix
        * @param {VIZCore.Matrix4} matMVMatrix MV
        * */
        this.CameraRotateWithMV = function (rotateMatrix, matMVMatrix) {
            //let pivotWithModelCenterOffset = new VIZCore.Vector3().copy(view.Camera.pivot);
            //pivotWithModelCenterOffset.applyMatrix4(matMVMatrix);
            //
            //let translateZeroToPivotMatrix = new VIZCore.Matrix4().setPosition(pivotWithModelCenterOffset);
            //
            //let pivotZero = new VIZCore.Vector3().copy(pivotWithModelCenterOffset).multiplyScalar(-1);
            //let translatePivotToZeroMatrix = new VIZCore.Matrix4().setPosition(pivotZero);
            //
            //let tmpMatrix = new VIZCore.Matrix4().multiplyMatrices(rotateMatrix, translatePivotToZeroMatrix);
            //let rotateByPivotMatrix = new VIZCore.Matrix4().multiplyMatrices(translateZeroToPivotMatrix, tmpMatrix);

            //scope.cameraPosition.applyMatrix4(rotateByPivotMatrix);
            scope.cameraPosition.applyMatrix4(rotateMatrix);

            scope.cameraTarget.applyMatrix4(rotateMatrix);
            scope.cameraTarget.normalize();

            scope.cameraUp.applyMatrix4(rotateMatrix);
            scope.cameraUp.normalize();
        };

        this.CameraOrbit = function (angle){
        
        };

        /**
     * Camera 이동
     * @param {VIZCore.Vector3} translate 이동
     * */
        this.CameraTranslate = function (translate) {

            let matTranslation = new VIZCore.Matrix4();
            matTranslation.makeTranslation(translate.x, translate.y, translate.z);

            if (view.FixZAxis &&
                scope.useCameraUpVectorMinPosition && scope.perspectiveView) {
                
                let matUpdateMatrix = new VIZCore.Matrix4().copy(scope.cameraMatrix);
                matUpdateMatrix.multiplyMatrices(matTranslation, matUpdateMatrix);
                let matUpdateMatrixinv = new VIZCore.Matrix4().getInverse(matUpdateMatrix);

                let vUpdateEyePos = matUpdateMatrixinv.multiplyVector(scope.cameraPosition);

                if (vUpdateEyePos.z < fixUpVectorMinPosition) {
                    matTranslation.makeTranslation(translate.x, translate.y - (fixUpVectorMinPosition - vUpdateEyePos.z), translate.z);
                    //return;
                }
            }


            scope.CameraTranslateByMatrix(matTranslation);
        };

        /**
     * Camera 이동
     * @param {VIZCore.Matrix4} matrix 이동 matrix
     * */
        this.CameraTranslateByMatrix = function (matrix) {
            let matModelMatrix = new VIZCore.Matrix4().copy(scope.cameraMatrix);
            scope.cameraMatrix.multiplyMatrices(matrix, matModelMatrix);
        };
        
        /**
         * Camera 확대 및 축소
         * @param {boolean} zoomIn true : 확대, false : 축소
         * @param {Number} zoomRatio 확대 및 축소 크기
         */
        this.CameraZoomInOut = function (zoomIn, zoomRatio) {
            let cameraZoomRatio = scope.cameraZoomRatio;

            try {
                cameraZoomRatio = view.Configuration.Control.Zoom.Ratio;
            }
            catch(e) {

            }

            let fZoomValue = zoomRatio;

            if(zoomRatio === undefined) zoomRatio = 1.0;

            if (scope.perspectiveView) {
                let vPos = new VIZCore.Vector3().copy(scope.pivot);

                let vEye = scope.GetPerspectiveEyePos();

                let vPosWithEyeSub = new VIZCore.Vector3().subVectors(vPos, vEye);
                let subLength = vPosWithEyeSub.length();
                if (subLength < 0.0) subLength = 0;
                let distMul = (subLength - scope.nearZoom * 1.5);
                distMul = Math.abs(distMul);

                let fMulVal = distMul * fZoomValue;
                fZoomValue = fMulVal / scope.viewDistance;

                let minZoomValue = view.Configuration.Control.Zoom.MinZoomValue * 0.0001;
                if (fZoomValue > 0.5) fZoomValue = 0.5;

                else if (fZoomValue < minZoomValue) 
                {
                    fZoomValue = minZoomValue;
                }

                if(view.Configuration.Control.Zoom.UseFixed)
                    fZoomValue = cameraZoomRatio; //0.15
            }
            else {
                fZoomValue *= 0.5;
            }

            if (zoomIn) {
                scope.MulViewDistance((1.0 - fZoomValue) * zoomRatio);
            }
            else {
                scope.MulViewDistance(1.0 / ((1.0 - fZoomValue) * zoomRatio));
            }
        };

        /**
        * 피봇 설정    
        * @param {VIZCore.Vector3} point 위치
        * */
        this.SetPivot = function (point) {
            if(scope.lockPivot) return;

            scope.pivot.copy(point);
        };

        /**
        * Zoom
        * 원근의 경우 pivot 을 기준으로 zoom 조정
        * @param {Number} x1 screen x1 좌표 min
        * @param {Number} y1 screen y1 좌표 min
        * @param {Number} x2 screen x2 좌표 max
        * @param {Number} y2 screen y1 좌표 max
        */
        this.ViewBoxZoom = function (x1, y1, x2, y2) {

            if (x1 === x2 || y1 === y2) return;

            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            const viewWidth = view.Renderer.GetSizeWidth();
            const viewHeight = view.Renderer.GetSizeHeight();

            // 비율 구한다
            const hRatio = (x2 - x1) / viewWidth;
            const vRatio = (y2 - y1) / viewHeight;
            const ratio = Math.max(hRatio, vRatio);

            if (scope.perspectiveView) {

                //let world1 = world2ScreenWithMatrix(scope.matMVP, new VIZCore.Vector3(x1, y1, 0));
                //let world2 = world2ScreenWithMatrix(scope.matMVP, new VIZCore.Vector3(x2, y2, 0));

                // let world1 = screen2WorldWithMatrix(scope.matMVP, new VIZCore.Vector3(x1, y1, 0.9));
                // let world2 = screen2WorldWithMatrix(scope.matMVP, new VIZCore.Vector3(x2, y2, 0.9));

                // let minPos = new VIZCore.Vector3().copy(world1);
                // let maxPos = new VIZCore.Vector3().copy(world1);

                // minPos.min(world2);
                // maxPos.max(world2);

                // let worldBBox = new VIZCore.BBox();
                // worldBBox.min.copy(minPos);
                // worldBBox.max.copy(maxPos);
                // worldBBox.update();

                //scope.FocusBBox(worldBBox);

                // v1 Zoom Screen
                // //확대 위치 피봇 설정
                // let position = view.Renderer.PickPositionObject((x2 - x1) / 2, (y2 - y1) / 2);
                // if (position !== undefined) {
                //     //피봇 이동
                //     scope.SetPivot(position);
                // }

                let vPivot = new VIZCore.Vector3().copy(scope.pivot);

                // //원근
                let screenPivot = world2ScreenWithMatrix(scope.matMVP, new VIZCore.Vector3().copy(vPivot));

                let lastScreen = new VIZCore.Vector3().copy(screenPivot);
                lastScreen.x = viewWidth / 2; lastScreen.y = viewHeight / 2;
                screenPivot.x = (x1 + x2) / 2; screenPivot.y = (y1 + y2) / 2;

                let worldPivot = screen2WorldWithMatrix(scope.matMVP, screenPivot);
                let vPivotCamera = new VIZCore.Vector3().copy(worldPivot).applyMatrix4(scope.cameraMatrix);

                let viewDistance = scope.viewDistance - vPivotCamera.z;

                const currentDist = viewDistance;
                const moveDist = viewDistance * ratio;
                const zTrans = currentDist - moveDist;

                scope.cameraMatrix.translate(0, 0, zTrans);
                resizeGLWindow();

                // //보정
                {
                    let currentScreen = world2ScreenWithMatrix(scope.matMVP, new VIZCore.Vector3().copy(vPivot));

                    //해당 위치로 화면 중심정렬
                    let vScreen1, vScreen2, vWorld1, vWorld2;

                    vScreen1 = new VIZCore.Vector3(lastScreen.x, lastScreen.y, currentScreen.z); //기존 화면
                    vScreen2 = new VIZCore.Vector3(currentScreen.x, currentScreen.y, currentScreen.z); //현재 화면 

                    vWorld1 = screen2WorldWithMatrix(scope.projectionMatrix, vScreen1);
                    vWorld2 = screen2WorldWithMatrix(scope.projectionMatrix, vScreen2);

                    let vTrans = new VIZCore.Vector3().subVectors(vWorld2, vWorld1);

                    if (currentScreen.z > 1.0)
                        vTrans = vTrans.multiplyScalar(-1.0);

                    scope.cameraMatrix.translate(-vTrans.x, -vTrans.y, -vTrans.z);
                    resizeGLWindow();
                }
            }
            else {
                //평행       

                //해당 위치로 화면 중심정렬
                let vZero, vScreen1, vScreen2, vWorld1, vWorld2;
                vZero = world2ScreenWithMatrix(scope.matMVP, new VIZCore.Vector3());

                vScreen1 = new VIZCore.Vector3(viewWidth / 2, viewHeight / 2, vZero.z); //화면 중심
                vScreen2 = new VIZCore.Vector3((x1 + x2) / 2, (y1 + y2) / 2, vZero.z); //피벗

                vWorld1 = screen2WorldWithMatrix(scope.projectionMatrix, vScreen1);
                vWorld2 = screen2WorldWithMatrix(scope.projectionMatrix, vScreen2);

                const vTrans = new VIZCore.Vector3().subVectors(vWorld2, vWorld1);
                scope.cameraMatrix.translate(vTrans.x, vTrans.y, vTrans.z);

                // 확대한다
                scope.MulViewDistance(ratio);

                resizeGLWindow();
            }

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };

        /**
        * Zoom
        * 원근의 경우 pivot 을 기준으로 zoom 조정
        * @param {Number} x1 screen x1 좌표 min
        * @param {Number} y1 screen y1 좌표 min
        * @param {Number} x2 screen x2 좌표 max
        * @param {Number} y2 screen y1 좌표 max
        */
        this.FocusViewBoxZoom = function (x1, y1, x2, y2, focusPos) {

            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let prevCameraAnimation = scope.cameraAnimation;
            scope.cameraAnimation = false;
        
            scope.SetPivot(focusPos);
            scope.ViewBoxZoom(x1, y1, x2, y2);
            scope.FocusPivot(focusPos);

            scope.cameraAnimation = prevCameraAnimation;
            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };

        /**
        * 해당 id의 노드 포커스
        * @param {Number[]} ids Node ids
        * @param {Number} offset bbox offset
        * @param {Number} margine screen margine
        */
        this.FocusObject = function (ids, offset, margine) {
            if (ids.length <= 0) return;

            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            let min;// = new VIZCore.Vector3();
            let max;// = new VIZCore.Vector3();

            if(view.useTree)
            {
                let bodyIds = view.Tree.GetBodyIds(ids)
                let nodesBBox = view.Tree.GetBBoxArrayID(bodyIds);
                min = nodesBBox.min;
                max = nodesBBox.max;
                // for (let i = 0; i < ids.length; i++) {
                //     let id = ids[i];
                //     //let node = view.Tree.GetNodeInfo(id);
                //     let arr_bodyid = view.Tree.GetBodyId(id);
                //     
                //     for (let j =0; j < arr_bodyid.length; j++)
                //     {
                //         //let node = view.Tree.GetNodeInfo(arr_bodyid[j]);
                //         //let node = view.Tree.GetDataToNode(arr_bodyid[j]);                       
                        
                //         let nodeBBox = node.bbox;

                //         if (nodeBBox === undefined) {
                //             const bodies = view.Data.GetNodeData(arr_bodyid[j]);
                //             nodeBBox = view.Data.GetBBox(bodies);
                //         }
                //         else if(node.transform !== undefined){
                //             //Transform 
                //             // bbox
                //             // bbox = Transform * nodeBBox;
                //             //nodeBBox.min = new VIZCore.Vector3().copy(nodeBBox.min).applyMatrix4()
                //             let vBox = [
                //                 new VIZCore.Vector3(nodeBBox.min.x, nodeBBox.min.y, nodeBBox.min.z),
                //                 new VIZCore.Vector3(nodeBBox.min.x, nodeBBox.min.y, nodeBBox.max.z),
                //                 new VIZCore.Vector3(nodeBBox.min.x, nodeBBox.max.y, nodeBBox.min.z),
                //                 new VIZCore.Vector3(nodeBBox.min.x, nodeBBox.max.y, nodeBBox.max.z),
                //                 new VIZCore.Vector3(nodeBBox.max.x, nodeBBox.min.y, nodeBBox.min.z),
                //                 new VIZCore.Vector3(nodeBBox.max.x, nodeBBox.min.y, nodeBBox.max.z),
                //                 new VIZCore.Vector3(nodeBBox.max.x, nodeBBox.max.y, nodeBBox.min.z),
                //                 new VIZCore.Vector3(nodeBBox.max.x, nodeBBox.max.y, nodeBBox.max.z)
                //             ];
        
                //             //bound box Transform 
                //             for (let k = 0; k < 8; ++k) {
                //                 vBox[k].applyMatrix4(node.transform);
        
                //                 if (k === 0) {
                //                     nodeBBox.min.copy(vBox[k]);
                //                     nodeBBox.max.copy(vBox[k]);
                //                 }
                //                 else {
                //                     nodeBBox.min.min(vBox[k]);
                //                     nodeBBox.max.max(vBox[k]);
                //                 }
                //             }
                //         }

                //         if (i === 0 && j === 0) {
                //             min = new VIZCore.Vector3().copy(nodeBBox.min);
                //             max = new VIZCore.Vector3().copy(nodeBBox.max);
                //         }
                //         else {
                //             min.min(nodeBBox.min);
                //             max.max(nodeBBox.max);
                //         }
                //     }
                // }
            }
            else
            {
                for (let i = 0; i < ids.length; i++) {
                    const bodies = view.Data.GetNodeData(ids[i]);
                    const nodeBBox = view.Data.GetBBoxFormMatrix(bodies);

                    if (i === 0) {
                        min = new VIZCore.Vector3().copy(nodeBBox.min);
                        max = new VIZCore.Vector3().copy(nodeBBox.max);
                    }
                    else {
                        min.min(nodeBBox.min);
                        max.max(nodeBBox.max);
                    }
                }
            }

            if (min === undefined || max === undefined) return;

            let boundBox = new VIZCore.BBox([min.x, min.y, min.z, max.x, max.y, max.z]);

            //바운드 박스 크기 문제
            if(boundBox.radius < 0.000001) return;

            boundBox = view.Clipping.RebuildClippingBoundBox(boundBox);
            if (boundBox === undefined) return;

            if (offset !== undefined) {
                boundBox.min.x -= offset;
                boundBox.min.y -= offset;
                boundBox.min.z -= offset;

                boundBox.max.x += offset;
                boundBox.max.y += offset;
                boundBox.max.z += offset;
                boundBox.update();
            }

            if(margine === undefined) margine = 0;

            //zoom 가능여부 확인
            let zoom = (boundBox.radius < 0.000001) ? false : true;

            let backupAnimation = scope.cameraAnimation;
            scope.cameraAnimation = false;

            if (scope.perspectiveView) {
                scope.PerspectiveFocusCenter(boundBox, margine);
                scope.SetPivot(boundBox.center);
            }
            else {
                if (zoom) {
                    const viewWidth = view.Renderer.GetSizeWidth();
                    const viewHeight = view.Renderer.GetSizeHeight();

                    let screenVertex = view.Util.GetBBox2Vertex(boundBox);

                    let screenMin, screenMax;
                    for (let ii = 0; ii < 8; ii++) {
                        screenVertex[ii] = world2ScreenWithMatrix(scope.matMVP, new VIZCore.Vector3().copy(screenVertex[ii]));

                        if (ii === 0) {
                            screenMin = new VIZCore.Vector3().copy(screenVertex[ii]);
                            screenMax = new VIZCore.Vector3().copy(screenVertex[ii]);
                        } else {
                            screenMin.min(screenVertex[ii]);
                            screenMax.max(screenVertex[ii]);
                        }
                    }

                    //Margine offset
                    let fMargine = cameraFocusMargine;     // 화면 비율 offset
                    fMargine = view.Configuration.Control.FitMargineRate;
                    fMargine += margine;

                    const screenMargine = 0; // 픽셀단위의 offset
                    let fMargineW = ((screenMax.x - screenMin.x) * fMargine) + screenMargine;
                    let fMargineH = ((screenMax.y - screenMin.y) * fMargine) + screenMargine;

                    scope.ViewBoxZoom(screenMin.x - fMargineW, screenMin.y - fMargineH,
                        screenMax.x + fMargineW, screenMax.y + fMargineH);

                    //resizeGLWindow();
                }

                scope.FocusPivot(boundBox.center);
            }
            scope.cameraAnimation = backupAnimation;
            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
            else {
                view.ViewRefresh();
            }
        };


        /**
        * 해당 바운드 박스 포커스
        * @param {Data.BBox} boundBox boundBox
        * @param {Number} margine screen margine ratio
        */
         this.FocusBBox = function (boundBox, margine) {
            if (boundBox === undefined) return;

            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            if(margine === undefined) margine = 0;

            //zoom 가능여부 확인
            let zoom = (boundBox.radius < 0.000001) ? false : true;

            let backupAnimation = scope.cameraAnimation;
            scope.cameraAnimation = false;

            if (scope.perspectiveView) {
                scope.PerspectiveFocusCenter(boundBox, margine);
                scope.SetPivot(boundBox.center);
            }
            else
            {
                if (zoom) {
                    const viewWidth = view.Renderer.GetSizeWidth();
                    const viewHeight = view.Renderer.GetSizeHeight();

                    let screenVertex = view.Util.GetBBox2Vertex(boundBox);

                    let screenMin, screenMax;
                    for (let ii = 0; ii < 8; ii++) {
                        screenVertex[ii] = world2ScreenWithMatrix(scope.matMVP, new VIZCore.Vector3().copy(screenVertex[ii]));

                        if (ii === 0) {
                            screenMin = new VIZCore.Vector3().copy(screenVertex[ii]);
                            screenMax = new VIZCore.Vector3().copy(screenVertex[ii]);
                        } else {
                            screenMin.min(screenVertex[ii]);
                            screenMax.max(screenVertex[ii]);
                        }
                    }

                     //Margine offset
                     let fMargine = cameraFocusMargine;     // 화면 비율 offset
                     fMargine = view.Configuration.Control.FitMargineRate;
                     fMargine += margine;
 
                     const screenMargine = 0; // 픽셀단위의 offset
                     let fMargineW = ((screenMax.x - screenMin.x) * fMargine) + screenMargine;
                     let fMargineH = ((screenMax.y - screenMin.y) * fMargine) + screenMargine;
 
                     scope.ViewBoxZoom(screenMin.x - fMargineW, screenMin.y - fMargineH,
                         screenMax.x + fMargineW, screenMax.y + fMargineH);

                    //resizeGLWindow();
                }

                scope.FocusPivot(boundBox.center);
            }

            scope.cameraAnimation = backupAnimation;
            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
            else {
                view.ViewRefresh();
            }
        };

        /**
     * 피벗 위치로 화면 중심이동
     * @param {VIZCore.Vector3} world pivot 위치 갱신 (undefined === 현재 pivot로 이동)
     */
        this.FocusPivot = function (world) {

            if (world !== undefined) {
                //scope.pivot = world;
                scope.SetPivot(world);
            }

            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            const viewWidth = view.Renderer.GetSizeWidth();
            const viewHeight = view.Renderer.GetSizeHeight();

            //해당 위치로 화면 중심정렬
            let vZero, vScreen1, vScreen2, vWorld1, vWorld2;
            vZero = world2ScreenWithMatrix(scope.matMVP, new VIZCore.Vector3().copy(scope.pivot));

            vScreen1 = new VIZCore.Vector3().copy(vZero); //피벗
            vScreen2 = new VIZCore.Vector3(viewWidth / 2, viewHeight / 2, vZero.z); //화면 중심

            vWorld1 = screen2WorldWithMatrix(scope.projectionMatrix, vScreen1);
            vWorld2 = screen2WorldWithMatrix(scope.projectionMatrix, vScreen2);

            const vTrans = new VIZCore.Vector3().subVectors(vWorld2, vWorld1);

            scope.cameraMatrix.translate(vTrans.x, vTrans.y, vTrans.z);

            resizeGLWindow();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
        };

        this.FitAll = function () {
            //scope.ResetGLWindow();
            //scope.ViewISOPlus();
            //scope.InitDirection();
            //if(scope.perspectiveView && view.Configuration.Camera.usePerspectiveScreenFit)

            // BBox 재계산
            let min = undefined;
            let max = undefined;

            let bodies = [];
            for (let i = 0; i < view.Data.Objects.length; i++) {
                let object = view.Data.Objects[i];
                for (let j = 0; j < object.tag.length; j++) {
                    let body = object.tag[j];
                    let action = view.Data.ShapeAction.GetAction(body.object.id_file, body.origin_id);

                    if (action.visible === true) 
                        bodies.push(body);
                }                
            }

            if(bodies.length > 0) {
                const nodeBBox = view.Data.GetBBoxFormMatrix(bodies);
                min = new VIZCore.Vector3().copy(nodeBBox.min);
                max = new VIZCore.Vector3().copy(nodeBBox.max);
            }

            if(min !== undefined && max !== undefined)
            {
                let bbox = new VIZCore.BBox([min.x, min.y, min.z, max.x, max.y, max.z]);

                scope.FocusBBox(bbox);
            }
            else{
                scope.FocusBBox(view.Data.ObjectsBBox);
            }
            scope.ResizeGLWindow();

            
        };

        this.ResetView = function () {
            scope.ResetGLWindow();
            //scope.ViewISOPlus();
            scope.InitDirection();
            scope.ResizeGLWindow();
            
        };

        // 카메라 애니메이션 프로세스 시작
        // @param {Data.CameraDataItem()} cameraData  시작 카메라
        // @param {Data.CameraDataItem()} toCameraData  종료 카메라
        // @param {Number} timeLength  애니메이션 길이 (초)
        function cameraAnimationProcessStart(cameraData, toCameraData, timeLength) {
            let finish = false;
            let timerProcess;

            //시작 카메라 상태로 변경
            scope.CameraUpdateWithCameraData(cameraData);
            view.Camera.ResizeGLWindow();

            let timeStartProcess = new Date().getTime();

            let animationProcess = function () {
                let timeCurrentProcess = (new Date().getTime() - timeStartProcess); // 밀리초
                let fRate = timeCurrentProcess / 1000 / timeLength;

                if (fRate >= 1.0) {
                    fRate = 1.0;
                    finish = true;
                    scope.CameraUpdateWithCameraData(toCameraData);
                    //view.Camera.cameraMatrix.copy(toCameraData.matrix_camera);
                    //view.Camera.viewDistance = toCameraData.distance;
                    //view.Camera.cameraZoom = toCameraData.zoom;

                    view.Camera.ResizeGLWindow();

                    clearInterval(timerProcess);
                    return;
                }

                //matCamera
                {
                    //let camera1 = new VIZCore.Matrix4().copy(cameraData.matrix_camera).multiplyScalar(1.0 - fRate); //기존 위치
                    //let camera2 = new VIZCore.Matrix4().copy(toCameraData.matrix_camera).multiplyScalar(fRate); // 포커스 위치

                    let currentCamera = view.Util.QuaternionInterpolation(cameraData.matrix_camera, toCameraData.matrix_camera, fRate);

                    //let currentCamera = new VIZCore.Matrix4();
                    //for (let i = 0; i < 16; i++)
                    //    currentCamera.elements[i] = camera1.elements[i] + camera2.elements[i];

                    //currentCamera
                    view.Camera.cameraMatrix.copy(currentCamera);
                }

                //viewDistance
                {
                    //scope.viewDistance

                    let viewDistance1 = cameraData.distance * (1.0 - fRate); //기존 위치
                    let viewDistance2 = toCameraData.distance * fRate; // 포커스 위치

                    view.Camera.viewDistance = viewDistance1 + viewDistance2;
                }

                //Zoom
                {
                    let zoom1 = cameraData.zoom * (1.0 - fRate); //기존 줌
                    let zoom2 = toCameraData.zoom * fRate; // 포커스 줌

                    //currentCamera
                    view.Camera.cameraZoom = zoom1 + zoom2;
                }

                view.Camera.ResizeGLWindow();
            };

            timerProcess = setInterval(function () {
                animationProcess();

                // view.MeshBlock.Reset();
                // view.Renderer.Render();
                view.ViewRefresh();
            }, 15);

        };


        /**
         * Axis Z Up (Z축이 Up방향으로 정상적으로 안가는 경우가 있어 다시 작성)
         */
        this.SetZAxis2Up_v1 = function () {

            const viewWidth = view.Renderer.GetSizeWidth();
            const viewHeight = view.Renderer.GetSizeHeight();

            //let xAxis = new VIZCore.Vector3(1, 0, 0);
            let yAxis = new VIZCore.Vector3(0, 1, 0);
            //let zAxis = new VIZCore.Vector3(0, 0, 1);

            let zCurrnetAxis = new VIZCore.Vector3(0, 0, 1);

            //let vScreenCenter = screen2WorldWithMatrix(matMVP, new VIZCore.Vector3(viewWidth / 2, viewHeight / 2, 0.0));
            //let vScreenUp = screen2WorldWithMatrix(matMVP, new VIZCore.Vector3(viewWidth / 2, viewHeight, 0.0));

            //let vUpPos = new VIZCore.Vector3().subVectors(vScreenUp, vScreenCenter);
            //let vUp = new VIZCore.Vector3().copy(vUpPos).normalize();

            let matModelRotateMatrix = new VIZCore.Matrix4().copy(scope.cameraMatrix);
            matModelRotateMatrix.setPosition(new VIZCore.Vector3());
            zCurrnetAxis.applyMatrix4(matModelRotateMatrix);
            zCurrnetAxis.normalize();
            //zAxis.multiplyScalar(-1);

            let dotValue = yAxis.dot(zCurrnetAxis);
            let angle = Math.acos(dotValue);

            let rotate = new VIZCore.Vector3().crossVectors(zCurrnetAxis, yAxis);
            //let rotate = new VIZCore.Vector3().subVectors(zAxis, zCurrnetAxis);
            rotate.multiplyScalar(angle);

            let tx = rotate.x;
            let ty = rotate.y;
            let tz = rotate.z;

            let matX = new VIZCore.Matrix4().makeRotationX(tx);
            let matY = new VIZCore.Matrix4().makeRotationY(ty);
            let matZ = new VIZCore.Matrix4().makeRotationZ(tz);

            let rotateByPivotMatrix = new VIZCore.Matrix4();
            {
                let matModelMatrix = new VIZCore.Matrix4().copy(scope.cameraMatrix);
                let pivotWithModelCenterOffset = new VIZCore.Vector3().copy(scope.pivot);
                pivotWithModelCenterOffset.applyMatrix4(matModelMatrix);

                let translatePivotToZeroMatrix = new VIZCore.Matrix4();
                let pivotZero = new VIZCore.Vector3().copy(pivotWithModelCenterOffset).multiplyScalar(-1);
                translatePivotToZeroMatrix.setPosition(pivotZero);

                let rotateMatrix = new VIZCore.Matrix4().multiplyMatrices(matX, matY);
                rotateMatrix = new VIZCore.Matrix4().multiplyMatrices(new VIZCore.Matrix4().copy(rotateMatrix), matZ);

                let translateZeroToPivotMatrix = new VIZCore.Matrix4().setPosition(pivotWithModelCenterOffset);

                let tmpMatrix = new VIZCore.Matrix4().multiplyMatrices(rotateMatrix, translatePivotToZeroMatrix);
                rotateByPivotMatrix = new VIZCore.Matrix4().multiplyMatrices(translateZeroToPivotMatrix, tmpMatrix);
            }

            scope.cameraMatrix = new VIZCore.Matrix4().multiplyMatrices(rotateByPivotMatrix, scope.cameraMatrix);

            scope.ResizeGLWindow();
            //view.Renderer.MainFBClear();
            //view.Renderer.Render();
        };

        /**
         * Axis Z Up
         */
         this.SetZAxis2Up = function () {

            const viewWidth = view.Renderer.GetSizeWidth();
            const viewHeight = view.Renderer.GetSizeHeight();

            //let xAxis = new VIZCore.Vector3(1, 0, 0);
            let yAxis = new VIZCore.Vector3(0, 1, 0);
            //let zAxis = new VIZCore.Vector3(0, 0, 1);

            let vScreenCenter = screen2WorldWithMatrix(scope.matMVP, new VIZCore.Vector3(viewWidth / 2, viewHeight / 2, 0.5));
            let vScreenUp = screen2WorldWithMatrix(scope.matMVP, new VIZCore.Vector3(viewWidth / 2, viewHeight, 0.5));

            let vUpPos = new VIZCore.Vector3().subVectors(vScreenUp, vScreenCenter);
            let fUpLen = vUpPos.length();
            if( !(fUpLen <= 0 || fUpLen >= 0) )
                return;

            let matModelMatrix = new VIZCore.Matrix4().copy(scope.cameraMatrix);

            let vZero = new VIZCore.Vector3().copy(vScreenCenter).applyMatrix4(matModelMatrix);
            let vUp = new VIZCore.Vector3().copy(new VIZCore.Vector3(0, 0, -fUpLen).add(vScreenCenter)).applyMatrix4(matModelMatrix);
            let vDown = new VIZCore.Vector3().copy(new VIZCore.Vector3(0, 0, fUpLen).add(vScreenCenter)).applyMatrix4(matModelMatrix);

            vUp = vUp.sub(vZero);
            vUp.normalize();
            if( vUp.z > 0.9999999 )
                return;
            
            //let yAxis = new VIZCore.Vector3().copy(vUp);
            let zCurrnetAxis = new VIZCore.Vector3(0, 0, 1);

            //let vScreenCenter = screen2WorldWithMatrix(matMVP, new VIZCore.Vector3(viewWidth / 2, viewHeight / 2, 0.0));
            //let vScreenUp = screen2WorldWithMatrix(matMVP, new VIZCore.Vector3(viewWidth / 2, viewHeight, 0.0));

            //let vUpPos = new VIZCore.Vector3().subVectors(vScreenUp, vScreenCenter);
            //let vUp = new VIZCore.Vector3().copy(vUpPos).normalize();

            //let matModelRotateMatrix = new VIZCore.Matrix4().copy(scope.cameraMatrix);
            //matModelRotateMatrix.setPosition(new VIZCore.Vector3());
            //zCurrnetAxis.applyMatrix4(matModelRotateMatrix);
            //zCurrnetAxis.normalize();
            
            //zAxis.multiplyScalar(-1);

            zCurrnetAxis.copy(vUp);

            //let dotValue = yAxis.dot(zCurrnetAxis);
            //let angle = Math.acos(dotValue);

            //let rotate = new VIZCore.Vector3().crossVectors(zCurrnetAxis, yAxis);
            let rotate = new VIZCore.Vector3().crossVectors(yAxis, zCurrnetAxis);
            //let rotate = new VIZCore.Vector3().subVectors(zAxis, zCurrnetAxis);
            //rotate.multiplyScalar(angle);

            let tx = rotate.x;
            let ty = rotate.y;
            let tz = rotate.z;

            {
                let matX = new VIZCore.Matrix4().makeRotationX(tx);
                let matY = new VIZCore.Matrix4().makeRotationY(ty);
                let matZ = new VIZCore.Matrix4().makeRotationZ(tz);

                let rotateMatrix = new VIZCore.Matrix4().multiplyMatrices(new VIZCore.Matrix4().multiplyMatrices(matX, matY), matZ);
                scope.CameraRotateByMatrix(rotateMatrix, scope.pivot);
            }

            scope.ResizeGLWindow();
            
        };


        /**
         * 카메라의 위치 및 quaternion 값에 대한 MV행렬 반환 // 모델 로딩 후 (viewDistance 필요)
         * @param {VIZCore.Vector3} posistion 
         * @param {VIZCore.Quaternion} quaternion 
         */
        this.GetMVMatrixFormPosQuat = function(posistion, quaternion) {

            let matTransform = new VIZCore.Matrix4();
            matTransform.makeRotationFromQuaternion(quaternion);            
            matTransform.translate(posistion.x,posistion.y,posistion.z );
            let invMatTransform=new VIZCore.Matrix4().getInverse(matTransform);
            //let bbox = vizcore.View.Main.Data.GetBBox();
            invMatTransform.translate(0 ,0  ,   view.Camera.viewDistance ); //view distance bbox.radius *1.5          
            return invMatTransform;
            //
        };


        /**
         * 카메라의 위치 반환 6dof
         */
        this.GetEyePos = function() {
            let MVMat = new VIZCore.Matrix4().copy(scope.cameraMatrix);
            MVMat.translate(0 ,0  ,   -view.Camera.viewDistance );
            MVMat=new VIZCore.Matrix4().getInverse(MVMat);  
            return MVMat.getTranslate();
            //
        };

        /**
        * 현재 카메라 정보 반환
        * @returns {Data.CameraDataItem} 백업된 데이터 반환
        */
        this.GetCameraData = function () {
            let item = view.Data.CameraDataItem();

            item.perspectiveView = scope.perspectiveView;

            item.matrix_view.copy(scope.viewMatrix);
            item.matrix_camera.copy(scope.cameraMatrix);
            item.position.copy(scope.cameraPosition);
            item.up.copy(scope.cameraUp);
            item.target.copy(scope.cameraTarget);
            item.zoom = scope.cameraZoom;
            item.distance = scope.viewDistance;
            if(item.pivot !== undefined)
                item.pivot.copy(scope.pivot);
            

            return item;
        };


        // 현재 카메라 업데이트
        // @param {Data.CameraDataItem} cameraData  현재 카메라에서 변경 될 데이터
        this.CameraUpdateWithCameraData = function(cameraData) {
            scope.perspectiveView = cameraData.perspectiveView;

            scope.viewMatrix = new VIZCore.Matrix4().copy(cameraData.matrix_view);
            scope.cameraMatrix = new VIZCore.Matrix4().copy(cameraData.matrix_camera);
            scope.cameraPosition = new VIZCore.Vector3().copy(cameraData.position);
            scope.cameraUp = new VIZCore.Vector3().copy(cameraData.up);
            scope.cameraTarget = new VIZCore.Vector3().copy(cameraData.target);

            scope.cameraZoom = cameraData.zoom;
            scope.viewDistance = cameraData.distance;
            if(cameraData.pivot !== undefined)
                scope.SetPivot(cameraData.pivot);
        };


        /**
         * 카메라 백업 리스트 반환
         * @returns {Array<Data.CameraDataItem>}
         */
        this.GetBackupCameraList = function() {
            return Array.from(mapBackup.values())
        };

        /**
        * 카메라 백업
        * @returns {Data.UUIDv4} 백업 아이디
        * */
        this.Backup = function () {

            let backupCamera = scope.GetCameraData();

            mapBackup.set(backupCamera.id, backupCamera);

            return backupCamera.id;
        };
        
        /**
         * 카메라 백업 (내부)
         * @param {Data.CameraDataItem()} cameraData 
         */
        this.SetBackup = function (cameraData) {
            mapBackup.set(cameraData.id, cameraData);
        };

        /**
        * 카메라 복원 데이터 반환  
        * @param {Data.UUIDv4} id 백업 아이디
        * @returns {backupCamera} 백업된 데이터 반환
        * */
        this.GetBackupData = function (id) {
            if (mapBackup.has(id)) {
                return mapBackup.get(id);
            }
            return undefined;
        };

        /**
        * 카메라 복원 데이터 제거  
        * @param {Data.UUIDv4} id 백업 아이디
        * */
        this.DeleteBackupData = function (id) {
            if (mapBackup.has(id)) {
                mapBackup.delete(id);
            }

            for(let i = view.Data.Review.GetSnapshotList.length - 1 ; i >= 0 ; i--) {
                if(view.Data.Review.GetSnapshotList[i].id !== id) continue;

                view.Data.Review.GetSnapshotList.splice(i, 1);
            }

            view.EventHandler.dispatchEvent(VIZCore.Enum.EVENT_TYPES.Review.Changed, view.Data.Reviews);
        };

        /**
        * 카메라 복원   
        * @param {string} id 백업 아이디
        * */
        this.Rollback = function (id) {
            if (mapBackup.has(id)) {
                let backupCamera = mapBackup.get(id);
                // 카메라 롤백
                scope.CameraUpdateWithCameraData(backupCamera);
                
                scope.ResizeGLWindow();
                view.MeshBlock.Reset();
                view.Renderer.Render();
            }
        };

        this.GetSnapshotParam = function (id) {
            if (mapBackup.has(id)) {
                let info = mapBackup.get(id);
                //private static char rowSplitter = '↕';
                //private static char dataSplitter = '§';
                let param = "";
                param += info.id;
                param += '↕';
                for (let i = 0; i < info.viewMatrix.elements.length; i++) {
                    param += i === 0 ? "" : "§" + info.viewMatrix.elements[i];
                }
                param += '↕';
                for (let i = 0; i < info.cameraMatrix.elements.length; i++) {
                    param += i === 0 ? "" : "§" + info.cameraMatrix.elements[i];
                }
                param += '↕';
                param += info.cameraPosition.x;
                param += "§" + info.cameraPosition.y;
                param += "§" + info.cameraPosition.z;

                param += '↕';
                param += info.cameraUp.x;
                param += "§" + info.cameraUp.y;
                param += "§" + info.cameraUp.z;

                param += '↕';
                param += info.cameraTarget.x;
                param += "§" + info.cameraTarget.y;
                param += "§" + info.cameraTarget.z;

                param += '↕';
                param += info.cameraZoom;

                param += '↕';
                param += info.viewDistance;

                return param;
            }
            else
                return "";
        };

        this.SetSnapshotParam = function (param) {

            let backupCamera = {
                id: view.Data.UUIDv4(),
                matrix_view: new VIZCore.Matrix4().copy(scope.viewMatrix),
                matrix_camera: new VIZCore.Matrix4().copy(scope.cameraMatrix),
                position: new VIZCore.Vector3().copy(scope.cameraPosition),
                up: new VIZCore.Vector3().copy(scope.cameraUp),
                target: new VIZCore.Vector3().copy(scope.cameraTarget),
                zoom: scope.cameraZoom,
                distance: scope.viewDistance,
            };

            //mapBackup.set(backupCamera.id, backupCamera);

            if (mapBackup.has(backupCamera.id)) {
                let info = mapBackup.get(backupCamera.id);
                //private static char rowSplitter = '↕';
                //private static char dataSplitter = '§';
                let param = "";
                for (let i = 0; i < info.viewMatrix.elements.length; i++) {
                    param += i === 0 ? "" : "§" + info.viewMatrix.elements[i];
                }
                param += '↕';
                for (let i = 0; i < info.cameraMatrix.elements.length; i++) {
                    param += i === 0 ? "" : "§" + info.cameraMatrix.elements[i];
                }
                param += '↕';
                param += info.cameraPosition.x;
                param += "§" + info.cameraPosition.y;
                param += "§" + info.cameraPosition.z;

                param += '↕';
                param += info.cameraUp.x;
                param += "§" + info.cameraUp.y;
                param += "§" + info.cameraUp.z;

                param += '↕';
                param += info.cameraTarget.x;
                param += "§" + info.cameraTarget.y;
                param += "§" + info.cameraTarget.z;

                param += '↕';
                param += info.cameraZoom;

                param += '↕';
                param += info.viewDistance;

                return param;
            }
            else
                return "";
        };

        /**
         * 
         * @param {VIZCore.Enum.VIEW_MODES} direction 
         * @param {VIZCore.Matrix4} customMatrix 
         */
        this.SetBaseDirection = function (direction, customMatrix) {
            baseDirection = direction;

            if(customMatrix !== undefined)
                baseCustomDirectionMatrix.copy(customMatrix);
        };

        this.InitDirection = function () {
            if(scope.LockCamera)
                return;
            //console.log("InitDirection :: Call!!");
            
            let prevCameraAnimation = scope.cameraAnimation;
            scope.cameraAnimation = false;

            resetGLWindow();  

            switch (baseDirection) {
                case VIZCore.Enum.VIEW_MODES.PlusX: scope.ViewRightElevation();
                    break;
                case VIZCore.Enum.VIEW_MODES.MinusX: scope.ViewLeftElevation();
                    break;
                case VIZCore.Enum.VIEW_MODES.PlusY: scope.ViewBackSection();
                    break;
                case VIZCore.Enum.VIEW_MODES.MinusY: scope.ViewFrontSection();
                    break;
                case VIZCore.Enum.VIEW_MODES.PlusZ: scope.ViewTopPlan();
                    break;
                case VIZCore.Enum.VIEW_MODES.MinusZ: scope.ViewBottomPlan();
                    break;
                case VIZCore.Enum.VIEW_MODES.PlusISO: scope.ViewISOPlus();
                    break;
                case VIZCore.Enum.VIEW_MODES.MinusISO: scope.ViewISOMinus();
                    break;
                case VIZCore.Enum.VIEW_MODES.CustomView: scope.ViewCustom();
                    break;
                case VIZCore.Enum.VIEW_MODES.CustomViewMatrix: scope.ViewCustomMatrix();
                    break;
                case VIZCore.Enum.VIEW_MODES.ISORightBackTop : scope.ViewISORightBackTop();
                    break;
                default: scope.ViewISOPlus();
                    break;
            }

            scope.cameraAnimation = prevCameraAnimation;

            if(view.DemoType === 7)
            {
                //scope.cameraMatrix.elements = [0.7528815583463428, 0.3917975880289497, -0.5288326853709805, 0, -0.6581560294504523, 0.4481873074906061, -0.6049452688486282, 0, 1.450300251031817e-10, 0.8035065571723851, 0.5952959033799746, 0, 95096.01742049838, -5146.595125119217, 2049188.7193203685, 1];
                //scope.pivot = new VIZCore.Vector3(-63664.8922979152, 69255.34866555998, -606.4586115282582);

                scope.cameraMatrix.elements = [0.7071067811140326, 0.3535533906713978, -0.6123724357344226, 0, -0.7071067812590625, 0.3535533907765077, -0.6123724355062713, 0, 1.450300251031817e-10, 0.8660254036777397, 0.5000000001848081, 0, 100191.6328212468, -2660.8020471965115, 1539916.0289263553, 1];
                scope.pivot = new VIZCore.Vector3(-72150.90578059915,72587.11443838813, -783.9936757500764);

                scope.ResizeGLWindow();
            }
            
            if(scope.perspectiveView && (view.Configuration.Camera.usePerspectiveScreenFit || view.Configuration.Camera.UsePerspectiveScreenFit) )
                scope.FocusBBox(view.Data.ObjectsBBox);
        };

        this.GetCameraPos = function () {
            if (scope.perspectiveView) {
                let matMV = new VIZCore.Matrix4().multiplyMatrices(scope.viewMatrix, scope.cameraMatrix);
                //matMV = new VIZCore.Matrix4().multiplyMatrices(scope.cameraMatrix, scope.viewMatrix);

                const matMVP = new VIZCore.Matrix4().multiplyMatrices(scope.projectionMatrix, scope.cameraMatrix);
                const matMVPInverse = new VIZCore.Matrix4().getInverse(matMVP);
                return matMVPInverse.multiplyVector(new VIZCore.Vector3(0, 0, 0));
            }
            else {
                let matMV = new VIZCore.Matrix4().copy(scope.cameraMatrix);

                const matMVP = new VIZCore.Matrix4().multiplyMatrices(scope.projectionMatrix, scope.cameraMatrix);
                const matMVPInverse = new VIZCore.Matrix4().getInverse(matMVP);
                return matMVPInverse.multiplyVector(new VIZCore.Vector3(0, 0, -1));
            }
        };

        

        this.GetViewDirection = function () {
            //let matMVP = new VIZCore.Matrix4().multiplyMatrices(scope.projectionMatrix, scope.matMV);
            //let posView = matMVP.multiplyVector(new VIZCore.Vector3(0, 0, 1));
            //return posView.normalize();

            //let matMV = new VIZCore.Matrix4();
            //if (scope.perspectiveView) {
            //    matMV = new VIZCore.Matrix4().multiplyMatrices(scope.viewMatrix, scope.cameraMatrix);
            //    //matMV = new VIZCore.Matrix4().multiplyMatrices(scope.cameraMatrix, scope.viewMatrix);
            //}
            //else {
            //    matMV.copy(scope.cameraMatrix);
            //}


            const matMVP = new VIZCore.Matrix4().copy(scope.matMVP);
            const matMVPInverse = new VIZCore.Matrix4().getInverse(matMVP);

            let cameraPos = undefined;
            if(scope.perspectiveView)
                cameraPos = scope.GetPerspectiveEyePos();
            else
                cameraPos = matMVPInverse.multiplyVector(new VIZCore.Vector3(0, 0, 0));
            
            let viewPos = matMVPInverse.multiplyVector(new VIZCore.Vector3(0, 0, 0.5));
            let vDir = new VIZCore.Vector3().subVectors(viewPos, cameraPos);
            return vDir.normalize();
        };

        this.GetSnapshotInfo = function()
        {
            let info = {
                matrix_camera : new VIZCore.Matrix4().copy(this.cameraMatrix),
                matrix_view : new VIZCore.Matrix4().copy(this.viewMatrix),
                zoom : this.cameraZoom
                //위치
                //방향
            };
            return info;
        };

        this.SetSnapshotInfo = function(info){
            let oldCameraDataItem;
            if (scope.cameraAnimation) {
                oldCameraDataItem = scope.GetCameraData();
            }

            this.cameraMatrix.copy(info.matrix_camera);
            if(info.matrix_view !== undefined)
                this.viewMatrix.copy(info.matrix_view);
            this.cameraZoom = info.zoom;

            this.ResizeGLWindow();

            if (scope.cameraAnimation) {
                let toCameraData = scope.GetCameraData();
                cameraAnimationProcessStart(oldCameraDataItem, toCameraData, cameraAnimationTime);
            }
            else{
                view.MeshBlock.Reset();
                view.Renderer.Render();
            }
        };

        this.GetCameraDirVector = function () {
            //CRMVertex3 < float > vPos1 = Screen2World(CRMVertex3<float>(m_szScreen.cx / 2.0f, m_szScreen.cy / 2.0f, 0.5f));
            //CRMVertex3 < float > vPos2 = Screen2World(CRMVertex3<float>(m_szScreen.cx / 2.0f, m_szScreen.cy / 2.0f, 0.4f));

            let cx = scope.clientWidth;
            let cy = scope.clientHeight;

            let vPos1 = screen2WorldWithMatrix(scope.matMVP, new VIZCore.Vector3(cx / 2.0, cy / 2.0, 0.5));
            let vPos2 = screen2WorldWithMatrix(scope.matMVP, new VIZCore.Vector3(cx / 2.0, cy / 2.0, 0.4));
            
            //CRMVertex3 < float > vDir = vPos2 - vPos1;
            let vDir = new VIZCore.Vector3().subVectors(vPos2, vPos1);
            vDir.normalize();

            return vDir;
        };

        this.GetCameraUpVector = function () {
            
            let cx = scope.clientWidth;
            let cy = scope.clientHeight;

            let vPos1 = screen2WorldWithMatrix(scope.matMVP, new VIZCore.Vector3(cx / 2.0, cy / 2.0, 0.5));
            let vPos2 = screen2WorldWithMatrix(scope.matMVP, new VIZCore.Vector3(cx / 2.0, cy / 2.0 - 10, 0.5));
            
            let vDir = new VIZCore.Vector3().subVectors(vPos2, vPos1);
            vDir.normalize();

            return vDir;
        };

        /**
         * 
         * @param {VIZCore.BBox} bbox 
         * @param {Number} margine screen margine
         */
        this.PerspectiveFocusCenter = function (bbox, margine) {

            //CRMExMemory < CRMVertex3 < float >> vBBox;
            //for (int i = 0; i < g_inf.m_data.m_nodeNum; i++)
            //{
            //    if (!g_inf.m_data.m_ppNode[i] -> IsBody())
            //        continue;

            //    vBBox.Add(g_inf.m_data.m_ppNode[i] -> m_vMin);
            //    vBBox.Add(g_inf.m_data.m_ppNode[i] -> m_vMax);
            //}
    //         let vBBox = [
    //{x:-30.3154907, y:-26.3740635 ,z:10.5973921 },
    //{x:25.1702385 ,y:-3.37406278 ,z:27.1312008 },
    //{x:-17.0435314, y:-25.8868885 ,z:6.46472692 },
    //{x:-15.0435314, y:-3.88688874 ,z:8.46472740 },
    //{x:-22.0435314, y:-26.8868885 ,z:1.48150396 },
    //{x:-10.0435314, y:-22.8868885 ,z:13.4479504 },
    //{x:-22.0342255, y:-6.88688850 ,z:1.46582198 },
    //{x:-10.0528374, y:-2.88688850 ,z:13.4636335 },
    //{x:9.65894890 ,y:-26.0664577 ,z:6.55655813 },
    //{x:11.6589489 ,y:-4.06196785 ,z:8.60656261 },
    //{x:4.65894890 ,y:-27.0766487 ,z:1.61767423 },
    //{x:16.6589489 ,y:-23.0517254 ,z:13.5909090 },
    //{x:4.66825485 ,y:-7.07673264 ,z:1.55652976 },
    //{x:16.6496429 ,y:-3.05174327 ,z:13.5611296 },
    //{x:21.9762344 ,y:-20.8572845 ,z:9.30438423 },
    //{x:26.3050365 ,y:-8.89083862 ,z:21.3891296 },

    //        ];
            let vBBox = [];
            vBBox.push(bbox.min);
            vBBox.push(bbox.max);

            // 현재 카메라 정보 입력
            //CRMVertex3 < float > vCamDir = g_inf.m_openGL.m_Camera.GetCameraDirVector() * (-1.0f);
            //let vCamDir = new VIZCore.Vector3().copy(scope.GetViewDirection()).multiplyScalar(-1.0);
            let vCamDir = scope.GetCameraDirVector().multiplyScalar(-1.0);
            //let vCamDir = new VIZCore.Vector3().copy(scope.GetViewDirection());
            //CRMVertex3 < float > vCamUp = g_inf.m_openGL.m_Camera.GetCameraUpVector();
            //let vCamUp = new VIZCore.Vector3().copy(scope.cameraUp);
            let vCamUp = scope.GetCameraUpVector();
            //float fFovy = g_inf.m_openGL.m_Camera.m_fFov; // fov값
            let fFovy = view.Util.DegToRad(scope.fieldOfView);
            
            //float fAspect = g_inf.m_openGL.m_Camera.m_szScreen.cx / (float)g_inf.m_openGL.m_Camera.m_szScreen.cy; // 화면 비율

            let fAspect = scope.clientWidth / scope.clientHeight;
            //float fMargineRate = 0.0; // 마진임... 0.1 추천~~
            //let fMargineRate = -0.5;
            //let fMargineRate = scope.viewDistanceFactor;
            //let fMargineRate = -0.5;
            //let fMargineRate = -0.8;
            let fMargineRate = 0.1;
            fMargineRate = view.Configuration.Control.FitMargineRate;
            if(margine !== undefined)
                fMargineRate += margine;

            //fMargineRate = -0.1;

            //if(view.DemoType === 6)
            //    fMargineRate = 0.1; //세로가 긴 화면에서 화면에 잘 들어옴
                
            //fFovy = fFovy / fAspect;

            if(view.DemoType === 6)
                fFovy = fFovy / fAspect;

            // test
            //fFovy = 1.04719758;
            //fAspect = 1.94075835;
            

            //vCamDir = new VIZCore.Vector3(1.65363602e-07, -0.00000000, -1.00000000);
            //vCamUp = new VIZCore.Vector3(0, 1, 0);

            // 새 위치 얻는다
            //CRMVertex3 < float > vNewEyePos = g_inf.GetPerspectiveFitCamPos(vCamDir, vCamUp, fFovy, fAspect, fMargineRate, vBBox.len() / 2, vBBox.GetBuffer());
            let vNewEyePos = scope.GetPerspectiveFitCamPos(vCamDir, vCamUp, fFovy, fAspect, fMargineRate, vBBox.length / 2, vBBox);

            // 기존 위치 얻는다
            //CRMVertex3 < float > vEyePos = g_inf.m_openGL.m_Camera.GetPerspectiveEyePos();
            //let vEyePos = new VIZCore.Vector3().copy(scope.cameraPosition);
            let vEyePos = scope.GetPerspectiveEyePos();
            //let vEyePos = new VIZCore.Vector3(-4.77700806, -17.2772141, 67.8650360);
            
            // 카메라 메트리스 역변환을 해줘서 월드에서 옮겨야 될 값을 구하고 카메라 이동~~
            //CRMVertex3 < float > vEyeOffset = vNewEyePos - vEyePos;
            let vEyeOffset = new VIZCore.Vector3().subVectors(vNewEyePos, vEyePos);
            //CRMVertex3 < float > vEyeOffsetDir = vEyeOffset; vEyeOffsetDir.Normalize();
            let vEyeOffsetDir = new VIZCore.Vector3().copy(vEyeOffset).normalize();
            //vEyeOffsetDir = g_inf.m_openGL.m_Camera.m_matCamera.TransNormal(vEyeOffsetDir);
            vEyeOffsetDir = new VIZCore.Matrix4().copy(scope.cameraMatrix).transNormal(vEyeOffsetDir);
            //?? vEyeOffsetDir

            //vEyeOffset = vEyeOffsetDir * (vEyeOffset.Length());
            vEyeOffset = new VIZCore.Vector3().copy(vEyeOffsetDir).multiplyScalar(vEyeOffset.length());

            //g_inf.m_openGL.m_Camera.Translate(-vEyeOffset.x, -vEyeOffset.y, -vEyeOffset.z);
            scope.cameraMatrix.translate(-vEyeOffset.x, -vEyeOffset.y, -vEyeOffset.z);
            //scope.cameraMatrix.translate(vEyeOffset.x, vEyeOffset.y, vEyeOffset.z);

            //g_inf.Render();
            resizeGLWindow();
            //view.Renderer.MainFBClear();
            //view.MeshBlock.Reset();
            view.Renderer.Render();
        };

        this.GetPerspectiveEyePos = function () {
            let matMV = new VIZCore.Matrix4().copy(view.Camera.cameraMatrix);
            let matMVinv = new VIZCore.Matrix4().getInverse(matMV);

            let vEyePos = matMVinv.multiplyVector(view.Camera.cameraPosition);

            return vEyePos;
        };

        this.GetPerspectiveFitCamPos = function (vCamDir, vCamUp, fFovy, fAspect, fMagineRate, bboxNum, pBBoxMinMaxPos) {
            //CRMVertex3 < float > vEyePos(0, 0, 0);
            let vEyePos = new VIZCore.Vector3();

            // 좌표계 만든다
            //CRMVertex3 < float > vDir = vCamDir;
            let vDir = new VIZCore.Vector3().copy(vCamDir);
            //CRMVertex3 < float > vUp = vCamUp;
            let vUp = new VIZCore.Vector3().copy(vCamUp);
            //CRMVertex3 < float > vRight = CRMVertex3<float>:: Cross(vDir, vUp);
            let vRight = new VIZCore.Vector3().crossVectors(vDir, vUp);

            //float fFovV = fFovy;
            let fFovV = fFovy;
            //float fFovH = fFovy;
            let fFovH = fFovy;

            

            {
                let a = 1 / Math.tan(fFovy / 2.0);
                let fNewAngle = Math.atan(fAspect / a);
                fFovH = fNewAngle * 2;
            }

            // 마진만큼 줄여준다
            //fFovH = fFovH * (1.0f - fMagineRate);
            fFovH = fFovH * (1.0 - fMagineRate);
            //fFovV = fFovV * (1.0f - fMagineRate);
            fFovV = fFovV * (1.0 - fMagineRate);

            //fFovH = fFovV = 0;

            // 평면 4개 만든다 (좌, 우, 아래, 위)
            //CRMPlane < float > plane[4];
            let plane = [];

            //CRMVertex3 < float > vPlaneNormal[4] = { -vRight, vRight, -vUp, vUp };
            let vPlaneNormal = [new VIZCore.Vector3().copy(vRight).multiplyScalar(-1), vRight, new VIZCore.Vector3().copy(vUp).multiplyScalar(-1), vUp];

            {
                // 회전한다
                //CRMMatrix4 < float > matRotate;
                let matRotate = new VIZCore.Matrix4();

                //matRotate.SetMatrixRotateAxis(vUp, -fFovH / 2.0);
                matRotate.makeRotationAxis2(vUp, -fFovH / 2.0);
                //matRotate.makeRotationAxis(vUp, -fFovH / 2.0);
                //vPlaneNormal[0] = matRotate * vPlaneNormal[0];
                vPlaneNormal[0] = matRotate.multiplyVector(vPlaneNormal[0]);

                //matRotate.SetMatrixRotateAxis(vUp, fFovH / 2.0);
                matRotate.makeRotationAxis2(vUp, fFovH / 2.0);
                //matRotate.makeRotationAxis(vUp, fFovH / 2.0);
                //vPlaneNormal[1] = matRotate * vPlaneNormal[1];
                vPlaneNormal[1] = matRotate.multiplyVector(vPlaneNormal[1]);

                //matRotate.SetMatrixRotateAxis(vRight, fFovV / 2.0);
                matRotate.makeRotationAxis2(vRight, fFovV / 2.0);
                //matRotate.makeRotationAxis(vRight, fFovV / 2.0);
                //vPlaneNormal[2] = matRotate * vPlaneNormal[2];
                vPlaneNormal[2] = matRotate.multiplyVector(vPlaneNormal[2]);

                //matRotate.SetMatrixRotateAxis(vRight, -fFovV / 2.0);
                matRotate.makeRotationAxis2(vRight, -fFovV / 2.0);
                //matRotate.makeRotationAxis(vRight, -fFovV / 2.0);
                //vPlaneNormal[3] = matRotate * vPlaneNormal[3];
                vPlaneNormal[3] = matRotate.multiplyVector(vPlaneNormal[3]);

                // 평면 만든다
                //for (int i = 0; i < 4; i++)
                //plane[i] = CRMPlane<float>(vPlaneNormal[i], CRMVertex3<float>:: ZERO());
                //Sleep(0);
                for (let i = 0; i < 4; i++)
                    plane[i] = new VIZCore.Plane().setFromNormalAndCoplanarPoint(vPlaneNormal[i], new VIZCore.Vector3());
                //plane[i] = new VIZCore.Plane().set(vPlaneNormal[i], new VIZCore.Vector3());

            }

            // 바운드박스에 붙인다
            //CRMVertex3 < float > vModelMin, vModelMax;
            let vModelMin = new VIZCore.Vector3();
            let vModelMax = new VIZCore.Vector3();
            // bool bFirst = true;
            let bFirst = true;
            {
                //for (int i = 0; i < 4; i++)
                for (let i = 0; i < 4; i++) {
                    //float fLenMin = 1.0E10;
                    let fLenMin = 1.0E10;
                    //float fLenMax = -1.0E10;
                    let fLenMax = -1.0E10;

                    //for (int j = 0; j < bboxNum; j++)
                    for (let j = 0; j < bboxNum; j++) {
                        //CRMVertex3 < float > vMin = pBBoxMinMaxPos[j * 2 + 0];
                        let vMin = pBBoxMinMaxPos[j * 2 + 0];
                        //CRMVertex3 < float > vMax = pBBoxMinMaxPos[j * 2 + 1];
                        let vMax = pBBoxMinMaxPos[j * 2 + 1];

                        //CRMVertex3 < float > vBoxPos[8] = {
                        //CRMVertex3<float>(vMin.x, vMin.y, vMin.z), CRMVertex3<float>(vMax.x, vMin.y, vMin.z), CRMVertex3<float>(vMax.x, vMax.y, vMin.z),
                        //    CRMVertex3<float>(vMin.x, vMax.y, vMin.z), CRMVertex3<float>(vMin.x, vMin.y, vMax.z), CRMVertex3<float>(vMax.x, vMin.y, vMax.z),
                        //    CRMVertex3<float>(vMax.x, vMax.y, vMax.z), CRMVertex3<float>(vMin.x, vMax.y, vMax.z)
                        //};
                        let vBoxPos = [];
                        vBoxPos.push(new VIZCore.Vector3(vMin.x, vMin.y, vMin.z));
                        vBoxPos.push(new VIZCore.Vector3(vMax.x, vMin.y, vMin.z));
                        vBoxPos.push(new VIZCore.Vector3(vMax.x, vMax.y, vMin.z));
                        vBoxPos.push(new VIZCore.Vector3(vMin.x, vMax.y, vMin.z));
                        vBoxPos.push(new VIZCore.Vector3(vMin.x, vMin.y, vMax.z));
                        vBoxPos.push(new VIZCore.Vector3(vMax.x, vMin.y, vMax.z));
                        vBoxPos.push(new VIZCore.Vector3(vMax.x, vMax.y, vMax.z));
                        vBoxPos.push(new VIZCore.Vector3(vMin.x, vMax.y, vMax.z));

                        //for (int k = 0; k < 8; k++)
                        for (let k = 0; k < 8; k++) {
                            //float fLen = plane[i].GetProjectionLen(vBoxPos[k]);
                            let fLen = plane[i].distanceToPoint(vBoxPos[k]);

                            //fLenMin = min(fLenMin, fLen);
                            fLenMin = Math.min(fLenMin, fLen);
                            //fLenMax = max(fLenMax, fLen);
                            fLenMax = Math.max(fLenMax, fLen);

                            if (bFirst) {
                                bFirst = false;
                                //vModelMin = vModelMax = vBoxPos[k];
                                vModelMin = new VIZCore.Vector3().copy(vBoxPos[k]);
                                vModelMax = new VIZCore.Vector3().copy(vBoxPos[k]);
                            }
                            else {
                                //vModelMin.Min(vBoxPos[k]);
                                vModelMin.min(vBoxPos[k]);
                                //vModelMax.Max(vBoxPos[k]);
                                vModelMax.max(vBoxPos[k]);
                            }
                        }
                    }

                    //plane[i] = CRMPlane<float>(vPlaneNormal[i], vPlaneNormal[i] * fLenMax);
                    plane[i] = new VIZCore.Plane().setFromNormalAndCoplanarPoint(vPlaneNormal[i], new VIZCore.Vector3().copy(vPlaneNormal[i]).multiplyScalar(fLenMax));
                }
            }

            //CRMVertex3 < float > vModelCenter = (vModelMin + vModelMax) / 2.0f;
            let vModelCenter = new VIZCore.Vector3().addVectors(vModelMin, vModelMax).divideScalar(2.0);
            //float fModelRadius = (vModelMax - vModelMin).Length() / 2.0f;
            let fModelRadius = new VIZCore.Vector3().subVectors(vModelMax, vModelMin).length() / 2.0;
            //CRMVertex3 < float > vCrossPos[2];
            let vCrossPos = [];
                let error = 1.0E-4;
            // 평면의 교점으로 벡터 두개 만든다
            {
                //CRMVertex3 < float > vSecDir = vUp;
                let vSecDir = new VIZCore.Vector3().copy(vUp);
                //CRMPlane < float > planeUV(vSecDir, CRMVertex3<float>:: ZERO());
                let planeUV = new VIZCore.Plane().setFromNormalAndCoplanarPoint(vSecDir, new VIZCore.Vector3());

                //CRMVertex3 < float > vTest11 = plane[0].GetProjectionPos(vModelCenter);
                let vTest111 = new VIZCore.Vector3();
                let vTest11 = plane[0].projectPoint(vModelCenter, vTest111);
                //CRMVertex3 < float > vTest12 = plane[0].GetProjectionPos(vModelCenter + vDir * fModelRadius);
                let vTest12 = plane[0].projectPoint(new VIZCore.Vector3().copy(vDir).multiplyScalar(fModelRadius).add(vModelCenter));

                //CRMVertex3 < float > vTest21 = plane[1].GetProjectionPos(vModelCenter);
                let vTest21 = plane[1].projectPoint(vModelCenter);
                //CRMVertex3 < float > vTest22 = plane[1].GetProjectionPos(vModelCenter + vDir * fModelRadius);
                let vTest22 = plane[1].projectPoint(new VIZCore.Vector3().copy(vDir).multiplyScalar(fModelRadius).add(vModelCenter));

                //vTest11 = planeUV.GetProjectionPos(vTest11);
                vTest11 = planeUV.projectPoint(vTest11);
                //vTest12 = planeUV.GetProjectionPos(vTest12);
                vTest12 = planeUV.projectPoint(vTest12);
                //vTest21 = planeUV.GetProjectionPos(vTest21);
                vTest21 = planeUV.projectPoint(vTest21);
                //vTest22 = planeUV.GetProjectionPos(vTest22);
                vTest22 = planeUV.projectPoint(vTest22);

                //CRMVertex3 < float > vTestDir1 = (vTest12 - vTest11).Normalize();
                let vTestDir1 = new VIZCore.Vector3().subVectors(vTest12, vTest11).normalize();
                //CRMVertex3 < float > vTestDir2 = (vTest22 - vTest21).Normalize();
                let vTestDir2 = new VIZCore.Vector3().subVectors(vTest22, vTest21).normalize();

                //CRMVertex3 < float > vFindPos;
                let vFindPos = new VIZCore.Vector3();
                let arrFindPos = vFindPos.toArray();
                //bool bFind = CRMLine3<float>:: GetVectorCrossPos(vTest11.Float(), vTestDir1.Float(), vTest21.Float(), vTestDir2.Float(), vFindPos.Float(), 1.0E-1);
                //let bFind = view.Util.GetVectorCrossPos(vTest11.toArray(), vTestDir1.toArray(), vTest21.toArray(), vTestDir2.toArray(), arrFindPos, 1.0E-4);
                let bFind = view.Util.GetVectorCrossPos(vTest11.toArray(), vTestDir1.toArray(), vTest21.toArray(), vTestDir2.toArray(), arrFindPos, error);
                //---let bFind = 

                if (!bFind)
                    //return vEyePos;	// 실패
                    return vModelCenter;

                vCrossPos[0] = new VIZCore.Vector3().fromArray(arrFindPos);
            }

            {
                //CRMVertex3 < float > vSecDir = vRight;
                let vSecDir = new VIZCore.Vector3().copy(vRight);
                //CRMPlane < float > planeUV(vSecDir, CRMVertex3<float>:: ZERO());
                let planeUV = new VIZCore.Plane().setFromNormalAndCoplanarPoint(vSecDir, new VIZCore.Vector3());

                //CRMVertex3 < float > vTest11 = plane[2].GetProjectionPos(vModelCenter);
                let vTest11 = plane[2].projectPoint(vModelCenter);
                //CRMVertex3 < float > vTest12 = plane[2].GetProjectionPos(vModelCenter + vDir * fModelRadius);
                let vTest12 = plane[2].projectPoint(new VIZCore.Vector3().copy(vDir).multiplyScalar(fModelRadius).add(vModelCenter));

                //CRMVertex3 < float > vTest21 = plane[3].GetProjectionPos(vModelCenter);
                let vTest21 = plane[3].projectPoint(vModelCenter);
                //CRMVertex3 < float > vTest22 = plane[3].GetProjectionPos(vModelCenter + vDir * fModelRadius);
                let vTest22 = plane[3].projectPoint(new VIZCore.Vector3().copy(vDir).multiplyScalar(fModelRadius).add(vModelCenter));

                //vTest11 = planeUV.GetProjectionPos(vTest11);
                vTest11 = planeUV.projectPoint(vTest11);
                //vTest12 = planeUV.GetProjectionPos(vTest12);
                vTest12 = planeUV.projectPoint(vTest12);
                //vTest21 = planeUV.GetProjectionPos(vTest21);
                vTest21 = planeUV.projectPoint(vTest21);
                //vTest22 = planeUV.GetProjectionPos(vTest22);
                vTest22 = planeUV.projectPoint(vTest22);

                //CRMVertex3 < float > vTestDir1 = (vTest12 - vTest11).Normalize();
                let vTestDir1 = new VIZCore.Vector3().subVectors(vTest12, vTest11).normalize();
                //CRMVertex3 < float > vTestDir2 = (vTest22 - vTest21).Normalize();
                let vTestDir2 = new VIZCore.Vector3().subVectors(vTest22, vTest21).normalize();

                let vFindPos = new VIZCore.Vector3();
                let arrFindPos = vFindPos.toArray();
                //bool bFind = CRMLine3<float>:: GetVectorCrossPos(vTest11.Float(), vTestDir1.Float(), vTest21.Float(), vTestDir2.Float(), vFindPos.Float(), 1.0E-1);
                let bFind = view.Util.GetVectorCrossPos(vTest11.toArray(), vTestDir1.toArray(), vTest21.toArray(), vTestDir2.toArray(), arrFindPos, error);
                //---let bFind = 

                if (!bFind)
                    //return vEyePos;	// 실패
                    return vModelCenter;

                vCrossPos[1] = new VIZCore.Vector3().fromArray(arrFindPos);
            }

            // 시점 구한다
            {
                //float fDot1 = vDir.Dot(vCrossPos[0]);
                let fDot1 = new VIZCore.Vector3().copy(vDir).dot(vCrossPos[0]);
                //float fDot2 = vDir.Dot(vCrossPos[1]);
                let fDot2 = new VIZCore.Vector3().copy(vDir).dot(vCrossPos[1]);

                //CRMPlane < float > planeEye;
                let planeEye = new VIZCore.Plane();
                if (fDot1 < fDot2)
                    //planeEye = CRMPlane<float>(vDir, vCrossPos[0]);
                    planeEye = new VIZCore.Plane().setFromNormalAndCoplanarPoint(vDir, vCrossPos[0]);
                else
                    //planeEye = CRMPlane<float>(vDir, vCrossPos[1]);
                    planeEye = new VIZCore.Plane().setFromNormalAndCoplanarPoint(vDir, vCrossPos[1]);

                //CRMVertex3 < float > vTest11 = planeEye.GetProjectionPos(vCrossPos[0]);
                let vTest11 = planeEye.projectPoint(vCrossPos[0]);
                //CRMVertex3 < float > vTest12 = planeEye.GetProjectionPos(vCrossPos[0] + vUp * fModelRadius);
                let vTest12 = planeEye.projectPoint(new VIZCore.Vector3().copy(vUp).multiplyScalar(fModelRadius).add(vCrossPos[0]));
                //CRMVertex3 < float > vTest21 = planeEye.GetProjectionPos(vCrossPos[1]);
                let vTest21 = planeEye.projectPoint(vCrossPos[1]);
                //CRMVertex3 < float > vTest22 = planeEye.GetProjectionPos(vCrossPos[1] + vRight * fModelRadius);
                let vTest22 = planeEye.projectPoint(new VIZCore.Vector3().copy(vRight).multiplyScalar(fModelRadius).add(vCrossPos[1]));

                //CRMVertex3 < float > vTestDir1 = (vTest12 - vTest11).Normalize();
                let vTestDir1 = new VIZCore.Vector3().subVectors(vTest12, vTest11).normalize();
                //CRMVertex3 < float > vTestDir2 = (vTest22 - vTest21).Normalize();
                let vTestDir2 = new VIZCore.Vector3().subVectors(vTest22, vTest21).normalize();

                let vFindPos = new VIZCore.Vector3();
                let arrFindPos = vFindPos.toArray();
                //bool bFind = CRMLine3<float>:: GetVectorCrossPos(vTest11.Float(), vTestDir1.Float(), vTest21.Float(), vTestDir2.Float(), vFindPos.Float(), 1.0E-1);
                let bFind = view.Util.GetVectorCrossPos(vTest11.toArray(), vTestDir1.toArray(), vTest21.toArray(), vTestDir2.toArray(), arrFindPos, error);

                if (!bFind)
                    //return vEyePos;	// 실패
                    return vModelCenter;

                vEyePos = new VIZCore.Vector3().fromArray(arrFindPos);
            }

            return vEyePos;
        };

        ///**
        // * Z축 고정 시 모델의 바닥면으로 회전되는 것을 방지 설정
        // * @param {Boolean} enable true: 활성화, false : 비활성화
        // */
        this.SetLockCameraUpAngle = function (enable) {
            scope.useUpVectorFixRotateVAngleRange = enable;
        };

        ///**
        // * Z축 고정 시 모델의 바닥면으로 회전되는 것을 방지 설정반환
        // * @returns {Boolean} true: 활성화, false : 비활성화
        // */
        this.GetLockCameraUpAngle = function () {
            return scope.useUpVectorFixRotateVAngleRange;
        };

        ///**
        // *  Z축 고정된 카메라를 회전할수 있는 각도 설정
        // * @param {Number} min 최소 각 (-90 ~ 90)
        // * @param {Number} max 최대 각 (-90 ~ 90)
        // */
        this.SetLockCameraUpAngleMinMax = function (min, max) {
            fixUpVectorMinAngle = min;
            fixUpVectorMaxAngle = max;
        };

        // 화면상의 1Pixel의 길이 반환
        this.GetScreen1PixelLength = function(pos){
            let viewDir = scope.GetViewDirection();
            let vCross = new VIZCore.Vector3(0,1,0);
            if(viewDir.y < -0.9 || viewDir.y > 0.9){
                vCross = new VIZCore.Vector3(1, 0, 0);
            }
            vCross.cross(viewDir);
            vCross.normalize();

            let matMVP = new VIZCore.Matrix4().copy(scope.matMVP);

            let s3D1 = new VIZCore.Vector3().copy(pos);
            let s3D2 = new VIZCore.Vector3().addVectors(pos, new VIZCore.Vector3().copy(vCross).multiplyScalar(100));
            let s2D1 = world2ScreenWithMatrix(matMVP, s3D1);
            let s2D2 = world2ScreenWithMatrix(matMVP, s3D2);
            let f2DLen = new VIZCore.Vector3().subVectors(s2D1, s2D2).length2D();
            let fReal = 100/f2DLen;
            return fReal;
        };
    
    }
 }
export default Camera;