/**
 * VIZCore Configuration 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
class Configuration {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;

        //=======================================
        // Method
        //=======================================
        /**
         * 마우스 컨트롤(Zoom, Rotate, Pan) 활성화/비활성화
         * @param {Boolean} lock 활성화/비활성화
         * @example
         *  // 마우스 컨트롤 제어
         *  vizwide3d.Configuration.LockControl(true);
         */
        this.LockControl = function(lock){
            scope.Main.Configuration.Control.Lock = lock;
        };
        
        /**
         * 선택 가시화 변경(음영, 경계로 선택)
         * @param {VIZCore.Enum.SelectionVisibleMode} mode 선택 유형
         * @example
         *  // 선택 유형 변경
         *  // VIZCore.Enum.SelectionVisibleMode.SHADED : 음영 선택
         *  // VIZCore.Enum.SelectionVisibleMode.BOUNDBOX : 경계로 선택
         * 
         *  // 경계로 선택 적용
         *  vizwide3d.Configuration.Object3DSelectionOption(VIZCore.Enum.SelectionVisibleMode.BOUNDBOX);
         */
        this.Object3DSelectionOption = function(mode){
            scope.Main.Configuration.Model.Selection.Mode = mode;
        };

        //=======================================
        // Event
        //=======================================

    }
}

export default Configuration;