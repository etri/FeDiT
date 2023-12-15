/**
 * VIZCore Toolbar 인터페이스
 * @copyright © 2013 - 2021 SOFTHILLS Co., Ltd. All rights reserved.
 * @author SOFTHILLS <tech@softhills.net>
 * @param {Object} view HTML Element
 * @param {Object} vizwide3d VIZWide3D Instance
 * @class
 */
class ContextMenu {
    constructor(view, vizwide3d) {
        let scope = this;

        this.Element = new Map();

        create();

        function create(){
            initMenu();
        }

        function initMenu() {
            let divContext  = document.createElement('div');
            divContext.id = vizwide3d.Main.GetViewID() + "divContext";
            divContext.className = "vizwide_3d_divContext";
            view.appendChild(divContext);

            let divContext_Obj = scope.GetContextMenuObj();
            divContext_Obj.id = vizwide3d.Main.GetViewID() + "divContext";
            divContext_Obj.element = divContext;

            scope.Element.set(divContext_Obj.id, divContext_Obj);

            let divContextTitle  = document.createElement('div');
            divContextTitle.id = vizwide3d.Main.GetViewID() + "divContextTitle";
            divContextTitle.className = "vizwide_3d_divContext_title";
            divContext.appendChild(divContextTitle);

            let contextmenuEvent = function (cbEvent) {
                let e = cbEvent.data;

                let viewSize = view.getBoundingClientRect();
                divContext.style.display = "block";
                divContext.style.top = e.clientY - viewSize.top + "px";
                divContext.style.left = e.clientX - viewSize.left + "px";
                let divContextMenu = divContext.getBoundingClientRect();
                if (viewSize.right < divContextMenu.width + divContextMenu.left) {
                    if (viewSize.bottom < divContextMenu.height + divContextMenu.top) {
                        divContext.style.top = e.clientY - viewSize.top - divContextMenu.height + "px";
                        divContext.style.left = e.clientX - viewSize.left - divContextMenu.width + "px";
                    } else {
                        divContext.style.top = e.clientY - viewSize.top + "px";
                        divContext.style.left = e.clientX - viewSize.left - divContextMenu.width + "px";
                    }
                }
                else if (viewSize.bottom < divContextMenu.height + divContextMenu.top) {
                    if (viewSize.right < divContextMenu.width + divContextMenu.left) {
                        divContext.style.top = e.clientY - viewSize.top - divContextMenu.height + "px";
                        divContext.style.left = e.clientX - viewSize.left - divContextMenu.width + "px";
                    } else {
                        divContext.style.top = e.clientY - viewSize.top - divContextMenu.height + "px";
                        divContext.style.left = e.clientX - viewSize.left + "px";
                    }
                }
            };

            // Add Context Menu Event Handle
            vizwide3d.View.OnViewDefaultContextMenuEvent(contextmenuEvent);

            view.addEventListener('click', function(){
                divContext.style.display = "none";
            });

            // 홈 설정
            let menu_SetHomeView = scope.GetContextMenuObj();
            menu_SetHomeView.id = vizwide3d.Main.GetViewID() + "menu_SetHomeView";
            menu_SetHomeView.text = "홈 설정";

            let backupCameraID = -1;
            let cb_SetHome = function(){
                //vizwide3d.Object3D.ShowSelectedObject(false);
                backupCameraID = vizwide3d.View.BackupCamera();
            };
            let sub_SetHomeView = scope.GetContextMenuObj();
            sub_SetHomeView.id = vizwide3d.Main.GetViewID() + "subtest1";
            sub_SetHomeView.text = "현재 화면 홈으로 설정";
            sub_SetHomeView.callback = cb_SetHome;

            let cb_MoveHome = function(){
                if(backupCameraID !== -1)
                {
                    vizwide3d.View.RollbackCamera(backupCameraID);
                }
                else{
                    vizwide3d.View.FitAll();
                }
            };
            let sub_MoveHomeView = scope.GetContextMenuObj();
            sub_MoveHomeView.id = vizwide3d.Main.GetViewID() + "sub_MoveHomeView";
            sub_MoveHomeView.text = "홈 화면 이동";
            sub_MoveHomeView.callback = cb_MoveHome;

            menu_SetHomeView.subContextMenu = [sub_SetHomeView, sub_MoveHomeView];

            // 선택 숨기기 
            let cb_ShowSelectedObject = function(){
                vizwide3d.Object3D.ShowSelectedObject(false);
            };
            let menu_ShowSelectedObject = scope.GetContextMenuObj();
            menu_ShowSelectedObject.id = vizwide3d.Main.GetViewID() + "menu_ShowSelectedObject";
            menu_ShowSelectedObject.text = "선택 숨기기";
            menu_ShowSelectedObject.callback = cb_ShowSelectedObject;
            // 비선택 숨기기 vizwide3d.Object3D.HideUnselectedObject();
            let cb_HideUnselectedObject = function(){
                vizwide3d.Object3D.HideUnselectedObject();
            };
            let menu_HideUnselectedObject = scope.GetContextMenuObj();
            menu_HideUnselectedObject.id = vizwide3d.Main.GetViewID() + "menu_HideUnselectedObject";
            menu_HideUnselectedObject.text = "비선택 숨기기";
            menu_HideUnselectedObject.callback = cb_HideUnselectedObject;
            // 선택 해제 SelectByNode(nodes, selection, append) 
            let cb_Deselect = function(){
                // 선택 정보 반환
                let ids = vizwide3d.Object3D.GetSelectedObject3D();
                // 선택 해제
                vizwide3d.Object3D.SelectByNodeID(ids, false, false);
            };
            let menu_Deselect = scope.GetContextMenuObj();
            menu_Deselect.id = vizwide3d.Main.GetViewID() + "menu_Deselect";
            menu_Deselect.text = "선택 해제";
            menu_Deselect.callback = cb_Deselect;

            // 전체 보이기
            let cb_ShowAll = function(){
                vizwide3d.Object3D.ShowAll(true);
            };
            let menu_ShowAll = scope.GetContextMenuObj();
            menu_ShowAll.id = vizwide3d.Main.GetViewID() + "menu_ShowAll";
            menu_ShowAll.text = "전체 보이기";
            menu_ShowAll.callback = cb_ShowAll;

            // FocusObject Camera.FocusObject
            let cb_FocusedObject = function(){
                // 선택 개체 ID
                let selNode = vizwide3d.Object3D.GetSelectedObject3D();
                vizwide3d.View.EnableAnimation(true);
                // 포커스
                vizwide3d.View.FocusObjectByNodeID(selNode);
                vizwide3d.View.EnableAnimation(false);
            };
            let menu_FocusedObject = scope.GetContextMenuObj();
            menu_FocusedObject.id = vizwide3d.Main.GetViewID() + "menu_FocusedObject";
            menu_FocusedObject.text = "개체로 비행";
            menu_FocusedObject.callback = cb_FocusedObject;

            addContextMenu([menu_SetHomeView, menu_ShowSelectedObject, menu_HideUnselectedObject, menu_Deselect, menu_ShowAll, menu_FocusedObject ]);


            let cb_test1 = function(){
                console.log('test1');
            };

            let cb_test2 = function(){
                console.log('test2');
            };

            let subtest1 = scope.GetContextMenuObj();
            subtest1.id = vizwide3d.Main.GetViewID() + "subtest1";
            subtest1.text = "show all unassigned object";
            subtest1.callback = cb_test1;

            let subtest2 = scope.GetContextMenuObj();
            subtest2.id = vizwide3d.Main.GetViewID() + "subtest2";
            subtest2.text = "subtest2";
            subtest2.callback = cb_test2;

            let test1 = scope.GetContextMenuObj();
            test1.id = vizwide3d.Main.GetViewID() + "test1";
            test1.text = "test1";
            test1.subContextMenu = [subtest1, subtest2, subtest1, subtest1, subtest1];

            let test2 = scope.GetContextMenuObj();
            test2.id = vizwide3d.Main.GetViewID() + "test2";
            test2.text = "test2";

            let test3 = scope.GetContextMenuObj();
            test3.id = vizwide3d.Main.GetViewID() + "test3";
            test3.text = "test3";

            //addContextMenu([test1, test2, test3]);
        }

        function addContextMenu(Item){
            // GUID 생성
            function guid() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }

            let divContext = scope.Element.get(vizwide3d.Main.GetViewID() + "divContext");

            for (let index = 0; index < Item.length; index++) {
                // 서브 메뉴가 없는 경우
                if(Item[index].subContextMenu.length === 0){
                    // contextMenu div 생성
                    let contextMenu = document.createElement('div');
                    if(Item[index].id !== undefined){
                        contextMenu.id = Item[index].id;
                    }
                    else {
                        contextMenu.id = "contextMenu" + guid();
                    }
                    contextMenu.className = "vizwide_3d_contextmenu";

                    divContext.element.appendChild(contextMenu);
    
                    // contextMenu div element 추가
                    Item[index].element = contextMenu;
                    scope.Element.set(Item[index].id, Item[index]);
    
                    // contextMenuText div 생성
                    let contextMenuText = document.createElement('div');
                    contextMenuText.textContent = Item[index].text;
                    contextMenuText.className = "vizwide_3d_contextmenu_text";
                    contextMenu.appendChild(contextMenuText);
    
                    // contextMenu callback
                    if(Item[index].callback !== undefined){
                        contextMenu.addEventListener('click', function(){
                            Item[index].callback();
                            divContext.element.style.display = "none";
                        });
                    }
                }
                else {  // 서브 메뉴가 있는 경우
                    // contextMenu div 생성
                    let contextMenu = document.createElement('div');
                    if(Item[index].id !== undefined){
                        contextMenu.id = Item[index].id;
                    }
                    else {
                        contextMenu.id = "contextMenu" + guid();
                    }

                    contextMenu.className = "vizwide_3d_contextmenu";
    
                    divContext.element.appendChild(contextMenu);
    
                    // contextMenu div element 추가
                    Item[index].element = contextMenu;
                    scope.Element.set(Item[index].id, Item[index]);
    
                    // contextMenuText div 생성
                    let contextMenuText = document.createElement('div');
                    contextMenuText.textContent = Item[index].text;
                    contextMenuText.className = "vizwide_3d_contextmenu_text";
                    contextMenu.appendChild(contextMenuText);

                    // contextMenuButton div 생성
                    let contextMenuButton = document.createElement('div');
                    contextMenuButton.className = "vizwide_3d_contextmenu_button vizwide3D_Contextmenu_icon";
                    contextMenu.appendChild(contextMenuButton);

                    // contextMenuButton over
                    contextMenu.addEventListener('mouseover', function () {
                        divChildContext.style.display = 'block';
                    });

                    // contextMenuButton out
                    contextMenu.addEventListener('mouseout', function () {
                        divChildContext.style.display = 'none';
                    });

                    // divChildContext div element 추가
                    let divChildContext = document.createElement('div');
                    divChildContext.id = "divChildContext" + guid();
                    divChildContext.className = "vizwide_3d_divChildContext";

                    view.addEventListener('contextmenu', function(e){
                        e.preventDefault();
                        let divContextMenu = divContext.element.getBoundingClientRect();
                        let viewSize = view.getBoundingClientRect();
                        if (viewSize.right < divContextMenu.right + divContextMenu.width) {
                            divChildContext.className = "vizwide_3d_divChildContext_out";
                        } else {
                            divChildContext.className = "vizwide_3d_divChildContext";
                        }
                    });

                    contextMenu.appendChild(divChildContext);

                    for (let i = 0; i < Item[index].subContextMenu.length; i++) {
                        // childContextMenu div 생성
                        let childContextMenu = document.createElement('div');
                        if (Item[index].subContextMenu[i].id !== undefined) {
                            childContextMenu.id = Item[index].subContextMenu[i].id;
                        }
                        else {
                            childContextMenu.id = "childcontextMenu" + guid();
                        }
                        childContextMenu.className = "vizwide_3d_child_contextmenu";

                        divChildContext.appendChild(childContextMenu);

                        Item[index].subContextMenu[i].element = childContextMenu;
                        scope.Element.set(Item[index].subContextMenu[i].id, Item[index].subContextMenu[i]);

                        // childContextMenuText div 생성
                        let childContextMenuText = document.createElement('div');
                        childContextMenuText.textContent = Item[index].subContextMenu[i].text;
                        childContextMenuText.className = "vizwide_3d_child_contextmenu_text";
                        childContextMenu.appendChild(childContextMenuText);

                        // childContextMenu callback
                        if(Item[index].subContextMenu[i].callback !== undefined){
                            childContextMenu.addEventListener('click', function(){
                                Item[index].subContextMenu[i].callback();
                            });
                        }
                    }

                    let last = scope.Element.get(Item[index].subContextMenu[Item[index].subContextMenu.length - 1].id);
                    last.element.style.height = "29.5px";
                    last.element.style.borderBottom = "1px solid rgba(54, 175, 184, 1)";
                }
            }
        }

