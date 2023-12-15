import IXray from "./IXrayManager.js"
import IViewCube from "./IViewCubeManager.js"
import ISky from "./ISkyManager.js"
import IFly from "./IFlyManager.js"
import IWalkthrough from "./IWalkthroughManager.js"
import IControl from "./IControlManager.js"
import IMultiCamera from "./IMultiCameraManager.js"
import IWeather from "./IWeatherManager.js"


/**
 * VIZCore View 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 
 */
class View {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;
        this.Xray = new IXray(main, VIZCore);
        this.ViewCube = new IViewCube(main, VIZCore);
        this.Sky = new ISky(main, VIZCore);
        this.Fly = new IFly(main, VIZCore);
        this.Walkthrough = new IWalkthrough(main, VIZCore);
        this.Control = new IControl(main, VIZCore);
        this.MultiCamera = new IMultiCamera(main, VIZCore);
        this.Weather = new IWeather(main, VIZCore);

        //=======================================
        // Method
        //=======================================
        /**
         * 배경 색상 설정
         * @param {VIZCore.Color} color1 Color #1
         * @param {VIZCore.Color} color2 Color #2
         * @example
         * vizwide3d.View.SetBackgroundColor(
         *      new VIZCore.Color(255, 255, 255, 255)
         *      , new VIZCore.Color(180, 180, 180, 255)
         * );
         *
         * vizwide3d.Model.OpenHeader("./VIZCore/Model/Sample_wh.vizw");
         */
        this.SetBackgroundColor = function (color1, color2) {
            scope.Main.Renderer.SetBackColor(color1, color2);
        };

        /**
         * 배경 색상 표현 설정
         * @param {VIZCore.Enum.BackgroundModes} mode 배경 색상표현 설정
         * @example
         *
         * //vizwide3d.View.SetBackgroundMode(VIZCore.Enum.BackgroundModes.COLOR_ONE);
         * //vizwide3d.View.SetBackgroundMode(VIZCore.Enum.BackgroundModes.COLOR_TWO_HOR);
         * vizwide3d.View.SetBackgroundMode(VIZCore.Enum.BackgroundModes.COLOR_TWO_HOR_REVERSE);
         * //vizwide3d.View.SetBackgroundMode(VIZCore.Enum.BackgroundModes.COLOR_TWO_VER);
         * //vizwide3d.View.SetBackgroundMode(VIZCore.Enum.BackgroundModes.COLOR_TWO_VER_REVERSE);
         * //vizwide3d.View.SetBackgroundMode(VIZCore.Enum.BackgroundModes.COLOR_TWO_CHOR);
         * //vizwide3d.View.SetBackgroundMode(VIZCore.Enum.BackgroundModes.COLOR_TWO_CHOR_REVERSE);
         * //vizwide3d.View.SetBackgroundMode(VIZCore.Enum.BackgroundModes.COLOR_TWO_CVER);
         * //vizwide3d.View.SetBackgroundMode(VIZCore.Enum.BackgroundModes.COLOR_TWO_CVER_REVERSE);
         * //vizwide3d.View.SetBackgroundMode(VIZCore.Enum.BackgroundModes.COLOR_TWO_CENTER);
         * //vizwide3d.View.SetBackgroundMode(VIZCore.Enum.BackgroundModes.COLOR_TWO_CORNER);
         * 
         * vizwide3d.View.SetBackgroundColor(
         *   new VIZCore.Color(255, 255, 255, 255)
         *   , new VIZCore.Color(180, 180, 180, 255)
         * );
         * 
         * vizwide3d.Render();
         */
        this.SetBackgroundMode = function (mode) {
            scope.Main.Configuration.Render.Background.Mode = mode;
        };

        /**
         * 모서리 강조 색상 설정
         * @param {VIZCore.Color} color Edge Highlight Color
         * @example
         * vizwide3d.Model.OpenHeader("./VIZCore/Model/Sample_wh.vizw");
         *
         * vizwide3d.View.SetEdgeColor(new VIZCore.Color(0, 0, 0, 240));
         * vizwide3D.View.Xray.Enable(true);
         */
        this.SetEdgeColor = function (color) {
            scope.Main.Renderer.SetEdgeEffectColor(color);
        };

        /**
         * 모델 모서리 표시
         * @param {boolean} visible 모델 모서리 표시
         * @example
         * vizwide3d.View.ShowEdge(true);  // Show
         * vizwide3d.View.ShowEdge(false); // Hide
         */
        this.ShowEdge = function (visible) {
            scope.Main.Mode.Edge(visible);
        };

        /**
         * 모델 모서리 표시 상태 반환
         * @returns {boolean} 상태 : True(show) / False(hide)
         * @example
         * if(vizwide3d.View.IsEdgeVisible())
         *  vizwide3d.View.ShowEdge(false);
         * else
         *  vizwide3d.View.ShowEdge(true);
         */
        this.IsEdgeVisible = function () {
            return scope.Main.Renderer.GetUseEdgeEffect();
        };

        /**
        * 지정한 개체의 모델 모서리 추가 표시
        * @param {boolean} visible 모델 모서리 표시
        * @example
        * vizwide3d.View.ShowModelObjectCustomEdge(true);  // Show
        * vizwide3d.View.ShowModelObjectCustomEdge(false); // Hide
        * 
        * function funExample() {
        *      let ids = [10 , 20];
        *      vizwide3d.Object3D.CustomEdge.SetEdge(ids, true);
        * 
        *      vizwide3d.View.ShowModelObjectCustomEdge(true);
        * }
        */
        this.ShowModelObjectCustomEdge = function (visible) {
            scope.Main.Renderer.SetUseModelObjectCustomEdgeEffect(visible);
            scope.Main.ViewRefresh();
        };

        /**
         * 지정한 개체의 모델 모서리 추가 표시 반환
         * @returns {boolean} 상태 : true(show) / false(hide)
         * @example
         * if(vizwide3d.View.IsModelObjectCustomEdgeVisible())
         *  vizwide3d.View.ShowModelObjectCustomEdge(false);
         * else
         *  vizwide3d.View.ShowModelObjectCustomEdge(true);
         */
        this.IsModelObjectCustomEdgeVisible = function () {
            return scope.Main.Renderer.GetUseModelObjectCustomEdgeEffect(visible);
        };

        /**
         * 지정한 개체의 모델 모서리 추가 표시 색상 설정
         * @param {VIZCore.Color} color 
         * @example
         *  let color = new VIZCore.Color(255,255,255,255);
         
         *  vizwide3d.View.SetModelObjectCustomEdgeColor(color);
         *  vizwide3d.View.ShowModelObjectCustomEdge(true);
         */
        this.SetModelObjectCustomEdgeColor = function (color) {
            scope.Main.Renderer.SetModelObjectCustomEdgeColor(color);
        };

        /**
         * 선택 가능 개체 유형 설정
         * @param {VIZCore.Enum.SelectionObject3DTypes} selectionObject3DTypes 개체 유형
         * @example
         * vizwide3d.Model.OpenHeader("./VIZCore/Model/Sample_wh.vizw");
         *
         * vizwide3d.View.SetSelectionObject3DType(VIZCore.Enum.SelectionObject3DTypes.ALL);                // 전체 개체 선택
         * vizwide3d.View.SetSelectionObject3DType(VIZCore.Enum.SelectionObject3DTypes.OPAQUE_OBJECT3D);    // 불투명한 개체만 선택
         * vizwide3d.View.SetSelectionObject3DType(VIZCore.Enum.SelectionObject3DTypes.NONE);    // 선택 안함
         * vizwide3d.View.SetSelectionObject3DType(VIZCore.Enum.SelectionObject3DTypes.CUSTOMCOLOR_OBJECT3D);    // 색상 변경된 개체만 선택
         * 
         * vizwide3d.Render();
         */
        this.SetSelectionObject3DType = function (selectionObject3DTypes) {
            scope.Main.Configuration.Model.Selection.Kind = selectionObject3DTypes;
        };

