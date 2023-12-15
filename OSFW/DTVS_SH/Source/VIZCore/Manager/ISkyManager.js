/**
 * VIZCore Sky 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
class Sky {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;

        //=======================================
        // Method
        //=======================================
        /**
         * ViewCube 보이기 / 숨기기
         * @param {boolean} enable 보이기/숨기기
         * @example
         * vizwide3d.View.ViewCube.Show(true);
         */
        this.Enable = function (enable) {
            scope.Main.Mode.SkyBox(enable);
        };

        //=======================================
        // Event
        //=======================================
    }
}

export default Sky;