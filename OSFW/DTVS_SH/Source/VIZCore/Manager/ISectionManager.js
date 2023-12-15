/**
 * VIZCore Section 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
class Section {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;


        //=======================================
        // Method
        //=======================================
        /**
        * 단면 생성
        * @param {VIZCore.Enum.CLIPPING_MODES} clippingType : VIZCore.Enum.CLIPPING_MODES
        * @returns {Object} 단면 아이템 : Data.ClipItem()
        * @example
        * vizwide3d.Section.Create(VIZCore.Enum.CLIPPING_MODES.X);
        * vizwide3d.Section.Create(VIZCore.Enum.CLIPPING_MODES.Y);
        * vizwide3d.Section.Create(VIZCore.Enum.CLIPPING_MODES.Z);
        * vizwide3d.Section.Create(VIZCore.Enum.CLIPPING_MODES.BOX);
        * vizwide3d.Section.Create(VIZCore.Enum.CLIPPING_MODES.SELECTBOX);
        */
        this.Create = function (clippingType) {
            return scope.Main.Section.Create(clippingType);
        };

        
        /**
         * 활성화된 단면 ID 반환
         * @returns {*} 단면 ID
         * @example
         * let clipped = vizwide3d.Section.GetClipping();
         */
         this.GetClipping = function () {
            let item = scope.Main.Clipping.Get();
            if(item === undefined)
                return undefined;

            return item.id;
        };


        /**
        * 단면 클리핑 상태 반환
        * @returns {Boolean} 단면 클리핑 여부
        * @example
        * let clipped = vizwide3d.Section.IsClipping();
        */
        this.IsClipping = function () {
            return scope.Main.Section.IsClipping();
        };

        /**
        * 단면 방향 전환
        * @example
        * vizwide3d.Section.Inverse();
        */
        this.Inverse = function () {
            scope.Main.Section.Inverse();
        };

         /**
        * 활성화된 단면 보이기/숨기기 설정 
        * @param {boolean} show  true : 보이기, false : 숨기기
        * @example
        * let show = true;
        * vizwide3d.Section.Show(show);
        */
        this.Show = function (show) {
            let itemID = scope.GetClipping();
            if (itemID === undefined)
                return;
            scope.SetShow(itemID, show);
        };

        /**
         * 단면 보이기/숨기기 설정
         * @param {String} id clipping ID
         * @param {boolean} show  true : 보이기, false : 숨기기
         * @example
         * vizwide3d.Section.SetShow(10, true);
         */
         this.SetShow = function (id, show) {
            scope.Main.Clipping.SetShowClipping(id, show);
            scope.Main.ViewRefresh();
        };

        /**
         * 단면 보이기/숨기기 반환
         * @param {String} id clipping ID
         * @returns {boolean} true : 보이기, false : 숨기기
         * @example
         * let item = vizwide3d.Section.GetShow(10, true);
         */
        this.GetShow = function (id) {
            let item = scope.Main.Clipping.GetClipping(id);
            if (item === undefined)
                return false;

            return item.visible;
        };
    
        /**
        * 단면 전체 삭제
        * @example
        * vizwide3d.Section.Clear();
        */
        this.Clear = function () {
            scope.Main.Section.Clear();
        };


        /**
        * 단면 상자 크기 반환
        * @param {Object} id Data.ClipItem().id
        * @returns {VIZCore.BBox} bbox boundBox
        * @example
        * {
        *   let item = vizwide3d.Section.Create(VIZCore.Enum.CLIPPING_MODES.BOX);
        *   let bbox = vizwide3d.Section.GetBoxSize(item.id, bbox);
        * }
        */
         this.GetBoxSize = function(id) {
            return scope.Main.Clipping.GetClippingBoxSize(id);
        };

        /**
        * 단면 상자 크기 변경
        * @param {Object} id Data.ClipItem().id
        * @param {VIZCore.BBox} bbox 변경할 boundBox
        * @example
        * {
        *   let item = vizwide3d.Section.Create(VIZCore.Enum.CLIPPING_MODES.BOX);
        *   let bbox = new VIZCore.BBox();
        *   bbox.min.set(-10, -10, -10);
        *   bbox.max.set(10, 10, 10);
        *   bbox.update();
        *   vizwide3d.Section.SetBoxSize(item.id, bbox);
        * }
        */
        this.SetBoxSize = function(id, bbox) {
            scope.Main.Section.SetBoxSize(id, bbox);
        };

        //=======================================
        // Event
        //=======================================
    }
}

export default Section;