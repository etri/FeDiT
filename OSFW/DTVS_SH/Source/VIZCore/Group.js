class Group {

    constructor(view, VIZCore) {
        this.Groups = new Map(); // Key : GroupId, Value : GroupItem
        this.view = view;
        this.VIZCore = VIZCore;
    }

    GroupItem(){
        //let id = this.view.Data.UUIDv4();
        let item = {
            id : undefined,//undefined,
            //paranetId : undefined, // 1Level 관리
            title : undefined,
            items : [], // BodyIds
            effect : true
        }
        return item;
    }

    Clear() {
        this.Groups.clear();
    }
    
    /**
     * Group Key
     * @returns {Array<*>} groupId
     */
    GetKeys() {
        return Array.from(this.Groups.keys());
    }

    /**
     * Group List
     * @returns {Array<*>} groupItem
     */
    GetList() {
        return Array.from(this.Groups.values());
    }

    /**
     * Group Key
     * @returns {Array<*>} groupId
     */
    GroupList() {
        return Array.from(this.Groups.keys());
    }

    /**
     * Group 반환
     * @param {*} groupId 
     * @returns 
     */
    Get(groupId) {
        let item = this.Groups.get(groupId);
        
        if(item === undefined) return undefined;
    
        return item.items;
    }

    /**
     * Group Edge 활성화 설정
     * @param {*} groupId 
     * @param {boolean} effect 
     * @returns 
     */
    SetEffect(groupId, effect){
        let item = this.Groups.get(groupId);
        if(item === undefined)
            return;
        item.effect = effect;
    }

    /**
     * 그룹 생성
     * @param {*} groupId 
     * @param {Array<Number>} BodyIds body ids
     * @returns 
     */
    Add(groupId, BodyIds){
        if(BodyIds === undefined) return undefined;
    
        let item = this.GroupItem();
        item.id = groupId;
        item.items = BodyIds;
        this.Groups.set(item.id, item);

        return item.id;
    }

    AddBySelect(groupId){
        // 선택 정보 반환
        let bodies = this.view.Data.GetSelection();
        return this.Add(groupId, bodies);
    }

    AddByNode(groupId, nodes){
        let nodeIds = [];
        for (let i = 0; i < nodes.length; i++) {
            nodeIds.push(nodes[i].id);
        }
        //let ids = this.view.GetBodyIds(nodeIds);
        let ids = this.view.Tree.GetBodyIds(nodeIds);

        return this.Add(groupId, ids);
    }

    Delete(groupId){
        this.Groups.delete(groupId);
    }

    Select(groupId, selection, append){
        let ids = this.Get(groupId);
        if(ids !== undefined)
        {
            if(selection === undefined)
                selection = true;
            if(append === undefined)
                append = false;

            this.view.Renderer.Lock();

            if(this.view.useTree)
            {
                this.view.Tree.SelectMulti(ids, selection, append);
            }
            else{
                for (let i = 0; i < ids.length; i++) {
                    this.view.Data.Select(ids[i], selection, append);
                }
            }

            this.view.Renderer.Unlock();
            
            this.view.ViewRefresh();
        }
    }

    Show(groupId, visible){
        let ids = this.Get(groupId);
        if(ids !== undefined)
        {
            if(visible === undefined)
                visible = true;

            this.view.Renderer.Lock();
            
            if(this.view.useTree) {
                this.view.Tree.ShowMulti(ids, visible);
            }
            else{
                this.view.Data.ShowMulti(ids, visible);
            }

            this.view.Renderer.Unlock();

            this.view.ViewRefresh();
        }
    }

    CustomColor(groupId, color){
        let ids = this.Get(groupId);
        if(ids !== undefined)
        {
            //this.view.Renderer.Lock();
            
            if(this.view.useTree)
                this.view.Tree.SetObjectCustomColor(ids, color);
            else
                this.view.Data.SetObjectCustomColor(ids, color);

            //this.view.Renderer.Unlock();

            //SetObjectCustomColor 에서 처리
            //this.view.ViewRefresh();
        }
    }


}

export default Group;