        /**
         * 선택 가능 개체 타입 설정
         * @param {VIZCore.Enum.SELECT_UNIT} unit 개체 유형
         * @example
         * vizwide3d.Model.OpenHeader("./VIZCore/Model/Sample_wh.vizw");
         *
         * vizwide3d.View.SetSelectionUnit(VIZCore.Enum.SELECT_UNIT.Assembly);
         * vizwide3d.View.SetSelectionUnit(VIZCore.Enum.SELECT_UNIT.Part);
         * vizwide3d.View.SetSelectionUnit(VIZCore.Enum.SELECT_UNIT.Level);
         */
        this.SetSelectionUnit = function (unit) {
            scope.Main.Configuration.Model.Selection.Unit = unit;
        };

        /**
         * 선택 가능 개체 타입이 LEVEL일 경우, 선택되어야 하는 LEVEL 설정
         * @param {Number} level 개체 레벨
         * @example
         * vizwide3d.Model.OpenHeader("./VIZCore/Model/Sample_wh.vizw");
         *
         * vizwide3d.View.SetSelectionUnit(VIZCore.Enum.SELECT_UNIT.Level);
         * vizwide3d.View.SetSelectionLevel(5); // 선택된 개체의 상위 5 Level 개체를 선택상태로 변경
         */
        this.SetSelectionLevel = function (level) {
            scope.Main.Configuration.Model.Selection.Level = level;
        };

        /**
         * 초기 모델 조회 시, 초기 카메라 방향 설정
         * @param {VIZCore.Enum.VIEW_MODES} direction 카메라 방향
         * @example
         * vizwide3d.View.SetCameraBaseDirection(VIZCore.Enum.VIEW_MODES.PlusZ);
         *
         * vizwide3d.Model.OpenHeader("./VIZCore/Model/Sample_wh.vizw");
         */
        this.SetCameraBaseDirection = function (direction) {
            scope.Main.Camera.SetBaseDirection(direction);
        };

        /**
         * 초기 모델 조회 시, 초기 카메라 방향 설정
         * @param {VIZCore.Matrix4} matrix 초기 방향 matrix 설정
         * @example
         * 
         * let baseMatrix = new VIZCore.Matrix4();
         * vizwide3d.View.SetCameraBaseMatrix(baseMatrix);
         */
        this.SetCameraBaseDirectionMatrix = function (matrix) {
            scope.Main.Camera.SetBaseDirection(VIZCore.Enum.VIEW_MODES.CustomView, matrix);
        };


        /**
         * 초기 모델 조회 시, 초기 카메라 설정
         * @param {VIZCore.Matrix4} matrix 초기 matrix 설정
         * @example
         * 
         * let baseMatrix = new VIZCore.Matrix4();
         * vizwide3d.View.SetCameraBaseMatrix(baseMatrix);
         */
        this.SetCameraBaseMatrix = function (matrix) {
            scope.Main.Camera.SetBaseDirection(VIZCore.Enum.VIEW_MODES.CustomViewMatrix, matrix);
        };

        /**
         * 초기 모델 조회 시, 초기 카메라 줌 설정
         * @param {Number} val 거리값. 1.5(Default). 숫자가 작을수록 초기 모델이 크게 보임
         * @example
         * vizwide3d.Model.OpenHeader("./VIZCore/Model/Sample_wh.vizw");
         *
         * vizwide3d.View.SetCameraDistanceFactor(0.8);
         */
        this.SetCameraDistanceFactor = function (val) {
            scope.Main.Camera.viewDistanceFactor = val;
            scope.Main.Camera.ResizeGLWindow();
        };

        /**
         * Window 의 크기를 변경된 조건에 맞게 조정
         */
        this.Resize = function () {
            scope.Main.Resize();
        };

        /**
         * OpenGL Window 의 크기를 변경된 조건에 맞게 조정
         * @return {Boolean} 재정렬 결과
         * @example
         * vizwide3d.View.ResizeGLWindow();
         */
        this.ResizeGLWindow = function () {
            return scope.Main.Camera.ResizeGLWindow();
        };

        /**
         * 초기 GL Windows View 설정
         * @example
         * vizwide3d.View.ResetGLWindow();
         */
        this.ResetGLWindow = function () {
            scope.Main.Camera.ResetGLWindow();

            scope.Main.ViewRefresh();
        };

        /**
        * Update GL Window - matrix MV, matrix MVP Update
        * @param {VIZCore.Matrix4} matrix Model Matrix == undefined 인 경우 초기값
        * @example
        * let matrix = new VIZCore.Matrix4();
        * 
        * vizwide3d.View.UpdateGLWindow(matrix);
        */
        this.UpdateGLWindow = function (matrix) {
            scope.Main.Camera.UpdateGLWindow(matrix);
        };

        /**
         * 현재 모델을 화면에 맞춤
         * @example
         * vizwide3d.View.FitAll();
         */
        this.FitAll = function () {
            scope.Main.Camera.FitAll();
            scope.Main.ViewRefresh();
        };

        /**
         * 초기 화면으로 초기화
         * @example
         * vizwide3d.View.ResetView();
         */
        this.ResetView = function () {
            scope.Main.Camera.ResetView();
            scope.Main.ViewRefresh();
        };

        /**
         * 현재 화면을 갱신
         * @example
         * vizwide3d.View.Refresh();
         */
        this.Refresh = function () {
            scope.Main.Renderer.Render();
        };

        /**
         * 영역을 확대
         * @param {Number} x1 위치
         * @param {Number} y1 위치
         * @param {Number} x2 위치
         * @param {Number} y2 위치
         * @example
         * vizwide3d.View.BoxZoomByArea(100, 100, 600, 600);
         */
        this.BoxZoomByArea = function (x1, y1, x2, y2) {
            scope.Main.Camera.ViewBoxZoom(x1, y1, x2, y2);
        };

        /**
         * 윤곽효과 모드 활성화 / 비활성화
         * @param {Boolean} enable True(활성화), False(비활성화)
         * @example
         * vizwide3d.View.EnableSilhouetteEdge(true);
         */
        this.EnableSilhouetteEdge = function (enable) {
            scope.Main.Mode.Edge(enable);
        };

        /**
         * SSAO효과 모드 활성화 / 비활성화
         * @param {Boolean} enable True(활성화), False(비활성화)
         * @example
         * vizwide3d.View.EnableSSAO(true);
         */
        this.EnableSSAO = function (enable) {
            scope.Main.Mode.SSAO(enable);
        };

        /**
         * GraySacle 모드 활성화 / 비활성화
         * @param {Boolean} enable True(활성화), False(비활성화)
         * @example
         * vizwide3d.View.EnableGraySacle(true);
         */
        this.EnableGraySacle = function (enable) {
            scope.Main.Mode.GraySacle(enable);
        };

        /**
         * HiddenLine 모드 활성화 / 비활성화
         * @param {Boolean} enable True(활성화), False(비활성화)
         * @example
         * vizwide3d.View.EnableHiddenLine(true);
         */
        this.EnableHiddenLine = function (enable) {
            scope.Main.Mode.HiddenLine(enable);
        };

        /**
         * Wireframe 모드 활성화 / 비활성화
         * @param {Boolean} enable True(활성화), False(비활성화)
         * @example
         * vizwide3d.View.EnableWireframe(true);
         */
        this.EnableWireframe = function (enable) {
            scope.Main.Mode.Wireframe(enable);
        };

