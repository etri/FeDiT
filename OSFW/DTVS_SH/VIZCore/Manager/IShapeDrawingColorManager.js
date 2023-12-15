/**
 * VIZCore ShapeDrawing Color 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
class ShapeDrawingColor {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;

        //=======================================
        // Method
        //=======================================

        /**
         * 개체 색상 및 투명도 변경
         * @param {Number} ID  개체 ID
         * @param {VIZCore.Color} color Color
         * @example
         *
         *  let pos1 = new VIZCore.Vector3(0, 0, 0);
         *  let pos2 = new VIZCore.Vector3(10, 10, 10);
         *  let color = new VIZCore.Color(255, 255, 255, 255);
         * 
         *  let id = vizwide3d.ShapeDrawing.AddBox(pos1, pos2, color);
         * 
         *  let newColor = new VIZCore.Color(255, 255, 0, 255);
         *  vizwide3d.ShapeDrawing.Color.SetColor(id, newColor);
         */
        this.SetColor = function(ID, color)  {
            scope.Main.CustomObject.SetObjectColor(ID, color);
            scope.Main.ViewRefresh();
        };

        /**
         * 개체 색상 및 투명도 초기화
         * @param {Number} ID  개체 ID
         * @example
         *
         *  let id = vizwide3d.ShapeDrawing.AddBox(pos1, pos2, color);
         *  vizwide3d.ShapeDrawing.Color.ClearColor(id);
         */
        this.ClearColor = function(ID) {
            scope.Main.CustomObject.SetObjectColor(ID, undefined);
            scope.Main.ViewRefresh();
        };

        /**
         * 개체 색상 및 투명도 반환
         * @param {Number} ID 개체 ID
         * @returns {VIZCore.Color}
         * @example
         *
         *  let id = vizwide3d.ShapeDrawing.AddBox(pos1, pos2, color);
         *  let color = vizwide3d.ShapeDrawing.Color.GetColor(id);
         */
        this.GetColor = function (ID) {
            return scope.Main.CustomObject.GetObjectColor(ID);
        };

        //=======================================
        // Event
        //=======================================
    }
}

export default ShapeDrawingColor;