/**
 * VIZCore View 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
class IMultiCamera {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;

        //=======================================
        // Method
        //=======================================


        /**
         * 카메라 그리기 활성화 설정
         *  메인 화면 (CameraID = 0) 적용 가능
         * @param {Number} cameraID : Camera Index
         * @param {Boolean} enable : 그리기 사용 여부
         */
        this.Enable = function (cameraID, enable) {
            let idx = scope.Main.Mode.GetCameraIndex(cameraID);
            if(idx < 0) return;
            scope.Main.MultiView[idx].Show(enable);
        };

        /**
         * 신규 카메라 생성
         * @param {*} element 
         * @returns {Number} cameraID
         * @example
         *  let multiView = document.getElementById("multiView");
         *  multiView.className = "VIZCore_Multi";
         *  let addCanvas = document.createElement('canvas');
         *  addCanvas.id = "addCanvas_canvas_view";
         *  addCanvas.className = "canvas_view";
         *  viewDual.appendChild(addCanvas); 
         *  const addcanvasElement = document.getElementById(addCanvas.id);
         * 
         *  //멀티뷰 생성 
         *  // CaemraID 반환
         *  let addView = vizwide3d.View.MultiCamera.Add(addcanvasElement);
         * 
         *  // 멀티뷰 그리기 활성화 설정
         *  vizwide3d.View.MultiCamera.Enable(addView, true);
         * 
         *  // 제거
         *  //vizwide3d.View.MultiCamera.Remove(addView);
         */
        this.Add = function (element) {
            let cameraID = scope.Main.Mode.AddCamera(element);
            return cameraID;
        };

        /**
         * 카메라 제거
         * 메인 화면 (CameraID = 0)은 제거불가
         * @param {Number} cameraID 
         */
        this.Remove = function (cameraID) {
            let idx = scope.Main.Mode.GetCameraIndex(cameraID);
            scope.Main.Mode.RemoveCamera(idx);            
        }

        
        
        /**
         * 카메라 캔버스 색상 설정
         * @param {Number} cameraID : Camera Index
         * @param {VIZCore.Color} color
         */
        this.SetCanvasColor = function(cameraID, color) {
            let idx = scope.Main.Mode.GetCameraIndex(cameraID);
            if(idx < 0) return;
            scope.Main.MultiView[idx].SetBGColor(true, color);
        };

        /**
         * 메인 카메라와 동일한 색상으로 설정
         * @param {Number} cameraID : Camera Index
         */
        this.ClearCanvasColor = function(cameraID) {
            let idx = scope.Main.Mode.GetCameraIndex(cameraID);
            if(idx < 0) return;
            
            scope.Main.MultiView[idx].SetBGColor(false);
        };

        

        //=======================================
        // Event
        //=======================================
    }
}

export default IMultiCamera;