        /**
         * Render Mode 설정
         * @param {VIZCore.Enum.RENDER_MODES} mode 
         * @example
         * vizwide3d.View.SetRenderMode(VIZCore.Enum.RENDER_MODES.Smooth);
         * vizwide3d.View.SetRenderMode(VIZCore.Enum.RENDER_MODES.Xray);
         * vizwide3d.View.SetRenderMode(VIZCore.Enum.RENDER_MODES.Plastic);
         * vizwide3d.View.SetRenderMode(VIZCore.Enum.RENDER_MODES.HiddenLine);
         * vizwide3d.View.SetRenderMode(VIZCore.Enum.RENDER_MODES.HiddenLineDashed);
         * vizwide3d.View.SetRenderMode(VIZCore.Enum.RENDER_MODES.WireFrame);
         * vizwide3d.View.SetRenderMode(VIZCore.Enum.RENDER_MODES.GrayScale);
         */
        this.SetRenderMode = function (mode) {
            scope.Main.Renderer.SetRenderMode(mode);
        };

        /**
        * 선택모델 X-ray 활성화
        * @param {Array} ids 
        * @example
        *  let ids = [10 , 20];
        *  vizwide3d.View.SetSelectionXrayMode(ids);
        */
        this.SetSelectionXrayMode = function (ids) {
            scope.Main.Renderer.SetSelectionXrayMode(ids);
        };

        /**
         * 선택모델 윤곽효과 활성화 / 비활성화
         * @param {Boolean} enable True(활성화), False(비활성화)
         * @example
         * vizwide3d.View.EnableSilhouetteEdgeToSelectedObject(true);
         */
        this.EnableSilhouetteEdgeToSelectedObject = function (enable) {
            scope.Main.Mode.SelectModelEdge(enable);
        };

        /**
         * 그림자 효과 활성화 / 비활성화 (WebGL 2.0 지원)
         * @param {Boolean} enable True(활성화), False(비활성화)
         * @example
         * vizwide3d.View.EnableShadow(true);
         */
        this.EnableShadow = function (enable) {
            scope.Main.Mode.Shadow(enable);
        };

        /**
         * 그림자 효과 비율 설정 (0 ~ 1)
         * @param {Number} ratio 0 : 그림자 표시하지 않음, 1 : 그림자 어둡게 적용
         * @example
         * vizwide3d.View.EnableShadow(true);
         * vizwide3d.View.SetShadowRatio(0.3);
         */
        this.SetShadowRatio = function (ratio) {
            scope.Main.Renderer.SetShadowRatio(ratio);
            scope.Main.ViewRefresh();
        };


        /**
         * 환경 조명 설정 - 활성화 / 비활성화
         * @param {Boolean} enable True(활성화), False(비활성화)
         * @example
         * vizwide3d.View.EnableEnvironment(true);
         */
        this.EnableEnvironment = function (enable) {
            scope.Main.Renderer.SetEnvironmentMode(enable);
        };

        /**
         * 환경 Fog 활성화
         * @param {boolean} enable 활성화/비활성화
         * @example
         * vizwide3d.View.EnableFog(true);
         */
        this.EnableFog = function (enable) {
            scope.Main.Renderer.SetEnableFog(enable);
        };

        /**
         * 환경 날씨 비 활성화
         * @param {boolean} enable 활성화/비활성화
         * @example
         * vizwide3d.View.EnableWeatherRain(true);
         */
        this.EnableWeatherRain = function (enable) {
            scope.Weather.SetEnableWeatherRain(enable);
        };

        /**
         * 환경 날씨 비 그려지는 수 설정
         * @param {number} count
         * @example
         * vizwide3d.View.SetWeatherRainDrawCount(1000);
         */
        this.SetWeatherRainDrawCount = function (count) {
            scope.Weather.SetWeatherRainDrawCount(count);
        };

        /**
         * 환경 날씨 눈 활성화
         * @param {boolean} enable 활성화/비활성화
         * @example
         * vizwide3d.View.EnableWeatherSnow(true);
         */
        this.EnableWeatherSnow = function (enable) {
            scope.Weather.SetEnableWeatherSnow(enable);
        };

        /**
         * 환경 날씨 눈 그려지는 수 설정
         * @param {number} count 
         * @example
         * vizwide3d.View.SetWeatherSnowDrawCount(1000);
         */
        this.SetWeatherSnowDrawCount = function (count) {
            scope.Weather.SetWeatherSnowDrawCount(count);
        };



        /**
         * 선택 모델 박스 줌
         * @param {Number} offset bbox offset
         * @param {Number} margine screen margine ratio
         * @example
         * vizwide3d.View.ZoomSelectedObject(0, 0.1);
         */
        this.ZoomSelectedObject = function (offset, margine) {
            scope.Main.Data.ZoomSelection(offset, margine);
        };


        /**
         * View Control 중 형상 가시화 모드 설정
         * @param {VIZCore.Enum.ViewUnderControlVisibleMode} mode 
         * @example
         *  vizwide3d.View.MultiCamera.Remove(VIZCore.Enum.ViewUnderControlVisibleMode.SHADED);
         *  vizwide3d.View.MultiCamera.Remove(VIZCore.Enum.ViewUnderControlVisibleMode.BOUNDBOX);
         */
        this.SetViewUnderControlMode = function (mode) {
            scope.Main.Renderer.SetViewUnderControlMode(mode);
        };


        /**
         * View Control 중 형상 가시화 모드 설정 반환
         * @returns {VIZCore.Enum.ViewUnderControlVisibleMode} 설정 반환
         * @example
         * let item = vizwide3d.View.GetViewUnderControlMode();
         */
        this.GetViewUnderControlMode = function () {
            return scope.Main.Renderer.GetViewUnderControlMode();
        };

        /**
        * 피봇(회전 중심) 설정
        * @param {VIZCore.Vector3} point 위치
        * @example
        * let point = new VIZCore.Vector3(0, 0, 0);
        * 
        * vizwide3d.View.SetPivot(point);
        */
        this.SetPivot = function (point) {
            scope.Main.Camera.SetPivot(point);
        };

        /**
         * Camera 회전
         * @param {Number} x 회전 X
         * @param {Number} y 회전 Y
         * @param {Number} z 회전 Z
         * @param {VIZCore.Enum.AngleFormat} angleFormat DEFAULT : VIZCore.Enum.AngleFormat.DEGREE
         * @example
         * 
         * let rotateAngleX = 45.0;
         * vizwide3d.View.RotateCamera(rotateAngleX, 0, 0);
         * vizwide3d.View.RotateCamera(rotateAngleX, 0, 0, VIZCore.Enum.AngleFormat.DEGREE);
         */
        this.RotateCamera = function (x, y, z, angleFormat) {
            scope.RotateCameraByVector(new VIZCore.Vector3(x, y, z), angleFormat);
        };

        /**
        * Camera 회전
        * @param {VIZCore.Vector3} vector 회전 angle x, y, z
        * @param {VIZCore.Enum.AngleFormat} angleFormat DEFAULT : VIZCore.Enum.AngleFormat.DEGREE
        */
        this.RotateCameraByVector = function (vector, angleFormat) {

            let vRadianAngle = new VIZCore.Vector3().copy(vector);
            if (angleFormat === undefined || angleFormat === VIZCore.Enum.AngleFormat.DEGREE) {
                vRadianAngle.x = scope.Main.Util.DegToRad(vector.x);
                vRadianAngle.y = scope.Main.Util.DegToRad(vector.y);
                vRadianAngle.z = scope.Main.Util.DegToRad(vector.z);
            }

            //Fix Z축 고정
            if (scope.Main.Control._sub === VIZCore.Enum.MOUSE_CONTROL_SUB_TYPE.ROTATE_FIXEDZ) {


                //Z방향은 회전 불가능
                vRadianAngle.z = vRadianAngle.y;

                scope.Main.FixZAxis = true;
                scope.Main.Camera.CameraRotate(vRadianAngle);
                scope.Main.FixZAxis = false;
                //scope.Main.Camera.CameraRotateByWorldAxis(vRadianAngle);
            }
            //World Fix Z축 고정
            else if (scope.Main.Control._sub === VIZCore.Enum.MOUSE_CONTROL_SUB_TYPE.ROTATE_WFIXEDZ) {
                scope.Main.FixZAxis = false;
                scope.Main.Camera.FixWorldAxis = true;

                scope.Main.Camera.CameraRotate(vRadianAngle);

                scope.Main.Camera.FixWorldAxis = false;
                scope.Main.FixZAxis = false;
            }
            else {
                scope.Main.Camera.CameraRotate(vRadianAngle);
            }

            scope.Main.Camera.ResizeGLWindow();
            scope.Main.ViewRefresh();

        };

