/**
 * [VIZWide3D] VIZCore Fly 인터페이스
 * @copyright © 2013 - 2022 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
class Fly {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;

        //=======================================
        // Method
        //=======================================
        /**
         * Fly 모드 사용 설정
         * @param {boolean} enable 사용/미사용
         * @example
         * vizwide3d.View.Fly.Eanble(true);
         */
        this.Enable = function (enable) {

            if(scope.Main.IsVIZWide3DProduct() === false)
                return ;
        
            if(enable) {
                scope.Main.Mode.Fly();
            }
            else {
                scope.Main.Mode.Normal();
            }
        };

        //=======================================
        // Event
        //=======================================
    }
}

export default Fly;