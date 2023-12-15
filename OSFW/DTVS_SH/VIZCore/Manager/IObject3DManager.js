import IFind from "./IFindManager.js";
import IColor from "./IColorManager.js";
import IMaterial from "./IMaterialManager.js";
import IGeometryProperty from "./IGeometryPropertyManager.js";
import ITransform from "./ITransformManager.js";
import IUDA from "./IUDAManager.js";
import IObject3DCustomEdge from "./IObject3DCustomEdgeManager.js";

/**
 * VIZCore Model 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
class Object3D {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;

        let NodeEntity = function () {
            let item = {
                id: undefined,
                index: undefined,
                kind: undefined,
                kindStr: undefined,
                parentId: undefined,
                name: undefined,
                level: undefined,
                selection: undefined,
                visible: undefined,
                boundBox: undefined,
                fileId: undefined,
                originId: undefined
            };
            return item;
        };

        scope.Find = new IFind(main, VIZCore, this);
        scope.Color = new IColor(main, VIZCore);
        scope.Material = new IMaterial(main, VIZCore, this);
        scope.GeometryProperty = new IGeometryProperty(main, VIZCore, this);
        scope.Transform = new ITransform(main, VIZCore);
        scope.CustomEdge = new IObject3DCustomEdge(main, VIZCore.this);

        scope.UDA = new IUDA(main, VIZCore);

        //=======================================
        // Property & Attribute
        //=======================================
        //scope.Model.SelectionKind.Selectionion.Kind = VIZCore.Enum.SelectionObject3DTypes.ALL;
        //scope.Model.SelectionKind.Selectionion.Kind = VIZCore.Enum.SelectionObject3DTypes.OPAQUE_OBJECT3D;
        //scope.View.Configuration.Model.Selection.Kind = VIZCore.Enum.SelectionObject3DTypes.ALL;
        //=======================================
        // Method
        //=======================================

        this.GetExportNodeInfo = function (nodeInfo) {
            return ExportNodeInfo(nodeInfo);
        };


        /**
         * 개체 정보
         * @param {} nodeInfo 
         */
        function ExportNodeInfo(nodeInfo) {
            let parentInfo = undefined;

            if (nodeInfo !== undefined)
                parentInfo = scope.Main.Tree.GetParentNodeInfo(nodeInfo);

            let kindStr = undefined;
            if (nodeInfo.node_type === VIZCore.Enum.ENTITY_TYPES.EntAssembly)
                kindStr = "Assembly";
            else if (nodeInfo.node_type === VIZCore.Enum.ENTITY_TYPES.EntPart)
                kindStr = "Part";
            else if (nodeInfo.node_type === VIZCore.Enum.ENTITY_TYPES.EntBody)
                kindStr = "Body";

            //선택 및 가시화 정보
            let node = scope.Main.Tree.GetInfo2Node(nodeInfo);

            let entity = NodeEntity();
            entity.id = nodeInfo.node_id;
            entity.index = nodeInfo.index;
            entity.kind = nodeInfo.node_type;
            entity.kindStr = kindStr;
            entity.parentId = parentInfo !== undefined ? parentInfo.node_id : undefined;
            entity.name = nodeInfo.name;
            entity.level = nodeInfo.level;
            entity.selection = node.selection;
            entity.visible = node.visible;
            entity.boundBox = nodeInfo.bbox;
            entity.fileId = nodeInfo.file_id;
            entity.originId = nodeInfo.origin_id;

            return entity;
        }

        /**
         * Node ID의 해당하는 정보 반환
         * @param {Number} id Node ID
         * @returns {Array} Node Data Array
         * @example
         * // Add Event Handler : Object Selected Event (개체 선택 이벤트)
         * vizwide3d.Object3D.OnObject3DSelected(OnObject3DSelected);
         *
         * //=======================================
         * // Event :: OnObject3DSelectedEvent
         * //=======================================
         * let OnObject3DSelected = function (event) {
         *     // 선택된 모델이 없음
         *     if (event.data.id == -1) {
         *         //alert('선택된 모델이 없거나, 기존 선택상태가 해제됨.');
         *     }
         *     // 선택된 모델이 있음
         *     else {
         *         // 지정된 ID의 노드 정보 조회
         *         let node = vizwide3d.Object3D.FromID(event.data.id);
         *         let parent = vizwide3d.Object3D.FromID(node.parentId);
         *
         *         let nodeId = node.id;
         *         let nodeIndex = node.index;
         *         let nodeKind = node.kind;
         *         let nodeKindStr = node.kindStr;
         *         let nodeParentId = node.parentId;
         *         let nodeName = node.name;
         *         let nodeLevel = node.level;
         *         let nodeSelection = node.selection;
         *         let nodeVisible = node.visible;
         *         let nodeBoundBox = node.boundBox;
         *
         *         // 지정된 노드의 Structure 조회
         *         let nodes = vizwide3d.Object3D.GetNodeStructure(
         *             event.data.id   // 선택된 노드 ID
         *             , false         // 방향 - True(Top Down), False(Bottom Up)
         *         );
         *
         *         // 선택된 모델의 상위 노드중에서 BOUNDARY 이름을 포함한 노드 검색
         *         for (let i = 0; i < nodes.length; i++) {
         *             if (nodes[i].name.includes("BOUNDARY")) {
         *                 console.log('SELECTED TANK : ' + nodes[i].name);
         *                 break;
         *             }
         *         }
         *     }
         * }
         */
        this.FromID = function (id) {
            let nodeInfo = scope.Main.Tree.GetNodeInfo(id);
            //let nodeData = scope.Main.Tree.GetDataToNode(id);

            //찾기 실패
            if (nodeInfo === undefined) return undefined;

            let entity = ExportNodeInfo(nodeInfo);

            return entity;

        };

        /**
         * FileID, OriginID에 해당하는 Node 정보 반환
         * @param {Object} fileid File ID
         * @param {Number} originid Origin ID
         * @returns {Array} Node Data Array
         * @example
         * let node = vizwide3d.Object3D.FromOrigin("FileKey", 1);
         */
        this.FromOrigin = function (fileid, originid) {
            let id = scope.Main.Tree.GetNodeIDByOrigin(fileid, originid);
            return scope.FromID(id);
        };

        /**
         * FileID에 해당하는 Node 정보 반환
         * @param {Object} fileId File ID
         * @returns {Array} Node Data Array
         * @example
         * let nodes = vizwide3d.Object3D.FromFile("FileKey");
         */
        this.FromFile = function (fileId) {
            //let nodes = scope.Main.Tree.GetNodeByFile(fileId);
            let nodes = scope.Main.Tree.GetNodeInfoByFile(fileId);

            let result = [];
            if (nodes !== undefined) {
                for (let index = 0; index < nodes.length; index++) {
                    let nodeinfo = nodes[index];
                    result.push(ExportNodeInfo(nodeinfo));
                }
            }
            return result;
        };

        /**
         * Level에 해당하는 Node 정보 반환
         * @param {Number} level Level
         * @returns {Array} Node Data Array
         * @example
         * let nodes = vizwide3d.Object3D.FromLevel(2);
         */
        this.FromLevel = function (level) {
            let nodes = scope.Main.Tree.GetNodeByLevel(level, true);

            let result = [];
            if (nodes !== undefined) {
                for (let index = 0; index < nodes.length; index++) {
                    let nodeinfo = nodes[index];
                    result.push(ExportNodeInfo(nodeinfo));
                }
            }
            return result;
        };

        /**
         * Node ID의 해당하는 정보 반환
         * @param {Number} id Node ID
         * @param {Boolean} topDown True(TopDown), False(BottomUp)
         * @returns {Array} Node Array
         * @example
         * // Add Event Handler : Object Selected Event (개체 선택 이벤트)
         * vizwide3d.Object3D.OnObject3DSelected(OnObject3DSelected);
         *
         * //=======================================
         * // Event :: OnObject3DSelectedEvent
         * //=======================================
         * let OnObject3DSelected = function (event) {
         *     // 선택된 모델이 없음
         *     if (event.data.id == -1) {
         *         //alert('선택된 모델이 없거나, 기존 선택상태가 해제됨.');
         *     }
         *     // 선택된 모델이 있음
         *     else {
         *         // 지정된 ID의 노드 정보 조회
         *         let node = vizwide3d.Object3D.FromID(event.data.id);
         *         let parent = vizwide3d.Object3D.FromID(node.parentId);
         *
         *         let nodeId = node.id;
         *         let nodeIndex = node.index;
         *         let nodeKind = node.kind;
         *         let nodeKindStr = node.kindStr;
         *         let nodeParentId = node.parentId;
         *         let nodeName = node.name;
         *         let nodeLevel = node.level;
         *         let nodeSelection = node.selection;
         *         let nodeVisible = node.visible;
         *         let nodeBoundBox = node.boundBox;
         *
         *         // 지정된 노드의 Structure 조회
         *         let nodes = vizwide3d.Object3D.GetNodeStructure(
         *             event.data.id   // 선택된 노드 ID
         *             , false         // 방향 - True(Top Down), False(Bottom Up)
         *         );
         *
         *         // 선택된 모델의 상위 노드중에서 BOUNDARY 이름을 포함한 노드 검색
         *         for (let i = 0; i < nodes.length; i++) {
         *             if (nodes[i].name.includes("BOUNDARY")) {
         *                 console.log('SELECTED TANK : ' + nodes[i].name);
         *                 break;
         *             }
         *         }
         *     }
         * }
         */
        this.GetNodeStructure = function (id, topDown) {
            let nodes = [];

            let node = scope.FromID(id);
            if (node === undefined)
                return nodes;

            let parent = undefined;
            if (node.parentId !== undefined)
                parent = scope.FromID(node.parentId);

            nodes.push(node);

            while (parent !== undefined) {
                nodes.push(parent);

                if (parent.parentId !== undefined)
                    parent = scope.FromID(parent.parentId);
                else
                    break;
            }

            if (topDown === false) {
                return nodes;
            }
            else {
                return nodes.reverse();
            }
        };

        /**
         * 전체 개체 선택 / 선택해제
         * @param {Boolean} select True(전체 선택), False(전체 선택해제)
         * @example
         * vizwide3d.Object3D.SelectAll(true);  // 전체 개체 선택
         * vizwide3d.Object3D.SelectAll(false); // 전체 개체 선택해제
         */
        this.SelectAll = function (select) {
            if (select === true)
                scope.Main.Data.SelectAll(true);

            else
                scope.Main.Data.DeselectAll(false);
        };


        /**
         * 선택된 모델 반환
         * @returns {Array.Number} Body ID Array
         * @example
         * 
         * let item = vizwide3d.Object3D.GetSelectedObject3D();
        */
        this.GetSelectedObject3D = function () {
            return scope.Main.Data.GetSelection();
        };

        /**
        * 모델 선택/해제 설정
        * @param {Array} nodes Node Array
        * @param {Boolean} selection true: 선택 / false: 선택해제
        * @param {Boolean} append true: 선택추가 / false: 해당 id 만 선택
        * @example
        * let nodes = vizwide3d.Object3D.Find.GetNodeByName(
        *          'PIPE101'   // Keyword
        *          , true      // Full Match
        *          );
        *
        * vizwide3d.Object3D.SelectAll(false);
        *
        * vizwide3d.Object3D.SelectByNode(nodes, true, true);
        */
        this.SelectByNode = function (nodes, selection, append) {
            scope.Main.Renderer.Lock();

            let ids = [];
            for (let i = 0; i < nodes.length; i++) {
                ids.push(nodes[i].id);
            }

            scope.Main.Tree.SelectMulti(ids, selection, append);

            scope.Main.Renderer.Unlock();
        };

        /**
        * 모델 선택/해제 설정
        * @param {Array} ids Node ID Array
        * @param {Boolean} selection true: 선택 / false: 선택해제
        * @param {Boolean} append true: 선택추가 / false: 해당 id 만 선택
        * @example
        * let nodes = vizwide3d.Object3D.Find.GetNodeByName(
        *          'PIPE101'   // Keyword
        *          , true      // Full Match
        *          );
        *
        * vizwide3d.Object3D.SelectAll(false);
        *
        * let ids = [];
        * for (let i = 0; i < nodes.length; i++) {
        *   ids.push(nodes[i].id);
        * }
        *
        * vizwide3d.Object3D.SelectByNodeID(ids, true, true);
        */
        this.SelectByNodeID = function (ids, selection, append) {
            scope.Main.Renderer.Lock();

            // for (let i = 0; i < ids.length; i++) {
            //     scope.Main.Data.Select(ids[i], selection, append);
            // }

            scope.Main.Tree.SelectMulti(ids, selection, append);

            scope.Main.Renderer.Unlock();
        };

        /**
        * 모델 선택/해제 설정
        * @param {Array} fileIds File ID Array
        * @param {Array} originIds Origin ID Array
        * @param {Boolean} selection true: 선택 / false: 선택해제
        * @param {Boolean} append true: 선택추가 / false: 해당 id 만 선택
        * @param {Boolean} event true: 선택 이벤트 활성화 / false: 선택 이벤트 비활성화
        * @example
        * let nodes = vizwide3d.Object3D.Find.GetNodeByName(
        *          'PIPE101'   // Keyword
        *          , true      // Full Match
        *          );
        *
        * vizwide3d.Object3D.SelectAll(false);
        *
        * let fileIds = [];
        * let originIds = [];
        * for (let i = 0; i < nodes.length; i++) {
        *   fileIds.push(nodes[i].fileId);
        *   originIds.push(nodes[i].originId);
        * }
        *
        * vizwide3d.Object3D.SelectByOrigin(fileIds, originIds, true, true, true);
        */
        this.SelectByOrigin = function (fileIds, originIds, selection, append, event) {
            scope.Main.Renderer.Lock();

            let ids = scope.Main.Tree.GetNodeIDsByOrigin(fileIds, originIds);

            scope.Main.Tree.EventHandler.Enable = false;
            scope.Main.Tree.SelectMulti(ids, selection, append);
            scope.Main.Tree.EventHandler.Enable = true;

            if (event !== undefined && event === true) {
                //let info = dataToNode(value);
                let info = [];
                info = scope.Main.Tree.GetDataToNode(ids);
                scope.Main.Tree.EventHandler.dispatchEvent(VIZCore.Enum.EVENT_TYPES.Data.Selected, info);
            }

            scope.Main.Renderer.Unlock();
        };

        /**
        * 모델 선택/해제 설정
        * @param {Object} fileIds FileID or FileID Array
        * @param {Boolean} selection true: 선택 / false: 선택해제
        * @param {Boolean} append true: 선택추가 / false: 해당 id 만 선택
        * @example
        * let fileId = "FileKey";
        * vizwide3d.Object3D.SelectByFile(fileId, true, true);
        *
        * let fileIds = ["FileKey1", "FileKey2"];
        * vizwide3d.Object3D.SelectByFile(fileIds, true, true);
        */
        this.SelectByFile = function (fileIds, selection, append) {
            scope.Main.Tree.EventHandler.Enable = false;
            if (Array.isArray(fileIds)) {
                let nodes = [];
                for (let i = 0; i < fileIds.length; i++) {
                    let arr = this.FromFile(fileIds[i]);
                    //nodes.push(arr);
                    nodes = nodes.concat(arr);
                }
                scope.SelectByNode(nodes, selection, append);
            }
            else {
                let nodes = this.FromFile(fileIds);
                scope.SelectByNode(nodes, selection, append);
            }
            scope.Main.Tree.EventHandler.Enable = true;
        };

        /**
        * 선택 모델 하이라이트 색상 설정
        * @param {VIZCore.Color} color 하이라이트 색상
        * @example
        * let color = new VIZCore.Color(255, 0, 0, 255);
        *
        * vizwide3d.Object3D.SetSelectionColor(color);
        */
        this.SetSelectionColor = function (color) {
            scope.Main.Data.SetSelectedObjectsColor(color);
        };

        /**
        * 모델 보이기/숨기기 설정
        * @param {Array} nodes Node Array
        * @param {Boolean} visible true: 보이기, false: 숨기기
        * @example
        * let nodes = vizwide3d.Object3D.Find.GetNodeByName(
        *          'PIPE101'   // Keyword
        *          , true      // Full Match
        *          );
        *
        * vizwide3d.Object3D.ShowByNode(nodes);
        */
        this.ShowByNode = function (nodes, visible) {
            scope.Main.Renderer.Lock();

            let ids = [];
            for (let i = 0; i < nodes.length; i++) {
                ids.push(nodes[i].id);
            }

            scope.Main.Data.ShowMulti(ids, visible);

            scope.Main.Renderer.Unlock();
        };

        /**
        * 모델 보이기/숨기기 설정 
        * @param {Array} ids Node ID Array
        * @param {Boolean} visible true: 보이기, false: 숨기기
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
        * vizwide3d.Object3D.ShowByNodeID(ids, false);
        */
        this.ShowByNodeID = function (ids, visible) {
            scope.Main.Renderer.Lock();

            scope.Main.Data.ShowMulti(ids, visible);

            scope.Main.Renderer.Unlock();
        };

        /**
        * 모델 보이기/숨기기 설정
        * @param {Array} fileIds File ID Array
        * @param {Array} originIds Origin ID Array
        * @param {Boolean} visible true: 보이기 / false: 숨기기
        * @example
        * let nodes = vizwide3d.Object3D.Find.GetNodeByName(
        *          'PIPE101'   // Keyword
        *          , true      // Full Match
        *          );
        *
        * vizwide3d.Object3D.SelectAll(false);
        *
        * let fileIds = [];
        * let originIds = [];
        * for (let i = 0; i < nodes.length; i++) {
        *   fileIds.push(nodes[i].fileId);
        *   originIds.push(nodes[i].originId);
        * }
        *
        * vizwide3d.Object3D.ShowByOrigin(fileIds, originIds, true);
        */
        this.ShowByOrigin = function (fileIds, originIds, visible) {
            let ids = scope.Main.Tree.GetNodeIDsByOrigin(fileIds, originIds);
            scope.ShowByNodeID(ids, visible);
        };

        /**
        * 파일 기준 모델 보이기/숨기기 설정
        * @param {Object} fileIds FileID or FileID Array
        * @param {Boolean} visible true: 보이기 / false: 숨기기
        * @example
        * let fileId = "FileKey";
        * vizwide3d.Object3D.SelectByFile(fileId, true);
        *
        * let fileIds = ["FileKey1", "FileKey2"];
        * vizwide3d.Object3D.ShowByFile(fileIds, true);
        */
        this.ShowByFile = function (fileIds, visible) {
            if (Array.isArray(fileIds)) {
                let nodes = [];
                for (let i = 0; i < fileIds.length; i++) {
                    let arr = this.FromFile(fileIds[i]);
                    nodes = nodes.concat(arr);
                }
                scope.ShowByNode(nodes, visible);
            }
            else {
                let nodes = this.FromFile(fileIds);
                scope.ShowByNode(nodes, visible);
            }
        };

        /**
        * 모델 전체 보이기/숨기기 설정
        * @param {Boolean} visible true: 보이기, false: 숨기기
        * @example
        * vizwide3d.Object3D.ShowAll(true);
        */
        this.ShowAll = function (visible) {
            scope.Main.Data.ShowAll(visible);
        };

        /**
        * 선택 개체 보이기 / 숨기기
        * @param {Boolean} visible true: 보이기, false: 숨기기
        * @example
        * vizwide3d.Object3D.ShowSelectedObject(true);
        */
        this.ShowSelectedObject = function (visible) {
            scope.Main.Data.ShowSelection(visible);
        };

        /**
        * 비선택 개체 숨기기
        * @example
        * vizwide3d.Object3D.HideUnselectedObject();
        */
        this.HideUnselectedObject = function () {
            scope.Main.Data.UnselectHide();
        };


        this.SelectByType = function (modes) {
            switch (modes) {
                case VIZCore.Enum.SelectionModes.SELECT_ALL: {
                    scope.SelectAll(true);
                } break;
                case VIZCore.Enum.SelectionModes.INVERT_SELECTION: {
                    scope.InvertSelection();
                } break;
                case VIZCore.Enum.SelectionModes.DESELECT_ALL: {
                    scope.SelectAll(false);
                } break;
                default: break;
            }
        }

        /**
        * 선택 반전
        * @example
        * vizwide3d.Object3D.InvertSelection();
        */
        this.InvertSelection = function () {
            scope.Main.Data.InvertSelection();
        };

        /**
        * 지정된 노드의 하위 Body 목록 반환
        * @param {Array.Object} nodes Node Object Array
        * @return {Array.Object} Body Object Array
        * @example
        * let nodes = vizwide3d.Object3D.Find.GetNodeByName(
        *          'PIPE101'   // Keyword
        *          , true      // Full Match
        *          );
        *
        * let color = new VIZCore.Color(255, 125, 0, 255);
        *
        * let bodies = vizwide3d.Object3D.GetBodiesByNode(nodes);
        * vizwide3d.Object3D.Color.SetColorByBody(bodies, color);
        */
        this.GetBodiesByNode = function (nodes) {
            let nodeIDs = [];

            for (let i = 0; i < nodes.length; i++) {
                nodeIDs.push(nodes[i].id);
            }

            return scope.GetBodiesByNodeID(nodeIDs);
        };

        /**
        * 지정된 노드의 하위 Body 목록 반환
        * @param {Array<Number>} nodeIDs Node Object ID Array
        * @return {Array.Object} Body Object Array
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
        * let bodies = vizwide3d.Object3D.GetBodiesByNodeID(nodeIDs);
        */
        this.GetBodiesByNodeID = function (nodeIDs) {

            let bodies = undefined;

            if (scope.Main.useTree) {
                bodies = scope.Main.Tree.GetBodies(nodeIDs);
            }
            else {
                bodies = scope.Main.Data.GetBodies(nodeIDs);
            }

            return bodies;
        };

        /**
         * 지정된 파일 하위 Body 목록 반환
         * @param {*} fileKey 
         * @returns {Array.Object} Body Object Array
         * @example
         * let models = [];
         * models.push({url:"./VIZCore/Model/Sample1_wh.vizw", key:"sample1"});
         * vizwide3d.Model.AddHeader(models);
         *
         * let bodies = vizwide3d.Object3D.GetBodyIdsByNodeOriginID("sample1");
         */
        this.GetBodiesByFile = function (fileKey) {
            let bodies = undefined;

            bodies = scope.Main.Data.GetBodiesByFile(fileKey);

            return bodies;
        };


        /**
        * 지정된 개체 하위 BodyID 목록 반환
        * @param {Array<Object>} nodes Node Object Array
        * @returns {Array<Number>} Body ID Array
        * @example
        * let nodes = vizwide3d.Object3D.Find.GetNodeByName(
        *          'PIPE101'   // Keyword
        *          , true      // Full Match
        *          );
        *
        * let bodyids = vizwide3d.Object3D.GetBodyIdsByNode(nodes);
        */
        this.GetBodyIdsByNode = function (nodes) {
            let nodeIDs = [];

            for (let i = 0; i < nodes.length; i++) {
                nodeIDs.push(nodes[i].id);
            }

            return scope.GetBodyIdsByNodeID(nodeIDs);
        };

        /**
         * 지정된 개체 하위 BodyID 목록 반환
         * @param {array<Number>} ids Node ID Array
         * @returns {Array<Number>} Body ID Array
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
         * let bodyids = vizwide3d.Object3D.GetBodyIdsByNodeID(nodeIDs);
         */
        this.GetBodyIdsByNodeID = function (ids) {
            let result = [];

            if (scope.Main.useTree) {
                result = scope.Main.Tree.GetBodyIds(ids);
            }
            else {
                result = scope.Main.Data.GetBodyIdsByNodeIds(fileKey);
            }

            return result;
        };

        /**
         * 지정된 개체 하위 BodyID 목록 반환
         * @param {*} fileKey fileKey
         * @param {Array<Number>} ids originIds
         * @returns {Array<Number>} Body ID Array
         * @example
         * let models = [];
         * models.push({url:"./VIZCore/Model/Sample1_wh.vizw", key:"sample1"});
         * vizwide3d.Model.AddHeader(models);
         *
         * let bodyids = vizwide3d.Object3D.GetBodyIdsByNodeOriginID("sample1", 1);
         */
        this.GetBodyIdsByNodeOriginID = function (fileKey, ids) {
            let result = undefined;

            if (scope.Main.useTree) {
                let fileKeys = [];
                for (let i = 0; i < ids.length; i++)
                    fileKeys[i] = fileKey;

                let nodeids = scope.Main.Tree.GetNodeIDsByOrigin(fileKeys, ids);
                result = scope.Main.Tree.GetBodyIds(nodeids);
            }
            else {
                result = scope.Main.Data.GetBodyIdsByOriginID(fileKey, ids);
            }

            return result;
        };

        /**
         * 지정된 파일 하위 BodyID 목록 반환
         * @param {*} fileKey fileKey
         * @returns {Array<Number>} Body ID Array
         * @example
         * let models = [];
         * models.push({url:"./VIZCore/Model/Sample1_wh.vizw", key:"sample1"});
         * vizwide3d.Model.AddHeader(models);
         *
         * let bodyids = vizwide3d.Object3D.GetBodyIdsByFile("sample1");
         */
        this.GetBodyIdsByFile = function (fileKey) {
            let ids = undefined;
            ids = scope.Main.Data.GetBodyIdsByFile(fileKey);

            return ids;
        };

        /**
        * 지정된 노드의 BoundBox 반환
        * @param {Array<Object>} nodes Node Object Array
        * @return {VIZCore.BBox} BoundBox
        * @example
        * let nodes = vizwide3d.Object3D.Find.GetNodeByName(
        *          'PIPE101'   // Keyword
        *          , true      // Full Match
        *          );
        * 
        * let bbox = vizwide3d.Object3D.GetBoundBoxByNode(nodes);
        */
        this.GetBoundBoxByNode = function (nodes) {
            if (scope.Main.useTree) {
                let nodeIDs = [];
                for (let i = 0; i < nodes.length; i++) {
                    nodeIDs.push(nodes[i].id);
                }
                let bodyIds = scope.Main.Tree.GetBodyIds(nodeIDs);
                return scope.Main.Tree.GetBBoxArrayID(bodyIds);
            }
            else {
                let bodies = scope.GetBodiesByNode(nodes);
                return scope.Main.Data.GetBBox(bodies);
            }
        };

        /**
        * 지정된 노드의 BoundBox 반환
        * @param {Array<Number>} nodeIDs Node Object ID Array
        * @return {VIZCore.BBox} BoundBox
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
        * let bbox = vizwide3d.Object3D.GetBoundBoxByNodeID(nodeIDs);
        */
        this.GetBoundBoxByNodeID = function (nodeIDs) {

            if (scope.Main.useTree) {
                let bodyIds = scope.Main.Tree.GetBodyIds(nodeIDs);
                return scope.Main.Tree.GetBBoxArrayID(bodyIds);
            }
            else {
                let bodies = scope.GetBodiesByNodeID(nodeIDs);
                return scope.Main.Data.GetBBox(bodies);
            }


            //return scope.Main.Data.GetBBoxByID(nodeIDs);
        };

        /**
        * 지정된 노드의 +X, +Y, +Z, -X, -Y, -Z  Object Id, BoundBox 반환
        * @param {Array<Number>} nodeIDs Node Object ID Array
        * @return {Array<Number, VIZCore.BBox>} object //plusX, plusY, plusZ ,minusX ,minusY ,minusZ -  id, boundbox
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
        * let object = vizwide3d.Object3D.GetExtremeAxisBBoxsByNodeID(nodeIDs);
        * 
        * //plusX object
        * let objectID = object.plusX.id;
        * let objectBBox = object.plusX.bbox;
        * 
        */
        this.GetExtremeAxisBBoxsByNodeID = function (nodeIDs) {

            if (scope.Main.useTree) {
                let bodyIds = scope.Main.Tree.GetBodyIds(nodeIDs);
                return scope.Main.Tree.GetExtremeAxisBBoxs(bodyIds);
            }
            else {
                let bodies = scope.GetBodiesByNodeID(nodeIDs);
                return scope.Main.Data.GetExtremeAxisBBoxs(bodies);
            }
        };

        /**
       * 모델 Origin BoundBox 반환
       * @param {Array} nodes
       * @return {VIZCore.BBox} BoundBox
       * @example
       * 
        * let nodes = vizwide3d.Object3D.Find.GetNodeByName(
        *          'PIPE101'   // Keyword
        *          , true      // Full Match
        *          );
        * 
        * let bbox = vizwide3d.Object3D.GetOriginBoundBox(nodes);
       */
        this.GetOriginBoundBox = function (nodes) {

            if (scope.Main.useTree) {
                let nodeIDs = [];
                for (let i = 0; i < nodes.length; i++) {
                    nodeIDs.push(nodes[i].id);
                }
                let bodyIds = scope.Main.Tree.GetBodyIds(nodeIDs);
                //return scope.Main.Tree.GetOriginBBoxByArrayID(bodyIds);
                return scope.Main.Tree.GetBBoxOriginalArrayID(bodyIds);
            }
            else {
                let bodies = scope.GetBodiesByNode(nodes);
                return scope.Main.Data.GetBBoxFormOriginal(bodies);
            }
        };

        /**
         * 모델 전체 BoundBox 반환
         * @return {VIZCore.BBox} BoundBox
         * @example
         * 
         * let bbox = vizwide3d.Object3D.GetBoundBox();
         */
        this.GetBoundBox = function () {
            return new VIZCore.BBox().copy(scope.Main.Data.ObjectsBBox);
        };

        /**
         * 모델 전체 BoundBox 재계산
         * @example
         * vizwide3d.Object3D.UpdateAllObjectsBBox();
         */
        this.RefreshBBox = function () {
            scope.Main.Data.UpdateAllObjectsBBox();
        };

        function getObjectByFilter(filter) {
            // Leaf 파트 노드의 부모 노드
            if (filter === VIZCore.Enum.OBJECT3D_FILTER.LEAF_ASSEMBLY) {
                // 전체 파트 노드 반환
                let items = [];//PartNode
                items = scope.Main.Tree.GetNodeByType(VIZCore.Enum.ENTITY_TYPES.EntPart);
                let map = new Map();
                let leafAssembly = [];

                for (let i = 0; i < items.length; i++) {
                    let item = items[i];
                    if (item.parent_id === undefined)
                        continue;
                    if (map.has(item.parent_id) == false) {
                        let parent = scope.Main.Tree.GetNodeByID(item.parent_id);
                        map.set(item.parent_id, parent);
                    }
                }
                leafAssembly = Array.from(map.values());
                return leafAssembly;
            }
            // 
            else if (filter === VIZCore.Enum.OBJECT3D_FILTER.PARENT_LEAF_ASSEMBLY) {
                // 전체 파트 노드 반환
                let items = [];//PartNode
                items = getObjectByFilter(VIZCore.Enum.OBJECT3D_FILTER.LEAF_ASSEMBLY);
                let map = new Map();
                let result = [];

                for (let i = 0; i < items.length; i++) {
                    let item = items[i];
                    if (item.parent_id === undefined)
                        continue;
                    if (map.has(item.parent_id) == false) {
                        let parent = scope.Main.Tree.GetNodeByID(item.parent_id);
                        map.set(item.parent_id, parent);
                    }
                }
                result = Array.from(map.values());
                return result;
            }
            else if (filter === VIZCore.Enum.OBJECT3D_FILTER.ROOT) {
                let root = scope.FromRoot();

                return root;
            }
            else if (filter === VIZCore.Enum.OBJECT3D_FILTER.ALL) {
                let items = scope.Main.Tree.GetAllNode();
                return items;
            }
            else if (filter === VIZCore.Enum.OBJECT3D_FILTER.PART) {
                let items = scope.Main.Tree.GetNodeByType(VIZCore.Enum.ENTITY_TYPES.EntPart);
                return items;
            }
            else if (filter === VIZCore.Enum.OBJECT3D_FILTER.VISIBLE_PART) {
                let result = [];
                let items = scope.Main.Tree.GetNodeByType(VIZCore.Enum.ENTITY_TYPES.EntPart);

                for (let i = 0; i < items.length; i++) {
                    if (!items[i].visible) continue;
                    result.push(items[i]);
                }

                return items;
            }
            else if (filter === VIZCore.Enum.OBJECT3D_FILTER.ALL_INCLUDE_BODY) {
                let items = scope.Main.Tree.GetNodeByType(VIZCore.Enum.ENTITY_TYPES.EntBody);
                return items;
            }

            else if (filter === VIZCore.Enum.OBJECT3D_FILTER.SELECTED_TOP) {

                let items = scope.Main.Tree.GetSelectionTopNode();
                return items;
            }
            else if (filter === VIZCore.Enum.OBJECT3D_FILTER.SELECTED_ALL) {
                let result = [];
                let items = scope.Main.Tree.GetAllNode();

                for (let i = 0; i < items.length; i++) {
                    if (!items[i].visible) continue;
                    if (!items[i].selection) continue;
                    result.push(items[i]);
                }

                return result;
            }
            else {

            }
        };

        /**
         * 
         * @param {VIZCore.Enum.OBJECT3D_FILTER} filter 
         //* @returns {Array<Number>} nodes ID
         * @returns {Array<Object>} nodes
         * @example
         *
         * let item = vizwide3d.Object3D.FromFilter(VIZCore.Enum.OBJECT3D_FILTER.ALL);
         */
        this.FromFilter = function (filter) {
            let result = [];
            let nodeInfos = getObjectByFilter(filter);
            for (let i = 0; i < nodeInfos.length; i++) {
                let node = undefined;
                if (nodeInfos[i].node_id === undefined)
                    node = scope.FromID(nodeInfos[i].id);
                else
                    node = scope.FromID(nodeInfos[i].node_id);

                //let node = scope.FromID(nodeInfos[i].node_id);
                //let node = nodeInfos[i];
                result.push(node);
            }
            //result = nodeInfos;
            return result;
        };

        /**
         * 전체 최상위 노드 반환
         * @returns {Array<Object>}
         * @example
         * let root = vizwide3d.Object3D.FromRoot();
         */
        this.FromRoot = function () {
            let result = [];
            let root = scope.Main.Tree.GetRootNode();
            for (let i = 0; i < root.length; i++) {
                result.push(ExportNodeInfo(root[i]));
            }
            return result;
        };

        /**
         * 지정된 URL의 최상위 노드 반환
         * @param {string} url File Download URL
         * @returns {Array<Object>}
         * @example
         * 
         * let models = [];
         * models.push({url:"./VIZCore/Model/Sample1_wh.vizw", key:"sample1"});
         * vizwide3d.Model.AddHeader(models);
         *
         * let nodes = vizwide3d.Object3D.FromRootByUrl("./VIZCore/Model/Sample1_wh.vizw");
         * 
         */
        this.FromRootByUrl = function (url) {
            let result = [];
            let root = scope.Main.Tree.GetRootNodeByFile(url);
            for (let i = 0; i < root.length; i++) {
                result.push(ExportNodeInfo(root[i]));
            }
            return result;
        };

        /**
         * 지정된 모델 Key의 최상위 노드 반환
         * @param {string} key 
         * @returns {Array<Object>}
         * @example
         * 
         * let models = [];
         * models.push({url:"./VIZCore/Model/Sample1_wh.vizw", key:"sample1"});
         * vizwide3d.Model.AddHeader(models);
         *
         * let nodes = vizwide3d.Object3D.GetRootNodeByFileKey("sample1");
         * 
         */
        this.FromRootByKey = function (key) {
            let result = [];
            let root = scope.Main.Tree.GetRootNodeByFileKey(key);
            for (let i = 0; i < root.length; i++) {
                result.push(ExportNodeInfo(root[i]));
            }
            return result;
        };

        /**
         * 전체 노드 중 Custom Color 노드 반환
         * @param {VIZCore.color} color 
         * @returns {Array<Object>}
         * @example
         * 
         * let color = new VIZCore.Color(255, 125, 0, 255);
         * let nodes = vizwide3d.Object3D.GetNodeIDsByCustomColor(color);
         * 
         */
        this.GetNodeIDsByCustomColor = function (color) {
            let result = [];
            if (scope.Main.useTree) {
                result = scope.Main.Tree.GetNodeIDsByCustomColor(color);
            }
            else {
                result = scope.Main.Data.GetNodeIDsByCustomColor(color);
            }

            return result;
        };

        /**
        * 노드들 선택 가능 여부 설정
        * @param {Array<number>} ids objectid
        * @param {boolean} bEnable true : 선택 가능, false : 선택 불가능
        * @returns {Array<Object>}
        * @example
        *   
        * 
        * let arrayObjectID = [10, 20];
        * let bEnable = false;
        * let nodes = vizwide3d.Object3D.EnableUseSelectionMulti(objectid, bEnable);
        * 
        */
        this.EnableUseSelectionMulti = function (ids, bEnable) {
            let result = [];
            if (scope.Main.useTree) {
                result = scope.Main.Tree.EnableUseSelectionMulti(ids, bEnable);
            }
            else {
                result = scope.Main.Data.EnableUseSelectionMulti(ids, bEnable);
            }

            return result;
        };

        /**
         * Mesh Cache 메모리 우선 사용
         * @param {Object} fileKey 파일 ID
         * @example
         * let models = [];
         * models.push({url:"./VIZCore/Model/Sample1_wh.vizw", key:"sample1"});
         * vizwide3d.Model.AddHeader(models);
         * 
         * vizwide3d.Object3D.LockMeshCache("sample1");
         */
        this.LockMeshCache = function (fileKey) {
            scope.Main.Data.ModelFileManager.LockMeshCache(fileKey);
        };

        /**
         * Mesh Cache 메모리 우선 사용해제
         * @param {Object} fileKey 파일 ID
         * @example
         * let models = [];
         * models.push({url:"./VIZCore/Model/Sample1_wh.vizw", key:"sample1"});
         * vizwide3d.Model.AddHeader(models);
         * 
         * vizwide3d.Object3D.UnlockMeshCache("sample1");
         */
        this.UnlockMeshCache = function (fileKey) {
            scope.Main.Data.ModelFileManager.UnlockMeshCache(fileKey);
        };

        /**
         * 설정 거리보다 먼 경우 박스 로 표시
         * @param {Object} fileKey 파일 ID
         * @param {Number} distance 거리
         * @example
         * let models = [];
         * models.push({url:"./VIZCore/Model/Sample1_wh.vizw", key:"sample1"});
         * vizwide3d.Model.AddHeader(models);
         * 
         * vizwide3d.Object3D.SetViewDistanceBox('sample1', 0.5);
         */
        this.SetViewDistanceBox = function (fileKey, distance) {
            scope.Main.Data.ModelFileManager.SetMeshViewDistance(fileKey, distance);
        };

        /**
         * 설정 거리보다 먼 경우 박스 표시 해제
         * @param {Object} fileKey 파일 ID
         * @example
         * let models = [];
         * models.push({url:"./VIZCore/Model/Sample1_wh.vizw", key:"sample1"});
         * vizwide3d.Model.AddHeader(models);
         * 
         * vizwide3d.Object3D.DisableViewDistanceBox("sample1");
         */
        this.DisableViewDistanceBox = function (fileKey) {
            scope.Main.Data.ModelFileManager.SetMeshViewDistance(fileKey, -1);
        };

        /**
         * BBox 영역 내 노드 반환
         * @param {VIZCore.BBox} bbox BoundBox
         * @param {Boolean} union 전체 포함 여부
         * @returns Nodes
         * @example
         * let bbox = vizwide3d.Object3D.GetBoundBox();
         * 
         * let nodes = vizwide3d.Object3D.GetInnerObjects(bbox, true);
         */
        this.GetInnerObjects = function (bbox, union) {
            let obj = scope.Main.Tree.GetInnerObjectsByBBox(bbox, union);

            let result = [];
            for (let i = 0; i < obj.length; i++) {
                result.push(ExportNodeInfo(obj[i]));
            }


            return result;
        };

        /**
         * 지정한 개체 설정 거리보다 먼 경우 박스 표시 설정 미적용
         * 
         * SetViewDistanceBox으로 지정한 파일 ID만 적용
         * @param {*} filekey 파일 ID
         * @param {Number} origin_id 
         * @param {Boolean} disable true : 미적용으로 설정 , false : 적용
         * @example
         * 
         * let models = [];
         * models.push({url:"./VIZCore/Model/Sample1_wh.vizw", key:"sample1"});
         * vizwide3d.Model.AddHeader(models);
         * 
         * function exampleButtonClick() {
         *      vizwide3d.Object3D.SetViewDistanceBox("sample1", 100);
         *      vizwide3d.Object3D.SetObjectDisableViewDistanceBBox("sample1", 10, true);
         * }
         */
        this.SetObjectDisableViewDistanceBBox = function (filekey, origin_id, disable) {
            scope.SetObjectDisableViewDistanceBBoxByArray(filekey, [origin_id], disable);
        };

        /**
         * 지정한 개체 설정 거리보다 먼 경우 박스 표시 설정 미적용
         * 
         * SetViewDistanceBox으로 지정한 파일 ID만 적용
         * @param {*} filekey 파일 ID
         * @param {Number} origin_id 
         * @param {Boolean} disable true : 미적용으로 설정 , false : 적용
         * @example
         * 
         * let models = [];
         * models.push({url:"./VIZCore/Model/Sample1_wh.vizw", key:"sample1"});
         * vizwide3d.Model.AddHeader(models);
         * 
         * function exampleButtonClick() {
         *      let arrayObjectID = [10, 20];
         * 
         *      vizwide3d.Object3D.SetViewDistanceBox("sample1", 100);
         *      vizwide3d.Object3D.SetObjectDisableViewDistanceBBoxByArray("sample1", arrayObjectID, true);
         * }
         */
        this.SetObjectDisableViewDistanceBBoxByArray = function (filekey, origin_ids, disable) {
            scope.Main.Data.ModelFileManager.SetDisableViewDistanceBBox(filekey, origin_ids, disable, false);
            scope.Main.ViewRefresh();
        };


        //=======================================
        // Event
        //=======================================
        /**
         * 개체 선택 이벤트 등록
         * @param {Object} listener Event Listener
         * @example
         * // Add Event Handler : Object Selected Event (개체 선택 이벤트)
         * vizwide3d.Object3D.OnObject3DSelected(OnObject3DSelected);
         *
         * //=======================================
         * // Event :: OnObject3DSelectedEvent
         * //=======================================
         * let OnObject3DSelected = function (event) {
         *     // 선택된 모델이 없음
         *     if (event.data.id == -1) {
         *         //alert('선택된 모델이 없거나, 기존 선택상태가 해제됨.');
         *     }
         *     // 선택된 모델이 있음
         *     else {
         *         // 지정된 ID의 노드 정보 조회
         *         let node = vizwide3d.Object3D.FromID(event.data.id);
         *
         *         let nodeId = node.id;
         *         let nodeIndex = node.index;
         *         let nodeKind = node.kind;
         *         let nodeKindStr = node.kindStr;
         *         let nodeParentId = node.parentId;
         *         let nodeName = node.name;
         *         let nodeLevel = node.level;
         *         let selection = node.selection;
         *         let visible = node.visible;
         *         let nodeBoundBox = node.boundBox;
         *     }
         * }
         */
        this.OnObject3DSelected = function (listener) {
            scope.Main.EventHandler.addEventListener(VIZCore.Enum.EVENT_TYPES.Model.Select, listener);
        };


        /**
         * 선택상자 선택 이벤트 등록
         * @param {Object} listener Event Listener
         * @example
         * // Add Event Handler : Object SelectBox Selected Event (선택상자 선택 이벤트)
         * vizwide3d.Object3D.OnBoxSelected(OnBoxSelected);
         *
         * //=======================================
         * // Event :: OnBoxSelectedEvent
         * //=======================================
         * let OnBoxSelected = function (event) {
         *      //event.data == Object ID List
         * 
         *      if(event.data.length <= 0) {
         *          // 선택된 모델이 없음
         *      }
         *      else
         *      {
         *          //해당 노드 포커스
         *          //vizwide3d.View.FocusObjectByNodeID(event.data.id);
         *      }
         * }
         */
        this.OnBoxSelected = function (listener) {
            scope.Main.EventHandler.addEventListener(VIZCore.Enum.EVENT_TYPES.Model.BoxSelect, listener);
        };
    }
}

export default Object3D;