        /**
         * Camera 회전
         * @param {VIZCore.Vector3} axis 고정축
         * @param {VIZCore.Vector3} vector 회전 angle x, y, z
         * @param {VIZCore.Enum.AngleFormat} angleFormat DEFAULT : VIZCore.Enum.AngleFormat.DEGREE
         */
        this.RotateCameraByWorldAxis = function (axis, vector) {

            let vRadianAngle = new VIZCore.Vector3().copy(vector);
            if (angleFormat === undefined || angleFormat === VIZCore.Enum.AngleFormat.DEGREE) {
                vRadianAngle.x = scope.Main.Util.DegToRad(vector.x);
                vRadianAngle.y = scope.Main.Util.DegToRad(vector.y);
                vRadianAngle.z = scope.Main.Util.DegToRad(vector.z);
            }

            //vector Radian
            scope.Main.Camera.CameraRotateByWorldAxis(axis, vRadianAngle);
            scope.Main.Camera.ResizeGLWindow();
            scope.Main.ViewRefresh();
        };

        /**
        * Camera 회전
        * @param {VIZCore.Matrix4} matrix 회전 Matrix
        * */
        this.RotateCameraByMatrix = function (matrix) {
            scope.Main.Camera.CameraRotateByMatrix(matrix);
            scope.Main.Camera.ResizeGLWindow();
            scope.Main.ViewRefresh();

        };

        /**
        * Camera 회전
        * @param {VIZCore.Matrix4} matrix 회전 Matrix
        * @param {VIZCore.Matrix4} mvMatrix MV Matrix
        * */
        this.RotateCameraByMatrixWithMV = function (matrix, mvMatrix) {
            scope.Main.Camera.CameraRotateWithMV(matrix, mvMatrix);
            scope.Main.Camera.ResizeGLWindow();
            scope.Main.ViewRefresh();

        };

        /**
        * Camera 이동
        * @param {VIZCore.Vector3} vector 이동
        * */
        this.TranslateCameraByVector = function (vector) {
            scope.Main.Camera.CameraTranslate(vector);
            scope.Main.Camera.ResizeGLWindow();
            scope.Main.ViewRefresh();
        };

        /**
        * Camera 이동
        * @param {VIZCore.Matrix4} matrix 이동 Matrix
        * */
        this.TranslateCameraByMatrix = function (matrix) {
            scope.Main.Camera.CameraTranslateByMatrix(matrix);

            scope.Main.Camera.ResizeGLWindow();
            scope.Main.ViewRefresh();
        };

        /**
        * 설정된 Pivot 기준 Camera Zoom In
        * @param {Number} ratio Zoom (기본 1.0)
        * @example
        *  vizwide3d.Object3D.CameraZoomIn();
        *  vizwide3d.Object3D.CameraZoomIn(0.5);
        *  vizwide3d.Object3D.CameraZoomIn(1.0);
        *  vizwide3d.Object3D.CameraZoomIn(2.0);
        */
        this.CameraZoomIn = function (ratio) {
            scope.Main.Camera.CameraZoomInOut(true, ratio);

            scope.Main.Camera.ResizeGLWindow();
            scope.Main.ViewRefresh();
        };


        /**
         * 설정된 Pivot 기준 Camera Zoom Out
         * @param {Number} ratio Zoom (기본 1.0)
         * @example
         *  vizwide3d.Object3D.CameraZoomOut();
         *  vizwide3d.Object3D.CameraZoomOut(0.5);
         *  vizwide3d.Object3D.CameraZoomOut(1.0);
         *  vizwide3d.Object3D.CameraZoomOut(2.0);
         */
        this.CameraZoomOut = function (ratio) {
            scope.Main.Camera.CameraZoomInOut(false, ratio);

            scope.Main.Camera.ResizeGLWindow();
            scope.Main.ViewRefresh();
        };


        /**
        * GL Windows View 초기화
        */
        this.ClearGLWindow = function () {
            scope.Main.Camera.ClearGLWindow();
        };

        /**
        * 카메라 백업
        * @returns {Data.UUIDv4} 백업 아이디
        * */
        this.BackupCamera = function () {
            return scope.Main.Camera.Backup();
        };

        /**
        * 카메라 복원 목록 반환
        * @returns {Array} 백업된 데이터 반환 : BackupCameraData
        * */
        this.GetBackupCameraList = function () {
            let list = scope.Main.Camera.GetBackupCameraList();
            return list;
        };

        /**
        * 카메라 복원 데이터 반환
        * @param {Data.UUIDv4} id 백업 아이디
        * @returns {BackupCameraData} 백업된 데이터 반환
        * */
        this.GetBackupCameraData = function (id) {
            return scope.Main.Camera.GetBackupData(id);
        };

        /**
        * 카메라 복원 데이터 제거
        * @param {Data.UUIDv4} id 백업 아이디
        * */
        this.DeleteCameraBackupData = function (id) {
            scope.Main.Camera.DeleteBackupData(id);
        };

        /**
        * 카메라 복원
        * @param {string} id 백업 아이디
        * */
        this.RollbackCamera = function (id) {
            scope.Main.Camera.Rollback(id);
        };

        /**
      * 바운드 박스로 포커스
      * @param {Data.BBox} boundBox Bound Box
      * @param {Number} margine screen margine ratio
      */
        this.FocusByBoundBox = function (boundBox, margine) {
            scope.Main.Camera.FocusBBox(boundBox, margine);
        };

        /**
        * 해당 Node IDs 의 노드 포커스
        * @param {Array} nodeIDs Node IDs
        * @param {Number} offset Offset
        * @param {Number} margine screen margine ratio
        * @example
        *  // 선택 개체 ID
        *  let selNode = vizwide3d.Object3D.GetSelectedObject3D();
        *  // 포커스
        *  vizwide3d.View.FocusObjectByNodeID(selNode);
        */
        this.FocusObjectByNodeID = function (nodeIDs, offset, margine) {
            scope.Main.Camera.FocusObject(nodeIDs, offset, margine);
        };

        /**
        * 피벗 위치로 화면 중심이동
        * @param {VIZCore.Vector3} world Pivot 위치 갱신 (undefined === 현재 pivot로 이동)
        */
        this.FocusPivot = function (world) {
            scope.Main.Camera.FocusPivot(world);
        };


        /**
         * 카메라 애니메이션 설정
         * @param {Boolean} enable true : 활성화, false : 비활성화
         */
        this.EnableAnimation = function (enable) {
            scope.Main.Camera.cameraAnimation = enable;
        };

        /**
        * 카메라 애니메이션 설정 반환
        * @returns {Boolean} true : 활성화, false : 비활성화
        */
        this.IsAnimation = function () {
            return scope.Main.Camera.cameraAnimation;
        };

        /**
         * Axis Z Up
         */
        this.SetZAxis2Up = function () {

            for (let i = 0; i < 16; i++)
                scope.Main.Camera.SetZAxis2Up();
        };

        /**
         * Lock Z-Axis : Z축을 기준으로 회전
         * @param {Boolean} enable : True(Z축을 기준으로 회전), False(360 회전)
         * @example
         * vizwide3d.View.LockZAxis(true);
         * vizwide3d.View.LockZAxis(false);
         */
        this.LockZAxis = function (enable) {
            scope.Main.FixZAxis = enable;
        };

