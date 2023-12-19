/**
 * VIZCore View 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
class Xray {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;

        //=======================================
        // Method
        //=======================================
        /**
         * Xray 모드 활성화/비활성화
         * @param {boolean} enable 활성화/비활성화
         * @example
         * vizwide3d.View.Xray.Enable(true);
         */
        this.Enable = function (enable) {
            if(enable)
                scope.Main.Renderer.SetRenderMode(VIZCore.Enum.RENDER_MODES.Xray);
            else
                scope.Main.Renderer.SetRenderMode(VIZCore.Enum.RENDER_MODES.Smooth);
        };

        /**
         * Xray 모드 지정 모델 선택 및 색상 표현
         * @param {Array} ids Body ID 목록
         * @param {Boolean} selection 선택 가능 여부 및 색상 표현
         * @example
         * let nodes = vizwide3d.Object3D.Find.GetNodeByName(
         *         '배관_지하매설물.nwd'   // Keyword
         *         , true      // Full Match
         *         );
         *        
         * let bodies = vizwide3d.Object3D.GetBodiesByNode(nodes);
         * 
         * let ids = [];
         * for (let i = 0; i < bodies.length; i++) {
         *     ids.push(bodies[i].bodyId);
         * }
         * vizwide3d.View.Xray.Select(ids, true);
         */
        this.Select = function (ids, selection){
            if(selection)
                scope.Main.Data.SetObjectCustomColor(ids, undefined);
            else
                scope.Main.Data.ClearObjectCustomColor(ids);
        };

         /**
         * Xray 모드 지정 모델 색상 표현
         * @param {Array} ids Body ID 목록 : undefined(전체 해제) / Array(지정 해제)
         * @example
         * let nodes = vizwide3d.Object3D.Find.GetNodeByName(
         *         '배관_지하매설물.nwd'   // Keyword
         *         , true      // Full Match
         *         );
         *        
         * let bodies = vizwide3d.Object3D.GetBodiesByNode(nodes);
         * 
         * let ids = [];
         * for (let i = 0; i < bodies.length; i++) {
         *     ids.push(bodies[i].bodyId);
         * }
         * vizwide3d.View.Xray.Clear(ids);
         */
        this.Clear = function (ids){
            scope.Main.Data.ClearObjectCustomColor(ids);
        };


        //=======================================
        // Event
        //=======================================
    }
}

export default Xray;