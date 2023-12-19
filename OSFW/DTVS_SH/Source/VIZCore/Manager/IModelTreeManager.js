/**
 * VIZCore ModelTree 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
class ModelTree {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;


        //=======================================
        // Method
        //=======================================
        /**
         * ModelTree 보이기 / 숨기기
         * @param {boolean} visible 보이기/숨기기
         * @example
         * vizwide3d.ModelTree.Show(true);
         */
        this.Show = function (visible) {
            scope.Main.Tree.Show(visible);
        };

        /**
         * ModelTree 개발자 정보 사용여부 설정
         * (ID 표시)
         * @param {boolean} enable 사용/미사용
         * @example
         * vizwide3d.ModelTree.Developer(true);
         */
        this.Developer = function (enable) {
            scope.Main.Tree.Developer(enable);
        };
    


        //=======================================
        // Event
        //=======================================
    }
}

export default ModelTree;