        /**
         * 카메라 제어
         * @param {Boolean} enable : True(Lock), False(Unlock)
         * @example
         * vizwide3d.View.LockCamera(true);
         * vizwide3d.View.LockCamera(false);
         */
        this.LockCamera = function (enable) {
            scope.Main.Camera.LockCamera = enable;
        };

        /**
         * Z축 고정 시 모델의 바닥면으로 회전되는 것을 방지
         * @param {Boolean} enable : True(바닥면으로 카메라 회전 차단), False(360 회전)
         * @example
         * vizwide3d.View.SetLockCameraUpAngle(true);
         * vizwide3d.View.SetLockCameraUpAngle(false);
         */
        this.SetLockCameraUpAngle = function (enable) {
            scope.Main.Camera.SetLockCameraUpAngle(enable);
        };

        /**
       * Z축 고정 시 모델의 바닥면으로 회전되는 것을 방지 설정반환
       * @returns {Boolean} True(바닥면으로 카메라 회전 차단), False(360 회전)
       */
        this.GetLockCameraUpAngle = function () {
            return scope.Main.Camera.GetLockCameraUpAngle();
        };

        /**
         *  Z축 고정된 카메라를 회전할수 있는 각도 설정
         * @param {Number} min 최소 각 (-90 ~ 90)
         * @param {Number} max 최대 각 (-90 ~ 90)
         */
        this.SetLockCameraUpAngleMinMax = function (min, max) {
            scope.Main.Camera.SetLockCameraUpAngleMinMax(min, max);
        };


        /**
         * 현재 카메라 정보 반환
         * @returns {Object} CameraData
         */
        this.GetCameraData = function () {
            return scope.Main.Camera.GetCameraData();
        };

        /**
         * 카메라의 위치 및 quaternion 값에 대한 카메라 행렬 반환 // 모델 로딩 후 (viewDistance 필요)
         * @param {VIZCore.Vector3} posistion 
         * @param {VIZCore.Quaternion} quaternion 
         */
       this.GetMVMatrixFormPosQuat = function(posistion, quaternion) {
           return scope.Main.Camera.GetMVMatrixFormPosQuat(posistion,quaternion);
           //
       };


        /**
        * 현재 카메라 정보 설정
        * @param {*} cameraData 
        * @example
        * vizwide3d.View.CameraData camera = vizcore3d.View.GetCameraData();
        * vizwide3d.View.SetCameraData(camera);
        */
        this.SetCameraData = function (cameraData) {
            scope.Main.Camera.CameraUpdateWithCameraData(cameraData);
        };

        /**
        * 피벗 위치로 화면 중심이동
        * @param {Array.Number} matrix 카메라 매트릭스(Matrix)
        * @param {Number} zoom 카메라 Zoom
        * @example
        *
        * // VIZCore3D.NET
      
        * // float[] matrix = camera.Matrix;  * // VIZCore3D.NET.Data.CameraData camera = vizcore3d.View.GetCameraData();
        * // float zoom = camera.Zoom
        *
        * let matrix = [0.281377,0.488073,-0.826203,0,-0.959597,0.143115,-0.242262,0,0,0.860989,0.508623,0,-2949.6,-29019.27,19458.8,1];
        * let zoom = 1.161692;
        *
        * vizwide3d.View.SetCameraDataByMatrix(matrix, zoom);
        */
        this.SetCameraDataByMatrix = function (matrix, zoom) {
            let cameraMatrix = new VIZCore.Matrix4();
            cameraMatrix.elements = Array.from(matrix);

            if(zoom===undefined)
                zoom=scope.Main.Camera.zoom;    //기존 zoom 유지

            let info = {
                matrix_camera: cameraMatrix,
                zoom: zoom
            };

            scope.Main.Camera.SetSnapshotInfo(info);
        };


        /**
         * 
         * 카메라 이동        
         * @param {VIZCore.Enum.CameraDirection} camera 카메라 방향
         * @example
         * vizwide3d.View.MoveCamera(VIZCore.Enum.CameraDirection.ISO_PLUS);
         * vizwide3d.View.MoveCamera(VIZCore.Enum.CameraDirection.ISO_MINUS);
         * vizwide3d.View.MoveCamera(VIZCore.Enum.CameraDirection.X_PLUS);
         * vizwide3d.View.MoveCamera(VIZCore.Enum.CameraDirection.X_MINUS);
         * vizwide3d.View.MoveCamera(VIZCore.Enum.CameraDirection.Y_PLUS);
         * vizwide3d.View.MoveCamera(VIZCore.Enum.CameraDirection.Y_MINUS);
         * vizwide3d.View.MoveCamera(VIZCore.Enum.CameraDirection.Z_PLUS);
         * vizwide3d.View.MoveCamera(VIZCore.Enum.CameraDirection.Z_MINUS);
         */
        this.MoveCamera = function (camera) {
            switch (camera) {
                case VIZCore.Enum.CameraDirection.ISO_PLUS:
                    scope.Main.Camera.ViewISOPlus();
                    break;
                case VIZCore.Enum.CameraDirection.ISO_MINUS:
                    scope.Main.Camera.ViewISOMinus();
                    break;
                case VIZCore.Enum.CameraDirection.X_PLUS:
                    scope.Main.Camera.ViewRightElevation();
                    break;
                case VIZCore.Enum.CameraDirection.X_MINUS:
                    scope.Main.Camera.ViewLeftElevation();
                    break;
                case VIZCore.Enum.CameraDirection.Y_PLUS:
                    scope.Main.Camera.ViewBackSection();
                    break;
                case VIZCore.Enum.CameraDirection.Y_MINUS:
                    scope.Main.Camera.ViewFrontSection();
                    break;
                case VIZCore.Enum.CameraDirection.Z_PLUS:
                    scope.Main.Camera.ViewTopPlan();
                    break;
                case VIZCore.Enum.CameraDirection.Z_MINUS:
                    scope.Main.Camera.ViewBottomPlan();
                    break;
                case VIZCore.Enum.CameraDirection.ISO_RIGHTBACKTOP:
                    scope.Main.Camera.ViewISORightBackTop();
                    break;
                default:
                    break;
            }

        };

        /**
         * Camera 설정 (ISO+)
         */
        this.ViewISOPlus = function () {
            scope.Main.Camera.ViewISOPlus();
        };

        /**
         * Camera 설정 (ISO-)
         */
        this.ViewISOMinus = function () {
            scope.Main.Camera.ViewISOMinus();
        };

        /**
         * Camera 설정 (+x)
         * @example
         * vizwide3d.View.ViewRightElevation();
         */
        this.ViewRightElevation = function () {
            scope.Main.Camera.ViewRightElevation();
        };

        /**
         * Camera 설정 (-x)
         * @example
         * vizwide3d.View.ViewLeftElevation();
         */
        this.ViewLeftElevation = function () {
            scope.Main.Camera.ViewLeftElevation();
        };

        /**
         * Camera 설정 (+y)
         * @example
         * vizwide3d.View.ViewBackSection();
         */
        this.ViewBackSection = function () {
            scope.Main.Camera.ViewBackSection();
        };

        /**
       * Camera 설정 (-y)
       * @example
       * vizwide3d.View.ViewFrontSection();
       */
        this.ViewFrontSection = function () {
            scope.Main.Camera.ViewFrontSection();
        };

        /**
        * Camera 설정 (+z)
        * @example
        * vizwide3d.View.ViewTopPlan();
        */
        this.ViewTopPlan = function () {
            scope.Main.Camera.ViewTopPlan();
        };

        /**
       * Camera 설정 (-z)
       * @example
       * vizwide3d.View.ViewBottomPlan();
       */
        this.ViewBottomPlan = function () {
            scope.Main.Camera.ViewBottomPlan();
        };

