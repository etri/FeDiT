
/**
 * VIZCore DrawingMarkup 인터페이스
 * @copyright © 2013 - 2022 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
class DrawingMarkupManager {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;

        //=======================================
        // Method
        //=======================================

        /**
         * 그리기 마크업 모드 상태여부 반환
         * 
         * @example
         * vizwide3d.Review.DrawingMarkup.IsDrawMode();
         */
        this.IsDrawMode = function() {
            return scope.Main.Control.IsControlMode(VIZCore.Enum.CONTROL_STATE.MARKUP, VIZCore.Enum.REVIEW_TYPES.RK_SKETCH);
        };

        /**
         * 그리기 마크업 모드 진입
         * 
         * @example
         * vizwide3d.Review.DrawingMarkup.EnterDrawMode();
         */
        this.EnterDrawMode = function () {
            scope.Main.Review.SetSketchMode(true);
        };

        /**
         * 그리기 마크업 모드 종료
         * 
         * @example
         * vizwide3d.Review.DrawingMarkup.ExitDrawMode();
         */
        this.ExitDrawMode = function() {
            scope.Main.Review.SetSketchMode(false);
        };

        /**
         * 그리기 항목 추가
         * @param {VIZCore.Enum.SKETCH_TYPES} kind 그리기 유형
         * @example
         * {
         *   vizwide3d.Review.DrawingMarkup.EnterDrawMode();
         *   //vizwide3d.Review.DrawingMarkup.Add(VIZCore.Enum.SKETCH_TYPES.NONE); //선택 모드
         *   vizwide3d.Review.DrawingMarkup.Add(VIZCore.Enum.SKETCH_TYPES.FREE);
         *   //vizwide3d.Review.DrawingMarkup.Add(VIZCore.Enum.SKETCH_TYPES.CIRCLE);
         *   //vizwide3d.Review.DrawingMarkup.Add(VIZCore.Enum.SKETCH_TYPES.LINE);
         *   //vizwide3d.Review.DrawingMarkup.Add(VIZCore.Enum.SKETCH_TYPES.RECT);
         *   //vizwide3d.Review.DrawingMarkup.Add(VIZCore.Enum.SKETCH_TYPES.TEXT);
         * }
         */
        this.Add = function(kind)
        {
            if (!scope.IsDrawMode()) return;

            scope.Main.Control.SetSubType(kind);
            //view.Control.SetSubType(VIZCore.Enum.SKETCH_TYPES.FREE);
            //view.Control.SetSubType(VIZCore.Enum.SKETCH_TYPES.CIRCLE);
            //view.Control.SetSubType(VIZCore.Enum.SKETCH_TYPES.LINE);
            //view.Control.SetSubType(VIZCore.Enum.SKETCH_TYPES.RECT);
            //view.Control.SetSubType(VIZCore.Enum.SKETCH_TYPES.TEXT);
        }

        //=======================================
        // Event
        //=======================================
    }
}

export default DrawingMarkupManager;