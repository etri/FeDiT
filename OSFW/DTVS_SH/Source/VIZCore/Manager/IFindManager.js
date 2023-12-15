/**
 * VIZCore Find 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @param {Object} object3d Object3D Instance
 * @class
 */
class Find {
    constructor(main, VIZCore, object3d) {
        let scope = this;

        this.Main = main;
        this.Object3D = object3d;

        //=======================================
        // Method
        //=======================================
        /**
         * 노드 이름에 해당하는 노드 반환
         * @param {String} keyword 검색어
         * @param {Boolean} fullMatch 검색어 일치 여부 - True(일치), False(포함)
         * @returns {Array} Node Array
         * @example
         * let nodes = vizwide3d.Object3D.Find.QuickSearch(
         *          'PIPE101'   // Keyword
         *          , true      // Full Match
         *          );
         *
         *  vizwide3d.Object3D.Color.SetColorByNode(nodes, new VIZCore.Color(255, 125, 0, 255));
         */
        this.QuickSearch = function (keyword, fullMatch) {
            let inodes = scope.Main.Tree.FindNodeByName(keyword, fullMatch);

            let nodes = [];

            for (let i = 0; i < inodes.length; i++) {
                let node = scope.Object3D.FromID(inodes[i].node_id);
                nodes.push(node);
            }

            return nodes;
        };

        /**
         * 노드 이름에 해당하는 노드 반환
         * @param {String} keyword 검색어
         * @param {Boolean} fullMatch 검색어 일치 여부 - True(일치), False(포함)
         * @returns {Array} Node Array
         * @example
         * let nodes = vizwide3d.Object3D.Find.GetNodeByName(
         *          'PIPE101'   // Keyword
         *          , true      // Full Match
         *          );
         *
         *  vizwide3d.Object3D.Color.SetColorByNode(nodes, new VIZCore.Color(255, 125, 0, 255));
         */
        this.GetNodeByName = function (keyword, fullMatch) {
            let inodes = scope.Main.Tree.FindNodeByName(keyword, fullMatch);

            let nodes = [];

            for (let i = 0; i < inodes.length; i++) {
                let node = scope.Object3D.FromID(inodes[i].node_id);
                nodes.push(node);
            }

            return nodes;
        };

        /**
         * 노드 이름에 해당하는 노드 반환
         * @param {Array} keyword 검색어 목록
         * @param {Boolean} fullMatch 검색어 일치 여부 - True(일치), False(포함)
         * @returns {Array} Node Array
         * @example
         * let nodes = vizwide3d.Object3D.Find.GetNodeByNames(
         *          ['PIPE101','PIPE101']   // Keyword
         *          , true      // Full Match
         *          );
         *
         *  vizwide3d.Object3D.Color.SetColorByNode(nodes, new VIZCore.Color(255, 125, 0, 255));
         */
         this.GetNodeByNames = function (keyword, fullMatch) {
            let inodes = scope.Main.Tree.FindNodeByName(keyword, fullMatch);
            let nodes = [];
            for (let i = 0; i < inodes.length; i++) {
                let node = scope.Object3D.FromID(inodes[i].node_id);
                nodes.push(node);
            }
            return nodes;
        };

        /**
         * 노드 이름에 해당하는 노드맵 반환
         * @param {Array} keyword 검색어 목록
         * @param {Boolean} fullMatch 검색어 일치 여부 - True(일치), False(포함)
         * @param {Boolean} importChild 하위 노드 포함 여부 - True(포함), False(포함하지 않음)
         * @param {Boolean} importRest 검색 대상이 아닌 노드 포함 여부 - True(포함), False(포함하지 않음)
         * @returns {Map} Node map
         */
        this.GetNodeMapByNames = function(keywords, fullMatch, importChild, importRest, onlyBody){
            let map = scope.Main.Tree.FindNodeByNames(keywords, fullMatch, importChild, importRest, onlyBody);
            return map;
        };

        this.GetNodeBySubstring = function (keyword, start, end, contains, level, option) {
            let inodes = scope.Main.Tree.FindNodeBySubstring(keyword, start, end, contains, level, option);
            if(Array.isArray(inodes))
            {
                let nodes = [];
                for (let i = 0; i < inodes.length; i++) {
                    let node = scope.Object3D.FromID(inodes[i].node_id);
                    nodes.push(node);
                }
                return nodes;
            }
            else
            {
                let nodeMap = new Map();
                inodes.forEach(function(value, key, map){
                    let nodes = [];
                    nodeMap.set(key, nodes);
                    for (let i = 0; i < value.length; i++) {
                        let node = scope.Object3D.FromID(value[i].id);
                        nodes.push(node);
                    }
                });
                return nodeMap;
            }
            
        };


        //=======================================
        // Event
        //=======================================
    }
}

export default Find;