        /**
         * Camera 설정 (-x -y -z)
         * @example
         * vizwide3d.View.ViewISOLeftFrontBottom();
         */
        this.ViewISOLeftFrontBottom = function () {
            scope.Main.Camera.ViewISOLeftFrontBottom();
        };

        /**
         * Camera 설정 (-x -y +z)
         * @example
         * vizwide3d.View.ViewISOLeftFrontTop();
         */
        this.ViewISOLeftFrontTop = function () {
            scope.Main.Camera.ViewISOLeftFrontTop();
        };

        /**
         * Camera 설정 (-x +y -z)
         * @example
         * vizwide3d.View.ViewISOLeftBackBottom();
         */
        this.ViewISOLeftBackBottom = function () {
            scope.Main.Camera.ViewISOLeftBackBottom();
        };
        /**
         * Camera 설정 (-x +y +z)
         * @example
         * vizwide3d.View.ViewISOLeftBackTop();
         */
        this.ViewISOLeftBackTop = function () {
            scope.Main.Camera.ViewISOLeftBackTop();
        };
        /**
         * Camera 설정 (+x -y -z)
         * @example
         * vizwide3d.View.ViewISORightFrontBottom();
         */
        this.ViewISORightFrontBottom = function () {
            scope.Main.Camera.ViewISORightFrontBottom();
        };
        /**
         * Camera 설정 (+x -y +z)
         * @example
         * vizwide3d.View.ViewISORightFrontTop();
         */
        this.ViewISORightFrontTop = function () {
            scope.Main.Camera.ViewISORightFrontTop();
        };

        /**
         * Camera 설정 (+x +y -z)
         * @example
         * vizwide3d.View.ViewISORightBackBottom();
         */
        this.ViewISORightBackBottom = function () {
            scope.Main.Camera.ViewISORightBackBottom();
        };

        /**
         * Camera 설정 (+x +y +z)
         * @example
         * vizwide3d.View.ViewISORightBackTop();
         */
        this.ViewISORightBackTop = function () {
            scope.Main.Camera.ViewISORightBackTop();
        };

        /**
         * Camera 설정 (-x -y)
         * @example
         * vizwide3d.View.ViewLeftFrontSide();
         */
        this.ViewLeftFrontSide = function () {
            scope.Main.Camera.ViewLeftFrontSide();
        };

        /**
         * Camera 설정 (-x +y)
         * @example
         * vizwide3d.View.ViewLeftBackSide();
         */
        this.ViewLeftBackSide = function () {
            scope.Main.Camera.ViewLeftBackSide();
        };

        /**
         * Camera 설정 (-x -z)
         * @example
         * vizwide3d.View.ViewLeftBottomSide();
         */
        this.ViewLeftBottomSide = function () {
            scope.Main.Camera.ViewLeftBottomSide();
        };

        /**
         * Camera 설정 (-x +z)
         * @example
         * vizwide3d.View.ViewLeftTopSide();
         */
        this.ViewLeftTopSide = function () {
            scope.Main.Camera.ViewLeftTopSide();
        };

        /**
         * Camera 설정 (+x -y)
         * @example
         * vizwide3d.View.ViewRightFrontSide();
         */
        this.ViewRightFrontSide = function () {
            scope.Main.Camera.ViewRightFrontSide();
        };

        /**
         * Camera 설정 (+x +y)
         * @example
         * vizwide3d.View.ViewRightBackSide();
         */
        this.ViewRightBackSide = function () {
            scope.Main.Camera.ViewRightBackSide();
        };
        /**
         * Camera 설정 (+x -z)
         * @example
         * vizwide3d.View.ViewRightBottomSide();
         */
        this.ViewRightBottomSide = function () {
            scope.Main.Camera.ViewRightBottomSide();
        };
        /**
         * Camera 설정 (+x +z)
         * @example
         * vizwide3d.View.ViewRightTopSide();
         */
        this.ViewRightTopSide = function () {
            scope.Main.Camera.ViewRightTopSide();
        };
        /**
         * Camera 설정 (-y -z)
         * @example
         * vizwide3d.View.ViewFrontBottomSide();
         */
        this.ViewFrontBottomSide = function () {
            scope.Main.Camera.ViewFrontBottomSide();
        };
        /**
         * Camera 설정 (-y +z)
         * @example
         * vizwide3d.View.ViewFrontTopSide();
         */
        this.ViewFrontTopSide = function () {
            scope.Main.Camera.ViewFrontTopSide();
        };
        /**
        * Camera 설정 (+y -z)
        * @example
        * vizwide3d.View.ViewBackBottomSide();
        */
        this.ViewBackBottomSide = function () {
            scope.Main.Camera.ViewBackBottomSide();
        };
        /**
         * Camera 설정 (+y +z)
         * @example
         * vizwide3d.View.ViewBackTopSide();
         */
        this.ViewBackTopSide = function () {
            scope.Main.Camera.ViewBackTopSide();
        };

        /**
        * 마우스 휠 이벤트 정보 등록
        * @param {Event} event 마우스 휠 이벤트
        * @example
        * document
        *   .getElementById("view")
        *   .addEventListener("mousewheel", function (e) {
        *       vizwide3d.View.SetMouseWheelEvent(e);
        *   });
        */
        this.SetMouseWheelEvent = function (event) {
            scope.Main.Control.MouseWheel(event);
        };

        /**
        * Projection (원근, 평행) 모드 설정
        * @param {VIZCore.Enum.PROJECTION_MODES} projection 원근/평행 모드
        * @example
        * vizwide3d.View.SetProjection(VIZCore.Enum.PROJECTION_MODES.Orthographic); // 평행
        * vizwide3d.View.SetProjection(VIZCore.Enum.PROJECTION_MODES.Perspective);  // 원근
        */
        this.SetProjection = function (projection) {
            if (projection === VIZCore.Enum.PROJECTION_MODES.Orthographic)
                scope.Main.Camera.SetPerspectiveView(false);

            else
                scope.Main.Camera.SetPerspectiveView(true);
        };


        /**
        * Directional Light 정보 반환
        * @return {view.Data.LightItem} 빛 정보 반환
        * @example
        * let lightInfo = vizwide3d.View.GetDirectionalLight();
        * lightInfo.Color.set(255, 0, 0, 255); //빛 색상 변경
        * lightInfo.Power = 2;     //빛 세기 설정
        */
        this.GetDirectionalLight = function () {
            return scope.Main.Shader.GetDirectionalLight();
        };

        /**
         * 카메라 방향에 따른 빛 방향 업데이트
         * @param {Boolean} enable true : 빛 방향 갱신, false : 방향 고정
         */
        this.SetEnableViewLightRotate = function (enable) {
            scope.Main.Shader.ViewLightAsRotate = enable;
        };

        /**
         * 카메라 방향에 따른 빛 방향 업데이트 반환
         * @returns {Boolean} true : 빛 방향 갱신, false : 방향 고정
         */
        this.IsEnableViewLightRotate = function () {
            return scope.Main.Shader.ViewLightAsRotate;
        };

        /**
         * 빛 방향 반환
         * @returns {VIZCore.Vector3} 빛 방향
         */
        this.GetLightDirection = function () {
            return scope.Main.Shader.GetLightDirection();
        };


        /**
         * 빛 방향 설정
         * @param {VIZCore.Vector3} direction 빛 방향
         */
        this.SetLightDirection = function (direction) {
            scope.Main.Shader.SetLightDirection(direction);
        };

        /**
         * 빛 색상 설정
         * @param {VIZCore.Color} color 빛 색상
         */
        this.SetLightColor = function (color) {
            scope.Main.Shader.SetLightColor(color);
        };


