/**
 * VIZCore Group 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} main Main Instance
 * @param {Object} VIZCore ValueObject Instance
 * @class
 */
class IGroup {
    constructor(main, VIZCore) {
        this.scope = this;
        this.view = main;
        this.VIZCore = VIZCore;
    }

    //=======================================
    // Method
    //=======================================
     /**
     * Group Item 반환
     * @returns {Object} GroupItem
     */
    GroupItem(){
        let view = this.scope.view;
        return view.Group.GroupItem();
    }

    /**
     * Group Key
     * @returns {Array<*>} groupId
     */
    GetKeys() {
        let view = this.scope.view;
        return view.Group.GetKeys();
    }

    /**
     * Group List
     * @returns {Array<*>} groupItem
     */
    GetList() {
        let view = this.scope.view;
        return view.Group.GetList();
    }

    /**
     * Group Key
     * @returns {Array<*>} groupId
     */
    GroupList() {
        let view = this.scope.view;
        return view.Group.GroupList();
    }

    /**
     * Group 반환
     * @param {*} groupId 
     * @returns 
     */
    Get(groupId) {
        let view = this.scope.view;
        return view.Group.Get(groupId);
    }

    /**
     * 그룹 생성
     * @param {*} groupId 
     * @param {Array<Number>} BodyIds body ids
     * @returns {Object} Group ID
     */
    Add(groupId, BodyIds){
        let view = this.scope.view;
        let VIZCore = this.scope.VIZCore;
        return view.Group.Add(groupId, BodyIds);
    }

    /**
     * 그룹 생성(선택 개체)
     * @param {*} groupId 
     * @returns {Object} Group ID
     */
    AddBySelect(groupId){
        let view = this.scope.view;
        return view.Group.AddBySelect(groupId);
    }

    /**
     * 그룹 생성
     * @param {*} groupId 
     * @param {Array<Object>} nodes Node Array
     * @returns {Object} Group ID
     */
    AddByNode(groupId, nodes){
        let view = this.scope.view;
        return view.Group.AddByNode(groupId, nodes);
    }

     /**
     * 그룹 삭제
     * @param {*} groupId Group ID
     */
    Delete(groupId){
        let view = this.scope.view;
        view.Group.Delete(groupId);
    }

    /**
     * Group Edge 활성화 설정
     * @param {*} groupId Group ID
     * @param {boolean} effect Edge 효과 사용 여부
     */
    SetEffect(groupId, effect){
        let view = this.scope.view;
        view.Group.SetEffect(groupId, effect);
    }

    Select(groupId, selection, append){
        let view = this.scope.view;
        view.Group.Select(groupId, selection, append);
    }

    Show(groupId, visible){
        let view = this.scope.view;
        view.Group.Show(groupId, visible);
    }

    //=======================================
    // Event
    //=======================================
}

export default IGroup;