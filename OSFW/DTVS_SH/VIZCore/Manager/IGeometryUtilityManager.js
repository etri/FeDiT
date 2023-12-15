/**
 * VIZCore Geometry Utility 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @param {Object} object3d Object3D Instance
 * @class
 */
class GeometryUtility {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;

        //=======================================
        // Method
        //=======================================

        
        /**
         * 오스냅(Osnap) 기능 사용
         * @param {Function} cbCallback 
         * @param {Boolean} surface : 면 선택 가능 여부 (좌표 및 normal 반환)
         * @param {Boolean} vertex : preselect 정점 가능 여부 (좌표 반환)
         * @param {Boolean} line : preselect 라인 가능 여부 (라인 좌표 반환)
         * @example
         * 
         * let pickCallback = function(e) {
         *      console.log(e);
         * };
         * 
         * vizwide3d.GeometryUtility.ShowOsnap(pickCallback, true, false, false);
         */
        this.ShowOsnap = function (cbCallback, surface, vertex, line) {
            scope.Main.Mode.ShowOsnap(cbCallback, 0, surface, vertex, line);
        };

        /**
         * 오스냅(Osnap) 기능 사용 (모델 개체만 선택 가능)
         * @param {Function} cbCallback 
         * @param {Boolean} surface : 면 선택 가능 여부 (좌표 및 normal 반환)
         * @param {Boolean} vertex : preselect 정점 가능 여부 (좌표 반환)
         * @param {Boolean} line : preselect 라인 가능 여부 (라인 좌표 반환)
         * @example
         * 
         * let pickCallback = function(e) {
         *      console.log(e);
         * };
         * 
         * vizwide3d.GeometryUtility.ShowOsnap(pickCallback, true, false, false);
         */
        this.ShowOsnapByOnlyModel = function (cbCallback, surface, vertex, line) {
            scope.Main.Mode.ShowOsnap(cbCallback, 1, surface, vertex, line);
        };

        /**
         * 오스냅(Osnap) 기능 사용 (ShapeDrawing 개체만 선택 가능)
         * @param {Function} cbCallback 
         * @param {Boolean} surface : 면 선택 가능 여부 (좌표 및 normal 반환)
         * @param {Boolean} vertex : preselect 정점 가능 여부 (좌표 반환)
         * @param {Boolean} line : preselect 라인 가능 여부 (라인 좌표 반환)
         * @example
         * 
         * let pickCallback = function(e) {
         *      console.log(e);
         * };
         * 
         * vizwide3d.GeometryUtility.ShowOsnap(pickCallback, true, false, false);
         */
        this.ShowOsnapByOnlyShapeDrawing = function (cbCallback, surface, vertex, line) {
            scope.Main.Mode.ShowOsnap(cbCallback, 2, surface, vertex, line);
        };

        //=======================================
        // Event
        //=======================================
    }
}

export default GeometryUtility;