        /**
         * Ambient 설정
         * @param {VIZCore.Color} color Ambient 색상
         */
        this.SetAmbientColor = function (color) {
            scope.Main.Shader.SetAmbientColor(color);
        };


        /**
       * 지정된 시간의 빛 방향 설정
       * @param {Number} time 시간 (6 ~ 18)
       */
        this.SetLightTime = function (time) {
            scope.Main.Shader.SetLightTime(time);
        };

        /**
         * 3D World 좌표계를 2D 좌표(화면 좌표) 반환
         * @param {Number} x X 좌표
         * @param {Number} y Y 좌표
         * @param {Number} z Z 좌표
         */
        this.WorldToScreen = function (x, y, z) {
            let matMVP = new VIZCore.Matrix4().copy(scope.Main.Camera.matMVP);
            let pos3D = new VIZCore.Vector3(x, y, z);
            let pos2D = scope.Main.Camera.world2ScreenWithMatrix(matMVP, pos3D);
            return pos2D;
        };

        /**
         * 3D World 좌표계를 2D 좌표(화면 좌표) 반환
         * @param {VIZCore.Vector3} world World 좌표
         */
        this.WorldToScreenByVector3 = function (world) {
            let matMVP = new VIZCore.Matrix4().copy(scope.Main.Camera.matMVP);
            let pos3D = new VIZCore.Vector3(world.x, world.y, world.z);
            let pos2D = scope.Main.Camera.world2ScreenWithMatrix(matMVP, pos3D);
            return pos2D;
        };


        /**
         * 2D 좌표(화면 좌표)계를 3D World 좌표계로 반환
         * @param {Number} x X 좌표
         * @param {Number} y Y 좌표
         * @param {Number} z Z 좌표
         */
        this.ScreenToWorld = function (x, y, z) {
            let matMVP = new VIZCore.Matrix4().copy(scope.Main.Camera.matMVP);
            let pos2D = new VIZCore.Vector3(x, y, z);
            let pos3D = scope.Main.Camera.screen2WorldWithMatrix(matMVP, pos2D);
            return pos3D;
        };

        /**
         * 2D 좌표(화면 좌표)계를 3D World 좌표계로 반환
         * @param {VIZCore.Vector3} screen Screen 좌표
         */
        this.ScreenToWorldByVector3 = function (screen) {
            let matMVP = new VIZCore.Matrix4().copy(scope.Main.Camera.matMVP);
            let pos2D = new VIZCore.Vector3(screen.x, screen.y, screen.z);
            let pos3D = scope.Main.Camera.screen2WorldWithMatrix(matMVP, pos2D);
            return pos3D;
        };

        /**
         * 현재 화면의 이미지 데이터 반환
         * @param {boolean} bIncludeReview 리뷰 정보 포함 여부(측정, 노트, 그리기, 그리드 정보)
         * @return {String} 이미지 데이터 (base64)
         * @example
         * let img = new Image();
         * let bIncludeReview = true; // 리뷰 정보 이미지에 포함
         * img.src = vizwide3d.View.GetCurrentImage(bIncludeReview);
         * img.style.objectfit = "contain";
         * var w = window.open('', '');
         * w.document.title = "Snapshot";
         * w.document.body.appendChild(img);  
         */
        this.GetCurrentImage = function (bIncludeReview, backColor1, backColor2) {

            let colorObj = scope.Main.Renderer.GetBackColor();
            let bChangeBackColor = false;
            if (backColor1 !== undefined && backColor2 !== undefined) {
                let color1 = new VIZCore.Color();
                let color2 = new VIZCore.Color();
                color1.r = backColor1.r;
                color1.g = backColor1.g;
                color1.b = backColor1.b;

                color2.r = backColor2.r;
                color2.g = backColor2.g;
                color2.b = backColor2.b;

                scope.Main.Renderer.SetBackColor(color1, color2, true);
                scope.Main.Renderer.Renderer.MainFBClear(false);
                scope.Main.Renderer.Renderer();
                bChangeBackColor = true;
            }

            let imgObj = scope.Main.Renderer.GetImageDataFromBuffer(VIZCore.Enum.FB_RENDER_TYPES.END);
            //let imgObj = scope.Main.Renderer.GetImageDataFromBuffer(VIZCore.Enum.FB_RENDER_TYPES.MAIN);
            let canv = document.createElement('canvas');
            canv.id = 'canvasbuffer'; // gives canvas id
            canv.width = imgObj.width;
            canv.height = imgObj.height;
            let context = canv.getContext('2d');
            context.imageSmoothingEnabled = false;
            let imageData = context.createImageData(imgObj.width, imgObj.height);
            imageData.data.set(imgObj.data);
            context.putImageData(imageData, 0, 0);

            if (bIncludeReview) {
                let canvas_review = scope.Main.Canvas_Review;
                context.drawImage(canvas_review, 0, 0, canv.width, canv.height);
            }

            if (bChangeBackColor) {
                scope.Main.Renderer.SetBackColor(colorObj.bg1Color, colorObj.bg2Color, true);
                scope.Main.Renderer.MainFBClear(false);
                scope.Main.Renderer.Renderer();
            }

            return canv.toDataURL();
        };


        /**
         * 선택 객체 색상 설정
         * @param {VIZCore.Color} color 
         * @example
         * vizwide3d.View.SetSelectionColor(new VIZCore.Color(255,255,0,255));
         */
        this.SetSelectionColor = function (color) {
            scope.Main.Configuration.Model.Selection.Color = color;
        };

        /**
         * 선택 객체 선 색상 설정
         * @param {VIZCore.Color} color 
         * @example
         * vizwide3d.View.SetSelectionLineColor(new VIZCore.Color(255,255,0,255));
         */
        this.SetSelectionLineColor = function (color) {
            scope.Main.Configuration.Model.Selection.LineColor = color;
        };

        /**
         * 회전 중심(Pivot) 위치 설정
         * @param {VIZCore.Vector3} position 
         * @example
         * function example1() {
         *      //Pivot 위치 설정
         *      vizwide3d.View.SetPivotPosition(new VIZCore.Vector3(100, 0, 0));
         * }
         * 
         * function example2() {
         *      //위치 설정 잠금해제
         *      vizwide3d.View.UnlockPivot();
         *      //Pivot 위치 설정
         *      vizwide3d.View.SetPivotPosition(new VIZCore.Vector3(100, 0, 0));
         *      //위치 설정 잠금
         *      vizwide3d.View.LockPivot();
         * }
         */
        this.SetPivotPosition = function (position) {            
            scope.Main.Camera.SetPivot(position);
        };

        /**
         * 회전 중심(Pivot) 가시화 여부
         * @param {boolean} visible 
         * @example
         * vizwide3d.View.SetPivotVisible(true);  // Show
         * vizwide3d.View.SetPivotVisible(false); // Hide
         */
        this.SetPivotVisible = function (visible) {
            scope.Main.Configuration.Render.Pivot.Visible = visible;
        };

        /**
         *  회전 중심(Pivot) 위치설정 잠금
         */
        this.LockPivot = function () {
            scope.Main.Camera.lockPivot = true;
        };

        /**
        *  회전 중심(Pivot) 위치설정 잠금해제
        */
        this.UnlockPivot = function () {
            scope.Main.Camera.lockPivot = false;
        };

        /**
         * 회전 중심(Pivot) 위치설정 잠금여부 반환
         */
        this.GetPivotLock = function () {
            return scope.Main.Camera.lockPivot;
        };

        /**
         * 화면 기준 1Pixel당 거리 반환
         * @param {VIZCore.Vector3} pos 기준 좌표
         */
        this.GetScreen1PixelLength = function (pos) {
            return scope.Main.Camera.GetScreen1PixelLength(pos);
        }

