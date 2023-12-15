import IShapeDrawingColor from "./IShapeDrawingColorManager.js";
import IMaterial from "./IMaterialManager.js";

/**
 * VIZCore ShapeDrawing Manager 인터페이스
 * @copyright © 2013 - 2022 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
class ShapeDrawingManager {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;
        
        scope.Color = new IShapeDrawingColor(main, VIZCore);
        scope.Material = new IMaterial(main, VIZCore, this);

        //=======================================
        // Method
        //=======================================


        /**
         * 개체 삭제
         * @param {*} ID 개체 ID
         * @example
         * vizwide3d.ShapeDrawing.Delete(10);
         */
        this.Delete = function (ID) {
            scope.Main.CustomObject.DeleteObject(ID);
            scope.Main.ViewRefresh();
        };

        /**
         * 개체 전체 삭제
         * @example
         * vizwide3d.ShapeDrawing.Clear();
         */
        this.Clear = function () {
            scope.Main.CustomObject.Clear();
            scope.Main.ViewRefresh();
        };


        /**
         * 개체 보이기/숨기기
         * @param {Array<*>} ID 개체 ID
         * @param {Boolean} visible 보이기/숨기기
         * @example
         * vizwide3d.ShapeDrawing.Show(10, true);
         */
        this.Show = function(ID, visible) {
            scope.Main.CustomObject.Show(ID, visible);

            //scope.Main.ViewRefresh();
        };

        /**
         * 개체 선택
         * @param {Array<*>} ID 개체 ID
         * @param {Boolean} selection 선택
         * @example
         * vizwide3d.ShapeDrawing.Select(10, true);
         */
        this.Select = function (ID, selection) {
            scope.Main.CustomObject.Select(ID, selection);

        };

        /**
         * 개체 선택 가능 설정
         * @param {Array<*>} ID 개체 ID
         * @param {Boolean} enable 선택 가능여부 (true = 선택가능, false = 불가능)
         * @example
         * vizwide3d.ShapeDrawing.EnableUseSelection(10, true);
         */
        this.EnableUseSelection = function (ID, enable) {
            scope.Main.CustomObject.EnableUseSelection(ID, enable);

        };

        /**
         * 평판 생성
         * @param {VIZCore.Vector3} center 중심 위치
         * @param {VIZCore.Vector3} normal 방향
         * @param {float} widht 너비
         * @param {float} length 길이
         * @param {VIZCore.Color} color color
         * @returns ID
         */
        this.AddPanel = function (center, normal, width, length, color) {
            let customObj = scope.Main.Data.CustomObjectData();
            let custom = scope.Main.CustomObject.CustomObject_Panel(center, normal, width, length, color);
            customObj.object.push(custom);
            scope.Main.CustomObject.AddObject(customObj);

            scope.Main.ViewRefresh();
            return customObj.uuid;
        };

        /**
         * Box 생성
         * @param {VIZCore.Vector3} v1 min 좌표
         * @param {VIZCore.Vector3} v2 max 좌표
         * @param {VIZCore.Color} color Color
         * @returns ID
         * @example
         * 
         * function exampleAddBox() {
         *      let v1 = new VIZCore.Vector3();
         *      let v2 = new VIZCore.Vector3(10.0, 0.0, 0.0);
         *      let color = new VIZCore.Color(255, 255, 0, 255);
         *      let itemID = vizwide3d.ShapeDrawing.AddBox(v1, v2, color);
         * }
         */
        this.AddBox = function(v1, v2, color) {
            let bbox = new VIZCore.BBox();
            bbox.min.copy(v1);
            bbox.max.copy(v1);
            bbox.min.min(v2);
            bbox.max.max(v2);
            bbox.update();

            return scope.AddBoxByBox(bbox, color);
        };

        /**
         * Box 생성
         * @param {VIZCore.BBox} bbox : boundbox
         * @param {VIZCore.Color} color Color
         * @returns ID
         * @example
         * 
         * function exampleAddBoxByBox() {
         *      let bbox = new VIZCore.BBox();
         *      let color = new VIZCore.Color(255, 255, 0, 255);
         *      let itemID = vizwide3d.ShapeDrawing.AddBoxByBox(bbox, color);
         * }
         */
        this.AddBoxByBox = function(bbox, color) {
            let customObj = scope.Main.Data.CustomObjectData();
            let custom = scope.Main.CustomObject.CustomObject_Box3DByBoundBox(bbox, color);
            customObj.object.push(custom);
            scope.Main.CustomObject.AddObject(customObj);

            scope.Main.ViewRefresh();
            return customObj.uuid;
        };

        /**
         * Cylinder 생성
         * @param {VIZCore.Vector3} v1 좌표1
         * @param {VIZCore.Vector3} v2 좌표2
         * @param {Number} radius Cylinder Radius
         * @param {VIZCore.Color} color Color
         * @returns {Number} ID
         * @example
         *   
         * function exampleAddCylinder() {
         *      let v1 = new VIZCore.Vector3();
         *      let v2 = new VIZCore.Vector3(10.0, 0.0, 0.0);
         *      let fRadius = 5.0;
         *      let color = new VIZCore.Color(255, 255, 0, 255);
         *      let itemID = vizwide3d.ShapeDrawing.AddCylinder(v1, v2, fRadius, color);
         * }
         */
        this.AddCylinder = function (v1, v2, radius, color) {
            
            let customObj = scope.Main.Data.CustomObjectData();

            let custom = scope.Main.CustomObject.CustomObject_Cylinder(v1, v2, radius, color);

            customObj.object.push(custom);
            scope.Main.CustomObject.AddObject(customObj);

            scope.Main.ViewRefresh();

            return customObj.uuid;
        };
        

        //=======================================
        // Event
        //=======================================
    }
}

export default ShapeDrawingManager;