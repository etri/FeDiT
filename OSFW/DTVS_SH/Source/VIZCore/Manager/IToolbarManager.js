/**
 * VIZCore Toolbar 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
class Toolbar {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;


        //=======================================
        // Method
        //=======================================
        /**
         * Toolbar 보이기 / 숨기기
         * @param {boolean} visible 보이기/숨기기
         * @example
         * vizwide3d.View.Toolbar.Show(true);
         */
        this.Show = function (visible) {
            scope.Main.Toolbar.Show(visible);
        };


        //=======================================
        // Event
        //=======================================
    }
}

export default Toolbar;