        //=======================================
        // Event
        //=======================================
        /**
         *  View Default Mouse Down Event
         * @param {Object} listener Event Listener
         * @example
         * // Add Event Handler : Mouse Down (마우스 다운 이벤트)
         * vizwide3d.View.OnViewDefaultMouseDownEvent(OnViewDefaultMouseDown);
         *
         * //=======================================
         * // Event :: OnViewDefaultMouseDownEvent
         * //=======================================
         * let OnViewDefaultMouseDown = function (event) {
         *      console.log(event);
         * }
         */
        this.OnViewDefaultMouseDownEvent = function (listener) {
            scope.Main.EventHandler.addEventListener(VIZCore.Enum.EVENT_TYPES.Mouse.Down, listener);
        };


        /**
         *  View Default Mouse Up Event
         * @param {Object} listener Event Listener
         * @example
         * // Add Event Handler : Mouse Up (마우스 업 이벤트)
         * vizwide3d.View.OnViewDefaultMouseUpEvent(OnViewDefaultMouseUp);
         *
         * //=======================================
         * // Event :: OnViewDefaultMouseUpEvent
         * //=======================================
         * let OnViewDefaultMouseUp = function (event) {
         *      console.log(event);
         * }
         */
        this.OnViewDefaultMouseUpEvent = function (listener) {
            scope.Main.EventHandler.addEventListener(VIZCore.Enum.EVENT_TYPES.Mouse.Up, listener);
        };
        /**
         *  View Default Mouse Move Event
         * @param {Object} listener Event Listener
         * @example
         * // Add Event Handler : Mouse Up (마우스 이동 이벤트)
         * vizwide3d.View.OnViewDefaultMouseMoveEvent(OnViewDefaultMouseMove);
         *
         * //=======================================
         * // Event :: OnViewDefaultMouseMoveEvent
         * //=======================================
         * let OnViewDefaultMouseMove = function (event) {
         *      console.log(event);
         * }
         */
        this.OnViewDefaultMouseMoveEvent = function (listener) {
            scope.Main.EventHandler.addEventListener(VIZCore.Enum.EVENT_TYPES.Mouse.Move, listener);
        };
        /**
         *  View Default Mouse Wheel Event
         * @param {Object} listener Event Listener
         * @example
         * // Add Event Handler : Mouse Wheel (마우스 휠 이벤트)
         * vizwide3d.View.OnViewDefaultMouseWheelEvent(OnViewDefaultMouseWheel);
         *
         * //=======================================
         * // Event :: OnViewDefaultMouseWheelEvent
         * //=======================================
         * let OnViewDefaultMouseWheel = function (event) {
         *      console.log(event);
         * }
         */
        this.OnViewDefaultMouseWheelEvent = function (listener) {
            scope.Main.EventHandler.addEventListener(VIZCore.Enum.EVENT_TYPES.Mouse.Wheel, listener);
        };

        /**
         *  View Default Mouse DoubleClick Event
         * @param {Object} listener Event Listener
         * @example
         * // Add Event Handler : Mouse DoubleClick (마우스 더블클릭 이벤트)
         * vizwide3d.View.OnViewDefaultMouseDoubleClickEvent(OnViewDefaultMouseDoubleClick);
         *
         * //=======================================
         * // Event :: OnViewDefaultMouseDoubleClickEvent
         * //=======================================
         * let OnViewDefaultMouseDoubleClick = function (event) {
         *      console.log(event);
         * }
         */
        this.OnViewDefaultMouseDoubleClickEvent = function (listener) {
            scope.Main.EventHandler.addEventListener(VIZCore.Enum.EVENT_TYPES.Mouse.DbClick, listener);
        };

        /**
         *  View Default KeyUp Event
         * @param {Object} listener Event Listener
         * @example
         * // Add Event Handler : KeyUp (키업 이벤트)
         * vizwide3d.View.OnViewDefaultKeyUpEvent(onViewDefaultKeyUpEvent);
         *
         * //=======================================
         * // Event :: onViewDefaultKeyUpEvent
         * //=======================================
         * let onViewDefaultKeyUpEvent = function (event) {
         *      console.log(event);
         * }
         */
        this.OnViewDefaultKeyUpEvent = function (listener) {
            scope.Main.EventHandler.addEventListener(VIZCore.Enum.EVENT_TYPES.Keyboard.Up, listener);
        };

        /**
         *  View Default ContextMenu Event
         * @param {Object} listener Event Listener
         * @example
         * // Add Event Handler : ContextMenu
         * vizwide3d.View.OnViewDefaultContextMenuEvent(OnViewDefaultContextMenu);
         *
         * //=======================================
         * // Event :: OnViewDefaultContextMenuEvent
         * //=======================================
         * let OnViewDefaultContextMenu = function (event) {
         *      console.log(event);
         * }
         */
        this.OnViewDefaultContextMenuEvent = function (listener) {
            scope.Main.EventHandler.addEventListener(VIZCore.Enum.EVENT_TYPES.Mouse.ContextMenu, listener);
        };

        /**
         * 카메라 변경 이벤트 등록
         * @param {Object} listener Event Listener
         * @example
         * // Add Event Handler : Camera Changed Event (카메라 변경 이벤트)
         * vizwide3d.View.OnCameraStateChangedEvent(onCameraChangedEvent);
         *
         * //=======================================
         * // Event :: OnCameraStateChangedEvent
         * //=======================================
         * let onCameraChangedEvent = function (event) {
         * }
         */
        this.OnCameraStateChangedEvent = function (listener) {
            scope.Main.EventHandler.addEventListener(VIZCore.Enum.EVENT_TYPES.Control.Changed, listener);
        };

        /**
         * Empty MeshBlock 이벤트 등록
         * @param {Object} listener Event Listener
         * @example
         * // Add Event Handler : Empty MeshBlock Event (빈 메시 블록 파일 이벤트)
         * vizwide3d.View.OnEmptyMeshBlockEvent(onEmptyMeshBlockEvent);
         *
         * //=======================================
         * // Event :: OnEmptyMeshBlockEvent
         * //=======================================
         * let onEmptyMeshBlockEvent = function (event) {
         * }
         */
        this.OnEmptyMeshBlockEvent = function (listener) {
            scope.Main.EventHandler.addEventListener(VIZCore.Enum.EVENT_TYPES.View.Alert_EmptyMeshBlock, listener);
        };


        /**
         *  View DrawInfo Event
         * @param {Object} listener Event Listener
         * @example
         * // Add Event Handler : DrawInfo (그리기 상태에 대한 정보 반환)
         * vizwide3d.View.OnViewDrawInfoEvent(OnViewDrawInfo);
         *
         * //=======================================
         * // Event :: OnViewDrawInfoEvent
         * //=======================================
         * let OnViewDrawInfo = function (event) {
         *      console.log(event);
         * }
         */
        this.OnViewDrawInfoEvent = function (listener) {
            scope.Main.EventHandler.addEventListener(VIZCore.Enum.EVENT_TYPES.View.DrawInfo, listener);
        };

        //=======================================
        // Event
        //=======================================
        /**
         * 개체 선택 이벤트 등록
         * @param {Object} listener Event Listener
         * @example
         * // Add Event Handler : 관리 객체 선택 이벤트 
         * vizwide3d.View.OnSelectedEvent(callback);
         *
         * //=======================================
         * // Event :: OnSelectedEvent
         * //=======================================
         * let callback = function (param) {
         *     // 선택 개체 타입
         *     console.log("선택 개체 타입 :: ", param.data.type);
         *     // 선택 이벤트 원형 : Mouse, Touch
         *     console.log("선택 이벤트 :: ",param.data.event);
         *     // 선택 개체 정보
         *     console.log("선택 개체 정보 :: ",param.data.info);
         * }
         */
        this.OnSelectedEvent = function (listener) {
            scope.Main.EventHandler.addEventListener(VIZCore.Enum.EVENT_TYPES.Object.Selected, listener);
        };
    }
}

export default View;