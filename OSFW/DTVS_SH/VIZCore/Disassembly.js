/**
 * VIZCore Disassembly 모듈
 * @copyright © 2013 - 2022 SOFTHILLS Co., Ltd. All rights reserved.
 * @param {Object} view View.js Instance
 * @param {Object} VIZCore ValueObject.js Instance
 * @class
 */
 class Disassembly {
    constructor(view, VIZCore) {
        let scope = this;

        let GroupNodesID = new Map();
        
        init();
        function init() {
            GroupNodesID.clear();
        }

        /** 
         * 초기화
        */
        this.Clear = function () {
            init();
        };

        /**
         * 분해 그룹 추가
         * @param {Array<Number>} bodyIds 
         */
        this.AddGroup = function(groupID, bodyIds) {
            let item = scope.GetGroup(groupID);
            if(item === undefined) 
            {
                //신규
                item = [];
                for(let i = 0 ; i < bodyIds.length ; i++) {
                    item.push(bodyIds[i]);
                }
                GroupNodesID.set(groupID, item);
            }
            else
            {
                //기존
                for(let i = 0 ; i < bodyIds.length ; i++) {
                    item.push(bodyIds[i]);
                }
            }            
        };

        /**
         * 분해 그룹 제거
         * @param {*} groupID 
         */
        this.DeleteGroup = function(groupID) {
            let item = scope.GetGroup(groupID);
            if(item === undefined) return;

            GroupNodesID.delete(groupID);
        };

        /**
         * 분해 그룹 초기화
         */
        this.ClearGroup = function() {
            GroupNodesID.clear();
        };

        /**
         * 분해 그룹 노드 반환
         * @param {*} groupID 
         * @returns BodyID
         */        
        this.GetGroup = function (groupID) {
            if(!GroupNodesID.has(groupID)) return undefined;

            return GroupNodesID[groupID];
        };

        /**
         * 분해
         * @param {Number} processType : 0 = 지정된 그룹으로 분해, 1 = 선택 개체 분해, 2 = 전체 분해
         * @param {Number} distRate : 분해 거리 비율 (기본값 1.0)
         * @returns 
         */
        this.ProcessDisassembly = function(processType, distRate)
        {
            //let fSrcSizeRate = 1.0;
            if(distRate === undefined) distRate = 1.0;
            
            let fSrcSizeRate = distRate;

            //위치 초기화
            //view.Interface.Object3D.Transform.RestoreTransformAll();

            //Treebody
            let bodies = view.Tree.GetNodeByType(VIZCore.Enum.ENTITY_TYPES.EntBody);
            //Body별 GroupKey 등록
            //Key : BodyID, Value : GroupKey
            let groupBodyID = new Map();
            
            // 분해 대상 BodyID리스트
            let listBodyID = [];

            //body 연결
            if(processType === 0){
                //그룹으로 등록
                let findGroupTreeBody = function(value, key, map) {

                    let group = value;
                    for(let g = 0 ; g < group.length ; g++) {
                        for(let i = 0 ; i < bodies.length ; i++) {
                            let body = bodies[i];
                            if(groupBodyID.has(body.node_id)) continue;
                            if(group[g] !== body.node_id) continue;
                            
                            groupBodyID.set(body.node_id, key);
                            listBodyID.push(body.node_id);
                        }
                    }
                };

                GroupNodesID.forEach(findGroupTreeBody);                
            }
            else if(processType === 1){
                //선택
                for(let i = 0 ; i < bodies.length ; i++) {
                    let body = bodies[i];

                    if(!body.visible) continue;
                    if(!body.selection) continue;
                    
                    if(groupBodyID.has(body.node_id)) continue;

                    groupBodyID.set(body.node_id, body.node_id);
                    //mapBodyIndex.add(body.node_id, i);
                    listBodyID.push(body.node_id);
                }
            }
            else {
                //전체
                for(let i = 0 ; i < bodies.length ; i++) {
                    let body = bodies[i];

                    if(groupBodyID.has(body.node_id)) continue;

                    groupBodyID.set(body.node_id, body.node_id);
                    listBodyID.push(body.node_id);
                }
            }

            //이동 없음
            if(listBodyID.length <= 0) return;

            {
                 //Body info List
                 //let listProcessBodeis = view.Data.GetBodies(listBodyID);
                 let listProcessItems = view.Tree.GetDataToNode(listBodyID);

                 //분해 모든 대상에 bbox
                 //let bbox = view.Data.GetBBox(listProcessBodeis);
                 //let bbox = view.Tree.GetBBoxByNodeInfo(listProcessItems);
                 let bbox = view.Tree.GetBBoxArrayID(listBodyID);
 
                 // 그룹별 Body Object 리스트
                 // 그룹 Key, [개체 Object]
                 let mapGroupObjects = new Map();
                 
                 //그룹 지정            
                 for(let i = 0 ; i < listProcessItems.length ; i++) {
                     let item = listProcessItems[i];
                     let groupKey = groupBodyID.get(item.node_id);
                     
                     if(mapGroupObjects.has(groupKey)) {
                         let list = mapGroupObjects.get(groupKey);
                         list.push(item);
                     }
                     else {
                         let list = [];
                         list.push(item);
                         mapGroupObjects.set(groupKey, list);
                     }
                 }

                 // key: NodeID, value: Transform
                 let mapUpdateObjectTransform = new Map();
 
                 // 그룹 단위 분해 위치 갱신
                 let updateDisassemblyTransform = function (value, key, map) {
                     //그룹 단위 BBox
                     //let groupBBox = view.Data.GetBBox(value);

                     let groupObjIDs = [];
                     for(let i = 0 ; i < value.length ; i++) {
                        let item = value[i];
                        groupObjIDs[i] = item.node_id;
                     }

                     //let groupBBox = view.Tree.GetBBoxByNodeInfo(value);
                     let groupBBox = view.Tree.GetBBoxArrayID(groupObjIDs);

                     let vMove = new VIZCore.Vector3().subVectors(groupBBox.center, bbox.center);
                     vMove = vMove.multiplyScalar(fSrcSizeRate);
 
                     for(let i = 0 ; i < value.length ; i++) {
                         let item = value[i];

                         let matCurrent = new VIZCore.Matrix4();
                         if(item.transform !== undefined)
                            matCurrent.copy(item.transform);
                         let matMove = new VIZCore.Matrix4();
                         matMove.makeTranslation(vMove.x, vMove.y, vMove.z);
 
                         let matTrans = new VIZCore.Matrix4().multiplyMatrices(matMove, matCurrent);
                         mapUpdateObjectTransform.set(item.node_id, matTrans);
                         //view.Tree.SetObjectTransform([ item.node_id ], matTrans);
 
                         //Animation 적용을 위한 내용..
                         // m_data.m_pNodeAniInfo[bodyUpdateNum].nodeIndex = i;
                         // m_data.m_pNodeAniInfo[bodyUpdateNum].matStart = m_data.m_ppNode[i]->GetTransform();
 
                         // // Matrix 적용
                         // m_data.m_ppNode[i]->SetTransform(matMove*matCurrent);
             
                         // m_data.m_pNodeAniInfo[bodyUpdateNum].matEnd = m_data.m_ppNode[i]->GetTransform();
                         // bodyUpdateNum++;
                     }
 
                 };
                 
                 mapGroupObjects.forEach(updateDisassemblyTransform);
                 
                 view.Tree.SetMultiObjectTransform(
                    Array.from(mapUpdateObjectTransform.keys()), Array.from(mapUpdateObjectTransform.values()));
 
                 
                 view.Data.UpdateAllObjectsBBox();
                 view.Camera.ResizeGLWindow();
 
                 view.ViewRefresh();
            }

        };
    };

    
}


export default Disassembly;