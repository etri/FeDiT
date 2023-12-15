/**
 * VIZCore PropertyTree 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
class PropertyTree {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;


        //=======================================
        // Method
        //=======================================
        /**
         * PropertyTree 보이기 / 숨기기
         * @param {boolean} visible 보이기/숨기기
         * @example
         * vizwide3d.PropertyTree.Show(true);
         */
        this.Show = function (visible) {
            scope.Main.PropertyTree.Show(visible);
        };

        //=======================================
        // Event
        //=======================================
    }
}

export default PropertyTree;