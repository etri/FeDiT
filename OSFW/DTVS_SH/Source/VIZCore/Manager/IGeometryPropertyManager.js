/**
 * VIZCore Geometry Property 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @param {Object} object3d Object3D Instance
 * @class
 */
class GeometryProperty {
    constructor(main, VIZCore, object3d) {
        let scope = this;

        this.Main = main;
        this.Object3D = object3d;


        //=======================================
        // Method
        //=======================================
        /**
         * 지정된 Nodes 의 BoundBox 반환
         * @param {Array.Object} nodes Node Object Array
         * @return {VIZCore.BBox} Bound Box
         * @example
         * let nodes = vizwide3d.Object3D.Find.GetNodeByName(
         *          'PIPE101'   // Keyword
         *          , true      // Full Match
         *          );
         *
         *  let boundBox = vizwide3d.Object3D.GeometryProperty.GetBoundBoxByNode(nodes);
         */
        this.GetBoundBoxByNode = function (nodes) {
            // let nodeIDs = [];
            // for (let i = 0; i < nodes.length; i++) {
            //     nodeIDs.push(nodes[i].id);
            // }

            // return scope.GetBoundBoxByNodeID(nodeIDs);
            return scope.Object3D.GetBoundBoxByNode(nodes);
        };

        /**
         * 지정된 Node ID (Array) 의 BoundBox 반환
         * @param {Array.Number} ids Node ID Array
         * @return {VIZCore.BBox} Bound Box
         * @example
         * 
         * let ids = [];
         * ids.push(100);
         * ids.push(200);
         * ids.push(300);
         *
         * vizwide3d.Object3D.GeometryProperty.GetBoundBoxByNodeID(ids);
         */
        this.GetBoundBoxByNodeID = function (ids) {
            // let bodies = scope.Object3D.GetBodiesByNodeID(ids);

            // return scope.GetBoundBoxByBody(bodies);
            return scope.Object3D.GetBoundBoxByNodeID(ids);
        };

        /**
         * 지정된 Body (Array) 의 BoundBox 반환
         * @param {Array.Object} bodies Body Object Array
         * @return {VIZCore.BBox} Bound Box
         * @example
         * let nodes = vizwide3d.Object3D.Find.GetNodeByName(
         *          'PIPE101'   // Keyword
         *          , true      // Full Match
         *          );
         *
         * let color = new VIZCore.Color(255, 125, 0, 255);
         * let bodies = vizwide3d.Object3D.GetBodiesByNode(nodes);
         * 
         * vizwide3d.Object3D.GeometryProperty.GetBoundBoxByBody(bodies);
         */
        this.GetBoundBoxByBody = function (bodies) {
            return scope.Main.Data.GetBBox(bodies);
        };



        //=======================================
        // Event
        //=======================================
    }
}

export default GeometryProperty;