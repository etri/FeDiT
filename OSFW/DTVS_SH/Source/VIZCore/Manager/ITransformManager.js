/**
 * VIZCore Transform 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
class Transform {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;


        //=======================================
        // Method
        //=======================================
        /**
         * 개체 이동/회전
         * @param {Array<Number>} bodyId Node Array
         * @param {VIZCore.Vector3} move 이동값 : VIZCore.Vector3()
         * @param {VIZCore.Vector3} rotate 회전값 : VIZCore.Vector3()
         * @example
         * let bodyId = 2000;
         * let move = new VIZCore.Vector3(1000, 2000, 0);
         * let rotate = new VIZCore.Vector3(0, 0, 90);
         *
         *  vizwide3d.Object3D.Transform.TransformByBodyID(bodyId, move, rotate);
         */
        this.TransformByBodyID = function (bodyId, move, rotate) {
            scope.Main.Data.Transform(bodyId, move, rotate);
        };


        /**
         * 개체 이동/회전 
         * @param {Array<Number>} ids 
         * @param {VIZCore.Vector3} move 이동값 : VIZCore.Vector3()
         * @param {VIZCore.Vector3} rotate 회전값 : VIZCore.Vector3()
         * @example
         * let nodeID = 2000;
         * let bodyID = 3000;
         * let ids = [nodeID , bodyID];
         * let move = new VIZCore.Vector3(1000, 2000, 0);
         * let rotate = new VIZCore.Vector3(0, 0, 90);
         *
         *  vizwide3d.Object3D.Transform.SetTransform(ids, move, rotate);
         */
         this.SetTransform = function (ids, move, rotate) {

            let bodyIds = scope.Main.Tree.GetBodyIds(ids);
            let bodies = scope.Main.Data.GetBodies(bodyIds);
            //let bodies = scope.Main.Data.GetBodies(ids);

            let bbox = scope.Main.Data.GetBBox(bodies);
            let matrix = scope.Main.Util.GetTransformMatrix(bbox.center, move, rotate);

            scope.SetTransformByBodyID(bodyIds, matrix);
        };

        /**
         * 개체 이동/회전 - 객체의 이동, 회전을 각각 저장하기위해 설정
         * @param {Array<Number>} ids 
         * @param {VIZCore.Vector3} move 이동값 : VIZCore.Vector3()
         * @param {VIZCore.Vector3} rotate 회전값 : VIZCore.Vector3()
         * @example
         * let nodeID = 2000;
         * let bodyID = 3000;
         * let ids = [nodeID , bodyID];
         * let move = new VIZCore.Vector3(1000, 2000, 0);
         * let rotate = new VIZCore.Vector3(0, 0, 90);
         *
         *  vizwide3d.Object3D.Transform.SetMoveRotate(ids, move, rotate);
         */
        this.SetMoveRotate = function (ids, move, rotate){
            let bodyIds = scope.Main.Tree.GetBodyIds(ids);
            let bodies = scope.Main.Data.GetBodies(bodyIds);

            //Original Bound box를 기준으로 
            let bbox = scope.Main.Data.GetBBoxFormOriginal(bodies);
            let matrix = scope.Main.Util.GetTransformMatrix(bbox.center, move, rotate);

            if(scope.Main.useTree) {
                scope.Main.Tree.SetObjectMoveRotate(ids, move, rotate, matrix);
            }
            else {
                scope.Main.Data.SetObjectMoveRotate(ids, move, rotate, matrix);
            }
        };

        /**
         * 개체 이동/회전 반환
         * @param {Array<Number>} ids 
         * @param {bool} result 반한 transform // transform.move, transform.rotate, transform.matrix
         * @example
         * let nodeID = 2000;
         * let bodyID = 3000;
         * let ids = [nodeID , bodyID];
         * 
         *  let returns = vizwide3d.Object3D.Transform.GetMoveRotate(ids);
         */
        this.GetObjectTransform = function(ids)
        {
            let result = undefined;

            if(scope.Main.useTree) {
                result  = scope.Main.Tree.GetObjectTransform(ids);
            }
            else{
                result  = scope.Main.Data.GetObjectTransform(ids);
            }
            
            return result;
        };

         /**
         * 개체 이동/회전
         * @param {Array<Number>} ids 
         * @param {VIZCore.Matrix4} transform Matrix4
         * @example
         * let nodeID = 2000;
         * let bodyID = 3000;
         * let ids = [nodeID , bodyID];
         * let transform = new VIZCore.Matrix4();
         * transform.translate(100, 0, 0);
         *
         *  vizwide3d.Object3D.Transform.SetTransformByMatrix(ids, transform);
         */
        this.SetTransformByMatrix = function (ids, transform) {
            let bodyIds = scope.Main.Tree.GetBodyIds(ids);
            
            scope.SetTransformByBodyID(bodyIds, transform);
        };

        /**
         * 개체 이동/회전
         * @param {Array<Object>} nodes 
         * @param {VIZCore.Matrix4} transform Matrix4
         * @example
         * let nodes = vizwide3d.Object3D.Find.GetNodeByName(
         *          'PIPE101'   // Keyword
         *          , true      // Full Match
         *          );
         * let transform = new VIZCore.Matrix4();
         * 
         *  vizwide3d.Object3D.Transform.SetTransformByNode(nodes, transform);
         */
        this.SetTransformByNode = function(nodes, transform){
            let nodeIDs = [];

            for (let i = 0; i < nodes.length; i++) {
                nodeIDs.push(nodes[i].id);
            }

            scope.SetTransformByNodeID(nodeIDs, transform);
        };

        this.SetTransformByNodeID = function(ids, transform){
            let bodyIds = scope.Main.Tree.GetBodyIds(ids);
            scope.SetTransformByBodyID(bodyIds, transform);
        };

         /**
         * 개체 이동/회전
         * @param {Number} ids Node Array
         * @param {VIZCore.Matrix4} transform  : VIZCore.Matrix4()
         * @example
         * let bodyId = 2000;
         * let transform = new VIZCore.Matrix4();
         *
         *  vizwide3d.Object3D.Transform.SetTransformByBodyID(bodyId, transform);
         */
        this.SetTransformByBodyID = function(ids, transform){
            //scope.Main.Data.SetObjectMatrix(ids, transform);
            
            if(scope.Main.useTree) {
                //scope.Main.Tree.UpdateObjectTransform(ids,transform);
                scope.Main.Tree.SetObjectTransform(ids, transform);
            }
            else {
                scope.Main.Data.SetObjectMatrix(ids, transform);
            }

            //scope.Main.ViewRefresh();
        };

        /**
         * 개체 이동/회전 초기화
         * @example
         * 
         * vizwide3d.Object3D.Transform.RestoreTransformAll();
         */
        this.RestoreTransformAll = function () {
            scope.Main.Data.ClearObjectMatrix(undefined);
            if(scope.Main.useTree)
                scope.Main.Tree.ClearObjectTransform(undefined);

            scope.Main.Data.UpdateAllObjectsBBox();
            scope.Main.ViewRefresh();
        };

        /**
         * 지정한 Node 개체 이동/회전 초기화
         * @param {Array<Number>} ids Node ID Array
         * @example
         * let nodes = vizwide3d.Object3D.Find.GetNodeByName(
         *          'PIPE101'   // Keyword
         *          , true      // Full Match
         *          );
         *
         * let ids = [];
         * for (let i = 0; i < nodes.length; i++) {
         *   ids.push(nodes[i].id);
         * }
         * 
         * vizwide3d.Object3D.Transform.RestoreTransformByNodeID(ids);
         */
        this.RestoreTransformByNodeID = function (ids) {
            let bodyIds = scope.Main.Tree.GetBodyIds(ids);
            scope.RestoreTransformByBodyID(bodyIds);
        };

        /**
         * 지정한 Body 개체 이동/회전 초기화
         * @param {Array<Number>} ids Body ID Array
         * @example
         * let nodes = vizwide3d.Object3D.Find.GetNodeByName(
         *          'PIPE101'   // Keyword
         *          , true      // Full Match
         *          );
         *
         * let nodeIDs = [];
         * for (let i = 0; i < nodes.length; i++) {
         *   nodeIDs.push(nodes[i].id);
         * }
         * 
         * let ids = vizwide3d.Object3D.GetBodyIdsByNodeID(nodeIDs);
         * 
         * vizwide3d.Object3D.Transform.RestoreTransformByBodyID(ids);
         */
        this.RestoreTransformByBodyID = function (ids) {
            scope.Main.Data.ClearObjectMatrix(ids);
            if(scope.Main.useTree)
                scope.Main.Tree.ClearObjectTransform(ids);
        };

        /**
         * 개체 이동/회전 핸들 모드
         * @example
         * 
         *  vizwide3d.Object3D.Transform.SetHandleMode(true); //모드 시작
         *  vizwide3d.Object3D.Transform.SetHandleMode(false); //모드  
         *
         **/
        this.SetEnableHandle = function(bEnable) {

            if(bEnable)
                scope.Main.Mode.ObjectTransform();
            else
                scope.Main.Mode.Normal();
        };
        
        /**
         * 개체 이동/회전 핸들 모드 여부 반환
         * @returns {boolean} Control 핸들 사용 여부 반환
         * @example
         * 
         * let enable = vizwide3d.Object3D.Transform.GetEnableHandle();
         */
        this.GetEnableHandle = function() {
            return scope.Main.Control.IsControlMode(VIZCore.Enum.CONTROL_STATE.OBJECTTRANSFORM, undefined);
        };


        //=======================================
        // Event
        //=======================================
        
        /// 모델 선택 시 change event 호출
          this.OnTransformChangedEvent = function (listener) {
            scope.Main.Tree.OnChangedEvent(listener);
        };
    }
}

export default Transform;