        /**
        * ContextMenu 생성
        * @param {Array} Item : ContextMenu object
        * @example 
        * let createContextMenu = new vizwide3d.ContextMenu(view, vizwide3d);
        * let subcallback = function()
        * {
        *     // 서브 메뉴 콜백 함수
        * };
        *
        * let subcontextmenu = createContextMenu.GetContextMenuObj();
        * subcontextmenu.id = "subcontextmenu";
        * subcontextmenu.callback = subcallback;
        * subcontextmenu.text = "Sub";
        *
        * let callback = function()
        * {
        *     // 메뉴 콜백 함수
        * };
        * let contextmenu = createContextMenu.GetContextMenuObj();
        * contextmenu.id = "contextmenu";
        * contextmenu.subContextMenu = [subcontextmenu];
        * contextmenu.callback = callback;
        * contextmenu.text = "Main";
        *
        * createContextMenu.AddContextMenu([contextmenu]);
        */
        this.AddContextMenu = function(Item){
            addContextMenu(Item);
        };
    }

    /**
    * ContextMenu object
    * @param {String} id : contextmenu id
    * @param {Object} callback : contextmenu callback
    * @param {Array} subButton : contextmenu sub
    * @example 
    * let callback = function()
    * {
    *    // 메뉴 콜백 함수
    * };
    * let contextmenu = createContextMenu.GetContextMenuObj();
    * contextmenu.id = "contextmenu";
    * contextmenu.callback = callback;
    * contextmenu.text = "Main";
    * createContextMenu.AddContextMenu([contextmenu]);
    */
    GetContextMenuObj() {
        let contextMenu = {
            id: undefined,
            text: undefined,
            checked: false,
            callback: undefined,
            subContextMenu: [],
            element: undefined
        };
        return contextMenu;
    }; 


    /**
    * ContextMenu 보이기/숨기기
    * @param {String} id : ContextMenu id
    * @param {Boolean} show : ContextMenu show
    * @example 
    * let createContextMenu = new vizwide3d.ContextMenu(view, vizwide3d);
    * let subcallback = function()
    * {
    *     // 서브 메뉴 콜백 함수
    * };
    *
    * let subcontextmenu = createContextMenu.GetContextMenuObj();
    * subcontextmenu.id = "subcontextmenu";
    * subcontextmenu.callback = subcallback;
    * subcontextmenu.text = "Sub";
    *
    * let callback = function()
    * {
    *     // 메뉴 콜백 함수
    * };
    * let contextmenu = createContextMenu.GetContextMenuObj();
    * contextmenu.id = "contextmenu";
    * contextmenu.subContextMenu = [subcontextmenu];
    * contextmenu.callback = callback;
    * contextmenu.text = "Main";
    *
    * createContextMenu.AddContextMenu([contextmenu]);
    * 
    * createContextMenu.ShowContextMenu("contextmenu", false);
    */
    ShowContextMenu(id, show){
        let contextmenu = this.Element.get(id).element;

        if(show === true){
            contextmenu.style.display = "block";
        } else {
            contextmenu.style.display = "none";
        }
    };
}
export default ContextMenu;