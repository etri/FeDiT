/**
 * VIZCore UDA 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
class UDA {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;


        //=======================================
        // Method
        //=======================================
        /**
         * 속성 키 목록 반환
         * @returns {Array} 키 목록 배열
         * @example
         * let keys = [];
         *
         * keys = vizwide3d.Object3D.UDA.GetKeys();
         */
        this.GetKeys = function () {
            return scope.Main.Property.GetKeys();
        };

        /**
         * 속성 키에 해당하는 값 목록 반환
         * @param {String} key 속성 키(Key)
         * @returns {Array} 값(Value) 목록 배열
         * @example
         * let values = [];
         *
         * values = vizwide3d.Object3D.UDA.GetValues("TYPE");
         */
        this.GetValues = function (key) {
            return scope.Main.Property.GetValues(key);
        };

        /**
         * 아이디에 해당하는 노드에서 특정 키의 값 반환
         * @param {Number} id 노드 아이디
         * @param {String} key 속성 키(Key)
         * @returns {String} 값(Value)
         * @example
         * let nodeId = 5;
         * let key = "TYPE";
         *
         * let value = vizwide3d.Object3D.UDA.GetValueByKeyFromNodeId(nodeId, key);
         */
        this.GetValueByKeyFromNodeId = function (id, key) {
            return scope.Main.Property.GetPropertyValue(id, key);
        };

        /**
         * 속성(KEY, VALUE)에 해당하는 NODE ID 배열
         * @param {String} key 속성 Key
         * @param {String} value 속성 Value
         * @returns {Array} NODE IDs
         * @example
         * let uda_nodeIDs = vizwide3d.Object3D.UDA.GetNodeIDs("NAME", "/NO1_FLEX_G3");
         *
         * if (uda_nodeIDs !== undefined) {
         *     for (let i = 0; i < uda_nodeIDs.length; i++) {
         *         console.log("NAME : /NO1_FLEX_G3 - NODEID: " + uda_nodeIDs[i]);
         *     }
         * }
         */
        this.GetNodeIDs = function (key, value) {
            return scope.Main.Property.GetNodeIDsByKeyValue(key, value);
        };

        /**
         * 전체 속성별 노드 정보 반환
         * @returns {Object} {keyMap : Key 기준 노드 정렬 맵, valueMap : value 기준 노드 정렬 맵, keyvalueMap : key+value 기준 노드 정렬 맵}
         * @example
         *  let mapInfo = vizwide3d.Object3D.UDA.GetPropertyInfo();
         *  console.log(mapInfo);
         */
        this.GetPropertyInfo = function(){
            return scope.Main.Property.GetPropertyMap();
        };

        /**
         * 속성(VALUE)에 해당하는 NODE ID 배열
         * @param {String} value 속성 Value
         * @returns {Array} NODE IDs
         * @example
         * let uda_nodeIDs = vizwide3d.Object3D.UDA.GetNodeIDsByValue("/NO1_FLEX_G3", true);
         *
         * if (uda_nodeIDs !== undefined) {
         *     for (let i = 0; i < uda_nodeIDs.length; i++) {
         *         console.log("NAME : /NO1_FLEX_G3 - NODEID: " + uda_nodeIDs[i]);
         *     }
         * }
         */
         this.GetNodeIDsByValue = function (value, fullMatch) {
            return scope.Main.Property.GetNodeIDsByValue(value, fullMatch);
        };

        /**
         * 속성(KEY, VALUE)에 해당하는 BODY ID 배열
         * @param {String} key 속성 Key
         * @param {String} value 속성 Value
         * @returns {Array} BODY ID
         * @example
         * let uda_bodyIDs = vizwide3d.Object3D.UDA.GetBodyIDs("NAME", "/NO1_FLEX_G3");
         *
         * if (uda_bodyIDs !== undefined) {
         *     for (let i = 0; i < uda_bodyIDs.length; i++) {
         *         console.log("NAME : /NO1_FLEX_G3 - BODYID: " + uda_bodyIDs[i]);
         *     }
         * }
         */
        this.GetBodyIDs = function (key, value) {
            return scope.Main.Property.GetBodyIDsByKeyValue(key, value);
        };

        /**
         * 속성(KEY, VALUE)에 해당하는 개체 선택
         * @param {String} key 속성 Key
         * @param {String} value 속성 Value
         * @returns {Array} NODE IDs
         * @example
         * let uda_NodeID = vizwide3d.Object3D.UDA.Select("NAME", "/NO1_FLEX_G3");
         *
         * if (uda_NodeID !== undefined) {
         *     for (let i = 0; i < uda_NodeID.length; i++) {
         *         console.log("NAME : /NO1_FLEX_G3 - NODEID: " + uda_NodeID[i]);
         *     }
         * }
         */
        this.Select = function (key, value) {
            return scope.Main.Property.SelectByProperty(key, value);
        };

        /**
         * Node ID에 해당하는 속성 정보 반환
         * @param {Number} nodeId 노드 아이디
         * @returns {Array} 사용자 정의 속성
         * @example
         * let nodeId = 5;
         * 
         * let fromNodeId = vizwide3d.Object3D.UDA.FromNodeID(nodeId);
         */
        this.FromNodeID = function (nodeId) {
            return scope.Main.Property.GetPropertyByID(nodeId);
        };

        /**
         * FileID, OriginID에 해당하는 속성 정보 반환
         * @param {Object} fileid File ID
         * @param {Number} originid Origin ID
         * @returns {Array} 사용자 정의 속성
         * @example
         * let node = vizwide3d.Object3D.UDA.FromOrigin("FileKey", 1);
         */
        this.FromOrigin = function(fileid, originid) {
            let id = scope.Main.Tree.GetNodeIDByOrigin(fileid, originid);
            return scope.FromNodeID(id);
        };

        /**
         * 지정된 개체의 기존 속성을 유지한채 속성을 추가
         * @param {Number} nodeId 노드 아이디
         * @param {String} key 속성 Key
         * @param {String} value 속성 value
         * @example
         * let nodeId = 5;
         * let key = "NAME";
         * let value = "/NO1_FLEX_G3";
         * 
         * vizwide3d.Object3D.UDA.AddByNodeID(nodeId, key, value);
         */
        this.AddByNodeID = function (nodeId, key, value) {
            scope.Main.Property.AddProperty(nodeId, key, value);
        };

         /**
         * 지정된 개체의 해당 속성을 삭제
         * @param {Number} nodeId 노드 아이디
         * @param {String} key 속성 Key
         * @example
         * let nodeId = 5;
         * let key = "TYPE";
         * 
         * vizwide3d.Object3D.UDA.DeleteKeyByNodeID(nodeId, key);
         */
           this.DeleteKeyByNodeID = function (nodeId, key) {
            scope.Main.Property.DeletePropertyKeyByID(nodeId, key);
        };

         /**
         * 지정된 개체에 기존 속성을 유지한채 속성을 추가
         * @param {Number} nodeId 노드 아이디
         * @example
         * let nodeId = 5;
         * 
         * vizwide3d.Object3D.UDA.DeleteByNodeID(nodeId);
         */
          this.DeleteByNodeID = function (nodeId) {
            scope.Main.Property.DeletePropertyID(nodeId);
        };




        /**
         * UDA (User-Defined Attributes) Dialog 
         * @example
         * let visible = vizwide3d.Object3D.UDA.IsVisibleUDADialog();
         */
        this.IsVisibleUDADialog = function() {
            return scope.Main.Property.Visible;
        };

        /**
         * UDA (User-Defined Attributes) Dialog 보이기 숨기기
         * @param {boolean} visible true : 보이기, false : 숨기기
         * @example
         * 
         * vizwide3d.Object3D.UDA.ShowUDADialog(true);
         */
        this.ShowUDADialog = function(visible) {
            scope.Main.Property.Show(visible);
        };

        
        /**
         * Show Data(Refresh) To UDA Dialog
         * @param {Number} nodeId 노드 아이디
         * @example
         * let nodeId = 5;
         * 
         * vizwide3d.Object3D.UDA.ShowDataToUDADialog(nodeId);
         */
        this.ShowDataToUDADialog = function(nodeId)
        {
            scope.Main.Property.Request(nodeId);
        }

        /**
         * Clear Data(Refresh) To UDA Dialog
         * @example
         * 
         * vizwide3d.Object3D.UDA.ClearDataToUDADialog();
         */
        this.ClearDataToUDADialog = function()
        {
            scope.Main.Property.Clear();
        };

        /**
         * 사용자 추가 속성 오브젝트 반환
         * @param {String} key : 키
         * @param {String} value : 값
         * @returns {Object} {key:'', value:''}
         */
        this.GetCustomDataItem = function(key, value)
        {
            return scope.Main.Data.PropertyValueItem(key, value);
        };

        /**
         * 휘발성 사용자 정의 속성 설정
         * 속성 최상단에 추가
         * Object 선택 이벤트와 연동하여 사용 권장
         * @param {Number} id : NodeID
         * @param {Array} items : 사용자 추가 속성 아이템 목록
         * @example
         * let id = 3;
         * let items = [];
         * for (let index = 0; index < 3; index++) {
         *     let item = vizwide3d.Object3D.UDA.GetCustomDataItem("key" + index, "value" + index);
         *     items.push(item);
         * }
         * vizwide3d.Object3D.UDA.SetCustomDataByNodeID(id, items);
         */
        this.SetCustomDataByNodeID = function(id, items)
        {
            scope.Main.Property.SetPropertyByItem(id, items);
        };

        //=======================================
        // Event
        //=======================================
    }
}

export default UDA;