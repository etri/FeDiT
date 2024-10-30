
function getMenuKeyFromString(value:string|null|undefined) {
    if(!value)
        return null;
    let topmenuKey = Object.keys(MENU_DATA).find(data => MENU_DATA[data as keyof typeof MENU_DATA].key === value);
    return MENU_DATA[topmenuKey as keyof typeof MENU_DATA]?.key;
}

class Menu {
    data: MENU_DATA_TYPE;
    level: number | null;
    children: Menu[];

    constructor(data: MENU_DATA_TYPE) {
        this.data = data;
        this.level = null;
        this.children = [];
    }

    setRootMenu() {
        this.level = 0;
    }

    add(child: Menu) {
        child.increaseLevel(this);
        this.children.push(child);
    }

    private increaseLevel(parent: Menu) {
        if(null===parent.level)
            throw new Error("parent level is null.");

        this.level = parent.level+1;
    }

    log(indent: string) {
        console.log(`${indent}data: '${this.data}'`);
        this.children.forEach(element => element.log(indent + "  "));
    }
}

class MenuData {
    root: Menu;
    currentMenu: { level: number, menu: Menu }[];
    constructor() {
        this.root = new Menu(MENU_DATA.ROOT);
        this.root.setRootMenu();
        this.currentMenu = [];
    }

    addMenu(menu: Menu) {
        this.root.add(menu);
    }

    addMenuRoot(data: MENU_DATA_TYPE) {
        let menu = new Menu(data);
        this.root.add(menu);
    }

    addMenuChild(parentData: MENU_DATA_TYPE, data: MENU_DATA_TYPE) {
        let menuStack = this.findMenuStackWithRoot(parentData.key);
        if (menuStack.length === 0) {
            throw new Error("error no parent menu.");
        }

        let parent = menuStack.at(menuStack.length - 1);
        if (!parent) {
            throw new Error("error invalid parent menu.");
        }

        let menu = new Menu(data);
        parent.add(menu);
    }

    findMenuStack(key: string | null) {
        let menuStack: Menu[] = [];

        if(!key)
            return menuStack;

        this.getMenuStack(menuStack, this.root, key);

        menuStack.shift();

        return menuStack;
    }

    findTopMenu(key: string | null) {
        let menuStack: Menu[] = [];

        if(!key)
            return null;

        this.getMenuStack(menuStack, this.root, key);

        menuStack.shift();

        if(menuStack.length>0)
            return menuStack.at(0);

        return null;
    }

    findAllTopMenu() {
        let menuArray: Menu[] = [];

        this.getMenuWithLevel(menuArray, this.root, 1);

        return menuArray;
    }

    private findMenuStackWithRoot(key: string) {
        let menuStack: Menu[] = [];

        this.getMenuStack(menuStack, this.root, key);

        return menuStack;
    }

    private getMenuWithLevel(menuArray: Menu[], menu: Menu, level: number) {
        if (menu.level === level) {
            menuArray.push(menu);
            return true;
        }

        if (!menu.hasOwnProperty("children"))
            return false;

        for (const child of menu.children) {
            this.getMenuWithLevel(menuArray, child, level);
        }
    }

    private getMenuStack(menuStack: Menu[], menu: Menu, key: string) {
        if (menu.data.key === key) {
            menuStack.push(menu);
            return true;
        }

        if (!menu.hasOwnProperty("children"))
            return false;

        menuStack.push(menu);

        for (const child of menu.children) {
            if (this.getMenuStack(menuStack, child, key)) {
                return true;
            }
        }

        menuStack.pop();
    }

    log() {
        this.root.log("");
    }
}

const MENU_DATA = {
    ROOT: {
        key: 'root',
        name: 'root',
        path: null
    },
    FIND_DATA: {
        key: 'find-data',
        name: '데이터찾기',
        path: 'find-data.mng'
    },
    DATA_DETAIL: {
        key: 'detail',
        name: '상세데이터',
        path: 'detail.mng'
    },
    USER_GUIDE: {
        key: 'user-guide',
        name: '이용안내',
        path: 'user-guide.mng'
    },

    MY_DATA_USE: {
        key: 'my-data-use',
        name: '데이터 활용',
        path: null
    },
    MY_DATE_USE_REQUEST_LIST: {
        key: 'my-data-use-request-list',
        name: '활용신청 현황',
        path: '/public/user/dataUseRequestList.mng?mypagekey=my-data-use-request-list'
    },
    MY_REST_KEY_LIST: {
        key: 'my-restkey-list',
        name: '인증키 발급현황',
        path: '/public/user/restKeyList.mng?mypagekey=my-restkey-list'
    },

    MY_DATA_REGIST: {
        key: 'my-data-regist',
        name: '데이터 등록',
        path: null
    },
    MY_DATA_REGIST_LIST: {
        key: 'my-data-regist-list',
        name: '등록신청 현황',
        path: '/public/user/dataRegistList.mng?mypagekey=my-data-regist-list'
    },

    MY_INFO: {
        key: 'my-info',
        name: '회원정보',
        path: null
    },
    MY_INFO_MODIFY: {
        key: 'my-info-modify',
        name: '회원정보 수정',
        path: '/public/user/mypage.mng?mypagekey=my-info-modify'
    },
} as const;

type MENU_DATA_TYPE = typeof MENU_DATA[keyof typeof MENU_DATA];

const topMenuData = new MenuData();
try {
    topMenuData.addMenuRoot(MENU_DATA.FIND_DATA);
    topMenuData.addMenuChild(MENU_DATA.FIND_DATA, MENU_DATA.DATA_DETAIL);
    topMenuData.addMenuRoot(MENU_DATA.USER_GUIDE);
}catch(e:any){
    console.log(e.message);
}

const myPageMenuData = new MenuData();
try {
    myPageMenuData.addMenuRoot(MENU_DATA.MY_DATA_USE);
    myPageMenuData.addMenuChild(MENU_DATA.MY_DATA_USE, MENU_DATA.MY_DATE_USE_REQUEST_LIST);
    myPageMenuData.addMenuChild(MENU_DATA.MY_DATA_USE, MENU_DATA.MY_REST_KEY_LIST);
    myPageMenuData.addMenuRoot(MENU_DATA.MY_DATA_REGIST);
    myPageMenuData.addMenuChild(MENU_DATA.MY_DATA_REGIST, MENU_DATA.MY_DATA_REGIST_LIST);
    myPageMenuData.addMenuRoot(MENU_DATA.MY_INFO);
    myPageMenuData.addMenuChild(MENU_DATA.MY_INFO, MENU_DATA.MY_INFO_MODIFY);
}catch(e:any){
    console.log(e.message);
}

export { Menu, topMenuData, myPageMenuData, MENU_DATA, MENU_DATA_TYPE, getMenuKeyFromString };