/**
 * VIZCore Object3D CustomEdge 인터페이스
 * @copyright © 2013 - 2023 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @param {Object} object3d Object3D Instance
 * @class
 */
 class Object3DCustomEdge {
    constructor(main, VIZCore, object3d) {
        let scope = this;

        this.Main = main;
        this.Object3D = object3d;        

        //=======================================
        // Method
        //=======================================

        /**
         * 모두 초기화
         * @example
         * vizwide3d.Object.CustomEdge.ClearAll();
         */
        this.ClearAll = function () {
            if(scope.Main.useTree) {
                scope.Main.Tree.ClearModelObjectCustomEdge();
            }
            else {
                scope.Main.Data.ClearModelObjectCustomEdge(undefined);
            }
            scope.Main.ViewRefresh();
        };

         /**
         * 지정한 개체의 모델 모서리 설정
         * @param {Array<Number>} ids 
         * @param {Boolean} edge 모서리 표시
         * @example
         * let nodeID = 2000;
         * let bodyID = 3000;
         * let ids = [nodeID , bodyID];
         * let color = new VIZCore.Color(255, 125, 0, 255);
         *
         *  vizwide3d.Object3D.CustomEdge.SetEdge(ids, true);
         */
        this.SetEdge = function(ids, edge)  {

            if(scope.Main.useTree) {
                let bodyIds = scope.Main.Tree.GetBodyIds(ids);
                scope.Main.Tree.SetModelObjectCustomEdge(bodyIds, edge);
            }
            else {
                let bodyIds = scope.Main.Tree.GetBodyIds(ids);
                scope.Main.Data.SetModelObjectCustomEdge(bodyIds, edge);
            }

            scope.Main.ViewRefresh();
        };

        /**
         * 
         * @param {*} fileKey File ID
         * @param {Array<Number>}  originIds Origin IDs Array
         * @param {Boolean} edge 모서리 표시
         * 
         * let fileKey = "sample";
         * let originIds = [10];
         *
         *  vizwide3d.Object.CustomEdge.SetEdgeByOrigin(fileKey, originIds, true);
         */
        this.SetEdgeByOrigin = function(fileKey, originIds, edge)  {

            if(scope.Main.useTree) {
                scope.Main.Tree.SetModelObjectCustomEdgeByOriginIds(fileKey, originIds, edge);
            }

            scope.Main.ViewRefresh();
        };



        //=======================================
        // Event
        //=======================================
    }
}


export default Object3DCustomEdge;