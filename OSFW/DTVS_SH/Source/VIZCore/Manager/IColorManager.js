/**
 * VIZCore Color 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
class Color {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;

        //=======================================
        // Method
        //=======================================

        /**
         * 개체 색상 및 투명도 변경
         * @param {Array<Number>} ids 
         * @param {VIZCore.Color} color Color
         * @example
         * let nodeID = 2000;
         * let bodyID = 3000;
         * let ids = [nodeID , bodyID];
         * let color = new VIZCore.Color(255, 125, 0, 255);
         *
         *  vizwide3d.Object3D.Color.SetColor(ids, color);
         */
        this.SetColor = function(ids, color)  {

            let bodyIds = scope.Main.Tree.GetBodyIds(ids);
            if(scope.Main.useTree)
                scope.Main.Tree.SetObjectCustomColor(bodyIds, color);
            else
                scope.Main.Data.SetObjectCustomColor(bodyIds, color);
        };

        /**
         * 개체 색상 및 투명도 초기화
         * @param {Array<Number>} ids 
         * @example
         * let nodeID = 2000;
         * let bodyID = 3000;
         * let ids = [nodeID , bodyID];
         * 
         * vizwide3d.Object3D.Color.ClearColor(ids);
         */
        this.ClearColor = function(ids)  {

            let bodyIds = scope.Main.Tree.GetBodyIds(ids);
            if(scope.Main.useTree)
                scope.Main.Tree.SetObjectCustomColor(bodyIds, undefined);
            else
                scope.Main.Data.SetObjectCustomColor(bodyIds, undefined);
        };

        /**
         * 개체 색상 변경
         * @param {Array<Number>} ids 
         * @param {VIZCore.Color} color Color
         * @example
         * let nodeID = 2000;
         * let bodyID = 3000;
         * let ids = [nodeID , bodyID];
         * let color = new VIZCore.Color(255, 125, 0, 255);
         *
         *  vizwide3d.Object3D.Color.SetRGB(ids, color);
         */
        this.SetRGB = function (ids, color) {
            let bodyIds = scope.Main.Tree.GetBodyIds(ids);           

            if(scope.Main.useTree)
                scope.Main.Tree.SetObjectCustomColorRGB(bodyIds, color);
            else
                scope.Main.Data.SetObjectCustomColorRGB(bodyIds, color);
        };

        /**
         * 개체 색상 초기화
         * @param {Array<Number>} ids 
         * @example
         * let nodeID = 2000;
         * let bodyID = 3000;
         * let ids = [nodeID , bodyID];
         * 
         * vizwide3d.Object3D.Color.ClearRGB(ids);
         */
        this.ClearRGB = function(ids)  {

            let bodyIds = scope.Main.Tree.GetBodyIds(ids);
            if(scope.Main.useTree)
                scope.Main.Tree.SetObjectCustomColorRGB(bodyIds, undefined);
            else 
                scope.Main.Data.SetObjectCustomColorRGB(bodyIds, undefined);
        };

        /**
         * 개체 투명도 초기화
         * @param {Array<Number>} ids 
         * @example
         * let nodeID = 2000;
         * let bodyID = 3000;
         * let ids = [nodeID , bodyID];
         * 
         * vizwide3d.Object3D.Color.ClearAlpha(ids);
         */
        this.ClearAlpha = function (ids) {

            let bodyIds = scope.Main.Tree.GetBodyIds(ids);
            if (scope.Main.useTree)
                scope.Main.Tree.SetObjectCustomColorAlpha(bodyIds, undefined);
            else
                scope.Main.Data.SetObjectCustomColorAlpha(bodyIds, undefined);
        };


        /**
         *  개체 투명도 변경
         * @param {Array<Number>} ids 
         * @param {Number} alpha 0 ~ 255 투명도
         * @example
         * let nodeID = 2000;
         * let bodyID = 3000;
         * let ids = [nodeID , bodyID];
         * let alpha = 100;
         * 
         * vizwide3d.Object3D.Color.SetAlpha(ids, alpha);
         */
        this.SetAlpha = function (ids, alpha) {
            let bodyIds = scope.Main.Tree.GetBodyIds(ids);           

            if(scope.Main.useTree)
                scope.Main.Tree.SetObjectCustomColorAlpha(bodyIds, alpha);
            else 
                scope.Main.Data.SetObjectCustomColorAlpha(bodyIds, alpha);
        };
        
        /**
         * 노드 색상 변경
         * @param {Array} nodes Node Array
         * @param {VIZCore.Color} color Color
         * @example
         * let nodes = vizwide3d.Object3D.Find.GetNodeByName(
         *          'PIPE101'   // Keyword
         *          , true      // Full Match
         *          );
         *
         *  vizwide3d.Object3D.Color.SetColorByNode(nodes, new VIZCore.Color(255, 125, 0, 255));
         */
        this.SetColorByNode = function (nodes, color) {
            if (nodes === undefined)
                return;

            let nodeIDs = [];

            for (let i = 0; i < nodes.length; i++) {
                nodeIDs.push(nodes[i].id);
            }

            scope.SetColorByNodeID(nodeIDs, color);
        };

        /**
         * 노드 색상 변경
         * @param {Array} nodeIDs Node ID Array
         * @param {VIZCore.Color} color Color
         * @example
         * let nodeIDs = [];
         * nodeIDs.push(100);
         * nodeIDs.push(200);
         * nodeIDs.push(300);
         *
         *  vizwide3d.Object3D.Color.SetColorByNodeID(nodeIDs, new VIZCore.Color(255, 125, 0, 255));
         */
        this.SetColorByNodeID = function (nodeIDs, color) {
            if (nodeIDs === undefined)
                return;

            // Body 형상이 없어도 다운로드시 반영될수 있도록 변경
            //let bodies = scope.Main.Tree.GetBodies(nodeIDs);
            let ids = scope.Main.Tree.GetBodyIds(nodeIDs);
            scope.SetColorByBodyID(ids, color);
        };

        /**
         * 바디 색상 변경
         * @param {Array} bodies Body Array
         * @param {VIZCore.Color} color Color
         * @example
         * let nodes = vizwide3d.Object3D.Find.GetNodeByName(
         *          'PIPE101'   // Keyword
         *          , true      // Full Match
         *          );
         *
         * let color = new VIZCore.Color(255, 125, 0, 255);
         * let bodies = vizwide3d.Object3D.GetBodiesByNode(nodes);
         * 
         * vizwide3d.Object3D.Color.SetColorByBody(bodies, color);
         */
        this.SetColorByBody = function (bodies, color) {
            if (bodies === undefined)
                return;

            let bodyIDs = [];
            for (let i = 0; i < bodies.length; i++) {
                bodyIDs.push(bodies[i].bodyId);
            }

            scope.SetColorByBodyID(bodyIDs, color);
        };

        /**
         * 바디 색상 변경
         * @param {Array} bodyIDs Body IDs Array
         * @param {VIZCore.Color} color Color
         * @example
         * let nodeIDs = [1];
         * let bodyIDs = vizwide3d.Object3D.GetBodyIdsByNodeID(nodeIDs);
         * 
         * vizwide3d.Object3D.Color.SetColorByBodyID(bodyIDs, new VIZCore.Color(255, 125, 0, 255));
         */
        this.SetColorByBodyID = function (bodyIDs, color) {
            if (bodyIDs === undefined)
                return;

            if(scope.Main.useTree)
                scope.Main.Tree.SetObjectCustomColor(bodyIDs, color);
            else {
                scope.Main.Data.SetObjectCustomColor(bodyIDs, color);
            }
        };

        /**
         * 색상 변경
         * @param {Array} fileIds File IDs Array
         * @param {Array} originIds Origin IDs Array
         * @param {VIZCore.Color} color Color
         * @example
         * 
         * let nodes = vizwide3d.Object3D.Find.GetNodeByName(
         *          'PIPE101'   // Keyword
         *          , true      // Full Match
         *          );
         * 
         * let fileIds = [];
         * let originIds = [];
         * 
         * for (let i = 0; i < nodes.length; i++) {
         *  fileIds.push(nodes[i].fileId);
         *  originIds.push(nodes[i].originId);
         * }
         * 
         * let color = new VIZCore.Color(255, 125, 0, 255);
         * 
         * vizwide3d.Object3D.Color.SetColorByBodyID(fileIds, originIds, color);
         */
        this.SetColorByOrigin = function(fileIds, originIds, color){
            let ids = scope.Main.Tree.GetNodeIDByOrigin(fileIds, originIds);
            if(Array.isArray(ids))
                scope.SetColorByNodeID(ids, color);
            else{
                scope.SetColorByNodeID([ids], color);
            }
        };

        /**
         * 색상 변경
         * @param {Object} fileId File ID
         * @param {VIZCore.Color} color Color
         * @example
         * let fileId = "FileKey";
         * let color = new VIZCore.Color(255, 125, 0, 255);
         * 
         * vizwide3d.Object3D.Color.SetColorByBodyID(fileId, color);
         */
        this.SetColorByFile = function(fileId, color){
            let ids = scope.Main.Tree.GetNodeIDsByFile(fileId);
            scope.SetColorByNodeID(ids, color);
        };

        /**
         * 색상 전체 초기화
         * @example
         * 
         * vizwide3d.Object3D.Color.ClearAll();
         */
        this.ClearAll = function () {
            
            if(scope.Main.useTree)
                scope.Main.Tree.ClearObjectCustomColor();
            
            scope.Main.Data.ClearObjectCustomColor();
        };

        /**
         * 지정된 Body IDs 색상 초기화
         * @param {Array} bodyIDs Body IDs Array
         * @example
         * let nodeIDs = [1];
         * let bodyIDs = vizwide3d.Object3D.GetBodyIdsByNodeID(nodeIDs);
         * 
         * vizwide3d.Object3D.Color.ClearByBodyID(bodyIDs);
         */
        this.ClearByBodyID = function (bodyIDs) {
            if(scope.Main.useTree)
                scope.Main.Tree.ClearObjectCustomColor(bodyIDs);
            scope.Main.Data.ClearObjectCustomColor(bodyIDs);
        };


        //=======================================
        // Event
        //=======================================
    }
}

export default Color;