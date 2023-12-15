/**
 * VIZCore Control 인터페이스
 * @copyright © 2013 - 2022 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
 class Disassembly {
    constructor(main, VIZCore) {
        let scope = this;

        this.Main = main;

        //=======================================
        // Method
        //=======================================
        
        /**
         * 지정된 그룹으로 분해
         * @param {Number} rate : 거리 비율 (기본값 1.0)
         * @example
         *
         * //Object ID Array
         * let group1 = [2];
         * let group2 = [3];
         * 
         * //Set Group
         * vizwide3d.Disassembly.AddGroup("g1", group1);
         * vizwide3d.Disassembly.AddGroup("g2", group2);

         * vizwide3d.Disassembly.DisassembleGroup();
         *
         **/
        this.DisassembleGroup = function(rate) {
            scope.Main.Disassembly.ProcessDisassembly(0, rate);
        };

        /**
         * 선택된 개체 분해
         * @param {Number} rate : 거리 비율 (기본값 1.0)
         * @example
         * 
         * vizwide3d.Disassembly.DisassembleSelect(1);
         */
        this.DisassembleSelect = function(rate) {
            scope.Main.Disassembly.ProcessDisassembly(1, rate);
        };

        /**
         * 전체 개체 분해
         * @param {Number} rate : 거리 비율 (기본값 1.0)
         * @example
         * 
         * vizwide3d.Disassembly.DisassembleAll(1);
         */
        this.DisassembleAll = function(rate) {
            scope.Main.Disassembly.ProcessDisassembly(2, rate);
        };

        /**
         * 분해 그룹 지정
         * @param {String} groupID : Group ID
         * @param {Array<Number>} ids : object ID List
         * @example
         * 
         * //Object ID Array
         * let group1 = [2];
         * let group2 = [3];
         * 
         * vizwide3d.Disassembly.AddGroup("g1", group1);
         * vizwide3d.Disassembly.AddGroup("g2", group2);
         */
        this.AddGroup = function(groupID, ids) {

            //Body
            //let bodies = scope.Main.Interface.Object3D.GetBodiesByNodeID(ids);
            // let bodyIds = [];
            // for (let i = 0; i < bodies.length; i++) {
            //     bodyIds.push(bodies[i].bodyId);
            // }

            let bodyIds = scope.Main.Tree.GetBodyIds(ids);

            if(bodyIds.length > 0)
                scope.Main.Disassembly.AddGroup(groupID, bodyIds);
        };

        /**
         * 분해 그룹 제거
         * @param {String} groupID : Group ID
         * @example
         * 
         * //Object ID Array
         * let group1 = [2];
         * 
         * vizwide3d.Disassembly.AddGroup("g1", group1);
         * 
         * vizwide3d.Disassembly.DeleteGroup(group1);
         */
        this.DeleteGroup = function(groupID) {
            scope.Main.Disassembly.DeleteGroup(groupID);
        };


        /**
         * 분해 모든 그룹 제거
         * @example
         * 
         * vizwide3d.Disassembly.ClearGroup();
         */
        this.ClearGroup = function() {
            scope.Main.Disassembly.ClearGroup();
        };

        /**
         * 위치 초기화
         * @example
         * 
         * vizwide3d.Disassembly.RestoreAll();
         */
        this.RestoreAll = function() {
            scope.Main.Interface.Object3D.Transform.RestoreTransformAll();
        };

        /**
         * 특정 그룹 위치 초기화
         * @param {String} groupID : Group ID
         * @example
         * 
         * //Object ID Array
         * let group1 = [2];
         * 
         * vizwide3d.Disassembly.AddGroup("g1", group1);
         * 
         * vizwide3d.Disassembly.RestoreGroup(group1);
         */
        this.RestoreGroup = function(groupID) {
            let objectsID = scope.Main.Disassembly.GetGroup(groupID);
            if(objectsID === undefined) return;

            scope.Main.Interface.Object3D.Transform.RestoreTransformByBodyID(objectsID);
        };


        //=======================================
        // Event
        //=======================================
    }
}

export default Disassembly;